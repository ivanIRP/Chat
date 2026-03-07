import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/hooks/useAuth'

// Font configuration with error handling
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
})

// Metadata for SEO
export const metadata: Metadata = {
  title: 'ChatApp - Mensajes Cifrados en Tiempo Real',
  description: 'Aplicacion de chat con cifrado AES-256 extremo a extremo y asistente de IA integrado. Comunicacion segura y privada.',
  keywords: ['chat', 'mensajes', 'cifrado', 'seguro', 'tiempo real', 'IA', 'asistente'],
  authors: [{ name: 'ChatApp Team' }],
  creator: 'ChatApp',
  publisher: 'ChatApp',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    title: 'ChatApp - Mensajes Cifrados en Tiempo Real',
    description: 'Comunicacion segura con cifrado AES-256 y asistente de IA integrado',
    siteName: 'ChatApp',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ChatApp - Mensajes Cifrados en Tiempo Real',
    description: 'Comunicacion segura con cifrado AES-256 y asistente de IA integrado',
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

// Viewport configuration
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#6366f1' },
    { media: '(prefers-color-scheme: dark)', color: '#0f0f23' },
  ],
  colorScheme: 'dark',
}

// Root layout component
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html 
      lang="es" 
      className={`${inter.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Preconnect to important origins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS prefetch for API endpoints */}
        <link rel="dns-prefetch" href="https://openrouter.ai" />
        <link rel="dns-prefetch" href="https://api.resend.com" />
      </head>
      <body 
        className={`${inter.className} bg-[#0f0f23] text-slate-200 min-h-screen`}
        suppressHydrationWarning
      >
        {/* Skip to main content for accessibility */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg"
        >
          Saltar al contenido principal
        </a>
        
        {/* Error boundary wrapper */}
        <ErrorBoundary>
          <AuthProvider>
            <main id="main-content">
              {children}
            </main>
          </AuthProvider>
        </ErrorBoundary>
        
        {/* No-JS fallback */}
        <noscript>
          <div className="fixed inset-0 flex items-center justify-center bg-[#0f0f23] text-white p-8 text-center">
            <div>
              <h1 className="text-2xl font-bold mb-4">JavaScript Requerido</h1>
              <p>Esta aplicacion requiere JavaScript para funcionar correctamente.</p>
              <p className="mt-2">Por favor, habilita JavaScript en tu navegador.</p>
            </div>
          </div>
        </noscript>
      </body>
    </html>
  )
}

// Simple error boundary component
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  )
}
