// src/app/api/ia/insights/route.ts
import { NextResponse } from 'next/server'
import { chamarIA } from '@/lib/gemini'
import { createClient } from '@supabase/supabase-js'

const LIMITE_DIARIO = 2

export async function POST(request: Request) {
  try {
    const { userId, periodo } = await request.json()

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

    // 🔒 Plano check
    const { data: perfil } = await supabase
      .from('perfis')
      .select('tipo_plano, is_admin, nome_negocio')
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

    // 🛡️ CONTROLE DE LIMITE DIÁRIO (admin tem ilimitado)
    const hojeStr = new Date().toISOString().split('T')[0]

    if (!perfil?.is_admin) {
      const { data: usoHoje } = await supabase
        .from('uso_ia_insights')
        .select('quantidade')
        .eq('usuario_id', userId)
        .eq('data', hojeStr)
        .single()

      const usosHoje = usoHoje?.quantidade || 0

      if (usosHoje >= LIMITE_DIARIO) {
        return NextResponse.json(
          {
            erro: `Limite diário atingido (${LIMITE_DIARIO} análises). Volta amanhã!`,
            motivo: 'limite_diario',
            limite: LIMITE_DIARIO,
            usados: usosHoje,
          },
          { status: 429 }
        )
      }
    }

    // 📅 Períodos
    const hoje = new Date()
    let dataInicio = new Date()
    let dataFimAnterior = new Date()
    let dataInicioAnterior = new Date()
    let nomePeriodo = ''

    if (periodo === '7d') {
      dataInicio.setDate(hoje.getDate() - 7)
      dataFimAnterior = new Date(dataInicio)
      dataInicioAnterior.setDate(hoje.getDate() - 14)
      nomePeriodo = 'últimos 7 dias'
    } else if (periodo === '30d') {
      dataInicio.setDate(hoje.getDate() - 30)
      dataFimAnterior = new Date(dataInicio)
      dataInicioAnterior.setDate(hoje.getDate() - 60)
      nomePeriodo = 'últimos 30 dias'
    } else if (periodo === '90d') {
      dataInicio.setDate(hoje.getDate() - 90)
      dataFimAnterior = new Date(dataInicio)
      dataInicioAnterior.setDate(hoje.getDate() - 180)
      nomePeriodo = 'últimos 90 dias'
    } else {
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      dataFimAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      dataInicioAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
      nomePeriodo = 'mês atual'
    }

    // 📊 Busca dados
    const [vendasAtuaisRes, vendasAnterioresRes, produtosRes] =
      await Promise.all([
        supabase
          .from('movimentos_estoque')
          .select('*, produto:produto_id(*)')
          .eq('usuario_id', userId)
          .eq('tipo_movimento', 'saida')
          .gte('criado_em', dataInicio.toISOString())
          .lte('criado_em', hoje.toISOString()),
        supabase
          .from('movimentos_estoque')
          .select('*, produto:produto_id(*)')
          .eq('usuario_id', userId)
          .eq('tipo_movimento', 'saida')
          .gte('criado_em', dataInicioAnterior.toISOString())
          .lt('criado_em', dataFimAnterior.toISOString()),
        supabase.from('produtos').select('*').eq('usuario_id', userId),
      ])

    const vendasAtuais = vendasAtuaisRes.data || []
    const vendasAnteriores = vendasAnterioresRes.data || []
    const produtos = produtosRes.data || []

    // 🧮 Métricas
    const totalVendasAtual = vendasAtuais.reduce(
      (acc, v: any) =>
        acc + (v.quantidade || 0) * (v.produto?.preco_venda || 0),
      0
    )
    const totalVendasAnterior = vendasAnteriores.reduce(
      (acc, v: any) =>
        acc + (v.quantidade || 0) * (v.produto?.preco_venda || 0),
      0
    )
    const totalLucroAtual = vendasAtuais.reduce((acc, v: any) => {
      const pv = v.produto?.preco_venda || 0
      const pc = v.produto?.preco_custo || 0
      return acc + (v.quantidade || 0) * (pv - pc)
    }, 0)
    const qtdItensAtual = vendasAtuais.reduce(
      (acc, v: any) => acc + (v.quantidade || 0),
      0
    )
    const qtdItensAnterior = vendasAnteriores.reduce(
      (acc, v: any) => acc + (v.quantidade || 0),
      0
    )

    const vendasPorProduto: Record<string, any> = {}
    vendasAtuais.forEach((v: any) => {
      const id = v.produto_id
      if (!vendasPorProduto[id]) {
        vendasPorProduto[id] = {
          nome: v.produto?.nome || 'Desconhecido',
          categoria: v.produto?.categoria || 'Outros',
          quantidade: 0,
          receita: 0,
        }
      }
      vendasPorProduto[id].quantidade += v.quantidade || 0
      vendasPorProduto[id].receita +=
        (v.quantidade || 0) * (v.produto?.preco_venda || 0)
    })

    const topProdutos = Object.values(vendasPorProduto)
      .sort((a: any, b: any) => b.receita - a.receita)
      .slice(0, 5)

    const vendasPorCategoria: Record<string, number> = {}
    vendasAtuais.forEach((v: any) => {
      const cat = v.produto?.categoria || 'Outros'
      vendasPorCategoria[cat] =
        (vendasPorCategoria[cat] || 0) +
        (v.quantidade || 0) * (v.produto?.preco_venda || 0)
    })

    const produtosBaixoEstoque = produtos
      .filter((p: any) => p.quantidade_atual < p.quantidade_minima)
      .slice(0, 5)
      .map((p: any) => ({
        nome: p.nome,
        atual: p.quantidade_atual,
        minimo: p.quantidade_minima,
      }))

    const idsVendidos = new Set(vendasAtuais.map((v: any) => v.produto_id))
    const produtosParados = produtos
      .filter(
        (p: any) =>
          !idsVendidos.has(p.id) && p.quantidade_atual > 0 && p.ativo
      )
      .slice(0, 5)
      .map((p: any) => ({
        nome: p.nome,
        estoque: p.quantidade_atual,
      }))

    const variacaoReceita =
      totalVendasAnterior > 0
        ? ((totalVendasAtual - totalVendasAnterior) / totalVendasAnterior) * 100
        : 0
    const variacaoItens =
      qtdItensAnterior > 0
        ? ((qtdItensAtual - qtdItensAnterior) / qtdItensAnterior) * 100
        : 0

    // 🤖 PROMPT
    const prompt = `
Você é um consultor de negócios especializado em mercadinhos brasileiros. Analise os dados e gere insights úteis pro lojista.

NEGÓCIO: ${perfil?.nome_negocio || 'Mercadinho'}
PERÍODO ANALISADO: ${nomePeriodo}

📊 DADOS DO PERÍODO ATUAL:
- Receita total: R$ ${totalVendasAtual.toFixed(2)}
- Lucro estimado: R$ ${totalLucroAtual.toFixed(2)}
- Itens vendidos: ${qtdItensAtual}
- Transações: ${vendasAtuais.length}

📊 COMPARAÇÃO COM PERÍODO ANTERIOR:
- Receita anterior: R$ ${totalVendasAnterior.toFixed(2)}
- Variação receita: ${variacaoReceita.toFixed(1)}%
- Variação itens vendidos: ${variacaoItens.toFixed(1)}%

🏆 TOP 5 PRODUTOS (receita):
${topProdutos
  .map(
    (p: any, i) =>
      `${i + 1}. ${p.nome} (${p.categoria}) - ${p.quantidade} un - R$ ${p.receita.toFixed(2)}`
  )
  .join('\n')}

📂 VENDAS POR CATEGORIA:
${Object.entries(vendasPorCategoria)
  .sort(([, a], [, b]) => (b as number) - (a as number))
  .map(([cat, val]) => `- ${cat}: R$ ${(val as number).toFixed(2)}`)
  .join('\n')}

⚠️ PRODUTOS COM ESTOQUE BAIXO:
${
  produtosBaixoEstoque.length > 0
    ? produtosBaixoEstoque
        .map((p: any) => `- ${p.nome}: ${p.atual} un (mínimo: ${p.minimo})`)
        .join('\n')
    : 'Nenhum produto com estoque baixo.'
}

💤 PRODUTOS PARADOS (sem vendas no período):
${
  produtosParados.length > 0
    ? produtosParados
        .map((p: any) => `- ${p.nome}: ${p.estoque} un em estoque`)
        .join('\n')
    : 'Todos os produtos tiveram alguma venda.'
}

SUA TAREFA:
Gere uma análise em formato Markdown, em português brasileiro, com tom de consultor amigável. Use:

## 📊 Resumo
2-3 frases sobre o desempenho geral. Cite a variação em % se relevante.

## 🏆 Destaques positivos
Bullets curtos com os produtos/categorias que mais venderam.

## ⚠️ Pontos de atenção
Bullets sobre o que tá ruim (estoque baixo, produtos parados, queda).

## 💡 Sugestões de ação
3 a 5 ações práticas e específicas. Use os dados reais (nomes, números).

REGRAS:
- Frases curtas, direto ao ponto
- NUNCA invente dados que não estão acima
- Máximo 400 palavras
- Tom: amigável e profissional
`

    const resposta = await chamarIA(prompt)

    // 🛡️ Registra uso (UPSERT)
    if (!perfil?.is_admin) {
      await supabase
        .from('uso_ia_insights')
        .upsert(
          {
            usuario_id: userId,
            data: hojeStr,
            quantidade: 1,
            ultima_analise: new Date().toISOString(),
          },
          {
            onConflict: 'usuario_id,data',
            ignoreDuplicates: false,
          }
        )

      // Incrementa se já existia
      await supabase.rpc('incrementar_uso_ia', {
        p_usuario_id: userId,
        p_data: hojeStr,
      })
    }

    // Busca uso atualizado pra retornar
    const { data: usoAtualizado } = await supabase
      .from('uso_ia_insights')
      .select('quantidade')
      .eq('usuario_id', userId)
      .eq('data', hojeStr)
      .single()

    return NextResponse.json({
      sucesso: true,
      analise: resposta,
      metricas: {
        receitaAtual: totalVendasAtual,
        receitaAnterior: totalVendasAnterior,
        variacaoReceita,
        itensVendidos: qtdItensAtual,
        lucroEstimado: totalLucroAtual,
        nomePeriodo,
      },
      uso: {
        usados: usoAtualizado?.quantidade || 1,
        limite: LIMITE_DIARIO,
        restantes: Math.max(0, LIMITE_DIARIO - (usoAtualizado?.quantidade || 1)),
      },
    })
  } catch (error: any) {
    console.error('Erro IA insights:', error)
    return NextResponse.json(
      {
        sucesso: false,
        erro: error.message || 'Erro ao gerar análise',
      },
      { status: 500 } 
    )
  }
} 