'use client'
import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { Send, Lock, Shield, AlertCircle, Smile } from 'lucide-react'
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

  // Auto scroll to bottom with error handling
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

  // Focus input on mount
  useEffect(() => {
    try {
      if (inputRef.current) {
        inputRef.current.focus()
      }
    } catch {
      // Ignore focus errors
    }
  }, [])

  // Handle message submit with comprehensive validation
  const handleSubmit = useCallback((e: React.FormEvent) => {
    try {
      e.preventDefault()
      setSendError(null)

      // Validate input
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

      // Check if onSend function exists
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

  // Handle input change with validation
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const value = e.target.value || ''
      setInput(value.slice(0, 1000))
      if (sendError) setSendError(null)
    } catch {
      // Ignore input errors
    }
  }, [sendError])

  // Format timestamp with error handling
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

  // Group messages by user (consecutive) with memoization
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

  // Get safe user values
  const currentUserId = user?.id || ''

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div 
        className="px-6 py-4 flex items-center justify-between shrink-0"
        style={{ 
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.02)',
        }}
      >
        <div>
          <h2 className="font-semibold text-white text-lg">Chat General</h2>
          <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
            <Shield size={12} className="text-indigo-400" />
            Mensajes cifrados AES-256
          </p>
        </div>
        <div 
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
          style={{
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.2)',
          }}
        >
          <Lock size={12} className="text-indigo-400" />
          <span className="text-indigo-300 font-medium">Cifrado E2E</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {(!grouped || grouped.length === 0) && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div 
              className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4"
              style={{
                background: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.2)',
              }}
            >
              <Shield size={36} className="text-indigo-400" />
            </div>
            <p className="text-slate-300 font-medium text-lg">Nadie ha escrito aun</p>
            <p className="text-slate-500 text-sm mt-2 max-w-xs">
              Se el primero en saludar. Todos los mensajes estan protegidos con cifrado extremo a extremo.
            </p>
          </div>
        )}

        {grouped.map(({ msg, showAvatar }) => {
          try {
            const isOwn = msg.user_id === currentUserId
            const displayUsername = msg.username || 'Usuario'
            const displayInitial = displayUsername[0]?.toUpperCase() || 'U'
            const displayColor = msg.avatar_color || '#6366f1'

            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                style={{ marginBottom: showAvatar ? 8 : 2 }}
              >
                {/* Avatar */}
                <div className={`shrink-0 ${!showAvatar ? 'invisible' : ''}`}>
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ 
                      background: displayColor,
                      boxShadow: `0 2px 8px ${displayColor}40`,
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
                    className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
                    style={{
                      background: isOwn
                        ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                        : 'rgba(255,255,255,0.06)',
                      color: 'white',
                      borderBottomRightRadius: isOwn ? 6 : undefined,
                      borderBottomLeftRadius: !isOwn ? 6 : undefined,
                      wordBreak: 'break-word',
                      boxShadow: isOwn ? '0 4px 15px rgba(99,102,241,0.3)' : 'none',
                    }}
                  >
                    {msg.content || '[mensaje vacio]'}
                  </div>
                  <span className="text-xs mt-1.5 text-slate-600">
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
        <div 
          className="mx-4 mb-2 px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}
        >
          <AlertCircle size={14} className="text-red-400" />
          <span className="text-red-300">{sendError}</span>
        </div>
      )}

      {/* Input */}
      <div 
        className="px-4 pb-4 pt-3 shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              placeholder="Escribe un mensaje cifrado..."
              maxLength={1000}
              disabled={isSending}
              className="w-full px-4 py-3.5 pr-12 rounded-xl text-white placeholder-slate-500 outline-none transition-all text-sm disabled:opacity-50"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              onFocus={(e) => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)' }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none' }}
            />
            <Lock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600" />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            className="p-3.5 rounded-xl transition-all shrink-0 disabled:opacity-50"
            style={{
              background: input.trim() && !isSending
                ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                : 'rgba(255,255,255,0.05)',
              boxShadow: input.trim() && !isSending
                ? '0 4px 20px rgba(99,102,241,0.4)'
                : 'none',
              cursor: input.trim() && !isSending ? 'pointer' : 'not-allowed',
            }}
          >
            <Send size={18} color="white" />
          </button>
        </form>
        <p className="text-xs text-slate-600 mt-2 text-center">
          {input.length}/1000 caracteres
        </p>
      </div>
    </div>
  )
}
