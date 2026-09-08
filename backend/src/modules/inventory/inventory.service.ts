import { query } from '../../config/db';
import { emitEvent } from '../../events/eventBus';
import { AdjustStockInput, InventoryItem, LOW_STOCK_THRESHOLD, UpsertInventoryInput } from './inventory.model';

export async function listInventory(facilityId: string, itemType?: string): Promise<InventoryItem[]> {
  const params: any[] = [facilityId];
  let typeClause = '';
  if (itemType) {
    params.push(itemType);
    typeClause = `AND item_type = $${params.length}`;
  }
  const { rows } = await query<InventoryItem>(
    `SELECT * FROM facility_inventory WHERE facility_id = $1 ${typeClause} ORDER BY item_name ASC`,
    params
  );
  return rows;
}

export async function upsertInventoryItem(input: UpsertInventoryInput & { itemType?: string }): Promise<InventoryItem> {
  const { facilityId, itemCode, itemName, batchNumber, quantityAvailable, expiryDate, itemType = 'medicine' } = input;

  const { rows } = await query<InventoryItem>(
    `INSERT INTO facility_inventory
       (inventory_id, facility_id, item_code, item_name, batch_number, quantity_available, expiry_date, item_type, updated_at)
     VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, NOW())
     ON CONFLICT (facility_id, item_code, COALESCE(batch_number, ''))
     DO UPDATE SET
       item_name = EXCLUDED.item_name,
       quantity_available = facility_inventory.quantity_available + EXCLUDED.quantity_available,
       expiry_date = EXCLUDED.expiry_date,
       item_type = EXCLUDED.item_type,
       updated_at = NOW()
     RETURNING *`,
    [facilityId, itemCode, itemName, batchNumber ?? null, quantityAvailable, expiryDate ?? null, itemType]
  );

  const item = rows[0];
  await checkLowStock(item);
  return item;
}

export async function adjustStock(input: AdjustStockInput): Promise<InventoryItem | null> {
  const { inventoryId, delta } = input;

  const { rows } = await query<InventoryItem>(
    `UPDATE facility_inventory
     SET quantity_available = GREATEST(quantity_available + $1, 0), updated_at = NOW()
     WHERE inventory_id = $2
     RETURNING *`,
    [delta, inventoryId]
  );

  const item = rows[0] ?? null;
  if (item) await checkLowStock(item);
  return item;
}

async function checkLowStock(item: InventoryItem): Promise<void> {
  if (item.quantity_available <= LOW_STOCK_THRESHOLD) {
    emitEvent('inventory_low_alert', {
      facilityId: item.facility_id,
      inventoryId: item.inventory_id,
      itemName: item.item_name,
      quantityAvailable: item.quantity_available,
    });
  }
}

export async function searchMedicines(facilityId: string, query_?: string): Promise<InventoryItem[]> {
  const params: any[] = [facilityId, 'medicine'];
  let searchClause = '';
  if (query_) {
    params.push(`%${query_}%`);
    searchClause = `AND item_name ILIKE $${params.length}`;
  }
  const { rows } = await query<InventoryItem>(
    `SELECT * FROM facility_inventory WHERE facility_id = $1 AND item_type = $2 ${searchClause} ORDER BY item_name ASC`,
    params
  );
  return rows;
}

/**
 * Diagnostic test booking (Problem 3). Reuses the encounter created at triage
 * time and marks a diagnostic test as requested against a facility's available
 * diagnostic-test inventory (e.g. "X-Ray slot", "USG slot", "CBC kit").
 */
export async function requestDiagnostic(params: { encounterId: string; facilityId: string; testItemCode: string }) {
  const { encounterId, facilityId, testItemCode } = params;

  const { rows: testRows } = await query<InventoryItem>(
    `SELECT * FROM facility_inventory WHERE facility_id = $1 AND item_code = $2 AND item_type = 'diagnostic_test'`,
    [facilityId, testItemCode]
  );
  const test = testRows[0];
  if (!test || test.quantity_available <= 0) {
    throw new Error('Diagnostic test slot unavailable at this facility');
  }

  await adjustStock({ inventoryId: test.inventory_id, delta: -1 });

  await query(
    `UPDATE encounters SET diagnostic_status = 'requested' WHERE encounter_id = $1`,
    [encounterId]
  );

  return { encounterId, testItemCode, status: 'requested' };
}

/** Tele-pathology: attach a report/image URL (uploaded to S3/MinIO client-side) to the encounter. */
export async function attachDiagnosticReport(encounterId: string, reportUrl: string) {
  const { rows } = await query(
    `UPDATE encounters SET diagnostic_report_url = $1, diagnostic_status = 'reported' WHERE encounter_id = $2 RETURNING encounter_id, diagnostic_report_url, diagnostic_status`,
    [reportUrl, encounterId]
  );
  return rows[0] ?? null;
}
