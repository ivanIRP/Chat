import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'
import { sendWelcomeEmail } from '@/lib/mailer'
export const dynamic = 'force-dynamic'

const COLORS = ['#6366f1','#ec4899','#14b8a6','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#84cc16']

function randomPassword(length = 10): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function POST(req: NextRequest) {
  try {
    const { email, username } = await req.json()

    if (!email || !username) {
      return NextResponse.json({ error: 'Email y username son requeridos' }, { status: 400 })
    }

    // Check if email already exists
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Este correo ya está registrado' }, { status: 409 })
    }

    const plainPassword = randomPassword()
    const hashedPassword = await bcrypt.hash(plainPassword, 12)
    const avatarColor = COLORS[Math.floor(Math.random() * COLORS.length)]

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert({ email, username, password: hashedPassword, avatar_color: avatarColor })
      .select('id, email, username, avatar_color')
      .single()

    if (error) throw error

    // Send email with plain password
    await sendWelcomeEmail(email, plainPassword)

    return NextResponse.json({
      message: 'Usuario creado. Revisa tu correo para obtener tu contraseña.',
      user: { id: user.id, email: user.email, username: user.username },
    })
  } catch (err: unknown) {
    console.error(err)
    return NextResponse.json({ error: 'Error al registrar usuario' }, { status: 500 })
  }
}
