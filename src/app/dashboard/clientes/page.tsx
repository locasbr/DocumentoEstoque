'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  AlertTriangle,
  Download,
  DollarSign,
  Eye,
  Loader2,
  Lock,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react'

import UpgradeBlock from '@/components/upgrade-block'
import { useNotification } from '@/contexts/NotificationContext'
import { usePlano } from '@/hooks/usePlano'
import { supabase } from '@/lib/supabase'
import { formatarMoeda } from '@/lib/utils'

interface ClienteComSaldo {
  id: string
  nome: string
  telefone: string | null
  cpf: string | null
  email: string | null
  endereco: string | null
  notas: string | null
  criado_em: string
  saldo_fiado: number
  quantidade_lancamentos: number
  quantidade_vendas: number
}

interface ResultadoExclusao {
  cliente_id: string
  cliente_nome: string
  excluido: boolean
  usuario_id: string
  excluido_por: string
}

function numero(valor: unknown): number {
  const convertido = Number(valor)
  return Number.isFinite(convertido) ? convertido : 0
}

function somenteNumeros(valor: string | null): string {
  return (valor ?? '').replace(/\D/g, '')
}

function formatarTelefone(valor: string | null): string {
  const numeros = somenteNumeros(valor)

  if (numeros.length === 11) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`
  }

  if (numeros.length === 10) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`
  }

  return valor ?? ''
}

function mascararCPF(valor: string | null): string {
  const numeros = somenteNumeros(valor)
  if (numeros.length !== 11) return valor ?? ''
  return `***.***.***-${numeros.slice(-2)}`
}

function obterMensagemErro(erro: unknown): string {
  if (
    typeof erro === 'object' &&
    erro !== null &&
    'message' in erro &&
    typeof erro.message === 'string'
  ) {
    return erro.message
  }

  return 'Erro inesperado ao realizar a operação.'
}

function escaparCSV(valor: unknown): string {
  const texto = String(valor ?? '')
  const seguro = /^[=+\-@]/.test(texto) ? `'${texto}` : texto
  return `"${seguro.replace(/"/g, '""')}"`
}

export default function ClientesPage() {
  const { isIniciante, temExportarCSV, loading: loadingPlano } = usePlano()
  const { addNotification } = useNotification()

  const [clientes, setClientes] = useState<ClienteComSaldo[]>([])
  const [loading, setLoading] = useState(true)
  const [atualizando, setAtualizando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [filtro, setFiltro] = useState('')
  const [excluindoId, setExcluindoId] = useState<string | null>(null)

  const fetchClientes = useCallback(
    async (feedback = false) => {
      feedback ? setAtualizando(true) : setLoading(true)
      setErro(null)

      try {
        const { data, error: rpcError } = await supabase.rpc(
          'listar_clientes_com_saldo'
        )

        if (rpcError) throw rpcError

        const recebidos = (data ?? []) as Array<
          Omit<
            ClienteComSaldo,
            'saldo_fiado' | 'quantidade_lancamentos' | 'quantidade_vendas'
          > & {
            saldo_fiado: unknown
            quantidade_lancamentos: unknown
            quantidade_vendas: unknown
          }
        >

        setClientes(
          recebidos.map((cliente) => ({
            ...cliente,
            saldo_fiado: numero(cliente.saldo_fiado),
            quantidade_lancamentos: numero(cliente.quantidade_lancamentos),
            quantidade_vendas: numero(cliente.quantidade_vendas),
          }))
        )

        if (feedback) {
          addNotification('Clientes atualizados.', 'success', 1800)
        }
      } catch (error) {
        console.error('Erro ao carregar clientes:', error)
        setErro(
          'Não foi possível carregar os clientes e os saldos de fiado. Nenhum saldo foi presumido.'
        )
      } finally {
        setLoading(false)
        setAtualizando(false)
      }
    },
    [addNotification]
  )

  useEffect(() => {
    if (loadingPlano) return

    if (isIniciante) {
      setLoading(false)
      return
    }

    void fetchClientes()
  }, [fetchClientes, isIniciante, loadingPlano])

  const clientesFiltrados = useMemo(() => {
    const termo = filtro.trim().toLocaleLowerCase('pt-BR')
    const termoNumerico = somenteNumeros(filtro)

    if (!termo) return clientes

    return clientes.filter((cliente) => {
      const correspondeNome = cliente.nome
        .toLocaleLowerCase('pt-BR')
        .includes(termo)
      const correspondeEmail = (cliente.email ?? '')
        .toLocaleLowerCase('pt-BR')
        .includes(termo)
      const correspondeTelefone =
        Boolean(termoNumerico) &&
        somenteNumeros(cliente.telefone).includes(termoNumerico)
      const correspondeCPF =
        Boolean(termoNumerico) &&
        somenteNumeros(cliente.cpf).includes(termoNumerico)

      return (
        correspondeNome ||
        correspondeEmail ||
        correspondeTelefone ||
        correspondeCPF
      )
    })
  }, [clientes, filtro])

  const totalFiado = useMemo(
    () =>
      clientes.reduce(
        (total, cliente) => total + Math.max(0, cliente.saldo_fiado),
        0
      ),
    [clientes]
  )

  const clientesComDebito = useMemo(
    () => clientes.filter((cliente) => cliente.saldo_fiado > 0).length,
    [clientes]
  )

  const handleDeletar = async (cliente: ClienteComSaldo) => {
    if (excluindoId) return

    if (
      cliente.quantidade_lancamentos > 0 ||
      cliente.quantidade_vendas > 0
    ) {
      addNotification(
        'Este cliente possui histórico de vendas ou fiado e não pode ser excluído.',
        'warning',
        4500
      )
      return
    }

    const confirmou = window.confirm(
      `Excluir permanentemente o cliente "${cliente.nome}"? Essa ação não pode ser desfeita.`
    )

    if (!confirmou) return

    setExcluindoId(cliente.id)

    try {
      const { data, error: rpcError } = await supabase.rpc(
        'excluir_cliente_sem_historico',
        { p_cliente_id: cliente.id }
      )

      if (rpcError) throw rpcError

      const resultado = data as ResultadoExclusao | null
      if (!resultado?.excluido) {
        throw new Error('O servidor não confirmou a exclusão do cliente.')
      }

      setClientes((atuais) =>
        atuais.filter((item) => item.id !== cliente.id)
      )
      addNotification(
        `Cliente "${resultado.cliente_nome}" excluído.`,
        'success',
        2500
      )
    } catch (error) {
      console.error('Erro ao excluir cliente:', error)
      addNotification(obterMensagemErro(error), 'error', 5000)
      await fetchClientes()
    } finally {
      setExcluindoId(null)
    }
  }

  const exportarClientesCSV = () => {
    if (!temExportarCSV) {
      addNotification(
        'Exportação CSV disponível no plano Profissional.',
        'warning',
        3500
      )
      return
    }

    if (clientes.length === 0) {
      addNotification('Não existem clientes para exportar.', 'warning')
      return
    }

    const confirmou = window.confirm(
      'O arquivo conterá dados pessoais dos clientes. Deseja continuar?'
    )
    if (!confirmou) return

    const cabecalhos = [
      'Nome',
      'Telefone',
      'CPF',
      'Email',
      'Endereco',
      'Saldo Fiado',
      'Lancamentos Fiado',
      'Vendas Vinculadas',
    ]

    const linhas = clientes.map((cliente) => [
      cliente.nome,
      formatarTelefone(cliente.telefone),
      cliente.cpf ?? '',
      cliente.email ?? '',
      cliente.endereco ?? '',
      cliente.saldo_fiado.toFixed(2).replace('.', ','),
      cliente.quantidade_lancamentos,
      cliente.quantidade_vendas,
    ])

    const csv = [
      cabecalhos.map(escaparCSV).join(';'),
      ...linhas.map((linha) => linha.map(escaparCSV).join(';')),
    ].join('\r\n')

    const blob = new Blob([`\uFEFF${csv}`], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `clientes_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)

    addNotification('Clientes exportados com sucesso.', 'success', 2200)
  }

  if (loadingPlano) {
    return <Carregando texto="Verificando plano..." />
  }

  if (isIniciante) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <UpgradeBlock
          titulo="Controle de Clientes e Fiado"
          descricao="Cadastre clientes, controle quem deve, quanto deve e tenha histórico completo de pagamentos. Adeus caderninho!"
          planoNecessario="profissional"
        />
      </div>
    )
  }

  if (loading) {
    return <Carregando texto="Carregando clientes..." />
  }

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Clientes
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gerencie clientes, vendas vinculadas e saldos de fiado.
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <button
            type="button"
            onClick={() => void fetchClientes(true)}
            disabled={atualizando}
            className="btn-secondary inline-flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${atualizando ? 'animate-spin' : ''}`}
            />
            <span className="hidden sm:inline">Atualizar</span>
          </button>

          {clientes.length > 0 && (
            <button
              type="button"
              onClick={exportarClientesCSV}
              className="btn-secondary inline-flex items-center justify-center gap-2 text-sm"
            >
              <Download className="h-4 w-4" /> Exportar CSV
            </button>
          )}

          <Link
            href="/dashboard/clientes/novo"
            className="btn-primary inline-flex flex-1 items-center justify-center gap-2 sm:flex-none"
          >
            <Plus className="h-4 w-4" /> Novo cliente
          </Link>
        </div>
      </header>

      {erro && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="flex-1">
            <p>{erro}</p>
            <button
              type="button"
              onClick={() => void fetchClientes()}
              className="mt-2 font-semibold underline"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      {!erro && (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MetricCard
              icon={Users}
              label="Total de clientes"
              valor={clientes.length.toLocaleString('pt-BR')}
              cor="blue"
            />
            <MetricCard
              icon={DollarSign}
              label="Total fiado pendente"
              valor={formatarMoeda(totalFiado)}
              cor="red"
            />
            <MetricCard
              icon={AlertTriangle}
              label="Clientes com débito"
              valor={clientesComDebito.toLocaleString('pt-BR')}
              cor="amber"
            />
          </section>

          <section className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Buscar por nome, telefone, CPF ou e-mail..."
              value={filtro}
              onChange={(event) => setFiltro(event.target.value)}
              className="input-field w-full pl-10 pr-10"
            />
            {filtro && (
              <button
                type="button"
                onClick={() => setFiltro('')}
                aria-label="Limpar busca"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </section>

          {clientesFiltrados.length === 0 ? (
            <section className="py-16 text-center">
              <Users className="mx-auto mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
              <h2 className="mb-2 text-lg font-semibold text-gray-600 dark:text-gray-400">
                {filtro
                  ? 'Nenhum cliente encontrado'
                  : 'Nenhum cliente cadastrado'}
              </h2>
              <p className="mb-4 text-gray-400 dark:text-gray-500">
                {filtro
                  ? 'Tente buscar com outros termos.'
                  : 'Cadastre o primeiro cliente para vincular vendas e controlar o fiado.'}
              </p>
              {!filtro && (
                <Link
                  href="/dashboard/clientes/novo"
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" /> Cadastrar primeiro cliente
                </Link>
              )}
            </section>
          ) : (
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {clientesFiltrados.map((cliente) => {
                const saldo = Math.max(0, cliente.saldo_fiado)
                const possuiHistorico =
                  cliente.quantidade_lancamentos > 0 ||
                  cliente.quantidade_vendas > 0
                const estaExcluindo = excluindoId === cliente.id

                return (
                  <article
                    key={cliente.id}
                    className="card flex flex-col p-5 transition hover:shadow-lg"
                  >
                    <div className="mb-3 flex min-w-0 items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {cliente.nome.charAt(0).toLocaleUpperCase('pt-BR')}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="truncate font-semibold text-gray-900 dark:text-white">
                          {cliente.nome}
                        </h2>
                        {cliente.telefone && (
                          <p className="mt-0.5 flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                            <Phone className="h-3 w-3 shrink-0" />
                            <span className="truncate">
                              {formatarTelefone(cliente.telefone)}
                            </span>
                          </p>
                        )}
                        {cliente.cpf && (
                          <p className="mt-0.5 text-xs text-gray-400">
                            CPF {mascararCPF(cliente.cpf)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div
                      className={`mb-4 rounded-xl border p-3 ${
                        saldo > 0
                          ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                          : 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                      }`}
                    >
                      <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                        Saldo fiado
                      </p>
                      <p
                        className={`text-lg font-bold ${
                          saldo > 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-green-600 dark:text-green-400'
                        }`}
                      >
                        {saldo > 0
                          ? `${formatarMoeda(saldo)} devendo`
                          : 'Em dia ✓'}
                      </p>
                    </div>

                    <div className="mb-4 grid grid-cols-2 gap-2 text-xs text-gray-500">
                      <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
                        <p>Movimentações</p>
                        <p className="mt-0.5 font-bold text-gray-900 dark:text-white">
                          {cliente.quantidade_lancamentos}
                        </p>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
                        <p>Vendas vinculadas</p>
                        <p className="mt-0.5 font-bold text-gray-900 dark:text-white">
                          {cliente.quantidade_vendas}
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto flex gap-2">
                      <Link
                        href={`/dashboard/clientes/${cliente.id}`}
                        className="btn-primary flex flex-1 items-center justify-center gap-1 py-2 text-xs"
                      >
                        <Eye className="h-3.5 w-3.5" /> Ver detalhes
                      </Link>

                      {possuiHistorico ? (
                        <button
                          type="button"
                          disabled
                          title="Cliente com histórico não pode ser excluído"
                          aria-label="Exclusão bloqueada por histórico"
                          className="cursor-not-allowed rounded-lg p-2 text-gray-400 opacity-60"
                        >
                          <Lock className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void handleDeletar(cliente)}
                          disabled={Boolean(excluindoId)}
                          title="Excluir cliente sem histórico"
                          aria-label={`Excluir ${cliente.nome}`}
                          className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-red-900/20"
                        >
                          {estaExcluindo ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>

                    {possuiHistorico && (
                      <p className="mt-2 flex items-center justify-center gap-1 text-[11px] text-gray-400">
                        <Lock className="h-3 w-3" /> Histórico protegido
                      </p>
                    )}
                  </article>
                )
              })}
            </section>
          )}
        </>
      )}
    </div>
  )
}

function Carregando({ texto }: { texto: string }) {
  return (
    <div className="flex h-64 items-center justify-center gap-2 text-gray-500">
      <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
      <span className="text-sm">{texto}</span>
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  valor,
  cor,
}: {
  icon: typeof Users
  label: string
  valor: string
  cor: 'blue' | 'red' | 'amber'
}) {
  const estilos = {
    blue: {
      fundo: 'bg-blue-100 dark:bg-blue-900/30',
      texto: 'text-blue-600 dark:text-blue-400',
    },
    red: {
      fundo: 'bg-red-100 dark:bg-red-900/30',
      texto: 'text-red-600 dark:text-red-400',
    },
    amber: {
      fundo: 'bg-amber-100 dark:bg-amber-900/30',
      texto: 'text-amber-600 dark:text-amber-400',
    },
  }

  return (
    <article className="card flex items-center gap-4 p-5">
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${estilos[cor].fundo}`}
      >
        <Icon className={`h-6 w-6 ${estilos[cor].texto}`} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p
          className={`break-words text-2xl font-bold ${
            cor === 'red'
              ? 'text-red-600 dark:text-red-400'
              : 'text-gray-900 dark:text-white'
          }`}
        >
          {valor}
        </p>
      </div>
    </article>
  )
}
