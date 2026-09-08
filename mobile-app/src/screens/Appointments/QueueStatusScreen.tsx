import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io, Socket } from 'socket.io-client';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export default function QueueStatusScreen({ route }: any) {
  const { appointmentId } = route.params;
  const { t } = useTranslation();
  const [position, setPosition] = useState<number | null>(null);
  const [wait, setWait] = useState<number | null>(null);

  useEffect(() => {
    let socket: Socket;

    (async () => {
      const token = await AsyncStorage.getItem('sanjeevani_jwt');

      // Initial fetch
      const resp = await fetch(`${API_BASE_URL}/api/appointments/${appointmentId}/queue-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await resp.json();
      setPosition(data.queue_position);
      setWait(data.estimated_wait_time_minutes);

      // Live updates
      socket = io(API_BASE_URL, { auth: { token } });
      socket.on('appointment_updated', (payload: any) => {
        if (payload.appointment_id === appointmentId || payload.appointmentId === appointmentId) {
          setPosition(payload.queue_position ?? position);
          setWait(payload.estimated_wait_time_minutes ?? wait);
        }
      });
    })();

    return () => {
      socket?.disconnect();
    };
  }, [appointmentId]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('queue_position')}</Text>
      <Text style={styles.big}>{position ?? '—'}</Text>
      <Text style={styles.label}>{t('estimated_wait')}</Text>
      <Text style={styles.big}>{wait !== null ? `${wait} min` : '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 16, color: '#64748b', marginTop: 24 },
  big: { fontSize: 48, fontWeight: '800', color: '#2563eb' },
});
