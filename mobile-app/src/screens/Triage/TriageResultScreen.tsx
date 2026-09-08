import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TriageAlertBanner from '../../components/TriageAlertBanner';
import IconButton from '../../components/IconButton';
import { speak } from '../../voice/textToSpeech';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export default function TriageResultScreen({ route, navigation }: any) {
  const { patientId, symptoms, vitals } = route.params;
  const { t, i18n } = useTranslation();
  const [result, setResult] = useState<{ category: 'RED' | 'AMBER' | 'GREEN'; reasons: string[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('sanjeevani_jwt');
      try {
        const resp = await fetch(`${API_BASE_URL}/api/triage/assess`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ patientId, symptoms, vitals }),
        });
        const data = await resp.json();
        setResult(data);

        const spokenKey = data.category === 'RED' ? 'triage_red' : data.category === 'AMBER' ? 'triage_amber' : 'triage_green';
        speak(t(spokenKey), i18n.language);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || !result) return <ActivityIndicator style={{ marginTop: 40 }} size="large" />;

  const messageKey = result.category === 'RED' ? 'triage_red' : result.category === 'AMBER' ? 'triage_amber' : 'triage_green';

  return (
    <View style={styles.container}>
      <TriageAlertBanner category={result.category} message={t(messageKey)} />
      {result.category === 'RED' ? (
        <IconButton icon="📹" label={t('video_call')} onPress={() => navigation.navigate('VideoCall', { consultationId: 'pending' })} />
      ) : (
        <IconButton
          icon="📅"
          label={t('book_appointment')}
          onPress={() => navigation.navigate('BookAppointment', { triagePriority: result.category })}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
});
