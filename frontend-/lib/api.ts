// lib/api.ts
//
// Single source of truth for:
//   1. API_BASE_URL — auto-detects your dev machine's LAN IP from Expo's
//      manifest instead of relying on a hardcoded fallback IP that breaks
//      the moment your machine's IP changes or you switch networks.
//   2. useGoogleAuth — platform-specific Google sign-in: 
//        - Web: expo-auth-session browser OAuth flow (responseType: IdToken)
//        - Native (Android/iOS): @react-native-google-signin/google-signin,
//          which talks to Google Play Services directly on-device. No
//          redirect URI, no browser tab, no "invalid_request" timeouts —
//          this is what was missing before and is why native kept failing
//          while web worked.
//
// Both paths report back through the SAME interface — onSuccess(idToken) —
// so login.tsx and register.tsx never need to know which platform they're on.

import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// ── API_BASE_URL ──────────────────────────────────────────────────────────
//
// Priority order:
//   1. Explicit env var override (EXPO_PUBLIC_API_URL / EXPO_PUBLIC_API_BASE_URL)
//      — always wins, use this for pointing at a staging/prod backend.
//   2. Auto-detected dev machine IP, pulled from the Metro/Expo manifest
//      (the same host your phone is already using to load the JS bundle,
//      so if the dev build loaded at all, this address is reachable).
//   3. localhost — last-resort fallback for web/simulator only.
function resolveDevHost(): string | null {
  // Works across SDK versions: hostUri lives in different spots depending
  // on how the app was launched (Expo Go vs dev client vs classic manifest).
  const hostUri =
    (Constants as any).expoConfig?.hostUri ??
    (Constants as any).expoGoConfig?.hostUri ??
    (Constants as any).manifest2?.extra?.expoClient?.hostUri ??
    (Constants as any).manifest?.debuggerHost ??
    (Constants as any).manifest?.hostUri ??
    null;

  if (!hostUri || typeof hostUri !== 'string') return null;

  // hostUri looks like "192.168.1.42:8081" — strip the Metro port, we only
  // want the IP/hostname to talk to our own backend on its own port.
  const host = hostUri.split(':')[0];
  return host || null;
}

function resolveApiBaseUrl(): string {
  if (Platform.OS === 'web') {
    // On web, use the explicit web URL or localhost.
    const explicitWeb =
      process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_API_BASE_URL;
    return explicitWeb || 'http://localhost:5000';
  }

  // On native (Android/iOS): always auto-detect from the Metro host so the
  // correct IP is used regardless of network changes. Only fall back to the
  // explicit env var if auto-detection fails.
  const detectedHost = resolveDevHost();
  if (detectedHost) {
    const url = `http://${detectedHost}:5000`;
    console.log('API_BASE_URL: auto-detected ->', url);
    return url;
  }

  // Fallback: use the explicit native override if set.
  const explicitNative =
    process.env.EXPO_PUBLIC_API_URL_NATIVE ||
    process.env.EXPO_PUBLIC_API_URL ||
    process.env.EXPO_PUBLIC_API_BASE_URL;
  if (explicitNative) {
    console.log('API_BASE_URL: using explicit env ->', explicitNative);
    return explicitNative;
  }

  console.warn(
    'API_BASE_URL: could not auto-detect dev host. ' +
    'Falling back to localhost — will NOT work on a physical device.'
  );
  return 'http://localhost:5000';
}

export const API_BASE_URL = resolveApiBaseUrl();

// ── Shared interface ────────────────────────────────────────────────────
interface GoogleAuthOptions {
  // idToken is a verifiable JWT — send it as-is to the backend, which
  // should verify it against Google's public keys rather than trusting
  // client data.
  onSuccess: (idToken: string) => Promise<void>;
  onError?: (error: string) => void;
}

// ── Native (Android / iOS) ─────────────────────────────────────────────
function useNativeGoogleAuth({ onSuccess, onError }: GoogleAuthOptions) {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Lazy-required so this native module is never touched on web bundles.
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');
      GoogleSignin.configure({
        // webClientId: Google issues the idToken audienced to the web client
        // even on native. This MUST be the WEB client ID (not the Android one).
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        offlineAccess: false,
      });
    } catch (err: any) {
      const msg =
        'Failed to configure Google Sign-In. Make sure ' +
        '@react-native-google-signin/google-signin is installed and the ' +
        'app was rebuilt (this native module requires a new dev client / ' +
        'APK, not just a JS reload).';
      console.error(msg, err);
      setConfigError(msg);
    }
  }, []);


  const promptGoogleSignIn = useCallback(async () => {
    if (configError) {
      onError?.(configError);
      return;
    }

    const { GoogleSignin, statusCodes } = require('@react-native-google-signin/google-signin');
    setIsGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const result = await GoogleSignin.signIn();
      const idToken = result?.data?.idToken ?? result?.idToken;
      if (!idToken) throw new Error('No ID token returned by Google.');
      await onSuccess(idToken);
    } catch (error: any) {
      if (error?.code !== statusCodes?.SIGN_IN_CANCELLED) {
        onError?.(error?.message ?? 'Google sign-in failed.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  }, [onSuccess, onError, configError]);

  return { promptGoogleSignIn, isGoogleLoading };
}

// ── Web (browser-based OAuth via expo-auth-session) ────────────────────
function useWebGoogleAuth({ onSuccess, onError }: GoogleAuthOptions) {
  // Required so these web-only imports never get pulled into the native bundle.
  const WebBrowser = require('expo-web-browser');
  const AuthSession = require('expo-auth-session');
  const Google = require('expo-auth-session/providers/google');

  WebBrowser.maybeCompleteAuthSession();

  const redirectUri = AuthSession.makeRedirectUri();

  const [nonce] = useState(() => Math.random().toString(36).slice(2));
  const [isExchanging, setIsExchanging] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    redirectUri,
    responseType: AuthSession.ResponseType.IdToken,
    scopes: ['openid', 'profile', 'email'],
    selectAccount: true,
    extraParams: { nonce },
  });

  useEffect(() => {
    const handleResponse = async () => {
      if (response?.type !== 'success') return;

      const idToken = response.authentication?.idToken ?? response.params?.id_token;
      if (!idToken) {
        onError?.('Google sign-in failed: no ID token was returned.');
        return;
      }

      setIsExchanging(true);
      try {
        await onSuccess(idToken);
      } catch (error: any) {
        onError?.(error?.message ?? 'Google sign-in failed.');
      } finally {
        setIsExchanging(false);
      }
    };

    handleResponse();
  }, [response]);

  const promptGoogleSignIn = useCallback(() => {
    if (!request) {
      onError?.('Google sign-in is still loading — try again in a moment.');
      return;
    }
    promptAsync();
  }, [request, promptAsync]);

  return { promptGoogleSignIn, isGoogleLoading: !request || isExchanging };
}

// ── Public hook — picks the right implementation per platform ──────────
export function useGoogleAuth(options: GoogleAuthOptions) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return Platform.OS === 'web' ? useWebGoogleAuth(options) : useNativeGoogleAuth(options);
}