// src/lib/barcode-api.ts

export interface ProdutoBarcode {
  nome: string
  marca: string
  descricao: string
  categoria: string
  imagem_url: string
  encontrado: boolean
  fonte: string
}

export async function buscarProdutoPorBarcode(codigo: string): Promise<ProdutoBarcode> {
  // Tenta Open Food Facts — melhor base para produtos brasileiros
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${codigo}.json`,
      { signal: AbortSignal.timeout(5000) }
    )
    const data = await res.json()

    if (data.status === 1 && data.product) {
      const p = data.product
      const nome = p.product_name_pt || p.product_name_br || p.product_name || ''
      const marca = p.brands || ''
      const nomeCompleto = marca && nome ? `${nome} - ${marca}` : nome || marca

      if (nomeCompleto) {
        return {
          nome: nomeCompleto,
          marca,
          descricao: p.generic_name_pt || p.generic_name || '',
          categoria: mapearCategoria(p.categories_tags?.[0] || ''),
          imagem_url: p.image_front_small_url || p.image_url || '',
          encontrado: true,
          fonte: 'Open Food Facts',
        }
      }
    }
  } catch (e) {
    console.warn('Open Food Facts falhou:', e)
  }

  // Tenta Open Beauty Facts (cosméticos/higiene)
  try {
    const res = await fetch(
      `https://world.openbeautyfacts.org/api/v0/product/${codigo}.json`,
      { signal: AbortSignal.timeout(3000) }
    )
    const data = await res.json()

    if (data.status === 1 && data.product) {
      const p = data.product
      const nome = p.product_name_pt || p.product_name || ''
      const marca = p.brands || ''
      const nomeCompleto = marca && nome ? `${nome} - ${marca}` : nome || marca

      if (nomeCompleto) {
        return {
          nome: nomeCompleto,
          marca,
          descricao: p.generic_name || '',
          categoria: 'Higiene',
          imagem_url: p.image_url || '',
          encontrado: true,
          fonte: 'Open Beauty Facts',
        }
      }
    }
  } catch (e) {
    console.warn('Open Beauty Facts falhou:', e)
  }

  return {
    nome: '',
    marca: '',
    descricao: '',
    categoria: '',
    imagem_url: '',
    encontrado: false,
    fonte: '',
  }
}

function mapearCategoria(tag: string): string {
  const t = tag.toLowerCase()
  if (t.includes('beverage') || t.includes('drink') || t.includes('agua') || t.includes('suco') || t.includes('refrigerante')) return 'Bebidas'
  if (t.includes('dairy') || t.includes('leite') || t.includes('queijo') || t.includes('iogurte')) return 'Laticínios'
  if (t.includes('meat') || t.includes('carne') || t.includes('frango') || t.includes('peixe')) return 'Carnes'
  if (t.includes('cleaning') || t.includes('limpeza') || t.includes('detergente')) return 'Limpeza'
  if (t.includes('hygiene') || t.includes('higiene') || t.includes('sabonete') || t.includes('shampoo')) return 'Higiene'
  if (t.includes('bread') || t.includes('pao') || t.includes('biscoito') || t.includes('padaria')) return 'Padaria'
  if (t.includes('frozen') || t.includes('congelado') || t.includes('frio')) return 'Frios'
  if (t.includes('fruit') || t.includes('vegeta') || t.includes('horta')) return 'Hortifruti'
  return 'Alimentos'
}
