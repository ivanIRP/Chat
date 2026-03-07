// WZCHAT Email service with multiple fallback options
// Supports Resend (preferred) and Nodemailer as fallback

interface EmailResult {
  success: boolean
  error?: string
  provider?: string
}

// Verification Email HTML template
function generateVerificationEmailHTML(
  username: string, 
  password: string, 
  verificationUrl: string
): string {
  try {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verifica tu cuenta - WZCHAT</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; background: #0a0f14; margin: 0; padding: 20px; }
            .container { max-width: 500px; margin: auto; background: #0d1419; border: 1px solid #1a2530; border-radius: 16px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #00d4ff, #0099cc); padding: 40px; text-align: center; }
            .header h1 { color: #0a0f14; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 0.1em; }
            .header p { color: rgba(10,15,20,0.8); margin: 8px 0 0 0; font-size: 14px; }
            .body { padding: 40px 30px; }
            .body h2 { color: #ffffff; margin: 0 0 20px 0; font-size: 20px; }
            .body p { color: #6b7d8f; line-height: 1.6; margin: 0 0 15px 0; }
            .username { color: #00d4ff; font-weight: 600; }
            .password-box { background: rgba(0,212,255,0.1); border: 1px solid rgba(0,212,255,0.3); border-radius: 12px; padding: 25px; text-align: center; margin: 25px 0; }
            .password-box .label { color: #6b7d8f; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 10px 0; }
            .password-box code { font-size: 24px; font-weight: bold; color: #00d4ff; letter-spacing: 4px; font-family: monospace; }
            .verify-btn { display: block; background: #00d4ff; color: #0a0f14 !important; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; text-align: center; margin: 25px 0; text-transform: uppercase; letter-spacing: 0.05em; }
            .verify-btn:hover { background: #00b8e0; }
            .warning { background: rgba(255,165,2,0.1); border: 1px solid rgba(255,165,2,0.3); border-radius: 8px; padding: 15px; margin-top: 20px; }
            .warning p { color: #ffa502; margin: 0; font-size: 13px; }
            .footer { text-align: center; padding: 25px; border-top: 1px solid #1a2530; }
            .footer p { color: #6b7d8f; margin: 0; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>WZCHAT</h1>
              <p>Mensajes cifrados de extremo a extremo</p>
            </div>
            <div class="body">
              <h2>Hola ${username}, verifica tu cuenta</h2>
              <p>Gracias por registrarte en WZCHAT. Para completar tu registro, necesitas verificar tu correo electronico haciendo clic en el boton de abajo.</p>
              
              <a href="${verificationUrl}" class="verify-btn">Verificar mi cuenta</a>
              
              <p>Una vez verificada tu cuenta, podras iniciar sesion con esta contrasena:</p>
              
              <div class="password-box">
                <p class="label">Tu contrasena</p>
                <code>${password}</code>
              </div>
              
              <div class="warning">
                <p>Este enlace expira en 24 horas. Si no verificas tu cuenta, tendras que registrarte de nuevo.</p>
              </div>
            </div>
            <div class="footer">
              <p>Si no creaste esta cuenta, ignora este correo.</p>
              <p style="margin-top: 8px;">WZCHAT - Comunicacion segura</p>
            </div>
          </div>
        </body>
      </html>
    `
  } catch (error) {
    console.error('[Email Template] Error generating HTML:', error)
    return `<p>Hola ${username}, verifica tu cuenta aqui: ${verificationUrl}</p><p>Tu contrasena es: ${password}</p>`
  }
}

// Welcome Email HTML template (after verification)
function generateWelcomeEmailHTML(to: string, password: string, siteUrl: string): string {
  try {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bienvenido a WZCHAT</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; background: #0a0f14; margin: 0; padding: 20px; }
            .container { max-width: 500px; margin: auto; background: #0d1419; border: 1px solid #1a2530; border-radius: 16px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #00d4ff, #0099cc); padding: 40px; text-align: center; }
            .header h1 { color: #0a0f14; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 0.1em; }
            .body { padding: 40px 30px; }
            .body h2 { color: #ffffff; margin: 0 0 20px 0; font-size: 22px; }
            .body p { color: #6b7d8f; line-height: 1.6; margin: 0 0 15px 0; }
            .password-box { background: rgba(0,212,255,0.1); border: 1px solid rgba(0,212,255,0.3); border-radius: 12px; padding: 25px; text-align: center; margin: 25px 0; }
            .password-box .label { color: #6b7d8f; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 10px 0; }
            .password-box code { font-size: 24px; font-weight: bold; color: #00d4ff; letter-spacing: 4px; font-family: monospace; }
            .email-box { background: rgba(255,255,255,0.05); border-radius: 8px; padding: 12px 16px; margin: 15px 0; }
            .email-box span { color: #ffffff; font-weight: 500; }
            .btn { display: block; background: #00d4ff; color: #0a0f14 !important; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; text-align: center; margin-top: 20px; text-transform: uppercase; letter-spacing: 0.05em; }
            .security { background: rgba(0,255,136,0.1); border: 1px solid rgba(0,255,136,0.3); border-radius: 8px; padding: 15px; margin-top: 20px; }
            .security p { color: #00ff88; margin: 0; font-size: 13px; }
            .footer { text-align: center; padding: 25px; border-top: 1px solid #1a2530; }
            .footer p { color: #6b7d8f; margin: 0; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>WZCHAT</h1>
            </div>
            <div class="body">
              <h2>Tu cuenta ha sido creada</h2>
              <p>Gracias por registrarte en WZCHAT. Aqui estan tus credenciales de acceso:</p>
              <div class="email-box">
                <span>Correo: ${to}</span>
              </div>
              <div class="password-box">
                <p class="label">Tu contrasena</p>
                <code>${password}</code>
              </div>
              <div class="security">
                <p>Todos los mensajes estan protegidos con cifrado AES-256 de extremo a extremo.</p>
              </div>
              <a href="${siteUrl}" class="btn">Ir al Chat</a>
            </div>
            <div class="footer">
              <p>Si no creaste esta cuenta, ignora este correo.</p>
            </div>
          </div>
        </body>
      </html>
    `
  } catch (error) {
    console.error('[Email Template] Error generating HTML:', error)
    return `<p>Tu contrasena para WZCHAT es: ${password}</p><p>Correo: ${to}</p>`
  }
}

// Try to send email using Resend API (no external SMTP needed)
async function sendWithResend(to: string, subject: string, html: string): Promise<EmailResult> {
  try {
    const resendApiKey = process.env.RESEND_API_KEY
    
    if (!resendApiKey || resendApiKey.trim() === '') {
      return { success: false, error: 'Resend API key not configured' }
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'WZCHAT <onboarding@resend.dev>',
        to: [to],
        subject: subject,
        html: html,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return { 
        success: false, 
        error: `Resend API error: ${response.status} - ${JSON.stringify(errorData)}`,
        provider: 'resend'
      }
    }

    return { success: true, provider: 'resend' }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Resend error'
    console.error('[Resend] Error:', message)
    return { success: false, error: message, provider: 'resend' }
  }
}

// Try to send email using Nodemailer (SMTP fallback)
async function sendWithNodemailer(to: string, subject: string, html: string): Promise<EmailResult> {
  try {
    const nodemailer = await import('nodemailer')
    
    const smtpHost = process.env.SMTP_HOST
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS
    
    if (!smtpHost || !smtpUser || !smtpPass) {
      return { success: false, error: 'SMTP credentials not configured' }
    }

    const transporter = nodemailer.default.createTransport({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })

    await transporter.sendMail({
      from: `"WZCHAT" <${smtpUser}>`,
      to,
      subject,
      html,
    })

    return { success: true, provider: 'nodemailer' }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Nodemailer error'
    console.error('[Nodemailer] Error:', message)
    return { success: false, error: message, provider: 'nodemailer' }
  }
}

// Console fallback for development
function logToConsole(to: string, password: string, verificationUrl?: string): EmailResult {
  console.log('\n===========================================')
  console.log('[WZCHAT DEV MODE] Email would be sent to:', to)
  console.log('[WZCHAT DEV MODE] Generated password:', password)
  if (verificationUrl) {
    console.log('[WZCHAT DEV MODE] Verification URL:', verificationUrl)
  }
  console.log('===========================================\n')
  return { success: true, provider: 'console' }
}

// Send verification email with password
export async function sendVerificationEmail(
  to: string, 
  username: string,
  password: string, 
  verificationUrl: string
): Promise<EmailResult> {
  // Validate inputs
  if (!to || typeof to !== 'string' || !to.includes('@')) {
    console.error('[Email] Invalid email address:', to)
    return { success: false, error: 'Invalid email address' }
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    console.error('[Email] Invalid password')
    return { success: false, error: 'Invalid password' }
  }

  if (!verificationUrl || typeof verificationUrl !== 'string') {
    console.error('[Email] Invalid verification URL')
    return { success: false, error: 'Invalid verification URL' }
  }

  const subject = 'Verifica tu cuenta en WZCHAT'
  const html = generateVerificationEmailHTML(username, password, verificationUrl)

  // Try Resend first (preferred - no SMTP needed)
  const resendResult = await sendWithResend(to, subject, html)
  if (resendResult.success) {
    console.log('[Email] Verification sent via Resend to:', to)
    return resendResult
  }

  // Try Nodemailer as fallback
  const nodemailerResult = await sendWithNodemailer(to, subject, html)
  if (nodemailerResult.success) {
    console.log('[Email] Verification sent via Nodemailer to:', to)
    return nodemailerResult
  }

  // Development fallback - log to console
  if (process.env.NODE_ENV === 'development' || !process.env.RESEND_API_KEY) {
    console.warn('[Email] All providers failed, using console fallback')
    return logToConsole(to, password, verificationUrl)
  }

  console.error('[Email] All email sending methods failed')
  return { 
    success: false, 
    error: `Failed to send email. Resend: ${resendResult.error}. Nodemailer: ${nodemailerResult.error}` 
  }
}

// Send welcome email (legacy - after verification)
export async function sendWelcomeEmail(to: string, password: string): Promise<EmailResult> {
  if (!to || typeof to !== 'string' || !to.includes('@')) {
    return { success: false, error: 'Invalid email address' }
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return { success: false, error: 'Invalid password' }
  }

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000'
  
  const subject = 'Bienvenido a WZCHAT - Tu contrasena'
  const html = generateWelcomeEmailHTML(to, password, siteUrl)

  const resendResult = await sendWithResend(to, subject, html)
  if (resendResult.success) return resendResult

  const nodemailerResult = await sendWithNodemailer(to, subject, html)
  if (nodemailerResult.success) return nodemailerResult

  if (process.env.NODE_ENV === 'development' || !process.env.RESEND_API_KEY) {
    return logToConsole(to, password)
  }

  return { success: false, error: 'All email providers failed' }
}

// Notification email for selected accounts
export async function sendNotificationEmail(
  to: string, 
  subject: string, 
  message: string
): Promise<EmailResult> {
  try {
    if (!to || !to.includes('@')) {
      return { success: false, error: 'Invalid email' }
    }

    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: system-ui, sans-serif; background: #0a0f14; margin: 0; padding: 20px; }
            .container { max-width: 500px; margin: auto; background: #0d1419; border: 1px solid #1a2530; border-radius: 16px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #00d4ff, #0099cc); padding: 30px; text-align: center; }
            .header h1 { color: #0a0f14; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.1em; }
            .body { padding: 30px; color: #ffffff; }
            .message { background: rgba(255,255,255,0.05); border-radius: 8px; padding: 20px; margin: 15px 0; line-height: 1.6; color: #6b7d8f; }
            .btn { display: block; background: #00d4ff; color: #0a0f14 !important; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; text-align: center; text-transform: uppercase; }
            .footer { text-align: center; padding: 20px; color: #6b7d8f; font-size: 12px; border-top: 1px solid #1a2530; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>WZCHAT</h1>
            </div>
            <div class="body">
              <div class="message">${message}</div>
              <a href="${siteUrl}" class="btn">Ir a WZCHAT</a>
            </div>
            <div class="footer">
              <p>WZCHAT - Comunicacion segura</p>
            </div>
          </div>
        </body>
      </html>
    `

    const resendResult = await sendWithResend(to, subject, html)
    if (resendResult.success) return resendResult

    const nodemailerResult = await sendWithNodemailer(to, subject, html)
    if (nodemailerResult.success) return nodemailerResult

    return { success: false, error: 'All email providers failed' }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Notification Email] Error:', message)
    return { success: false, error: message }
  }
}

// Bulk email to multiple recipients
export async function sendBulkNotification(
  recipients: string[],
  subject: string,
  message: string
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const result = { sent: 0, failed: 0, errors: [] as string[] }

  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    result.errors.push('No recipients provided')
    return result
  }

  for (const email of recipients) {
    try {
      const sendResult = await sendNotificationEmail(email, subject, message)
      if (sendResult.success) {
        result.sent++
      } else {
        result.failed++
        result.errors.push(`${email}: ${sendResult.error}`)
      }
    } catch (error) {
      result.failed++
      result.errors.push(`${email}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    
    // Rate limiting - wait 100ms between emails
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  return result
}
