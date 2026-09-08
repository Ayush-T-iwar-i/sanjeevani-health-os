import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import VitalsCard from '../../components/VitalsCard';
import IconButton from '../../components/IconButton';

export default function VitalsInputScreen({ route, navigation }: any) {
  const { symptoms } = route.params;
  const { t } = useTranslation();
  const [temp, setTemp] = useState('');
  const [pulse, setPulse] = useState('');
  const [bp, setBp] = useState('');
  const [glucose, setGlucose] = useState('');

  const proceed = () => {
    const vitals: Record<string, number> = {};
    if (temp) vitals.temp_c = parseFloat(temp);
    if (pulse) vitals.pulse_bpm = parseFloat(pulse);
    if (glucose) vitals.glucose_mg_dl = parseFloat(glucose);

    navigation.navigate('TriageResult', { symptoms, vitals });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t('vitals_title')}</Text>
      <VitalsCard label="Temperature" unit="°C" value={temp} onChangeText={setTemp} />
      <VitalsCard label="Pulse" unit="bpm" value={pulse} onChangeText={setPulse} />
      <VitalsCard label="Blood Pressure" unit="mmHg" value={bp} onChangeText={setBp} />
      <VitalsCard label="Blood Glucose" unit="mg/dL" value={glucose} onChangeText={setGlucose} />
      <IconButton icon="➡️" label={t('next')} onPress={proceed} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
});
