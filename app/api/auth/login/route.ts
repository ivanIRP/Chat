export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '@/lib/supabase'


const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'dev-secret'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, username, password, avatar_color')
      .eq('email', email)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username, avatar_color: user.avatar_color },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar_color: user.avatar_color,
      },
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
