// Email service with multiple fallback options
// Supports Resend (preferred) and Nodemailer as fallback

interface EmailResult {
  success: boolean
  error?: string
  provider?: string
}

// Email HTML template generator
function generateWelcomeEmailHTML(to: string, password: string, siteUrl: string): string {
  try {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bienvenido a ChatApp</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f0f23; margin: 0; padding: 20px; }
            .container { max-width: 500px; margin: auto; background: linear-gradient(135deg, #1e1b4b 0%, #0f0f23 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(99,102,241,0.3); }
            .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 40px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 32px; font-weight: 700; }
            .header p { color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px; }
            .body { padding: 40px 30px; }
            .body h2 { color: #e2e8f0; margin: 0 0 20px 0; font-size: 22px; }
            .body p { color: #94a3b8; line-height: 1.6; margin: 0 0 15px 0; }
            .password-box { background: rgba(99,102,241,0.15); border: 2px solid rgba(99,102,241,0.4); border-radius: 12px; padding: 25px; text-align: center; margin: 25px 0; }
            .password-box .label { color: #a5b4fc; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 10px 0; }
            .password-box code { font-size: 28px; font-weight: bold; color: #818cf8; letter-spacing: 4px; font-family: 'Courier New', monospace; }
            .email-box { background: rgba(255,255,255,0.05); border-radius: 8px; padding: 12px 16px; margin: 15px 0; }
            .email-box span { color: #e2e8f0; font-weight: 500; }
            .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white !important; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: 600; margin-top: 20px; box-shadow: 0 10px 30px rgba(99,102,241,0.4); }
            .security { background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.3); border-radius: 8px; padding: 15px; margin-top: 20px; }
            .security p { color: #86efac; margin: 0; font-size: 13px; }
            .footer { text-align: center; padding: 25px; border-top: 1px solid rgba(255,255,255,0.1); }
            .footer p { color: #64748b; margin: 0; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>ChatApp</h1>
              <p>Mensajes cifrados en tiempo real</p>
            </div>
            <div class="body">
              <h2>Tu cuenta ha sido creada</h2>
              <p>Gracias por registrarte en ChatApp. Aqui estan tus credenciales de acceso:</p>
              <div class="email-box">
                <span>Correo: ${to}</span>
              </div>
              <div class="password-box">
                <p class="label">Tu contrasena temporal</p>
                <code>${password}</code>
              </div>
              <div class="security">
                <p>Por seguridad, te recomendamos cambiar tu contrasena al ingresar. Todos los mensajes estan protegidos con cifrado AES-256.</p>
              </div>
              <center>
                <a href="${siteUrl}" class="btn">Ir al Chat</a>
              </center>
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
    return `<p>Tu contrasena para ChatApp es: ${password}</p><p>Correo: ${to}</p>`
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
        from: 'ChatApp <onboarding@resend.dev>',
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
      from: `"ChatApp" <${smtpUser}>`,
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

// Console fallback for development (logs password to console)
function logToConsole(to: string, password: string): EmailResult {
  console.log('\n===========================================')
  console.log('[DEV MODE] Email would be sent to:', to)
  console.log('[DEV MODE] Generated password:', password)
  console.log('===========================================\n')
  return { success: true, provider: 'console' }
}

// Main email sending function with multiple fallbacks
export async function sendWelcomeEmail(to: string, password: string): Promise<EmailResult> {
  // Validate inputs
  if (!to || typeof to !== 'string' || !to.includes('@')) {
    console.error('[Email] Invalid email address:', to)
    return { success: false, error: 'Invalid email address' }
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    console.error('[Email] Invalid password')
    return { success: false, error: 'Invalid password' }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000'
  
  const subject = 'Bienvenido a ChatApp - Tu contrasena'
  const html = generateWelcomeEmailHTML(to, password, siteUrl)

  // Try Resend first (preferred - no SMTP needed)
  const resendResult = await sendWithResend(to, subject, html)
  if (resendResult.success) {
    console.log('[Email] Sent successfully via Resend to:', to)
    return resendResult
  }

  // Try Nodemailer as fallback
  const nodemailerResult = await sendWithNodemailer(to, subject, html)
  if (nodemailerResult.success) {
    console.log('[Email] Sent successfully via Nodemailer to:', to)
    return nodemailerResult
  }

  // Development fallback - log to console
  if (process.env.NODE_ENV === 'development' || !process.env.RESEND_API_KEY) {
    console.warn('[Email] All providers failed, using console fallback')
    return logToConsole(to, password)
  }

  // All methods failed
  console.error('[Email] All email sending methods failed')
  return { 
    success: false, 
    error: `Failed to send email. Resend: ${resendResult.error}. Nodemailer: ${nodemailerResult.error}` 
  }
}

// Notification email for selected accounts
export async function sendNotificationEmail(
  to: string, 
  subject: string, 
  message: string
): Promise<EmailResult> {
  try {
    // Validate inputs
    if (!to || !to.includes('@')) {
      return { success: false, error: 'Invalid email' }
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', sans-serif; background: #0f0f23; margin: 0; padding: 20px; }
            .container { max-width: 500px; margin: auto; background: #1e1b4b; border-radius: 16px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .body { padding: 30px; color: #e2e8f0; }
            .message { background: rgba(255,255,255,0.05); border-radius: 8px; padding: 20px; margin: 15px 0; line-height: 1.6; }
            .btn { display: inline-block; background: #6366f1; color: white !important; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; }
            .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>ChatApp Notification</h1>
            </div>
            <div class="body">
              <div class="message">${message}</div>
              <center>
                <a href="${siteUrl}" class="btn">Ir a ChatApp</a>
              </center>
            </div>
            <div class="footer">
              <p>ChatApp - Mensajes cifrados</p>
            </div>
          </div>
        </body>
      </html>
    `

    // Try Resend first
    const resendResult = await sendWithResend(to, subject, html)
    if (resendResult.success) return resendResult

    // Try Nodemailer
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
