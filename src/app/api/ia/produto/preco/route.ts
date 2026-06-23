// src/app/api/ia/preco/route.ts
import { NextResponse } from 'next/server'
import { chamarIAJson } from '@/lib/gemini'
import { createClient } from '@supabase/supabase-js'

interface ResponseIA {
  preco_conservador: number
  preco_equilibrado: number
  preco_agressivo: number
  margem_conservadora_pct: number
  margem_equilibrada_pct: number
  margem_agressiva_pct: number
  explicacao: string
  recomendacao: 'conservador' | 'equilibrado' | 'agressivo'
  alerta?: string
}

export async function POST(request: Request) {
  try {
    const { nome, categoria, marca, descricao, precoCusto, userId } =
      await request.json()

    // 🔒 Auth
    if (!userId) {
      return NextResponse.json(
        { erro: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    // ✨ Validações de entrada
    if (!nome || nome.trim().length < 3) {
      return NextResponse.json(
        {
          erro: 'Digite o nome do produto primeiro',
          motivo: 'nome_obrigatorio',
        },
        { status: 400 }
      )
    }

    if (!precoCusto || precoCusto <= 0) {
      return NextResponse.json(
        {
          erro: 'Digite o preço de custo primeiro pra IA calcular a margem',
          motivo: 'custo_obrigatorio',
        },
        { status: 400 }
      )
    }

    // 🔒 Plano check
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: perfil } = await supabase
      .from('perfis')
      .select('tipo_plano, is_admin')
      .eq('id', userId)
      .single()

    const podeUsarIA =
      perfil?.is_admin === true || perfil?.tipo_plano === 'negocio'

    if (!podeUsarIA) {
      return NextResponse.json(
        {
          erro: 'IA disponível apenas no plano Negócio',
          upgrade: true,
        },
        { status: 403 }
      )
    }

    // 🤖 PROMPT
    const prompt = `
Você é um consultor de precificação especializado em mercadinhos brasileiros.

DADOS DO PRODUTO:
- Nome: ${nome}
- Categoria: ${categoria || 'não informada'}
- Marca: ${marca || 'não informada'}
- Descrição: ${descricao || 'não informada'}
- PREÇO DE CUSTO: R$ ${precoCusto.toFixed(2)}

SUA TAREFA:
Sugerir 3 níveis de preço de venda baseados na realidade do mercado brasileiro de mercadinhos em 2026.

REGRAS DE NEGÓCIO POR CATEGORIA:
- Bebidas: margem 30-45% (concorrência alta, mas giro rápido)
- Alimentos: margem 25-50% (depende do produto, perecível vs não)
- Limpeza: margem 35-55% (giro médio, margem boa)
- Higiene: margem 30-50% (concorrência média)
- Eletrônicos: margem 20-35% (concorrência alta com grandes redes)
- Outros: margem 30-50% (padrão seguro)

TIPOS DE PREÇO:
- "conservador": menor margem, mais competitivo, foco em volume
- "equilibrado": margem ideal, balança lucro com competitividade (RECOMENDADO na maioria dos casos)
- "agressivo": maior margem, foco em lucro por unidade (usar quando produto é único/diferenciado)

REGRAS CRÍTICAS:
1. Os preços DEVEM ser MAIORES que o custo (R$ ${precoCusto.toFixed(2)})
2. Arredonde pra valores comerciais (ex: 4.99, 5.50, 9.90)
3. Considere se o produto tem concorrência forte (Coca-Cola = muita) ou é mais único
4. NUNCA sugira preços absurdamente altos
5. A explicação deve ser CURTA e em linguagem de lojista (sem jargão)

RETORNE APENAS JSON:
{
  "preco_conservador": 4.50,
  "preco_equilibrado": 4.99,
  "preco_agressivo": 5.50,
  "margem_conservadora_pct": 28,
  "margem_equilibrada_pct": 42,
  "margem_agressiva_pct": 57,
  "explicacao": "Refrigerante de marca forte tem concorrência alta. Equilibrado é o ideal pra manter clientes voltando.",
  "recomendacao": "equilibrado",
  "alerta": "Concorrentes grandes vendem Coca-Cola por preços baixos"
}

EXEMPLO PARA PRODUTO COM CUSTO BAIXO:
Se o custo é R$ 0,50 (ex: bala), pode sugerir preços tipo R$ 0,80, R$ 1,00, R$ 1,50.

EXEMPLO PARA PRODUTO CARO:
Se o custo é R$ 50,00 (ex: pilha alcalina), use margens menores: R$ 65, R$ 75, R$ 85.

NUNCA escreva nada além do JSON. Sem markdown, sem explicações fora dele.
`

    const resposta = await chamarIAJson<ResponseIA>(prompt)

    // ✅ Sanitização anti-erro
    const custo = Number(precoCusto)

    // Garante que TODOS os preços são maiores que o custo
    resposta.preco_conservador = Math.max(
      custo * 1.05,
      Number(resposta.preco_conservador) || custo * 1.2
    )
    resposta.preco_equilibrado = Math.max(
      resposta.preco_conservador * 1.05,
      Number(resposta.preco_equilibrado) || custo * 1.4
    )
    resposta.preco_agressivo = Math.max(
      resposta.preco_equilibrado * 1.05,
      Number(resposta.preco_agressivo) || custo * 1.6
    )

    // Recalcula margens com base nos preços sanitizados
    resposta.margem_conservadora_pct = Math.round(
      ((resposta.preco_conservador - custo) / resposta.preco_conservador) * 100
    )
    resposta.margem_equilibrada_pct = Math.round(
      ((resposta.preco_equilibrado - custo) / resposta.preco_equilibrado) * 100
    )
    resposta.margem_agressiva_pct = Math.round(
      ((resposta.preco_agressivo - custo) / resposta.preco_agressivo) * 100
    )

    // Recomendação default
    if (
      !['conservador', 'equilibrado', 'agressivo'].includes(
        resposta.recomendacao
      )
    ) {
      resposta.recomendacao = 'equilibrado'
    }

    return NextResponse.json({
      sucesso: true,
      dados: resposta,
    })
  } catch (error: any) {
    console.error('Erro IA preço:', error)
    return NextResponse.json(
      {
        sucesso: false,
        erro: error.message || 'Erro ao processar com IA',
      },
      { status: 500 }
    )
  }
}