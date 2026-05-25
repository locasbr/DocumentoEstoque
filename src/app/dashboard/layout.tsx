'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/navbar'
import Sidebar from '@/components/sidebar'
import SearchCommand from '@/components/search-command'
import Loading from '@/components/loading'

const RESTRICTED_ROUTES = [
  '/dashboard$', // dashboard principal
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

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        if (!data.session) {
          router.push('/login')
          return
        }

        // Busca o nível do usuário
        const { data: membroData } = await supabase
          .from('membros')
          .select('nivel')
          .eq('user_id', data.session.user.id)
          .single()

        const userLevel = membroData?.nivel || 'dono'

        // Se for funcionário, verifica se pode acessar a rota
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
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <SearchCommand />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950 pb-20 md:pb-0">
          <div className="w-full max-w-7xl mx-auto p-4 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
