'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Bot, Send, X, Sparkles, Loader2, AlertCircle, RefreshCw, Trash2, Minimize2, Maximize2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  error?: boolean
}

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function AIChatPanel({ isOpen, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [minimized, setMinimized] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { token } = useAuth()

  // Scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    try {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
      }
    } catch {
      // Ignore scroll errors
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && !minimized && inputRef.current) {
      try {
        inputRef.current.focus()
      } catch {
        // Ignore focus errors
      }
    }
  }, [isOpen, minimized])

  // Generate unique ID
  const generateId = (): string => {
    try {
      return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    } catch {
      return `msg-${Date.now()}`
    }
  }

  // Send message to AI
  const sendMessage = async (content: string, isRetry = false) => {
    // Validate input
    if (!content || typeof content !== 'string') {
      setError('Mensaje invalido')
      return
    }

    const trimmedContent = content.trim()
    if (trimmedContent.length === 0) {
      setError('El mensaje no puede estar vacio')
      return
    }

    if (trimmedContent.length > 4000) {
      setError('El mensaje es demasiado largo (max 4000 caracteres)')
      return
    }

    if (!token) {
      setError('Debes iniciar sesion para usar el chat de IA')
      return
    }

    setError(null)
    setLoading(true)

    // Add user message if not a retry
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: trimmedContent,
      timestamp: new Date(),
    }

    if (!isRetry) {
      setMessages(prev => [...prev, userMessage])
      setInput('')
    }

    try {
      // Prepare messages for API
      const apiMessages = [...messages, userMessage]
        .filter(m => m && m.role && m.content && !m.error)
        .slice(-10) // Keep last 10 messages for context
        .map(m => ({
          role: m.role,
          content: m.content,
        }))

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: apiMessages }),
      })

      let data: { success?: boolean; content?: string; error?: string; fallback_message?: string }
      
      try {
        data = await response.json()
      } catch {
        throw new Error('Respuesta invalida del servidor')
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.fallback_message || 'Error al obtener respuesta')
      }

      if (!data.content || typeof data.content !== 'string') {
        throw new Error('Respuesta vacia de la IA')
      }

      // Add AI response
      const aiMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: data.content,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, aiMessage])
      setRetryCount(0)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      console.error('[AI Chat] Error:', errorMessage)
      
      // Add error message
      const errorMsg: Message = {
        id: generateId(),
        role: 'assistant',
        content: `Lo siento, hubo un error: ${errorMessage}`,
        timestamp: new Date(),
        error: true,
      }
      
      setMessages(prev => [...prev, errorMsg])
      setError(errorMessage)
      setRetryCount(prev => prev + 1)
    } finally {
      setLoading(false)
    }
  }

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    try {
      e.preventDefault()
      if (input.trim() && !loading) {
        sendMessage(input)
      }
    } catch {
      setError('Error al enviar mensaje')
    }
  }

  // Handle retry
  const handleRetry = () => {
    try {
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user' && !m.error)
      if (lastUserMsg) {
        // Remove last error message
        setMessages(prev => prev.filter(m => !m.error || m.id !== prev[prev.length - 1]?.id))
        sendMessage(lastUserMsg.content, true)
      }
    } catch {
      setError('Error al reintentar')
    }
  }

  // Clear chat
  const clearChat = () => {
    try {
      setMessages([])
      setError(null)
      setRetryCount(0)
    } catch {
      // Ignore clear errors
    }
  }

  // Format timestamp
  const formatTime = (date: Date): string => {
    try {
      if (!(date instanceof Date) || isNaN(date.getTime())) {
        return ''
      }
      return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed z-50 transition-all duration-300"
      style={{
        right: 20,
        bottom: 20,
        width: minimized ? 300 : 380,
        height: minimized ? 60 : 520,
        maxHeight: 'calc(100vh - 100px)',
      }}
    >
      <div 
        className="h-full flex flex-col rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(15, 15, 35, 0.98)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(99, 102, 241, 0.15)',
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between px-4 py-3 shrink-0 cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))',
            borderBottom: '1px solid rgba(99, 102, 241, 0.2)',
          }}
          onClick={() => setMinimized(!minimized)}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              <Bot size={18} color="white" />
            </div>
            <div>
              <span className="font-semibold text-white text-sm">Asistente IA</span>
              <div className="flex items-center gap-1.5">
                <Sparkles size={10} color="#a5b4fc" />
                <span className="text-xs text-slate-400">Powered by OpenRouter</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); clearChat() }}
              className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title="Limpiar chat"
            >
              <Trash2 size={14} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setMinimized(!minimized) }}
              className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title={minimized ? 'Maximizar' : 'Minimizar'}
            >
              {minimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onClose() }}
              className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-red-400 transition-colors"
              title="Cerrar"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {!minimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                    style={{
                      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                    }}
                  >
                    <Sparkles size={28} color="#818cf8" />
                  </div>
                  <p className="text-slate-300 font-medium text-sm">Hola! Soy tu asistente IA</p>
                  <p className="text-slate-500 text-xs mt-1 max-w-[200px]">
                    Preguntame lo que quieras. Puedo ayudarte con informacion, consejos y mas.
                  </p>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className="max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                    style={{
                      background: msg.role === 'user'
                        ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                        : msg.error
                          ? 'rgba(239, 68, 68, 0.15)'
                          : 'rgba(255, 255, 255, 0.08)',
                      color: msg.error ? '#fca5a5' : 'white',
                      borderBottomRightRadius: msg.role === 'user' ? 4 : undefined,
                      borderBottomLeftRadius: msg.role === 'assistant' ? 4 : undefined,
                      border: msg.error ? '1px solid rgba(239, 68, 68, 0.3)' : undefined,
                    }}
                  >
                    {msg.content}
                    <div className="text-xs mt-1.5 opacity-60">
                      {formatTime(msg.timestamp)}
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div 
                    className="px-4 py-3 rounded-2xl"
                    style={{ background: 'rgba(255, 255, 255, 0.08)' }}
                  >
                    <div className="flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin text-indigo-400" />
                      <span className="text-sm text-slate-400">Pensando...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Error banner */}
            {error && retryCount > 0 && (
              <div 
                className="mx-4 mb-2 px-3 py-2 rounded-lg flex items-center justify-between text-xs"
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                }}
              >
                <div className="flex items-center gap-2 text-red-300">
                  <AlertCircle size={12} />
                  <span>Error de conexion</span>
                </div>
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-1 text-red-300 hover:text-white transition-colors"
                >
                  <RefreshCw size={12} />
                  Reintentar
                </button>
              </div>
            )}

            {/* Input */}
            <div className="px-4 pb-4 pt-2">
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Escribe tu pregunta..."
                    maxLength={4000}
                    disabled={loading}
                    className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 outline-none transition-all text-sm disabled:opacity-50"
                    style={{
                      background: 'rgba(255, 255, 255, 0.07)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#6366f1' }}
                    onBlur={(e) => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)' }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="p-3 rounded-xl transition-all shrink-0 disabled:opacity-50"
                  style={{
                    background: input.trim() && !loading
                      ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                      : 'rgba(255, 255, 255, 0.07)',
                    boxShadow: input.trim() && !loading
                      ? '0 4px 15px rgba(99, 102, 241, 0.4)'
                      : 'none',
                    cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                  }}
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin text-white" />
                  ) : (
                    <Send size={18} color="white" />
                  )}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
