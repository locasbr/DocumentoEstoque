# Instruções Supabase - Setup Completo

## 1. Criação de Tabelas e Índices

Execute o seguinte SQL no SQL Editor do Supabase:

```sql
-- Criar tabela de produtos
CREATE TABLE IF NOT EXISTS produtos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  sku VARCHAR(100) NOT NULL UNIQUE,
  quantidade_atual INTEGER NOT NULL DEFAULT 0,
  quantidade_minima INTEGER NOT NULL DEFAULT 10,
  preco_custo DECIMAL(10, 2) NOT NULL DEFAULT 0,
  preco_venda DECIMAL(10, 2) NOT NULL,
  categoria VARCHAR(100),
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW(),
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Criar tabela de movimentos de estoque
CREATE TABLE IF NOT EXISTS movimentos_estoque (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  tipo_movimento VARCHAR(20) NOT NULL CHECK (tipo_movimento IN ('entrada', 'saida')),
  quantidade INTEGER NOT NULL,
  motivo TEXT,
  usuario_id UUID NOT NULL REFERENCES auth.users(id),
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Criar tabela de alertas
CREATE TABLE IF NOT EXISTS alertas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  tipo_alerta VARCHAR(20) NOT NULL CHECK (tipo_alerta IN ('estoque_baixo', 'estoque_critico')),
  visualizado BOOLEAN DEFAULT false,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Criar índices
CREATE INDEX idx_produtos_usuario ON produtos(usuario_id);
CREATE INDEX idx_movimentos_produto ON movimentos_estoque(produto_id);
CREATE INDEX idx_movimentos_usuario ON movimentos_estoque(usuario_id);
CREATE INDEX idx_alertas_produto ON alertas(produto_id);
CREATE INDEX idx_alertas_visualizado ON alertas(visualizado);
```

## 2. Configurar Row Level Security (RLS)

Execute o seguinte SQL para ativar RLS e criar políticas:

```sql
-- Ativar RLS
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentos_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas ENABLE ROW LEVEL SECURITY;

-- Políticas para produtos
CREATE POLICY "Users can view their own products" ON produtos
  FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert their own products" ON produtos
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update their own products" ON produtos
  FOR UPDATE USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete their own products" ON produtos
  FOR DELETE USING (auth.uid() = usuario_id);

-- Políticas para movimentos
CREATE POLICY "Users can view their movements" ON movimentos_estoque
  FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert movements" ON movimentos_estoque
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Políticas para alertas
CREATE POLICY "Users can view their alerts" ON alertas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM produtos 
      WHERE produtos.id = alertas.produto_id 
      AND produtos.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their alerts" ON alertas
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM produtos 
      WHERE produtos.id = alertas.produto_id 
      AND produtos.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their alerts" ON alertas
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM produtos 
      WHERE produtos.id = alertas.produto_id 
      AND produtos.usuario_id = auth.uid()
    )
  );
```

## 3. Configurar Variáveis de Ambiente

No seu arquivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_aqui
```

Encontre essas informações em:
- Dashboard Supabase → Project Settings → API → Project URL
- Dashboard Supabase → Project Settings → API → Project API Keys (Anon public)

## 4. Testar Conexão

Execute no terminal:
```bash
npm run dev
```

Vá para http://localhost:3000/signup e tente criar uma conta. Se conseguir, a conexão está funcionando!

## 5. Estrutura de Dados

### Tabela: produtos
- id: UUID (chave primária)
- nome: String (obrigatório)
- descricao: String (opcional)
- sku: String (único, obrigatório)
- quantidade_atual: Integer (padrão: 0)
- quantidade_minima: Integer (padrão: 10)
- preco_custo: Decimal (padrão: 0)
- preco_venda: Decimal (obrigatório)
- categoria: String
- ativo: Boolean (padrão: true)
- criado_em: Timestamp (automático)
- atualizado_em: Timestamp (automático)
- usuario_id: UUID (referência para auth.users)

### Tabela: movimentos_estoque
- id: UUID (chave primária)
- produto_id: UUID (referência para produtos)
- tipo_movimento: String ('entrada' ou 'saida')
- quantidade: Integer (obrigatório)
- motivo: String (opcional)
- usuario_id: UUID (referência para auth.users)
- criado_em: Timestamp (automático)

### Tabela: alertas
- id: UUID (chave primária)
- produto_id: UUID (referência para produtos)
- tipo_alerta: String ('estoque_baixo' ou 'estoque_critico')
- visualizado: Boolean (padrão: false)
- criado_em: Timestamp (automático)

## 6. Troubleshooting

**Erro "relation does not exist"**
- Verifique se todas as tabelas foram criadas
- Confirme que você executou todo o SQL de criação

**Erro RLS Policy**
- Verifique se RLS está ativado em todas as tabelas
- Confirme que as políticas foram criadas corretamente

**Dados não aparecem**
- Verifique se você está autenticado
- Confirme o usuario_id está correto (compare com auth.uid() no Supabase)
