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

export type AuthUser = {
  id: string;
  _id?: string;
  fullName: string;
  username?: string | null;
  email: string;
  profilePicture?: string | null;
  coverImage?: string | null;
  headline?: string | null;
  location?: string | null;
  bio?: string | null;
  closedDeals?: string | null;
  goal?: string | null;
  role?: string | null;
  authProvider?: string | null;
  followers?: any[];
  following?: any[];
  followerCount?: number;
  followingCount?: number;
};

type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (token: string, user: AuthUser) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (updatedFields: Partial<AuthUser>) => Promise<void>;
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

  const updateUser = async (updatedFields: Partial<AuthUser>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updatedFields };
    await saveValue(USER_KEY, JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const isAuthenticated = useMemo(() => Boolean(token && user), [token, user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        signIn,
        signOut,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}