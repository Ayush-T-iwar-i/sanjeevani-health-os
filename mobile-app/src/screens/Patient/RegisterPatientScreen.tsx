import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Switch, ScrollView } from 'react-native';
import { database } from '../../offline/database';
import { queueMutation } from '../../offline/syncEngine';
import IconButton from '../../components/IconButton';

export default function RegisterPatientScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isPregnant, setIsPregnant] = useState(false);

  const savePatient = async () => {
    let localId = '';
    await database.write(async () => {
      const patientsCollection = database.get('patients');
      const record: any = await patientsCollection.create((r: any) => {
        r.name = name;
        r.phone = phone;
        r.isPregnant = isPregnant;
        r.synced = false;
      });
      localId = record.id;
    });

    // Queues for background push to /api/sync/push — screen never blocks on network.
    await queueMutation({
      table: 'patients',
      operation: 'INSERT',
      recordId: localId,
      payload: { name, phone, is_pregnant: isPregnant, updated_at: new Date().toISOString() },
    });

    navigation.navigate('SymptomIconPicker');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Register Patient</Text>
      <TextInput style={styles.input} placeholder="Full name" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Phone" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Pregnant?</Text>
        <Switch value={isPregnant} onValueChange={setIsPregnant} />
      </View>
      <IconButton icon="💾" label="Save" onPress={savePatient} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 24 },
  input: { fontSize: 18, borderBottomWidth: 2, borderBottomColor: '#cbd5e1', paddingVertical: 8, marginBottom: 20 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  switchLabel: { fontSize: 16 },
});
