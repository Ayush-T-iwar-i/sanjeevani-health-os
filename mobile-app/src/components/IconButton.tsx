import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Props {
  icon: string; // emoji or icon glyph, kept simple for low-literacy users
  label: string;
  onPress: () => void;
  color?: string;
}

export default function IconButton({ icon, label, onPress, color = '#2563eb' }: Props) {
  return (
    <TouchableOpacity style={[styles.button, { borderColor: color }]} onPress={onPress}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
    minHeight: 100,
    margin: 8,
  },
  icon: { fontSize: 36, marginBottom: 8 },
  label: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
});
