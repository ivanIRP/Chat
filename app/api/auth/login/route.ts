export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '@/lib/supabase'

// Get JWT secret with fallback
function getJWTSecret(): string {
  try {
    const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET
    if (secret && typeof secret === 'string' && secret.length >= 16) {
      return secret
    }
    console.warn('[Login] Using fallback JWT secret - set NEXTAUTH_SECRET in production!')
    return 'dev-secret-change-in-production-' + Date.now()
  } catch {
    return 'fallback-secret-' + Date.now()
  }
}

const JWT_SECRET = getJWTSecret()

// Validate email format
function isValidEmail(email: unknown): email is string {
  try {
    if (!email || typeof email !== 'string') return false
    const trimmed = email.trim().toLowerCase()
    return trimmed.includes('@') && trimmed.length >= 5 && trimmed.length <= 255
  } catch {
    return false
  }
}

// Validate password
function isValidPassword(password: unknown): password is string {
  try {
    if (!password || typeof password !== 'string') return false
    return password.length >= 4 && password.length <= 128
  } catch {
    return false
  }
}

// Rate limiting storage (in production, use Redis)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>()
const MAX_ATTEMPTS = 5
const LOCKOUT_TIME = 15 * 60 * 1000 // 15 minutes

function checkRateLimit(email: string): { allowed: boolean; remainingAttempts: number } {
  try {
    const now = Date.now()
    const attempts = loginAttempts.get(email)

    if (!attempts) {
      return { allowed: true, remainingAttempts: MAX_ATTEMPTS }
    }

    // Reset if lockout period has passed
    if (now - attempts.lastAttempt > LOCKOUT_TIME) {
      loginAttempts.delete(email)
      return { allowed: true, remainingAttempts: MAX_ATTEMPTS }
    }

    if (attempts.count >= MAX_ATTEMPTS) {
      return { allowed: false, remainingAttempts: 0 }
    }

    return { allowed: true, remainingAttempts: MAX_ATTEMPTS - attempts.count }
  } catch {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS }
  }
}

function recordFailedAttempt(email: string): void {
  try {
    const now = Date.now()
    const attempts = loginAttempts.get(email)

    if (!attempts) {
      loginAttempts.set(email, { count: 1, lastAttempt: now })
    } else {
      loginAttempts.set(email, { count: attempts.count + 1, lastAttempt: now })
    }
  } catch {
    // Ignore rate limit errors
  }
}

function clearFailedAttempts(email: string): void {
  try {
    loginAttempts.delete(email)
  } catch {
    // Ignore
  }
}

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    let body: { email?: unknown; password?: unknown }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { error: 'Formato de solicitud invalido', success: false },
        { status: 400 }
      )
    }

    const { email, password } = body

    // Validate email
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Correo electronico invalido', success: false },
        { status: 400 }
      )
    }

    // Validate password
    if (!isValidPassword(password)) {
      return NextResponse.json(
        { error: 'Contrasena invalida', success: false },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Check rate limiting
    const rateLimit = checkRateLimit(normalizedEmail)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Demasiados intentos fallidos. Intenta en 15 minutos.',
          success: false,
          locked: true,
        },
        { status: 429 }
      )
    }

    // Find user in database
    let user: {
      id: string
      email: string
      username: string
      password: string
      avatar_color: string
      email_verified: boolean | null
    } | null = null

    try {
      const { data, error: queryError } = await supabaseAdmin
        .from('users')
        .select('id, email, username, password, avatar_color, email_verified')
        .eq('email', normalizedEmail)
        .single()

      if (queryError) {
        if (queryError.code === 'PGRST116') {
          // User not found - don't reveal this, use generic message
          recordFailedAttempt(normalizedEmail)
          return NextResponse.json(
            { 
              error: 'Credenciales incorrectas',
              success: false,
              remainingAttempts: rateLimit.remainingAttempts - 1,
            },
            { status: 401 }
          )
        }
        throw queryError
      }

      user = data
    } catch (err) {
      console.error('[Login] Database query error:', err)
      return NextResponse.json(
        { error: 'Error al verificar credenciales', success: false },
        { status: 500 }
      )
    }

    if (!user || !user.password) {
      recordFailedAttempt(normalizedEmail)
      return NextResponse.json(
        { 
          error: 'Credenciales incorrectas',
          success: false,
          remainingAttempts: rateLimit.remainingAttempts - 1,
        },
        { status: 401 }
      )
    }

    // Check if email is verified
    if (user.email_verified === false) {
      return NextResponse.json(
        { 
          error: 'Tu cuenta no ha sido verificada. Revisa tu correo y haz clic en el enlace de verificacion.',
          success: false,
          needsVerification: true,
        },
        { status: 403 }
      )
    }

    // Verify password
    let passwordValid = false
    try {
      passwordValid = await bcrypt.compare(password, user.password)
    } catch (err) {
      console.error('[Login] Password comparison error:', err)
      return NextResponse.json(
        { error: 'Error al verificar credenciales', success: false },
        { status: 500 }
      )
    }

    if (!passwordValid) {
      recordFailedAttempt(normalizedEmail)
      return NextResponse.json(
        { 
          error: 'Credenciales incorrectas',
          success: false,
          remainingAttempts: rateLimit.remainingAttempts - 1,
        },
        { status: 401 }
      )
    }

    // Clear failed attempts on successful login
    clearFailedAttempts(normalizedEmail)

    // Generate JWT token
    let token: string
    try {
      token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          username: user.username,
          avatar_color: user.avatar_color,
        },
        JWT_SECRET,
        { 
          expiresIn: '7d',
          algorithm: 'HS256',
        }
      )

      if (!token || token.length < 50) {
        throw new Error('Token generation failed')
      }
    } catch (err) {
      console.error('[Login] Token generation error:', err)
      return NextResponse.json(
        { error: 'Error al generar sesion', success: false },
        { status: 500 }
      )
    }

    // Success response
    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar_color: user.avatar_color,
      },
    })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Error interno'
    console.error('[Login] Unhandled error:', errorMsg)
    return NextResponse.json(
      { error: 'Error interno del servidor', success: false },
      { status: 500 }
    )
  }
}
