import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'dev-secret'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const token = authHeader.replace('Bearer ', '')
    jwt.verify(token, JWT_SECRET)
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, username, email, avatar_color, created_at')
      .order('username')
    if (error) throw error
    return NextResponse.json({ users })
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}