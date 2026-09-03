-- Lista clientes com saldo de fiado e remove somente clientes sem historico.
-- As duas funcoes resolvem o dono da conta a partir de auth.uid().

create or replace function public.listar_clientes_com_saldo()
returns table (
  id uuid,
  nome text,
  telefone text,
  cpf text,
  email text,
  endereco text,
  notas text,
  criado_em timestamptz,
  saldo_fiado numeric,
  quantidade_lancamentos bigint,
  quantidade_vendas bigint
)
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
  from public.membros as membro
  where membro.user_id = v_usuario_autenticado
    and membro.status = 'ativo'
  order by membro.created_at desc
  limit 1;

  v_dono_id := coalesce(v_dono_id, v_usuario_autenticado);

  return query
  select
    cliente.id,
    cliente.nome,
    nullif(cliente.telefone, ''),
    nullif(cliente.cpf, ''),
    nullif(cliente.email, ''),
    nullif(cliente.endereco, ''),
    nullif(cliente.notas, ''),
    cliente.criado_em,
    round(coalesce(fiado_resumo.saldo, 0), 2) as saldo_fiado,
    coalesce(fiado_resumo.quantidade, 0)::bigint as quantidade_lancamentos,
    coalesce(vendas_resumo.quantidade, 0)::bigint as quantidade_vendas
  from public.clientes as cliente
  left join lateral (
    select
      sum(
        case
          when lancamento.tipo = 'debito' then lancamento.valor
          when lancamento.tipo = 'pagamento' then -lancamento.valor
          else 0
        end
      ) as saldo,
      count(*) as quantidade
    from public.fiado as lancamento
    where lancamento.cliente_id = cliente.id
      and lancamento.usuario_id = v_dono_id
  ) as fiado_resumo on true
  left join lateral (
    select count(*) as quantidade
    from public.vendas as venda
    where venda.cliente_id = cliente.id
      and venda.usuario_id = v_dono_id
  ) as vendas_resumo on true
  where cliente.usuario_id = v_dono_id
  order by cliente.nome asc, cliente.id asc;
end;
$$;

revoke all on function public.listar_clientes_com_saldo() from public;
revoke all on function public.listar_clientes_com_saldo() from anon;
grant execute on function public.listar_clientes_com_saldo() to authenticated;

comment on function public.listar_clientes_com_saldo()
is 'Lista clientes da conta autenticada com saldo de fiado e contagens de historico.';


create or replace function public.excluir_cliente_sem_historico(
  p_cliente_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario_autenticado uuid;
  v_dono_id uuid;
  v_cliente public.clientes%rowtype;
  v_quantidade_fiado bigint;
  v_quantidade_vendas bigint;
begin
  v_usuario_autenticado := auth.uid();

  if v_usuario_autenticado is null then
    raise exception 'Usuario nao autenticado.';
  end if;

  select membro.dono_id
  into v_dono_id
  from public.membros as membro
  where membro.user_id = v_usuario_autenticado
    and membro.status = 'ativo'
  order by membro.created_at desc
  limit 1;

  v_dono_id := coalesce(v_dono_id, v_usuario_autenticado);

  if p_cliente_id is null then
    raise exception 'Cliente obrigatorio.';
  end if;

  select cliente.*
  into v_cliente
  from public.clientes as cliente
  where cliente.id = p_cliente_id
    and cliente.usuario_id = v_dono_id
  for update;

  if not found then
    raise exception 'Cliente nao encontrado ou nao pertence a esta conta.';
  end if;

  select count(*)
  into v_quantidade_fiado
  from public.fiado as lancamento
  where lancamento.cliente_id = p_cliente_id;

  select count(*)
  into v_quantidade_vendas
  from public.vendas as venda
  where venda.cliente_id = p_cliente_id;

  if v_quantidade_fiado > 0 or v_quantidade_vendas > 0 then
    raise exception
      'Este cliente possui historico e nao pode ser excluido. Fiado: %, vendas: %.',
      v_quantidade_fiado,
      v_quantidade_vendas;
  end if;

  delete from public.clientes as cliente
  where cliente.id = p_cliente_id
    and cliente.usuario_id = v_dono_id;

  return jsonb_build_object(
    'cliente_id', v_cliente.id,
    'cliente_nome', v_cliente.nome,
    'excluido', true,
    'usuario_id', v_dono_id,
    'excluido_por', v_usuario_autenticado
  );
end;
$$;

revoke all on function public.excluir_cliente_sem_historico(uuid) from public;
revoke all on function public.excluir_cliente_sem_historico(uuid) from anon;
grant execute on function public.excluir_cliente_sem_historico(uuid) to authenticated;

comment on function public.excluir_cliente_sem_historico(uuid)
is 'Exclui cliente da conta somente quando nao existem vendas nem lancamentos de fiado.';
