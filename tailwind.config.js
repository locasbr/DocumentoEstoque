import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // 🛡️ SAFELIST: classes geradas dinamicamente que o Tailwind não detecta no scan
  safelist: [
    // ──────────────────────────────────────────────
    // BACKGROUNDS dinâmicos (light + dark)
    // ──────────────────────────────────────────────
    'bg-blue-100',
    'bg-green-100',
    'bg-purple-100',
    'bg-pink-100',
    'bg-orange-100',
    'bg-amber-100',
    'bg-yellow-100',
    'dark:bg-blue-900/30',
    'dark:bg-green-900/30',
    'dark:bg-purple-900/30',
    'dark:bg-pink-900/30',
    'dark:bg-orange-900/30',
    'dark:bg-amber-900/30',
    'dark:bg-yellow-900/30',

    // ──────────────────────────────────────────────
    // TEXTOS dinâmicos
    // ──────────────────────────────────────────────
    'text-blue-600',
    'text-green-600',
    'text-purple-600',
    'text-pink-600',
    'text-orange-600',
    'text-amber-600',
    'text-yellow-600',
    'dark:text-blue-400',
    'dark:text-green-400',
    'dark:text-purple-400',
    'dark:text-pink-400',
    'dark:text-orange-400',
    'dark:text-amber-400',
    'dark:text-yellow-400',

    // ──────────────────────────────────────────────
    // 🆕 BORDAS dinâmicas (CRÍTICO pro SugestaoPrecoIA)
    // ──────────────────────────────────────────────
    'border-blue-500',
    'border-green-500',
    'border-purple-500',
    'border-pink-500',
    'border-orange-500',
    'border-amber-500',

    // ──────────────────────────────────────────────
    // GRADIENTES (landing + botões dinâmicos)
    // ──────────────────────────────────────────────
    'from-blue-500',
    'from-green-500',
    'from-emerald-500',
    'from-purple-500',
    'from-pink-500',
    'from-orange-500',
    'from-amber-500',
    'to-blue-600',
    'to-green-600',
    'to-emerald-600',
    'to-purple-600',
    'to-pink-600',
    'to-orange-600',
    'to-amber-600',

    // ──────────────────────────────────────────────
    // 🆕 SHADOWS coloridas (botões com glow)
    // ──────────────────────────────────────────────
    'shadow-blue-500/30',
    'shadow-green-500/30',
    'shadow-emerald-500/30',
    'shadow-purple-500/30',
    'shadow-pink-500/30',
    'shadow-orange-500/30',
    'shadow-amber-500/30',
    'hover:shadow-blue-500/40',
    'hover:shadow-green-500/40',
    'hover:shadow-purple-500/40',
    'hover:shadow-pink-500/40',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#10b981',
        secondary: '#3b82f6',
        danger: '#ef4444',
        warning: '#f59e0b',
      },
    },
  },
  plugins: [],
}

export default config