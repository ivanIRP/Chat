'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useSocket } from '@/hooks/useSocket'
import ChatWindow from '@/components/ChatWindow'
import UsersPanel from '@/components/UsersPanel'
import { MessageSquare, LogOut } from 'lucide-react'

export default function ChatPage() {
  const { user, token, logout, loading } = useAuth()
  const router = useRouter()
  const { messages, connected, onlineUsers, sendMessage } = useSocket(token)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f0f23' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400">Cargando...</p>
        </div>
      </div>
    )
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0f0f23' }}>
      {/* Topbar */}
      <div
        className="flex items-center justify-between px-6 py-3 shrink-0"
        style={{
          background: 'rgba(255,255,255,0.03)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <MessageSquare size={18} color="white" />
          </div>
          <div>
            <span className="font-bold text-white">ChatApp</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: connected ? '#22c55e' : '#ef4444' }}
              />
              <span className="text-xs text-slate-500">
                {connected ? 'Conectado' : 'Reconectando...'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* User info */}
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ background: user.avatar_color }}
            >
              {user.username[0].toUpperCase()}
            </div>
            <span className="text-sm text-slate-300 hidden sm:block">{user.username}</span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <LogOut size={15} />
            <span className="hidden sm:block">Salir</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        <UsersPanel onlineUsers={onlineUsers} connected={connected} />
        <div className="flex-1 overflow-hidden">
          <ChatWindow messages={messages} onSend={sendMessage} />
        </div>
      </div>
    </div>
  )
}
