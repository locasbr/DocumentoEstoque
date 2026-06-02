// src/app/auth/confirmado/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react'

export default function EmailConfirmadoPage() {
  const router = useRouter()
  const [contador, setContador] = useState(5)

  // Redireciona automaticamente após 5 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setContador((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/dashboard')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Ícone de sucesso */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-green-400/20 rounded-full blur-xl" />
            <CheckCircle className="w-20 h-20 text-green-500 relative" />
          </div>
        </div>

        {/* Título */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Email confirmado com sucesso! ✅
          </h1>
        </div>

        {/* Descrição */}
        <div>
          <p className="text-gray-600 dark:text-gray-300">
            Sua conta foi verificada. Agora você pode usar todas as funcionalidades
            do EstoqueSystem.
          </p>
        </div>

        {/* Contador */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          Redirecionando para o dashboard em{' '}
          <span className="font-bold text-gray-900 dark:text-white">{contador}s</span>...
        </div>

        {/* Botão manual */}
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Ir para o Dashboard
          <ArrowRight className="w-4 h-4" />
        </Link>

        {/* Rodapé */}
        <p className="text-xs text-gray-400 dark:text-gray-600">
          📦 EstoqueSystem — Controle de estoque simples e inteligente
        </p>
      </div>
    </div>
  )
}
