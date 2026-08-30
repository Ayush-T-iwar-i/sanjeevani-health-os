export interface Patient {
  patient_id: string;
  user_id: string;
  abha_id: string | null;
  aadhar_id: string | null;
  blood_type: string | null;
  allergies: unknown[];
  chronic_conditions: unknown[];
  current_medications: unknown[];
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  is_pregnant: boolean;
  is_diabetic: boolean;
  is_hypertensive: boolean;
  assigned_subcentre_id: string | null;
  is_high_risk: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdatePatientInput {
  abhaId?: string;
  aadharId?: string;
  bloodType?: string;
  allergies?: unknown[];
  chronicConditions?: unknown[];
  currentMedications?: unknown[];
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  isPregnant?: boolean;
  isDiabetic?: boolean;
  isHypertensive?: boolean;
  assignedSubcentreId?: string;
}

export interface EHRTimeline {
  patient: Patient & { name: string; phone: string };
  encounters: unknown[];
  consultations: unknown[];
  appointments: unknown[];
  referrals: unknown[];
  followups: unknown[];
}
