import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EstoqueSystem - Sistema de Estoque',
  description: 'Sistema simples de estoque para pequenos mercados',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-50">{children}</body>
    </html>
  )
}
