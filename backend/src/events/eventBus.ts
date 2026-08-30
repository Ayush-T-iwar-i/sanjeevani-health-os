import { EventEmitter } from 'events';
import { logger } from '../config/logger';

export type AppEvent =
  | 'appointment_updated'
  | 'consultation_call_incoming'
  | 'referral_status_changed'
  | 'inventory_low_alert'
  | 'high_risk_patient_alert'
  | 'sos_alert_broadcast';

const bus = new EventEmitter();
bus.setMaxListeners(50);

type EventHandler = (payload: unknown) => void;

const socketForwarders = new Map<AppEvent, EventHandler>();

export function emitEvent(event: AppEvent, payload: unknown): void {
  logger.debug(`Event emitted: ${event}`, payload);
  bus.emit(event, payload);
}

export function onEvent(event: AppEvent, handler: EventHandler): void {
  bus.on(event, handler);
}

export function registerSocketForwarder(
  event: AppEvent,
  forward: (payload: unknown) => void
): void {
  socketForwarders.set(event, forward);
  onEvent(event, forward);
}

export function initSocketForwarders(forward: (event: AppEvent, payload: unknown) => void): void {
  const events: AppEvent[] = [
    'appointment_updated',
    'consultation_call_incoming',
    'referral_status_changed',
    'inventory_low_alert',
    'high_risk_patient_alert',
    'sos_alert_broadcast',
  ];

  for (const event of events) {
    registerSocketForwarder(event, (payload) => forward(event, payload));
  }
}
