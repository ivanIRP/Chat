'use client'
import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

export default function HomePage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [mounted, setMounted] = useState(false)
  const { login, user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    try {
      setMounted(true)
    } catch {
      // Ignore mount errors
    }
  }, [])

  useEffect(() => {
    try {
      if (mounted && !authLoading && user) {
        router.push('/chat')
      }
    } catch (err) {
      console.error('[Home] Redirect error:', err)
    }
  }, [user, authLoading, mounted, router])

  const switchMode = useCallback((newMode: 'login' | 'register') => {
    try {
      setMode(newMode)
      setError('')
      setSuccess('')
    } catch {
      // Ignore errors
    }
  }, [])

  const isValidEmail = useCallback((email: string): boolean => {
    try {
      if (!email || typeof email !== 'string') return false
      const trimmed = email.trim().toLowerCase()
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(trimmed) && trimmed.length >= 5
    } catch {
      return false
    }
  }, [])

  const isValidUsername = useCallback((username: string): boolean => {
    try {
      if (!username || typeof username !== 'string') return false
      const trimmed = username.trim()
      return trimmed.length >= 3 && trimmed.length <= 30
    } catch {
      return false
    }
  }, [])

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    try {
      e.preventDefault()
      setError('')
      setSuccess('')

      if (!email || !email.trim()) {
        setError('El correo es requerido')
        return
      }

      if (!isValidEmail(email)) {
        setError('El formato del correo no es valido')
        return
      }

      if (!password || password.length < 4) {
        setError('La contrasena debe tener al menos 4 caracteres')
        return
      }

      setLoading(true)

      try {
        await login(email.trim().toLowerCase(), password)
        router.push('/chat')
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al iniciar sesion'
        if (errorMessage.includes('verificad') || errorMessage.includes('confirm')) {
          setError('Tu cuenta no ha sido verificada. Revisa tu correo.')
        } else {
          setError(errorMessage)
        }
      }
    } catch (err) {
      console.error('[Home] Login error:', err)
      setError('Error inesperado. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }, [email, password, login, router, isValidEmail])

  const handleRegister = useCallback(async (e: React.FormEvent) => {
    try {
      e.preventDefault()
      setError('')
      setSuccess('')

      if (!email || !email.trim()) {
        setError('El correo es requerido')
        return
      }

      if (!isValidEmail(email)) {
        setError('El formato del correo no es valido')
        return
      }

      if (!username || !username.trim()) {
        setError('El nombre de usuario es requerido')
        return
      }

      if (!isValidUsername(username)) {
        setError('El nombre de usuario debe tener 3-30 caracteres')
        return
      }

      setLoading(true)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: email.trim().toLowerCase(), 
            username: username.trim() 
          }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        let data: { error?: string; message?: string; success?: boolean }
        try {
          data = await res.json()
        } catch {
          throw new Error('Respuesta invalida del servidor')
        }

        if (!res.ok) {
          throw new Error(data.error || `Error ${res.status}`)
        }

        setSuccess(data.message || 'Cuenta creada. Revisa tu correo para confirmar tu cuenta y obtener tu contrasena.')
        setMode('login')
        setPassword('')
      } catch (err) {
        if (err instanceof Error) {
          if (err.name === 'AbortError') {
            setError('Tiempo de espera agotado. Intenta de nuevo.')
          } else {
            setError(err.message)
          }
        } else {
          setError('Error al registrar. Intenta de nuevo.')
        }
      }
    } catch (err) {
      console.error('[Home] Register error:', err)
      setError('Error inesperado. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }, [email, username, isValidEmail, isValidUsername])

  const togglePassword = useCallback(() => {
    try {
      setShowPass(prev => !prev)
    } catch {
      // Ignore toggle errors
    }
  }, [])

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const value = e.target.value || ''
      setEmail(value.slice(0, 255))
      if (error) setError('')
    } catch {
      // Ignore input errors
    }
  }, [error])

  const handleUsernameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const value = e.target.value || ''
      setUsername(value.slice(0, 30))
      if (error) setError('')
    } catch {
      // Ignore input errors
    }
  }, [error])

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const value = e.target.value || ''
      setPassword(value.slice(0, 128))
      if (error) setError('')
    } catch {
      // Ignore input errors
    }
  }, [error])

  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center wz-grid-bg">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-wz-cyan)' }} />
          <p style={{ color: 'var(--color-wz-text-muted)' }} className="text-sm">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 wz-grid-bg">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="wz-card p-8">
          {/* Logo */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold tracking-wider mb-2">
              <span style={{ color: 'var(--color-wz-text)' }}>WZ</span>
              <span style={{ color: 'var(--color-wz-cyan)' }}>CHAT</span>
            </h1>
            <p style={{ color: 'var(--color-wz-text-muted)' }} className="text-sm uppercase tracking-widest">
              {mode === 'login' ? 'Establecer Conexion' : 'Crear Cuenta'}
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="wz-error mb-4 flex items-start gap-3">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          
          {success && (
            <div className="wz-success mb-4 flex items-start gap-3">
              <CheckCircle size={18} className="shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-5">
            {mode === 'register' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="wz-label">Nombre de Usuario</label>
                </div>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-wz-text-muted)' }} />
                  <input
                    type="text"
                    value={username}
                    onChange={handleUsernameChange}
                    required
                    placeholder="tu_nombre"
                    autoComplete="username"
                    className="wz-input pl-11"
                  />
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="wz-label">Email</label>
              </div>
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                required
                placeholder="correo@ejemplo.com"
                autoComplete="email"
                className="wz-input"
              />
            </div>

            {mode === 'login' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="wz-label">Contrasena</label>
                  <button
                    type="button"
                    className="wz-link text-xs"
                    onClick={() => {/* Future: password reset */}}
                  >
                    ¿Olvidaste?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={handlePasswordChange}
                    required
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="wz-input pr-12"
                  />
                  <button
                    type="button"
                    onClick={togglePassword}
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors p-1"
                    style={{ color: 'var(--color-wz-text-muted)' }}
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div className="wz-warning text-xs">
                <p>Te enviaremos un correo con tu contrasena y un enlace de confirmacion. Debes confirmar tu cuenta antes de poder iniciar sesion.</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="wz-button flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {mode === 'login' ? 'Conectando...' : 'Registrando...'}
                </>
              ) : (
                mode === 'login' ? 'Iniciar Sesion' : 'Registrarse'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="wz-divider" />

          {/* Switch mode */}
          <div className="text-center">
            <p style={{ color: 'var(--color-wz-text-muted)' }} className="text-sm">
              {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
              <button
                type="button"
                onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                className="wz-link font-semibold"
              >
                {mode === 'login' ? 'Registrate' : 'Inicia Sesion'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
