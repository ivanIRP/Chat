'use client'
import { useEffect, useState, useRef } from 'react'
import { Users, ChevronLeft, ChevronRight, Wifi, WifiOff } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface UserInfo {
  id: string
  username: string
  email: string
  avatar_color: string
}

interface Props {
  onlineUsers: string[]
  connected: boolean
}

export default function UsersPanel({ onlineUsers, connected }: Props) {
  const [users, setUsers] = useState<UserInfo[]>([])
  const [collapsed, setCollapsed] = useState(false)
  const { token } = useAuth()

  useEffect(() => {
    if (!token) return
    fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setUsers(d.users || []))
  }, [token])

  const isOnline = (username: string) => onlineUsers.includes(username)

  return (
    <div
      className="flex flex-col h-full transition-all duration-300"
      style={{
        width: collapsed ? 60 : 260,
        background: 'rgba(255,255,255,0.03)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Users size={18} color="#6366f1" />
            <span className="font-semibold text-sm text-slate-200">Usuarios</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
              {users.length}
            </span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors ml-auto"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Connection status */}
      {!collapsed && (
        <div className="mx-3 mt-3 mb-1 flex items-center gap-2 px-3 py-2 rounded-lg text-xs" style={{
          background: connected ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${connected ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
          color: connected ? '#86efac' : '#fca5a5'
        }}>
          {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
          {connected ? `${onlineUsers.length} en línea` : 'Desconectado'}
        </div>
      )}

      {/* Users list */}
      <div className="flex-1 overflow-y-auto py-2 px-2">
        {users.map(u => {
          const online = isOnline(u.username)
          return (
            <div
              key={u.id}
              className="flex items-center gap-3 px-2 py-2 rounded-xl mb-1 transition-colors hover:bg-white/5"
              title={collapsed ? u.username : undefined}
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ background: u.avatar_color }}
                >
                  {u.username[0].toUpperCase()}
                </div>
                <div
                  className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
                  style={{
                    background: online ? '#22c55e' : '#6b7280',
                    borderColor: '#0f0f23',
                  }}
                />
              </div>
              {/* Info */}
              {!collapsed && (
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{u.username}</p>
                  <p className="text-xs truncate" style={{ color: online ? '#86efac' : '#6b7280' }}>
                    {online ? '● en línea' : '○ desconectado'}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
