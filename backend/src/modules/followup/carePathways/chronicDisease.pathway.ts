import { scheduleFollowup } from '../followup.service';

export type ChronicCondition = 'diabetes' | 'hypertension' | 'other';

// Recommended recurring check-in interval per condition, in days
const CHECKIN_INTERVAL_DAYS: Record<ChronicCondition, number> = {
  diabetes: 30,
  hypertension: 30,
  other: 45,
};

export async function enrollChronicDisease(patientId: string, condition: ChronicCondition = 'other') {
  const intervalDays = CHECKIN_INTERVAL_DAYS[condition] ?? 45;
  const nextDueDate = addDays(new Date(), intervalDays);
  const followup = await scheduleFollowup(patientId, 'chronic', nextDueDate.toISOString().slice(0, 10));
  return { pathway: 'chronic', condition, enrolled: true, intervalDays, firstFollowup: followup };
}

export function scheduleNextChronicCheckin(patientId: string, condition: ChronicCondition = 'other') {
  const intervalDays = CHECKIN_INTERVAL_DAYS[condition] ?? 45;
  const nextDueDate = addDays(new Date(), intervalDays);
  return scheduleFollowup(patientId, 'chronic', nextDueDate.toISOString().slice(0, 10));
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
