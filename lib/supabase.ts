import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Safe environment variable retrieval with fallbacks
function getEnvVar(key: string, fallback: string): string {
  try {
    const value = process.env[key]
    if (value && typeof value === 'string' && value.trim() !== '') {
      return value.trim()
    }
    return fallback
  } catch {
    return fallback
  }
}

const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL', 'https://placeholder.supabase.co')
const supabaseAnonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'placeholder-key')
const supabaseServiceKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY', 'placeholder-key')

// Create client with error handling
function createSafeClient(url: string, key: string, options?: object): SupabaseClient {
  try {
    if (!url || !key) {
      console.error('[Supabase] Missing URL or key')
    }
    return createClient(url, key, options)
  } catch (error) {
    console.error('[Supabase] Failed to create client:', error)
    return createClient(url, key, options)
  }
}

export const supabase = createSafeClient(supabaseUrl, supabaseAnonKey)

export const supabaseAdmin = createSafeClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// Helper function for safe database queries with error handling
export async function safeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: Error | null }>
): Promise<{ data: T | null; error: string | null; success: boolean }> {
  try {
    const result = await queryFn()
    if (result.error) {
      console.error('[Supabase Query Error]:', result.error)
      return { data: null, error: result.error.message || 'Database query failed', success: false }
    }
    return { data: result.data, error: null, success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error'
    console.error('[Supabase Query Exception]:', message)
    return { data: null, error: message, success: false }
  }
}
