export interface Consultation {
  consultation_id: string;
  patient_id: string;
  provider_id: string | null;
  type: string;
  symptoms: string | null;
  diagnosis: string | null;
  treatment_plan: string | null;
  prescription: Record<string, unknown>;
  status: string;
  start_time: string | null;
  end_time: string | null;
  video_recording_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface InitiateConsultationInput {
  patientId: string;
  providerId?: string;
  appointmentId?: string;
  type?: 'remote' | 'in-person' | 'follow-up';
  symptoms?: string;
  audioOnly?: boolean;
}

export interface PrescriptionInput {
  medicines: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }>;
  diagnosis?: string;
  treatmentPlan?: string;
  notes?: string;
  language?: string;
}

export interface SignalingRoom {
  roomId: string;
  consultationId: string;
  patientId: string;
  providerId: string;
  audioOnly: boolean;
}
