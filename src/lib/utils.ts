export const formatarMoeda = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor)
}

export const formatarData = (data: string): string => {
  const date = new Date(data)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const formatarDataCurta = (data: string): string => {
  const date = new Date(data)
  return date.toLocaleDateString('pt-BR')
}

export const calcularLucro = (precoVenda: number, precoCusto: number): number => {
  return precoVenda - precoCusto
}

export const calcularMargemLucro = (precoVenda: number, precoCusto: number): number => {
  if (precoCusto === 0) return 0
  return ((precoVenda - precoCusto) / precoVenda) * 100
}
