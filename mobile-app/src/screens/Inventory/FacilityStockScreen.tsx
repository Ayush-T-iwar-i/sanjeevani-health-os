import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export default function FacilityStockScreen({ route }: any) {
  const { facilityId } = route.params;
  const { t } = useTranslation();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('sanjeevani_jwt');
      const resp = await fetch(`${API_BASE_URL}/api/inventory/facility/${facilityId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await resp.json();
      setItems(data.items ?? []);
      setLoading(false);
    })();
  }, [facilityId]);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} size="large" />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('facility_stock')}</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.inventory_id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.name}>{item.item_name}</Text>
            <Text style={[styles.qty, item.quantity_available <= 10 && styles.low]}>
              {item.quantity_available} in stock
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  name: { fontSize: 16 },
  qty: { fontSize: 14, color: '#16a34a', fontWeight: '600' },
  low: { color: '#dc2626' },
});
