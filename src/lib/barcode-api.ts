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

// Produto de retorno quando nenhuma API encontra o produto
const RESULTADO_VAZIO: ProdutoBarcode = {
  nome: '', marca: '', descricao: '',
  categoria: '', imagem_url: '',
  encontrado: false, fonte: '',
}

// ─── 1. Open Food Facts (Alimentos) ──────────────────────────────────────────
async function buscarOpenFoodFacts(codigo: string): Promise<ProdutoBarcode | null> {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${codigo}.json`, {
      signal: AbortSignal.timeout(6000)
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
      fonte: 'Open Food Facts'
    }
  } catch { return null }
}

// ─── 2. Open Beauty Facts (Cosméticos / Higiene) ─────────────────────────────
async function buscarOpenBeautyFacts(codigo: string): Promise<ProdutoBarcode | null> {
  try {
    const res = await fetch(`https://world.openbeautyfacts.org/api/v0/product/${codigo}.json`, {
      signal: AbortSignal.timeout(6000)
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
      fonte: 'Open Beauty Facts'
    }
  } catch { return null }
}

// ─── 3. Open Products Facts (Produtos de Consumo Geral) ⚠️ NOVO ⚠️ ───────────
async function buscarOpenProductsFacts(codigo: string): Promise<ProdutoBarcode | null> {
  try {
    const res = await fetch(`https://world.openproductsfacts.org/api/v0/product/${codigo}.json`, {
      signal: AbortSignal.timeout(6000)
    })
    const data = await res.json()
    if (data.status !== 1 || !data.product) return null

    const p = data.product
    const nome = p.product_name_pt || p.product_name || ''
    const marca = p.brands?.split(',')[0]?.trim() || ''
    const nomeCompleto = nome && marca ? `${nome} - ${marca}` : nome || marca

    if (!nomeCompleto) return null

    // Gera uma descrição enriquecida combinando vários campos da API
    const descricaoCompleta = [
      p.generic_name,
      p.quantity,
      p.categories,
      p.manufacturer
    ].filter(Boolean).join(' | ')

    return {
      nome: nomeCompleto,
      marca,
      descricao: descricaoCompleta || nomeCompleto,
      categoria: mapearCategoria(p.categories_tags?.[0] || p.categories || ''),
      imagem_url: p.image_front_small_url || p.image_front_url || p.image_url || '',
      encontrado: true,
      fonte: 'Open Products Facts'
    }
  } catch { return null }
}

// ─── 4. UPC Item DB (Base Gigante de Produtos) ⚠️ NOVO ⚠️ ────────────────────
async function buscarUPCItemDB(codigo: string): Promise<ProdutoBarcode | null> {
  try {
    const res = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${codigo}`, {
      signal: AbortSignal.timeout(5000),
      headers: { 'Accept': 'application/json' }
    })
    if (!res.ok) return null

    const data = await res.json()
    const item = data.items?.[0]
    if (!item) return null

    const nome = item.title || ''
    const marca = item.brand || ''
    const nomeCompleto = nome && marca && !nome.toLowerCase().includes(marca.toLowerCase())
      ? `${nome} - ${marca}` : nome || marca

    if (!nomeCompleto) return null

    // Gera uma descrição detalhada combinando múltiplos campos
    const descricaoDetalhada = [
      item.description,
      item.features?.join(', '),
      item.color,
      item.size,
      item.material
    ].filter(Boolean).join(' | ')

    return {
      nome: nomeCompleto,
      marca,
      descricao: descricaoDetalhada || nomeCompleto,
      categoria: mapearCategoria(item.category || ''),
      imagem_url: item.images?.[0] || '',
      encontrado: true,
      fonte: 'UPC Item DB'
    }
  } catch { return null }
}

// ─── Função Principal (Busca Paralela nas 4 Fontes) ──────────────────────────
export async function buscarProdutoPorBarcode(codigo: string): Promise<ProdutoBarcode> {
  const codigoLimpo = codigo.trim().replace(/\s/g, '')
  if (!codigoLimpo) return RESULTADO_VAZIO

  // Executa as 4 consultas em paralelo
  const [foodFacts, beautyFacts, productsFacts, upcDB] = await Promise.all([
    buscarOpenFoodFacts(codigoLimpo),
    buscarOpenBeautyFacts(codigoLimpo),
    buscarOpenProductsFacts(codigoLimpo),
    buscarUPCItemDB(codigoLimpo)
  ])

  // Prioridade: Alimentos > Beleza > Produtos Gerais > UPC Item DB
  const resultado = foodFacts || beautyFacts || productsFacts || upcDB

  if (resultado) return resultado

  return RESULTADO_VAZIO
}

// ─── Mapeamento de Categorias (Agora com Produtos de Consumo) ──────────────────
function mapearCategoria(tag: string): string {
  const t = tag.toLowerCase()

  // ===== ALIMENTOS E BEBIDAS =====
  if (t.match(/beverage|drink|agua|suco|refri|soda|juice|water|cerveja|vinho|whisky/))
    return 'Bebidas'
  if (t.match(/dairy|leite|queijo|iogurte|manteiga|cream|milk|cheese|yogurt/))
    return 'Laticínios'
  if (t.match(/meat|carne|frango|peixe|chicken|fish|beef|pork|bacon|sausage/))
    return 'Carnes'
  if (t.match(/bread|pao|biscoito|bolo|padaria|bakery|snack|cracker|torrada|pão/))
    return 'Padaria'
  if (t.match(/frozen|congelado|frio|cold cut|sorvete|ice cream|frozen food/))
    return 'Frios e Congelados'
  if (t.match(/fruit|vegeta|horta|salad|produce|legume|verdura|fruta/))
    return 'Hortifruti'
  if (t.match(/rice|bean|pasta|grain|arroz|feijão|macarrão|cereal|farinha|trigo/))
    return 'Grãos e Massas'
  if (t.match(/oil|oleo|vinegar|condiment|sauce|molho|tempero|azeite|ketchup/))
    return 'Condimentos e Molhos'
  if (t.match(/candy|chocolate|sweet|doce|balas|bombom|sugar/))
    return 'Doces'

  // ===== CUIDADOS PESSOAIS =====
  if (t.match(/hygiene|higiene|sabonete|shampoo|dental|desodorante|body|cosméticos/))
    return 'Higiene'

  // ===== LIMPEZA E UTILIDADES DOMÉSTICAS =====
  if (t.match(/clean|limpeza|detergente|sabão|alvejante|multiuso|amaciante|desinfetante/))
    return 'Limpeza'

  // ===== PRODUTOS DE CONSUMO GERAL (INSETICIDAS, PETSHOP, AUTOMOTIVO) =====
  if (t.match(/insecticide|pesticide|inseticida|repelente|mosquito|formicida/))
    return 'Controle de Pragas'
  if (t.match(/pet|dog|cat|cão|gato|animal|brinquedo pet|ração/))
    return 'Petshop'
  if (t.match(/automotive|auto|carro|veiculo|oleo motor|limpa contato/))
    return 'Automotivo'
  if (t.match(/tool|ferramenta|utilidade|martelo|chave|furadeira|parafuso/))
    return 'Ferramentas e Utilidades'
  if (t.match(/toy|brinquedo|boneca|boneco|jogo/))
    return 'Brinquedos'

  // ===== DEMAIS PRODUTOS =====
  if (t.match(/kitchen|cozinha|utensil|panela|prato|talher|facas/))
    return 'Cozinha e Utensílios'
  if (t.match(/office|escritorio|papel|caderno|caneta|lapis|material escolar/))
    return 'Papelaria'

  return 'Outros'
}