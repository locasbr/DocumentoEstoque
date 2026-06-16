'use client'

import { HelpCircle } from 'lucide-react'
import { Shield } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { LogOut, Menu, Moon, Sun, Home, Package, BarChart3, ShoppingCart, AlertCircle, TrendingUp, Users, UserCircle } from 'lucide-react'
import { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useMembro } from '@/hooks/useMembro'


const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home, requiredLevel: 'dono' },
  { href: '/dashboard/produtos', label: 'Produtos', icon: Package, requiredLevel: 'dono' },
  { href: '/dashboard/estoque', label: 'Estoque', icon: BarChart3, requiredLevel: null },
  { href: '/dashboard/pdv', label: 'PDV', icon: ShoppingCart, requiredLevel: null },
  { href: '/dashboard/relatorios', label: 'Relatórios', icon: TrendingUp, requiredLevel: 'dono' },
  { href: '/dashboard/alertas', label: 'Alertas', icon: AlertCircle, requiredLevel: 'dono' },
  { href: '/dashboard/vendas', label: 'Vendas', icon: ShoppingCart, requiredLevel: 'dono' },
  { href: '/dashboard/equipe', label: 'Equipe', icon: Users, requiredLevel: 'dono' },
  { href: '/dashboard/perfil', label: 'Perfil', icon: UserCircle, requiredLevel: null },
  { href: '/dashboard/clientes', label: 'Clientes', icon: Users, requiredLevel: 'dono' },
  { href: '/dashboard/ajuda', label: 'Ajuda', icon: HelpCircle, requiredLevel: null },
  { href: '/dashboard/admin', label: 'Admin', icon: Shield, requiredLevel: 'dono' },
]

export default function Navbar() {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const { isDono } = useMembro()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
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
          <Link href="/dashboard" className="font-bold text-xl text-primary">
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
            {/* Navegação */}
            {filteredNavItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-left px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors font-medium flex items-center gap-3"
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}

            <hr className="dark:border-gray-700 my-2" />

            {/* Dark Mode */}
            <button
              onClick={() => {
                toggleTheme()
                setMobileMenuOpen(false)
              }}
              className="block w-full text-left px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors font-medium h-12 flex items-center"
            >
              {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
            </button>

            {/* Logout */}
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
