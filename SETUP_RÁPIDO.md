# 🚀 Setup Rápido - Obter Chaves Supabase

## Passo 1: Ir ao Dashboard Supabase

1. Acesse: https://supabase.com/dashboard
2. Entre com sua conta ou crie uma (gratuito)
3. Selecione ou crie um projeto novo

## Passo 2: Encontrar as Chaves

### NEXT_PUBLIC_SUPABASE_URL
1. No dashboard, vá para **Settings** (engrenagem no canto inferior esquerdo)
2. Clique em **API**
3. Em **Project URL**, copie o link que começa com `https://...supabase.co`
4. Cole em `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   ```

### NEXT_PUBLIC_SUPABASE_ANON_KEY
1. Ainda em **Settings → API**
2. Em **Project API keys** → **public** (Anon key)
3. Copie a chave (começa com `eyJ...`)
4. Cole em `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

## Passo 3: Executar as Migrações SQL

⚠️ **IMPORTANTE**: Após preencher as chaves, você precisa criar as tabelas no Supabase!

1. No dashboard Supabase, clique em **SQL Editor** (no menu esquerdo)
2. Clique em **New Query**
3. Copie TODO o código de `SUPABASE_SETUP.md`
4. Cole na query
5. Clique em **Run** ou `Ctrl+Enter`

## Passo 4: Reiniciar o servidor

```bash
# No terminal, pressione Ctrl+C para parar o servidor
# Depois execute:
npm run dev
```

Agora deve funcionar! 🎉

---

## Checklist

- [ ] URL do Supabase copiada em `.env.local`
- [ ] Chave Anon copiada em `.env.local`
- [ ] SQL executado no Supabase (tabelas criadas)
- [ ] Servidor reiniciado
- [ ] Acessou http://localhost:3000/signup
- [ ] Conseguiu criar uma conta

Se ainda tiver erro, verifique:
- ✓ O arquivo `.env.local` existe?
- ✓ Não tem espaços antes/depois das chaves?
- ✓ As tabelas foram criadas (SQL Editor → Tables)?
- ✓ O servidor foi reiniciado depois das mudanças?
