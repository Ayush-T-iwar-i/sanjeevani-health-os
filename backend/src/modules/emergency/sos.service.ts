import { query } from '../../config/db';
import { emitEvent } from '../../events/eventBus';
import { escalateSOS } from './escalationChain.service';

export interface SosAlert {
  alert_id: string;
  patient_id: string;
  gps_lat: number;
  gps_lng: number;
  status: string;
  triggered_at: string;
  ambulance_notified_at: string | null;
  hospital_notified_at: string | null;
}

export async function triggerSOS(patientId: string, gpsLat: number, gpsLng: number): Promise<SosAlert> {
  const { rows } = await query<SosAlert>(
    `INSERT INTO sos_alerts (alert_id, patient_id, gps_lat, gps_lng, status, triggered_at)
     VALUES (uuid_generate_v4(), $1, $2, $3, 'active', NOW())
     RETURNING *`,
    [patientId, gpsLat, gpsLng]
  );
  const alert = rows[0];

  emitEvent('sos_alert_broadcast', {
    alertId: alert.alert_id,
    patientId,
    gpsLat,
    gpsLng,
    status: 'active',
  });

  void escalateSOS(alert.alert_id, patientId, gpsLat, gpsLng);

  return alert;
}

export async function getNearestFacility(gpsLat: number, gpsLng: number) {
  const { rows } = await query(
    `SELECT facility_id, name, type, contact_info,
            ST_Distance(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distance_meters
     FROM health_facilities
     ORDER BY location <-> ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
     LIMIT 1`,
    [gpsLng, gpsLat]
  );
  return rows[0] ?? null;
}

export async function markAmbulanceNotified(alertId: string): Promise<void> {
  await query(`UPDATE sos_alerts SET ambulance_notified_at = NOW() WHERE alert_id = $1`, [alertId]);
}

export async function markHospitalNotified(alertId: string): Promise<void> {
  await query(`UPDATE sos_alerts SET hospital_notified_at = NOW() WHERE alert_id = $1`, [alertId]);
}

export async function resolveSOS(alertId: string): Promise<SosAlert | null> {
  const { rows } = await query<SosAlert>(
    `UPDATE sos_alerts SET status = 'resolved' WHERE alert_id = $1 RETURNING *`,
    [alertId]
  );
  const alert = rows[0] ?? null;
  if (alert) {
    emitEvent('sos_alert_broadcast', { alertId: alert.alert_id, status: 'resolved' });
  }
  return alert;
}

export async function getSOSStatus(alertId: string): Promise<SosAlert | null> {
  const { rows } = await query<SosAlert>(`SELECT * FROM sos_alerts WHERE alert_id = $1`, [alertId]);
  return rows[0] ?? null;
}