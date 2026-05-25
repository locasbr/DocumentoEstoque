# 📖 MANUAL DO USUÁRIO - EstoqueSystem v1.0.0

**Sistema de Gestão de Estoque para Mercados e Pequenos Comércios**

---

## 📋 ÍNDICE

1. [Começando](#começando)
2. [Login e Cadastro](#login-e-cadastro)
3. [Dashboard](#dashboard)
4. [Produtos](#gerenciar-produtos)
5. [Estoque](#controle-de-estoque)
6. [PDV (Ponto de Venda)](#ponto-de-venda)
7. [Relatórios](#relatórios)
8. [Alertas](#alertas)
9. [Equipe](#gerenciar-equipe)
10. [Suporte](#suporte)

---

## 🚀 Começando

### Acessar o Sistema

1. Abra seu navegador (Chrome, Firefox, Safari, Edge)
2. Acesse: **https://seu-dominio.com** (fornecido pelo seu técnico)
3. Você será direcionado para a página de login

### Requisitos

- ✅ Conexão com internet
- ✅ Navegador atualizado
- ✅ Email e senha

---

## 🔐 Login e Cadastro

### Primeiro Acesso - Criar Conta

1. Na página de login, clique em **"Crie uma agora"**
2. Preencha os campos:
   - **Nome Completo:** Seu nome completo
   - **Email:** Um email válido (ex: seu@email.com)
   - **Senha:** Mínimo 6 caracteres
   - **Confirmar Senha:** Repita a senha

3. Clique em **"Criar Conta"**
4. Você será automaticamente logado

> 💡 **Dica:** Use um email que você tenha acesso para recuperar senha

### Login Posterior

1. Insira seu **Email**
2. Insira sua **Senha**
3. Clique em **"Entrar"**

### Esqueci a Senha

1. Na página de login, clique em **"Esqueceu sua senha?"**
2. Insira seu email
3. Verifique seu email por um link de recuperação
4. Crie uma nova senha

---

## 📊 Dashboard

### O Que É?

É a página principal onde você vê um **resumo rápido** de todo seu negócio.

### Informações Exibidas

#### 📈 Métricas do Dia

**4 cartões principais:**

1. **Itens Vendidos** (em azul)
   - Quantos produtos você vendeu hoje
   - Exemplo: 45 itens

2. **Itens Recebidos** (em verde)
   - Quantos produtos você recebeu de fornecedores
   - Exemplo: 120 itens

3. **Receita Total** (em roxo)
   - Quanto você faturou até agora
   - Exemplo: R$ 1.250,00

4. **Lucro Estimado** (em verde/vermelho)
   - Qual foi seu lucro (receita - custo)
   - Exemplo: R$ 350,00 (28%)

#### 📦 Estoque Total

- **Quantidade de produtos cadastrados**
- **Produtos em falta/crítico** (em vermelho ⚠️)

#### 🏪 Produtos Cadastrados

- Valor total investido em estoque
- Número total de itens em estoque

### Ações Disponíveis

| Botão | Função |
|-------|--------|
| 🛒 Novo Produto | Cadastrar um novo produto |
| 📊 Ver Relatórios | Ir para relatórios detalhados |
| ⚠️ Ver Alertas | Ver produtos com estoque baixo |
| 📦 Gerenciar Estoque | Entrada/saída de produtos |

---

## 🏪 Gerenciar Produtos

### Acessar

1. No menu lateral, clique em **"Produtos"**
2. Você verá a lista de todos os seus produtos

### Ver Lista de Produtos

**Cada produto mostra:**

- 📸 Foto do produto (se cadastrada)
- 📝 Nome
- 🏷️ SKU/Código
- 📊 Quantidade em estoque
- 💰 Preço de custo
- 💵 Preço de venda
- 💹 Margem de lucro (%)

### Adicionar Novo Produto

#### Passo 1: Clique em **"+ Novo Produto"**

#### Passo 2: Preencha os campos

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| **Nome** | Nome do produto | Arroz Integral 5kg |
| **SKU** | Código único do produto | ARR-INT-5KG |
| **Descrição** | Detalhes opcionais | Arroz integral premium |
| **Categoria** | Tipo de produto | Alimentos |
| **Quantidade Inicial** | Quanto você tem agora | 50 |
| **Quantidade Mínima** | Quando alertar para reposição | 10 |
| **Preço de Custo** | O quanto você pagou ao fornecedor | R$ 20,00 |
| **Preço de Venda** | O preço para o cliente | R$ 35,00 |
| **Imagem** | Foto do produto (opcional) | Selecione arquivo |

#### Passo 3: Clique em **"Salvar"**

✅ Seu produto está cadastrado!

### Editar Produto

1. Na lista de produtos, clique no produto
2. Modifique os campos desejados
3. Clique em **"Salvar"**

### Deletar Produto

1. Na lista, localize o produto
2. Clique no ícone 🗑️ (lixeira)
3. Confirme a exclusão
4. O produto será removido

> ⚠️ **Cuidado:** Esta ação não pode ser desfeita!

---

## 📦 Controle de Estoque

### Acessar

1. No menu, clique em **"Estoque"**
2. Você verá o movimento do seu estoque

### O Que É Entrada e Saída?

- **ENTRADA:** Produtos que você recebeu de fornecedores (+)
- **SAÍDA:** Produtos que você vendeu (-)

### Registrar Entrada (Recebimento)

#### Passo 1: Clique em **"+ Entrada"**

#### Passo 2: Preencha

| Campo | O Que Fazer |
|-------|-------------|
| **Produto** | Selecione da lista |
| **Quantidade** | Quanto você recebeu |
| **Motivo** (opcional) | "Fornecedor XYZ" ou "Reposição" |

#### Passo 3: Clique em **"Registrar Entrada"**

✅ Seu estoque foi atualizado!

### Registrar Saída (Venda)

#### Passo 1: Clique em **"+ Saída"**

#### Passo 2: Preencha

| Campo | O Que Fazer |
|-------|-------------|
| **Produto** | Selecione da lista |
| **Quantidade** | Quanto você vendeu |
| **Motivo** (opcional) | "Venda PDV" ou "Venda balcão" |

#### Passo 3: Clique em **"Registrar Saída"**

✅ Estoque atualizado!

### Histórico de Movimentos

Você pode ver todos os movimentos anteriores nesta mesma página:

- Data e hora
- Tipo (Entrada/Saída)
- Produto
- Quantidade
- Quem fez (se houver múltiplos usuários)

---

## 🛒 Ponto de Venda (PDV)

### Acessar

1. No menu, clique em **"PDV"**
2. Você verá a interface de vendas

### Como Vender

#### Passo 1: Pesquise o Produto

- Use a **barra de busca** no topo
- Digite o nome ou código do produto
- Clique no produto para adicionar

#### Passo 2: Insira a Quantidade

- O produto aparecerá na lista de vendas
- Ajuste a quantidade
- Preço será calculado automaticamente

#### Passo 3: Finalize

1. Revise os itens vendidos
2. Clique em **"Finalizar Venda"**
3. O cupom será exibido/impresso (se tiver impressora)
4. Estoque é atualizado automaticamente

### Cupom de Vendas

O sistema gera um **cupom digital** com:

- ✅ Data e hora da venda
- ✅ Itens vendidos com preços
- ✅ Subtotal
- ✅ Total
- ✅ Número do cupom (para rastreamento)

> 💡 **Dica:** Se tiver impressora térmica, o cupom será impresso automaticamente

---

## 📊 Relatórios

### Acessar

1. No menu, clique em **"Relatórios"**
2. Você verá análises detalhadas de vendas

### Filtros de Período

Escolha um período para análise:

- **Hoje**
- **7 dias** (última semana)
- **30 dias** (último mês)
- **90 dias** (último trimestre)

### Métricas Exibidas

#### 📈 Estatísticas

| Métrica | Significado |
|---------|-------------|
| **Itens Vendidos** | Total de unidades vendidas |
| **Itens Recebidos** | Total de unidades recebidas |
| **Receita Total** | Valor bruto de vendas |
| **Lucro Estimado** | Receita - Custo |

#### 🏆 Top Produtos

Os **7 produtos mais vendidos** em gráfico de barras

Mostra:
- Nome do produto
- Receita gerada
- Quantidade vendida

#### 📋 Detalhamento por Produto

Tabela completa com:

| Coluna | Descrição |
|--------|-----------|
| **Produto** | Nome |
| **Qtd** | Quantas unidades vendidas |
| **Receita** | Total de vendas do produto |
| **Custo** | Quanto você gastou |
| **Lucro** | Receita - Custo |
| **Margem** | Percentual de lucro (%) |

> 💡 **Cores da Margem:**
> - 🟢 Verde: Acima de 30% (Excelente!)
> - 🟡 Amarelo: 15-30% (Bom)
> - 🔴 Vermelho: Abaixo de 15% (Revisar preço)

#### 📅 Movimentação Diária

Tabela mostrando cada dia:

- **Data**
- **Entradas:** Produtos recebidos
- **Saídas:** Produtos vendidos
- **Saldo:** Diferença (pode ser negativo em dias de muita venda)

### Exportar Dados

Clique em **"📥 Exportar"** para baixar dados em arquivo Excel (.CSV)

Útil para:
- ✅ Análise em planilha
- ✅ Apresentar ao contador
- ✅ Fazer apresentações

---

## ⚠️ Alertas

### Acessar

1. No menu, clique em **"Alertas"**
2. Você verá produtos que precisam de atenção

### Tipos de Alertas

#### 🟡 Estoque Baixo

Aparece quando a quantidade fica abaixo da **quantidade mínima**

**O que fazer:**
1. Faça um pedido ao fornecedor
2. Registre uma entrada quando receber

#### 🔴 Estoque Crítico

Aparece quando o produto **está em falta (zero)**

**O que fazer:**
1. Peça reposição urgente ao fornecedor
2. Considere oferecer alternativas aos clientes

### Marca como Lido

Clique em um alerta para marcá-lo como visualizado

---

## 👥 Gerenciar Equipe

### Acessar

1. No menu, clique em **"Equipe"**
2. Você verá todos os membros da sua equipe

> 📌 **Nota:** Apenas o dono pode gerenciar a equipe

### Adicionar Novo Membro

#### Passo 1: Clique em **"+ Convite"**

#### Passo 2: Insira o Email

- Digite o email do funcionário
- Escolha o nível de acesso:
  - **Dono:** Acesso total (geralmente só você)
  - **Funcionário:** Pode fazer vendas e registrar movimento

#### Passo 3: Clique em **"Enviar Convite"**

✅ Um email será enviado ao funcionário

### Status do Membro

| Status | Significado |
|--------|-------------|
| 🟡 Pendente | Convite enviado, aguardando aceitação |
| 🟢 Ativo | Membro já faz login e usa o sistema |
| 🔴 Inativo | Membro desativado (não pode usar) |

### Remover Membro

1. Na lista, clique no membro
2. Clique em **🗑️ Remover**
3. Confirme a ação

---

## 👤 Perfil

### Acessar

1. No menu, clique em **"Perfil"**
2. Você verá suas informações pessoais

### Editar Perfil

1. Clique em **"Editar"**
2. Modifique:
   - Nome completo
   - Email
   - Foto de perfil
3. Clique em **"Salvar"**

### Trocar Senha

1. Clique em **"Alterar Senha"**
2. Insira a **senha atual**
3. Insira a **nova senha** (2x)
4. Clique em **"Confirmar"**

### Fazer Logout

Clique em **"Sair"** para desconectar do sistema

---

## 💡 Dicas e Boas Práticas

### ✅ FAÇA:

1. **Atualize o estoque diariamente**
   - Registre entradas ao receber produtos
   - Registre saídas ao vender (PDV faz automático)

2. **Monitore os alertas**
   - Verifique diariamente os produtos em falta
   - Faça reposição com antecedência

3. **Analise os relatórios semanalmente**
   - Entenda quais produtos vendem mais
   - Identifique oportunidades de lucro

4. **Use imagens dos produtos**
   - Facilita identificação visual
   - Deixa o sistema mais profissional

5. **Mantenha os preços atualizados**
   - Revise periodicamente
   - Ajuste conforme custo/demanda

### ❌ NÃO FAÇA:

1. ❌ Não compartilhe sua senha
2. ❌ Não esqueça de registrar movimentos (pode ficar desatualizado)
3. ❌ Não deixe estoque negativo (sempre verificar quantidade antes de vender)
4. ❌ Não cadastre produtos duplicados (SKU único)
5. ❌ Não ignore alertas de estoque crítico

---

## 🆘 Suporte

### Dúvidas Técnicas

Envie um email para:
- **Email:** suporte@seu-dominio.com
- **Assunto:** [EstoqueSystem] Dúvida/Problema
- **Descrição:** Descreva o problema detalhadamente

### Informações a Incluir

1. Qual página você estava usando?
2. O que você tentou fazer?
3. Qual foi o erro? (imagem ou texto)
4. Qual é seu email cadastrado?

### Horário de Atendimento

- **Segunda a Sexta:** 9:00 - 18:00
- **Sábado:** 9:00 - 13:00
- **Domingo:** Fechado

---

## 🔒 Segurança

### Suas Informações Estão Seguras!

✅ Senhas são **criptografadas**  
✅ Dados armazenados em **servidores seguros**  
✅ Backup automático **diário**  
✅ Acesso só com autenticação  

### Dicas de Segurança

1. **Nunca compartilhe sua senha** com ninguém
2. **Logout ao usar computador compartilhado**
3. **Não use redes WiFi públicas** desprotegidas para acesso
4. **Mude sua senha regularmente** (a cada 3 meses)
5. **Avise imediatamente** se desconfiar de acesso não autorizado

---

## 📱 Compatibilidade

### Dispositivos Suportados

✅ **Desktop/Notebook**
- Windows, Mac, Linux
- Chrome, Firefox, Safari, Edge

✅ **Tablets**
- iPad, Android
- Versão responsiva funciona bem

✅ **Celular**
- iPhone, Android
- Interface otimizada para tela pequena

### Navegadores Recomendados

| Navegador | Versão Mínima |
|-----------|---------------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

---

## 🎯 Rotina Recomendada

### Diariamente
- [ ] Verificar alertas de estoque
- [ ] Registrar vendas no PDV
- [ ] Registrar entradas de produtos

### Semanalmente
- [ ] Analisar relatórios
- [ ] Revisar produtos com baixa margem
- [ ] Verificar itens em falta

### Mensalmente
- [ ] Fazer backup dos dados
- [ ] Reconciliar estoque físico vs sistema
- [ ] Revisar preços e ajustar conforme necessário

---

## 📊 Exemplos de Uso

### Exemplo 1: Novo Dia de Trabalho

```
1. Faço login → Email + Senha
2. Vejo o Dashboard → Métricas do dia
3. Clico em Alertas → Vejo produtos faltando
4. Faço entrada de produtos recebidos
5. Faço vendas no PDV durante o dia
6. Ao final do dia → Clico em Relatórios
```

### Exemplo 2: Controlar Estoque

```
1. Produto chega do fornecedor (50 unidades)
2. Vou em "Estoque" → "+ Entrada"
3. Seleciono o produto
4. Coloco 50 unidades
5. Sistema atualiza automaticamente
```

### Exemplo 3: Fazer uma Venda

```
1. Cliente pede "Arroz 5kg"
2. Clico em PDV → Busco "Arroz"
3. Adiciono 2 unidades
4. Preço é calculado automaticamente
5. Clico "Finalizar Venda"
6. Cupom é impresso/exibido
7. Estoque atualiza sozinho ✅
```

---

## ❓ FAQ (Perguntas Frequentes)

### P: Perdi minha senha, o que fazer?
**R:** Clique em "Esqueceu sua senha?" na tela de login e siga as instruções por email.

### P: Posso usar em celular?
**R:** Sim! O sistema é responsivo e funciona bem em smartphones.

### P: Meus dados são seguros?
**R:** Sim! Usamos criptografia de ponta e backups diários.

### P: Quantos usuários posso adicionar?
**R:** Sem limite! Adicione quantos funcionários precisar.

### P: Posso usar offline?
**R:** Não. O sistema requer conexão com internet.

### P: Como faço backup dos meus dados?
**R:** O sistema faz backup automático diariamente. Você também pode exportar dados em Excel.

### P: Posso deletar um produto?
**R:** Sim, mas tenha cuidado! A ação não pode ser desfeita.

### P: E se o estoque ficar negativo?
**R:** O sistema alerta, mas você consegue fazer. Se isso acontecer frequentemente, revise seu procedimento.

---

## 📞 Contato Rápido

| Necessidade | Como Contatar |
|------------|---------------|
| Dúvida sobre o sistema | Email: suporte@seu-dominio.com |
| Problemas técnicos | Email: suporte@seu-dominio.com |
| Sugestões de melhoria | Email: feedback@seu-dominio.com |
| Vendas/Upgrade | Telefone: (XX) XXXXX-XXXX |

---

## 📝 Notas Finais

Este sistema foi desenvolvido especialmente para sua loja com foco em:

✅ **Simplicidade** - Interface intuitiva e fácil de usar  
✅ **Rapidez** - Vendas rápidas no PDV  
✅ **Precisão** - Controle de estoque exato  
✅ **Análise** - Relatórios detalhados para decisões  
✅ **Suporte** - Equipe pronta para ajudar  

**Bem-vindo ao EstoqueSystem!** 🎉

Aproveite ao máximo sua ferramenta de gestão!

---

**Versão:** 1.0.0  
**Última atualização:** 25 de maio de 2026  
**Desenvolvido com ❤️ para seu negócio**

---

## 📚 Índice de Atalhos

- [Começando](#começando)
- [Login](#login-e-cadastro)
- [Dashboard](#dashboard)
- [Produtos](#gerenciar-produtos)
- [Estoque](#controle-de-estoque)
- [PDV](#ponto-de-venda)
- [Relatórios](#relatórios)
- [Alertas](#alertas)
- [Equipe](#gerenciar-equipe)
- [Perfil](#perfil)
- [Dicas](#dicas-e-boas-práticas)
- [FAQ](#faq-perguntas-frequentes)
- [Suporte](#suporte)
