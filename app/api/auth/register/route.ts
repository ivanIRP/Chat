export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabase'
import { sendVerificationEmail } from '@/lib/mailer'

const COLORS = ['#00d4ff', '#00ff88', '#ff6b6b', '#ffa502', '#a55eea', '#26de81', '#fd79a8', '#00cec9']

// Generate secure random password
function randomPassword(length = 12): string {
  try {
    const upperChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
    const lowerChars = 'abcdefghjkmnpqrstuvwxyz'
    const numbers = '23456789'
    const symbols = '!@#$%'
    const allChars = upperChars + lowerChars + numbers + symbols

    let password = ''
    password += upperChars[Math.floor(Math.random() * upperChars.length)]
    password += lowerChars[Math.floor(Math.random() * lowerChars.length)]
    password += numbers[Math.floor(Math.random() * numbers.length)]
    password += symbols[Math.floor(Math.random() * symbols.length)]

    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)]
    }

    return password.split('').sort(() => Math.random() - 0.5).join('')
  } catch (error) {
    console.error('[Register] Password generation error:', error)
    return 'TempPass' + Date.now().toString(36) + '!'
  }
}

// Generate verification token
function generateVerificationToken(): string {
  try {
    return crypto.randomBytes(32).toString('hex')
  } catch {
    return crypto.randomUUID() + Date.now().toString(36)
  }
}

// Validate email format
function isValidEmail(email: unknown): email is string {
  try {
    if (!email || typeof email !== 'string') return false
    const trimmed = email.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(trimmed) && trimmed.length >= 5 && trimmed.length <= 255
  } catch {
    return false
  }
}

// Validate username format
function isValidUsername(username: unknown): username is string {
  try {
    if (!username || typeof username !== 'string') return false
    const trimmed = username.trim()
    return trimmed.length >= 3 && trimmed.length <= 30
  } catch {
    return false
  }
}

// Get random avatar color
function getRandomColor(): string {
  try {
    return COLORS[Math.floor(Math.random() * COLORS.length)] || '#00d4ff'
  } catch {
    return '#00d4ff'
  }
}

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    let body: { email?: unknown; username?: unknown }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { error: 'Formato de solicitud invalido', success: false },
        { status: 400 }
      )
    }

    const { email, username } = body

    // Validate email
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Correo electronico invalido', success: false },
        { status: 400 }
      )
    }

    // Validate username
    if (!isValidUsername(username)) {
      return NextResponse.json(
        { error: 'Nombre de usuario invalido. Usa 3-30 caracteres', success: false },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()
    const normalizedUsername = username.trim()

    // Check if email already exists
    try {
      const { data: existingEmail, error: emailCheckError } = await supabaseAdmin
        .from('users')
        .select('id, email_verified')
        .eq('email', normalizedEmail)
        .single()

      if (emailCheckError && emailCheckError.code !== 'PGRST116') {
        console.error('[Register] Email check error:', emailCheckError)
        throw new Error('Error al verificar correo')
      }

      if (existingEmail) {
        // If user exists but not verified, allow re-registration
        if (existingEmail.email_verified === false) {
          // Delete old unverified user
          await supabaseAdmin.from('users').delete().eq('id', existingEmail.id)
        } else {
          return NextResponse.json(
            { error: 'Este correo ya esta registrado', success: false },
            { status: 409 }
          )
        }
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'Error al verificar correo') {
        throw err
      }
    }

    // Check if username already exists
    try {
      const { data: existingUsername, error: usernameCheckError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('username', normalizedUsername)
        .single()

      if (usernameCheckError && usernameCheckError.code !== 'PGRST116') {
        console.error('[Register] Username check error:', usernameCheckError)
        throw new Error('Error al verificar nombre de usuario')
      }

      if (existingUsername) {
        return NextResponse.json(
          { error: 'Este nombre de usuario ya esta en uso', success: false },
          { status: 409 }
        )
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'Este nombre de usuario ya esta en uso') {
        throw err
      }
    }

    // Generate password, verification token, and hash
    const plainPassword = randomPassword(12)
    const verificationToken = generateVerificationToken()
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    
    let hashedPassword: string
    
    try {
      hashedPassword = await bcrypt.hash(plainPassword, 12)
      if (!hashedPassword || hashedPassword.length < 20) {
        throw new Error('Password hashing failed')
      }
    } catch (err) {
      console.error('[Register] Password hashing error:', err)
      return NextResponse.json(
        { error: 'Error al procesar contrasena', success: false },
        { status: 500 }
      )
    }

    const avatarColor = getRandomColor()

    // Create user in database with email_verified = false
    let user: { id: string; email: string; username: string; avatar_color: string }
    try {
      const { data, error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          email: normalizedEmail,
          username: normalizedUsername,
          password: hashedPassword,
          avatar_color: avatarColor,
          email_verified: false,
          verification_token: verificationToken,
          verification_token_expires: tokenExpires.toISOString(),
        })
        .select('id, email, username, avatar_color')
        .single()

      if (insertError) {
        console.error('[Register] Insert error:', insertError)
        
        if (insertError.code === '23505') {
          return NextResponse.json(
            { error: 'El correo o nombre de usuario ya existe', success: false },
            { status: 409 }
          )
        }
        
        throw new Error(insertError.message || 'Error al crear usuario')
      }

      if (!data || !data.id) {
        throw new Error('No se pudo crear el usuario')
      }

      user = data
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al crear usuario'
      console.error('[Register] User creation error:', errorMsg)
      return NextResponse.json(
        { error: errorMsg, success: false },
        { status: 500 }
      )
    }

    // Build verification URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000'
    const verificationUrl = `${baseUrl}/api/auth/verify?token=${verificationToken}`

    // Send verification email with password
    try {
      const emailResult = await sendVerificationEmail(
        normalizedEmail, 
        normalizedUsername,
        plainPassword, 
        verificationUrl
      )
      
      if (!emailResult.success) {
        console.warn('[Register] Email sending failed:', emailResult.error)
      } else {
        console.log('[Register] Verification email sent via:', emailResult.provider)
      }
    } catch (err) {
      console.error('[Register] Email error:', err)
    }

    // Success response
    return NextResponse.json({
      success: true,
      message: 'Cuenta creada. Revisa tu correo para confirmar tu cuenta y obtener tu contrasena.',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Error interno del servidor'
    console.error('[Register] Unhandled error:', errorMsg)
    return NextResponse.json(
      { error: 'Error al registrar usuario. Intenta de nuevo.', success: false },
      { status: 500 }
    )
  }
}
