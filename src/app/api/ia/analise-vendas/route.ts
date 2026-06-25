import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 })
    }

    // ✅ Cria client DENTRO da função (lazy init)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // ════════════════════════════════════════════════════
    // 🔒 VERIFICA PLANO via tabela `perfis` (não `assinaturas`!)
    // ════════════════════════════════════════════════════
    const { data: perfil, error: perfilError } = await supabaseAdmin
      .from('perfis')
      .select('plano, tipo_plano, is_admin, nome_negocio')
      .eq('id', userId)
      .single()

    if (perfilError || !perfil) {
      console.error('Erro ao buscar perfil:', perfilError)
      return NextResponse.json(
        { error: 'Perfil não encontrado' },
        { status: 404 }
      )
    }

    // ✅ Regras de acesso:
    // - Admin: acesso total (pra testar)
    // - Trial: acesso total (deixa testar tudo nos 15 dias)
    // - Profissional ou Negócio ativo: acesso liberado
    // - Iniciante ativo: bloqueado
    const podeUsarIA =
      perfil.is_admin === true ||
      perfil.plano === 'trial' ||
      perfil.tipo_plano === 'profissional' ||
      perfil.tipo_plano === 'negocio'

    if (!podeUsarIA) {
      return NextResponse.json(
        {
          error: 'plano_insuficiente',
          message:
            'Análise por IA disponível nos planos Profissional e Negócio.',
        },
        { status: 403 }
      )
    }

    // ════════════════════════════════════════════════════
    // 📊 BUSCA VENDAS dos últimos 30 dias (do user logado)
    // ════════════════════════════════════════════════════
    const dataInicio = new Date()
    dataInicio.setDate(dataInicio.getDate() - 30)

    const { data: movimentos, error: movError } = await supabaseAdmin
      .from('movimentos_estoque')
      .select('*, produtos(nome, categoria, preco_venda, preco_custo)')
      .eq('usuario_id', userId)
      .eq('tipo_movimento', 'saida')
      .gte('criado_em', dataInicio.toISOString())

    if (movError) {
      console.error('Erro ao buscar movimentos:', movError)
      return NextResponse.json(
        { error: 'Erro ao buscar vendas' },
        { status: 500 }
      )
    }

    if (!movimentos || movimentos.length === 0) {
      return NextResponse.json({
        analise:
          'Você ainda não tem vendas suficientes nos últimos 30 dias para gerar uma análise. Registre algumas vendas no PDV e volte! 📊',
      })
    }

    // ════════════════════════════════════════════════════
    // 🧮 AGREGA DADOS
    // ════════════════════════════════════════════════════
    const porProduto: Record<string, { qtd: number; receita: number; categoria: string }> = {}
    const porCategoria: Record<string, number> = {}
    let receitaTotal = 0
    let lucroTotal = 0

    for (const mov of movimentos) {
      const p = mov.produtos as { nome: string; categoria: string; preco_venda: number; preco_custo: number } | null
      if (!p) continue

      const receita = mov.quantidade * (p.preco_venda || 0)
      const lucro = mov.quantidade * ((p.preco_venda || 0) - (p.preco_custo || 0))
      receitaTotal += receita
      lucroTotal += lucro

      if (!porProduto[p.nome]) {
        porProduto[p.nome] = {
          qtd: 0,
          receita: 0,
          categoria: p.categoria || 'Sem categoria',
        }
      }
      porProduto[p.nome].qtd += mov.quantidade
      porProduto[p.nome].receita += receita

      const cat = p.categoria || 'Sem categoria'
      porCategoria[cat] = (porCategoria[cat] || 0) + receita
    }

    const topProdutos = Object.entries(porProduto)
      .sort(([, a], [, b]) => b.receita - a.receita)
      .slice(0, 10)
      .map(
        ([nome, d]) =>
          `${nome} (${d.categoria}): ${d.qtd} un / R$${d.receita.toFixed(2)}`
      )
      .join('\n')

    const categorias = Object.entries(porCategoria)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, val]) => `${cat}: R$${val.toFixed(2)}`)
      .join('\n')

    const margem = receitaTotal > 0 ? (lucroTotal / receitaTotal) * 100 : 0

    // ════════════════════════════════════════════════════
    // 🤖 PROMPT PRA GEMINI
    // ════════════════════════════════════════════════════
    const prompt = `Você é um consultor de vendas para um pequeno mercadinho brasileiro chamado "${perfil.nome_negocio || 'Mercadinho'}". Analise os dados abaixo dos últimos 30 dias e gere uma análise CURTA, prática e em português brasileiro, no estilo conversacional (como um amigo experiente). Máximo 250 palavras. Use emojis com moderação.

DADOS DOS ÚLTIMOS 30 DIAS:
- Receita total: R$${receitaTotal.toFixed(2)}
- Lucro estimado: R$${lucroTotal.toFixed(2)}
- Margem média: ${margem.toFixed(1)}%
- Total de vendas: ${movimentos.length}

TOP 10 PRODUTOS MAIS VENDIDOS:
${topProdutos}

VENDAS POR CATEGORIA:
${categorias}

Sua análise deve conter:
1. **Resumo do mês** (1-2 frases)
2. **Destaques positivos** (o que vendeu bem)
3. **Pontos de atenção** (margem baixa, categorias fracas)
4. **3 sugestões práticas** pro dono agir esta semana

Seja direto, sem enrolação. Não invente dados que não estão acima.`

    // ════════════════════════════════════════════════════
    // 🚀 CHAMA GEMINI
    // ════════════════════════════════════════════════════
    const geminiRes = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 600,
        },
      }),
    })

    if (!geminiRes.ok) {
      const err = await geminiRes.text()
      console.error('Erro Gemini:', err)
      return NextResponse.json(
        { error: 'Erro ao gerar análise' },
        { status: 500 }
      )
    }

    const geminiData = await geminiRes.json()
    const analise =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ||
      'Não foi possível gerar a análise no momento.'

    console.log(`✅ Análise IA gerada pro user ${userId}`)

    return NextResponse.json({
      analise,
      metricas: {
        receita: receitaTotal,
        lucro: lucroTotal,
        margem,
        totalVendas: movimentos.length,
      },
    })
  } catch (error) {
    console.error('Erro na análise IA:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}