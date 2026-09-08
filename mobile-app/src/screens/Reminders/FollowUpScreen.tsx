import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000';

const PATHWAY_ICONS: Record<string, string> = { maternal: '🤰', child: '🧒', chronic: '💊' };

export default function FollowUpScreen({ route }: any) {
  const { patientId } = route.params;
  const { t } = useTranslation();
  const [followups, setFollowups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('sanjeevani_jwt');
      const resp = await fetch(`${API_BASE_URL}/api/followups/patient/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await resp.json();
      setFollowups(data.followups ?? []);
      setLoading(false);
    })();
  }, [patientId]);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} size="large" />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('followup_title')}</Text>
      <FlatList
        data={followups}
        keyExtractor={(item) => item.followup_id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.icon}>{PATHWAY_ICONS[item.pathway_type] ?? '📋'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.pathway}>{item.pathway_type}</Text>
              <Text style={styles.date}>Due: {new Date(item.next_due_date).toLocaleDateString()}</Text>
            </View>
            <Text style={[styles.status, item.status === 'missed' && styles.missed]}>{item.status}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 12, padding: 14, marginBottom: 10 },
  icon: { fontSize: 28, marginRight: 12 },
  pathway: { fontSize: 16, fontWeight: '600', textTransform: 'capitalize' },
  date: { fontSize: 13, color: '#64748b' },
  status: { fontSize: 13, fontWeight: '700', color: '#16a34a' },
  missed: { color: '#dc2626' },
});
