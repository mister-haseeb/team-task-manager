import { createContext } from 'react';

// { user, loading, login, register, logout } — provided by <AuthProvider>
export const AuthContext = createContext(null);
