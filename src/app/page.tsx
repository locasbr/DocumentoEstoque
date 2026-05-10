'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Loading from '@/components/loading'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Pequeno delay para garantir que o router está pronto
    const timer = setTimeout(() => {
      router.push('/login')
    }, 500)

    return () => clearTimeout(timer)
  }, [router])

  return <Loading />
}
