import { onEvent } from '../eventBus';
import { logger } from '../../config/logger';
import { notifyFacilityStaff } from '../../modules/notifications/notification.service';

export function registerStockDepletedHandler(): void {
  onEvent('inventory_low_alert', (payload: unknown) => {
    const data = payload as { facilityId: string; itemName: string; quantityAvailable: number };
    logger.warn(`Low stock alert: ${data.itemName} at facility ${data.facilityId} (qty: ${data.quantityAvailable})`);
    void notifyFacilityStaff(
      data.facilityId,
      `Low stock alert: ${data.itemName} has only ${data.quantityAvailable} units left. Please restock soon.`
    );
  });
}