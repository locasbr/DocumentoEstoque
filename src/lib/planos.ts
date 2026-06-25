// src/lib/planos.ts
// Centralized: nome, preço e features de cada plano
// Usa em TODO lugar que precisa exibir info do plano

export type TipoPlano = 'iniciante' | 'profissional' | 'negocio'

export interface InfoPlano {
  nome: string
  preco: number
  precoFormatado: string
  cor: 'gray' | 'green' | 'purple'
  descricao: string
  emoji: string
}

export const PLANOS_INFO: Record<TipoPlano, InfoPlano> = {
  iniciante: {
    nome: 'Iniciante',
    preco: 39.9,
    precoFormatado: 'R$ 39,90/mês',
    cor: 'gray',
    descricao: 'Pra quem tá começando',
    emoji: '⚡',
  },
  profissional: {
    nome: 'Profissional',
    preco: 79.9,
    precoFormatado: 'R$ 79,90/mês',
    cor: 'green',
    descricao: 'Pro mercadinho que cresce',
    emoji: '✨',
  },
  negocio: {
    nome: 'Negócio',
    preco: 149.9,
    precoFormatado: 'R$ 149,90/mês',
    cor: 'purple',
    descricao: 'Pro mercadinho consolidado',
    emoji: '👑',
  },
}

/**
 * Helper pra pegar info do plano com fallback seguro
 */
export function getPlanoInfo(tipoPlano: string | null | undefined): InfoPlano {
  if (tipoPlano && tipoPlano in PLANOS_INFO) {
    return PLANOS_INFO[tipoPlano as TipoPlano]
  }
  // Fallback: assume Profissional (mais comum)
  return PLANOS_INFO.profissional
}