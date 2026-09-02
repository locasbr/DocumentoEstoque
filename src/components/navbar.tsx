'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  CreditCard,
  Loader2,
  LogOut,
  Moon,
  Package,
  Sun,
} from 'lucide-react'

import { useTheme } from '@/contexts/ThemeContext'
import { supabase } from '@/lib/supabase'

export default function Navbar() {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()

  const [saindo, setSaindo] = useState(false)

  const handleLogout = async () => {
    if (saindo) {
      return
    }

    setSaindo(true)

    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error(
          'Erro ao encerrar sessão:',
          error
        )

        setSaindo(false)
        return
      }

      router.replace('/login')
      router.refresh()
    } catch (error: unknown) {
      console.error(
        'Erro inesperado ao encerrar sessão:',
        error
      )

      setSaindo(false)
    }
  }

  return (
    <nav className="fixed inset-x-0 top-0 z-40 h-14 border-b border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-lg text-gray-900 transition-colors hover:text-emerald-600 dark:text-white dark:hover:text-emerald-400"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
            <Package
              aria-hidden="true"
              className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
            />
          </span>

          <span className="hidden truncate text-lg sm:inline">
            EstoqueSystem
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/assinar"
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white sm:px-3"
          >
            <CreditCard
              aria-hidden="true"
              className="h-5 w-5"
            />

            <span className="hidden text-sm font-medium md:inline">
              Meu plano
            </span>
          </Link>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={
              theme === 'light'
                ? 'Ativar modo escuro'
                : 'Ativar modo claro'
            }
            title={
              theme === 'light'
                ? 'Ativar modo escuro'
                : 'Ativar modo claro'
            }
            className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
          >
            {theme === 'light' ? (
              <Moon
                aria-hidden="true"
                className="h-5 w-5"
              />
            ) : (
              <Sun
                aria-hidden="true"
                className="h-5 w-5 text-amber-500"
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={saindo}
            aria-label={
              saindo
                ? 'Encerrando sessão'
                : 'Sair da conta'
            }
            title="Sair da conta"
            className="inline-flex items-center gap-2 rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 sm:px-3"
          >
            {saindo ? (
              <Loader2
                aria-hidden="true"
                className="h-5 w-5 animate-spin"
              />
            ) : (
              <LogOut
                aria-hidden="true"
                className="h-5 w-5"
              />
            )}

            <span className="hidden text-sm font-medium sm:inline">
              {saindo ? 'Saindo...' : 'Sair'}
            </span>
          </button>
        </div>
      </div>
    </nav>
  )
}