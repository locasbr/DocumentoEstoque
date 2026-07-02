import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import './globals.css'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import ToastContainer from '@/components/toast-container'
import InstallPWABanner from '@/components/install-pwa-banner'

export const viewport: Viewport = {
  themeColor: '#16a34a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  metadataBase: new URL('https://estoquesystem.com.br'),
  title: {
    default: 'EstoqueSystem — Controle de Estoque para Mercadinhos Brasileiros',
    template: '%s | EstoqueSystem',
  },
  description:
    'Sistema completo de estoque, PDV, fiado e relatórios para mercados, mercearias e pequenos comércios. Funciona no celular. 15 dias grátis, sem cartão.',
  keywords: [
    'sistema de estoque',
    'controle de estoque',
    'PDV',
    'ponto de venda',
    'mercadinho',
    'mercearia',
    'mercado',
    'gestão de estoque',
    'estoque online',
    'controle de fiado',
    'sistema para mercadinho',
    'app mercadinho',
    'sistema PDV celular',
    'controle de vendas',
    'gestão comércio',
    'pequenos comércios',
    'sistema brasileiro',
    'EstoqueSystem',
    'Saquarema',
  ],
  authors: [{ name: 'Lucas Machado', url: 'https://estoquesystem.com.br' }],
  creator: 'Lucas Machado',
  publisher: 'EstoqueSystem',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'EstoqueSystem',
  },
  openGraph: {
    title: 'EstoqueSystem — Controle de Estoque Simples e Inteligente',
    description:
      'Gerencie seu estoque, venda pelo PDV e acompanhe relatórios. Tudo no celular. 15 dias grátis, sem cartão de crédito.',
    url: 'https://estoquesystem.com.br',
    siteName: 'EstoqueSystem',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'EstoqueSystem — Sistema de Estoque para Mercadinhos',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EstoqueSystem — Controle de Estoque Simples',
    description:
      'Sistema de estoque, PDV, fiado e relatórios pra mercadinhos. 15 dias grátis.',
    images: ['/og-image.png'],
    creator: '@estoquesystem',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  verification: {
    google: 'krg-zQL0eyIxldgnTAzi1b_0B6TRl55JIwlFo-8Zaio',
  },
  category: 'business',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Google Analytics (GA4) */}
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=GT-PHPDXM6V"
          strategy="afterInteractive"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'GT-PHPDXM6V');
            `,
          }}
        />

        {/* Schema.org - SoftwareApplication (Google adora!) */}
        <Script
          id="schema-software"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'EstoqueSystem',
              description:
                'Sistema de gestão de estoque, PDV e controle de fiado para mercadinhos brasileiros.',
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web, iOS, Android',
              offers: {
                '@type': 'Offer',
                price: '39.90',
                priceCurrency: 'BRL',
                priceValidUntil: '2026-12-31',
                availability: 'https://schema.org/InStock',
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.9',
                ratingCount: '12',
              },
              creator: {
                '@type': 'Person',
                name: 'Lucas Machado',
              },
            }),
          }}
        />

        {/* Schema.org - Organização Local */}
        <Script
          id="schema-organization"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'EstoqueSystem',
              url: 'https://estoquesystem.com.br',
              logo: 'https://estoquesystem.com.br/og-image.png',
              description:
                'Sistema brasileiro de gestão para mercadinhos, mercearias e pequenos comércios.',
              founder: {
                '@type': 'Person',
                name: 'Lucas Machado',
              },
              address: {
                '@type': 'PostalAddress',
                addressLocality: 'Saquarema',
                addressRegion: 'RJ',
                addressCountry: 'BR',
              },
              contactPoint: {
                '@type': 'ContactPoint',
                telephone: '+55-22-99946-7499',
                contactType: 'customer service',
                areaServed: 'BR',
                availableLanguage: 'Portuguese',
              },
              sameAs: [
                'https://wa.me/5522999467499',
              ],
            }),
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <NotificationProvider>
            {children}
            <InstallPWABanner />
            <ToastContainer />
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}