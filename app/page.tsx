'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { MessageSquare, Mail, Lock, User, Eye, EyeOff, Shield } from 'lucide-react'

export default function HomePage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { login } = useAuth()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email, password)
      router.push('/chat')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccess('¡Cuenta creada! Revisa tu correo para obtener tu contraseña.')
      setMode('login')
      setEmail(email)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: 'radial-gradient(ellipse at top left, #1e1b4b 0%, #0f0f23 50%, #0f172a 100%)'
    }}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div style={{
          position: 'absolute', top: '10%', left: '5%', width: 300, height: 300,
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(40px)'
        }} />
        <div style={{
          position: 'absolute', bottom: '15%', right: '5%', width: 250, height: 250,
          background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(40px)'
        }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            boxShadow: '0 0 30px rgba(99,102,241,0.4)'
          }}>
            <MessageSquare size={32} color="white" />
          </div>
          <h1 className="text-3xl font-bold text-white">ChatApp</h1>
          <p className="text-slate-400 mt-1">Mensajes cifrados en tiempo real</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8" style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
        }}>
          {/* Tabs */}
          <div className="flex mb-6 rounded-xl p-1" style={{ background: 'rgba(0,0,0,0.3)' }}>
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setSuccess('') }}
                className="flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all"
                style={{
                  background: mode === m ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
                  color: mode === m ? 'white' : '#94a3b8',
                  boxShadow: mode === m ? '0 4px 15px rgba(99,102,241,0.3)' : 'none'
                }}
              >
                {m === 'login' ? 'Iniciar Sesión' : 'Registrarse'}
              </button>
            ))}
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm animate-fade-in" style={{
              background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5'
            }}>
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-lg text-sm animate-fade-in" style={{
              background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#86efac'
            }}>
              ✅ {success}
            </div>
          )}

          <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Nombre de usuario</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                    placeholder="tu_nombre"
                    className="w-full pl-9 pr-4 py-3 rounded-xl text-white placeholder-slate-500 outline-none transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                    onFocus={e => e.target.style.borderColor = '#6366f1'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Correo electrónico</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="correo@ejemplo.com"
                  className="w-full pl-9 pr-4 py-3 rounded-xl text-white placeholder-slate-500 outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                  onFocus={e => e.target.style.borderColor = '#6366f1'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>
            </div>

            {mode === 'login' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Contraseña</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-3 rounded-xl text-white placeholder-slate-500 outline-none transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                    onFocus={e => e.target.style.borderColor = '#6366f1'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div className="p-3 rounded-lg flex items-start gap-2 text-xs" style={{
                background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc'
              }}>
                <Shield size={14} className="mt-0.5 shrink-0" />
                <span>Te enviaremos una contraseña generada automáticamente a tu correo. Todos los mensajes van cifrados con AES-256.</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all"
              style={{
                background: loading ? '#4a4a6a' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(99,102,241,0.4)',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                  {mode === 'login' ? 'Ingresando...' : 'Registrando...'}
                </span>
              ) : (
                mode === 'login' ? 'Ingresar al Chat' : 'Crear Cuenta'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          Mensajes protegidos con cifrado AES-256 extremo a extremo
        </p>
      </div>
    </div>
  )
}
