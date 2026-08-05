// lib/useGoogleAuth.ts
//
// Two different Google sign-in mechanisms, chosen by platform:
//
// - Android / iOS: @react-native-google-signin/google-signin talks to Google
//   Play Services directly on-device. It is validated by your Android OAuth
//   client's package name + SHA-1 fingerprint — no redirect URI involved, so
//   it sidesteps the "invalid_request" / browser-tab problems entirely.
//
// - Web: there is no Play Services, so we keep expo-auth-session's browser
//   based flow, scoped to responseType: IdToken so the shape returned to the
//   caller is identical to the native path (a single idToken string).
//
// Both paths report back through the SAME interface — onSuccess(idToken) —
// so login.tsx and register.tsx never need to know which platform they're on.

import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

interface GoogleAuthOptions {
  onSuccess: (idToken: string) => Promise<void>;
  onError?: (error: string) => void;
}

// ── Native (Android / iOS) ──────────────────────────────────────────────
function useNativeGoogleAuth({ onSuccess, onError }: GoogleAuthOptions) {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    // Lazy-required so this native module is never touched on web bundles.
    const { GoogleSignin } = require('@react-native-google-signin/google-signin');
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, // Google issues idToken audienced to this web client, even on native
      offlineAccess: false,
    });
  }, []);

  const promptGoogleSignIn = useCallback(async () => {
    const { GoogleSignin, statusCodes } = require('@react-native-google-signin/google-signin');
    setIsGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const result = await GoogleSignin.signIn();
      const idToken = result?.data?.idToken ?? result?.idToken;
      if (!idToken) throw new Error('No ID token returned by Google.');
      await onSuccess(idToken);
    } catch (error: any) {
      if (error.code !== statusCodes.SIGN_IN_CANCELLED) {
        onError?.(error?.message ?? 'Google sign-in failed.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  }, [onSuccess, onError]);

  return { promptGoogleSignIn, isGoogleLoading };
}

// ── Web (browser-based OAuth via expo-auth-session) ─────────────────────
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

// ── Public hook — picks the right implementation per platform ───────────
export function useGoogleAuth(options: GoogleAuthOptions) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return Platform.OS === 'web' ? useWebGoogleAuth(options) : useNativeGoogleAuth(options);
}