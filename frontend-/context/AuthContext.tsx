import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'userToken';
const USER_KEY = 'userData';

type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  profilePicture?: string | null;
  goal?: string | null;
};

// FIX: app/(app)/_layout.tsx does:
//   const { user, signOut, isAuthenticated } = useAuth();
//   if (!isAuthenticated) return <Redirect href="/(auth)/login" />;
//
// `isAuthenticated` never existed on this type, so TypeScript failed the
// build (Vercel builds fail the WHOLE deploy on a type error, not just
// that file) — which is why nothing past login ever rendered in prod.
// Added below as a derived boolean (true once we have both a token and a
// user), no new state needed.
type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (token: string, user: AuthUser) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function saveValue(key: string, value: string) {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function readValue(key: string) {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function removeValue(key: string) {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

// NAMED export — do not change to `export default`.
// app/_layout.tsx imports this as: import { AuthProvider } from '../context/AuthContext';
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedToken = await readValue(TOKEN_KEY);
        const storedUser = await readValue(USER_KEY);

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to restore authentication session:', error);
        await removeValue(TOKEN_KEY);
        await removeValue(USER_KEY);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const signIn = async (newToken: string, newUser: AuthUser) => {
    await saveValue(TOKEN_KEY, newToken);
    await saveValue(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const signOut = async () => {
    await removeValue(TOKEN_KEY);
    await removeValue(USER_KEY);
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = useMemo(() => Boolean(token && user), [token, user]);

  return (
    <AuthContext.Provider
      value={{ user, token, loading, isAuthenticated, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// NAMED export — components use: import { useAuth } from '../context/AuthContext';
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}