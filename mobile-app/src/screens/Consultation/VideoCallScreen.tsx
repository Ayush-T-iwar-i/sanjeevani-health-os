import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// NOTE: react-native-webrtc requires a custom Expo dev build — it does not
// run inside Expo Go. This placeholder lets the rest of the app be tested
// in Expo Go. Swap back to the real WebRTC implementation once you build
// a dev client (`npx expo prebuild` + `eas build --profile development`).
export default function VideoCallScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📹</Text>
      <Text style={styles.text}>
        Video calling needs a custom dev build (not supported in Expo Go).
      </Text>
      <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
        <Text style={styles.buttonText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827', padding: 24 },
  icon: { fontSize: 64, marginBottom: 24 },
  text: { color: 'white', fontSize: 16, textAlign: 'center', marginBottom: 32 },
  button: { backgroundColor: '#2563eb', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 30 },
  buttonText: { color: 'white', fontWeight: '700' },
});