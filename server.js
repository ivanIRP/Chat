const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')
const CryptoJS = require('crypto-js')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'dev-secret'
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'fallback-key-change-in-production!'

function encrypt(text) {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString()
}

// In-memory message history (last 50 messages)
let messageHistory = []
// Online users: socketId -> user info
const onlineUsers = new Map()

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  })

  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  })

  // Auth middleware for Socket.io
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
    if (!token) return next(new Error('No token'))
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      socket.user = decoded
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket) => {
    const user = socket.user
    console.log(`✅ ${user.username} conectado`)

    onlineUsers.set(socket.id, {
      id: user.id,
      username: user.username,
      avatar_color: user.avatar_color,
    })

    // Send message history to the new user
    socket.emit('history', messageHistory)

    // Broadcast online users list
    io.emit('online_users', [...new Set([...onlineUsers.values()].map(u => u.username))])

    socket.on('message', async ({ content }) => {
      if (!content || typeof content !== 'string') return
      const trimmed = content.trim().slice(0, 1000)
      if (!trimmed) return

      const encryptedContent = encrypt(trimmed)

      const msg = {
        id: `${Date.now()}-${Math.random()}`,
        user_id: user.id,
        username: user.username,
        avatar_color: user.avatar_color,
        content: encryptedContent,
        created_at: new Date().toISOString(),
      }

      // Save to Supabase async (fire and forget)
      try {
        const { createClient } = require('@supabase/supabase-js')
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        )
        await supabase.from('messages').insert({
          user_id: user.id,
          username: user.username,
          avatar_color: user.avatar_color,
          content: encryptedContent,
        })
      } catch (e) {
        console.error('Error saving message:', e)
      }

      // Keep last 50 in memory
      messageHistory.push(msg)
      if (messageHistory.length > 50) messageHistory = messageHistory.slice(-50)

      io.emit('message', msg)
    })

    socket.on('disconnect', () => {
      console.log(`❌ ${user.username} desconectado`)
      onlineUsers.delete(socket.id)
      io.emit('online_users', [...new Set([...onlineUsers.values()].map(u => u.username))])
    })
  })

  const PORT = process.env.PORT || 3000
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`)
  })
})
