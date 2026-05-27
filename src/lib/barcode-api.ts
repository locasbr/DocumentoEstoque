export interface ProdutoEncontrado {
  nome: string
  descricao: string
  categoria: string
  imagem_url: string
  encontrado: boolean
  fonte?: string
}

export async function buscarProdutoPorBarcode(codigo: string): Promise<ProdutoEncontrado> {
  // Tenta Open Food Facts (melhor para alimentos)
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${codigo}.json`,
      { signal: AbortSignal.timeout(5000) }
    )
    const data = await res.json()

    if (data.status === 1 && data.product) {
      const p = data.product
      return {
        nome: p.product_name_pt || p.product_name || '',
        descricao: p.generic_name_pt || p.generic_name || '',
        categoria: p.categories_tags?.[0]?.replace('en:', '') || '',
        imagem_url: p.image_url || '',
        encontrado: true,
        fonte: 'Open Food Facts'
      }
    }
  } catch (e) {
    console.debug('Open Food Facts não respondeu:', e)
  }

  // Tenta Cosmos (produtos brasileiros)
  try {
    const res = await fetch(
      `https://api.cosmos.bluesoft.com.br/gtins/${codigo}`,
      {
        headers: { 'X-Cosmos-Token': 'SEM_TOKEN' },
        signal: AbortSignal.timeout(5000)
      }
    )
    if (res.ok) {
      const data = await res.json()
      return {
        nome: data.description || '',
        descricao: data.commercial_brand || '',
        categoria: data.gtins?.[0]?.brand?.name || '',
        imagem_url: data.thumbnail || '',
        encontrado: true,
        fonte: 'Cosmos'
      }
    }
  } catch (e) {
    console.debug('Cosmos não respondeu:', e)
  }

  return { 
    nome: '', 
    descricao: '', 
    categoria: '', 
    imagem_url: '', 
    encontrado: false 
  }
}
