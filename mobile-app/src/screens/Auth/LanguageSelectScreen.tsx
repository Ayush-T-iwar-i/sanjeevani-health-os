import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { setLanguage } from '../../store/authSlice';
import IconButton from '../../components/IconButton';

const LANGUAGES = [
  { code: 'hi', label: 'हिन्दी' },
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'mr', label: 'मराठी' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'gu', label: 'ગુજરાતી' },
];

export default function LanguageSelectScreen({ navigation }: any) {
  const { i18n, t } = useTranslation();
  const dispatch = useDispatch();

  const selectLanguage = (code: string) => {
    i18n.changeLanguage(code);
    dispatch(setLanguage(code));
    navigation.navigate('Login');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t('select_language')}</Text>
      <View style={styles.grid}>
        {LANGUAGES.map((lang) => (
          <IconButton key={lang.code} icon="🌐" label={lang.label} onPress={() => selectLanguage(lang.code)} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', marginVertical: 24, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
});
