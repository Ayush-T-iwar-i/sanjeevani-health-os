import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import IconButton from '../../components/IconButton';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export default function CreateReferralScreen({ route, navigation }: any) {
  const { patientId } = route.params;
  const [reason, setReason] = useState('');
  const [targetFacilityId, setTargetFacilityId] = useState('');

  const submit = async () => {
    const token = await AsyncStorage.getItem('sanjeevani_jwt');
    try {
      const resp = await fetch(`${API_BASE_URL}/api/referrals/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ patientId, targetFacilityId, reason, priority: 'ROUTINE' }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error);
      navigation.navigate('ReferralStatus', { referralId: data.referral_id });
    } catch (err) {
      Alert.alert('Error', (err as Error).message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Target facility ID</Text>
      <TextInput style={styles.input} value={targetFacilityId} onChangeText={setTargetFacilityId} />
      <Text style={styles.label}>Reason for referral</Text>
      <TextInput style={styles.input} value={reason} onChangeText={setReason} multiline />
      <IconButton icon="↗️" label="Create Referral" onPress={submit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  label: { fontSize: 15, marginTop: 16, marginBottom: 6, color: '#334155' },
  input: { fontSize: 16, borderBottomWidth: 2, borderBottomColor: '#cbd5e1', paddingVertical: 8 },
});
