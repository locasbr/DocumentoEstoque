'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Produto } from '@/lib/types'
import { useNotification } from '@/contexts/NotificationContext'
import { SkeletonGrid } from '@/components/skeleton-loaders'
import {
  Plus,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Search,
  X,
  Package,
  DollarSign,
  Boxes,
  ArrowUpDown,
  LayoutGrid,
  List,
  CheckCircle2,
  Eye,
  EyeOff,
  Tag,
  TrendingDown,
  PackageX,
} from 'lucide-react'
import { formatarMoeda } from '@/lib/utils'

const POR_PAGINA = 20

type FiltroStatus = 'todos' | 'critico' | 'baixo' | 'ok' | 'inativo'
type Ordenacao = 'nome_asc' | 'nome_desc' | 'preco_asc' | 'preco_desc' | 'estoque_asc' | 'estoque_desc' | 'recente'
type Visualizacao = 'tabela' | 'grid'

interface ModalConfirmacao {
  titulo: string
  descricao: string
  textoBotao: string
  cor: 'red' | 'green'
  onConfirmar: () => void
}

// ════════════════════════════════════════════════════
// 🎨 KPI CARD
// ════════════════════════════════════════════════════
function KPICard({
  label,
  valor,
  icon: Icon,
  cor,
  destaque,
}: {
  label: string
  valor: string | number
  icon: typeof Package
  cor: 'blue' | 'red' | 'yellow' | 'green' | 'emerald'
  destaque?: boolean
}) {
  const cores = {
    blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
    red: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', border: 'border-red-200 dark:border-red-800' },
    yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-800' },
    green: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', border: 'border-green-200 dark:border-green-800' },
    emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
  }
  const c = cores[cor]
  return (
    <div className={`bg-white dark:bg-gray-900 border rounded-xl p-4 transition-all hover:shadow-md hover:-translate-y-0.5 ${destaque ? c.border : 'border-gray-200 dark:border-gray-800'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${c.text}`} />
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 truncate">{label}</p>
      <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white truncate">{valor}</p>
    </div>
  )
}

// ════════════════════════════════════════════════════
// 🗑️ MODAL DE CONFIRMAÇÃO
// ════════════════════════════════════════════════════
function ModalConfirmacaoComp({ modal, onFechar }: { modal: ModalConfirmacao | null; onFechar: () => void }) {
  if (!modal) return null
  const corBotao = modal.cor === 'red' ? 'bg-red-600 hover:bg-red-700 shadow-red-600/30' : 'bg-green-600 hover:bg-green-700 shadow-green-600/30'
  const corIcon = modal.cor === 'red' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={onFechar}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slideUp" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-4 mb-5">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${corIcon}`}>
            {modal.cor === 'red' ? <Trash2 className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{modal.titulo}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{modal.descricao}</p>
          </div>
          <button onClick={onFechar} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-3">
          <button onClick={onFechar} className="flex-1 py-2.5 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition">
            Cancelar
          </button>
          <button onClick={() => { modal.onConfirmar(); onFechar() }} className={`flex-1 py-2.5 px-4 text-white font-semibold rounded-xl transition shadow-lg ${corBotao}`}>
            {modal.textoBotao}
          </button>
        </div>
      </div>
      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  )
}

// ════════════════════════════════════════════════════
// 🎯 COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════
export default function ProdutosPage() {
  const { addNotification } = useNotification()

  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [pagina, setPagina] = useState(0)
  const [totalProdutos, setTotalProdutos] = useState(0)

  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('todos')
  const [filtroCategoria, setFiltroCategoria] = useState<string | null>(null)
  const [ordenacao, setOrdenacao] = useState<Ordenacao>('nome_asc')
  const [visualizacao, setVisualizacao] = useState<Visualizacao>('tabela')
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [modal, setModal] = useState<ModalConfirmacao | null>(null)
  const [processando, setProcessando] = useState(false)
  const [todosOsProdutos, setTodosOsProdutos] = useState<Produto[]>([])

  const fetchProdutos = useCallback(async () => {
    setLoading(true)
    try {
      const { data: todos } = await supabase.from('produtos').select('*')
      if (todos) setTodosOsProdutos(todos)

      let query = supabase.from('produtos').select('*', { count: 'exact' })

      if (filtro.trim()) {
        query = query.or(`nome.ilike.%${filtro}%,sku.ilike.%${filtro}%,categoria.ilike.%${filtro}%`)
      }

      if (filtroCategoria) {
        query = query.eq('categoria', filtroCategoria)
      }

      const ordens: Record<Ordenacao, { col: string; asc: boolean }> = {
        nome_asc: { col: 'nome', asc: true },
        nome_desc: { col: 'nome', asc: false },
        preco_asc: { col: 'preco_venda', asc: true },
        preco_desc: { col: 'preco_venda', asc: false },
        estoque_asc: { col: 'quantidade_atual', asc: true },
        estoque_desc: { col: 'quantidade_atual', asc: false },
        recente: { col: 'criado_em', asc: false },
      }
      const o = ordens[ordenacao]
      query = query.order(o.col, { ascending: o.asc })

      query = query.range(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA - 1)

      const { data, error, count } = await query

      if (!error && data) {
        let resultado = data
        if (filtroStatus === 'critico') resultado = data.filter((p) => p.quantidade_atual === 0)
        else if (filtroStatus === 'baixo') resultado = data.filter((p) => p.quantidade_atual > 0 && p.quantidade_atual < p.quantidade_minima)
        else if (filtroStatus === 'ok') resultado = data.filter((p) => p.quantidade_atual >= p.quantidade_minima)
        else if (filtroStatus === 'inativo') resultado = data.filter((p) => !p.ativo)

        setProdutos(resultado)
        if (count !== null) setTotalProdutos(count)
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error)
      addNotification('Erro ao carregar produtos', 'error')
    } finally {
      setLoading(false)
    }
  }, [filtro, filtroCategoria, ordenacao, pagina, filtroStatus, addNotification])

  useEffect(() => {
    fetchProdutos()
  }, [fetchProdutos])

  useEffect(() => {
    setPagina(0)
  }, [filtro, filtroCategoria, filtroStatus, ordenacao])

  const stats = useMemo(() => {
    const total = todosOsProdutos.length
    const criticos = todosOsProdutos.filter((p) => p.quantidade_atual === 0).length
    const baixos = todosOsProdutos.filter((p) => p.quantidade_atual > 0 && p.quantidade_atual < p.quantidade_minima).length
    const valorEstoque = todosOsProdutos.reduce((acc, p) => acc + p.quantidade_atual * (p.preco_venda || 0), 0)
    return { total, criticos, baixos, valorEstoque }
  }, [todosOsProdutos])

  const categorias = useMemo(() => {
    const set = new Set<string>()
    todosOsProdutos.forEach((p) => { if (p.categoria) set.add(p.categoria) })
    return Array.from(set).sort()
  }, [todosOsProdutos])

  const totalPaginas = Math.ceil(totalProdutos / POR_PAGINA)

  const handleDelete = (id: string, nome: string) => {
    setModal({
      titulo: 'Deletar produto?',
      descricao: `"${nome}" será removido permanentemente. Esta ação não pode ser desfeita.`,
      textoBotao: 'Deletar',
      cor: 'red',
      onConfirmar: async () => {
        setProcessando(true)
        try {
          const { error } = await supabase.from('produtos').delete().eq('id', id)
          if (!error) {
            addNotification(`✅ ${nome} removido`, 'success', 2000)
            fetchProdutos()
          } else {
            addNotification('Erro ao deletar', 'error')
          }
        } finally {
          setProcessando(false)
        }
      },
    })
  }

  const toggleSelecao = (id: string) => {
    const novo = new Set(selecionados)
    if (novo.has(id)) novo.delete(id)
    else novo.add(id)
    setSelecionados(novo)
  }

  const toggleSelecionarTodos = () => {
    if (selecionados.size === produtos.length) setSelecionados(new Set())
    else setSelecionados(new Set(produtos.map((p) => p.id)))
  }

  const handleDeletarSelecionados = () => {
    if (selecionados.size === 0) return
    setModal({
      titulo: `Deletar ${selecionados.size} produto(s)?`,
      descricao: 'Os produtos selecionados serão removidos permanentemente.',
      textoBotao: 'Deletar todos',
      cor: 'red',
      onConfirmar: async () => {
        setProcessando(true)
        try {
          const { error } = await supabase.from('produtos').delete().in('id', Array.from(selecionados))
          if (!error) {
            addNotification(`🗑️ ${selecionados.size} produto(s) removido(s)`, 'success', 2000)
            setSelecionados(new Set())
            fetchProdutos()
          }
        } finally {
          setProcessando(false)
        }
      },
    })
  }

  const toggleAtivo = async (produto: Produto) => {
    try {
      const { error } = await supabase.from('produtos').update({ ativo: !produto.ativo }).eq('id', produto.id)
      if (!error) {
        addNotification(`${produto.ativo ? '⏸️' : '▶️'} ${produto.nome} ${produto.ativo ? 'desativado' : 'ativado'}`, 'success', 2000)
        fetchProdutos()
      }
    } catch {
      addNotification('Erro ao atualizar', 'error')
    }
  }

  const getStatusEstoque = (p: Produto) => {
    if (p.quantidade_atual === 0) return { cor: 'bg-red-500', label: 'Crítico', textColor: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' }
    if (p.quantidade_atual < p.quantidade_minima) return { cor: 'bg-yellow-500', label: 'Baixo', textColor: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20' }
    return { cor: 'bg-green-500', label: 'OK', textColor: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' }
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="hidden sm:flex w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 items-center justify-center shadow-lg shadow-purple-500/30 flex-shrink-0">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Produtos</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{stats.total} produto(s) no catálogo</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/produtos/importar" className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border-2 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400 font-semibold rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition group text-sm">
            <FileSpreadsheet size={18} className="group-hover:scale-110 transition-transform" />
            <span>Importar CSV</span>
          </Link>
          <Link href="/dashboard/produtos/novo" className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 hover:shadow-lg hover:shadow-purple-500/30 text-white font-semibold rounded-lg transition text-sm">
            <Plus size={18} />
            Novo Produto
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Total produtos" valor={stats.total} icon={Boxes} cor="blue" />
        <KPICard label="Valor em estoque" valor={formatarMoeda(stats.valorEstoque)} icon={DollarSign} cor="emerald" />
        <KPICard label="Estoque crítico" valor={stats.criticos} icon={PackageX} cor="red" destaque={stats.criticos > 0} />
        <KPICard label="Estoque baixo" valor={stats.baixos} icon={TrendingDown} cor="yellow" destaque={stats.baixos > 0} />
      </div>

      {/* TOOLBAR */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, SKU ou categoria..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
            />
            {filtro && (
              <button onClick={() => setFiltro('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="relative">
            <select value={ordenacao} onChange={(e) => setOrdenacao(e.target.value as Ordenacao)} className="appearance-none pl-9 pr-8 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer">
              <option value="nome_asc">Nome (A-Z)</option>
              <option value="nome_desc">Nome (Z-A)</option>
              <option value="preco_asc">Menor preço</option>
              <option value="preco_desc">Maior preço</option>
              <option value="estoque_asc">Menor estoque</option>
              <option value="estoque_desc">Maior estoque</option>
              <option value="recente">Mais recentes</option>
            </select>
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <button onClick={() => setVisualizacao('tabela')} className={`p-2 rounded-md transition ${visualizacao === 'tabela' ? 'bg-white dark:bg-gray-900 shadow-sm' : 'text-gray-500'}`} title="Tabela">
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => setVisualizacao('grid')} className={`p-2 rounded-md transition ${visualizacao === 'grid' ? 'bg-white dark:bg-gray-900 shadow-sm' : 'text-gray-500'}`} title="Grid">
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { id: 'todos' as const, label: 'Todos', count: stats.total },
            { id: 'critico' as const, label: '🔴 Crítico', count: stats.criticos },
            { id: 'baixo' as const, label: '🟡 Baixo', count: stats.baixos },
            { id: 'ok' as const, label: '🟢 OK', count: stats.total - stats.criticos - stats.baixos },
          ].map(({ id, label, count }) => (
            <button key={id} onClick={() => setFiltroStatus(id)} className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${filtroStatus === id ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
              {label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${filtroStatus === id ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-700'}`}>{count}</span>
            </button>
          ))}
        </div>

        {categorias.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            <button onClick={() => setFiltroCategoria(null)} className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition ${!filtroCategoria ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
              Todas categorias
            </button>
            {categorias.map((cat) => (
              <button key={cat} onClick={() => setFiltroCategoria(filtroCategoria === cat ? null : cat)} className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition ${filtroCategoria === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'}`}>
                <Tag className="w-3 h-3" />{cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* BULK ACTIONS */}
      {selecionados.size > 0 && (
        <div className="flex items-center justify-between gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-xl animate-slideDown">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span className="font-semibold text-purple-900 dark:text-purple-100">{selecionados.size} selecionado(s)</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleDeletarSelecionados} disabled={processando} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50">
              <Trash2 className="w-3.5 h-3.5" />Deletar
            </button>
            <button onClick={() => setSelecionados(new Set())} className="text-xs text-gray-600 dark:text-gray-400 font-medium px-2 hover:underline">Cancelar</button>
          </div>
        </div>
      )}

      {/* LISTA */}
      {loading ? (
        <SkeletonGrid />
      ) : produtos.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <Package className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
          <h3 className="font-bold text-gray-900 dark:text-white mb-1">{filtro || filtroCategoria || filtroStatus !== 'todos' ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-4">{filtro || filtroCategoria || filtroStatus !== 'todos' ? 'Tente ajustar os filtros' : 'Cadastre seu primeiro produto pra começar'}</p>
          {!filtro && !filtroCategoria && filtroStatus === 'todos' && (
            <Link href="/dashboard/produtos/novo" className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition">
              <Plus className="w-4 h-4" />Cadastrar produto
            </Link>
          )}
        </div>
      ) : visualizacao === 'tabela' ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <th className="py-3 px-4 w-10">
                    <button onClick={toggleSelecionarTodos} className={`w-4 h-4 rounded border-2 flex items-center justify-center transition ${selecionados.size === produtos.length && produtos.length > 0 ? 'bg-purple-600 border-purple-600' : 'border-gray-300 dark:border-gray-600'}`}>
                      {selecionados.size === produtos.length && produtos.length > 0 && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </button>
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-gray-500">Produto</th>
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-gray-500">SKU</th>
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-gray-500">Categoria</th>
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-gray-500">Estoque</th>
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-gray-500">Preço</th>
                  <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider text-gray-500">Ações</th>
                </tr>
              </thead>
              <tbody>
                {produtos.map((produto, idx) => {
                  const status = getStatusEstoque(produto)
                  const isSelecionado = selecionados.has(produto.id)
                  const porcentagemEstoque = produto.quantidade_minima > 0 ? Math.min(100, (produto.quantidade_atual / (produto.quantidade_minima * 2)) * 100) : 100

                  return (
                    <tr key={produto.id} className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition ${isSelecionado ? 'bg-purple-50 dark:bg-purple-900/10' : ''} ${!produto.ativo ? 'opacity-50' : ''}`} style={{ animation: `fadeIn 0.3s ease-out ${idx * 30}ms backwards` }}>
                      <td className="py-3 px-4">
                        <button onClick={() => toggleSelecao(produto.id)} className={`w-4 h-4 rounded border-2 flex items-center justify-center transition ${isSelecionado ? 'bg-purple-600 border-purple-600' : 'border-gray-300 dark:border-gray-600'}`}>
                          {isSelecionado && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center flex-shrink-0">
                          <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">{produto.nome}</p>
                            {!produto.ativo && <span className="text-[10px] text-gray-500 italic">Inativo</span>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-gray-500">{produto.sku}</td>
                      <td className="py-3 px-4">
                        {produto.categoria && (
                          <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">{produto.categoria}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div className={`h-full ${status.cor} transition-all`} style={{ width: `${porcentagemEstoque}%` }} />
                          </div>
                          <span className={`text-sm font-bold ${status.textColor}`}>{produto.quantidade_atual}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-green-600 dark:text-green-400 text-sm">{formatarMoeda(produto.preco_venda)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => toggleAtivo(produto)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition" title={produto.ativo ? 'Desativar' : 'Ativar'}>
                            {produto.ativo ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                          <Link href={`/dashboard/produtos/${produto.id}`} className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition" title="Editar">
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <button onClick={() => handleDelete(produto.id, produto.nome)} className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition" title="Deletar">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
            {produtos.map((produto) => {
              const status = getStatusEstoque(produto)
              return (
                <div key={produto.id} className={`p-4 ${!produto.ativo ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center flex-shrink-0">
                      <Package className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">{produto.nome}</h4>
                      <p className="text-xs text-gray-500 truncate">{produto.sku} · {produto.categoria}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600 dark:text-green-400 text-sm">{formatarMoeda(produto.preco_venda)}</p>
                      <p className={`text-xs font-bold ${status.textColor}`}>{produto.quantidade_atual} un</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/produtos/${produto.id}`} className="flex-1 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold rounded-lg text-center">
                      Editar
                    </Link>
                    <button onClick={() => handleDelete(produto.id, produto.nome)} className="py-2 px-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-semibold rounded-lg">
                      <Trash2 className="w-4 h-4 inline" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {produtos.map((produto, idx) => {
            const status = getStatusEstoque(produto)
            return (
              <div key={produto.id} className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 hover:shadow-md transition ${!produto.ativo ? 'opacity-50' : ''}`} style={{ animation: `fadeIn 0.3s ease-out ${idx * 30}ms backwards` }}>
                <div className="aspect-square rounded-lg bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100 dark:from-purple-900/30 dark:via-pink-900/30 dark:to-orange-900/30 mb-3 flex items-center justify-center">
                <Package className="w-12 h-12 text-purple-500 dark:text-purple-400" />
              </div>
                <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate mb-1">{produto.nome}</h4>
                <p className="text-xs text-gray-500 mb-2 truncate">{produto.sku}</p>
                <div className="flex items-center justify-between">
                  <p className="font-bold text-green-600 dark:text-green-400 text-sm">{formatarMoeda(produto.preco_venda)}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${status.bg} ${status.textColor}`}>{produto.quantidade_atual}</span>
                </div>
                <div className="flex gap-1 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <Link href={`/dashboard/produtos/${produto.id}`} className="flex-1 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold rounded-lg text-center">
                    <Edit2 className="w-3 h-3 inline" />
                  </Link>
                  <button onClick={() => handleDelete(produto.id, produto.nome)} className="flex-1 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-semibold rounded-lg">
                    <Trash2 className="w-3 h-3 inline" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* PAGINAÇÃO */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Página <strong className="text-gray-900 dark:text-white">{pagina + 1}</strong> de {totalPaginas} · {totalProdutos} produtos
          </p>
          <div className="flex gap-2">
            <button onClick={() => setPagina((p) => Math.max(0, p - 1))} disabled={pagina === 0} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center gap-1">
              <ChevronLeft size={16} /> Anterior
            </button>
            <button onClick={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))} disabled={pagina >= totalPaginas - 1} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center gap-1">
              Próxima <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      <ModalConfirmacaoComp modal={modal} onFechar={() => setModal(null)} />

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown {
          animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  )
}