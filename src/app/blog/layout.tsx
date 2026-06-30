import Link from 'next/link'
import { ArrowLeft, BookOpen } from 'lucide-react'

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-green-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Voltar ao site</span>
          </Link>
          <Link
            href="/blog"
            className="flex items-center gap-2 font-bold text-gray-900 dark:text-white"
          >
            <BookOpen className="w-5 h-5 text-green-600" />
            Blog EstoqueSystem
          </Link>
          <Link
            href="/signup"
            className="text-sm font-semibold px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full hover:shadow-lg hover:shadow-green-500/30 transition"
          >
            Teste grátis
          </Link>
        </div>
      </header>
      {children}
    </div>
  )
}