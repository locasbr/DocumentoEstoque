'use client'

import { useIsAdmin } from '@/hooks/useIsAdmin'
import { Shield, AlertTriangle } from 'lucide-react'

export default function AdminWarningBanner() {
  const { isAdmin, loading } = useIsAdmin()

  if (loading || !isAdmin) return null

  return (
    <div className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white px-4 py-2 text-center text-sm font-bold flex items-center justify-center gap-2 shadow-lg relative z-50">
      <Shield className="w-4 h-4 flex-shrink-0" />
      <span className="hidden sm:inline">🛡️ MODO ADMIN ATIVO —</span>
      <span className="sm:hidden">🛡️ ADMIN</span>
      <span className="hidden md:inline">
        Você está vendo dados de TODOS os clientes. Cuidado ao editar!
      </span>
      <AlertTriangle className="w-4 h-4 flex-shrink-0 animate-pulse" />
    </div>
  )
}