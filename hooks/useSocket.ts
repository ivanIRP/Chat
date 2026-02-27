'use client'
import { useEffect, useRef, useState } from 'react'
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

export function useSocket(token: string | null) {
  const socketRef = useRef<Socket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [connected, setConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])

  useEffect(() => {
    if (!token) return

    const socket = io('/', {
      auth: { token },
      transports: ['websocket', 'polling'],
    })

    socketRef.current = socket

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    socket.on('history', (msgs: Message[]) => {
      setMessages(msgs.map(m => ({ ...m, content: decrypt(m.content) })))
    })

    socket.on('message', (msg: Message) => {
      setMessages(prev => [...prev, { ...msg, content: decrypt(msg.content) }])
    })

    socket.on('online_users', (users: string[]) => {
      setOnlineUsers(users)
    })

    return () => {
      socket.disconnect()
    }
  }, [token])

  const sendMessage = (content: string) => {
    socketRef.current?.emit('message', { content })
  }

  return { messages, connected, onlineUsers, sendMessage }
}
