import { query } from '../../config/db';

export async function getFacilitySummary(facilityId: string) {
  const [triageCounts, referralStats, avgWait, inventoryLow, sosCount, followupStats] = await Promise.all([
    query<{ triage_category: string; count: string }>(
      `SELECT triage_category, COUNT(*) as count
       FROM encounters WHERE facility_id = $1 AND created_at > NOW() - INTERVAL '30 days'
       GROUP BY triage_category`,
      [facilityId]
    ),
    query<{ status: string; count: string }>(
      `SELECT status, COUNT(*) as count
       FROM referrals WHERE target_facility_id = $1 AND created_at > NOW() - INTERVAL '30 days'
       GROUP BY status`,
      [facilityId]
    ),
    query<{ avg_wait: string }>(
      `SELECT AVG(estimated_wait_time_minutes) as avg_wait
       FROM appointments WHERE facility_id = $1 AND created_at > NOW() - INTERVAL '7 days'`,
      [facilityId]
    ),
    query<{ count: string }>(
      `SELECT COUNT(*) as count FROM facility_inventory WHERE facility_id = $1 AND quantity_available <= 10`,
      [facilityId]
    ),
    query<{ count: string }>(
      `SELECT COUNT(*) as count FROM sos_alerts sa
       JOIN patients p ON p.patient_id = sa.patient_id
       JOIN users u ON u.user_id = p.user_id
       WHERE u.facility_id = $1 AND sa.triggered_at > NOW() - INTERVAL '30 days'`,
      [facilityId]
    ),
    query<{ status: string; count: string }>(
      `SELECT f.status, COUNT(*) as count
       FROM followups f
       JOIN patients p ON p.patient_id = f.patient_id
       JOIN users u ON u.user_id = p.user_id
       WHERE u.facility_id = $1
       GROUP BY f.status`,
      [facilityId]
    ),
  ]);

  return {
    triageBreakdown: Object.fromEntries(triageCounts.rows.map((r) => [r.triage_category ?? 'unknown', Number(r.count)])),
    referralBreakdown: Object.fromEntries(referralStats.rows.map((r) => [r.status, Number(r.count)])),
    avgWaitMinutes: avgWait.rows[0]?.avg_wait ? Math.round(Number(avgWait.rows[0].avg_wait)) : 0,
    lowStockItemCount: Number(inventoryLow.rows[0]?.count ?? 0),
    sosAlertsLast30Days: Number(sosCount.rows[0]?.count ?? 0),
    followupBreakdown: Object.fromEntries(followupStats.rows.map((r) => [r.status, Number(r.count)])),
  };
}