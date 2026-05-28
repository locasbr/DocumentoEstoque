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

// ─── Open Food Facts (alimentos) ──────────────────────────────────────────
async function buscarOpenFoodFacts(codigo: string): Promise<ProdutoBarcode | null> {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${codigo}.json`, {
      signal: AbortSignal.timeout(6000),
    })
    const data = await res.json()
    if (data.status !== 1 || !data.product) return null

    const p = data.product
    const nome = p.product_name_pt || p.product_name_pt_BR || p.product_name_br ||
                 p.product_name_es || p.product_name || p.abbreviated_product_name ||
                 p.generic_name_pt || ''
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
  } catch {
    return null
  }
}

// ─── Open Beauty Facts (cosméticos / higiene) ─────────────────────────────
async function buscarOpenBeautyFacts(codigo: string): Promise<ProdutoBarcode | null> {
  try {
    const res = await fetch(`https://world.openbeautyfacts.org/api/v0/product/${codigo}.json`, {
      signal: AbortSignal.timeout(6000),
    })
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
      descricao: p.generic_name || p.ingredients_text_pt || '',
      categoria: 'Higiene',
      imagem_url: p.image_front_small_url || p.image_url || '',
      encontrado: true,
      fonte: 'Open Beauty Facts',
    }
  } catch {
    return null
  }
}

// ─── Open Products Facts (produtos de consumo geral: limpeza, inseticidas etc.) ──
async function buscarOpenProductsFacts(codigo: string): Promise<ProdutoBarcode | null> {
  try {
    const res = await fetch(`https://world.openproductsfacts.org/api/v0/product/${codigo}.json`, {
      signal: AbortSignal.timeout(6000),
    })
    const data = await res.json()
    if (data.status !== 1 || !data.product) return null

    const p = data.product
    const nome = p.product_name_pt || p.product_name || ''
    const marca = p.brands?.split(',')[0]?.trim() || ''
    const nomeCompleto = nome && marca ? `${nome} - ${marca}` : nome || marca

    if (!nomeCompleto) return null

    const descricaoCompleta = [
      p.generic_name,
      p.quantity,
      p.categories,
      p.manufacturer,
    ].filter(Boolean).join(' | ')

    return {
      nome: nomeCompleto,
      marca,
      descricao: descricaoCompleta || nomeCompleto,
      categoria: mapearCategoria(p.categories_tags?.[0] || p.categories || ''),
      imagem_url: p.image_front_small_url || p.image_front_url || p.image_url || '',
      encontrado: true,
      fonte: 'Open Products Facts',
    }
  } catch {
    return null
  }
}

// ─── Função principal (busca em paralelo nas 3 fontes gratuitas) ───────────
export async function buscarProdutoPorBarcode(codigo: string): Promise<ProdutoBarcode> {
  const codigoLimpo = codigo.trim().replace(/\s/g, '')
  if (!codigoLimpo) return RESULTADO_VAZIO

  const [foodFacts, beautyFacts, productsFacts] = await Promise.all([
    buscarOpenFoodFacts(codigoLimpo),
    buscarOpenBeautyFacts(codigoLimpo),
    buscarOpenProductsFacts(codigoLimpo),
  ])

  const resultado = foodFacts || beautyFacts || productsFacts
  return resultado || RESULTADO_VAZIO
}

// ─── Mapeamento de categorias (expansivo) ──────────────────────────────────
function mapearCategoria(tag: string): string {
  const t = tag.toLowerCase()
  if (t.match(/beverage|drink|agua|suco|refri|soda|juice|water|cerveja|vinho/))
    return 'Bebidas'
  if (t.match(/dairy|leite|queijo|iogurte|manteiga|cream|milk|cheese/))
    return 'Laticínios'
  if (t.match(/meat|carne|frango|peixe|chicken|fish|beef|pork|bacon/))
    return 'Carnes'
  if (t.match(/clean|limpeza|detergente|sabão|alvejante|multiuso|amaciante/))
    return 'Limpeza'
  if (t.match(/hygiene|higiene|sabonete|shampoo|dental|desodorante|body/))
    return 'Higiene'
  if (t.match(/bread|pao|biscoito|bolo|padaria|bakery|snack|cracker/))
    return 'Padaria'
  if (t.match(/frozen|congelado|frio|cold cut|sorvete/))
    return 'Frios/Congelados'
  if (t.match(/fruit|vegeta|horta|salad|produce|legume|verdura/))
    return 'Hortifruti'
  if (t.match(/rice|bean|pasta|grain|arroz|feijão|macarrão|cereal/))
    return 'Grãos & Massas'
  if (t.match(/oil|oleo|vinegar|condiment|sauce|molho|tempero/))
    return 'Condimentos'
  if (t.match(/candy|chocolate|sweet|doce|balas/))
    return 'Doces'
  if (t.match(/insecticide|pesticide|inseticida|repelente/))
    return 'Controle de Pragas'
  if (t.match(/pet|dog|cat|rão/))
    return 'Petshop'
  if (t.match(/automotive|auto|carro|veiculo/))
    return 'Automotivo'
  if (t.match(/tool|ferramenta|utilidade/))
    return 'Ferramentas'
  if (t.match(/toy|brinquedo/))
    return 'Brinquedos'
  return 'Outros'
}