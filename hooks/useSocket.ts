'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { decrypt } from '@/lib/encryption'

interface Message {
  id: string
  user_id: string
  username: string
  avatar_color: string
  content: string
  created_at: string
}

interface SocketState {
  messages: Message[]
  connected: boolean
  onlineUsers: string[]
  error: string | null
  reconnecting: boolean
}

// Safe decrypt wrapper
function safeDecrypt(content: string): string {
  try {
    if (!content || typeof content !== 'string') {
      return '[mensaje vacio]'
    }
    const decrypted = decrypt(content)
    return decrypted || '[mensaje no descifrable]'
  } catch (error) {
    console.error('[Socket] Decrypt error:', error)
    return '[error de descifrado]'
  }
}

// Validate message structure
function isValidMessage(msg: unknown): msg is Message {
  try {
    if (!msg || typeof msg !== 'object') return false
    const m = msg as Record<string, unknown>
    return (
      typeof m.id === 'string' &&
      typeof m.user_id === 'string' &&
      typeof m.username === 'string' &&
      typeof m.content === 'string' &&
      typeof m.created_at === 'string'
    )
  } catch {
    return false
  }
}

export function useSocket(token: string | null): SocketState & { sendMessage: (content: string) => void } {
  const socketRef = useRef<Socket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [connected, setConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [reconnecting, setReconnecting] = useState(false)

  // Cleanup function
  const cleanup = useCallback(() => {
    try {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      if (socketRef.current) {
        socketRef.current.removeAllListeners()
        socketRef.current.disconnect()
        socketRef.current = null
      }
    } catch (err) {
      console.error('[Socket] Cleanup error:', err)
    }
  }, [])

  // Initialize socket connection
  useEffect(() => {
    // Validate token
    if (!token || typeof token !== 'string' || token.length < 10) {
      setConnected(false)
      setError('Token de autenticacion invalido')
      return
    }

    setError(null)
    setReconnecting(false)

    try {
      // Cleanup any existing connection
      cleanup()

      // Create new socket connection
      const socket = io('/', {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      })

      socketRef.current = socket

      // Connection events
      socket.on('connect', () => {
        console.log('[Socket] Connected')
        setConnected(true)
        setError(null)
        setReconnecting(false)
      })

      socket.on('disconnect', (reason) => {
        console.log('[Socket] Disconnected:', reason)
        setConnected(false)
        
        if (reason === 'io server disconnect') {
          setError('Desconectado por el servidor')
        } else if (reason === 'transport close' || reason === 'transport error') {
          setReconnecting(true)
        }
      })

      socket.on('connect_error', (err) => {
        console.error('[Socket] Connection error:', err.message)
        setConnected(false)
        setError(`Error de conexion: ${err.message}`)
        setReconnecting(true)
      })

      socket.on('reconnect_attempt', (attempt) => {
        console.log('[Socket] Reconnect attempt:', attempt)
        setReconnecting(true)
      })

      socket.on('reconnect', (attempt) => {
        console.log('[Socket] Reconnected after', attempt, 'attempts')
        setConnected(true)
        setError(null)
        setReconnecting(false)
      })

      socket.on('reconnect_failed', () => {
        console.error('[Socket] Reconnection failed')
        setError('No se pudo reconectar al servidor')
        setReconnecting(false)
      })

      // Message events
      socket.on('history', (msgs: unknown) => {
        try {
          if (!msgs || !Array.isArray(msgs)) {
            console.warn('[Socket] Invalid history data')
            return
          }

          const validMessages = msgs
            .filter(isValidMessage)
            .map(m => ({
              ...m,
              content: safeDecrypt(m.content),
            }))

          setMessages(validMessages)
        } catch (err) {
          console.error('[Socket] History processing error:', err)
        }
      })

      socket.on('message', (msg: unknown) => {
        try {
          if (!isValidMessage(msg)) {
            console.warn('[Socket] Invalid message received')
            return
          }

          const processedMsg: Message = {
            ...msg,
            content: safeDecrypt(msg.content),
          }

          setMessages(prev => {
            // Prevent duplicates
            if (prev.some(m => m.id === processedMsg.id)) {
              return prev
            }
            return [...prev, processedMsg]
          })
        } catch (err) {
          console.error('[Socket] Message processing error:', err)
        }
      })

      socket.on('online_users', (users: unknown) => {
        try {
          if (!users || !Array.isArray(users)) {
            console.warn('[Socket] Invalid online users data')
            return
          }

          const validUsers = users.filter(
            (u): u is string => typeof u === 'string' && u.length > 0
          )

          setOnlineUsers(validUsers)
        } catch (err) {
          console.error('[Socket] Online users processing error:', err)
        }
      })

      // Error event
      socket.on('error', (err: unknown) => {
        const errorMsg = err instanceof Error ? err.message : 'Error de socket'
        console.error('[Socket] Error event:', errorMsg)
        setError(errorMsg)
      })

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al conectar'
      console.error('[Socket] Setup error:', errorMsg)
      setError(errorMsg)
      setConnected(false)
    }

    return cleanup
  }, [token, cleanup])

  // Send message function with error handling
  const sendMessage = useCallback((content: string) => {
    try {
      // Validate content
      if (!content || typeof content !== 'string') {
        console.warn('[Socket] Invalid message content')
        return
      }

      const trimmedContent = content.trim()
      if (trimmedContent.length === 0) {
        console.warn('[Socket] Empty message')
        return
      }

      if (trimmedContent.length > 5000) {
        console.warn('[Socket] Message too long')
        setError('El mensaje es demasiado largo')
        return
      }

      // Check socket state
      if (!socketRef.current) {
        console.error('[Socket] No socket connection')
        setError('No hay conexion al servidor')
        return
      }

      if (!socketRef.current.connected) {
        console.error('[Socket] Socket not connected')
        setError('No estas conectado al servidor')
        return
      }

      // Send message
      socketRef.current.emit('message', { content: trimmedContent })
      setError(null)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al enviar mensaje'
      console.error('[Socket] Send error:', errorMsg)
      setError(errorMsg)
    }
  }, [])

  return {
    messages,
    connected,
    onlineUsers,
    error,
    reconnecting,
    sendMessage,
  }
}
