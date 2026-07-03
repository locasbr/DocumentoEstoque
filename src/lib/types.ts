export interface Produto {
  id: string;
  nome: string;
  descricao?: string;
  marca?: string;
  sku: string;
  quantidade_atual: number;
  quantidade_minima: number;
  preco_custo: number;
  preco_venda: number;
  categoria: string;
  ativo: boolean;
  imagem_url?: string;
  criado_em: string;
  atualizado_em: string;
  data_validade?: string | null
}

export interface MovimentoEstoque {
  id: string;
  produto_id: string;
  tipo_movimento: 'entrada' | 'saida';
  quantidade: number;
  motivo?: string;
  usuario_id: string;
  criado_em: string;
  produto?: Produto;
}

export interface Alerta {
  id: string;
  produto_id: string;
  tipo_alerta: 'estoque_baixo' | 'estoque_critico';
  visualizado: boolean;
  criado_em: string;
  produto?: Produto;
}

export interface Usuario {
  id: string;
  email: string;
  nome_completo?: string;
  criado_em: string;
  atualizado_em: string;
}
export interface Membro {
  id: string
  dono_id: string
  user_id: string
  email: string
  nivel: 'dono' | 'funcionario'
  status: 'pendente' | 'ativo' | 'inativo'
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
    tipo: 'debito' | 'pagamento'
    valor: number
    descricao: string
    criado_em: string
  }