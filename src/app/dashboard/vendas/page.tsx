'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { formatarMoeda, formatarData } from '@/lib/utils'
import {
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Banknote,
  QrCode,
  Search,
} from 'lucide-react'

interface Venda {
  id: string
  numero_venda: string
  subtotal: number
  desconto: number
  total: number
  forma_pagamento: string
  valor_recebido: number | null
  troco: number | null
  criado_em: string
  itens?: ItemVenda[]
}

interface ItemVenda {
  id: string
  nome_produto: string
  sku: string
  quantidade: number
  preco_unitario: number
  subtotal: number
}

const ICON_PAGAMENTO: Record<string, any> = {
  Dinheiro: Banknote,
  Pix: QrCode,
  'Cartão Débito': CreditCard,
  'Cartão Crédito': CreditCard,
}

export default function VendasPage() {
  const [vendas, setVendas] = useState<Venda[]>([])
  const [loading, setLoading] = useState(true)
  const [expandido, setExpandido] = useState<string | null>(null)
  const [filtro, setFiltro] = useState('')
  const [pagina, setPagina] = useState(0)
  const [temMais, setTemMais] = useState(true)
  const POR_PAGINA = 20

  const fetchVendas = useCallback(async (pag: number, reset = false) => {
    try {
      const { data, error } = await supabase
        .from('vendas')
        .select('*')
        .order('criado_em', { ascending: false })
        .range(pag * POR_PAGINA, (pag + 1) * POR_PAGINA - 1)

      if (error) throw error

      if (data) {
        setVendas((prev) => (reset ? data : [...prev, ...data]))
        setTemMais(data.length === POR_PAGINA)
      }
    } catch (error) {
      console.error('Erro ao buscar vendas:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchVendas(0, true)
  }, [fetchVendas])

  const toggleExpandir = async (vendaId: string) => {
    if (expandido === vendaId) {
      setExpandido(null)
      return
    }

    // Busca itens da venda
    const venda = vendas.find((v) => v.id === vendaId)
    if (venda && !venda.itens) {
      const { data } = await supabase
        .from('itens_venda')
        .select('*')
        .eq('venda_id', vendaId)

      if (data) {
        setVendas((prev) =>
          prev.map((v) => (v.id === vendaId ? { ...v, itens: data } : v))
        )
      }
    }

    setExpandido(vendaId)
  }

  const carregarMais = () => {
    const novaPagina = pagina + 1
    setPagina(novaPagina)
    fetchVendas(novaPagina)
  }

  const vendasFiltradas = vendas.filter(
    (v) =>
      v.numero_venda.toLowerCase().includes(filtro.toLowerCase()) ||
      v.forma_pagamento.toLowerCase().includes(filtro.toLowerCase())
  )

  // Totais
  const totalVendas = vendas.reduce((acc, v) => acc + Number(v.total), 0)
  const totalHoje = vendas
    .filter(
      (v) =>
        new Date(v.criado_em).toDateString() === new Date().toDateString()
    )
    .reduce((acc, v) => acc + Number(v.total), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Histórico de Vendas
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Todas as vendas realizadas no PDV
        </p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
          <p className="text-xs text-gray-500">Vendas Hoje</p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">
            {formatarMoeda(totalHoje)}
          </p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
          <p className="text-xs text-gray-500">Total Geral</p>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {formatarMoeda(totalVendas)}
          </p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
          <p className="text-xs text-gray-500">Qtd. Vendas</p>
          <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
            {vendas.length}
          </p>
        </div>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Buscar por número da venda ou forma de pagamento..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="input-field pl-10 w-full"
        />
      </div>

      {/* Lista */}
      {vendasFiltradas.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ShoppingCart size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhuma venda encontrada</p>
          <Link
            href="/dashboard/pdv"
            className="inline-block mt-4 btn-primary text-sm px-4 py-2"
          >
            Ir para o PDV
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {vendasFiltradas.map((venda) => {
            const isExpandido = expandido === venda.id
            const IconPag =
              ICON_PAGAMENTO[venda.forma_pagamento] || CreditCard

            return (
              <div
                key={venda.id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden"
              >
                {/* Linha principal */}
                <button
                  onClick={() => toggleExpandir(venda.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition text-left"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <IconPag
                        size={18}
                        className="text-green-600 dark:text-green-400"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">
                        {venda.numero_venda}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatarData(venda.criado_em)} ·{' '}
                        {venda.forma_pagamento}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-green-600 dark:text-green-400">
                      {formatarMoeda(Number(venda.total))}
                    </span>
                    {isExpandido ? (
                      <ChevronUp size={18} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={18} className="text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Detalhes expandidos */}
                {isExpandido && (
                  <div className="border-t dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-800/30 space-y-3">
                    {/* Itens */}
                    {venda.itens ? (
                      <div className="space-y-2">
                        {venda.itens.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <div>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {item.nome_produto}
                              </span>
                              <span className="text-gray-400 ml-2">
                                x{item.quantidade}
                              </span>
                            </div>
                            <span className="font-semibold">
                              {formatarMoeda(Number(item.subtotal))}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-2 text-gray-400 text-sm">
                        Carregando itens...
                      </div>
                    )}

                    {/* Totais */}
                    <div className="border-t dark:border-gray-700 pt-3 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Subtotal</span>
                        <span>{formatarMoeda(Number(venda.subtotal))}</span>
                      </div>
                      {Number(venda.desconto) > 0 && (
                        <div className="flex justify-between text-red-500">
                          <span>Desconto</span>
                          <span>
                            -{formatarMoeda(Number(venda.desconto))}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-base">
                        <span>Total</span>
                        <span>{formatarMoeda(Number(venda.total))}</span>
                      </div>
                      {venda.troco && Number(venda.troco) > 0 && (
                        <div className="flex justify-between text-gray-400">
                          <span>Troco</span>
                          <span>{formatarMoeda(Number(venda.troco))}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Carregar mais */}
          {temMais && (
            <button
              onClick={carregarMais}
              className="w-full py-3 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition font-medium"
            >
              Carregar mais vendas...
            </button>
          )}
        </div>
      )}
    </div>
  )
}