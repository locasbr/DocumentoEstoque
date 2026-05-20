/**
 * Exportar dados para CSV
 */
export function exportToCSV(
  filename: string,
  headers: string[],
  rows: (string | number)[][]
) {
  // Criar CSV
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((cell) => {
          // Escapar aspas e envolver em aspas se necessário
          const str = String(cell)
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str
        })
        .join(',')
    ),
  ].join('\n')

  // Criar blob e download
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Exportar Relatório de Vendas para CSV
 */
export function exportVendasCSV(
  vendasPorProduto: Array<{
    produto_nome: string
    quantidade_vendida: number
    valor_total: number
  }>,
  dataInicio: string,
  dataFim: string
) {
  const headers = ['Produto', 'Quantidade Vendida', 'Valor Total (R$)']
  const rows = vendasPorProduto.map((v) => [
    v.produto_nome,
    v.quantidade_vendida,
    v.valor_total.toFixed(2),
  ])

  exportToCSV(`vendas_${dataInicio}_a_${dataFim}`, headers, rows)
}

/**
 * Exportar Movimentação Diária para CSV
 */
export function exportMovimentosDiariosCSV(
  movimentos: Array<{
    data: string
    entradas: number
    saidas: number
  }>,
  periodo: string
) {
  const headers = ['Data', 'Entradas', 'Saídas', 'Saldo']
  const rows = movimentos.map((m) => [
    m.data,
    m.entradas,
    m.saidas,
    m.entradas - m.saidas,
  ])

  exportToCSV(`movimentos_${periodo}`, headers, rows)
}

/**
 * Exportar Listagem de Produtos para CSV
 */
export function exportProdutosCSV(
  produtos: Array<{
    nome: string
    sku: string
    categoria: string
    quantidade_atual: number
    quantidade_minima: number
    preco_venda: number
  }>
) {
  const headers = [
    'Nome',
    'SKU',
    'Categoria',
    'Quantidade Atual',
    'Quantidade Mínima',
    'Preço (R$)',
  ]
  const rows = produtos.map((p) => [
    p.nome,
    p.sku,
    p.categoria,
    p.quantidade_atual,
    p.quantidade_minima,
    p.preco_venda.toFixed(2),
  ])

  exportToCSV(`produtos_${new Date().toLocaleDateString('pt-BR')}`, headers, rows)
}
