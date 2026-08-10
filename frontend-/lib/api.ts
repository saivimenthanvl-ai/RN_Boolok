import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'userToken';

// ⚠️ FALLBACK ONLY — used if EXPO_PUBLIC_API_URL_NATIVE / EXPO_PUBLIC_API_URL
// are somehow missing from a production build. Replace with your real
// deployed backend URL (Render / Railway / your VPS, etc). This is a safety
// net, not the primary config path — see eas.json for the real fix.
const PRODUCTION_FALLBACK_API_URL = 'https://YOUR-BACKEND-DOMAIN.example.com';

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function getMetroHost(): string | null {
  const hostUri =
    (Constants as any).expoConfig?.hostUri ??
    (Constants as any).expoGoConfig?.hostUri ??
    (Constants as any).manifest2?.extra?.expoClient?.hostUri ??
    (Constants as any).manifest?.debuggerHost ??
    (Constants as any).manifest?.hostUri ??
    null;

  if (!hostUri || typeof hostUri !== 'string') {
    return null;
  }

  const withoutProtocol = hostUri.replace(/^https?:\/\//, '');
  const host = withoutProtocol.split(':')[0];

  return host || null;
}

/**
 * True when running inside Expo Go / a dev client connected to Metro.
 * A standalone production/preview build (installed .apk/.aab/.ipa) will
 * NOT have a Metro host, which is how we tell "am I really in the field".
 */
function isRunningUnderMetro(): boolean {
  return getMetroHost() !== null;
}

function resolveApiBaseUrl(): string {
  const webUrl = process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_API_BASE_URL;

  if (Platform.OS === 'web') {
    const resolved = stripTrailingSlash(webUrl || 'http://localhost:5000');

    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && resolved.startsWith('http://')) {
      console.error(
        `Production site cannot call insecure/local API URL: ${resolved}. ` +
        'Set EXPO_PUBLIC_API_URL in Vercel to your public HTTPS backend URL.'
      );
    }

    return resolved;
  }

  // Native (Android / iOS)
  const explicitNative = process.env.EXPO_PUBLIC_API_URL_NATIVE;

  if (explicitNative) {
    return stripTrailingSlash(explicitNative);
  }

  // Dev client / Expo Go — reuse the Metro bundler's host so a device on
  // the same Wi-Fi can reach your laptop's dev backend.
  if (isRunningUnderMetro()) {
    const metroHost = getMetroHost();
    if (metroHost) {
      return `http://${metroHost}:5000`;
    }
  }

  // Standalone production/preview build with no env var set — DO NOT fall
  // back to localhost (the device has no such server). This is what was
  // causing the "Network Error" on the built APK.
  if (webUrl) {
    return stripTrailingSlash(webUrl);
  }

  console.error(
    '[api] No EXPO_PUBLIC_API_URL_NATIVE / EXPO_PUBLIC_API_URL set for this native build. ' +
    `Falling back to ${PRODUCTION_FALLBACK_API_URL} — set the real env var in eas.json instead.`
  );
  return PRODUCTION_FALLBACK_API_URL;
}

export const API_BASE_URL = resolveApiBaseUrl();

async function getStoredToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Central API fetch helper that automatically attaches the Authorization JWT token header.
 */
export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getStoredToken();
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${path}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    (error as any).status = response.status;
    (error as any).data = data;
    throw error;
  }

  return data as T;
}

const WEB_AUTH_CALLBACK_PATH = '/auth-callback';

type GoogleAuthOptions = {
  onSuccess: (idToken: string) => Promise<void>;
  onError?: (message: string) => void;
};

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

    try {
      const { GoogleSignin, statusCodes } = require('@react-native-google-signin/google-signin');

      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      const result = await GoogleSignin.signIn();
      const idToken = result?.data?.idToken ?? result?.idToken;

      if (!idToken) {
        throw new Error('Google did not return an ID token.');
      }

      await onSuccess(idToken);
    } catch (error: any) {
      const { statusCodes } = require('@react-native-google-signin/google-signin');

      if (error?.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled the sign-in flow intentionally
      } else if (error?.code === statusCodes.IN_PROGRESS) {
        // Operation (e.g. sign in) is in progress already
      } else if (error?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        onError?.('Play services not available or outdated.');
      } else if (error?.code === statusCodes.DEVELOPER_ERROR) {
        onError?.(
          'Google Sign-In is misconfigured for this build (DEVELOPER_ERROR). ' +
          'The SHA-1 fingerprint of this build does not match the one registered in Google Cloud Console for this package name.'
        );
      } else {
        onError?.(error?.message || 'Google sign-in failed.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  }, [configurationError, onError, onSuccess]);

  return { promptGoogleSignIn, isGoogleLoading };
}

function useWebGoogleAuth({ onSuccess, onError }: GoogleAuthOptions) {
  const WebBrowser = require('expo-web-browser');
  const AuthSession = require('expo-auth-session');
  const Google = require('expo-auth-session/providers/google');

  WebBrowser.maybeCompleteAuthSession();

  const redirectUri = useMemo(() => {
    if (typeof window !== 'undefined' && window.location?.origin) {
      return `${window.location.origin}${WEB_AUTH_CALLBACK_PATH}`;
    }

    return AuthSession.makeRedirectUri({
      preferLocalhost: true,
      path: WEB_AUTH_CALLBACK_PATH,
    });
  }, []);

  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

  const [isExchanging, setIsExchanging] = useState(false);
  const [nonce] = useState(() => `${Date.now()}-${Math.random().toString(36).slice(2)}`);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId,
    redirectUri,
    responseType: AuthSession.ResponseType.IdToken,
    scopes: ['openid', 'profile', 'email'],
    selectAccount: true,
    extraParams: {
      nonce,
      prompt: 'select_account',
    },
  });

  useEffect(() => {
    async function processResponse() {
      if (!response) return;

      if (response.type === 'error') {
        onError?.(response.error?.message || 'Google authentication returned an error.');
        return;
      }

      if (response.type === 'dismiss' || response.type === 'cancel') {
        return;
      }

      if (response.type !== 'success') return;

      const idToken = response.authentication?.idToken || response.params?.id_token;

      if (!idToken) {
        onError?.('Google did not return an ID token.');
        return;
      }

      setIsExchanging(true);

      try {
        await onSuccess(idToken);
      } catch (error: any) {
        onError?.(error?.message || 'Google sign-in failed.');
      } finally {
        setIsExchanging(false);
      }
    }

    processResponse();
  }, [onError, onSuccess, response]);

  const promptGoogleSignIn = useCallback(async () => {
    if (!webClientId) {
      onError?.('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is missing.');
      return;
    }

    if (!request) {
      onError?.('Google Sign-In is still loading. Try again.');
      return;
    }

    await promptAsync({
      useProxy: false,
      windowFeatures: { width: 500, height: 650 },
    });
  }, [onError, promptAsync, request, webClientId]);

  return {
    promptGoogleSignIn,
    isGoogleLoading: !request || isExchanging,
  };
}

export function useGoogleAuth(options: GoogleAuthOptions) {
  return Platform.OS === 'web' ? useWebGoogleAuth(options) : useNativeGoogleAuth(options);
}