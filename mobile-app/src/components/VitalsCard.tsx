import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

interface Props {
  label: string;
  unit: string;
  value: string;
  onChangeText: (text: string) => void;
}

export default function VitalsCard({ label, unit, value, onChangeText }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={value}
          onChangeText={onChangeText}
          placeholder="—"
        />
        <Text style={styles.unit}>{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 16, marginBottom: 12 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#1e293b' },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, fontSize: 20, borderBottomWidth: 2, borderBottomColor: '#cbd5e1', paddingVertical: 4 },
  unit: { marginLeft: 8, fontSize: 14, color: '#64748b' },
});
