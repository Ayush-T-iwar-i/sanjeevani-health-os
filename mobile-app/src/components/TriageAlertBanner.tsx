import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const COLORS: Record<string, string> = { RED: '#dc2626', AMBER: '#d97706', GREEN: '#16a34a' };

interface Props {
  category: 'RED' | 'AMBER' | 'GREEN';
  message: string;
}

export default function TriageAlertBanner({ category, message }: Props) {
  return (
    <View style={[styles.banner, { backgroundColor: COLORS[category] }]}>
      <Text style={styles.category}>{category}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { borderRadius: 16, padding: 20, alignItems: 'center' },
  category: { color: 'white', fontSize: 24, fontWeight: '800', marginBottom: 8 },
  message: { color: 'white', fontSize: 16, textAlign: 'center' },
});
