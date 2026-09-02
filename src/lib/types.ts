export type TipoMovimentoEstoque = 'entrada' | 'saida'

export type MotivoEntradaEstoque =
  | 'Compra de fornecedor'
  | 'Devolução de cliente'
  | 'Estoque inicial'
  | 'Ajuste de inventário'
  | 'Brinde ou doação'
  | 'Outra entrada'

export type MotivoSaidaEstoque =
  | 'Venda'
  | 'Perda'
  | 'Produto vencido'
  | 'Avaria'
  | 'Consumo interno'
  | 'Devolução ao fornecedor'
  | 'Ajuste de inventário'
  | 'Outra saída'

export type MotivoMovimentoEstoque =
  | MotivoEntradaEstoque
  | MotivoSaidaEstoque

export type TipoAlertaEstoque =
  | 'estoque_baixo'
  | 'estoque_critico'

export type NivelMembro = 'dono' | 'funcionario'

export type StatusMembro =
  | 'pendente'
  | 'ativo'
  | 'inativo'

export type TipoFiado = 'debito' | 'pagamento'

export interface Produto {
  id: string
  nome: string
  descricao?: string | null
  marca?: string | null
  sku: string
  quantidade_atual: number
  quantidade_minima: number
  preco_custo: number
  preco_venda: number
  categoria: string
  ativo: boolean
  criado_em: string
  atualizado_em: string
  data_validade?: string | null
}

/**
 * Representa o formato atual da tabela movimentos_estoque.
 *
 * O campo motivo ainda é string porque o banco atual não possui
 * uma coluna separada para categoria estruturada e observação.
 *
 * Formato temporário utilizado nas novas movimentações:
 *
 * "Perda"
 * "Produto vencido"
 * "Perda | Embalagem danificada"
 *
 * Futuramente, a tabela poderá receber colunas próprias para:
 * - motivo_movimento
 * - observacao
 * - custo_unitario
 * - preco_unitario
 */
export interface MovimentoEstoque {
  id: string
  produto_id: string
  tipo_movimento: TipoMovimentoEstoque
  quantidade: number
  motivo?: string | null
  usuario_id: string
  criado_em: string
  produto?: Produto | null
}

/**
 * Tipo usado quando a consulta do Supabase retorna a relação
 * do produto com o alias:
 *
 * produto:produto_id(*)
 */
export interface MovimentoEstoqueComProduto
  extends MovimentoEstoque {
  produto?: Produto | null
}

export interface Alerta {
  id: string
  produto_id: string
  usuario_id?: string
  tipo_alerta: TipoAlertaEstoque
  visualizado: boolean
  criado_em: string
  produto?: Produto | null
}

export interface Usuario {
  id: string
  email: string
  nome_completo?: string | null
  criado_em: string
  atualizado_em: string
}

export interface Membro {
  id: string
  dono_id: string
  user_id: string
  email: string
  nivel: NivelMembro
  status: StatusMembro
  created_at: string
}

export interface Cliente {
  id: string
  usuario_id: string
  nome: string
  telefone: string
  cpf: string
  email: string
  endereco: string
  notas: string
  criado_em: string
  atualizado_em: string
}

export interface FiadoRegistro {
  id: string
  cliente_id: string
  usuario_id: string
  tipo: TipoFiado
  valor: number
  descricao: string
  criado_em: string
}

/**
 * Extrai a categoria estruturada do campo motivo atual.
 *
 * Exemplos:
 * "Perda" -> "Perda"
 * "Perda | Embalagem quebrada" -> "Perda"
 */
export function extrairMotivoMovimento(
  motivo?: string | null
): string {
  if (!motivo?.trim()) {
    return 'Não classificada'
  }

  return motivo.split('|')[0]?.trim() || 'Não classificada'
}

/**
 * Extrai a observação anexada ao campo motivo atual.
 *
 * Exemplos:
 * "Perda | Embalagem quebrada" -> "Embalagem quebrada"
 * "Perda" -> null
 */
export function extrairObservacaoMovimento(
  motivo?: string | null
): string | null {
  if (!motivo?.includes('|')) {
    return null
  }

  const partes = motivo.split('|')
  const observacao = partes.slice(1).join('|').trim()

  return observacao || null
}

/**
 * Verifica se uma movimentação representa uma perda operacional.
 *
 * Por enquanto, a classificação é extraída do campo motivo atual.
 */
export function movimentoRepresentaPerda(
  movimento: Pick<MovimentoEstoque, 'tipo_movimento' | 'motivo'>
): boolean {
  if (movimento.tipo_movimento !== 'saida') {
    return false
  }

  const motivo = extrairMotivoMovimento(movimento.motivo)

  return (
    motivo === 'Perda' ||
    motivo === 'Produto vencido' ||
    motivo === 'Avaria'
  )
}

/**
 * Verifica se a movimentação está explicitamente classificada
 * como venda.
 *
 * Uma saída sem motivo ou com outro motivo não é considerada venda.
 */
export function movimentoRepresentaVenda(
  movimento: Pick<MovimentoEstoque, 'tipo_movimento' | 'motivo'>
): boolean {
  return (
    movimento.tipo_movimento === 'saida' &&
    extrairMotivoMovimento(movimento.motivo) === 'Venda'
  )
}