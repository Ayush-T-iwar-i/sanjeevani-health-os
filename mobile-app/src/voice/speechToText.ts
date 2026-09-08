import { Audio } from 'expo-av';

/**
 * Thin wrapper around device mic recording. Actual transcription is done
 * server-side (send the recorded clip to a lightweight STT endpoint) since
 * on-device STT models are too heavy for budget Android phones — this keeps
 * the app working on 2G by only uploading a short compressed audio clip
 * rather than streaming continuously.
 */
let recording: Audio.Recording | null = null;

export async function startRecording(): Promise<void> {
  const { granted } = await Audio.requestPermissionsAsync();
  if (!granted) throw new Error('Microphone permission denied');

  await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
  const { recording: rec } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.LOW_QUALITY);
  recording = rec;
}

export async function stopRecordingAndGetUri(): Promise<string | null> {
  if (!recording) return null;
  await recording.stopAndUnloadAsync();
  const uri = recording.getURI();
  recording = null;
  return uri;
}

/**
 * Uploads the recorded clip to the AI service's STT endpoint and returns
 * the transcribed text in the user's selected language.
 */
export async function transcribeAudio(uri: string, language: string, aiServiceUrl: string): Promise<string> {
  const formData = new FormData();
  formData.append('audio', { uri, name: 'clip.m4a', type: 'audio/m4a' } as any);
  formData.append('language', language);

  const resp = await fetch(`${aiServiceUrl}/voice/stt`, { method: 'POST', body: formData });
  if (!resp.ok) throw new Error('Transcription failed');
  const { text } = await resp.json();
  return text;
}
