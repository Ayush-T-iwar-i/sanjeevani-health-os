import { getNearestFacility, markAmbulanceNotified, markHospitalNotified } from './sos.service';
import { sendSMS } from '../notifications/notification.service';
import { query } from '../../config/db';
import { logger } from '../../config/logger';

const AMBULANCE_DISPATCH_NUMBER = process.env.AMBULANCE_DISPATCH_NUMBER || '108';

export async function escalateSOS(alertId: string, patientId: string, gpsLat: number, gpsLng: number): Promise<void> {
  const mapsLink = `https://maps.google.com/?q=${gpsLat},${gpsLng}`;

  try {
    await sendSMS(
      AMBULANCE_DISPATCH_NUMBER,
      `SOS from Sanjeevani Health OS. Patient location: ${mapsLink}. Please dispatch ambulance immediately.`
    );
    await markAmbulanceNotified(alertId);
  } catch (err) {
    logger.error('SOS: failed to notify ambulance dispatch', { alertId, err: (err as Error).message });
  }

  try {
    const facility = await getNearestFacility(gpsLat, gpsLng) as { facility_id: string; contact_info?: { phone?: string } } | null;
    if (facility?.contact_info?.phone) {
      await sendSMS(
        facility.contact_info.phone,
        `Incoming SOS emergency near your facility. Patient location: ${mapsLink}. Please prepare to receive the patient.`
      );
    }
    if (facility) {
      await markHospitalNotified(alertId);
    }
  } catch (err) {
    logger.error('SOS: failed to notify nearest facility', { alertId, err: (err as Error).message });
  }

  try {
    const { rows } = await query<{ phone: string }>(
      `SELECT u.phone FROM patients p
       JOIN users u ON u.user_id = p.assigned_asha_id
       WHERE p.patient_id = $1`,
      [patientId]
    );
    if (rows[0]?.phone) {
      await sendSMS(
        rows[0].phone,
        `Your patient has triggered an SOS alert. Location: ${mapsLink}. Please follow up as soon as possible.`
      );
    }
  } catch (err) {
    logger.warn('SOS: could not notify assigned ASHA/ANM worker', { alertId, err: (err as Error).message });
  }
}