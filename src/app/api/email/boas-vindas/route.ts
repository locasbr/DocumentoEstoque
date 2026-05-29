import { NextRequest, NextResponse } from 'next/server'
import { enviarBoasVindas } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email, nome } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email obrigatório' }, { status: 400 })
    }

    await enviarBoasVindas(email, nome)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro ao enviar email' }, { status: 500 })
  }
}