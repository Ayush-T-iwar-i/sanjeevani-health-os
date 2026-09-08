import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function SOSFab() {
  const navigation = useNavigation<any>();
  return (
    <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('SOSButton')}>
      <Text style={styles.text}>🆘</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  text: { fontSize: 28 },
});
