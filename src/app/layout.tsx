import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import ToastContainer from '@/components/toast-container'

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
