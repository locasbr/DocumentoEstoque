# Instruções Supabase - Reset & Setup

## ⚠️ Se você já executou o SQL anterior...

Use este script para **deletar tudo e recomeçar do zero**:

```sql
-- ⚠️ CUIDADO: Isso vai deletar todas as tabelas!
-- Só execute se tiver certeza que quer recomeçar

-- Remover políticas RLS (opcional, será feito ao deletar tabelas)
-- DROP POLICY IF EXISTS ... ON ...

-- Deletar tabelas na ordem correta (por causa das Foreign Keys)
DROP TABLE IF EXISTS alertas CASCADE;
DROP TABLE IF EXISTS movimentos_estoque CASCADE;
DROP TABLE IF EXISTS produtos CASCADE;
```

Depois, execute o script de criação normal:

```sql
-- ===== CRIAR TABELAS =====

-- Criar tabela de produtos
CREATE TABLE produtos (
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
CREATE TABLE movimentos_estoque (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  tipo_movimento VARCHAR(20) NOT NULL CHECK (tipo_movimento IN ('entrada', 'saida')),
  quantidade INTEGER NOT NULL,
  motivo TEXT,
  usuario_id UUID NOT NULL REFERENCES auth.users(id),
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Criar tabela de alertas
CREATE TABLE alertas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  tipo_alerta VARCHAR(20) NOT NULL CHECK (tipo_alerta IN ('estoque_baixo', 'estoque_critico')),
  visualizado BOOLEAN DEFAULT false,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- ===== CRIAR ÍNDICES =====

CREATE INDEX idx_produtos_usuario ON produtos(usuario_id);
CREATE INDEX idx_movimentos_produto ON movimentos_estoque(produto_id);
CREATE INDEX idx_movimentos_usuario ON movimentos_estoque(usuario_id);
CREATE INDEX idx_alertas_produto ON alertas(produto_id);
CREATE INDEX idx_alertas_visualizado ON alertas(visualizado);

-- ===== ATIVAR ROW LEVEL SECURITY =====

ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentos_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas ENABLE ROW LEVEL SECURITY;

-- ===== CRIAR POLÍTICAS PARA PRODUTOS =====

CREATE POLICY "Users can view their own products" ON produtos
  FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert their own products" ON produtos
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update their own products" ON produtos
  FOR UPDATE USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete their own products" ON produtos
  FOR DELETE USING (auth.uid() = usuario_id);

-- ===== CRIAR POLÍTICAS PARA MOVIMENTOS =====

CREATE POLICY "Users can view their movements" ON movimentos_estoque
  FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert movements" ON movimentos_estoque
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- ===== CRIAR POLÍTICAS PARA ALERTAS =====

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

## 📋 Passos:

1. **Delete antigo** (só se quiser recomeçar):
   - Abra SQL Editor no Supabase
   - Crie uma **New Query**
   - Cole o script de DELETE
   - Execute (Run)

2. **Crie novo**:
   - Crie uma **New Query**
   - Cole o script de CREATE
   - Execute (Run)

3. **Pronto!** Agora as tabelas estão limpas e funcionando.

---

**Dúvida?** Se quiser manter os dados antigos, não execute o DELETE. As tabelas já existem e estão prontas pra usar!
