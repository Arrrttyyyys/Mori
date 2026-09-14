"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { PILOT_DEMO_ACCOUNT } from "@/lib/demo-account";

interface AuthContextType {
  isAuthenticated: boolean;
  userName: string | null;
  userId: string | null;
  selectPatient: (id: string) => void;
  login: (
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  signup: (
    email: string,
    password: string,
    name: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  enterDemo: () => void;
  authorizedFetch: (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Promise<Response>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const selectPatient = (id: string) => {
    setSelectedPatient(id);
    window.localStorage.setItem("mori_selected_patient", id);
  };
  const router = useRouter();

  useEffect(() => {
    setSelectedPatient(window.localStorage.getItem("mori_selected_patient"));
    if (window.localStorage.getItem("mori_demo_mode") === "true") {
      setDemoMode(true);
      setLoading(false);
      return;
    }
    fetch('/api/auth/session', { credentials: 'same-origin' })
      .then(async (response) => response.ok ? response.json() : { user: null })
      .then(({ user }) => setUser(user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (
    email: string,
    password: string,
  ): Promise<{ ok: boolean; error?: string }> => {
    if (
      email.trim().toLowerCase() === PILOT_DEMO_ACCOUNT.email &&
      password === PILOT_DEMO_ACCOUNT.password
    ) {
      window.localStorage.setItem("mori_demo_mode", "true");
      setDemoMode(true);
      setLoading(false);
      router.push("/room");
      return { ok: true };
    }
    const response = await fetch('/api/auth/login', {
      method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, error: data.error || 'Sign in failed' };
    if (data.user) {
      setUser(data.user);
      setDemoMode(false);
      setSelectedPatient(null);
      window.localStorage.removeItem("mori_demo_mode");
      window.localStorage.removeItem("mori_selected_patient");
      router.push("/room");
      return { ok: true };
    }
    return { ok: false, error: "Sign in failed" };
  };

  const signup = async (
    email: string,
    password: string,
    name: string,
  ): Promise<{ ok: boolean; error?: string }> => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, error: data.error || 'Account creation failed' };
    if (data.requiresEmailConfirmation) return { ok: false, error: 'Check your email to confirm your account, then sign in.' };
    if (data.user) {
      setUser(data.user);
      setDemoMode(false);
      setSelectedPatient(null);
      window.localStorage.removeItem("mori_demo_mode");
      window.localStorage.removeItem("mori_selected_patient");
      router.push("/room");
      return { ok: true };
    }
    return { ok: false, error: "Sign up failed" };
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => undefined);
    setUser(null);
    setDemoMode(false);
    window.localStorage.removeItem("mori_demo_mode");
    window.localStorage.removeItem("mori_selected_patient");
    setSelectedPatient(null);
    router.push("/");
  };

  const enterDemo = () => {
    window.localStorage.setItem("mori_demo_mode", "true");
    setDemoMode(true);
    setLoading(false);
    router.push("/room");
  };

  const authorizedFetch = async (
    input: RequestInfo | URL,
    init: RequestInit = {},
  ) => {
    const headers = new Headers(init.headers);
    if (demoMode) {
      headers.set("X-Mori-Demo-Mode", "true");
    } else {
      if (selectedPatient) headers.set("X-Mori-Patient-Id", selectedPatient);
    }
    const response = await fetch(input, { ...init, headers, credentials: 'same-origin' });
    if (response.status === 401) setUser(null);
    return response;
  };

  const userName = demoMode
    ? "Margaret"
    : (user?.user_metadata?.name ?? user?.email ?? null);
  const userId = demoMode
    ? "demo_patient"
    : (selectedPatient ?? user?.id ?? null);
  const isAuthenticated = !!user || demoMode;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userName,
        userId,
        selectPatient,
        login,
        signup,
        logout,
        enterDemo,
        authorizedFetch,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
