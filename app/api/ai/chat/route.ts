export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'dev-secret'
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || ''

// Available models with fallbacks
const MODELS = {
  primary: 'openai/gpt-3.5-turbo',
  fallback: 'mistralai/mistral-7b-instruct',
  free: 'nousresearch/nous-capybara-7b:free',
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

// Validate JWT token
function validateToken(authHeader: string | null): { valid: boolean; error?: string; user?: Record<string, unknown> } {
  try {
    if (!authHeader || typeof authHeader !== 'string') {
      return { valid: false, error: 'No authorization header' }
    }

    const token = authHeader.replace('Bearer ', '').trim()
    if (!token || token.length === 0) {
      return { valid: false, error: 'Empty token' }
    }

    const decoded = jwt.verify(token, JWT_SECRET)
    if (!decoded || typeof decoded !== 'object') {
      return { valid: false, error: 'Invalid token payload' }
    }

    return { valid: true, user: decoded as Record<string, unknown> }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Token verification failed'
    return { valid: false, error: message }
  }
}

// Call OpenRouter API with error handling and retries
async function callOpenRouter(
  messages: ChatMessage[],
  model: string = MODELS.primary
): Promise<{ success: boolean; content?: string; error?: string }> {
  try {
    if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY.trim() === '') {
      return { success: false, error: 'OpenRouter API key not configured' }
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return { success: false, error: 'No messages provided' }
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'ChatApp AI Assistant',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: `Eres un asistente de IA amigable y util integrado en ChatApp. 
            Responde siempre en espanol a menos que el usuario escriba en otro idioma.
            Se conciso pero informativo. Puedes ayudar con preguntas generales, 
            programacion, consejos y conversacion casual.
            Nunca reveles informacion sobre tu implementacion interna.`,
          },
          ...messages,
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData?.error?.message || `HTTP ${response.status}`
      console.error('[OpenRouter] API Error:', errorMessage)
      return { success: false, error: errorMessage }
    }

    const data = await response.json()
    
    if (!data || !data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      return { success: false, error: 'Invalid response structure from AI' }
    }

    const content = data.choices[0]?.message?.content
    if (!content || typeof content !== 'string') {
      return { success: false, error: 'Empty response from AI' }
    }

    return { success: true, content: content.trim() }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown AI error'
    console.error('[OpenRouter] Exception:', message)
    return { success: false, error: message }
  }
}

export async function POST(req: NextRequest) {
  try {
    // Validate authentication
    const authHeader = req.headers.get('authorization')
    const tokenValidation = validateToken(authHeader)
    
    if (!tokenValidation.valid) {
      return NextResponse.json(
        { error: tokenValidation.error || 'No autorizado', success: false },
        { status: 401 }
      )
    }

    // Parse request body
    let body: { messages?: ChatMessage[]; model?: string }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body', success: false },
        { status: 400 }
      )
    }

    const { messages, model } = body

    // Validate messages
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required', success: false },
        { status: 400 }
      )
    }

    if (messages.length === 0) {
      return NextResponse.json(
        { error: 'At least one message is required', success: false },
        { status: 400 }
      )
    }

    // Sanitize messages
    const sanitizedMessages: ChatMessage[] = messages
      .filter(m => m && typeof m === 'object' && m.role && m.content)
      .map(m => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: String(m.content).slice(0, 4000), // Limit message length
      }))

    if (sanitizedMessages.length === 0) {
      return NextResponse.json(
        { error: 'No valid messages found', success: false },
        { status: 400 }
      )
    }

    // Try primary model
    let result = await callOpenRouter(sanitizedMessages, model || MODELS.primary)

    // If primary fails, try fallback model
    if (!result.success && !model) {
      console.log('[OpenRouter] Primary model failed, trying fallback...')
      result = await callOpenRouter(sanitizedMessages, MODELS.fallback)
    }

    // If fallback fails, try free model
    if (!result.success && !model) {
      console.log('[OpenRouter] Fallback model failed, trying free model...')
      result = await callOpenRouter(sanitizedMessages, MODELS.free)
    }

    if (result.success && result.content) {
      return NextResponse.json({
        success: true,
        content: result.content,
        model: model || MODELS.primary,
      })
    } else {
      return NextResponse.json(
        { 
          error: result.error || 'Failed to get AI response', 
          success: false,
          fallback_message: 'Lo siento, el servicio de IA no esta disponible en este momento. Por favor intenta mas tarde.'
        },
        { status: 503 }
      )
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    console.error('[AI Chat Route] Exception:', message)
    return NextResponse.json(
      { error: 'Error interno del servidor', success: false },
      { status: 500 }
    )
  }
}
