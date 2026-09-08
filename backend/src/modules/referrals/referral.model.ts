export type ReferralPriority = 'EMERGENCY' | 'URGENT' | 'ROUTINE';
export type ReferralStatus = 'INITIATED' | 'ACCEPTED' | 'COMPLETED' | 'EXPIRED' | 'NO_SHOW';

export interface Referral {
  referral_id: string;
  patient_id: string;
  source_facility_id: string | null;
  target_facility_id: string | null;
  referring_doctor_id: string | null;
  reason: string;
  recommended_specialty: string | null;
  priority: ReferralPriority;
  status: ReferralStatus;
  due_date: string | null;
  created_at: string;
  accepted_at: string | null;
  completed_at: string | null;
}

export interface CreateReferralInput {
  patientId: string;
  sourceFacilityId?: string;
  targetFacilityId: string;
  referringDoctorId: string;
  reason: string;
  recommendedSpecialty?: string;
  priority?: ReferralPriority;
  dueInHours?: number; // defaults to 48h no-show window
}
