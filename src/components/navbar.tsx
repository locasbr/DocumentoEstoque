'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { LogOut, Menu } from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/dashboard" className="font-bold text-xl text-primary">
            📦 EstoqueSystem
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2"
          >
            <Menu size={24} />
          </button>

          <button
            onClick={handleLogout}
            className="hidden md:flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <LogOut size={20} />
            Sair
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden pb-4">
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Sair
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
