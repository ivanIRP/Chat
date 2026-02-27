'use client'
import { useEffect, useRef, useState } from 'react'
import { Send, Lock, Shield } from 'lucide-react'
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
  const bottomRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    onSend(input)
    setInput('')
  }

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  }

  // Group messages by user (consecutive)
  const grouped = messages.reduce<{ msg: Message; showAvatar: boolean }[]>((acc, msg, i) => {
    const prev = messages[i - 1]
    const showAvatar = !prev || prev.user_id !== msg.user_id
    acc.push({ msg, showAvatar })
    return acc
  }, [])

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div>
          <h2 className="font-semibold text-white text-lg">Chat General</h2>
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
            <Shield size={11} color="#6366f1" />
            Mensajes cifrados AES-256
          </p>
        </div>
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs" style={{
          background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc'
        }}>
          <Lock size={11} />
          Cifrado
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{
              background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)'
            }}>
              <Shield size={28} color="#6366f1" />
            </div>
            <p className="text-slate-400 font-medium">Nadie ha escrito aún</p>
            <p className="text-slate-600 text-sm mt-1">¡Sé el primero en saludar!</p>
          </div>
        )}

        {grouped.map(({ msg, showAvatar }) => {
          const isOwn = msg.user_id === user?.id
          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2 animate-fade-in ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
              style={{ marginBottom: showAvatar ? undefined : 2 }}
            >
              {/* Avatar */}
              <div className={`shrink-0 ${!showAvatar ? 'invisible' : ''}`}>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: msg.avatar_color }}
                >
                  {msg.username[0].toUpperCase()}
                </div>
              </div>

              {/* Bubble */}
              <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                {showAvatar && (
                  <span className={`text-xs mb-1 ${isOwn ? 'text-right' : 'text-left'}`} style={{ color: msg.avatar_color }}>
                    {isOwn ? 'Tú' : msg.username}
                  </span>
                )}
                <div
                  className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                  style={{
                    background: isOwn
                      ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                      : 'rgba(255,255,255,0.08)',
                    color: 'white',
                    borderBottomRightRadius: isOwn ? 4 : undefined,
                    borderBottomLeftRadius: !isOwn ? 4 : undefined,
                    wordBreak: 'break-word',
                  }}
                >
                  {msg.content}
                </div>
                <span className="text-xs mt-1 text-slate-600">{formatTime(msg.created_at)}</span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Escribe un mensaje cifrado..."
              maxLength={1000}
              className="w-full px-4 py-3 pr-10 rounded-xl text-white placeholder-slate-500 outline-none transition-all text-sm"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              onFocus={e => e.target.style.borderColor = '#6366f1'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
            <Lock size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600" />
          </div>
          <button
            type="submit"
            disabled={!input.trim()}
            className="p-3 rounded-xl transition-all shrink-0"
            style={{
              background: input.trim() ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.07)',
              boxShadow: input.trim() ? '0 4px 15px rgba(99,102,241,0.4)' : 'none',
              cursor: input.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            <Send size={18} color="white" />
          </button>
        </form>
      </div>
    </div>
  )
}
