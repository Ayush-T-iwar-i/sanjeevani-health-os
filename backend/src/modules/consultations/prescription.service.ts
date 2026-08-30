import { PrescriptionInput } from './consultation.model';

const TTS_TEMPLATES: Record<string, (rx: PrescriptionInput) => string> = {
  en: (rx) => {
    const meds = rx.medicines
      .map((m) => `Take ${m.name}, ${m.dosage}, ${m.frequency}, for ${m.duration}.`)
      .join(' ');
    return `Your prescription: ${meds}${rx.diagnosis ? ` Diagnosis: ${rx.diagnosis}.` : ''}`;
  },
  hi: (rx) => {
    const meds = rx.medicines
      .map((m) => `${m.name} लें, ${m.dosage}, ${m.frequency}, ${m.duration} तक।`)
      .join(' ');
    return `आपकी दवा: ${meds}${rx.diagnosis ? ` निदान: ${rx.diagnosis}।` : ''}`;
  },
};

export function buildPrescriptionPayload(input: PrescriptionInput): Record<string, unknown> {
  const lang = input.language ?? 'en';
  const ttsFn = TTS_TEMPLATES[lang] ?? TTS_TEMPLATES.en;

  return {
    medicines: input.medicines,
    diagnosis: input.diagnosis,
    treatmentPlan: input.treatmentPlan,
    notes: input.notes,
    language: lang,
    ttsScript: ttsFn(input),
    issuedAt: new Date().toISOString(),
  };
}

export function getGenericAlternatives(medicineName: string): string[] {
  const generics: Record<string, string[]> = {
    paracetamol: ['Crocin', 'Dolo 650', 'Calpol'],
    metformin: ['Glycomet', 'Obimet', 'Gluformin'],
    amoxicillin: ['Mox', 'Amoxil', 'Novamox'],
  };
  const key = medicineName.toLowerCase();
  return generics[key] ?? [];
}
