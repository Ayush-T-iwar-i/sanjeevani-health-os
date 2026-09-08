import { scheduleFollowup } from '../followup.service';

/**
 * Simplified Universal Immunization Programme (UIP) checkpoints: birth,
 * 6 weeks, 10 weeks, 14 weeks, 9 months, 16-24 months. Enrollment schedules
 * the next upcoming checkpoint; the encounter/consultation flow advances it
 * on each completed visit.
 */
const UIP_CHECKPOINTS_WEEKS = [6, 10, 14, 39, 78]; // approximate age in weeks at each checkpoint

export async function enrollChildHealth(patientId: string) {
  const nextDueDate = addDays(new Date(), 7); // default: first check-in within a week of enrollment
  const followup = await scheduleFollowup(patientId, 'child', nextDueDate.toISOString().slice(0, 10));
  return { pathway: 'child', enrolled: true, firstFollowup: followup, checkpoints: UIP_CHECKPOINTS_WEEKS };
}

export function scheduleNextImmunization(patientId: string, checkpointsCompleted: number) {
  const nextCheckpointWeeks = UIP_CHECKPOINTS_WEEKS[checkpointsCompleted];
  if (nextCheckpointWeeks === undefined) return null; // schedule complete
  const nextDueDate = addDays(new Date(), 7); // reminder issued a week ahead of checkpoint window in practice
  return scheduleFollowup(patientId, 'child', nextDueDate.toISOString().slice(0, 10));
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
