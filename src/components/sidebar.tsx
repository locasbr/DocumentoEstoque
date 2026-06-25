'use client'

import { Shield, HelpCircle, Lock } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Package,
  BarChart3,
  AlertCircle,
  Home,
  ShoppingCart,
  TrendingUp,
  UserCircle,
  Users,
} from 'lucide-react'
import { useMembro } from '@/hooks/useMembro'
import { usePlano } from '@/hooks/usePlano'
import { useIsAdmin } from '@/hooks/useIsAdmin'

const allNavItems = [
  { href: '/dashboard',            label: 'Dashboard',  icon: Home,         requiredLevel: 'dono', planoBloqueio: null, apenasAdmin: false },
  { href: '/dashboard/produtos',   label: 'Produtos',   icon: Package,      requiredLevel: 'dono', planoBloqueio: null, apenasAdmin: false },
  { href: '/dashboard/estoque',    label: 'Estoque',    icon: BarChart3,    requiredLevel: null,   planoBloqueio: null, apenasAdmin: false },
  { href: '/dashboard/pdv',        label: 'PDV',        icon: ShoppingCart, requiredLevel: null,   planoBloqueio: null, apenasAdmin: false },
  { href: '/dashboard/relatorios', label: 'Relatórios', icon: TrendingUp,   requiredLevel: 'dono', planoBloqueio: null, apenasAdmin: false },
  { href: '/dashboard/alertas',    label: 'Alertas',    icon: AlertCircle,  requiredLevel: 'dono', planoBloqueio: null, apenasAdmin: false },
  { href: '/dashboard/vendas',     label: 'Vendas',     icon: ShoppingCart, requiredLevel: 'dono', planoBloqueio: null, apenasAdmin: false },
  { href: '/dashboard/equipe',     label: 'Equipe',     icon: Users,        requiredLevel: 'dono', planoBloqueio: null, apenasAdmin: false },
  { href: '/dashboard/clientes',   label: 'Clientes',   icon: Users,        requiredLevel: 'dono', planoBloqueio: 'iniciante', apenasAdmin: false },
  { href: '/dashboard/perfil',     label: 'Perfil',     icon: UserCircle,   requiredLevel: null,   planoBloqueio: null, apenasAdmin: false },
  { href: '/dashboard/ajuda',      label: 'Ajuda',      icon: HelpCircle,   requiredLevel: null,   planoBloqueio: null, apenasAdmin: false },
  { href: '/dashboard/admin',      label: 'Admin',      icon: Shield,       requiredLevel: 'dono', planoBloqueio: null, apenasAdmin: true }, // 🆕
]

export default function Sidebar() {
  const pathname = usePathname()
  const { isDono } = useMembro()
  const { isIniciante } = usePlano()
  const { isAdmin } = useIsAdmin() // 🆕

  const isActive = (path: string) => pathname === path

  // Verifica se um item está bloqueado pelo plano
  const isBloqueadoPorPlano = (planoBloqueio: string | null) => {
    if (planoBloqueio === 'iniciante' && isIniciante) return true
    return false
  }

  // Filtra itens baseado no nível do usuário + admin
  const filteredNavItems = allNavItems.filter(item => {
    // 🆕 Esconde itens de admin pra não-admins
    if (item.apenasAdmin && !isAdmin) return false

    if (item.requiredLevel === null) return true
    if (item.requiredLevel === 'dono') return isDono
    return false
  })

  // Mobile Bottom Navigation — mostra só os essenciais
  const mobileNavItems = filteredNavItems.filter(item =>
    ['/dashboard', '/dashboard/estoque', '/dashboard/pdv', '/dashboard/alertas', '/dashboard/perfil'].includes(item.href)
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-white dark:bg-gray-900 shadow-md dark:shadow-lg dark:shadow-black/20 h-screen fixed top-14 left-0 border-r dark:border-gray-800 z-30">
        <nav className="flex-1 p-4 space-y-1">
          {filteredNavItems.map(({ href, label, icon: Icon, planoBloqueio, apenasAdmin }) => {
            const bloqueado = isBloqueadoPorPlano(planoBloqueio)

            // 🔒 ITEM BLOQUEADO POR PLANO
            if (bloqueado) {
              return (
                <Link
                  key={href}
                  href="/assinar"
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-gray-400 dark:text-gray-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/10 group"
                  title="Disponível no plano Profissional"
                >
                  <Icon size={20} />
                  <span className="text-sm font-medium flex-1">{label}</span>
                  <span className="text-[10px] font-bold bg-yellow-500 text-white px-1.5 py-0.5 rounded">PRO</span>
                  <Lock size={12} className="text-yellow-500" />
                </Link>
              )
            }

            // ✅ ITEM NORMAL
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                  isActive(href)
                    ? apenasAdmin
                      ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white' // 🆕 Admin com gradiente especial
                      : 'bg-primary text-white'
                    : apenasAdmin
                      ? 'text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/10' // 🆕 Admin sempre destacado
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon size={20} />
                <span className="text-sm font-medium">{label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t dark:border-gray-800 shadow-2xl z-30">
        <div className="flex items-center justify-around">
          {mobileNavItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-2 py-2 flex-1 transition-colors ${
                isActive(href) ? 'text-primary' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <Icon size={22} />
              <span className="text-[10px] font-medium truncate">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}