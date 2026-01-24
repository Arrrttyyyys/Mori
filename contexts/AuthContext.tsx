'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  isAuthenticated: boolean
  userName: string | null
  login: (email: string, password: string) => boolean
  signup: (email: string, password: string, name: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated on mount
    const authStatus = localStorage.getItem('mori_authenticated')
    const storedName = localStorage.getItem('mori_user_name')
    if (authStatus === 'true') {
      setIsAuthenticated(true)
      if (storedName) {
        setUserName(storedName)
      }
    }
  }, [])

  const login = (email: string, password: string): boolean => {
    // Hardcoded credentials
    if (email === 'arty' && password === '1234') {
      setIsAuthenticated(true)
      const storedName = localStorage.getItem('mori_user_name') || 'Sarah'
      setUserName(storedName)
      localStorage.setItem('mori_authenticated', 'true')
      router.push('/room')
      return true
    }
    return false
  }

  const signup = (email: string, password: string, name: string): boolean => {
    // Store user data
    setIsAuthenticated(true)
    setUserName(name)
    localStorage.setItem('mori_authenticated', 'true')
    localStorage.setItem('mori_user_name', name)
    localStorage.setItem('mori_user_email', email)
    router.push('/room')
    return true
  }

  const logout = () => {
    setIsAuthenticated(false)
    setUserName(null)
    localStorage.removeItem('mori_authenticated')
    localStorage.removeItem('mori_user_name')
    localStorage.removeItem('mori_user_email')
    router.push('/')
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, userName, login, signup, logout }}>
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
