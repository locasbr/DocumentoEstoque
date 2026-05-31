'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useNotification } from '@/contexts/NotificationContext'
import { formatarMoeda, formatarData } from '@/lib/utils'
import {
  ArrowLeft, User, Phone, Mail, MapPin, Plus, Minus,
  DollarSign, Clock, TrendingDown, TrendingUp, X
} from 'lucide-react'

interface Cliente {
  id: string
  nome: string
  telefone: string
  cpf: string
  email: string
  endereco: string
  notas: string
  criado_em: string
}

interface Fiado {
  id: string
  tipo: 'debito' | 'pagamento'
  valor: number
  descricao: string
  criado_em: string
}

export default function ClienteDetalhePage() {
  const params = useParams()
  const id = params?.id as string
  const { addNotification } = useNotification()

  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [fiados, setFiados] = useState<Fiado[]>([])
  const [loading, setLoading] = useState(true)

  // Modal
  const [modalAberto, setModalAberto] = useState(false)
  const [modalTipo, setModalTipo] = useState<'debito' | 'pagamento'>('debito')
  const [modalValor, setModalValor] = useState('')
  const [modalDesc, setModalDesc] = useState('')
  const [salvando, setSalvando] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [clienteRes, fiadoRes] = await Promise.all([
        supabase.from('clientes').select('*').eq('id', id).single(),
        supabase.from('fiado').select('*').eq('cliente_id', id).order('criado_em', { ascending: false }),
      ])

      if (clienteRes.data) setCliente(clienteRes.data)
      if (fiadoRes.data) setFiados(fiadoRes.data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const saldo = fiados.reduce((acc, f) => {
    return f.tipo === 'debito' ? acc + Number(f.valor) : acc - Number(f.valor)
  }, 0)

  const totalDebitos = fiados.filter(f => f.tipo === 'debito').reduce((a, f) => a + Number(f.valor), 0)
  const totalPagamentos = fiados.filter(f => f.tipo === 'pagamento').reduce((a, f) => a + Number(f.valor), 0)

  const abrirModal = (tipo: 'debito' | 'pagamento') => {
    setModalTipo(tipo)
    setModalValor('')
    setModalDesc('')
    setModalAberto(true)
  }

  const handleSalvarFiado = async () => {
    const valor = parseFloat(modalValor)
    if (isNaN(valor) || valor <= 0) {
      addNotification('Informe um valor válido', 'warning')
      return
    }

    setSalvando(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      const { error } = await supabase.from('fiado').insert({
        cliente_id: id,
        usuario_id: userData.user.id,
        tipo: modalTipo,
        valor,
        descricao: modalDesc,
      })

      if (error) throw error

      addNotification(
        modalTipo === 'debito'
          ? `Débito de ${formatarMoeda(valor)} registrado`
          : `Pagamento de ${formatarMoeda(valor)} registrado ✓`,
        'success'
      )
      setModalAberto(false)
      fetchData()
    } catch {
      addNotification('Erro ao registrar', 'error')
    } finally {
      setSalvando(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
  }

  if (!cliente) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Cliente não encontrado</p>
        <Link href="/dashboard/clientes" className="text-blue-600 mt-2 inline-block">← Voltar</Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/clientes" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{cliente.nome}</h2>
          <p className="text-gray-500 dark:text-gray-400">Cliente desde {formatarData(cliente.criado_em)}</p>
        </div>
      </div>

      {/* Info + Saldo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Info do cliente */}
        <div className="card p-5 space-y-3">
          <h4 className="font-semibold text-gray-900 dark:text-white">Informações</h4>
          {cliente.telefone && (
            <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" /> {cliente.telefone}
            </p>
          )}
          {cliente.email && (
            <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" /> {cliente.email}
            </p>
          )}
          {cliente.endereco && (
            <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" /> {cliente.endereco}
            </p>
          )}
          {cliente.cpf && (
            <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" /> CPF: {cliente.cpf}
            </p>
          )}
          {cliente.notas && (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic mt-2">{`\u201c${cliente.notas}\u201d`}</p>
          )}
        </div>

        {/* Saldo */}
        <div className={`card p-5 flex flex-col justify-center items-center ${
          saldo > 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
        }`}>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Saldo Devedor</p>
          <p className={`text-3xl font-bold ${saldo > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
            {formatarMoeda(Math.abs(saldo))}
          </p>
          <p className="text-sm mt-1 text-gray-500">
            {saldo > 0 ? 'Deve para você' : saldo < 0 ? 'Você deve para ele' : 'Sem débitos ✓'}
          </p>
        </div>

        {/* Resumo */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <TrendingDown className="w-4 h-4 text-red-500" />
            <span className="text-gray-600 dark:text-gray-300">Total Débitos:</span>
            <span className="font-bold text-red-600 ml-auto">{formatarMoeda(totalDebitos)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-gray-600 dark:text-gray-300">Total Pagamentos:</span>
            <span className="font-bold text-green-600 ml-auto">{formatarMoeda(totalPagamentos)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm pt-2 border-t dark:border-gray-700">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-300">Movimentações:</span>
            <span className="font-bold ml-auto">{fiados.length}</span>
          </div>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex gap-3">
        <button
          onClick={() => abrirModal('debito')}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition"
        >
          <Plus className="w-5 h-5" /> Novo Débito (Fiado)
        </button>
        <button
          onClick={() => abrirModal('pagamento')}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition"
        >
          <DollarSign className="w-5 h-5" /> Registrar Pagamento
        </button>
      </div>

      {/* Histórico */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Histórico de Fiado</h3>
        {fiados.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            Nenhuma movimentação registrada
          </div>
        ) : (
          <div className="space-y-3">
            {fiados.map((f) => (
              <div key={f.id} className="card p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  f.tipo === 'debito'
                    ? 'bg-red-100 dark:bg-red-900/30'
                    : 'bg-green-100 dark:bg-green-900/30'
                }`}>
                  {f.tipo === 'debito'
                    ? <Minus className="w-5 h-5 text-red-600 dark:text-red-400" />
                    : <Plus className="w-5 h-5 text-green-600 dark:text-green-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {f.tipo === 'debito' ? 'Débito (Fiado)' : 'Pagamento recebido'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {f.descricao || 'Sem descrição'} · {formatarData(f.criado_em)}
                  </p>
                </div>
                <span className={`font-bold text-lg ${
                  f.tipo === 'debito' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                }`}>
                  {f.tipo === 'debito' ? '+' : '-'}{formatarMoeda(Number(f.valor))}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {modalTipo === 'debito' ? '📝 Novo Débito' : '💰 Registrar Pagamento'}
              </h3>
              <button onClick={() => setModalAberto(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Valor (R$) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={modalValor}
                onChange={(e) => setModalValor(e.target.value)}
                className="input-field w-full text-2xl font-bold text-center py-4"
                placeholder="0,00"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Descrição (opcional)</label>
              <input
                type="text"
                value={modalDesc}
                onChange={(e) => setModalDesc(e.target.value)}
                className="input-field w-full"
                placeholder={modalTipo === 'debito' ? 'Ex: Compras do dia' : 'Ex: Pagou em dinheiro'}
              />
            </div>

            {saldo > 0 && modalTipo === 'pagamento' && (
              <button
                onClick={() => setModalValor(saldo.toFixed(2))}
                className="w-full text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                💡 Pagar tudo ({formatarMoeda(saldo)})
              </button>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleSalvarFiado}
                disabled={salvando}
                className={`flex-1 py-3 font-semibold rounded-xl text-white transition ${
                  modalTipo === 'debito'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {salvando ? 'Salvando...' : 'Confirmar'}
              </button>
              <button onClick={() => setModalAberto(false)} className="btn-secondary px-6 py-3">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
