const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

const SYMPTOM_OPTIONS = [
  { key: '1', value: 'fever' },
  { key: '2', value: 'cough' },
  { key: '3', value: 'chest_pain' },
  { key: '4', value: 'difficulty_breathing' },
  { key: '5', value: 'abdominal_pain' },
  { key: '6', value: 'high_fever' },
  { key: '7', value: 'persistent_vomiting' },
];

/**
 * Text-only symptom checker for WhatsApp users without the app (Problem 6:
 * awareness, Problem 10: affordability — no smartphone/data plan required
 * beyond WhatsApp itself, which is near-ubiquitous in rural India).
 * Steps: 0 = ask patient phone/ABHA, 1 = ask symptom, 2 = confirm & call triage API.
 */
async function handleSymptomCheckFlow(session, text) {
  switch (session.step) {
    case 0:
      session.data.identifier = text;
      session.step = 1;
      return {
        message:
          'Select your main symptom by number:\n' +
          SYMPTOM_OPTIONS.map((o) => `${o.key}. ${o.value.replace(/_/g, ' ')}`).join('\n'),
      };

    case 1: {
      const chosen = SYMPTOM_OPTIONS.find((o) => o.key === text.trim());
      if (!chosen) {
        return { message: 'Please reply with a valid number (1-7).' };
      }
      session.data.symptom = chosen.value;
      session.step = 2;

      try {
        const { data } = await axios.post(`${BACKEND_URL}/api/triage/assess`, {
          patientId: session.data.identifier, // in production, resolved via phone->patient lookup first
          symptoms: [chosen.value],
        });

        return {
          message:
            `Triage result: ${data.category}\n${data.recommendedAction}\n\n` +
            `Reply "2" to book an appointment, or "menu" to start over.`,
          done: data.category !== 'RED', // RED stays "open" so a human can follow up if needed
        };
      } catch (err) {
        return { message: 'Sorry, our triage service is temporarily unavailable. Please call your nearest health centre.', done: true };
      }
    }

    default:
      return { message: 'Session ended. Reply "menu" to start again.', done: true };
  }
}

module.exports = { handleSymptomCheckFlow };
