import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import IconButton from '../../components/IconButton';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export default function LoginScreen({ navigation }: any) {
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    if (phone.length < 10) {
      Alert.alert('Error', 'Enter a valid phone number');
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      if (!resp.ok) throw new Error('Failed to send OTP');
      navigation.navigate('Otp', { phone });
    } catch (err) {
      Alert.alert('Error', (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('welcome')}</Text>
      <Text style={styles.label}>{t('enter_phone')}</Text>
      <TextInput
        style={styles.input}
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        placeholder="+91 XXXXX XXXXX"
        maxLength={13}
      />
      <IconButton icon="📱" label={loading ? '...' : t('send_otp')} onPress={sendOtp} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 32, textAlign: 'center' },
  label: { fontSize: 16, marginBottom: 8 },
  input: { fontSize: 20, borderBottomWidth: 2, borderBottomColor: '#cbd5e1', paddingVertical: 8, marginBottom: 24 },
});
