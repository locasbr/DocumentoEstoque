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

  return (
    <aside className="hidden md:block w-64 bg-white shadow-md h-screen sticky top-0">
      <nav className="p-6 space-y-4">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive(href)
                ? 'bg-primary text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  )
}
