-- ============================================
-- SCHEMA PARA CHATAPP EN SUPABASE
-- Ejecuta este SQL en el SQL Editor de Supabase
-- ============================================

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  password TEXT NOT NULL,           -- bcrypt hash
  avatar_color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de mensajes
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  avatar_color TEXT DEFAULT '#6366f1',
  content TEXT NOT NULL,            -- AES-256 encrypted
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);

-- Row Level Security: deshabilitado para uso via service role desde server
-- (nuestro backend usa service_role_key que bypassa RLS)
-- Si quieres habilitarlo para seguridad extra:
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Recuperar últimos 50 mensajes al conectar (ya lo hace el servidor en memoria,
-- pero aquí tienes la query por si quieres persistencia completa)
-- SELECT * FROM messages ORDER BY created_at DESC LIMIT 50;
