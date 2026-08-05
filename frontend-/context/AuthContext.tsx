import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'userToken';
const USER_KEY = 'authUser';

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  profilePicture?: string | null;
  goal?: string | null;
  authProvider?: 'local' | 'google';
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (token: string, user: AuthUser) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function getStoredValue(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  return SecureStore.getItemAsync(key);
}

async function setStoredValue(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    window.localStorage.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

async function deleteStoredValue(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    window.localStorage.removeItem(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const [storedToken, storedUser] = await Promise.all([
          getStoredValue(TOKEN_KEY),
          getStoredValue(USER_KEY),
        ]);

        if (!active) return;

        if (!storedToken || !storedUser) {
          setToken(null);
          setUser(null);
          return;
        }

        const parsedUser = JSON.parse(storedUser) as AuthUser;

        if (!parsedUser?.id || !parsedUser?.email) {
          throw new Error('Stored user data is invalid.');
        }

        setToken(storedToken);
        setUser(parsedUser);
      } catch (error) {
        console.error('Failed to restore authentication:', error);

        await Promise.allSettled([
          deleteStoredValue(TOKEN_KEY),
          deleteStoredValue(USER_KEY),
        ]);

        if (active) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (nextToken: string, nextUser: AuthUser) => {
    if (!nextToken || !nextUser?.id || !nextUser?.email) {
      throw new Error('Backend returned an invalid authentication response.');
    }

    await Promise.all([
      setStoredValue(TOKEN_KEY, nextToken),
      setStoredValue(USER_KEY, JSON.stringify(nextUser)),
    ]);

    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const signOut = useCallback(async () => {
    await Promise.allSettled([
      deleteStoredValue(TOKEN_KEY),
      deleteStoredValue(USER_KEY),
    ]);

    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(user && token),
      signIn,
      signOut,
    }),
    [user, token, loading, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
