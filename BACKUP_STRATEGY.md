# 📦 Estratégia de Backup - EstoqueSystem

## 1️⃣ BACKUP DO CÓDIGO (GitHub)

### Setup inicial:
```bash
cd c:\Users\locas\Documents\DocumentoEstoque
git init
git add .
git commit -m "Initial commit - v1.0.0"
git remote add origin https://github.com/SEU_USUARIO/DocumentoEstoque.git
git push -u origin main
```

### Depois, a cada atualização:
```bash
git add .
git commit -m "Descrição das alterações"
git push
```

**Vantagens:**
- ✅ Controle de versão completo
- ✅ Histórico de todas as mudanças
- ✅ Fácil recuperação de versões anteriores
- ✅ Colaboração com múltiplos desenvolvedores

---

## 2️⃣ BACKUP DOS DADOS (Supabase)

### Backup Automático (Built-in)
Supabase oferece backup automático. Acesse:
- **Supabase Dashboard** → **Seu Projeto** → **Settings** → **Backups**
- Backups diários automáticos retidos por 7 dias (plano free)
- Backups semanais no plano pago

### Exportar Dados Manualmente:

#### Tabela por Tabela:
```sql
-- No SQL Editor do Supabase, execute:
SELECT * FROM produtos;
SELECT * FROM movimentos_estoque;
SELECT * FROM alertas;
```
Depois copie o resultado e salve em CSV.

#### Ou use o Script de Exportação:
```bash
# No terminal do seu projeto:
npm run export-data
```

---

## 3️⃣ BACKUP COMPLETO (Código + Dados)

### Script Automático - `backup.ps1`:

Crie o arquivo `backup.ps1` no projeto:

```powershell
# Configurações
$ProjectPath = "C:\Users\locas\Documents\DocumentoEstoque"
$BackupDir = "C:\Users\locas\Backups\DocumentoEstoque"
$Date = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$BackupFolder = "$BackupDir\backup_$Date"

# Criar pasta de backup
New-Item -ItemType Directory -Force -Path $BackupFolder | Out-Null

# Copiar código
Copy-Item -Path "$ProjectPath\src" -Destination "$BackupFolder\src" -Recurse
Copy-Item -Path "$ProjectPath\public" -Destination "$BackupFolder\public" -Recurse
Copy-Item -Path "$ProjectPath\*.json" -Destination "$BackupFolder" -Force
Copy-Item -Path "$ProjectPath\*.js" -Destination "$BackupFolder" -Force
Copy-Item -Path "$ProjectPath\*.md" -Destination "$BackupFolder" -Force

# Git commit
Push-Location $ProjectPath
git add .
git commit -m "Backup automático - $Date"
git push
Pop-Location

# Mensagem de sucesso
Write-Host "✅ Backup criado em: $BackupFolder" -ForegroundColor Green
```

### Executar o backup:
```bash
powershell -ExecutionPolicy Bypass -File backup.ps1
```

### Agendar para rodar automaticamente (Windows):
```bash
# Abrir Task Scheduler
taskkill /IM explorer.exe /F
explorer.exe
# Depois: Ferramentas do Sistema → Tarefas Agendadas → Criar Tarefa Básica
# Gatilho: Diário às 18:00
# Ação: PowerShell -ExecutionPolicy Bypass -File C:\Users\locas\Documents\DocumentoEstoque\backup.ps1
```

---

## 4️⃣ BACKUP DE BANCO DE DADOS (Supabase)

### Exportar via SQL:
```sql
-- Exportar todas as tabelas como SQL
SELECT * FROM pg_dump(current_database());
```

### Ou via Supabase CLI:
```bash
npm install -g @supabase/cli
supabase db push
supabase db pull > backup.sql
```

---

## 5️⃣ CHECKLIST DE BACKUP

Antes de mostrar ao cliente, execute:

- [ ] ✅ Git repository criado e enviado para GitHub
- [ ] ✅ `.env.local` com credenciais do Supabase
- [ ] ✅ Backup manual do código (`git push`)
- [ ] ✅ Teste de recuperação do backup (clone o repo em outra pasta)
- [ ] ✅ Supabase backups automáticos habilitados
- [ ] ✅ Script de backup PowerShell criado

---

## 6️⃣ PLANO DE RECUPERAÇÃO (Disaster Recovery)

Se algo der errado:

### Cenário 1: Código corrompido
```bash
# Restaurar último commit
git reset --hard HEAD~1

# Ou restaurar um commit específico
git checkout <commit-id>
```

### Cenário 2: Dados do Supabase corrompidos
1. Vá para **Supabase Dashboard** → **Settings** → **Backups**
2. Clique em **Restore** do backup mais recente
3. Aguarde 5-10 minutos

### Cenário 3: Tudo perdido
```bash
# 1. Clonar repositório GitHub
git clone https://github.com/SEU_USUARIO/DocumentoEstoque.git

# 2. Instalar dependências
npm install

# 3. Restaurar banco de dados
supabase db push

# 4. Configurar .env.local
# (Copiar variáveis de ambiente do cliente/produção)
```

---

## 📊 Resumo de Frequência Recomendada

| Tipo | Frequência | Método |
|------|-----------|--------|
| **Código** | A cada mudança | Git commit + push |
| **Supabase Automático** | Diário | Built-in (7 dias) |
| **Backup Manual Completo** | Semanal | Script PowerShell |
| **Exportação SQL** | Mensal | `supabase db pull` |

---

## 🔐 Segurança

- ✅ **Nunca commitee** `.env.local` no Git
- ✅ Adicione `.env.local` ao `.gitignore` (já está)
- ✅ Use token do Supabase com permissões limitadas
- ✅ Revise logs de acesso mensalmente

