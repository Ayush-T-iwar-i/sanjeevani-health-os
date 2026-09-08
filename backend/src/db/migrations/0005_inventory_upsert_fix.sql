-- Fix: upsertInventoryItem() was written to ON CONFLICT on inventory_id,
-- but inventory_id is a freshly generated uuid on every insert, so the
-- conflict clause could never fire. Restocking the same item/batch created
-- duplicate rows instead of updating quantity. Add the real natural key so
-- ON CONFLICT can target it.
CREATE UNIQUE INDEX IF NOT EXISTS uq_facility_inventory_item_batch
  ON facility_inventory (facility_id, item_code, COALESCE(batch_number, ''));
