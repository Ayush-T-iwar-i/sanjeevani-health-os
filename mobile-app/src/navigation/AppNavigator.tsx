import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

import LanguageSelectScreen from '../screens/Auth/LanguageSelectScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import OtpScreen from '../screens/Auth/OtpScreen';
import RegisterPatientScreen from '../screens/Patient/RegisterPatientScreen';
import PatientHistoryScreen from '../screens/Patient/PatientHistoryScreen';
import SymptomIconPickerScreen from '../screens/Triage/SymptomIconPickerScreen';
import VitalsInputScreen from '../screens/Triage/VitalsInputScreen';
import TriageResultScreen from '../screens/Triage/TriageResultScreen';
import BookAppointmentScreen from '../screens/Appointments/BookAppointmentScreen';
import QueueStatusScreen from '../screens/Appointments/QueueStatusScreen';
import VideoCallScreen from '../screens/Consultation/VideoCallScreen';
import AudioFallbackScreen from '../screens/Consultation/AudioFallbackScreen';
import PrescriptionScreen from '../screens/Consultation/PrescriptionScreen';
import CreateReferralScreen from '../screens/Referral/CreateReferralScreen';
import ReferralStatusScreen from '../screens/Referral/ReferralStatusScreen';
import FacilityStockScreen from '../screens/Inventory/FacilityStockScreen';
import SOSButtonScreen from '../screens/Emergency/SOSButtonScreen';
import MedicineReminderScreen from '../screens/Reminders/MedicineReminderScreen';
import FollowUpScreen from '../screens/Reminders/FollowUpScreen';

export type RootStackParamList = {
  LanguageSelect: undefined;
  Login: undefined;
  Otp: { phone: string };
  RegisterPatient: undefined;
  PatientHistory: { patientId: string };
  SymptomIconPicker: undefined;
  VitalsInput: { symptoms: string[] };
  TriageResult: { patientId: string; symptoms: string[]; vitals: Record<string, number> };
  BookAppointment: { triagePriority: string };
  QueueStatus: { appointmentId: string };
  VideoCall: { consultationId: string };
  AudioFallback: { consultationId: string };
  Prescription: { consultationId: string };
  CreateReferral: { patientId: string };
  ReferralStatus: { referralId: string };
  FacilityStock: { facilityId: string };
  SOSButton: undefined;
  MedicineReminder: undefined;
  FollowUp: { patientId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const isAuthed = useSelector((s: RootState) => !!s.auth.token);

  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      {!isAuthed ? (
        <>
          <Stack.Screen name="LanguageSelect" component={LanguageSelectScreen} options={{ title: 'भाषा चुनें' }} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Otp" component={OtpScreen} options={{ title: 'OTP Verify' }} />
        </>
      ) : (
        <>
          <Stack.Screen name="RegisterPatient" component={RegisterPatientScreen} />
          <Stack.Screen name="PatientHistory" component={PatientHistoryScreen} />
          <Stack.Screen name="SymptomIconPicker" component={SymptomIconPickerScreen} />
          <Stack.Screen name="VitalsInput" component={VitalsInputScreen} />
          <Stack.Screen name="TriageResult" component={TriageResultScreen} />
          <Stack.Screen name="BookAppointment" component={BookAppointmentScreen} />
          <Stack.Screen name="QueueStatus" component={QueueStatusScreen} />
          <Stack.Screen name="VideoCall" component={VideoCallScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AudioFallback" component={AudioFallbackScreen} />
          <Stack.Screen name="Prescription" component={PrescriptionScreen} />
          <Stack.Screen name="CreateReferral" component={CreateReferralScreen} />
          <Stack.Screen name="ReferralStatus" component={ReferralStatusScreen} />
          <Stack.Screen name="FacilityStock" component={FacilityStockScreen} />
          <Stack.Screen name="SOSButton" component={SOSButtonScreen} options={{ title: '🆘 Emergency' }} />
          <Stack.Screen name="MedicineReminder" component={MedicineReminderScreen} />
          <Stack.Screen name="FollowUp" component={FollowUpScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
