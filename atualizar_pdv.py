from pathlib import Path
import re

path = Path('src/app/dashboard/pdv/page.tsx')
if not path.exists():
    raise SystemExit('Arquivo nao encontrado: src/app/dashboard/pdv/page.tsx')

s = path.read_text(encoding='utf-8')
original = s

# Imports de IA removidos.
s = s.replace("import BotaoIA from '@/components/botao-ia'\n", '')
s = s.replace("import { useIAProduto } from '@/hooks/useIAProduto'\n", '')

# Tipos mais seguros para retorno da venda e barcode.
s = s.replace(
"interface VendaRecente {\n  numero_venda: string\n  total: number\n  forma_pagamento: string\n  itens: any[]\n  hora: string\n}\n",
"""interface ItemVendaResultado {
  produto_id: string
  nome: string
  sku: string | null
  quantidade: number
  preco_unitario: number
  subtotal: number
}

interface ResultadoVenda {
  venda_id: string
  numero_venda: string
  usuario_id: string
  realizado_por: string
  cliente_id: string | null
  subtotal: number
  desconto: number
  total: number
  forma_pagamento: string
  valor_recebido: number | null
  troco: number | null
  itens: ItemVendaResultado[]
}

interface DadosProdutoBarcode {
  encontrado: boolean
  nome?: string
  marca?: string
  descricao?: string
  categoria?: string
}

interface VendaRecente {
  numero_venda: string
  total: number
  desconto: number
  forma_pagamento: string
  valor_recebido?: number
  itens: ItemVendaResultado[]
  hora: string
}
""")

s = s.replace("const [dadosProdutoAPI, setDadosProdutoAPI] = useState<any>(null)",
              "const [dadosProdutoAPI, setDadosProdutoAPI] = useState<DadosProdutoBarcode | null>(null)")
s = s.replace("  const [cadastroPreco, setCadastroPreco] = useState('')\n",
              "  const [cadastroPreco, setCadastroPreco] = useState('')\n  const [cadastroCusto, setCadastroCusto] = useState('')\n")

# Remove estado e hook de IA.
s = re.sub(r"\n  const \[precoSugeridoIA, setPrecoSugeridoIA\] = useState<\{.*?\n  \} \| null>\(null\)\n", "\n", s, flags=re.S)
s = s.replace("  const { completarComIA, carregando: carregandoIA } = useIAProduto()\n", '')

# Corrige carregamento inicial sem suppress de dependencias.
s = s.replace("    fetchProdutos()\n    fetchStatsDia()\n    fetchTopVendidos()\n    // eslint-disable-next-line react-hooks/exhaustive-deps\n", "    void fetchProdutos()\n    void fetchStatsDia()\n    void fetchTopVendidos()\n")
s = s.replace("    fetchClientes()\n", "    void fetchClientes()\n")

# Stats do dia vêm da tabela vendas, com valores historicos reais.
start = s.index("  const fetchStatsDia = async () => {")
end = s.index("\n  // 🆕 Top 6 produtos mais vendidos hoje", start)
new_stats = """  const fetchStatsDia = async () => {
    try {
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)

      const { data, error: statsError } = await supabase
        .from('vendas')
        .select('id, total')
        .gte('criado_em', hoje.toISOString())

      if (statsError) {
        console.error('Erro ao buscar stats do dia:', statsError)
        return
      }

      const vendasHoje = data ?? []
      const totalVendas = vendasHoje.length
      const faturamento = vendasHoje.reduce(
        (total, venda) => total + (Number(venda.total) || 0),
        0
      )
      const ticketMedio = totalVendas > 0 ? faturamento / totalVendas : 0

      setStatsDia({ totalVendas, faturamento, ticketMedio })
    } catch (err) {
      console.error('Erro ao buscar stats do dia:', err)
    }
  }
"""
s = s[:start] + new_stats + s[end:]

# Top vendidos usa itens_venda ligados a vendas de hoje.
start = s.index("  const fetchTopVendidos = async () => {")
end = s.index("\n  // ══════════════════════════════════════════════════\n  // CARRINHO", start)
new_top = """  const fetchTopVendidos = async () => {
    try {
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)

      const { data: vendasHoje, error: vendasError } = await supabase
        .from('vendas')
        .select('id')
        .gte('criado_em', hoje.toISOString())

      if (vendasError || !vendasHoje?.length) {
        if (vendasError) console.error('Erro top vendidos:', vendasError)
        setTopVendidos([])
        return
      }

      const { data: itens, error: itensError } = await supabase
        .from('itens_venda')
        .select('produto_id, quantidade')
        .in('venda_id', vendasHoje.map((venda) => venda.id))

      if (itensError) {
        console.error('Erro top vendidos:', itensError)
        return
      }

      const contagem = new Map<string, number>()
      for (const item of itens ?? []) {
        if (!item.produto_id) continue
        contagem.set(
          item.produto_id,
          (contagem.get(item.produto_id) ?? 0) + (Number(item.quantidade) || 0)
        )
      }

      const top = Array.from(contagem.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([produtoId]) => produtos.find((produto) => produto.id === produtoId))
        .filter((produto): produto is Produto => Boolean(produto && produto.quantidade_atual > 0))
        .slice(0, 6)

      setTopVendidos(top)
    } catch (err) {
      console.error('Erro top vendidos:', err)
    }
  }
"""
s = s[:start] + new_top + s[end:]

# Mensagem sem IA.
s = s.replace('Produto não encontrado. Use a IA ou preencha manualmente.',
              'Produto não encontrado. Preencha os dados manualmente.')

# Validacao de desconto ao abrir pagamento.
old = """    const descontoVal = parseFloat(desconto) || 0
    const total = Math.max(0, subtotal - descontoVal)
    setValorRecebido(total.toFixed(2))
    setModalPagamento(true)
"""
new = """    const descontoInformado = Number.parseFloat(desconto)
    const descontoVal = Number.isFinite(descontoInformado)
      ? Math.max(descontoInformado, 0)
      : 0

    if (descontoVal > subtotal) {
      addNotification('O desconto não pode ser maior que o subtotal.', 'warning', 3500)
      return
    }

    const total = subtotal - descontoVal
    setValorRecebido(total.toFixed(2))
    setModalPagamento(true)
"""
s = s.replace(old, new)

# Remove efeitos e handler de IA.
s = re.sub(r"\n  useEffect\(\(\) => \{\n    if \(!modalCadastroRapido\).*?\n  const salvarProdutoRapido", "\n  const salvarProdutoRapido", s, flags=re.S)

# Custo no cadastro rapido e validacoes numericas.
s = s.replace("    const preco = parseFloat(cadastroPreco)\n    const quantidade = parseInt(cadastroQuantidade) || 0\n",
"""    const preco = Number.parseFloat(cadastroPreco)
    const custoInformado = Number.parseFloat(cadastroCusto)
    const custo = Number.isFinite(custoInformado) ? Math.max(custoInformado, 0) : 0
    const quantidadeInformada = Number.parseInt(cadastroQuantidade, 10)
    const quantidade = Number.isFinite(quantidadeInformada)
      ? Math.max(quantidadeInformada, 0)
      : 0
""")
s = s.replace("          preco_custo: 0,", "          preco_custo: custo,")
s = s.replace("    } catch (err: any) {\n      addNotification(`Erro ao cadastrar: ${err.message}`, 'error')\n",
"""    } catch (err: unknown) {
      const mensagem = err instanceof Error ? err.message : 'erro inesperado'
      addNotification(`Erro ao cadastrar: ${mensagem}`, 'error')
""")

# Calculos de desconto seguros.
s = s.replace("  const descontoVal = parseFloat(desconto) || 0\n  const totalPagar = Math.max(0, subtotal - descontoVal)\n",
"""  const descontoInformado = Number.parseFloat(desconto)
  const descontoVal = Number.isFinite(descontoInformado)
    ? Math.max(descontoInformado, 0)
    : 0
  const descontoInvalido = descontoVal > subtotal
  const totalPagar = descontoInvalido ? subtotal : subtotal - descontoVal
""")

# Substitui toda funcao processarVenda.
start = s.index("  const processarVenda = async () => {")
end = s.index("\n  const reimprimirCupom", start)
new_process = """  const processarVenda = async () => {
    if (processando) return

    setError('')

    if (carrinho.length === 0) {
      addNotification('Carrinho vazio.', 'warning')
      return
    }

    if (descontoInvalido) {
      setError('O desconto não pode ser maior que o subtotal.')
      return
    }

    const recebidoInformado = Number.parseFloat(valorRecebido)
    if (
      formaPagamento === 'Dinheiro' &&
      (!Number.isFinite(recebidoInformado) || recebidoInformado < totalPagar)
    ) {
      setError(`O valor recebido deve ser igual ou maior que ${formatarMoeda(totalPagar)}.`)
      addNotification('Valor recebido insuficiente.', 'warning', 3500)
      return
    }

    setProcessando(true)

    try {
      const itensParaVenda = carrinho.map((item) => ({
        produto_id: item.produto_id,
        quantidade: item.quantidade,
      }))

      const { data, error: rpcError } = await supabase.rpc('processar_venda', {
        p_itens: itensParaVenda,
        p_forma_pagamento: formaPagamento,
        p_desconto: descontoVal,
        p_valor_recebido:
          formaPagamento === 'Dinheiro' ? recebidoInformado : null,
        p_cliente_id: clienteSelecionado?.id ?? null,
      })

      if (rpcError) {
        console.error('Erro na venda:', rpcError)
        setError(rpcError.message || 'Não foi possível processar a venda.')
        return
      }

      const resultado = data as ResultadoVenda | null
      if (!resultado?.numero_venda || !Array.isArray(resultado.itens)) {
        setError('A venda foi processada, mas o servidor retornou dados inválidos.')
        return
      }

      await gerarCupom({
        itens: resultado.itens,
        desconto: Number(resultado.desconto) || 0,
        forma_pagamento: resultado.forma_pagamento,
        valor_recebido: resultado.valor_recebido ?? undefined,
        nome_cliente: clienteSelecionado?.nome,
        endereco_cliente: clienteSelecionado?.endereco || undefined,
        telefone_cliente: clienteSelecionado?.telefone || undefined,
      })

      const novaVenda: VendaRecente = {
        numero_venda: resultado.numero_venda,
        total: Number(resultado.total) || 0,
        desconto: Number(resultado.desconto) || 0,
        forma_pagamento: resultado.forma_pagamento,
        valor_recebido: resultado.valor_recebido ?? undefined,
        itens: resultado.itens,
        hora: new Date().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      }
      setVendasRecentes((prev) => [novaVenda, ...prev].slice(0, 3))

      addNotification(
        `💰 Venda ${resultado.numero_venda}: ${formatarMoeda(Number(resultado.total) || 0)}`,
        'success',
        4000
      )

      setTelaSucesso({
        total: Number(resultado.total) || 0,
        recebido:
          resultado.valor_recebido ?? Number(resultado.total) ?? 0,
        troco: resultado.troco ?? 0,
        formaPagamento: resultado.forma_pagamento,
      })

      setCarrinho([])
      setDesconto('')
      setValorRecebido('')
      setModalPagamento(false)
      setClienteSelecionado(null)

      window.setTimeout(() => {
        void fetchProdutos()
        void fetchStatsDia()
        void fetchTopVendidos()
      }, 800)
    } catch (err: unknown) {
      setError('Erro inesperado ao processar venda. Nenhum item foi alterado.')
      console.error(err)
    } finally {
      setProcessando(false)
    }
  }
"""
s = s[:start] + new_process + s[end:]

# Reimpressao preserva desconto e valor recebido.
s = s.replace("      desconto: 0,\n      forma_pagamento: venda.forma_pagamento,\n",
              "      desconto: venda.desconto,\n      forma_pagamento: venda.forma_pagamento,\n      valor_recebido: venda.valor_recebido,\n")

# Bloco de IA visual substituido por aviso simples de barcode/manual.
pattern = re.compile(r"\n            <div className=\"mb-4 p-4 rounded-xl bg-gradient-to-br.*?</div>\n\n            \{dadosProdutoAPI\.encontrado", re.S)
replacement = """
            <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs leading-relaxed text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
              Os dados encontrados pelo código de barras foram preenchidos quando disponíveis. Revise os campos antes de salvar.
            </div>

            {dadosProdutoAPI.encontrado"""
s, n = pattern.subn(replacement, s, count=1)
if n != 1:
    raise SystemExit('Nao foi possivel substituir o bloco visual de IA.')

# Remove bloco visual de preco sugerido.
s = re.sub(r"\n                \{precoSugeridoIA && \(.*?\n                \)\}", "", s, flags=re.S)

# Insere campo custo antes de quantidade inicial.
needle = """              <div>
                <label className="text-xs font-medium text-gray-500">
                  Quantidade inicial
                </label>
"""
insert = """              <div>
                <label className="text-xs font-medium text-gray-500">
                  Preço de custo (opcional)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={cadastroCusto}
                  onChange={(e) => setCadastroCusto(e.target.value)}
                  className="input-field w-full"
                  placeholder="0.00"
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  Ajuda a calcular estoque, perdas, resultado e margem.
                </p>
              </div>

""" + needle
s = s.replace(needle, insert, 1)

# Restricoes nos inputs de desconto, recebido, preco e quantidade.
s = s.replace('id="desconto-input"\n                      type="number"', 'id="desconto-input"\n                      type="number"\n                      min="0"\n                      step="0.01"')
s = s.replace('type="number"\n                  value={valorRecebido}', 'type="number"\n                  min="0"\n                  step="0.01"\n                  value={valorRecebido}', 1)
s = s.replace('type="number"\n                  value={cadastroPreco}', 'type="number"\n                  min="0.01"\n                  step="0.01"\n                  value={cadastroPreco}', 1)
s = s.replace('type="number"\n                  value={cadastroQuantidade}', 'type="number"\n                  min="0"\n                  step="1"\n                  value={cadastroQuantidade}', 1)

# Desabilita confirmacao quando dinheiro insuficiente ou desconto invalido.
s = s.replace("disabled={processando}\n              className=\"w-full py-4", "disabled={\n                processando ||\n                descontoInvalido ||\n                (formaPagamento === 'Dinheiro' &&\n                  (!Number.isFinite(Number.parseFloat(valorRecebido)) ||\n                    Number.parseFloat(valorRecebido) < totalPagar))\n              }\n              className=\"w-full py-4", 1)

if s == original:
    raise SystemExit('Nenhuma alteracao aplicada.')

backup = path.with_suffix('.tsx.bak')
backup.write_text(original, encoding='utf-8')
path.write_text(s, encoding='utf-8')
print(f'[OK] atualizado: {path}')
print(f'[OK] backup: {backup}')
