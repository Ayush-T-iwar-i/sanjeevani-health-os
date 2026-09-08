import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import IconButton from '../../components/IconButton';

const SYMPTOMS = [
  { code: 'chest_pain', icon: '💔', label: 'Chest Pain' },
  { code: 'difficulty_breathing', icon: '😮‍💨', label: 'Breathing Trouble' },
  { code: 'high_fever', icon: '🌡️', label: 'Fever' },
  { code: 'persistent_vomiting', icon: '🤮', label: 'Vomiting' },
  { code: 'abdominal_pain', icon: '🤕', label: 'Stomach Pain' },
  { code: 'moderate_bleeding', icon: '🩸', label: 'Bleeding' },
  { code: 'seizure', icon: '⚡', label: 'Seizure' },
  { code: 'pregnancy_bleeding', icon: '🤰', label: 'Pregnancy Issue' },
];

export default function SymptomIconPickerScreen({ navigation }: any) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (code: string) => {
    setSelected((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('symptom_picker_title')}</Text>
      <ScrollView contentContainerStyle={styles.grid}>
        {SYMPTOMS.map((s) => (
          <IconButton
            key={s.code}
            icon={s.icon}
            label={s.label}
            color={selected.includes(s.code) ? '#16a34a' : '#2563eb'}
            onPress={() => toggle(s.code)}
          />
        ))}
      </ScrollView>
      <IconButton
        icon="➡️"
        label={t('next')}
        onPress={() => navigation.navigate('VitalsInput', { symptoms: selected })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: '700', textAlign: 'center', marginVertical: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
});
