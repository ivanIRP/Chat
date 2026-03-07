'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useSocket } from '@/hooks/useSocket'
import ChatWindow from '@/components/ChatWindow'
import UsersPanel from '@/components/UsersPanel'
import AIChatPanel from '@/components/AIChatPanel'
import { MessageSquare, LogOut, Bot, AlertCircle, RefreshCw } from 'lucide-react'

export default function ChatPage() {
  const { user, token, logout, loading, error: authError } = useAuth()
  const router = useRouter()
  const { messages, connected, onlineUsers, sendMessage, error: socketError, reconnecting } = useSocket(token)
  const [showAIChat, setShowAIChat] = useState(false)
  const [pageError, setPageError] = useState<string | null>(null)

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

  const handleLogout = useCallback(() => {
    try {
      if (logout && typeof logout === 'function') {
        logout()
      }
      safeNavigate('/')
    } catch (err) {
      console.error('[Chat] Logout error:', err)
      try {
        localStorage.removeItem('chat_user')
        localStorage.removeItem('chat_token')
      } catch {
        // Ignore storage errors
      }
      safeNavigate('/')
    }
  }, [logout, safeNavigate])

  const toggleAIChat = useCallback(() => {
    try {
      setShowAIChat(prev => !prev)
    } catch (err) {
      console.error('[Chat] Toggle AI chat error:', err)
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center wz-grid-bg">
        <div className="flex flex-col items-center gap-4">
          <div 
            className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'var(--color-wz-cyan)', borderTopColor: 'transparent' }}
          />
          <p style={{ color: 'var(--color-wz-text-muted)' }} className="text-sm">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center wz-grid-bg">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <AlertCircle size={48} style={{ color: 'var(--color-wz-error)' }} />
          <p style={{ color: 'var(--color-wz-text)' }}>Sesion no encontrada</p>
          <button
            onClick={() => safeNavigate('/')}
            className="wz-button-outline"
          >
            Ir al inicio
          </button>
        </div>
      </div>
    )
  }

  const displayUsername = user?.username || 'Usuario'
  const displayInitial = displayUsername[0]?.toUpperCase() || 'U'
  const displayColor = user?.avatar_color || '#00d4ff'

  return (
    <div className="min-h-screen flex flex-col wz-grid-bg">
      {/* Error banner */}
      {(pageError || authError || socketError) && (
        <div className="wz-error flex items-center justify-center gap-2 text-sm z-20 rounded-none border-x-0 border-t-0">
          <AlertCircle size={14} />
          <span>{pageError || authError || socketError}</span>
          {reconnecting && (
            <span className="flex items-center gap-1 ml-2" style={{ color: 'var(--color-wz-warning)' }}>
              <RefreshCw size={12} className="animate-spin" />
              Reconectando...
            </span>
          )}
        </div>
      )}

      {/* Header */}
      <header className="wz-header flex items-center justify-between px-4 md:px-6 py-3 shrink-0 relative z-10">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ 
              background: 'var(--color-wz-cyan)',
              boxShadow: '0 4px 20px var(--color-wz-cyan-glow)',
            }}
          >
            <MessageSquare size={20} style={{ color: 'var(--color-wz-bg)' }} />
          </div>
          <div>
            <span className="font-bold text-lg tracking-wider">
              <span style={{ color: 'var(--color-wz-text)' }}>WZ</span>
              <span style={{ color: 'var(--color-wz-cyan)' }}>CHAT</span>
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div
                className={connected ? 'wz-status-online' : 'wz-status-offline'}
                style={{ width: '8px', height: '8px' }}
              />
              <span className="text-xs" style={{ color: 'var(--color-wz-text-muted)' }}>
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
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all"
            style={{
              background: showAIChat ? 'var(--color-wz-cyan)' : 'transparent',
              color: showAIChat ? 'var(--color-wz-bg)' : 'var(--color-wz-cyan)',
              border: '1px solid var(--color-wz-cyan)',
            }}
            title="Asistente IA"
          >
            <Bot size={16} />
            <span className="hidden sm:block font-semibold">IA</span>
          </button>

          {/* User info */}
          <div className="flex items-center gap-2 px-3 py-1.5">
            <div className="wz-avatar" style={{ background: displayColor, width: '32px', height: '32px', fontSize: '14px' }}>
              {displayInitial}
            </div>
            <span className="text-sm hidden sm:block font-medium" style={{ color: 'var(--color-wz-text)' }}>
              {displayUsername}
            </span>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="wz-button-outline flex items-center gap-2"
            title="Cerrar sesion"
          >
            <LogOut size={16} />
            <span className="hidden md:block">Cerrar Sesion</span>
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
            background: 'var(--color-wz-cyan)',
            boxShadow: '0 8px 30px var(--color-wz-cyan-glow)',
          }}
        >
          <Bot size={24} style={{ color: 'var(--color-wz-bg)' }} />
        </button>
      )}
    </div>
  )
}
