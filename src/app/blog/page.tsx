import Link from 'next/link'
import { Clock, Tag, ArrowRight } from 'lucide-react'

export const metadata = {
  title: 'Blog EstoqueSystem - Dicas pra mercadinhos brasileiros',
  description:
    'Aprenda a gerenciar seu mercadinho com dicas práticas: estoque, fiado, vendas, precificação e muito mais. Conteúdo grátis pra você crescer.',
}

const ARTIGOS = [
  {
    slug: 'como-controlar-fiado-no-mercadinho',
    titulo: 'Como controlar fiado no mercadinho sem caderno (guia 2026)',
    descricao:
      'Aprenda o método definitivo para acabar com a bagunça do caderninho e nunca mais perder dinheiro com cliente devedor.',
    categoria: 'Controle Financeiro',
    tempoLeitura: '8 min',
    data: '2026-06-29',
    destaque: true,
  },
]

export default function BlogPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-bold mb-4">
          📚 BLOG ESTOQUESYSTEM
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
          Dicas práticas pra{' '}
          <span className="bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
            seu mercadinho crescer
          </span>
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Conteúdo grátis pra você gerenciar melhor seu comércio. Sem
          enrolação, direto ao ponto.
        </p>
      </div>

      <div className="space-y-6">
        {ARTIGOS.map((artigo) => (
          <Link
            key={artigo.slug}
            href={`/blog/${artigo.slug}`}
            className="block bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 md:p-8 hover:shadow-xl hover:border-green-300 dark:hover:border-green-700 transition-all hover:-translate-y-1 group"
          >
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded">
                <Tag className="w-3 h-3" />
                {artigo.categoria}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {artigo.tempoLeitura} de leitura
              </span>
              {artigo.destaque && (
                <span className="text-xs px-2 py-1 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 text-amber-700 dark:text-amber-400 font-bold rounded">
                  ⭐ EM DESTAQUE
                </span>
              )}
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-green-600 dark:group-hover:text-green-400 transition">
              {artigo.titulo}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
              {artigo.descricao}
            </p>
            <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold text-sm group-hover:gap-2 transition-all">
              Ler artigo completo
              <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-8 md:p-12 text-center text-white">
        <h2 className="text-2xl md:text-3xl font-extrabold mb-3">
          Pronto pra organizar seu mercadinho?
        </h2>
        <p className="text-green-50 mb-6 max-w-md mx-auto">
          15 dias grátis pra testar tudo. Sem cartão, sem compromisso.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 bg-white text-green-700 font-bold px-8 py-3 rounded-full hover:shadow-2xl transition"
        >
          Começar teste grátis
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </main>
  )
}