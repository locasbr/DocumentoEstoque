-- Gerenciamento seguro de produtos em ambiente multiempresa.
-- 1. Corrige SKU global para SKU unico por conta.
-- 2. Lista produtos no escopo do dono.
-- 3. Ativa/desativa um produto com validacao da conta.
-- 4. Altera status em lote sem exclusao destrutiva.
-- 5. Exclui somente produto sem vendas, movimentos ou alertas.

-- -----------------------------------------------------------------------------
-- SKU POR CONTA
-- -----------------------------------------------------------------------------
-- A constraint antiga impede empresas diferentes de usarem o mesmo SKU.
-- A verificacao abaixo interrompe a migration se uma mesma conta ja tiver
-- SKUs duplicados, evitando remover a protecao sem conseguir criar a nova.

do $$
begin
  if exists (
    select 1
    from public.produtos p
    where p.usuario_id is not null
    group by p.usuario_id, lower(trim(p.sku))
    having count(*) > 1
  ) then
    raise exception
      'Existem SKUs duplicados dentro da mesma conta. Corrija-os antes de executar esta migration.';
  end if;
end;
$$;

alter table public.produtos
  drop constraint if exists produtos_sku_key;

create unique index if not exists produtos_usuario_sku_unique
  on public.produtos (usuario_id, lower(trim(sku)))
  where usuario_id is not null;

-- -----------------------------------------------------------------------------
-- LISTAGEM NO ESCOPO DA CONTA
-- -----------------------------------------------------------------------------
create or replace function public.listar_produtos_gerenciamento()
returns setof public.produtos
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario_autenticado uuid;
  v_dono_id uuid;
begin
  v_usuario_autenticado := auth.uid();

  if v_usuario_autenticado is null then
    raise exception 'Usuario nao autenticado.';
  end if;

  select membro.dono_id
    into v_dono_id
  from public.membros membro
  where membro.user_id = v_usuario_autenticado
    and membro.status = 'ativo'
  order by membro.created_at desc
  limit 1;

  v_dono_id := coalesce(v_dono_id, v_usuario_autenticado);

  return query
  select produto.*
  from public.produtos produto
  where produto.usuario_id = v_dono_id
  order by produto.nome asc, produto.id asc;
end;
$$;

revoke all on function public.listar_produtos_gerenciamento() from public;
revoke all on function public.listar_produtos_gerenciamento() from anon;
grant execute on function public.listar_produtos_gerenciamento() to authenticated;

comment on function public.listar_produtos_gerenciamento()
is 'Lista produtos pertencentes a conta do dono, incluindo acesso de membros ativos.';

-- -----------------------------------------------------------------------------
-- ALTERACAO INDIVIDUAL DE STATUS
-- -----------------------------------------------------------------------------
create or replace function public.alterar_status_produto(
  p_produto_id uuid,
  p_ativo boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario_autenticado uuid;
  v_dono_id uuid;
  v_produto public.produtos%rowtype;
begin
  v_usuario_autenticado := auth.uid();

  if v_usuario_autenticado is null then
    raise exception 'Usuario nao autenticado.';
  end if;

  if p_produto_id is null then
    raise exception 'Produto obrigatorio.';
  end if;

  if p_ativo is null then
    raise exception 'Informe o novo status do produto.';
  end if;

  select membro.dono_id
    into v_dono_id
  from public.membros membro
  where membro.user_id = v_usuario_autenticado
    and membro.status = 'ativo'
  order by membro.created_at desc
  limit 1;

  v_dono_id := coalesce(v_dono_id, v_usuario_autenticado);

  select produto.*
    into v_produto
  from public.produtos produto
  where produto.id = p_produto_id
    and produto.usuario_id = v_dono_id
  for update;

  if not found then
    raise exception 'Produto nao encontrado ou nao pertence a esta conta.';
  end if;

  update public.produtos produto
  set ativo = p_ativo,
      atualizado_em = now()
  where produto.id = p_produto_id
    and produto.usuario_id = v_dono_id;

  return jsonb_build_object(
    'produto_id', v_produto.id,
    'produto_nome', v_produto.nome,
    'ativo', p_ativo,
    'usuario_id', v_dono_id,
    'alterado_por', v_usuario_autenticado
  );
end;
$$;

revoke all on function public.alterar_status_produto(uuid, boolean) from public;
revoke all on function public.alterar_status_produto(uuid, boolean) from anon;
grant execute on function public.alterar_status_produto(uuid, boolean) to authenticated;

comment on function public.alterar_status_produto(uuid, boolean)
is 'Ativa ou desativa um produto pertencente a conta autenticada.';

-- -----------------------------------------------------------------------------
-- ALTERACAO DE STATUS EM LOTE
-- -----------------------------------------------------------------------------
create or replace function public.alterar_status_produtos_em_lote(
  p_produto_ids uuid[],
  p_ativo boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario_autenticado uuid;
  v_dono_id uuid;
  v_ids_solicitados integer;
  v_ids_validos integer;
  v_atualizados integer;
begin
  v_usuario_autenticado := auth.uid();

  if v_usuario_autenticado is null then
    raise exception 'Usuario nao autenticado.';
  end if;

  if p_produto_ids is null or cardinality(p_produto_ids) = 0 then
    raise exception 'Selecione pelo menos um produto.';
  end if;

  if p_ativo is null then
    raise exception 'Informe o novo status dos produtos.';
  end if;

  select membro.dono_id
    into v_dono_id
  from public.membros membro
  where membro.user_id = v_usuario_autenticado
    and membro.status = 'ativo'
  order by membro.created_at desc
  limit 1;

  v_dono_id := coalesce(v_dono_id, v_usuario_autenticado);

  select count(distinct id_solicitado)
    into v_ids_solicitados
  from unnest(p_produto_ids) id_solicitado;

  select count(*)
    into v_ids_validos
  from public.produtos produto
  where produto.id = any(p_produto_ids)
    and produto.usuario_id = v_dono_id;

  if v_ids_validos <> v_ids_solicitados then
    raise exception 'Um ou mais produtos nao existem ou nao pertencem a esta conta.';
  end if;

  perform 1
  from public.produtos produto
  where produto.id = any(p_produto_ids)
    and produto.usuario_id = v_dono_id
  order by produto.id
  for update;

  update public.produtos produto
  set ativo = p_ativo,
      atualizado_em = now()
  where produto.id = any(p_produto_ids)
    and produto.usuario_id = v_dono_id;

  get diagnostics v_atualizados = row_count;

  return jsonb_build_object(
    'quantidade_atualizada', v_atualizados,
    'ativo', p_ativo,
    'usuario_id', v_dono_id,
    'alterado_por', v_usuario_autenticado
  );
end;
$$;

revoke all on function public.alterar_status_produtos_em_lote(uuid[], boolean) from public;
revoke all on function public.alterar_status_produtos_em_lote(uuid[], boolean) from anon;
grant execute on function public.alterar_status_produtos_em_lote(uuid[], boolean) to authenticated;

comment on function public.alterar_status_produtos_em_lote(uuid[], boolean)
is 'Ativa ou desativa em lote apenas produtos pertencentes a conta autenticada.';

-- -----------------------------------------------------------------------------
-- EXCLUSAO SOMENTE SEM HISTORICO
-- -----------------------------------------------------------------------------
create or replace function public.excluir_produto_sem_historico(
  p_produto_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario_autenticado uuid;
  v_dono_id uuid;
  v_produto public.produtos%rowtype;
  v_itens_venda bigint;
  v_movimentos bigint;
  v_alertas bigint;
begin
  v_usuario_autenticado := auth.uid();

  if v_usuario_autenticado is null then
    raise exception 'Usuario nao autenticado.';
  end if;

  if p_produto_id is null then
    raise exception 'Produto obrigatorio.';
  end if;

  select membro.dono_id
    into v_dono_id
  from public.membros membro
  where membro.user_id = v_usuario_autenticado
    and membro.status = 'ativo'
  order by membro.created_at desc
  limit 1;

  v_dono_id := coalesce(v_dono_id, v_usuario_autenticado);

  select produto.*
    into v_produto
  from public.produtos produto
  where produto.id = p_produto_id
    and produto.usuario_id = v_dono_id
  for update;

  if not found then
    raise exception 'Produto nao encontrado ou nao pertence a esta conta.';
  end if;

  select count(*) into v_itens_venda
  from public.itens_venda item
  where item.produto_id = p_produto_id;

  select count(*) into v_movimentos
  from public.movimentos_estoque movimento
  where movimento.produto_id = p_produto_id;

  select count(*) into v_alertas
  from public.alertas alerta
  where alerta.produto_id = p_produto_id;

  if v_itens_venda > 0 or v_movimentos > 0 or v_alertas > 0 then
    raise exception
      'Este produto possui historico e nao pode ser excluido. Vendas: %, movimentos: %, alertas: %. Desative o produto.',
      v_itens_venda,
      v_movimentos,
      v_alertas;
  end if;

  delete from public.produtos produto
  where produto.id = p_produto_id
    and produto.usuario_id = v_dono_id;

  return jsonb_build_object(
    'produto_id', v_produto.id,
    'produto_nome', v_produto.nome,
    'excluido', true,
    'usuario_id', v_dono_id,
    'excluido_por', v_usuario_autenticado
  );
end;
$$;

revoke all on function public.excluir_produto_sem_historico(uuid) from public;
revoke all on function public.excluir_produto_sem_historico(uuid) from anon;
grant execute on function public.excluir_produto_sem_historico(uuid) to authenticated;

comment on function public.excluir_produto_sem_historico(uuid)
is 'Exclui produto somente quando nao ha vendas, movimentos de estoque ou alertas associados.';
