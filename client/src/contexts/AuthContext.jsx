import React from 'react';
import { authApi, clearTokens, getAccessToken, setTokens } from '../utils/api';

const AuthContext = React.createContext(null);

function emptyAuthForm() {
  return {
    username: '',
    email: '',
    password: '',
    displayName: '',
    role: '',
  };
}

export function AuthProvider({ children }) {
  // authLoading prevents the app from flashing the login screen while /me is running.
  const [authLoading, setAuthLoading] = React.useState(true);
  const [user, setUser] = React.useState(null);
  const [authMode, setAuthMode] = React.useState('login');
  const [authSubmitting, setAuthSubmitting] = React.useState(false);
  const [authError, setAuthError] = React.useState('');
  const [authForm, setAuthForm] = React.useState(emptyAuthForm());

  React.useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      if (!getAccessToken()) {
        if (mounted) setAuthLoading(false);
        return;
      }

      try {
        const me = await authApi.me();
        if (mounted) setUser(me);
      } catch {
        clearTokens();
        if (mounted) setUser(null);
      } finally {
        if (mounted) setAuthLoading(false);
      }
    }

    bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  const switchAuthMode = React.useCallback((mode) => {
    setAuthMode(mode === 'register' ? 'register' : 'login');
    setAuthError('');
    setAuthSubmitting(false);
    setAuthForm(emptyAuthForm());
  }, []);

  const submitAuth = React.useCallback(async () => {
    if (authSubmitting) return false;

    setAuthSubmitting(true);
    setAuthError('');

    try {
      const data = authMode === 'login'
        ? await authApi.login({ email: authForm.email, password: authForm.password })
        : await authApi.register(authForm);

      setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      setAuthSubmitting(false);
      setAuthForm(emptyAuthForm());
      return true;
    } catch (error) {
      setAuthSubmitting(false);
      setAuthError(error.message);
      return false;
    }
  }, [authForm, authMode, authSubmitting]);

  const logout = React.useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Client cleanup still needs to run if the server already rejected or expired the token.
    }
    clearTokens();
    setUser(null);
    setAuthMode('login');
    setAuthForm(emptyAuthForm());
  }, []);

  const value = React.useMemo(() => ({
    authLoading,
    user,
    setUser,
    authMode,
    switchAuthMode,
    authSubmitting,
    authError,
    authForm,
    setAuthForm,
    submitAuth,
    logout,
  }), [authError, authForm, authLoading, authMode, authSubmitting, logout, submitAuth, switchAuthMode, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}