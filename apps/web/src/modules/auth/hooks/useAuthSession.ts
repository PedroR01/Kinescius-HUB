import { API_BASE } from "@/lib/constants";
import type { UserProfile } from "@/lib/user-interface";
import { useCallback, useEffect, useState } from "react";

export type UserRole = "admin" | "usuario" | "profesor";

const TOKEN_KEY = "miToken";
const ROLE_KEY = "rol";

function isUserRole(role: string | null): role is UserRole {
  return role === "admin" || role === "usuario" || role === "profesor";
}

function readSession() {
  const token = localStorage.getItem(TOKEN_KEY);
  const role = localStorage.getItem(ROLE_KEY);

  return {
    isAuthenticated: Boolean(token),
    role: isUserRole(role) ? role : null,
    isAdmin: role === "admin",
    isProfesor: role === "profesor",
  };
}

export function useAuthSession() {
  const [session, setSession] = useState({
    isAuthenticated: false,
    role: null as UserRole | null,
    isAdmin: false,
    isProfesor: false,
    isHydrated: false,
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
      isProfesor: false,
      isHydrated: true,
    });
  }, []);

  return { ...session, clearSession };
}

export function useCurrentUserProfile() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      try {
        const response = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        setUserProfile(data as UserProfile);
      } catch (error) {
        console.error("Error al obtener el perfil del usuario:", error);
      }
    };
    fetchUserProfile();
  }, []);
  
  return userProfile;
}