export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '@/lib/supabase'

// Get JWT secret
function getJWTSecret(): string {
  try {
    const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET
    if (secret && typeof secret === 'string' && secret.length >= 16) {
      return secret
    }
    return 'dev-secret-change-in-production-' + Date.now()
  } catch {
    return 'fallback-secret-' + Date.now()
  }
}

const JWT_SECRET = getJWTSecret()

// Validate and decode token
function validateToken(authHeader: string | null): { 
  valid: boolean
  error?: string
  userId?: string 
} {
  try {
    // Check if header exists
    if (!authHeader || typeof authHeader !== 'string') {
      return { valid: false, error: 'No authorization header' }
    }

    // Extract token
    const token = authHeader.replace('Bearer ', '').trim()
    if (!token || token.length < 50) {
      return { valid: false, error: 'Invalid token format' }
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET)
    if (!decoded || typeof decoded !== 'object') {
      return { valid: false, error: 'Invalid token payload' }
    }

    const payload = decoded as Record<string, unknown>
    if (!payload.id || typeof payload.id !== 'string') {
      return { valid: false, error: 'Missing user ID in token' }
    }

    return { valid: true, userId: payload.id }
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return { valid: false, error: 'Token expired' }
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return { valid: false, error: 'Invalid token' }
    }
    return { valid: false, error: 'Token verification failed' }
  }
}

export async function GET(req: NextRequest) {
  try {
    // Validate authorization
    const authHeader = req.headers.get('authorization')
    const tokenValidation = validateToken(authHeader)

    if (!tokenValidation.valid) {
      return NextResponse.json(
        { error: tokenValidation.error || 'No autorizado', success: false },
        { status: 401 }
      )
    }

    // Fetch users from database
    let users: Array<{
      id: string
      username: string
      email: string
      avatar_color: string
      created_at: string
    }> = []

    try {
      const { data, error: queryError } = await supabaseAdmin
        .from('users')
        .select('id, username, email, avatar_color, created_at')
        .order('username', { ascending: true })
        .limit(100) // Limit to prevent large payloads

      if (queryError) {
        console.error('[Users] Query error:', queryError)
        throw new Error(queryError.message || 'Database query failed')
      }

      if (!data) {
        users = []
      } else if (!Array.isArray(data)) {
        console.warn('[Users] Unexpected data format')
        users = []
      } else {
        // Validate and sanitize user data
        users = data
          .filter((u): u is typeof u => {
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
            avatar_color: u.avatar_color || '#6366f1',
            created_at: u.created_at || new Date().toISOString(),
          }))
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Database error'
      console.error('[Users] Database error:', errorMsg)
      return NextResponse.json(
        { error: 'Error al obtener usuarios', success: false },
        { status: 500 }
      )
    }

    // Success response
    return NextResponse.json({
      success: true,
      users,
      count: users.length,
    })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Error interno'
    console.error('[Users] Unhandled error:', errorMsg)
    return NextResponse.json(
      { error: 'Error interno del servidor', success: false },
      { status: 500 }
    )
  }
}
