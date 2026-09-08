import { onEvent } from '../eventBus';
import { logger } from '../../config/logger';

/**
 * Reacts to 'high_risk_patient_alert' (fired from followup.service.ts's
 * sweepMissedFollowups, and can also be triggered from triage.service.ts
 * for RED-category cases). Already forwarded to the patient's assigned
 * facility dashboard via events/socket.ts. This hook hangs the eventual
 * ASHA/ANM SMS notification off the same event (Phase 5).
 */
export function registerHighRiskHandler(): void {
  onEvent('high_risk_patient_alert', (payload: unknown) => {
    const data = payload as { patientId: string; reason: string };
    logger.warn(`High-risk patient alert: ${data.patientId} — ${data.reason}`);
    // TODO(Phase 5): call notification.service.ts to SMS assigned ASHA/ANM worker
  });
}
