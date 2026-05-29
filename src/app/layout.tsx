import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import ToastContainer from '@/components/toast-container'

export const metadata: Metadata = {
  title: 'EstoqueSystem — Controle de Estoque para Pequenos Comércios',
  description:
    'Sistema completo de estoque, PDV e relatórios para mercados, mercearias e pequenos comércios. Funciona no celular. 15 dias grátis.',
  keywords: [
    'sistema de estoque',
    'controle de estoque',
    'PDV',
    'ponto de venda',
    'mercado',
    'mercearia',
    'gestão de estoque',
    'estoque online',
  ],
  authors: [{ name: 'Lucas Machado' }],
  openGraph: {
    title: 'EstoqueSystem — Controle de Estoque Simples e Inteligente',
    description:
      'Gerencie seu estoque, venda pelo PDV e acompanhe relatórios. Tudo no celular. Teste grátis por 15 dias.',
    url: 'https://documento-estoque.vercel.app',
    siteName: 'EstoqueSystem',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'EstoqueSystem — Sistema de Estoque',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EstoqueSystem — Controle de Estoque Simples',
    description: 'Sistema de estoque, PDV e relatórios. 15 dias grátis.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <NotificationProvider>
            {children}
            <ToastContainer />
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}