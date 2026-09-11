"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { User, Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
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
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session: Session | null) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
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
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return {
        ok: false,
        error:
          "Auth is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local",
      };
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      return { ok: false, error: error.message };
    }
    if (data.user) {
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
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return {
        ok: false,
        error:
          "Auth is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local",
      };
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: name.trim() } },
    });
    if (error) {
      return { ok: false, error: error.message };
    }
    if (data.user) {
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
    const supabase = getSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();
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
      const supabase = getSupabaseBrowserClient();
      const { data } = supabase
        ? await supabase.auth.getSession()
        : { data: { session: null } };
      if (!data.session?.access_token)
        throw new Error("Authentication required");
      headers.set("Authorization", `Bearer ${data.session.access_token}`);
      if (selectedPatient) headers.set("X-Mori-Patient-Id", selectedPatient);
    }
    return fetch(input, { ...init, headers });
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
