import * as Speech from 'expo-speech';

// Maps app language codes to device TTS locale codes for supported languages.
const LOCALE_MAP: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  mr: 'mr-IN',
  kn: 'kn-IN',
  bn: 'bn-IN',
  gu: 'gu-IN',
};

/**
 * Reads a piece of text aloud on-device (no network needed — works fully
 * offline, which matters for Problem 8/9 together: low-literacy patients in
 * low-connectivity areas still get audio prescriptions and health guidance).
 */
export function speak(text: string, language: string = 'hi'): void {
  Speech.speak(text, {
    language: LOCALE_MAP[language] ?? 'hi-IN',
    pitch: 1.0,
    rate: 0.85, // slightly slower for clarity with elderly/low-literacy users
  });
}

export function stopSpeaking(): void {
  Speech.stop();
}

/** Reads out each prescription item's spoken_instruction field in sequence. */
export function speakPrescription(items: { spokenInstruction: string }[], language: string = 'hi'): void {
  items.forEach((item, idx) => {
    setTimeout(() => speak(item.spokenInstruction, language), idx * 4000);
  });
}
