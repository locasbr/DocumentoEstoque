// src/lib/barcode-api.ts

export interface ProdutoBarcode {
  nome: string;
  marca: string;
  descricao: string;
  categoria: string;
  encontrado: boolean;
  fonte: string;
}

type CategoriaProduto =
  | "Alimentos"
  | "Bebidas"
  | "Limpeza"
  | "Higiene"
  | "Eletrônicos"
  | "Utilidades"
  | "Outros";

interface ProdutoFacts {
  product_name_pt?: string;
  product_name_pt_BR?: string;
  product_name_br?: string;
  product_name_es?: string;
  product_name?: string;
  abbreviated_product_name?: string;
  generic_name_pt?: string;
  generic_name?: string;
  ingredients_text_pt?: string;
  brands?: string;
  categories_tags?: string[];
  categories?: string;
  quantity?: string;
  manufacturer?: string;
}

interface RespostaFacts {
  status?: number;
  product?: ProdutoFacts;
}

const RESULTADO_VAZIO: ProdutoBarcode = {
  nome: "",
  marca: "",
  descricao: "",
  categoria: "",
  encontrado: false,
  fonte: "",
};

const TIMEOUT_MS = 6000;

function primeiroTexto(...valores: Array<unknown>): string {
  for (const valor of valores) {
    if (typeof valor === "string" && valor.trim()) {
      return valor.trim();
    }
  }

  return "";
}

function primeiraMarca(marcas?: string): string {
  if (!marcas) return "";

  return marcas
    .split(",")
    .map((marca) => marca.trim())
    .find(Boolean) ?? "";
}

function limitarTexto(texto: string, limite = 500): string {
  const normalizado = texto.replace(/\s+/g, " ").trim();

  if (normalizado.length <= limite) {
    return normalizado;
  }

  return `${normalizado.slice(0, limite - 1).trim()}…`;
}

async function consultarFacts(
  url: string,
): Promise<RespostaFacts | null> {
  try {
    const resposta = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        Accept: "application/json",
      },
    });

    if (!resposta.ok) {
      return null;
    }

    const dados = (await resposta.json()) as RespostaFacts;

    if (dados.status !== 1 || !dados.product) {
      return null;
    }

    return dados;
  } catch {
    return null;
  }
}

function criarResultado(
  produto: ProdutoFacts,
  fonte: string,
  categoriaFixa?: CategoriaProduto,
): ProdutoBarcode | null {
  const nome = primeiroTexto(
    produto.product_name_pt,
    produto.product_name_pt_BR,
    produto.product_name_br,
    produto.product_name_es,
    produto.product_name,
    produto.abbreviated_product_name,
    produto.generic_name_pt,
    produto.generic_name,
  );

  const marca = primeiraMarca(produto.brands);

  if (!nome && !marca) {
    return null;
  }

  const descricao = primeiroTexto(
    produto.generic_name_pt,
    produto.generic_name,
    produto.ingredients_text_pt,
  );

  const categoriaOriginal =
    produto.categories_tags?.[0] ||
    produto.categories ||
    "";

  return {
    nome: nome || marca,
    marca,
    descricao: limitarTexto(descricao),
    categoria:
      categoriaFixa || mapearCategoria(categoriaOriginal),
    encontrado: true,
    fonte,
  };
}

// Open Food Facts: alimentos e bebidas
async function buscarOpenFoodFacts(
  codigo: string,
): Promise<ProdutoBarcode | null> {
  const dados = await consultarFacts(
    `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(
      codigo,
    )}.json`,
  );

  if (!dados?.product) {
    return null;
  }

  return criarResultado(
    dados.product,
    "Open Food Facts",
  );
}

// Open Beauty Facts: cosméticos e higiene
async function buscarOpenBeautyFacts(
  codigo: string,
): Promise<ProdutoBarcode | null> {
  const dados = await consultarFacts(
    `https://world.openbeautyfacts.org/api/v0/product/${encodeURIComponent(
      codigo,
    )}.json`,
  );

  if (!dados?.product) {
    return null;
  }

  return criarResultado(
    dados.product,
    "Open Beauty Facts",
    "Higiene",
  );
}

// Open Products Facts: produtos de consumo geral
async function buscarOpenProductsFacts(
  codigo: string,
): Promise<ProdutoBarcode | null> {
  const dados = await consultarFacts(
    `https://world.openproductsfacts.org/api/v0/product/${encodeURIComponent(
      codigo,
    )}.json`,
  );

  if (!dados?.product) {
    return null;
  }

  const resultado = criarResultado(
    dados.product,
    "Open Products Facts",
  );

  if (!resultado) {
    return null;
  }

  const descricaoCompleta = [
    dados.product.generic_name,
    dados.product.quantity,
    dados.product.categories,
    dados.product.manufacturer,
  ]
    .filter(
      (valor): valor is string =>
        typeof valor === "string" &&
        Boolean(valor.trim()),
    )
    .map((valor) => valor.trim())
    .join(" | ");

  return {
    ...resultado,
    descricao: limitarTexto(
      descricaoCompleta || resultado.descricao,
    ),
  };
}

// Busca nas três fontes gratuitas em paralelo
export async function buscarProdutoPorBarcode(
  codigo: string,
): Promise<ProdutoBarcode> {
  const codigoLimpo = codigo
    .trim()
    .replace(/\s+/g, "");

  if (!codigoLimpo) {
    return { ...RESULTADO_VAZIO };
  }

  const resultados = await Promise.allSettled([
    buscarOpenFoodFacts(codigoLimpo),
    buscarOpenBeautyFacts(codigoLimpo),
    buscarOpenProductsFacts(codigoLimpo),
  ]);

  for (const resultado of resultados) {
    if (
      resultado.status === "fulfilled" &&
      resultado.value?.encontrado
    ) {
      return resultado.value;
    }
  }

  return {
    ...RESULTADO_VAZIO,
  };
}

function mapearCategoria(
  categoriaOriginal: string,
): CategoriaProduto {
  const categoria = categoriaOriginal
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");

  if (
    /beverage|drink|agua|suco|refri|refrigerante|soda|juice|water|cerveja|vinho/.test(
      categoria,
    )
  ) {
    return "Bebidas";
  }

  if (
    /clean|limpeza|detergente|sabao|alvejante|multiuso|amaciante|insecticide|pesticide|inseticida|repelente/.test(
      categoria,
    )
  ) {
    return "Limpeza";
  }

  if (
    /hygiene|higiene|sabonete|shampoo|dental|desodorante|body|beauty|cosmetic/.test(
      categoria,
    )
  ) {
    return "Higiene";
  }

  if (
    /electronic|eletronico|eletrica|electric|bateria|battery|charger|carregador/.test(
      categoria,
    )
  ) {
    return "Eletrônicos";
  }

  if (
    /tool|ferramenta|utilidade|utensil|household|kitchen|cozinha/.test(
      categoria,
    )
  ) {
    return "Utilidades";
  }

  if (
    /food|alimento|dairy|leite|queijo|iogurte|manteiga|cream|milk|cheese|meat|carne|frango|peixe|chicken|fish|beef|pork|bacon|bread|pao|biscoito|bolo|padaria|bakery|snack|cracker|frozen|congelado|frio|cold cut|sorvete|fruit|vegeta|horta|salad|produce|legume|verdura|rice|bean|pasta|grain|arroz|feijao|macarrao|cereal|oil|oleo|vinegar|condiment|sauce|molho|tempero|candy|chocolate|sweet|doce|bala/.test(
      categoria,
    )
  ) {
    return "Alimentos";
  }

  return "Outros";
}