# Troubleshooting - Internal Server Error

## 🔍 O que fazer:

### 1. Verificar o Console do Navegador (F12)
Abra o DevTools (F12) → **Console** e copie o erro completo

### 2. Verificar o Terminal
No terminal onde está rodando `npm run dev`, procure por erros vermelhos

### 3. Problemas Comuns e Soluções

---

## ❌ Erro 1: "Cannot read property 'id' of null"
**Causa**: Usuário não autenticado ou sesão expirou

**Solução**:
- Limpar cookies: Abra DevTools → Application → Cookies → Delete all
- Logout e login novamente
- Reiniciar o servidor

---

## ❌ Erro 2: "relation does not exist"
**Causa**: Tabelas não criadas no Supabase

**Solução**:
- Vá para Supabase → SQL Editor
- Verifique se as 3 tabelas existem: `produtos`, `movimentos_estoque`, `alertas`
- Se não existem, execute o script SQL de novo

---

## ❌ Erro 3: "Permission denied"
**Causa**: RLS policies incorretas

**Solução**:
- Vá para Supabase → Table Editor
- Clique em cada tabela → RLS
- Verifique se há policies criadas

---

## ❌ Erro 4: "supabaseUrl is required"
**Causa**: Variáveis de ambiente não configuradas

**Solução**:
- Abra `.env.local`
- Verifique se tem:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
  ```
- Reinicie o servidor (Ctrl+C + npm run dev)

---

## ✅ Checklist Completo:

- [ ] Arquivo `.env.local` preenchido com chaves reais?
- [ ] Tabelas criadas no Supabase? (SQL Editor → Tables)
- [ ] RLS ativado? (Table Editor → RLS)
- [ ] Policies criadas? (Table Editor → cada tabela → RLS)
- [ ] Conseguiu criar uma conta? (signup funciona?)
- [ ] Terminal mostra erro específico?

---

## 🔧 Debug Mode:

Se o erro continuar, tira um screenshot com:

1. **Console do navegador** (F12 → Console)
2. **Terminal output** (onde está rodando npm run dev)
3. **URL da página** onde o erro acontece

E passa pra mim que vou corrigir! 📋
