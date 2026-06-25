// src/lib/csv-utils.ts

export interface LinhaCSV {
  linha: number // número da linha no arquivo (pra mostrar erro)
  nome: string
  sku: string
  categoria: string
  descricao: string
  quantidade_atual: number
  quantidade_minima: number
  preco_custo: number
  preco_venda: number
  data_validade: string | null
  erros: string[] // erros de validação dessa linha
}

export interface ResultadoParse {
  linhas: LinhaCSV[]
  totalValidas: number
  totalComErros: number
  erroGeral: string | null
}

const CATEGORIAS_VALIDAS = [
  'Alimentos',
  'Bebidas',
  'Limpeza',
  'Higiene',
  'Eletrônicos',
  'Outros',
]

// ════════════════════════════════════════════════════
// 📄 GERA TEMPLATE CSV
// ════════════════════════════════════════════════════
export function gerarTemplateCSV(): string {
  const headers = [
    'nome',
    'sku',
    'categoria',
    'descricao',
    'quantidade_atual',
    'quantidade_minima',
    'preco_custo',
    'preco_venda',
    'data_validade',
  ]

  const exemplos = [
    [
      'Coca-Cola 2L',
      '7894900011517',
      'Bebidas',
      'Refrigerante Coca-Cola 2 litros',
      '50',
      '10',
      '6.50',
      '9.90',
      '2025-12-31',
    ],
    [
      'Arroz Tipo 1 5kg',
      '7891234567890',
      'Alimentos',
      'Arroz branco tipo 1 pacote 5kg',
      '30',
      '5',
      '18.00',
      '24.90',
      '',
    ],
    [
      'Detergente Ype 500ml',
      '7891098000123',
      'Limpeza',
      'Detergente liquido clear 500ml',
      '40',
      '10',
      '2.20',
      '3.49',
      '',
    ],
  ]

  const linhas = [
    headers.join(';'),
    ...exemplos.map((linha) => linha.join(';')),
  ]

  return '\uFEFF' + linhas.join('\n') // BOM pra Excel abrir UTF-8 correto
}

// ════════════════════════════════════════════════════
// 📥 DOWNLOAD TEMPLATE
// ════════════════════════════════════════════════════
export function downloadTemplate() {
  const csv = gerarTemplateCSV()
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'template-produtos.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ════════════════════════════════════════════════════
// 🔍 PARSE CSV (suporta ; e ,)
// ════════════════════════════════════════════════════
export async function parsearCSV(arquivo: File): Promise<ResultadoParse> {
  try {
    const texto = await arquivo.text()

    // Remove BOM se existir
    const textoLimpo = texto.replace(/^\uFEFF/, '')

    // Quebra em linhas (suporta \r\n, \n e \r)
    const linhasRaw = textoLimpo.split(/\r\n|\n|\r/).filter((l) => l.trim())

    if (linhasRaw.length < 2) {
      return {
        linhas: [],
        totalValidas: 0,
        totalComErros: 0,
        erroGeral: 'Arquivo vazio ou só com cabeçalho. Adicione produtos!',
      }
    }

    // Detecta separador (; é mais comum no Brasil/Excel BR)
    const primeiralinha = linhasRaw[0]
    const separador = primeiralinha.includes(';') ? ';' : ','

    // Parse do cabeçalho
    const headers = primeiralinha
      .split(separador)
      .map((h) => h.trim().toLowerCase())

    const headersEsperados = [
      'nome',
      'sku',
      'categoria',
      'descricao',
      'quantidade_atual',
      'quantidade_minima',
      'preco_custo',
      'preco_venda',
      'data_validade',
    ]

    const headersFaltando = headersEsperados.filter((h) => !headers.includes(h))
    if (headersFaltando.length > 0) {
      return {
        linhas: [],
        totalValidas: 0,
        totalComErros: 0,
        erroGeral: `Cabeçalho inválido. Faltando: ${headersFaltando.join(', ')}. Baixe o template!`,
      }
    }

    // Mapa de índices das colunas
    const idx = (campo: string) => headers.indexOf(campo)

    // ════════════════════════════════════════════════════
    // 🔍 PROCESSA CADA LINHA
    // ════════════════════════════════════════════════════
    const linhas: LinhaCSV[] = []

    for (let i = 1; i < linhasRaw.length; i++) {
      const valores = linhasRaw[i].split(separador).map((v) => v.trim())
      const numeroLinha = i + 1 // +1 porque linha 1 é cabeçalho
      const erros: string[] = []

      const nome = valores[idx('nome')] || ''
      const sku = valores[idx('sku')] || ''
      const categoria = valores[idx('categoria')] || ''
      const descricao = valores[idx('descricao')] || ''
      const dataValidade = valores[idx('data_validade')] || ''

      // ── VALIDAÇÕES ──
      if (!nome || nome.length < 2) {
        erros.push('Nome é obrigatório (mín 2 caracteres)')
      }
      if (!sku) {
        erros.push('SKU é obrigatório')
      }
      if (categoria && !CATEGORIAS_VALIDAS.includes(categoria)) {
        erros.push(
          `Categoria inválida. Use: ${CATEGORIAS_VALIDAS.join(', ')}`
        )
      }

      // Números — aceita vírgula ou ponto
      const parseNum = (val: string): number => {
        if (!val) return 0
        return parseFloat(val.replace(',', '.')) || 0
      }

      const quantidade_atual = parseInt(valores[idx('quantidade_atual')] || '0')
      const quantidade_minima = parseInt(valores[idx('quantidade_minima')] || '0')
      const preco_custo = parseNum(valores[idx('preco_custo')])
      const preco_venda = parseNum(valores[idx('preco_venda')])

      if (isNaN(quantidade_atual) || quantidade_atual < 0) {
        erros.push('Quantidade atual deve ser número ≥ 0')
      }
      if (isNaN(quantidade_minima) || quantidade_minima < 0) {
        erros.push('Quantidade mínima deve ser número ≥ 0')
      }
      if (preco_venda <= 0) {
        erros.push('Preço de venda deve ser maior que zero')
      }
      if (preco_custo < 0) {
        erros.push('Preço de custo não pode ser negativo')
      }
      if (preco_custo > 0 && preco_venda < preco_custo) {
        erros.push('Preço de venda menor que o custo (você terá prejuízo)')
      }

      // Validação de data
      let dataValidadeFormatada: string | null = null
      if (dataValidade) {
        // Aceita formatos: 2025-12-31, 31/12/2025, 31-12-2025
        let dataFormatada = dataValidade

        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataValidade)) {
          const [dia, mes, ano] = dataValidade.split('/')
          dataFormatada = `${ano}-${mes}-${dia}`
        } else if (/^\d{2}-\d{2}-\d{4}$/.test(dataValidade)) {
          const [dia, mes, ano] = dataValidade.split('-')
          dataFormatada = `${ano}-${mes}-${dia}`
        }

        const data = new Date(dataFormatada)
        if (isNaN(data.getTime())) {
          erros.push('Data inválida (use AAAA-MM-DD ou DD/MM/AAAA)')
        } else {
          dataValidadeFormatada = dataFormatada
        }
      }

      linhas.push({
        linha: numeroLinha,
        nome,
        sku,
        categoria: categoria || 'Outros',
        descricao,
        quantidade_atual,
        quantidade_minima,
        preco_custo,
        preco_venda,
        data_validade: dataValidadeFormatada,
        erros,
      })
    }

    const totalValidas = linhas.filter((l) => l.erros.length === 0).length
    const totalComErros = linhas.filter((l) => l.erros.length > 0).length

    return {
      linhas,
      totalValidas,
      totalComErros,
      erroGeral: null,
    }
  } catch (err: any) {
    return {
      linhas: [],
      totalValidas: 0,
      totalComErros: 0,
      erroGeral: `Erro ao ler arquivo: ${err.message || 'desconhecido'}`,
    }
  }
}