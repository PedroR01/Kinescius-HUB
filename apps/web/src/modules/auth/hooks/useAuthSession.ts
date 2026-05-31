import { useCallback, useEffect, useState } from "react";

export type UserRole = "admin" | "usuario";

const TOKEN_KEY = "miToken";
const ROLE_KEY = "rol";

function readSession() {
  const token = localStorage.getItem(TOKEN_KEY);
  const role = localStorage.getItem(ROLE_KEY) as UserRole | null;

  return {
    isAuthenticated: Boolean(token),
    role: role === "admin" || role === "usuario" ? role : null,
    isAdmin: role === "admin"
  };
}

export function useAuthSession() {
  const [session, setSession] = useState({
    isAuthenticated: false,
    role: null as UserRole | null,
    isAdmin: false,
    isHydrated: false
  });

  useEffect(() => {
    setSession({ ...readSession(), isHydrated: true });
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    setSession({
      isAuthenticated: false,
      role: null,
      isAdmin: false,
      isHydrated: true
    });
  }, []);

  return { ...session, clearSession };
}
