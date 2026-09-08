import { Request, Response } from 'express';
import * as inventoryService from './inventory.service';

export async function getMedicines(req: Request, res: Response) {
  try {
    const facilityId = req.query.facility_id as string;
    if (!facilityId) return res.status(400).json({ error: 'facility_id query param is required' });
    const query_ = req.query.query as string | undefined;
    const items = await inventoryService.searchMedicines(facilityId, query_);
    return res.status(200).json({ items });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch medicines', detail: (err as Error).message });
  }
}

export async function getInventory(req: Request, res: Response) {
  const items = await inventoryService.listInventory(req.params.facilityId, req.query.type as string | undefined);
  return res.status(200).json({ items });
}

export async function postUpsert(req: Request, res: Response) {
  try {
    const { facilityId, itemCode, itemName, batchNumber, quantityAvailable, expiryDate, itemType } = req.body;
    if (!facilityId || !itemCode || !itemName || quantityAvailable === undefined) {
      return res.status(400).json({ error: 'facilityId, itemCode, itemName, and quantityAvailable are required' });
    }
    const item = await inventoryService.upsertInventoryItem({
      facilityId,
      itemCode,
      itemName,
      batchNumber,
      quantityAvailable,
      expiryDate,
      itemType,
    });
    return res.status(201).json(item);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to upsert inventory item', detail: (err as Error).message });
  }
}

export async function postAdjust(req: Request, res: Response) {
  try {
    const { delta } = req.body;
    if (typeof delta !== 'number') return res.status(400).json({ error: 'delta (number) is required' });
    const item = await inventoryService.adjustStock({ inventoryId: req.params.id, delta });
    if (!item) return res.status(404).json({ error: 'Inventory item not found' });
    return res.status(200).json(item);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to adjust stock', detail: (err as Error).message });
  }
}

export async function postRequestDiagnostic(req: Request, res: Response) {
  try {
    const { encounterId, facilityId, testItemCode } = req.body;
    if (!encounterId || !facilityId || !testItemCode) {
      return res.status(400).json({ error: 'encounterId, facilityId, and testItemCode are required' });
    }
    const result = await inventoryService.requestDiagnostic({ encounterId, facilityId, testItemCode });
    return res.status(201).json(result);
  } catch (err) {
    return res.status(400).json({ error: (err as Error).message });
  }
}

export async function postAttachReport(req: Request, res: Response) {
  try {
    const { reportUrl } = req.body;
    if (!reportUrl) return res.status(400).json({ error: 'reportUrl is required' });
    const result = await inventoryService.attachDiagnosticReport(req.params.encounterId, reportUrl);
    if (!result) return res.status(404).json({ error: 'Encounter not found' });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to attach report', detail: (err as Error).message });
  }
}
