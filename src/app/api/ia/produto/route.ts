// src/app/api/ia/produto/route.ts
import { NextResponse } from 'next/server'
import { chamarIAJson } from '@/lib/gemini'
import { createClient } from '@supabase/supabase-js'

// Categorias padrão do EstoqueSystem
const CATEGORIAS_VALIDAS = [
  'Alimentos',
  'Bebidas',
  'Limpeza',
  'Higiene',
  'Eletrônicos',
  'Outros',
]

interface ResponseIA {
  nome: string
  descricao: string
  categoria: string
  marca?: string
  preco_sugerido_min?: number
  preco_sugerido_max?: number
  observacao?: string
}

export async function POST(request: Request) {
  try {
    const { sku, nomeOriginal, marca, descricaoOriginal, userId } =
      await request.json()

    // 🔒 SEGURANÇA: verifica se o usuário tem plano Negócio
    if (!userId) {
      return NextResponse.json(
        { erro: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

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

    // 🤖 PROMPT pra IA
    const prompt = `
Você é um assistente especializado em cadastro de produtos pra mercadinhos brasileiros.

DADOS DO PRODUTO RECEBIDO:
- Código de barras: ${sku || 'não informado'}
- Nome: ${nomeOriginal || 'não informado'}
- Marca: ${marca || 'não informada'}
- Descrição original: ${descricaoOriginal || 'não informada'}

SUA TAREFA:
Complete e melhore os dados desse produto pra cadastro num mercadinho. Retorne um JSON com:

1. "nome": Nome do produto bem formatado, com marca e tamanho quando relevante (ex: "Refrigerante Coca-Cola 350ml")
2. "descricao": Descrição curta e vendedora, MÁXIMO 100 caracteres (ex: "Refrigerante Coca-Cola tradicional, lata 350ml, refrescante")
3. "categoria": OBRIGATORIAMENTE uma destas opções exatas: ${CATEGORIAS_VALIDAS.join(', ')}
4. "marca": Marca do produto, se identificável (ex: "Coca-Cola")
5. "preco_sugerido_min": Preço mínimo de venda sugerido em reais (número, sem R$), baseado em preço de mercado brasileiro 2026
6. "preco_sugerido_max": Preço máximo de venda sugerido em reais (número, sem R$)
7. "observacao": Dica curta pro lojista sobre esse produto, se relevante (opcional, MÁXIMO 80 caracteres)

REGRAS IMPORTANTES:
- Se não tiver dados suficientes pra inferir, retorne nome "Produto sem identificação" e categoria "Outros"
- NUNCA invente dados absurdos
- Preços devem ser realistas pro mercado brasileiro de mercadinhos
- A descrição NÃO pode ter aspas duplas dentro dela
- Retorne APENAS o JSON, sem markdown nem explicação

Exemplo de retorno válido:
{
  "nome": "Refrigerante Coca-Cola 350ml",
  "descricao": "Refrigerante Coca-Cola lata 350ml, sabor original",
  "categoria": "Bebidas",
  "marca": "Coca-Cola",
  "preco_sugerido_min": 4.50,
  "preco_sugerido_max": 6.00,
  "observacao": "Produto de alta saída, mantenha sempre em estoque"
}
`

    const resposta = await chamarIAJson<ResponseIA>(prompt)

    // ✅ Valida categoria (segurança extra)
    if (!CATEGORIAS_VALIDAS.includes(resposta.categoria)) {
      resposta.categoria = 'Outros'
    }

    // ✅ Sanitiza preços
    if (
      resposta.preco_sugerido_min &&
      typeof resposta.preco_sugerido_min === 'number'
    ) {
      resposta.preco_sugerido_min = Math.max(0, resposta.preco_sugerido_min)
    }
    if (
      resposta.preco_sugerido_max &&
      typeof resposta.preco_sugerido_max === 'number'
    ) {
      resposta.preco_sugerido_max = Math.max(0, resposta.preco_sugerido_max)
    }

    return NextResponse.json({
      sucesso: true,
      dados: resposta,
    })
  } catch (error: any) {
    console.error('Erro IA produto:', error)
    return NextResponse.json(
      {
        sucesso: false,
        erro: error.message || 'Erro ao processar com IA',
      },
      { status: 500 }
    )
  }
}