// lib/useGoogleAuth.ts
//
// NOTE: lib/api.ts also exports a useGoogleAuth hook. If your project
// imports from BOTH files in different screens, you now have two copies
// of the same logic again — pick one file as the source of truth and
// update every `import { useGoogleAuth } from '...'` to point at it.
// (register.tsx / login.tsx currently import from '../../lib/api'.)

import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

interface GoogleAuthOptions {
  onSuccess: (idToken: string) => Promise<void>;
  onError?: (error: string) => void;
}

// ── Native (Android / iOS) ──────────────────────────────────────────────
function useNativeGoogleAuth({ onSuccess, onError }: GoogleAuthOptions) {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [configurationError, setConfigurationError] = useState<string | null>(null);
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

  useEffect(() => {
    try {
      if (!webClientId) {
        throw new Error('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is missing in your .env or EAS environment variables.');
      }

      const { GoogleSignin } = require('@react-native-google-signin/google-signin');
      GoogleSignin.configure({
        webClientId,
        offlineAccess: false,
      });
      setConfigurationError(null);
    } catch (error: any) {
      const message = error?.message || 'Google Sign-In configuration failed.';
      console.error('[GoogleSignin Config Error]:', message);
      setConfigurationError(message);
    }
  }, [webClientId]);

  const promptGoogleSignIn = useCallback(async () => {
    if (configurationError) {
      onError?.(configurationError);
      return;
    }

    setIsGoogleLoading(true);

    // Import statusCodes up front — referencing it in the catch block
    // without importing it first throws a ReferenceError that masks the
    // real Google Sign-In error underneath it.
    const { GoogleSignin, statusCodes } = require('@react-native-google-signin/google-signin');

    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const result = await GoogleSignin.signIn();
      const idToken = result?.data?.idToken ?? result?.idToken;

      if (!idToken) throw new Error('No ID token returned by Google.');

      await onSuccess(idToken);
    } catch (error: any) {
      if (error?.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled — not an error, don't surface anything
      } else if (error?.code === statusCodes.IN_PROGRESS) {
        // Sign-in already in progress — ignore duplicate trigger
      } else if (error?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        onError?.('Google Play Services not available or outdated.');
      } else if (error?.code === statusCodes.DEVELOPER_ERROR) {
        onError?.(
          'Google Sign-In is misconfigured for this build (DEVELOPER_ERROR). ' +
          'The SHA-1 fingerprint of this build does not match the one registered in ' +
          'Google Cloud Console for this package name — see Clients → your Android client.'
        );
      } else {
        onError?.(error?.message ?? 'Google sign-in failed.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  }, [configurationError, onSuccess, onError]);

  return { promptGoogleSignIn, isGoogleLoading };
}

// ── Web (browser-based OAuth via expo-auth-session) ─────────────────────
function useWebGoogleAuth({ onSuccess, onError }: GoogleAuthOptions) {
  const WebBrowser = require('expo-web-browser');
  const AuthSession = require('expo-auth-session');
  const Google = require('expo-auth-session/providers/google');

  WebBrowser.maybeCompleteAuthSession();

  const redirectUri = AuthSession.makeRedirectUri();
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

  const [nonce] = useState(() => Math.random().toString(36).slice(2));
  const [isExchanging, setIsExchanging] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId,
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
  }, [response, onSuccess, onError]);

  const promptGoogleSignIn = useCallback(() => {
    if (!webClientId) {
      onError?.('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is missing.');
      return;
    }
    if (!request) {
      onError?.('Google sign-in is still loading — try again in a moment.');
      return;
    }
    promptAsync();
  }, [request, promptAsync, onError, webClientId]);

  return { promptGoogleSignIn, isGoogleLoading: !request || isExchanging };
}

// ── Public hook — picks the right implementation per platform ───────────
export function useGoogleAuth(options: GoogleAuthOptions) {
  return Platform.OS === 'web' ? useWebGoogleAuth(options) : useNativeGoogleAuth(options);
}