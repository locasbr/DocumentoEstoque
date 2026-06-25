// src/app/api/ia/insights/uso/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const LIMITE_DIARIO = 2

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ erro: 'userId obrigatório' }, { status: 400 })
    }

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