import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000';

const STATUS_COLORS: Record<string, string> = {
  INITIATED: '#2563eb', ACCEPTED: '#d97706', COMPLETED: '#16a34a', EXPIRED: '#6b7280', NO_SHOW: '#dc2626',
};

export default function ReferralStatusScreen({ route }: any) {
  const { referralId } = route.params;
  const { t } = useTranslation();
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let socket: ReturnType<typeof io>;
    (async () => {
      const token = await AsyncStorage.getItem('sanjeevani_jwt');
      const resp = await fetch(`${API_BASE_URL}/api/referrals/${referralId}/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await resp.json();
      setStatus(data.status);
      setLoading(false);

      socket = io(API_BASE_URL, { auth: { token } });
      socket.on('referral_status_changed', (payload: any) => {
        if (payload.referralId === referralId) setStatus(payload.status);
      });
    })();
    return () => socket?.disconnect();
  }, [referralId]);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} size="large" />;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('referral_status')}</Text>
      <View style={[styles.badge, { backgroundColor: STATUS_COLORS[status ?? ''] ?? '#6b7280' }]}>
        <Text style={styles.badgeText}>{status}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 16, color: '#64748b', marginBottom: 16 },
  badge: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  badgeText: { color: 'white', fontWeight: '700', fontSize: 18 },
});
