import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Reminder {
  medicineName: string;
  time: string;
}

export default function MedicineReminderScreen() {
  const { t } = useTranslation();
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem('sanjeevani_reminders');
      const list: Reminder[] = stored ? JSON.parse(stored) : [];
      setReminders(list);

      // Schedule local notifications so reminders fire even fully offline (Problem 8, 9)
      for (const r of list) {
        const [hour, minute] = r.time.split(':').map(Number);
        await Notifications.scheduleNotificationAsync({
          content: { title: t('reminder_title'), body: r.medicineName },
          trigger: { hour, minute, repeats: true },
        });
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('reminder_title')}</Text>
      <FlatList
        data={reminders}
        keyExtractor={(_, idx) => String(idx)}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.name}>{item.medicineName}</Text>
            <Text style={styles.time}>{item.time}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No reminders set</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  name: { fontSize: 16 },
  time: { fontSize: 16, color: '#2563eb', fontWeight: '600' },
  empty: { textAlign: 'center', marginTop: 40, color: '#94a3b8' },
});
