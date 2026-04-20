'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { User, Session } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

interface AuthContextType {
  isAuthenticated: boolean
  userName: string | null
  userId: string | null
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  signup: (email: string, password: string, name: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      setLoading(false)
      return
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session: Session | null) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      return { ok: false, error: 'Auth is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local' }
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      return { ok: false, error: error.message }
    }
    if (data.user) {
      router.push('/room')
      return { ok: true }
    }
    return { ok: false, error: 'Sign in failed' }
  }

  const signup = async (email: string, password: string, name: string): Promise<{ ok: boolean; error?: string }> => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      return { ok: false, error: 'Auth is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local' }
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: name.trim() } },
    })
    if (error) {
      return { ok: false, error: error.message }
    }
    if (data.user) {
      router.push('/room')
      return { ok: true }
    }
    return { ok: false, error: 'Sign up failed' }
  }

  const logout = async () => {
    const supabase = getSupabaseBrowserClient()
    if (supabase) await supabase.auth.signOut()
    setUser(null)
    router.push('/')
  }

  const userName = user?.user_metadata?.name ?? user?.email ?? null
  const userId = user?.id ?? null
  const isAuthenticated = !!user

  return (
    <AuthContext.Provider value={{ isAuthenticated, userName, userId, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
