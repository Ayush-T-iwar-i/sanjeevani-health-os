import { scheduleFollowup } from '../followup.service';

/**
 * Standard Govt-of-India ANC (antenatal care) schedule: visits at roughly
 * 4, 12, 20, 28, 32, 36 weeks, plus a postnatal check at 6 weeks post-delivery.
 * This creates the first upcoming ANC visit; subsequent visits get scheduled
 * automatically each time the current one is marked completed (chain pattern),
 * which the consultation/encounter flow should call.
 */
export async function enrollMaternalCare(patientId: string) {
  const nextDueDate = addDays(new Date(), 14); // first ANC check-in within 2 weeks of enrollment
  const followup = await scheduleFollowup(patientId, 'maternal', nextDueDate.toISOString().slice(0, 10));
  return { pathway: 'maternal', enrolled: true, firstFollowup: followup };
}

export function scheduleNextAncVisit(patientId: string, visitsCompleted: number) {
  const intervalsWeeks = [8, 8, 8, 4, 4, 6]; // gaps between the 7 standard visits, in weeks
  const weeksUntilNext = intervalsWeeks[visitsCompleted] ?? 6;
  const nextDueDate = addDays(new Date(), weeksUntilNext * 7);
  return scheduleFollowup(patientId, 'maternal', nextDueDate.toISOString().slice(0, 10));
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
