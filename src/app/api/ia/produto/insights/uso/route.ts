// src/app/api/ia/insights/uso/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const LIMITE_DIARIO = 2

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')

    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
      }
    )

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      )
    }

    const userId = user.id

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Admin tem ilimitado
    const { data: perfil } = await supabase
      .from('perfis')
      .select('is_admin')
      .eq('id', userId)
      .single()

    if (perfil?.is_admin) {
      return NextResponse.json({
        usados: 0,
        limite: 999,
        restantes: 999,
        ilimitado: true,
      })
    }

    const hojeStr = new Date().toISOString().split('T')[0]

    const { data } = await supabase
      .from('uso_ia_insights')
      .select('quantidade')
      .eq('usuario_id', userId)
      .eq('data', hojeStr)
      .single()

    const usados = data?.quantidade || 0

    return NextResponse.json({
      usados,
      limite: LIMITE_DIARIO,
      restantes: Math.max(0, LIMITE_DIARIO - usados),
      ilimitado: false,
    })
  } catch (error: any) {
    return NextResponse.json({ erro: error.message }, { status: 500 })
  }
}