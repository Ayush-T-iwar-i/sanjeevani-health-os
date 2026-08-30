export interface Appointment {
  appointment_id: string;
  patient_id: string;
  provider_id: string | null;
  facility_id: string;
  scheduled_time: string;
  queue_position: number | null;
  estimated_wait_time_minutes: number | null;
  triage_priority: number;
  status: string;
  created_at: string;
}

export interface BookAppointmentInput {
  patientId: string;
  facilityId?: string;
  providerId?: string;
  scheduledTime?: string;
  triagePriority?: number;
  triageCategory?: 'RED' | 'AMBER' | 'GREEN';
  patientLat?: number;
  patientLng?: number;
  preferTeleconsult?: boolean;
}

export interface QueueStatus {
  appointmentId: string;
  queuePosition: number;
  estimatedWaitMinutes: number;
  patientsAhead: number;
  facilityId: string;
  facilityName: string;
  status: string;
}

export interface FacilityRecommendation {
  facilityId: string;
  name: string;
  type: string;
  distanceKm: number;
  estimatedWaitMinutes: number;
  hasTeleconsult: boolean;
  score: number;
}
