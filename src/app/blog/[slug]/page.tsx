import { notFound } from 'next/navigation'
import ArtigoFiado from '../artigos/como-controlar-fiado'
import ArtigoAbrirMercadinho from '../artigos/como-abrir-mercadinho-do-zero'

const ARTIGOS_MAP: Record<string, React.ComponentType> = {
  'como-controlar-fiado-no-mercadinho': ArtigoFiado,
  'como-abrir-mercadinho-do-zero': ArtigoAbrirMercadinho,
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const metas: Record<string, { title: string; description: string }> = {
    'como-controlar-fiado-no-mercadinho': {
      title:
        'Como controlar fiado no mercadinho sem caderno (guia completo 2026)',
      description:
        'Aprenda o método definitivo pra acabar com a bagunça do caderninho de fiado.',
    },
    'como-abrir-mercadinho-do-zero': {
      title:
        'Como abrir um mercadinho do ZERO em 2026 (guia completo passo a passo)',
      description:
        'Aprenda passo a passo como abrir seu mercadinho do zero: investimento, documentos, produtos iniciais, sistema e dicas pra não quebrar no 1º ano.',
    },
  }

  const meta = metas[slug]
  if (!meta) return {}

  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
    },
  }
}

export default async function ArtigoPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const Artigo = ARTIGOS_MAP[slug]
  if (!Artigo) notFound()
  return <Artigo />
}