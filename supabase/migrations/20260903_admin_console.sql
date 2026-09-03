-- Auditoria do Console Administrativo do EstoqueSystem.
-- Execute no SQL Editor do Supabase antes de habilitar comandos do Admin.

create table if not exists public.admin_auditoria (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null,
  conta_id uuid,
  acao text not null,
  motivo text not null,
  dados_anteriores jsonb,
  dados_novos jsonb,
  sucesso boolean not null default true,
  erro text,
  criado_em timestamptz not null default now(),
  constraint admin_auditoria_acao_check check (
    acao in (
      'estender_trial',
      'alterar_plano_local',
      'bloquear_acesso_local',
      'restaurar_acesso_local',
      'atualizar_nota_admin'
    )
  ),
  constraint admin_auditoria_motivo_check check (
    char_length(trim(motivo)) between 5 and 500
  )
);

create index if not exists admin_auditoria_conta_criado_idx
  on public.admin_auditoria (conta_id, criado_em desc);

create index if not exists admin_auditoria_admin_criado_idx
  on public.admin_auditoria (admin_id, criado_em desc);

alter table public.admin_auditoria enable row level security;

-- Nenhuma policy para authenticated. A tabela deve ser acessada somente
-- pelas rotas de servidor usando a service role.
revoke all on table public.admin_auditoria from anon;
revoke all on table public.admin_auditoria from authenticated;

comment on table public.admin_auditoria is
  'Trilha de auditoria de comandos manuais executados pelo Console Administrativo.';
comment on column public.admin_auditoria.conta_id is
  'ID do perfil/estabelecimento afetado pelo comando.';
comment on column public.admin_auditoria.dados_anteriores is
  'Snapshot dos campos relevantes antes da alteração.';
comment on column public.admin_auditoria.dados_novos is
  'Snapshot dos campos relevantes depois da alteração.';
