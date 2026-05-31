'use client'

import { Shield, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Package, BarChart3, AlertCircle, Home, ShoppingCart, TrendingUp, UserCircle, Users } from 'lucide-react'
import { useMembro } from '@/hooks/useMembro'

const allNavItems = [
  { href: '/dashboard',            label: 'Dashboard',  icon: Home,         requiredLevel: 'dono' },
  { href: '/dashboard/produtos',   label: 'Produtos',   icon: Package,      requiredLevel: 'dono' },
  { href: '/dashboard/estoque',    label: 'Estoque',    icon: BarChart3,    requiredLevel: null },
  { href: '/dashboard/pdv',        label: 'PDV',        icon: ShoppingCart, requiredLevel: null },
  { href: '/dashboard/relatorios', label: 'Relatórios', icon: TrendingUp,   requiredLevel: 'dono' },
  { href: '/dashboard/alertas',    label: 'Alertas',    icon: AlertCircle,  requiredLevel: 'dono' },
  { href: '/dashboard/equipe',     label: 'Equipe',     icon: Users,        requiredLevel: 'dono' },
  { href: '/dashboard/clientes',   label: 'Clientes',   icon: Users,        requiredLevel: 'dono' },
  { href: '/dashboard/perfil',     label: 'Perfil',     icon: UserCircle,   requiredLevel: null },
  { href: '/dashboard/ajuda',      label: 'Ajuda',      icon: HelpCircle,   requiredLevel: null },
  { href: '/dashboard/admin',      label: 'Admin',      icon: Shield,       requiredLevel: 'dono' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { isDono } = useMembro()

  const isActive = (path: string) => pathname === path

  // Filtra itens baseado no nível do usuário
  const filteredNavItems = allNavItems.filter(item => {
    if (item.requiredLevel === null) return true // Todos têm acesso
    if (item.requiredLevel === 'dono') return isDono
    return false
  })

  // Mobile Bottom Navigation — mostra só os essenciais (5 principais)
  const mobileNavItems = filteredNavItems.filter(item =>
    ['/dashboard', '/dashboard/estoque', '/dashboard/pdv', '/dashboard/alertas', '/dashboard/perfil'].includes(item.href)
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-900 shadow-md dark:shadow-lg dark:shadow-black/20 h-screen sticky top-0 border-r dark:border-gray-800">
        <nav className="flex-1 p-4 space-y-1">
          {filteredNavItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                isActive(href)
                  ? 'bg-primary text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}>
              <Icon size={20} />
              <span className="text-sm font-medium">{label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t dark:border-gray-800 shadow-2xl z-30">
        <div className="flex items-center justify-around">
          {mobileNavItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={`flex flex-col items-center gap-0.5 px-2 py-2 flex-1 transition-colors ${
                isActive(href) ? 'text-primary' : 'text-gray-500 dark:text-gray-400'
              }`}>
              <Icon size={22} />
              <span className="text-[10px] font-medium truncate">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}
