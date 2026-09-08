import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000';
const HOLD_DURATION_MS = 2000;

export default function SOSButtonScreen() {
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);
  const [holding, setHolding] = useState(false);
  let holdTimer: ReturnType<typeof setTimeout> | null = null;

  const triggerSOS = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Location permission is required for SOS');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const token = await AsyncStorage.getItem('sanjeevani_jwt');

      const resp = await fetch(`${API_BASE_URL}/api/emergency/sos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ gpsLat: loc.coords.latitude, gpsLng: loc.coords.longitude }),
      });
      if (!resp.ok) throw new Error('Failed to send SOS');
      setSent(true);
    } catch (err) {
      Alert.alert('Error', (err as Error).message);
    }
  };

  const startHold = () => {
    setHolding(true);
    holdTimer = setTimeout(() => {
      triggerSOS();
      setHolding(false);
    }, HOLD_DURATION_MS);
  };

  const cancelHold = () => {
    setHolding(false);
    if (holdTimer) clearTimeout(holdTimer);
  };

  if (sent) {
    return (
      <View style={styles.container}>
        <Text style={styles.icon}>✅</Text>
        <Text style={styles.sentText}>{t('sos_sent')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.sosButton, holding && styles.sosButtonHeld]}
        onPressIn={startHold}
        onPressOut={cancelHold}
      >
        <Text style={styles.sosText}>SOS</Text>
      </TouchableOpacity>
      <Text style={styles.hint}>{t('sos_confirm')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827' },
  sosButton: { width: 180, height: 180, borderRadius: 90, backgroundColor: '#dc2626', alignItems: 'center', justifyContent: 'center' },
  sosButtonHeld: { backgroundColor: '#991b1b', transform: [{ scale: 1.05 }] },
  sosText: { color: 'white', fontSize: 40, fontWeight: '900' },
  hint: { color: '#d1d5db', marginTop: 24, fontSize: 15 },
  icon: { fontSize: 64, marginBottom: 16 },
  sentText: { color: 'white', fontSize: 20, fontWeight: '700' },
});
