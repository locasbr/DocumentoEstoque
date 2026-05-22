'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Package, BarChart3, AlertCircle, Home, ShoppingCart, TrendingUp } from 'lucide-react'

export default function Sidebar() {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/dashboard/produtos', label: 'Produtos', icon: Package },
    { href: '/dashboard/estoque', label: 'Estoque', icon: BarChart3 },
    { href: '/dashboard/pdv', label: 'PDV', icon: ShoppingCart },
    { href: '/dashboard/relatorios', label: 'Relatórios', icon: TrendingUp },
    { href: '/dashboard/alertas', label: 'Alertas', icon: AlertCircle },
  ]

  // Desktop Sidebar
  return (
    <>
      <aside className="hidden md:block w-64 bg-white dark:bg-gray-900 shadow-md dark:shadow-lg dark:shadow-black/20 h-screen sticky top-0 border-r dark:border-gray-800">
        <nav className="p-6 space-y-2">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors h-12 ${
                isActive(href)
                  ? 'bg-primary text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t dark:border-gray-800 shadow-2xl">
        <div className="flex items-center justify-around">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 px-3 py-2 flex-1 transition-colors active:bg-gray-100 dark:active:bg-gray-800 ${
                isActive(href)
                  ? 'text-primary dark:text-primary'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <Icon size={24} />
              <span className="text-xs font-medium truncate">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}
