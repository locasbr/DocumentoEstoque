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

const RESULTADO_VAZIO: ProdutoBarcode = {
  nome: '', marca: '', descricao: '',
  categoria: '', imagem_url: '',
  encontrado: false, fonte: '',
}

// ─── 1. Open Food Facts (alimentos, produtos brasileiros) ──────────────────
async function buscarOpenFoodFacts(codigo: string): Promise<ProdutoBarcode | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${codigo}.json`,
      { signal: AbortSignal.timeout(6000) }
    )
    const data = await res.json()
    if (data.status !== 1 || !data.product) return null

    const p = data.product
    const nome = p.product_name_pt || p.product_name_pt_BR || p.product_name_br ||
                 p.product_name_es || p.product_name ||
                 p.abbreviated_product_name || p.generic_name_pt || ''
    const marca = p.brands?.split(',')[0]?.trim() || ''
    const nomeCompleto = nome && marca && !nome.toLowerCase().includes(marca.toLowerCase())
      ? `${nome} - ${marca}` : nome || marca

    if (!nomeCompleto) return null

    return {
      nome: nomeCompleto,
      marca,
      descricao: p.generic_name_pt || p.generic_name || p.ingredients_text_pt || '',
      categoria: mapearCategoria(p.categories_tags?.[0] || p.categories || ''),
      imagem_url: p.image_front_small_url || p.image_front_url || p.image_small_url || '',
      encontrado: true,
      fonte: 'Open Food Facts',
    }
  } catch { return null }
}

// ─── 2. UPC Item DB (base gratuita, 100 consultas/dia) ─────────────────────
async function buscarUPCItemDB(codigo: string): Promise<ProdutoBarcode | null> {
  try {
    const res = await fetch(
      `https://api.upcitemdb.com/prod/trial/lookup?upc=${codigo}`,
      {
        signal: AbortSignal.timeout(5000),
        headers: { 'Accept': 'application/json' }
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    const item = data.items?.[0]
    if (!item) return null

    const nome = item.title || ''
    const marca = item.brand || ''
    const nomeCompleto = nome && marca && !nome.toLowerCase().includes(marca.toLowerCase())
      ? `${nome} - ${marca}` : nome || marca

    if (!nomeCompleto) return null

    return {
      nome: nomeCompleto,
      marca,
      descricao: item.description || '',
      categoria: mapearCategoria(item.category || ''),
      imagem_url: item.images?.[0] || '',
      encontrado: true,
      fonte: 'UPC Item DB',
    }
  } catch { return null }
}

// ─── 3. Open Beauty Facts (cosméticos, higiene) ────────────────────────────
async function buscarOpenBeautyFacts(codigo: string): Promise<ProdutoBarcode | null> {
  try {
    const res = await fetch(
      `https://world.openbeautyfacts.org/api/v0/product/${codigo}.json`,
      { signal: AbortSignal.timeout(4000) }
    )
    const data = await res.json()
    if (data.status !== 1 || !data.product) return null

    const p = data.product
    const nome = p.product_name_pt || p.product_name || ''
    const marca = p.brands?.split(',')[0]?.trim() || ''
    const nomeCompleto = nome && marca ? `${nome} - ${marca}` : nome || marca

    if (!nomeCompleto) return null

    return {
      nome: nomeCompleto,
      marca,
      descricao: p.generic_name || '',
      categoria: 'Higiene',
      imagem_url: p.image_front_small_url || p.image_url || '',
      encontrado: true,
      fonte: 'Open Beauty Facts',
    }
  } catch { return null }
}

// ─── 4. Fallback genérico (Open Products / UPC Database) ───────────────────
async function buscarOpenProducts(codigo: string): Promise<ProdutoBarcode | null> {
  try {
    const res = await fetch(
      `https://api.upcitemdb.com/prod/trial/lookup?upc=${codigo}&lang=pt`,
      { signal: AbortSignal.timeout(4000) }
    )
    if (!res.ok) return null
    const data = await res.json()
    const item = data.items?.[0]
    if (!item?.title) return null

    return {
      nome: item.title,
      marca: item.brand || '',
      descricao: item.description || '',
      categoria: mapearCategoria(item.category || ''),
      imagem_url: item.images?.[0] || '',
      encontrado: true,
      fonte: 'UPC Database',
    }
  } catch { return null }
}

// ─── Função principal — busca em paralelo nas principais fontes ─────────────
export async function buscarProdutoPorBarcode(codigo: string): Promise<ProdutoBarcode> {
  const codigoLimpo = codigo.trim().replace(/\s/g, '')
  if (!codigoLimpo) return RESULTADO_VAZIO

  // Executa as 3 principais consultas em paralelo
  const [foodFacts, upcDB, beautyFacts] = await Promise.all([
    buscarOpenFoodFacts(codigoLimpo),
    buscarUPCItemDB(codigoLimpo),
    buscarOpenBeautyFacts(codigoLimpo),
  ])

  // Retorna o primeiro resultado encontrado (prioridade: food > upc > beauty)
  const resultado = foodFacts || upcDB || beautyFacts
  if (resultado) return resultado

  // Última tentativa com fallback genérico
  const fallback = await buscarOpenProducts(codigoLimpo)
  if (fallback) return fallback

  return RESULTADO_VAZIO
}

// ─── Mapeamento de categorias (expandido) ───────────────────────────────────
function mapearCategoria(tag: string): string {
  const t = tag.toLowerCase()
  if (t.match(/beverage|drink|agua|suco|refri|soda|juice|water|cerveja|vinho/)) return 'Bebidas'
  if (t.match(/dairy|leite|queijo|iogurte|manteiga|cream|milk|cheese/)) return 'Laticínios'
  if (t.match(/meat|carne|frango|peixe|chicken|fish|beef|pork|bacon/)) return 'Carnes'
  if (t.match(/clean|limpeza|detergente|sabão|alvejante|multiuso|amaciante/)) return 'Limpeza'
  if (t.match(/hygiene|higiene|sabonete|shampoo|dental|desodorante|body|cosméticos/)) return 'Higiene'
  if (t.match(/bread|pao|biscoito|bolo|padaria|bakery|snack|cracker|torrada/)) return 'Padaria'
  if (t.match(/frozen|congelado|frio|cold cut|sorvete/)) return 'Frios/Congelados'
  if (t.match(/fruit|vegeta|horta|salad|produce|legume|verdura/)) return 'Hortifruti'
  if (t.match(/rice|bean|pasta|grain|arroz|feijão|macarrão|cereal|farinha/)) return 'Grãos & Massas'
  if (t.match(/oil|azeite|oleo|vinegar|condiment|sauce|molho|tempero/)) return 'Condimentos'
  if (t.match(/candy|chocolate|sweet|doce|balas|bombom/)) return 'Doces'
  return 'Alimentos'
}