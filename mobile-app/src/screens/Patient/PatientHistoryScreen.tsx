import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000';

interface RecordItem {
  encounter_id: string;
  triage_category: string;
  chief_complaints: string[];
  created_at: string;
}

export default function PatientHistoryScreen({ route }: any) {
  const { patientId } = route.params;
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('sanjeevani_jwt');
      try {
        const resp = await fetch(`${API_BASE_URL}/api/patients/${patientId}/records`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await resp.json();
        setRecords(data.records ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, [patientId]);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} size="large" />;

  return (
    <FlatList
      data={records}
      keyExtractor={(item) => item.encounter_id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.category}>{item.triage_category}</Text>
          <Text style={styles.complaints}>{item.chief_complaints?.join(', ')}</Text>
          <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
      )}
      ListEmptyComponent={<Text style={styles.empty}>No records yet</Text>}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16 },
  card: { backgroundColor: '#f1f5f9', borderRadius: 12, padding: 16, marginBottom: 12 },
  category: { fontWeight: '700', fontSize: 16, marginBottom: 4 },
  complaints: { fontSize: 14, color: '#334155', marginBottom: 4 },
  date: { fontSize: 12, color: '#64748b' },
  empty: { textAlign: 'center', marginTop: 40, color: '#94a3b8' },
});
