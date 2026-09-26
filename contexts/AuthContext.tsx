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
import {
  type AccountRelationship,
  isAccountRelationship,
} from "@/lib/auth/account-role";

interface AuthContextType {
  isAuthenticated: boolean;
  userName: string | null;
  userId: string | null;
  accountRelationship: AccountRelationship | null;
  selectPatient: (id: string) => void;
  login: (
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  signup: (
    email: string,
    password: string,
    name: string,
    relationship: AccountRelationship,
  ) => Promise<{ ok: boolean; error?: string; requiresEmailConfirmation?: boolean }>;
  chooseRelationship: (
    relationship: AccountRelationship,
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  enterDemo: (code: string) => Promise<{ ok: boolean; error?: string }>;
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
    Promise.all([
      fetch('/api/auth/session', { credentials: 'same-origin' }).then(async (response) => response.ok ? response.json() : { user: null }),
      fetch('/api/demo/access', { credentials: 'same-origin' }).then(async (response) => response.ok ? response.json() : { authorized: false }),
    ])
      .then(([{ user }, demo]) => { setUser(user ?? null); setDemoMode(Boolean(demo.authorized) && window.localStorage.getItem("mori_demo_mode") === "true") })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (
    email: string,
    password: string,
  ): Promise<{ ok: boolean; error?: string }> => {
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
      const relationship = data.user.user_metadata?.relationship_to_mori;
      router.push(isAccountRelationship(relationship) ? "/room" : "/onboarding");
      return { ok: true };
    }
    return { ok: false, error: "Sign in failed" };
  };

  const signup = async (
    email: string,
    password: string,
    name: string,
    relationship: AccountRelationship,
  ): Promise<{ ok: boolean; error?: string; requiresEmailConfirmation?: boolean }> => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password, name, relationship }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, error: data.error || 'Account creation failed' };
    if (data.requiresEmailConfirmation)
      return { ok: true, requiresEmailConfirmation: true };
    if (data.user) {
      setUser(data.user);
      setDemoMode(false);
      setSelectedPatient(null);
      window.localStorage.removeItem("mori_demo_mode");
      window.localStorage.removeItem("mori_selected_patient");
      router.push("/room/profile");
      return { ok: true };
    }
    return { ok: false, error: "Sign up failed" };
  };

  const chooseRelationship = async (relationship: AccountRelationship) => {
    const response = await fetch("/api/auth/onboarding", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ relationship }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok)
      return { ok: false, error: data.error || "Could not save your choice" };
    setUser(data.user);
    router.push("/room/profile");
    return { ok: true };
  };

  const logout = async () => {
    await Promise.all([
      fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => undefined),
      fetch('/api/demo/access', { method: 'DELETE', credentials: 'same-origin' }).catch(() => undefined),
    ]);
    setUser(null);
    setDemoMode(false);
    window.localStorage.removeItem("mori_demo_mode");
    window.localStorage.removeItem("mori_selected_patient");
    setSelectedPatient(null);
    router.push("/");
  };

  const enterDemo = async (code: string) => {
    const response = await fetch('/api/demo/access', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, error: data.error || 'Demo access is unavailable.' };
    window.localStorage.setItem("mori_demo_mode", "true");
    setDemoMode(true);
    setLoading(false);
    router.push("/room");
    return { ok: true };
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
  const relationshipValue = user?.user_metadata?.relationship_to_mori;
  const accountRelationship = isAccountRelationship(relationshipValue)
    ? relationshipValue
    : null;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userName,
        userId,
        accountRelationship,
        selectPatient,
        login,
        signup,
        chooseRelationship,
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
