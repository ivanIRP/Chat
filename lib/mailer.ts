import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendWelcomeEmail(to: string, password: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  await transporter.sendMail({
    from: `"ChatApp" <${process.env.SMTP_USER}>`,
    to,
    subject: '🎉 Bienvenido a ChatApp - Tu contraseña',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
            .container { max-width: 500px; margin: auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #6366f1, #4f46e5); padding: 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .body { padding: 30px; }
            .password-box { background: #f0f4ff; border: 2px dashed #6366f1; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0; }
            .password-box code { font-size: 22px; font-weight: bold; color: #4f46e5; letter-spacing: 3px; }
            .btn { display: inline-block; background: #6366f1; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px; }
            .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💬 ChatApp</h1>
            </div>
            <div class="body">
              <h2>¡Tu cuenta ha sido creada!</h2>
              <p>Aquí están tus credenciales de acceso:</p>
              <p><strong>Correo:</strong> ${to}</p>
              <div class="password-box">
                <p style="margin:0 0 8px 0; color:#666; font-size:14px;">Tu contraseña temporal</p>
                <code>${password}</code>
              </div>
              <p>Por seguridad, te recomendamos cambiar tu contraseña al ingresar.</p>
              <center>
                <a href="${siteUrl}" class="btn">Ir al chat →</a>
              </center>
            </div>
            <div class="footer">
              <p>Si no creaste esta cuenta, ignora este correo.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  })
}
