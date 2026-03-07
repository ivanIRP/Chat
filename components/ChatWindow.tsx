'use client'
import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { Send, Lock, MessageSquare, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface Message {
  id: string
  user_id: string
  username: string
  avatar_color: string
  content: string
  created_at: string
}

interface Props {
  messages: Message[]
  onSend: (content: string) => void
}

export default function ChatWindow({ messages, onSend }: Props) {
  const [input, setInput] = useState('')
  const [sendError, setSendError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()

  const scrollToBottom = useCallback(() => {
    try {
      if (bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: 'smooth' })
      }
    } catch (err) {
      console.error('[ChatWindow] Scroll error:', err)
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    try {
      if (inputRef.current) {
        inputRef.current.focus()
      }
    } catch {
      // Ignore focus errors
    }
  }, [])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    try {
      e.preventDefault()
      setSendError(null)

      if (!input || typeof input !== 'string') {
        setSendError('Mensaje invalido')
        return
      }

      const trimmedInput = input.trim()
      if (trimmedInput.length === 0) {
        setSendError('El mensaje no puede estar vacio')
        return
      }

      if (trimmedInput.length > 1000) {
        setSendError('El mensaje es muy largo (max 1000 caracteres)')
        return
      }

      if (!onSend || typeof onSend !== 'function') {
        setSendError('Error de configuracion')
        return
      }

      setIsSending(true)

      try {
        onSend(trimmedInput)
        setInput('')
        setSendError(null)
      } catch (err) {
        console.error('[ChatWindow] Send error:', err)
        setSendError('Error al enviar mensaje')
      } finally {
        setIsSending(false)
      }
    } catch (err) {
      console.error('[ChatWindow] Submit error:', err)
      setSendError('Error inesperado')
      setIsSending(false)
    }
  }, [input, onSend])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const value = e.target.value || ''
      setInput(value.slice(0, 1000))
      if (sendError) setSendError(null)
    } catch {
      // Ignore input errors
    }
  }, [sendError])

  const formatTime = useCallback((iso: string): string => {
    try {
      if (!iso || typeof iso !== 'string') return ''
      const date = new Date(iso)
      if (isNaN(date.getTime())) return ''
      return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }, [])

  const grouped = useMemo(() => {
    try {
      if (!messages || !Array.isArray(messages)) return []
      
      return messages
        .filter(m => m && m.id && m.user_id && m.content)
        .map((msg, i, arr) => {
          const prev = arr[i - 1]
          const showAvatar = !prev || prev.user_id !== msg.user_id
          return { msg, showAvatar }
        })
    } catch (err) {
      console.error('[ChatWindow] Grouping error:', err)
      return []
    }
  }, [messages])

  const currentUserId = user?.id || ''

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--color-wz-bg)' }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {(!grouped || grouped.length === 0) && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div 
              className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4"
              style={{
                background: 'rgba(0, 212, 255, 0.1)',
                border: '1px solid rgba(0, 212, 255, 0.3)',
              }}
            >
              <MessageSquare size={36} style={{ color: 'var(--color-wz-cyan)' }} />
            </div>
            <p className="font-medium text-lg" style={{ color: 'var(--color-wz-text)' }}>
              Selecciona un usuario para chatear
            </p>
            <p className="text-sm mt-2 max-w-xs" style={{ color: 'var(--color-wz-text-muted)' }}>
              Tus mensajes estan encriptados de extremo a extremo
            </p>
          </div>
        )}

        {grouped.map(({ msg, showAvatar }) => {
          try {
            const isOwn = msg.user_id === currentUserId
            const displayUsername = msg.username || 'Usuario'
            const displayInitial = displayUsername[0]?.toUpperCase() || 'U'
            const displayColor = msg.avatar_color || '#00d4ff'

            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                style={{ marginBottom: showAvatar ? 8 : 2 }}
              >
                {/* Avatar */}
                <div className={`shrink-0 ${!showAvatar ? 'invisible' : ''}`}>
                  <div
                    className="wz-avatar"
                    style={{ 
                      background: displayColor,
                      width: '36px',
                      height: '36px',
                      fontSize: '14px',
                    }}
                  >
                    {displayInitial}
                  </div>
                </div>

                {/* Bubble */}
                <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                  {showAvatar && (
                    <span 
                      className={`text-xs mb-1.5 font-medium ${isOwn ? 'text-right' : 'text-left'}`}
                      style={{ color: displayColor }}
                    >
                      {isOwn ? 'Tu' : displayUsername}
                    </span>
                  )}
                  <div
                    className={isOwn ? 'wz-message-sent' : 'wz-message-received'}
                    style={{ wordBreak: 'break-word' }}
                  >
                    {msg.content || '[mensaje vacio]'}
                  </div>
                  <span className="text-xs mt-1.5" style={{ color: 'var(--color-wz-text-muted)' }}>
                    {formatTime(msg.created_at)}
                  </span>
                </div>
              </div>
            )
          } catch (err) {
            console.error('[ChatWindow] Message render error:', err)
            return null
          }
        })}
        <div ref={bottomRef} />
      </div>

      {/* Error message */}
      {sendError && (
        <div className="mx-4 mb-2 wz-error flex items-center gap-2 text-sm">
          <AlertCircle size={14} />
          <span>{sendError}</span>
        </div>
      )}

      {/* Input */}
      <div 
        className="px-4 pb-4 pt-3 shrink-0"
        style={{ borderTop: '1px solid var(--color-wz-border)' }}
      >
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              placeholder="Escribir mensaje..."
              maxLength={1000}
              disabled={isSending}
              className="wz-input pr-10"
            />
            <Lock size={14} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-wz-text-muted)' }} />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            className="p-3.5 rounded-lg transition-all shrink-0 disabled:opacity-50"
            style={{
              background: input.trim() && !isSending ? 'var(--color-wz-cyan)' : 'var(--color-wz-bg-card)',
              border: '1px solid var(--color-wz-border)',
              cursor: input.trim() && !isSending ? 'pointer' : 'not-allowed',
            }}
          >
            <Send size={18} style={{ color: input.trim() && !isSending ? 'var(--color-wz-bg)' : 'var(--color-wz-text-muted)' }} />
          </button>
        </form>
      </div>
    </div>
  )
}
