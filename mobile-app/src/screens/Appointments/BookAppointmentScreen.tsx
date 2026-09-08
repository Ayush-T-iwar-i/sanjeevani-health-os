import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import IconButton from '../../components/IconButton';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export default function BookAppointmentScreen({ route, navigation }: any) {
  const { triagePriority } = route.params;
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const book = async () => {
    setLoading(true);
    const token = await AsyncStorage.getItem('sanjeevani_jwt');
    try {
      const resp = await fetch(`${API_BASE_URL}/api/appointments/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ triagePriority }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Booking failed');
      navigation.navigate('QueueStatus', { appointmentId: data.appointment_id });
    } catch (err) {
      Alert.alert('Error', (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('book_appointment')}</Text>
      {loading ? <ActivityIndicator size="large" /> : <IconButton icon="📅" label={t('book_appointment')} onPress={book} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 24 },
});
