'use client'

import { useEffect, useState } from 'react'
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

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession()

        if (!data.session) {
          router.push('/login')
          return
        }

        // ── Busca nível do membro (lógica existente) ──
        const { data: membroData } = await supabase
          .from('membros')
          .select('nivel')
          .eq('user_id', data.session.user.id)
          .single()

        const userLevel = membroData?.nivel ?? 'dono'

        if (userLevel === 'funcionario') {
          const isRestrictedRoute = RESTRICTED_ROUTES.some((route) => {
            const regex = new RegExp(`^${route}`)
            return regex.test(pathname)
          })

          if (isRestrictedRoute) {
            router.push('/dashboard/pdv')
            return
          }
        }

        // ── NOVO: Verifica trial/plano ──
        const { data: perfil } = await supabase
          .from('perfis')
          .select('plano, trial_fim')
          .eq('id', data.session.user.id)
          .single()

        if (perfil) {
          const agora = new Date()
          const trialFim = perfil.trial_fim
            ? new Date(perfil.trial_fim)
            : null

          // Plano expirado → paywall
          if (perfil.plano === 'expirado') {
            router.push('/assinar')
            return
          }

          // Trial expirado → paywall
          if (
            perfil.plano === 'trial' &&
            trialFim &&
            trialFim < agora
          ) {
            router.push('/assinar')
            return
          }

          // Trial ativo → calcula dias restantes pro banner
          if (perfil.plano === 'trial' && trialFim) {
            const diffMs = trialFim.getTime() - agora.getTime()
            const dias = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
            setDiasRestantes(dias)

            // Mostra banner só nos últimos 5 dias
            if (dias >= 0 && dias <= 5) {
              setMostrarBanner(true)
            }
          }
        }

        setIsLoading(false)
      } catch (error) {
        console.error('Error checking auth:', error)
        router.push('/login')
      }
    }

    checkAuth()
  }, [router, pathname])

  if (isLoading) {
    return <Loading />
  }

  return (
    <div className="min-h-screen">
      {mostrarBanner && diasRestantes !== null && (
        <TrialBanner diasRestantes={diasRestantes} />
      )}
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 md:ml-48 mb-16 md:mb-0 mt-16">
          <SearchCommand />
          {children}
        </main>
      </div>
    </div>
  )
}