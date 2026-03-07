'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useSocket } from '@/hooks/useSocket'
import ChatWindow from '@/components/ChatWindow'
import UsersPanel from '@/components/UsersPanel'
import AIChatPanel from '@/components/AIChatPanel'
import { MessageSquare, LogOut, Bot, Sparkles, AlertCircle, RefreshCw, Bell, Settings } from 'lucide-react'

export default function ChatPage() {
  const { user, token, logout, loading, error: authError } = useAuth()
  const router = useRouter()
  const { messages, connected, onlineUsers, sendMessage, error: socketError, reconnecting } = useSocket(token)
  const [showAIChat, setShowAIChat] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [pageError, setPageError] = useState<string | null>(null)

  // Safe navigation with error handling
  const safeNavigate = useCallback((path: string) => {
    try {
      if (router && typeof router.push === 'function') {
        router.push(path)
      } else {
        window.location.href = path
      }
    } catch (err) {
      console.error('[Chat] Navigation error:', err)
      window.location.href = path
    }
  }, [router])

  // Auth check with error handling
  useEffect(() => {
    try {
      if (!loading && !user) {
        safeNavigate('/')
      }
    } catch (err) {
      console.error('[Chat] Auth check error:', err)
      setPageError('Error al verificar autenticacion')
    }
  }, [user, loading, safeNavigate])

  // Handle logout with error handling
  const handleLogout = useCallback(() => {
    try {
      if (logout && typeof logout === 'function') {
        logout()
      }
      safeNavigate('/')
    } catch (err) {
      console.error('[Chat] Logout error:', err)
      // Force redirect even if logout fails
      try {
        localStorage.removeItem('chat_user')
        localStorage.removeItem('chat_token')
      } catch {
        // Ignore storage errors
      }
      safeNavigate('/')
    }
  }, [logout, safeNavigate])

  // Toggle AI chat with error handling
  const toggleAIChat = useCallback(() => {
    try {
      setShowAIChat(prev => !prev)
    } catch (err) {
      console.error('[Chat] Toggle AI chat error:', err)
    }
  }, [])

  // Loading state
  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#0f0f23' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div 
            className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: '#6366f1', borderTopColor: 'transparent' }}
          />
          <p className="text-slate-400 text-sm">Cargando...</p>
        </div>
      </div>
    )
  }

  // No user state
  if (!user) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#0f0f23' }}
      >
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <AlertCircle size={48} className="text-red-400" />
          <p className="text-slate-300">Sesion no encontrada</p>
          <button
            onClick={() => safeNavigate('/')}
            className="px-6 py-2 rounded-lg text-white text-sm font-medium"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            Ir al inicio
          </button>
        </div>
      </div>
    )
  }

  // Get display values with fallbacks
  const displayUsername = user?.username || 'Usuario'
  const displayInitial = displayUsername[0]?.toUpperCase() || 'U'
  const displayColor = user?.avatar_color || '#6366f1'

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0f0f23' }}>
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div 
          className="absolute"
          style={{
            top: '5%',
            left: '10%',
            width: 400,
            height: 400,
            background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(60px)',
          }}
        />
        <div 
          className="absolute"
          style={{
            bottom: '10%',
            right: '5%',
            width: 350,
            height: 350,
            background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(60px)',
          }}
        />
      </div>

      {/* Error banner */}
      {(pageError || authError || socketError) && (
        <div 
          className="px-4 py-2 flex items-center justify-center gap-2 text-sm z-20"
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
          }}
        >
          <AlertCircle size={14} className="text-red-400" />
          <span className="text-red-300">{pageError || authError || socketError}</span>
          {reconnecting && (
            <span className="flex items-center gap-1 text-amber-400 ml-2">
              <RefreshCw size={12} className="animate-spin" />
              Reconectando...
            </span>
          )}
        </div>
      )}

      {/* Topbar */}
      <header
        className="flex items-center justify-between px-4 md:px-6 py-3 shrink-0 relative z-10"
        style={{
          background: 'rgba(255,255,255,0.02)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ 
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: '0 4px 20px rgba(99,102,241,0.3)',
            }}
          >
            <MessageSquare size={20} color="white" />
          </div>
          <div>
            <span className="font-bold text-white text-lg">ChatApp</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{ 
                  background: connected ? '#22c55e' : reconnecting ? '#f59e0b' : '#ef4444',
                  boxShadow: connected ? '0 0 8px rgba(34,197,94,0.6)' : 'none',
                }}
              />
              <span className="text-xs text-slate-500">
                {connected ? 'Conectado' : reconnecting ? 'Reconectando...' : 'Desconectado'}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* AI Chat Button */}
          <button
            onClick={toggleAIChat}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all"
            style={{
              background: showAIChat 
                ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' 
                : 'rgba(255,255,255,0.05)',
              boxShadow: showAIChat ? '0 4px 15px rgba(99,102,241,0.4)' : 'none',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
            title="Asistente IA"
          >
            <Bot size={16} className="text-white" />
            <span className="hidden sm:block text-white font-medium">IA</span>
            <Sparkles size={10} className="text-indigo-300" />
          </button>

          {/* User info */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ 
                background: displayColor,
                boxShadow: `0 2px 10px ${displayColor}40`,
              }}
            >
              {displayInitial}
            </div>
            <span className="text-sm text-slate-300 hidden sm:block font-medium">{displayUsername}</span>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            title="Cerrar sesion"
          >
            <LogOut size={16} />
            <span className="hidden md:block">Salir</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex flex-1 overflow-hidden relative z-10">
        <UsersPanel onlineUsers={onlineUsers} connected={connected} />
        <div className="flex-1 overflow-hidden">
          <ChatWindow messages={messages} onSend={sendMessage} />
        </div>
      </main>

      {/* AI Chat Panel */}
      <AIChatPanel isOpen={showAIChat} onClose={() => setShowAIChat(false)} />

      {/* Floating AI button for mobile */}
      {!showAIChat && (
        <button
          onClick={toggleAIChat}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center md:hidden z-40 transition-transform hover:scale-105 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            boxShadow: '0 8px 30px rgba(99,102,241,0.5)',
          }}
        >
          <Bot size={24} color="white" />
        </button>
      )}
    </div>
  )
}
