import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { useRouter, useSegments } from 'expo-router';
import { api, storeTokens, clearTokens, getStoredTokens, ApiError } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  familyId: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
    familyName: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function useProtectedRoute(user: User | null, isLoading: boolean) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/login');
    } else if (user && inAuthGroup) {
      router.replace('/');
    }
  }, [user, segments, isLoading, router]);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useProtectedRoute(user, isLoading);

  useEffect(() => {
    const initAuth = async () => {
      const { accessToken } = await getStoredTokens();
      if (accessToken) {
        try {
          const userData = await api.auth.me();
          setUser({
            id: userData.id,
            email: userData.email,
            name: userData.name,
            familyId: userData.familyId,
            role: userData.role,
          });
        } catch {
          await clearTokens();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await api.auth.login({ email, password });
      await storeTokens(response.accessToken, response.refreshToken);
      setUser({
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        familyId: response.user.familyId,
        role: response.user.role,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(
    async (
      email: string,
      password: string,
      name: string,
      familyName: string
    ) => {
      setError(null);
      setIsLoading(true);
      try {
        const response = await api.auth.register({
          email,
          password,
          name,
          familyName,
        });
        await storeTokens(response.accessToken, response.refreshToken);
        setUser({
          id: response.user.id,
          email: response.user.email,
          name: response.user.name,
          familyId: response.user.familyId,
          role: response.user.role,
        });
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('An unexpected error occurred');
        }
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    const { refreshToken } = await getStoredTokens();
    if (refreshToken) {
      try {
        await api.auth.logout(refreshToken);
      } catch {
        // Ignore errors during logout
      }
    }
    await clearTokens();
    setUser(null);
    router.replace('/login');
  }, [router]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
