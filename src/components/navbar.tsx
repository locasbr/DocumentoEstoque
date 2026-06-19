'use client'

import { HelpCircle, Lock, Shield } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  LogOut, Menu, Moon, Sun, Home, Package, BarChart3,
  ShoppingCart, AlertCircle, TrendingUp, Users, UserCircle
} from 'lucide-react'
import { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useMembro } from '@/hooks/useMembro'
import { usePlano } from '@/hooks/usePlano'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home, requiredLevel: 'dono', planoBloqueio: null },
  { href: '/dashboard/produtos', label: 'Produtos', icon: Package, requiredLevel: 'dono', planoBloqueio: null },
  { href: '/dashboard/estoque', label: 'Estoque', icon: BarChart3, requiredLevel: null, planoBloqueio: null },
  { href: '/dashboard/pdv', label: 'PDV', icon: ShoppingCart, requiredLevel: null, planoBloqueio: null },
  { href: '/dashboard/relatorios', label: 'Relatórios', icon: TrendingUp, requiredLevel: 'dono', planoBloqueio: null },
  { href: '/dashboard/alertas', label: 'Alertas', icon: AlertCircle, requiredLevel: 'dono', planoBloqueio: null },
  { href: '/dashboard/vendas', label: 'Vendas', icon: ShoppingCart, requiredLevel: 'dono', planoBloqueio: null },
  { href: '/dashboard/equipe', label: 'Equipe', icon: Users, requiredLevel: 'dono', planoBloqueio: null },
  { href: '/dashboard/perfil', label: 'Perfil', icon: UserCircle, requiredLevel: null, planoBloqueio: null },
  { href: '/dashboard/clientes', label: 'Clientes', icon: Users, requiredLevel: 'dono', planoBloqueio: 'iniciante' },
  { href: '/dashboard/ajuda', label: 'Ajuda', icon: HelpCircle, requiredLevel: null, planoBloqueio: null },
  { href: '/dashboard/admin', label: 'Admin', icon: Shield, requiredLevel: 'dono', planoBloqueio: null },
]

export default function Navbar() {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const { isDono } = useMembro()
  const { isIniciante } = usePlano()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isBloqueadoPorPlano = (planoBloqueio: string | null) => {
    if (planoBloqueio === 'iniciante' && isIniciante) return true
    return false
  }

  const filteredNavItems = navItems.filter(item => {
    if (item.requiredLevel === null) return true
    if (item.requiredLevel === 'dono') return isDono
    return false
  })

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 shadow-md dark:shadow-lg dark:shadow-black/20 border-b dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">

          <Link
            href="/dashboard"
            className="font-bold text-xl text-primary"
          >
            📦 EstoqueSystem
          </Link>

          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={`Ativar ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                <Moon size={20} className="text-gray-600 dark:text-gray-400" />
              ) : (
                <Sun size={20} className="text-yellow-500" />
              )}
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              <LogOut size={20} />
              Sair
            </button>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2"
          >
            <Menu size={24} />
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-1 border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 max-h-96 overflow-y-auto">

            {filteredNavItems.map(({ href, label, icon: Icon, planoBloqueio }) => {
              const bloqueado = isBloqueadoPorPlano(planoBloqueio)

              if (bloqueado) {
                return (
                  <Link
                    key={href}
                    href="/dashboard/assinar"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-left px-4 py-3 text-gray-400 dark:text-gray-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/10 rounded transition-colors font-medium flex items-center gap-3"
                  >
                    <Icon size={18} />
                    <span className="flex-1">{label}</span>
                    <span className="text-[10px] font-bold bg-yellow-500 text-white px-1.5 py-0.5 rounded">PRO</span>
                    <Lock size={12} className="text-yellow-500" />
                  </Link>
                )
              }

              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-left px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors font-medium flex items-center gap-3"
                >
                  <Icon size={18} />
                  {label}
                </Link>
              )
            })}

            <hr className="dark:border-gray-700 my-2" />

            <button
              onClick={() => {
                toggleTheme()
                setMobileMenuOpen(false)
              }}
              className="block w-full text-left px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors font-medium h-12 flex items-center"
            >
              {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
            </button>

            <button
              onClick={() => {
                handleLogout()
                setMobileMenuOpen(false)
              }}
              className="block w-full text-left px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors font-medium h-12 flex items-center gap-2"
            >
              <LogOut size={18} />
              Sair
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}