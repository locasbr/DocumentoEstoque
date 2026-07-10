// src/app/api/ia/produto/route.ts
import { NextResponse } from 'next/server'
import { chamarIAJson } from '@/lib/gemini'
import { createClient } from '@supabase/supabase-js'

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
  confianca: 'alta' | 'media' | 'baixa'
  observacao?: string
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
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

    const { sku, nomeOriginal, marca, descricaoOriginal } = await request.json()

    // ✨ NOVA REGRA: exige nome do produto (evita alucinação)
    if (!nomeOriginal || nomeOriginal.trim().length < 3) {
      return NextResponse.json(
        {
          erro: 'Digite o nome do produto primeiro. A IA precisa de pelo menos o nome pra te ajudar.',
          motivo: 'nome_obrigatorio',
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

    // 🤖 PROMPT REFINADO — anti-alucinação
    const prompt = `
Você é um assistente especializado em cadastro de produtos pra mercadinhos brasileiros.

DADOS RECEBIDOS DO LOJISTA:
- Nome digitado: "${nomeOriginal}"
- Marca: ${marca || 'não informada'}
- Descrição: ${descricaoOriginal || 'não informada'}
- Código de barras: ${sku || 'não informado'}

REGRAS CRÍTICAS — LEIA COM ATENÇÃO:
1. NUNCA invente o nome do produto. O nome que o lojista digitou é VERDADEIRO. Apenas formate ele melhor (corrija ortografia, padronize maiúsculas/minúsculas).
2. NÃO use o código de barras para inferir o produto. Códigos de barras NÃO são confiáveis sem uma base de dados.
3. Se você não tiver CERTEZA sobre algo, use "confianca": "baixa" e seja conservador nas sugestões.
4. Trabalhe APENAS com o que o nome do produto te diz.

SUA TAREFA:
Retorne um JSON com:

1. "nome": Nome formatado e padronizado, baseado APENAS no que o lojista digitou (ex: se digitou "coca lata 350", retorne "Coca-Cola Lata 350ml")
2. "descricao": Descrição curta vendedora baseada no nome, MÁX 100 caracteres
3. "categoria": OBRIGATORIAMENTE uma dessas: ${CATEGORIAS_VALIDAS.join(', ')}
4. "marca": Marca inferida do nome (se possível). Se não conseguir inferir com clareza, retorne string vazia ""
5. "preco_sugerido_min": Preço mínimo de venda em reais (número), baseado em mercado brasileiro 2026
6. "preco_sugerido_max": Preço máximo de venda em reais (número)
7. "confianca": "alta" se o nome é claro e tu sabe do produto, "media" se tem dúvidas, "baixa" se não conseguiu identificar bem
8. "observacao": Dica curta pro lojista (opcional, MÁX 80 caracteres)

REGRAS IMPORTANTES:
- Se o nome digitado for muito vago (ex: "produto", "item", "x"), retorne "confianca": "baixa", "categoria": "Outros", e preços em 0
- NUNCA invente marcas. Se o nome for "biscoito recheado", marca = "" (vazia), nome = "Biscoito Recheado"
- Preços realistas pro mercado brasileiro de mercadinhos
- Categoria SEMPRE deve estar na lista fornecida
- Retorne APENAS o JSON, sem markdown nem explicação

EXEMPLO BOM:
Input: nome = "coca lata 350"
Output: {
  "nome": "Coca-Cola Lata 350ml",
  "descricao": "Refrigerante Coca-Cola lata 350ml, sabor original",
  "categoria": "Bebidas",
  "marca": "Coca-Cola",
  "preco_sugerido_min": 4.50,
  "preco_sugerido_max": 6.00,
  "confianca": "alta",
  "observacao": "Produto de alta saída"
}

EXEMPLO COM POUCA INFO:
Input: nome = "biscoito"
Output: {
  "nome": "Biscoito",
  "descricao": "Biscoito",
  "categoria": "Alimentos",
  "marca": "",
  "preco_sugerido_min": 3.00,
  "preco_sugerido_max": 8.00,
  "confianca": "baixa",
  "observacao": "Especifique a marca pra melhor sugestão de preço"
}
`

    const resposta = await chamarIAJson<ResponseIA>(prompt)

    // ✅ Sanitização
    if (!CATEGORIAS_VALIDAS.includes(resposta.categoria)) {
      resposta.categoria = 'Outros'
    }
    if (!['alta', 'media', 'baixa'].includes(resposta.confianca)) {
      resposta.confianca = 'baixa'
    }
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