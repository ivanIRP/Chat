# 💬 ChatApp — Chat Cifrado en Tiempo Real

Chat global en tiempo real con cifrado AES-256, autenticación con email y WebSockets.

## Stack
- **Next.js 14** (App Router) — Frontend + API Routes
- **Socket.io** — WebSockets para tiempo real
- **Supabase** (PostgreSQL) — Base de datos y almacenamiento de usuarios/mensajes
- **bcryptjs** — Hash de contraseñas
- **crypto-js** — Cifrado AES-256 de mensajes
- **nodemailer** — Envío de correos con contraseña
- **JWT** — Sesiones de autenticación

---

## 🚀 Setup Local

### 1. Clonar e instalar
```bash
git clone <tu-repo>
cd chat-app
npm install
```

### 2. Crear proyecto en Supabase
1. Ve a [supabase.com](https://supabase.com) y crea un proyecto gratuito
2. Ve a **SQL Editor** y ejecuta el contenido de `supabase-schema.sql`
3. Copia las credenciales desde **Project Settings → API**

### 3. Configurar variables de entorno
```bash
cp .env.example .env.local
```
Edita `.env.local` con tus valores:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
ENCRYPTION_KEY=clave-de-exactamente-32-caracteres!!
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tucorreo@gmail.com
SMTP_PASS=tu-app-password-de-google
NEXTAUTH_SECRET=cualquier-string-random-largo
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> **Gmail SMTP**: Activa "Verificación en 2 pasos" y genera una "Contraseña de aplicación" en tu cuenta Google.

### 4. Correr en desarrollo
```bash
npm run dev
```

---

## 🌐 Deploy en Render

### 1. Subir a GitHub
```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/tu-usuario/chat-app.git
git push -u origin main
```

### 2. Crear Web Service en Render
1. Ve a [render.com](https://render.com) y crea cuenta
2. **New → Web Service** → conecta tu repo de GitHub
3. Configuración:
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node server.js`
   - **Plan**: Free

### 3. Variables de entorno en Render
En la sección **Environment** de tu servicio, agrega:

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Tu URL de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Tu anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Tu service role key |
| `ENCRYPTION_KEY` | String de 32 chars |
| `SMTP_HOST` | smtp.gmail.com |
| `SMTP_PORT` | 587 |
| `SMTP_USER` | tu@gmail.com |
| `SMTP_PASS` | App password |
| `NEXTAUTH_SECRET` | String random |
| `NEXT_PUBLIC_SITE_URL` | https://tu-app.onrender.com |

### 4. ¡Listo!
Render hará el build automáticamente. En ~3 minutos tu app estará en vivo.

---

## 🔐 Seguridad

| Feature | Implementación |
|---|---|
| Contraseñas | bcrypt con salt rounds 12 |
| Mensajes | AES-256 antes de guardar en DB |
| Sesiones | JWT con expiración 7 días |
| Autorización | Bearer token en API + Socket.io |

---

## 📁 Estructura

```
├── app/
│   ├── api/
│   │   ├── auth/login/       # POST login → JWT
│   │   ├── auth/register/    # POST registro + email
│   │   ├── users/            # GET lista de usuarios
│   │   └── health/           # GET health check
│   ├── chat/page.tsx         # Chat page (protegida)
│   └── page.tsx              # Login/Register page
├── components/
│   ├── ChatWindow.tsx        # Ventana de mensajes
│   └── UsersPanel.tsx        # Panel lateral de usuarios
├── hooks/
│   ├── useAuth.tsx           # Context de autenticación
│   └── useSocket.ts          # Hook WebSocket
├── lib/
│   ├── supabase.ts           # Cliente Supabase
│   ├── encryption.ts         # AES-256 encrypt/decrypt
│   └── mailer.ts             # Nodemailer
├── server.js                 # Custom server Next.js + Socket.io
├── supabase-schema.sql       # SQL para crear tablas
└── render.yaml               # Config de Render
```
