'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'

import AdminWarningBanner from '@/components/admin-warning-banner'
import AvisoVencimento from '@/components/AvisoVencimento'
import Loading from '@/components/loading'
import ModalCompletarPerfil from '@/components/modal-completar-perfil'
import Navbar from '@/components/navbar'
import SearchCommand from '@/components/search-command'
import Sidebar from '@/components/sidebar'
import TrialBanner from '@/components/trial-banner'
import { supabase } from '@/lib/supabase'

type NivelUsuario = 'dono' | 'funcionario'
type TipoPlano = 'iniciante' | 'profissional' | 'negocio'
type StatusPlano = 'trial' | 'ativo' | 'expirado'

interface MembroAcesso {
  nivel: string | null
  status: string | null
  dono_id: string | null
}

interface PerfilAcesso {
  plano: string | null
  tipo_plano: string | null
  trial_fim: string | null
  plano_fim: string | null
  tipo_pagamento: string | null
  is_admin: boolean | null
  telefone: string | null
}

const ROTAS_RESTRITAS_FUNCIONARIO = [
  '/dashboard',
  '/dashboard/produtos',
  '/dashboard/perdas',
  '/dashboard/reposicao',
  '/dashboard/relatorios',
  '/dashboard/alertas',
  '/dashboard/equipe',
  '/dashboard/clientes',
  '/dashboard/admin',
] as const

const UM_DIA_EM_MS = 86_400_000

function rotaRestritaParaFuncionario(pathname: string): boolean {
  return ROTAS_RESTRITAS_FUNCIONARIO.some((rota) => {
    if (rota === '/dashboard') return pathname === rota
    return pathname === rota || pathname.startsWith(`${rota}/`)
  })
}

function dataValida(valor: string | null | undefined): Date | null {
  if (!valor) return null

  const data = new Date(valor)
  return Number.isNaN(data.getTime()) ? null : data
}

function isTipoPlano(valor: unknown): valor is TipoPlano {
  return (
    valor === 'iniciante' ||
    valor === 'profissional' ||
    valor === 'negocio'
  )
}

function isStatusPlano(valor: unknown): valor is StatusPlano {
  return valor === 'trial' || valor === 'ativo' || valor === 'expirado'
}

function urlAssinatura(perfil: PerfilAcesso): string {
  const plano = isTipoPlano(perfil.tipo_plano)
    ? `&plano=${perfil.tipo_plano}`
    : ''

  return `/assinar?renovar=1${plano}`
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const [isLoading, setIsLoading] = useState(true)
  const [diasRestantes, setDiasRestantes] = useState<number | null>(null)
  const [mostrarBanner, setMostrarBanner] = useState(false)
  const [precisaCompletarPerfil, setPrecisaCompletarPerfil] = useState(false)

  const verificacaoInicialConcluida = useRef(false)
  const nivelUsuarioRef = useRef<NivelUsuario>('dono')
  const redirecionandoRef = useRef(false)

  const redirecionar = useCallback(
    (destino: string) => {
      if (redirecionandoRef.current) return

      redirecionandoRef.current = true
      router.replace(destino)
    },
    [router],
  )

  const verificarAcesso = useCallback(async () => {
    if (verificacaoInicialConcluida.current) return

    setIsLoading(true)
    setPrecisaCompletarPerfil(false)
    setDiasRestantes(null)
    setMostrarBanner(false)

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        redirecionar('/login')
        return
      }

      const { data: membroData, error: membroError } = await supabase
        .from('membros')
        .select('nivel, status, dono_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (membroError) {
        console.error('Erro ao verificar vínculo do usuário:', membroError)
        redirecionar('/login')
        return
      }

      const membro = membroData as MembroAcesso | null
      const nivelUsuario: NivelUsuario =
        membro?.nivel === 'funcionario' ? 'funcionario' : 'dono'

      if (nivelUsuario === 'funcionario' && membro?.status !== 'ativo') {
        await supabase.auth.signOut()
        redirecionar('/login')
        return
      }

      const donoId =
        nivelUsuario === 'funcionario' &&
        typeof membro?.dono_id === 'string' &&
        membro.dono_id.trim()
          ? membro.dono_id
          : user.id

      nivelUsuarioRef.current = nivelUsuario

      if (
        nivelUsuario === 'funcionario' &&
        rotaRestritaParaFuncionario(pathname)
      ) {
        redirecionar('/dashboard/pdv')
        return
      }

      const { data: perfilData, error: perfilError } = await supabase
        .from('perfis')
        .select(
          'plano, tipo_plano, trial_fim, plano_fim, tipo_pagamento, is_admin, telefone',
        )
        .eq('id', donoId)
        .maybeSingle()

      if (perfilError) {
        console.error('Erro ao verificar perfil:', perfilError)
        redirecionar('/login')
        return
      }

      const perfil = perfilData as PerfilAcesso | null

      if (!perfil) {
        console.error('Perfil da conta não encontrado:', donoId)
        redirecionar('/login')
        return
      }

      if (perfil.is_admin === true) {
        verificacaoInicialConcluida.current = true
        setIsLoading(false)
        return
      }

      if (
        nivelUsuario === 'dono' &&
        (!perfil.telefone || !perfil.telefone.trim())
      ) {
        setPrecisaCompletarPerfil(true)
      }

      const agora = new Date()
      const statusPlano = isStatusPlano(perfil.plano)
        ? perfil.plano
        : null

      if (!statusPlano || statusPlano === 'expirado') {
        redirecionar(urlAssinatura(perfil))
        return
      }

      if (statusPlano === 'trial') {
        const trialFim = dataValida(perfil.trial_fim)

        if (!trialFim || trialFim.getTime() <= agora.getTime()) {
          redirecionar(urlAssinatura(perfil))
          return
        }

        const dias = Math.max(
          0,
          Math.ceil((trialFim.getTime() - agora.getTime()) / UM_DIA_EM_MS),
        )

        setDiasRestantes(dias)
        setMostrarBanner(dias <= 5)
      }

      if (statusPlano === 'ativo') {
        const planoFim = dataValida(perfil.plano_fim)

        // Todo período pago precisa ter uma data final válida.
        // PIX exige renovação manual. Cartão também é bloqueado se a
        // cobrança aprovada ainda não renovou plano_fim no webhook.
        if (!planoFim || planoFim.getTime() <= agora.getTime()) {
          redirecionar(urlAssinatura(perfil))
          return
        }
      }

      verificacaoInicialConcluida.current = true
      setIsLoading(false)
    } catch (error: unknown) {
      console.error('Erro inesperado ao verificar acesso:', error)
      redirecionar('/login')
    }
  }, [pathname, redirecionar])

  useEffect(() => {
    void verificarAcesso()
  }, [verificarAcesso])

  useEffect(() => {
    if (
      verificacaoInicialConcluida.current &&
      nivelUsuarioRef.current === 'funcionario' &&
      rotaRestritaParaFuncionario(pathname)
    ) {
      redirecionar('/dashboard/pdv')
    }
  }, [pathname, redirecionar])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        verificacaoInicialConcluida.current = false
        redirecionandoRef.current = false
        redirecionar('/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [redirecionar])

  if (isLoading) return <Loading />

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <Navbar />
      <Sidebar />
      <SearchCommand />

      <main className="min-w-0 pt-20 md:ml-56">
        <div className="mx-auto w-full max-w-[1600px] px-4 pb-28 sm:px-5 md:px-6 md:pb-8 lg:px-8">
          <div className="space-y-3">
            <AdminWarningBanner />
            <AvisoVencimento />
            {mostrarBanner && diasRestantes !== null && (
              <TrialBanner diasRestantes={diasRestantes} />
            )}
          </div>

          <div className="mt-4 min-w-0">{children}</div>
        </div>
      </main>

      {precisaCompletarPerfil && (
        <ModalCompletarPerfil
          onComplete={() => {
            setPrecisaCompletarPerfil(false)
            verificacaoInicialConcluida.current = false
            redirecionandoRef.current = false
            void verificarAcesso()
          }}
        />
      )}
    </div>
  )
}
