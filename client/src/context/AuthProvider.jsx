import { useCallback, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/auth';
import { onUnauthorized } from '../api/client';
import { AuthContext } from './authContext';

// Loads the current user from the session cookie and exposes login/register/logout.
export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi
      .me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));

    // If any request comes back 401 the session is gone: show the login page
    onUnauthorized(() => setUser(null));
  }, []);

  const login = useCallback(async (credentials) => setUser(await authApi.login(credentials)), []);
  const register = useCallback(async (details) => setUser(await authApi.register(details)), []);
  const logout = useCallback(async () => {
    await authApi.logout().catch(() => {});
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
