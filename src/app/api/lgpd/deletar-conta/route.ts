import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    {
      error:
        'A exclusão automática está desativada. Solicite a exclusão pelo suporte para confirmar a titularidade e a situação da assinatura.',
      motivo: 'exclusao_manual',
    },
    { status: 410 }
  )
}
