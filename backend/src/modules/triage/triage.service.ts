import rulesData from './triage.rules.json';
import { query } from '../../config/db';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

type TriageCategory = 'RED' | 'AMBER' | 'GREEN';

interface RuleSymptom {
  category: TriageCategory;
  specialty: string;
  icon?: string;
  vitalsThreshold?: Record<string, number>;
}

interface TriageRules {
  categories: Record<TriageCategory, { priority: number; maxWaitMinutes: number; label: string }>;
  symptoms: Record<string, RuleSymptom>;
  vitalsEscalation: Record<string, { min?: number; max?: number; escalateTo: TriageCategory }>;
  educationTopics: Record<string, Record<string, string>>;
}

export interface TriageInput {
  patientId: string;
  symptoms: string[];
  vitals?: Record<string, number>;
  providerId?: string;
  facilityId?: string;
  isPregnant?: boolean;
  language?: string;
}

export interface TriageResult {
  category: TriageCategory;
  priority: number;
  recommendedSpecialty: string;
  confidence: number;
  advice: string;
  education?: string;
  encounterId: string;
  suggestedAction: 'teleconsult' | 'visit_facility' | 'sos';
  aiEnhanced: boolean;
}

const rules: TriageRules = rulesData as TriageRules;

function normalizeSymptom(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, '_');
}

function assessWithRules(input: TriageInput): Omit<TriageResult, 'encounterId' | 'aiEnhanced'> {
  let category: TriageCategory = 'GREEN';
  let specialty = 'general';
  let confidence = 0.7;
  let education: string | undefined;
  const lang = input.language ?? 'en';

  for (const raw of input.symptoms) {
    const key = normalizeSymptom(raw);
    const rule = rules.symptoms[key];
    if (!rule) continue;

    if (rule.category === 'RED') {
      category = 'RED';
      specialty = rule.specialty;
      confidence = 0.95;
      break;
    }
    if (rule.category === 'AMBER' && category !== 'RED') {
      category = 'AMBER';
      specialty = rule.specialty;
      confidence = 0.85;
    }

    const topic = rules.educationTopics[key];
    if (topic) education = topic[lang] ?? topic.en;
  }

  if (input.isPregnant && category === 'RED') {
    specialty = 'obgyn';
  }

  if (input.vitals) {
    for (const [key, threshold] of Object.entries(rules.vitalsEscalation)) {
      const vitalKey = key.replace('_critical', '');
      const value = input.vitals[vitalKey];
      if (value === undefined) continue;

      const escalates =
        (threshold.min !== undefined && value >= threshold.min) ||
        (threshold.max !== undefined && value <= threshold.max);

      if (escalates) {
        const escalateTo = threshold.escalateTo;
        if (escalateTo === 'RED' || (escalateTo === 'AMBER' && category === 'GREEN')) {
          category = escalateTo;
          confidence = Math.max(confidence, 0.9);
        }
      }
    }
  }

  const adviceMap: Record<TriageCategory, string> = {
    RED: 'Seek immediate medical attention. Use SOS if needed.',
    AMBER: 'Consult a healthcare provider within 24 hours.',
    GREEN: 'Self-care advised. Monitor symptoms and book routine consult if needed.',
  };

  const suggestedAction: TriageResult['suggestedAction'] =
    category === 'RED' ? 'sos' : category === 'AMBER' ? 'teleconsult' : 'visit_facility';

  return {
    category,
    priority: rules.categories[category].priority,
    recommendedSpecialty: specialty,
    confidence,
    advice: adviceMap[category],
    education,
    suggestedAction,
  };
}

async function assessWithAI(input: TriageInput): Promise<{ category: TriageCategory; specialty: string; confidence: number; advice: string } | null> {
  try {
    const response = await fetch(`${env.AI_SERVICE_URL}/api/ai/triage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symptoms: input.symptoms,
        vitals: input.vitals,
        is_pregnant: input.isPregnant ?? false,
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      category: TriageCategory;
      recommended_specialty: string;
      confidence: number;
      advice: string;
    };

    return {
      category: data.category,
      specialty: data.recommended_specialty,
      confidence: data.confidence,
      advice: data.advice,
    };
  } catch (err) {
    logger.warn('AI triage unavailable, using rules only', { err });
    return null;
  }
}

function mergeResults(
  rulesResult: Omit<TriageResult, 'encounterId' | 'aiEnhanced'>,
  aiResult: { category: TriageCategory; specialty: string; confidence: number; advice: string } | null
): Omit<TriageResult, 'encounterId' | 'aiEnhanced'> {
  if (!aiResult) return rulesResult;

  const categoryOrder: TriageCategory[] = ['GREEN', 'AMBER', 'RED'];
  const rulesIdx = categoryOrder.indexOf(rulesResult.category);
  const aiIdx = categoryOrder.indexOf(aiResult.category);
  const mergedCategory = aiIdx > rulesIdx ? aiResult.category : rulesResult.category;

  return {
    ...rulesResult,
    category: mergedCategory,
    priority: rules.categories[mergedCategory].priority,
    recommendedSpecialty: mergedCategory === rulesResult.category ? rulesResult.recommendedSpecialty : aiResult.specialty,
    confidence: Math.max(rulesResult.confidence, aiResult.confidence),
    advice: mergedCategory === aiResult.category ? aiResult.advice : rulesResult.advice,
    suggestedAction: mergedCategory === 'RED' ? 'sos' : mergedCategory === 'AMBER' ? 'teleconsult' : rulesResult.suggestedAction,
  };
}

export async function assessTriage(input: TriageInput): Promise<TriageResult> {
  const rulesResult = assessWithRules(input);
  const aiResult = await assessWithAI(input);
  const merged = mergeResults(rulesResult, aiResult);

  const encounterResult = await query<{ encounter_id: string }>(
    `INSERT INTO encounters (patient_id, provider_id, facility_id, triage_category, chief_complaints, vitals_payload)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING encounter_id`,
    [
      input.patientId,
      input.providerId ?? null,
      input.facilityId ?? null,
      merged.category,
      JSON.stringify(input.symptoms),
      JSON.stringify(input.vitals ?? {}),
    ]
  );

  return {
    ...merged,
    encounterId: encounterResult.rows[0].encounter_id,
    aiEnhanced: aiResult !== null,
  };
}

export function getSymptomCatalog(language = 'en'): { key: string; icon: string; category: string; label: string }[] {
  return Object.entries(rules.symptoms).map(([key, rule]) => ({
    key,
    icon: rule.icon ?? 'default',
    category: rule.category,
    label: key.replace(/_/g, ' '),
  }));
}
