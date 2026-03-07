export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '@/lib/supabase'
import { sendBulkNotification, sendNotificationEmail } from '@/lib/mailer'

// Get JWT secret
function getJWTSecret(): string {
  try {
    const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET
    if (secret && typeof secret === 'string' && secret.length >= 16) {
      return secret
    }
    return 'dev-secret-change-in-production'
  } catch {
    return 'fallback-secret'
  }
}

const JWT_SECRET = getJWTSecret()

// Validate token
function validateToken(authHeader: string | null): {
  valid: boolean
  error?: string
  user?: { id: string; email: string; username: string }
} {
  try {
    if (!authHeader || typeof authHeader !== 'string') {
      return { valid: false, error: 'No authorization header' }
    }

    const token = authHeader.replace('Bearer ', '').trim()
    if (!token || token.length < 50) {
      return { valid: false, error: 'Invalid token' }
    }

    const decoded = jwt.verify(token, JWT_SECRET) as Record<string, unknown>
    if (!decoded || !decoded.id) {
      return { valid: false, error: 'Invalid token payload' }
    }

    return {
      valid: true,
      user: {
        id: decoded.id as string,
        email: decoded.email as string,
        username: decoded.username as string,
      },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Token verification failed'
    return { valid: false, error: message }
  }
}

// POST - Send notification to selected users
export async function POST(req: NextRequest) {
  try {
    // Validate authorization
    const authHeader = req.headers.get('authorization')
    const tokenValidation = validateToken(authHeader)

    if (!tokenValidation.valid || !tokenValidation.user) {
      return NextResponse.json(
        { error: tokenValidation.error || 'No autorizado', success: false },
        { status: 401 }
      )
    }

    // Parse request body
    let body: {
      recipients?: string[]  // Array of email addresses
      userIds?: string[]     // Or array of user IDs
      subject?: string
      message?: string
      sendToAll?: boolean
    }

    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { error: 'Formato de solicitud invalido', success: false },
        { status: 400 }
      )
    }

    const { recipients, userIds, subject, message, sendToAll } = body

    // Validate message content
    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      return NextResponse.json(
        { error: 'El asunto es requerido', success: false },
        { status: 400 }
      )
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'El mensaje es requerido', success: false },
        { status: 400 }
      )
    }

    if (subject.length > 200) {
      return NextResponse.json(
        { error: 'El asunto es muy largo (max 200 caracteres)', success: false },
        { status: 400 }
      )
    }

    if (message.length > 5000) {
      return NextResponse.json(
        { error: 'El mensaje es muy largo (max 5000 caracteres)', success: false },
        { status: 400 }
      )
    }

    let emailList: string[] = []

    // Option 1: Send to all users
    if (sendToAll === true) {
      try {
        const { data: allUsers, error: queryError } = await supabaseAdmin
          .from('users')
          .select('email')
          .limit(100)

        if (queryError) {
          throw new Error(queryError.message)
        }

        if (allUsers && Array.isArray(allUsers)) {
          emailList = allUsers
            .filter(u => u.email && typeof u.email === 'string' && u.email.includes('@'))
            .map(u => u.email)
        }
      } catch (err) {
        console.error('[Notification] Error fetching all users:', err)
        return NextResponse.json(
          { error: 'Error al obtener usuarios', success: false },
          { status: 500 }
        )
      }
    }
    // Option 2: Send to specific user IDs
    else if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      try {
        const validIds = userIds.filter(id => typeof id === 'string' && id.length > 0)
        
        if (validIds.length === 0) {
          return NextResponse.json(
            { error: 'No se proporcionaron IDs de usuario validos', success: false },
            { status: 400 }
          )
        }

        const { data: users, error: queryError } = await supabaseAdmin
          .from('users')
          .select('email')
          .in('id', validIds)

        if (queryError) {
          throw new Error(queryError.message)
        }

        if (users && Array.isArray(users)) {
          emailList = users
            .filter(u => u.email && typeof u.email === 'string' && u.email.includes('@'))
            .map(u => u.email)
        }
      } catch (err) {
        console.error('[Notification] Error fetching users by ID:', err)
        return NextResponse.json(
          { error: 'Error al obtener usuarios', success: false },
          { status: 500 }
        )
      }
    }
    // Option 3: Direct email list
    else if (recipients && Array.isArray(recipients) && recipients.length > 0) {
      emailList = recipients.filter(
        email => typeof email === 'string' && email.includes('@')
      )
    }

    // Validate we have recipients
    if (emailList.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron destinatarios validos', success: false },
        { status: 400 }
      )
    }

    // Limit recipients
    if (emailList.length > 100) {
      return NextResponse.json(
        { error: 'Maximo 100 destinatarios por envio', success: false },
        { status: 400 }
      )
    }

    // Send emails
    try {
      const result = await sendBulkNotification(
        emailList,
        subject.trim(),
        message.trim()
      )

      return NextResponse.json({
        success: true,
        sent: result.sent,
        failed: result.failed,
        total: emailList.length,
        errors: result.errors.slice(0, 5), // Return first 5 errors only
      })
    } catch (err) {
      console.error('[Notification] Bulk send error:', err)
      return NextResponse.json(
        { error: 'Error al enviar notificaciones', success: false },
        { status: 500 }
      )
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Error interno'
    console.error('[Notification] Unhandled error:', errorMsg)
    return NextResponse.json(
      { error: 'Error interno del servidor', success: false },
      { status: 500 }
    )
  }
}
