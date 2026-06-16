'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/navbar'
import Sidebar from '@/components/sidebar'
import SearchCommand from '@/components/search-command'
import Loading from '@/components/loading'
import TrialBanner from '@/components/trial-banner'

const RESTRICTED_ROUTES = [
  '/dashboard$',
  '/dashboard/produtos',
  '/dashboard/relatorios',
  '/dashboard/alertas',
  '/dashboard/equipe',
  '/dashboard/clientes',
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)
  const [diasRestantes, setDiasRestantes] = useState<number | null>(null)
  const [mostrarBanner, setMostrarBanner] = useState(false)
  const [tipoBanner, setTipoBanner] = useState<'trial' | 'renovacao'>('trial')

  const initialCheckDone = useRef(false)
  const userLevelRef = useRef<string>('dono')

  useEffect(() => {
    // Listener de auth — mantém sessão atualizada
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          router.push('/login')
        }
        if (event === 'TOKEN_REFRESHED') {
          console.log('Sessão renovada automaticamente')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router])

  useEffect(() => {
    const checkAuth = async () => {
      if (initialCheckDone.current) {
        if (userLevelRef.current === 'funcionario') {
          const isRestricted = RESTRICTED_ROUTES.some((route) =>
            new RegExp(`^${route}`).test(pathname)
          )
          if (isRestricted) router.push('/dashboard/pdv')
        }
        return
      }

      try {
        const { data } = await supabase.auth.getSession()
        if (!data.session) {
          router.push('/login')
          return
        }

        const { data: membroData } = await supabase
          .from('membros')
          .select('nivel')
          .eq('user_id', data.session.user.id)
          .single()

        const userLevel = membroData?.nivel ?? 'dono'
        userLevelRef.current = userLevel

        if (userLevel === 'funcionario') {
          const isRestricted = RESTRICTED_ROUTES.some((route) =>
            new RegExp(`^${route}`).test(pathname)
          )
          if (isRestricted) {
            router.push('/dashboard/pdv')
            return
          }
        }

        const { data: perfil } = await supabase
          .from('perfis')
          .select('plano, trial_fim, plano_fim, tipo_pagamento')
          .eq('id', data.session.user.id)
          .single()

        if (perfil) {
          const agora = new Date()
          const trialFim = perfil.trial_fim ? new Date(perfil.trial_fim) : null

          if (perfil.plano === 'expirado') {
            router.push('/assinar')
            return
          }

          if (perfil.plano === 'trial' && trialFim && trialFim < agora) {
            router.push('/assinar')
            return
          }

          if (perfil.plano === 'trial' && trialFim) {
            const dias = Math.ceil(
              (trialFim.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24)
            )
            setDiasRestantes(dias)
            if (dias >= 0 && dias <= 5) setMostrarBanner(true)
          }

          if (perfil.plano === 'ativo' && perfil.plano_fim) {
            const fimPlano = new Date(perfil.plano_fim)
            if (fimPlano < agora) {
              await supabase
                .from('perfis')
                .update({ plano: 'expirado' })
                .eq('id', data.session.user.id)
              router.push('/assinar')
              return
            }

            const diasPlano = Math.ceil(
              (fimPlano.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24)
            )
            if (
              diasPlano >= 0 &&
              diasPlano <= 5 &&
              perfil.tipo_pagamento === 'pix'
            ) {
              setDiasRestantes(diasPlano)
              setMostrarBanner(true)
              setTipoBanner('renovacao')
            }
          }
        }

        initialCheckDone.current = true
        setIsLoading(false)
      } catch (error) {
        console.error('Error checking auth:', error)
        router.push('/login')
      }
    }

    checkAuth()
  }, [router, pathname])

  if (isLoading) return <Loading />

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {mostrarBanner && diasRestantes !== null && (
        <TrialBanner diasRestantes={diasRestantes} tipo={tipoBanner} />
      )}
      <Navbar />
      <Sidebar />
      <SearchCommand />
      <main className="md:ml-56 pt-20 px-4 md:px-6 pb-24 md:pb-6">
        {children}
      </main>
    </div>
  )
}