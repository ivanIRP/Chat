'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { Search, ChevronLeft, ChevronRight, Wifi, WifiOff, AlertCircle, RefreshCw } from 'lucide-react'
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
  const [searchQuery, setSearchQuery] = useState('')
  const { token } = useAuth()

  const fetchUsers = useCallback(async () => {
    try {
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
            avatar_color: u.avatar_color || '#00d4ff',
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

  useEffect(() => {
    if (token) {
      fetchUsers()
    }
  }, [token, fetchUsers])

  const toggleCollapsed = useCallback(() => {
    try {
      setCollapsed(prev => !prev)
    } catch {
      // Ignore toggle errors
    }
  }, [])

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

  const onlineCount = useMemo(() => {
    try {
      if (!onlineUsers || !Array.isArray(onlineUsers)) return 0
      return onlineUsers.length
    } catch {
      return 0
    }
  }, [onlineUsers])

  const filteredUsers = useMemo(() => {
    try {
      if (!users || !Array.isArray(users)) return []
      if (!searchQuery.trim()) return users
      const query = searchQuery.toLowerCase()
      return users.filter(u => 
        u.username.toLowerCase().includes(query) || 
        u.email.toLowerCase().includes(query)
      )
    } catch {
      return users
    }
  }, [users, searchQuery])

  return (
    <div
      className="wz-sidebar flex flex-col h-full transition-all duration-300"
      style={{ width: collapsed ? 60 : 280, flexShrink: 0 }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 shrink-0"
        style={{ borderBottom: '1px solid var(--color-wz-border)' }}
      >
        {!collapsed && (
          <div className="flex items-center gap-2">
            {connected ? (
              <Wifi size={16} style={{ color: 'var(--color-wz-success)' }} />
            ) : (
              <WifiOff size={16} style={{ color: 'var(--color-wz-error)' }} />
            )}
            <span className="text-xs font-medium" style={{ color: connected ? 'var(--color-wz-success)' : 'var(--color-wz-error)' }}>
              {connected ? `${onlineCount} en linea` : 'Desconectado'}
            </span>
          </div>
        )}
        <button
          onClick={toggleCollapsed}
          className="p-2 rounded-lg transition-colors ml-auto"
          style={{ color: 'var(--color-wz-text-muted)' }}
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="p-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-wz-text-muted)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar usuarios..."
              className="wz-input pl-10 py-2 text-sm"
            />
          </div>
        </div>
      )}

      {/* Error message */}
      {!collapsed && error && (
        <div className="mx-3 mb-2 wz-error flex items-center gap-2 text-xs">
          <AlertCircle size={12} />
          <span className="flex-1">{error}</span>
          <button onClick={fetchUsers} className="hover:opacity-80 transition-opacity" title="Reintentar">
            <RefreshCw size={12} />
          </button>
        </div>
      )}

      {/* Loading state */}
      {!collapsed && loading && (
        <div className="flex items-center justify-center py-4">
          <div 
            className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'var(--color-wz-cyan)', borderTopColor: 'transparent' }}
          />
        </div>
      )}

      {/* Users list */}
      <div className="flex-1 overflow-y-auto py-2 px-2">
        {filteredUsers.map(u => {
          try {
            const online = isOnline(u.username)
            const displayUsername = u.username || 'Usuario'
            const displayInitial = displayUsername[0]?.toUpperCase() || 'U'
            const displayColor = u.avatar_color || '#00d4ff'

            return (
              <div
                key={u.id}
                className="wz-user-item"
                title={collapsed ? displayUsername : undefined}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div
                    className="wz-avatar"
                    style={{ 
                      background: displayColor,
                      boxShadow: online ? `0 0 12px ${displayColor}60` : 'none',
                    }}
                  >
                    {displayInitial}
                  </div>
                  <div
                    className={online ? 'wz-status-online' : 'wz-status-offline'}
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      border: '2px solid var(--color-wz-bg)',
                    }}
                  />
                </div>

                {/* Info */}
                {!collapsed && (
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--color-wz-text)' }}>
                      {displayUsername}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--color-wz-text-muted)' }}>
                      {u.email || (online ? 'en linea' : 'desconectado')}
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
        {!loading && !collapsed && filteredUsers.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Search size={32} style={{ color: 'var(--color-wz-text-muted)' }} className="mb-2" />
            <p className="text-sm" style={{ color: 'var(--color-wz-text-muted)' }}>
              {searchQuery ? 'No se encontraron usuarios' : 'No hay usuarios'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
