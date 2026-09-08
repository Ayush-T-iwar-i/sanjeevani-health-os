import { onEvent } from '../eventBus';
import { logger } from '../../config/logger';

/**
 * Reacts to 'inventory_low_alert' events (fired from inventory.service.ts).
 * The event is already forwarded to the facility's dashboard room via
 * events/socket.ts -> broadcastEvent(). This handler additionally logs it
 * and is the hook point for SMS/push notification integration (Phase 4/5
 * notification.service.ts).
 */
export function registerStockDepletedHandler(): void {
  onEvent('inventory_low_alert', (payload: unknown) => {
    const data = payload as { facilityId: string; itemName: string; quantityAvailable: number };
    logger.warn(`Low stock alert: ${data.itemName} at facility ${data.facilityId} (qty: ${data.quantityAvailable})`);
    // TODO(Phase 5): call notification.service.ts to SMS the facility admin/pharmacist
  });
}
