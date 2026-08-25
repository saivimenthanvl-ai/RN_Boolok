import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from '@expo-google-fonts/poppins';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(
    Platform.OS === 'web'
      ? {}
      : {
          Poppins_400Regular,
          Poppins_500Medium,
          Poppins_600SemiBold,
          Poppins_700Bold,
        }
  );

  useEffect(() => {
    if (Platform.OS === 'web') {
      try {
        const linkId = 'google-font-poppins';
        if (typeof document !== 'undefined' && !document.getElementById(linkId)) {
          const link = document.createElement('link');
          link.id = linkId;
          link.rel = 'stylesheet';
          link.href =
            'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap';
          document.head.appendChild(link);

          const styleEl = document.createElement('style');
          styleEl.id = 'poppins-global-style';
          styleEl.innerHTML = `
            * {
              font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
            }
          `;
          document.head.appendChild(styleEl);
        }
      } catch (e) {
        // ignore web font link error
      }
      SplashScreen.hideAsync().catch(() => undefined);
    } else if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontsLoaded, fontError]);

  if (Platform.OS !== 'web' && !fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'fade',
              contentStyle: { backgroundColor: '#050505' },
            }}
          >
            {/* Public routes: never wrapped by the authenticated app layout */}
            <Stack.Screen name="index" />
            <Stack.Screen name="brand-vision" />

            {/*
              FIX: explicitly registered. This Stack declares its children
              manually, which stops expo-router from auto-registering any
              file not listed here — auth-callback.tsx existed on disk but
              was invisible to the router without this line, producing
              "Unmatched Route" every time Google's OAuth popup redirected
              back to it.
            */}
            <Stack.Screen name="auth-callback" />

            {/* Route groups */}
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(app)" />
          </Stack>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}