'use client'
import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { MessageSquare, Mail, Lock, User, Eye, EyeOff, Shield, AlertCircle, CheckCircle, Sparkles, Bot } from 'lucide-react'

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

  // Mark component as mounted
  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirect if already logged in
  useEffect(() => {
    try {
      if (mounted && !authLoading && user) {
        router.push('/chat')
      }
    } catch (err) {
      console.error('[Home] Redirect error:', err)
    }
  }, [user, authLoading, mounted, router])

  // Safe mode switch
  const switchMode = useCallback((newMode: 'login' | 'register') => {
    try {
      setMode(newMode)
      setError('')
      setSuccess('')
    } catch (err) {
      console.error('[Home] Mode switch error:', err)
    }
  }, [])

  // Validate email format
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

  // Validate username format
  const isValidUsername = useCallback((username: string): boolean => {
    try {
      if (!username || typeof username !== 'string') return false
      const trimmed = username.trim()
      const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/
      return usernameRegex.test(trimmed)
    } catch {
      return false
    }
  }, [])

  // Handle login with comprehensive error handling
  const handleLogin = useCallback(async (e: React.FormEvent) => {
    try {
      e.preventDefault()
      
      // Reset state
      setError('')
      setSuccess('')

      // Validate inputs
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
        setError(errorMessage)
      }
    } catch (err) {
      console.error('[Home] Login error:', err)
      setError('Error inesperado. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }, [email, password, login, router, isValidEmail])

  // Handle registration with comprehensive error handling
  const handleRegister = useCallback(async (e: React.FormEvent) => {
    try {
      e.preventDefault()
      
      // Reset state
      setError('')
      setSuccess('')

      // Validate email
      if (!email || !email.trim()) {
        setError('El correo es requerido')
        return
      }

      if (!isValidEmail(email)) {
        setError('El formato del correo no es valido')
        return
      }

      // Validate username
      if (!username || !username.trim()) {
        setError('El nombre de usuario es requerido')
        return
      }

      if (!isValidUsername(username)) {
        setError('El nombre de usuario debe tener 3-30 caracteres (letras, numeros, guion bajo)')
        return
      }

      setLoading(true)

      // Send registration request
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

        setSuccess(data.message || 'Cuenta creada. Revisa tu correo para obtener tu contrasena.')
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

  // Toggle password visibility
  const togglePassword = useCallback(() => {
    try {
      setShowPass(prev => !prev)
    } catch {
      // Ignore toggle errors
    }
  }, [])

  // Input change handlers with validation
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
      // Only allow valid characters
      const sanitized = value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 30)
      setUsername(sanitized)
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

  // Show loading while checking auth
  if (!mounted || authLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#0f0f23' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div 
            className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: '#6366f1', borderTopColor: 'transparent' }}
          />
          <p className="text-slate-400 text-sm">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'radial-gradient(ellipse at top left, #1e1b4b 0%, #0f0f23 50%, #0f172a 100%)',
      }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute"
          style={{
            top: '10%',
            left: '5%',
            width: 350,
            height: 350,
            background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(50px)',
          }}
        />
        <div 
          className="absolute"
          style={{
            bottom: '15%',
            right: '5%',
            width: 300,
            height: 300,
            background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(50px)',
          }}
        />
        <div 
          className="absolute"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 600,
            height: 600,
            background: 'radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 60%)',
            borderRadius: '50%',
            filter: 'blur(80px)',
          }}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div 
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: '0 0 40px rgba(99,102,241,0.4), 0 20px 40px rgba(0,0,0,0.3)',
            }}
          >
            <MessageSquare size={36} color="white" />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">ChatApp</h1>
          <p className="text-slate-400 mt-2 flex items-center justify-center gap-2">
            <Shield size={14} className="text-indigo-400" />
            Mensajes cifrados en tiempo real
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Bot size={14} className="text-purple-400" />
            <span className="text-xs text-slate-500">Con asistente IA integrado</span>
            <Sparkles size={10} className="text-purple-400" />
          </div>
        </div>

        {/* Card */}
        <div 
          className="rounded-3xl p-8"
          style={{
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset',
          }}
        >
          {/* Tabs */}
          <div 
            className="flex mb-6 rounded-xl p-1"
            style={{ background: 'rgba(0,0,0,0.4)' }}
          >
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className="flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all"
                style={{
                  background: mode === m 
                    ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' 
                    : 'transparent',
                  color: mode === m ? 'white' : '#94a3b8',
                  boxShadow: mode === m ? '0 4px 15px rgba(99,102,241,0.4)' : 'none',
                }}
              >
                {m === 'login' ? 'Iniciar Sesion' : 'Registrarse'}
              </button>
            ))}
          </div>

          {/* Alerts */}
          {error && (
            <div 
              className="mb-4 p-4 rounded-xl text-sm flex items-start gap-3"
              style={{
                background: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.25)',
              }}
            >
              <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
              <span className="text-red-300">{error}</span>
            </div>
          )}
          
          {success && (
            <div 
              className="mb-4 p-4 rounded-xl text-sm flex items-start gap-3"
              style={{
                background: 'rgba(34,197,94,0.12)',
                border: '1px solid rgba(34,197,94,0.25)',
              }}
            >
              <CheckCircle size={18} className="text-green-400 shrink-0 mt-0.5" />
              <span className="text-green-300">{success}</span>
            </div>
          )}

          <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-5">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nombre de usuario
                </label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={username}
                    onChange={handleUsernameChange}
                    required
                    placeholder="tu_nombre"
                    autoComplete="username"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl text-white placeholder-slate-500 outline-none transition-all text-sm"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)' }}
                    onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none' }}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Correo electronico
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  required
                  placeholder="correo@ejemplo.com"
                  autoComplete="email"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl text-white placeholder-slate-500 outline-none transition-all text-sm"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)' }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none' }}
                />
              </div>
            </div>

            {mode === 'login' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Contrasena
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={handlePasswordChange}
                    required
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full pl-11 pr-12 py-3.5 rounded-xl text-white placeholder-slate-500 outline-none transition-all text-sm"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)' }}
                    onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none' }}
                  />
                  <button
                    type="button"
                    onClick={togglePassword}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors p-1"
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div 
                className="p-4 rounded-xl flex items-start gap-3 text-sm"
                style={{
                  background: 'rgba(99,102,241,0.08)',
                  border: '1px solid rgba(99,102,241,0.15)',
                }}
              >
                <Shield size={18} className="text-indigo-400 shrink-0 mt-0.5" />
                <span className="text-indigo-300 leading-relaxed">
                  Te enviaremos una contrasena generada automaticamente a tu correo. 
                  Todos los mensajes van cifrados con AES-256.
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-semibold text-white transition-all text-sm"
              style={{
                background: loading 
                  ? 'rgba(99,102,241,0.5)' 
                  : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                boxShadow: loading ? 'none' : '0 8px 30px rgba(99,102,241,0.4)',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <span 
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
                  />
                  {mode === 'login' ? 'Ingresando...' : 'Registrando...'}
                </span>
              ) : (
                mode === 'login' ? 'Ingresar al Chat' : 'Crear Cuenta'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 space-y-2">
          <p className="text-slate-500 text-xs flex items-center justify-center gap-2">
            <Lock size={12} />
            Mensajes protegidos con cifrado AES-256 extremo a extremo
          </p>
          <p className="text-slate-600 text-xs">
            ChatApp v2.0 - Con asistente IA integrado
          </p>
        </div>
      </div>
    </div>
  )
}
