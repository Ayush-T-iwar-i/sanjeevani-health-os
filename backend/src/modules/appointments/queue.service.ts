import { redis } from '../../config/redis';
import { query } from '../../config/db';
import { FacilityRecommendation } from './appointment.model';

const AVG_CONSULT_MINUTES = 12;
const QUEUE_KEY_PREFIX = 'queue:facility:';

function queueKey(facilityId: string): string {
  return `${QUEUE_KEY_PREFIX}${facilityId}`;
}

export async function addToQueue(
  facilityId: string,
  appointmentId: string,
  triagePriority: number,
  scheduledTimestamp: number
): Promise<number> {
  const key = queueKey(facilityId);
  const score = triagePriority * 1e12 + scheduledTimestamp;
  await redis.zadd(key, score, appointmentId);
  const position = await redis.zrank(key, appointmentId);
  return (position ?? 0) + 1;
}

export async function getQueuePosition(facilityId: string, appointmentId: string): Promise<number | null> {
  const rank = await redis.zrank(queueKey(facilityId), appointmentId);
  return rank === null ? null : rank + 1;
}

export async function removeFromQueue(facilityId: string, appointmentId: string): Promise<void> {
  await redis.zrem(queueKey(facilityId), appointmentId);
}

export async function getQueueSize(facilityId: string): Promise<number> {
  return redis.zcard(queueKey(facilityId));
}

export function estimateWaitMinutes(queuePosition: number, activeDoctors = 1): number {
  return Math.max(0, Math.ceil((queuePosition - 1) * AVG_CONSULT_MINUTES / activeDoctors));
}

export async function recommendFacility(
  patientLat: number,
  patientLng: number,
  triageCategory: 'RED' | 'AMBER' | 'GREEN' = 'GREEN',
  preferTeleconsult = false
): Promise<FacilityRecommendation[]> {
  const radiusKm = triageCategory === 'RED' ? 100 : triageCategory === 'AMBER' ? 50 : 30;

  const result = await query<{
    facility_id: string;
    name: string;
    type: string;
    distance_km: number;
    services_offered: string[];
  }>(
    `SELECT f.facility_id, f.name, f.type,
            ST_Distance(f.location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography) / 1000 AS distance_km,
            f.services_offered
     FROM health_facilities f
     WHERE f.location IS NOT NULL
       AND ST_DWithin(f.location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography, $3 * 1000)
     ORDER BY distance_km ASC
     LIMIT 10`,
    [patientLat, patientLng, radiusKm]
  );

  const recommendations: FacilityRecommendation[] = [];

  for (const row of result.rows) {
    const queueSize = await getQueueSize(row.facility_id);
    const hasTeleconsult = (row.services_offered ?? []).includes('teleconsult') ||
      (row.services_offered ?? []).includes('consultation');
    const waitMinutes = estimateWaitMinutes(queueSize + 1);

    let score = 100 - row.distance_km * 2 - waitMinutes * 0.5;
    if (preferTeleconsult && hasTeleconsult) score += 20;
    if (triageCategory === 'RED') score -= waitMinutes;

    recommendations.push({
      facilityId: row.facility_id,
      name: row.name,
      type: row.type,
      distanceKm: Math.round(row.distance_km * 10) / 10,
      estimatedWaitMinutes: waitMinutes,
      hasTeleconsult,
      score: Math.round(score * 10) / 10,
    });
  }

  return recommendations.sort((a, b) => b.score - a.score);
}

export async function getActiveDoctorCount(facilityId: string): Promise<number> {
  const result = await query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM users WHERE facility_id = $1 AND role = 'doctor'`,
    [facilityId]
  );
  return Math.max(1, parseInt(result.rows[0]?.count ?? '1', 10));
}
