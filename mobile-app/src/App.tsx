import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { store } from './store';
import AppNavigator from './navigation/AppNavigator';
import './i18n';
import { startSyncEngine } from './offline/syncEngine';

export default function App() {
  useEffect(() => {
    // Kicks off the background offline->online delta sync loop (Problem 8).
    // Safe no-op if the device has no network; it just retries on an interval.
    startSyncEngine();
  }, []);

  return (
    <Provider store={store}>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </Provider>
  );
}
