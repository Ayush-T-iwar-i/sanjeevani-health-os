export interface InventoryItem {
  inventory_id: string;
  facility_id: string;
  item_code: string;
  item_name: string;
  batch_number: string | null;
  quantity_available: number;
  expiry_date: string | null;
  updated_at: string;
}

export interface UpsertInventoryInput {
  facilityId: string;
  itemCode: string;
  itemName: string;
  batchNumber?: string;
  quantityAvailable: number;
  expiryDate?: string;
}

export interface AdjustStockInput {
  inventoryId: string;
  delta: number; // positive to restock, negative to consume
}

// Below this quantity, an inventory_low_alert event fires (Problem 3, 7)
export const LOW_STOCK_THRESHOLD = 10;
