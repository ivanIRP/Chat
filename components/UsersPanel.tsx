'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { Users, ChevronLeft, ChevronRight, Wifi, WifiOff, AlertCircle, RefreshCw } from 'lucide-react'
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { token } = useAuth()

  // Fetch users with error handling
  const fetchUsers = useCallback(async () => {
    try {
      // Validate token
      if (!token || typeof token !== 'string' || token.length < 10) {
        setError('Token invalido')
        return
      }

      setLoading(true)
      setError(null)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      try {
        const response = await fetch('/api/users', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        let data: { users?: UserInfo[]; error?: string; success?: boolean }
        try {
          data = await response.json()
        } catch {
          throw new Error('Respuesta invalida')
        }

        if (!response.ok) {
          throw new Error(data.error || `Error ${response.status}`)
        }

        if (!data.users || !Array.isArray(data.users)) {
          setUsers([])
          return
        }

        // Validate and sanitize user data
        const validUsers = data.users
          .filter((u): u is UserInfo => {
            return (
              u !== null &&
              typeof u === 'object' &&
              typeof u.id === 'string' &&
              typeof u.username === 'string'
            )
          })
          .map(u => ({
            id: u.id,
            username: u.username,
            email: u.email || '',
            avatar_color: u.avatar_color || '#6366f1',
          }))

        setUsers(validUsers)
        setError(null)
      } catch (err) {
        if (err instanceof Error) {
          if (err.name === 'AbortError') {
            setError('Tiempo agotado')
          } else {
            setError(err.message)
          }
        } else {
          setError('Error desconocido')
        }
      }
    } catch (err) {
      console.error('[UsersPanel] Fetch error:', err)
      setError('Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }, [token])

  // Fetch users on mount and when token changes
  useEffect(() => {
    if (token) {
      fetchUsers()
    }
  }, [token, fetchUsers])

  // Toggle collapsed state
  const toggleCollapsed = useCallback(() => {
    try {
      setCollapsed(prev => !prev)
    } catch {
      // Ignore toggle errors
    }
  }, [])

  // Check if user is online with null safety
  const isOnline = useCallback((username: string): boolean => {
    try {
      if (!username || !onlineUsers || !Array.isArray(onlineUsers)) {
        return false
      }
      return onlineUsers.includes(username)
    } catch {
      return false
    }
  }, [onlineUsers])

  // Memoized online count
  const onlineCount = useMemo(() => {
    try {
      if (!onlineUsers || !Array.isArray(onlineUsers)) return 0
      return onlineUsers.length
    } catch {
      return 0
    }
  }, [onlineUsers])

  // Memoized user count
  const userCount = useMemo(() => {
    try {
      if (!users || !Array.isArray(users)) return 0
      return users.length
    } catch {
      return 0
    }
  }, [users])

  return (
    <div
      className="flex flex-col h-full transition-all duration-300"
      style={{
        width: collapsed ? 60 : 280,
        background: 'rgba(255,255,255,0.02)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Users size={18} className="text-indigo-400" />
            <span className="font-semibold text-sm text-slate-200">Usuarios</span>
            <span 
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}
            >
              {userCount}
            </span>
          </div>
        )}
        <button
          onClick={toggleCollapsed}
          className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors ml-auto"
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Connection status */}
      {!collapsed && (
        <div 
          className="mx-3 mt-3 mb-2 flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium"
          style={{
            background: connected 
              ? 'rgba(34,197,94,0.1)' 
              : 'rgba(239,68,68,0.1)',
            border: `1px solid ${connected ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
          }}
        >
          {connected ? (
            <>
              <Wifi size={14} className="text-green-400" />
              <span className="text-green-300">{onlineCount} en linea</span>
            </>
          ) : (
            <>
              <WifiOff size={14} className="text-red-400" />
              <span className="text-red-300">Desconectado</span>
            </>
          )}
        </div>
      )}

      {/* Error message */}
      {!collapsed && error && (
        <div 
          className="mx-3 mb-2 flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
          }}
        >
          <AlertCircle size={12} className="text-red-400" />
          <span className="text-red-300 flex-1">{error}</span>
          <button
            onClick={fetchUsers}
            className="text-red-400 hover:text-white transition-colors"
            title="Reintentar"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      )}

      {/* Loading state */}
      {!collapsed && loading && (
        <div className="flex items-center justify-center py-4">
          <div 
            className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: '#6366f1', borderTopColor: 'transparent' }}
          />
        </div>
      )}

      {/* Users list */}
      <div className="flex-1 overflow-y-auto py-2 px-2">
        {users.map(u => {
          try {
            const online = isOnline(u.username)
            const displayUsername = u.username || 'Usuario'
            const displayInitial = displayUsername[0]?.toUpperCase() || 'U'
            const displayColor = u.avatar_color || '#6366f1'

            return (
              <div
                key={u.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-all hover:bg-white/5 cursor-pointer"
                title={collapsed ? displayUsername : undefined}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ 
                      background: displayColor,
                      boxShadow: online ? `0 0 12px ${displayColor}60` : 'none',
                    }}
                  >
                    {displayInitial}
                  </div>
                  <div
                    className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                    style={{
                      background: online ? '#22c55e' : '#4b5563',
                      borderColor: '#0f0f23',
                      boxShadow: online ? '0 0 6px rgba(34,197,94,0.6)' : 'none',
                    }}
                  />
                </div>

                {/* Info */}
                {!collapsed && (
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-200 truncate">
                      {displayUsername}
                    </p>
                    <p 
                      className="text-xs truncate"
                      style={{ color: online ? '#86efac' : '#6b7280' }}
                    >
                      {online ? 'en linea' : 'desconectado'}
                    </p>
                  </div>
                )}
              </div>
            )
          } catch (err) {
            console.error('[UsersPanel] User render error:', err)
            return null
          }
        })}

        {/* Empty state */}
        {!loading && !collapsed && users.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Users size={32} className="text-slate-600 mb-2" />
            <p className="text-slate-500 text-sm">No hay usuarios</p>
          </div>
        )}
      </div>
    </div>
  )
}
