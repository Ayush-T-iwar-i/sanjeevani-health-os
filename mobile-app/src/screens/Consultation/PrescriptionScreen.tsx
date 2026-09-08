import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import IconButton from '../../components/IconButton';
import { speakPrescription } from '../../voice/textToSpeech';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000';

interface Med {
  medicineName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  spokenInstruction: string;
}

export default function PrescriptionScreen({ route }: any) {
  const { consultationId } = route.params;
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState<Med[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('sanjeevani_jwt');
      const resp = await fetch(`${API_BASE_URL}/api/consultations/${consultationId}/prescription`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await resp.json();
      setItems(data.prescription ?? []);
      setLoading(false);
    })();
  }, [consultationId]);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} size="large" />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('prescription_title')}</Text>
      <FlatList
        data={items}
        keyExtractor={(_, idx) => String(idx)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.medName}>{item.medicineName}</Text>
            <Text style={styles.detail}>{item.dosage} · {item.frequency} · {item.durationDays} days</Text>
          </View>
        )}
      />
      <IconButton icon="🔊" label="Listen" onPress={() => speakPrescription(items, i18n.language)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  card: { backgroundColor: '#f1f5f9', borderRadius: 12, padding: 16, marginBottom: 10 },
  medName: { fontSize: 16, fontWeight: '700' },
  detail: { fontSize: 14, color: '#475569', marginTop: 4 },
});
