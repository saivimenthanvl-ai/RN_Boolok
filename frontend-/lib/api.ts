import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

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

function resolveApiBaseUrl(): string {
  const webUrl =
    process.env.EXPO_PUBLIC_API_URL ||
    process.env.EXPO_PUBLIC_API_BASE_URL;

  if (Platform.OS === 'web') {
    const resolved = stripTrailingSlash(webUrl || 'http://localhost:5000');

    if (
      typeof window !== 'undefined' &&
      window.location.protocol === 'https:' &&
      resolved.startsWith('http://')
    ) {
      console.error(
        `Production site cannot call insecure/local API URL: ${resolved}. ` +
        'Set EXPO_PUBLIC_API_URL in Vercel to your public HTTPS backend URL.'
      );
    }

    return resolved;
  }

  const explicitNative = process.env.EXPO_PUBLIC_API_URL_NATIVE;

  if (explicitNative) {
    return stripTrailingSlash(explicitNative);
  }

  const metroHost = getMetroHost();

  if (metroHost) {
    return `http://${metroHost}:5000`;
  }

  return stripTrailingSlash(webUrl || 'http://localhost:5000');
}

export const API_BASE_URL = resolveApiBaseUrl();

// Dedicated route the OAuth popup redirects back to. This route must exist
// in app/ (e.g. app/auth-callback.tsx) and must call
// WebBrowser.maybeCompleteAuthSession() itself on mount, otherwise the
// popup will load that page but never close / hand the token back.
const WEB_AUTH_CALLBACK_PATH = '/auth-callback';

type GoogleAuthOptions = {
  onSuccess: (idToken: string) => Promise<void>;
  onError?: (message: string) => void;
};

function useNativeGoogleAuth({ onSuccess, onError }: GoogleAuthOptions) {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [configurationError, setConfigurationError] = useState<string | null>(
    null
  );

  useEffect(() => {
    try {
      const { GoogleSignin } = require(
        '@react-native-google-signin/google-signin'
      );

      const webClientId =
        process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

      if (!webClientId) {
        throw new Error(
          'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is missing.'
        );
      }

      GoogleSignin.configure({
        webClientId,
        offlineAccess: false,
      });
    } catch (error: any) {
      const message =
        error?.message ||
        'Google Sign-In could not be configured. Rebuild the native app after installing the Google Sign-In package.';

      console.error(message);
      setConfigurationError(message);
    }
  }, []);

  const promptGoogleSignIn = useCallback(async () => {
    if (configurationError) {
      onError?.(configurationError);
      return;
    }

    setIsGoogleLoading(true);

    try {
      const { GoogleSignin, statusCodes } = require(
        '@react-native-google-signin/google-signin'
      );

      await GoogleSignin.hasPlayServices();

      const result = await GoogleSignin.signIn();
      const idToken = result?.data?.idToken ?? result?.idToken;

      if (!idToken) {
        throw new Error('Google did not return an ID token.');
      }

      await onSuccess(idToken);
    } catch (error: any) {
      const { statusCodes } = require(
        '@react-native-google-signin/google-signin'
      );

      if (error?.code !== statusCodes?.SIGN_IN_CANCELLED) {
        onError?.(error?.message || 'Google sign-in failed.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  }, [configurationError, onError, onSuccess]);

  return {
    promptGoogleSignIn,
    isGoogleLoading,
  };
}

function useWebGoogleAuth({ onSuccess, onError }: GoogleAuthOptions) {
  const WebBrowser = require('expo-web-browser');
  const AuthSession = require('expo-auth-session');
  const Google = require('expo-auth-session/providers/google');

  // If this page IS the callback page (popup landed back here), this closes
  // the popup and posts the result back to the window that opened it.
  WebBrowser.maybeCompleteAuthSession();

  // FIX: point Google at a dedicated callback route instead of the bare
  // origin. Redirecting to "/" sends the popup to the app's root/splash
  // screen, which never calls maybeCompleteAuthSession() and never closes —
  // that's why the popup got stuck on "OPTIMIZING WORKSPACE...".
  const redirectUri = useMemo(() => {
    if (typeof window !== 'undefined' && window.location?.origin) {
      return `${window.location.origin}${WEB_AUTH_CALLBACK_PATH}`;
    }

    return AuthSession.makeRedirectUri({
      preferLocalhost: true,
      path: WEB_AUTH_CALLBACK_PATH,
    });
  }, []);

  const webClientId =
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

  const [isExchanging, setIsExchanging] = useState(false);
  const [nonce] = useState(() =>
    `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );

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
        onError?.(
          response.error?.message ||
          'Google authentication returned an error.'
        );
        return;
      }

      if (response.type === 'dismiss' || response.type === 'cancel') {
        // User closed the popup manually — not an error, just stop loading.
        return;
      }

      if (response.type !== 'success') return;

      const idToken =
        response.authentication?.idToken ||
        response.params?.id_token;

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
      onError?.(
        'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is missing.'
      );
      return;
    }

    if (!request) {
      onError?.('Google Sign-In is still loading. Try again.');
      return;
    }

    await promptAsync({
      useProxy: false,
      windowFeatures: {
        width: 500,
        height: 650,
      },
    });
  }, [onError, promptAsync, request, webClientId]);

  return {
    promptGoogleSignIn,
    isGoogleLoading: !request || isExchanging,
  };
}

export function useGoogleAuth(options: GoogleAuthOptions) {
  return Platform.OS === 'web'
    ? useWebGoogleAuth(options)
    : useNativeGoogleAuth(options);
}