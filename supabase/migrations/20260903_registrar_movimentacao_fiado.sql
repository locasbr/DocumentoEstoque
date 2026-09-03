-- Centraliza debitos e pagamentos de fiado em uma operacao segura.
-- A funcao resolve o dono da conta, valida o cliente, bloqueia operacoes
-- simultaneas e impede pagamentos acima do saldo devedor.

create or replace function public.registrar_movimentacao_fiado(
  p_cliente_id uuid,
  p_tipo text,
  p_valor numeric,
  p_descricao text default null
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
  v_tipo text;
  v_valor numeric;
  v_descricao text;
  v_saldo_anterior numeric := 0;
  v_saldo_atual numeric := 0;
  v_lancamento_id uuid;
begin
  v_usuario_autenticado := auth.uid();

  if v_usuario_autenticado is null then
    raise exception 'Usuario nao autenticado.';
  end if;

  -- Funcionarios ativos operam no escopo do dono.
  select membro.dono_id
  into v_dono_id
  from public.membros as membro
  where membro.user_id = v_usuario_autenticado
    and membro.status = 'ativo'
  order by membro.created_at desc
  limit 1;

  v_dono_id := coalesce(v_dono_id, v_usuario_autenticado);
  v_tipo := lower(trim(coalesce(p_tipo, '')));
  v_valor := round(coalesce(p_valor, 0), 2);
  v_descricao := nullif(left(trim(coalesce(p_descricao, '')), 200), '');

  if p_cliente_id is null then
    raise exception 'Cliente obrigatorio.';
  end if;

  if v_tipo not in ('debito', 'pagamento') then
    raise exception 'Tipo de movimentacao invalido.';
  end if;

  if v_valor <= 0 then
    raise exception 'O valor deve ser maior que zero.';
  end if;

  -- O bloqueio da linha do cliente serializa movimentacoes simultaneas
  -- para o mesmo cliente durante toda a transacao.
  select cliente.*
  into v_cliente
  from public.clientes as cliente
  where cliente.id = p_cliente_id
    and cliente.usuario_id = v_dono_id
  for update;

  if not found then
    raise exception 'Cliente nao encontrado ou nao pertence a esta conta.';
  end if;

  select coalesce(
    sum(
      case
        when lancamento.tipo = 'debito' then lancamento.valor
        when lancamento.tipo = 'pagamento' then -lancamento.valor
        else 0
      end
    ),
    0
  )
  into v_saldo_anterior
  from public.fiado as lancamento
  where lancamento.cliente_id = p_cliente_id
    and lancamento.usuario_id = v_dono_id;

  v_saldo_anterior := round(v_saldo_anterior, 2);

  if v_tipo = 'pagamento' then
    if v_saldo_anterior <= 0 then
      raise exception 'O cliente nao possui saldo devedor.';
    end if;

    if v_valor > v_saldo_anterior then
      raise exception
        'O pagamento nao pode ultrapassar o saldo devedor de R$ %.',
        to_char(v_saldo_anterior, 'FM999999990D00');
    end if;
  end if;

  insert into public.fiado (
    cliente_id,
    usuario_id,
    tipo,
    valor,
    descricao
  )
  values (
    p_cliente_id,
    v_dono_id,
    v_tipo,
    v_valor,
    coalesce(v_descricao, '')
  )
  returning id into v_lancamento_id;

  v_saldo_atual := round(
    case
      when v_tipo = 'debito' then v_saldo_anterior + v_valor
      else v_saldo_anterior - v_valor
    end,
    2
  );

  return jsonb_build_object(
    'lancamento_id', v_lancamento_id,
    'cliente_id', v_cliente.id,
    'cliente_nome', v_cliente.nome,
    'tipo', v_tipo,
    'valor', v_valor,
    'descricao', coalesce(v_descricao, ''),
    'saldo_anterior', v_saldo_anterior,
    'saldo_atual', v_saldo_atual,
    'usuario_id', v_dono_id,
    'realizado_por', v_usuario_autenticado
  );
end;
$$;

revoke all
on function public.registrar_movimentacao_fiado(uuid, text, numeric, text)
from public;

revoke all
on function public.registrar_movimentacao_fiado(uuid, text, numeric, text)
from anon;

grant execute
on function public.registrar_movimentacao_fiado(uuid, text, numeric, text)
to authenticated;

comment on function public.registrar_movimentacao_fiado(uuid, text, numeric, text)
is
'Registra debito ou pagamento de fiado no escopo do dono e impede pagamento acima do saldo devedor.';
  