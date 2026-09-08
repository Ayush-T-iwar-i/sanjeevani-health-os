import { useMemo } from 'react';

interface AuthUser {
  userId: string;
  role: 'patient' | 'asha' | 'anm' | 'cho' | 'doctor' | 'facility_admin' | 'super_admin';
  facilityId?: string;
}

function decodeJwt(token: string): AuthUser | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

export function useAuth() {
  const token = localStorage.getItem('sanjeevani_jwt');

  const user = useMemo(() => (token ? decodeJwt(token) : null), [token]);

  const login = (jwt: string) => {
    localStorage.setItem('sanjeevani_jwt', jwt);
    window.location.href = '/';
  };

  const logout = () => {
    localStorage.removeItem('sanjeevani_jwt');
    window.location.href = '/login';
  };

  return { user, isAuthenticated: !!user, login, logout };
}