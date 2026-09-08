import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setSession } from '../../store/authSlice';
import IconButton from '../../components/IconButton';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export default function OtpScreen({ route }: any) {
  const { phone } = route.params;
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });
      if (!resp.ok) throw new Error('Invalid OTP');
      const data = await resp.json();
      await AsyncStorage.setItem('sanjeevani_jwt', data.accessToken);
      dispatch(setSession({ userId: data.userId, token: data.accessToken, role: data.role }));
    } catch (err) {
      Alert.alert('Error', (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('verify_otp')}</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        value={otp}
        onChangeText={setOtp}
        maxLength={6}
        placeholder="------"
      />
      <IconButton icon="✅" label={loading ? '...' : t('verify_otp')} onPress={verify} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  label: { fontSize: 18, marginBottom: 16, textAlign: 'center' },
  input: { fontSize: 28, letterSpacing: 12, textAlign: 'center', borderBottomWidth: 2, borderBottomColor: '#cbd5e1', marginBottom: 24 },
});
