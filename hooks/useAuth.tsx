'use client'
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'

interface User {
  id: string
  email: string
  username: string
  avatar_color: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
  error: string | null
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

// Safe localStorage operations
const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window === 'undefined') return null
      const value = localStorage.getItem(key)
      return value && typeof value === 'string' ? value : null
    } catch (error) {
      console.error('[Auth Storage] Error reading:', error)
      return null
    }
  },
  setItem: (key: string, value: string): boolean => {
    try {
      if (typeof window === 'undefined') return false
      if (!value || typeof value !== 'string') return false
      localStorage.setItem(key, value)
      return true
    } catch (error) {
      console.error('[Auth Storage] Error writing:', error)
      return false
    }
  },
  removeItem: (key: string): boolean => {
    try {
      if (typeof window === 'undefined') return false
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error('[Auth Storage] Error removing:', error)
      return false
    }
  },
}

// Validate user object structure
function isValidUser(user: unknown): user is User {
  try {
    if (!user || typeof user !== 'object') return false
    const u = user as Record<string, unknown>
    return (
      typeof u.id === 'string' && u.id.length > 0 &&
      typeof u.email === 'string' && u.email.includes('@') &&
      typeof u.username === 'string' && u.username.length > 0 &&
      typeof u.avatar_color === 'string'
    )
  } catch {
    return false
  }
}

// Parse stored user safely
function parseStoredUser(stored: string | null): User | null {
  try {
    if (!stored || typeof stored !== 'string') return null
    const parsed = JSON.parse(stored)
    return isValidUser(parsed) ? parsed : null
  } catch (error) {
    console.error('[Auth] Error parsing stored user:', error)
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize auth state from storage
  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true)
        
        const storedUser = safeStorage.getItem('chat_user')
        const storedToken = safeStorage.getItem('chat_token')

        if (storedUser && storedToken) {
          const parsedUser = parseStoredUser(storedUser)
          
          if (parsedUser && storedToken.length > 10) {
            setUser(parsedUser)
            setToken(storedToken)
          } else {
            // Invalid stored data, clear it
            safeStorage.removeItem('chat_user')
            safeStorage.removeItem('chat_token')
          }
        }
      } catch (err) {
        console.error('[Auth] Init error:', err)
        setError('Error al inicializar autenticacion')
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  // Login function with comprehensive error handling
  const login = useCallback(async (email: string, password: string): Promise<void> => {
    // Validate inputs
    if (!email || typeof email !== 'string') {
      throw new Error('El correo es requerido')
    }
    
    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail.includes('@') || trimmedEmail.length < 5) {
      throw new Error('El correo no es valido')
    }

    if (!password || typeof password !== 'string') {
      throw new Error('La contrasena es requerida')
    }

    if (password.length < 4) {
      throw new Error('La contrasena es muy corta')
    }

    setError(null)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, password }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Parse response
      let data: { user?: User; token?: string; error?: string }
      try {
        data = await response.json()
      } catch {
        throw new Error('Respuesta invalida del servidor')
      }

      // Check for HTTP errors
      if (!response.ok) {
        const errorMessage = data?.error || `Error ${response.status}`
        throw new Error(errorMessage)
      }

      // Validate response data
      if (!data.user || !isValidUser(data.user)) {
        throw new Error('Datos de usuario invalidos')
      }

      if (!data.token || typeof data.token !== 'string' || data.token.length < 10) {
        throw new Error('Token de autenticacion invalido')
      }

      // Store credentials
      const userStored = safeStorage.setItem('chat_user', JSON.stringify(data.user))
      const tokenStored = safeStorage.setItem('chat_token', data.token)

      if (!userStored || !tokenStored) {
        console.warn('[Auth] Warning: Could not persist session')
      }

      // Update state
      setUser(data.user)
      setToken(data.token)
      setError(null)
    } catch (err) {
      let errorMessage: string
      
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          errorMessage = 'Tiempo de espera agotado. Intenta de nuevo.'
        } else {
          errorMessage = err.message
        }
      } else {
        errorMessage = 'Error desconocido al iniciar sesion'
      }

      console.error('[Auth] Login error:', errorMessage)
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  // Logout function
  const logout = useCallback(() => {
    try {
      setUser(null)
      setToken(null)
      setError(null)
      safeStorage.removeItem('chat_user')
      safeStorage.removeItem('chat_token')
    } catch (err) {
      console.error('[Auth] Logout error:', err)
      // Force clear state even if storage fails
      setUser(null)
      setToken(null)
    }
  }, [])

  // Clear error function
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const contextValue: AuthContextType = {
    user,
    token,
    login,
    logout,
    loading,
    error,
    clearError,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  
  return ctx
}
