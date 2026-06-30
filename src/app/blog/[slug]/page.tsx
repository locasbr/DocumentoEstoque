import { notFound } from 'next/navigation'
import ArtigoFiado from '../artigos/como-controlar-fiado'

const ARTIGOS_MAP: Record<string, React.ComponentType> = {
  'como-controlar-fiado-no-mercadinho': ArtigoFiado,
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
        'Aprenda o método definitivo pra acabar com a bagunça do caderninho de fiado. Guia prático com planilha grátis pra download.',
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