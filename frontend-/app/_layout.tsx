import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from '@expo-google-fonts/poppins';
import { MaterialIcons } from '@expo/vector-icons';
import {
  Stack,
  router,
  useRootNavigationState,
  useSegments,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function RouteGuard() {
  const { isAuthenticated, loading } = useAuth();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (loading || !navigationState?.key) return;

    const rootSegment = segments[0];
    const insideAuth = rootSegment === '(auth)';
    const insideApp = rootSegment === '(app)';
    const onPublicEntry =
      !rootSegment ||
      rootSegment === 'index' ||
      rootSegment === 'brand-vision';

    if (isAuthenticated && (insideAuth || onPublicEntry)) {
      router.replace('/(app)/dashboard');
      return;
    }

    if (!isAuthenticated && insideApp) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, loading, navigationState?.key, segments]);

  return null;
}

function RootNavigator() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#050914',
        }}
      >
        <ActivityIndicator size="large" color="#E7AD17" />
      </View>
    );
  }

  return (
    <>
      <RouteGuard />

      <Stack
        initialRouteName="index"
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="brand-vision" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    ...MaterialIcons.font,
  });

  useEffect(() => {
    if (fontsLoaded || fontError || Platform.OS === 'web') {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError && Platform.OS !== 'web') {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
