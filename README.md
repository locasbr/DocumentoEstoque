# EstoqueSystem - Sistema de Estoque para Mercados Brasileiros

Um sistema simples e eficiente de gerenciamento de estoque para pequenos mercados brasileiros, construído com Next.js, TypeScript e Supabase.

## 🚀 Funcionalidades

- ✅ Autenticação de usuários (login e cadastro)
- ✅ Cadastro de produtos com preços de custo e venda
- ✅ Controle de entrada e saída de estoque
- ✅ Alertas automáticos de estoque baixo/crítico
- ✅ Dashboard com estatísticas
- ✅ Interface responsiva e intuitiva
- ✅ Totalmente em português brasileiro

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta Supabase (gratuita em https://supabase.com)
- Conta Vercel (para deploy)

## 🔧 Setup Local

### 1. Clonar o projeto
```bash
git clone <seu-repo>
cd DocumentoEstoque
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar Supabase

#### 3.1. Criar conta e projeto no Supabase
- Vá para https://supabase.com
- Crie uma conta gratuita
- Crie um novo projeto
- Anote a URL e a chave anon (API key)

#### 3.2. Executar migrações SQL

No dashboard do Supabase, vá para SQL Editor e execute o seguinte código:

```sql
-- Criar tabela de usuários (opcional, Supabase cria automaticamente)
-- A autenticação é gerenciada pelo Supabase Auth

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

-- Criar índices
CREATE INDEX idx_produtos_usuario ON produtos(usuario_id);
CREATE INDEX idx_movimentos_produto ON movimentos_estoque(produto_id);
CREATE INDEX idx_movimentos_usuario ON movimentos_estoque(usuario_id);
CREATE INDEX idx_alertas_produto ON alertas(produto_id);
CREATE INDEX idx_alertas_visualizado ON alertas(visualizado);

-- Criar políticas RLS (Row Level Security)
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentos_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas ENABLE ROW LEVEL SECURITY;

-- Política para produtos
CREATE POLICY "Users can view their own products" ON produtos
  FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert their own products" ON produtos
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update their own products" ON produtos
  FOR UPDATE USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete their own products" ON produtos
  FOR DELETE USING (auth.uid() = usuario_id);

-- Política para movimentos
CREATE POLICY "Users can view their movements" ON movimentos_estoque
  FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert movements" ON movimentos_estoque
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Política para alertas
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

#### 3.3. Configurar variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_aqui
```

### 4. Executar o servidor de desenvolvimento

```bash
npm run dev
```

Abra http://localhost:3000 no navegador

## 📦 Deploy na Vercel

### 1. Fazer push para GitHub
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Importar no Vercel
- Vá para https://vercel.com
- Clique em "New Project"
- Selecione seu repositório
- Vercel detectará automaticamente que é um projeto Next.js

### 3. Configurar variáveis de ambiente
- Na aba "Environment Variables", adicione:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 4. Deploy
- Clique em "Deploy"
- Aguarde o build ser concluído

## 🎯 Estrutura do Projeto

```
src/
├── app/
│   ├── layout.tsx              # Layout raiz
│   ├── page.tsx                # Página inicial (redirecionamento)
│   ├── login/                  # Página de login
│   ├── signup/                 # Página de cadastro
│   ├── dashboard/              # Layout do dashboard
│   │   ├── page.tsx            # Dashboard principal
│   │   ├── produtos/           # Gestão de produtos
│   │   ├── estoque/            # Controle de estoque
│   │   └── alertas/            # Alertas de estoque
│   ├── globals.css             # Estilos globais
│   └── layout.tsx
├── lib/
│   ├── supabase.ts             # Cliente Supabase
│   ├── types.ts                # Tipos TypeScript
│   └── utils.ts                # Funções utilitárias
└── components/
    ├── navbar.tsx              # Barra de navegação
    ├── sidebar.tsx             # Menu lateral
    ├── loading.tsx             # Componente de carregamento
    └── alerts.tsx              # Componente de alertas
```

## 🔐 Autenticação

O sistema utiliza Supabase Auth para gerenciar usuários:
- Novos usuários podem se cadastrar com email e senha
- A autenticação é mantida em sessão
- Logout disponível no navbar

## 📱 Funcionalidades Principais

### Dashboard
- Visão geral com estatísticas
- Total de produtos
- Total de movimentos
- Alertas pendentes
- Valor total em estoque

### Produtos
- Listagem com busca por nome/SKU
- Cadastro de novo produto com:
  - Nome, SKU, categoria
  - Quantidade inicial e mínima
  - Preço de custo e venda
- Edição de produtos
- Exclusão de produtos

### Estoque
- Registro de entrada de produtos (compras)
- Registro de saída de produtos (vendas)
- Histórico de movimentos
- Motivo do movimento
- Data e usuário que fez o movimento

### Alertas
- Alertas automáticos quando estoque fica abaixo do mínimo
- Alertas críticos quando estoque está zerado
- Filtro de alertas visualizados/não visualizados
- Marcar alerta como visualizado
- Excluir alertas

## 🎨 Customização

### Alterar cores
Edite `tailwind.config.js`:
```javascript
colors: {
  primary: '#10b981',      // Verde
  secondary: '#3b82f6',    // Azul
  danger: '#ef4444',       // Vermelho
  warning: '#f59e0b',      // Amarelo
}
```

### Alterar categorias de produtos
Edite as opções em `src/app/dashboard/produtos/novo/page.tsx` e `src/app/dashboard/produtos/[id]/page.tsx`

## 🐛 Troubleshooting

**Erro: "Could not read from Supabase"**
- Verifique as variáveis de ambiente no `.env.local`
- Confirme que você está no projeto correto no Supabase

**Erro de autenticação**
- Verifique se o email foi confirmado no Supabase
- Limpe o cache do navegador e tente novamente

**Produtos não aparecem**
- Certifique-se que você está autenticado
- Verifique se as políticas RLS estão configuradas corretamente

## 📝 Licença

MIT

## 👤 Suporte

Para dúvidas ou problemas, abra uma issue no GitHub.

---

Desenvolvido com ❤️ para pequenos mercados brasileiros
