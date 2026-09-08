import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export default function AudioFallbackScreen({ route, navigation }: any) {
  const { consultationId } = route.params;
  const { t } = useTranslation();

  useEffect(() => {
    let socket: ReturnType<typeof io>;
    (async () => {
      const token = await AsyncStorage.getItem('sanjeevani_jwt');
      socket = io(API_BASE_URL, { auth: { token } });
      socket.emit('webrtc:join', { consultationId });
      // Audio-only track negotiation reuses the same signaling channel;
      // simplified here since the RTCPeerConnection was already downgraded
      // by VideoCallScreen before navigating here.
    })();
    return () => {
      socket?.disconnect();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🎧</Text>
      <Text style={styles.note}>{t('audio_fallback_note')}</Text>
      <TouchableOpacity style={styles.endButton} onPress={() => navigation.goBack()}>
        <Text style={styles.endButtonText}>End Call</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827' },
  icon: { fontSize: 64, marginBottom: 24 },
  note: { color: 'white', fontSize: 16, textAlign: 'center', paddingHorizontal: 32, marginBottom: 40 },
  endButton: { backgroundColor: '#dc2626', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 30 },
  endButtonText: { color: 'white', fontWeight: '700', fontSize: 16 },
});
