export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    // Get token from query params
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    // Validate token
    if (!token || typeof token !== 'string' || token.length < 20) {
      return new NextResponse(generateErrorPage('Token de verificacion invalido'), {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    // Find user with this token
    let user: { id: string; email: string; username: string; verification_token_expires: string } | null = null
    
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('id, email, username, verification_token_expires')
        .eq('verification_token', token)
        .eq('email_verified', false)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return new NextResponse(generateErrorPage('Token no encontrado o ya fue usado'), {
            status: 404,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          })
        }
        console.error('[Verify] User lookup error:', error)
        throw new Error('Error al buscar usuario')
      }

      if (!data) {
        return new NextResponse(generateErrorPage('Usuario no encontrado'), {
          status: 404,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        })
      }

      user = data
    } catch (err) {
      console.error('[Verify] Lookup error:', err)
      return new NextResponse(generateErrorPage('Error al verificar token'), {
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    // Check if token is expired
    try {
      const expiresAt = new Date(user.verification_token_expires)
      const now = new Date()

      if (now > expiresAt) {
        return new NextResponse(generateErrorPage('El enlace de verificacion ha expirado. Registrate de nuevo.'), {
          status: 410,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        })
      }
    } catch {
      // If date parsing fails, continue anyway
    }

    // Update user to verified
    try {
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          email_verified: true,
          verification_token: null,
          verification_token_expires: null,
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('[Verify] Update error:', updateError)
        throw new Error('Error al actualizar usuario')
      }
    } catch (err) {
      console.error('[Verify] Update error:', err)
      return new NextResponse(generateErrorPage('Error al verificar cuenta'), {
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    // Return success page
    return new NextResponse(generateSuccessPage(user.username), {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  } catch (err) {
    console.error('[Verify] Unhandled error:', err)
    return new NextResponse(generateErrorPage('Error interno del servidor'), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }
}

function generateSuccessPage(username: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cuenta Verificada - WZCHAT</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0a0f14;
      font-family: system-ui, -apple-system, sans-serif;
      color: #fff;
      padding: 1rem;
    }
    .card {
      background: #0d1419;
      border: 1px solid #1a2530;
      border-radius: 1rem;
      padding: 2.5rem;
      text-align: center;
      max-width: 420px;
      width: 100%;
    }
    .logo {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
      letter-spacing: 0.1em;
    }
    .logo-wz { color: #fff; }
    .logo-chat { color: #00d4ff; }
    .icon {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #00d4ff, #0099cc);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
    }
    .icon svg { width: 40px; height: 40px; color: #0a0f14; }
    h1 {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
      color: #00ff88;
    }
    p {
      color: #6b7d8f;
      margin-bottom: 1.5rem;
      line-height: 1.6;
    }
    .username {
      color: #00d4ff;
      font-weight: 600;
    }
    .btn {
      display: inline-block;
      background: #00d4ff;
      color: #0a0f14;
      padding: 0.875rem 2rem;
      border-radius: 0.5rem;
      text-decoration: none;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      transition: all 0.2s;
    }
    .btn:hover {
      background: #00b8e0;
      box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">
      <span class="logo-wz">WZ</span><span class="logo-chat">CHAT</span>
    </div>
    <div class="icon">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </div>
    <h1>Cuenta Verificada</h1>
    <p>Hola <span class="username">${escapeHtml(username)}</span>, tu cuenta ha sido verificada exitosamente. Ya puedes iniciar sesion con la contrasena que te enviamos por correo.</p>
    <a href="/" class="btn">Iniciar Sesion</a>
  </div>
</body>
</html>`
}

function generateErrorPage(message: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error de Verificacion - WZCHAT</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0a0f14;
      font-family: system-ui, -apple-system, sans-serif;
      color: #fff;
      padding: 1rem;
    }
    .card {
      background: #0d1419;
      border: 1px solid #1a2530;
      border-radius: 1rem;
      padding: 2.5rem;
      text-align: center;
      max-width: 420px;
      width: 100%;
    }
    .logo {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
      letter-spacing: 0.1em;
    }
    .logo-wz { color: #fff; }
    .logo-chat { color: #00d4ff; }
    .icon {
      width: 80px;
      height: 80px;
      background: rgba(255, 71, 87, 0.2);
      border: 2px solid #ff4757;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
    }
    .icon svg { width: 40px; height: 40px; color: #ff4757; }
    h1 {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
      color: #ff4757;
    }
    p {
      color: #6b7d8f;
      margin-bottom: 1.5rem;
      line-height: 1.6;
    }
    .btn {
      display: inline-block;
      background: transparent;
      color: #00d4ff;
      padding: 0.875rem 2rem;
      border-radius: 0.5rem;
      text-decoration: none;
      font-weight: 600;
      border: 1px solid #00d4ff;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      transition: all 0.2s;
    }
    .btn:hover {
      background: #00d4ff;
      color: #0a0f14;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">
      <span class="logo-wz">WZ</span><span class="logo-chat">CHAT</span>
    </div>
    <div class="icon">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>
    <h1>Error de Verificacion</h1>
    <p>${escapeHtml(message)}</p>
    <a href="/" class="btn">Volver al Inicio</a>
  </div>
</body>
</html>`
}

function escapeHtml(text: string): string {
  try {
    if (!text || typeof text !== 'string') return ''
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  } catch {
    return ''
  }
}
