import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/api/',
          '/auth/',
          '/login',
          '/reset-password',
        ],
      },
    ],
    sitemap: 'https://estoquesystem.com.br/sitemap.xml',
  }
}