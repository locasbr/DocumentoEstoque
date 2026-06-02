// src/app/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const token_hash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type')

  const baseUrl = url.origin

  // Se tem code (PKCE flow - padrão novo do Supabase)
  if (code) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      await supabase.auth.exchangeCodeForSession(code)
    } catch (error) {
      console.error('Erro ao trocar código por sessão:', error)
    }
    return NextResponse.redirect(`${baseUrl}/auth/confirmado`)
  }

  // Se tem token_hash (flow antigo)
  if (token_hash && type) {
    return NextResponse.redirect(
      `${baseUrl}/auth/confirmado?token_hash=${token_hash}&type=${type}`
    )
  }

  // Fallback — redireciona pro login
  return NextResponse.redirect(`${baseUrl}/login`)
}
