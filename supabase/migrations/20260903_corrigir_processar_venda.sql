-- Corrige o processamento do PDV para executar toda a venda em uma unica transacao.
-- A funcao identifica o usuario autenticado, resolve o dono da conta,
-- valida cliente, itens, estoque, desconto e pagamento, cria venda e itens,
-- baixa o estoque e registra os movimentos.
-- Os alertas sao mantidos pelo trigger verificar_estoque_minimo().

-- Remove a assinatura antiga para impedir que o frontend continue enviando
-- p_usuario_id e para evitar funcoes sobrecarregadas com o mesmo nome.
drop function if exists public.processar_venda(uuid, jsonb, text, numeric);

create or replace function public.processar_venda(
  p_itens jsonb,
  p_forma_pagamento text,
  p_desconto numeric default 0,
  p_valor_recebido numeric default null,
  p_cliente_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario_autenticado uuid;
  v_dono_id uuid;
  v_item jsonb;
  v_produto public.produtos%rowtype;
  v_venda_id uuid;
  v_numero_venda text;
  v_quantidade integer;
  v_preco_unitario numeric;
  v_subtotal_item numeric;
  v_subtotal numeric := 0;
  v_desconto numeric := 0;
  v_total numeric := 0;
  v_valor_recebido numeric;
  v_troco numeric;
  v_itens_resultado jsonb := '[]'::jsonb;
  v_total_itens integer;
  v_itens_distintos integer;
begin
  v_usuario_autenticado := auth.uid();

  if v_usuario_autenticado is null then
    raise exception 'Usuario nao autenticado.';
  end if;

  -- Se a pessoa autenticada for membro ativo, usa o dono_id como escopo.
  -- Caso contrario, considera a propria pessoa como dona da conta.
  select membro.dono_id
  into v_dono_id
  from public.membros as membro
  where membro.user_id = v_usuario_autenticado
    and membro.status = 'ativo'
  order by membro.created_at desc
  limit 1;

  v_dono_id := coalesce(v_dono_id, v_usuario_autenticado);

  if p_itens is null
    or jsonb_typeof(p_itens) <> 'array'
    or jsonb_array_length(p_itens) = 0
  then
    raise exception 'A venda precisa ter pelo menos um item.';
  end if;

  if jsonb_array_length(p_itens) > 100 then
    raise exception 'A venda excede o limite de 100 itens diferentes.';
  end if;

  select
    count(*),
    count(distinct item->>'produto_id')
  into
    v_total_itens,
    v_itens_distintos
  from jsonb_array_elements(p_itens) as item;

  if v_total_itens <> v_itens_distintos then
    raise exception 'Existem produtos duplicados na venda.';
  end if;

  p_forma_pagamento := nullif(trim(p_forma_pagamento), '');

  if p_forma_pagamento is null then
    raise exception 'A forma de pagamento e obrigatoria.';
  end if;

  if p_forma_pagamento not in (
    'Dinheiro',
    'Pix',
    'Cartao Debito',
    'Cartao Credito',
    'Cartão Débito',
    'Cartão Crédito'
  ) then
    raise exception 'Forma de pagamento invalida.';
  end if;

  v_desconto := coalesce(p_desconto, 0);

  if v_desconto < 0 then
    raise exception 'O desconto nao pode ser negativo.';
  end if;

  -- Confirma que o cliente pertence a mesma conta da venda.
  if p_cliente_id is not null then
    perform 1
    from public.clientes as cliente
    where cliente.id = p_cliente_id
      and cliente.usuario_id = v_dono_id;

    if not found then
      raise exception 'Cliente nao encontrado ou nao pertence a esta conta.';
    end if;
  end if;

  -- Valida e bloqueia todos os produtos em ordem fixa para reduzir risco
  -- de deadlock quando duas vendas forem processadas ao mesmo tempo.
  for v_item in
    select item
    from jsonb_array_elements(p_itens) as item
    order by item->>'produto_id'
  loop
    if jsonb_typeof(v_item) <> 'object' then
      raise exception 'Item da venda invalido.';
    end if;

    begin
      v_quantidade := (v_item->>'quantidade')::integer;
    exception
      when others then
        raise exception 'Quantidade invalida em um dos itens.';
    end;

    if v_quantidade is null or v_quantidade <= 0 then
      raise exception 'A quantidade de cada item deve ser maior que zero.';
    end if;

    begin
      select produto.*
      into v_produto
      from public.produtos as produto
      where produto.id = (v_item->>'produto_id')::uuid
        and produto.usuario_id = v_dono_id
        and produto.ativo is not false
      for update;
    exception
      when invalid_text_representation then
        raise exception 'Identificador de produto invalido.';
    end;

    if not found then
      raise exception 'Produto nao encontrado ou nao pertence a esta conta.';
    end if;

    if v_produto.quantidade_atual < v_quantidade then
      raise exception
        'Estoque insuficiente para %. Disponivel: % unidade(s).',
        v_produto.nome,
        v_produto.quantidade_atual;
    end if;

    -- O preco confiavel vem do banco. Qualquer preco enviado pelo navegador
    -- e ignorado para impedir manipulacao do total da venda.
    v_preco_unitario := v_produto.preco_venda;

    if v_preco_unitario is null or v_preco_unitario < 0 then
      raise exception 'O produto % possui preco de venda invalido.', v_produto.nome;
    end if;

    v_subtotal_item := round(v_quantidade * v_preco_unitario, 2);
    v_subtotal := v_subtotal + v_subtotal_item;
  end loop;

  v_subtotal := round(v_subtotal, 2);
  v_desconto := round(v_desconto, 2);

  if v_desconto > v_subtotal then
    raise exception 'O desconto nao pode ser maior que o subtotal.';
  end if;

  v_total := round(v_subtotal - v_desconto, 2);

  if p_forma_pagamento = 'Dinheiro' then
    if p_valor_recebido is null then
      raise exception 'Informe o valor recebido em dinheiro.';
    end if;

    v_valor_recebido := round(p_valor_recebido, 2);

    if v_valor_recebido < v_total then
      raise exception
        'Valor recebido insuficiente. Total da venda: R$ %.',
        to_char(v_total, 'FM999999990D00');
    end if;

    v_troco := round(v_valor_recebido - v_total, 2);
  else
    v_valor_recebido := null;
    v_troco := null;
  end if;

  v_numero_venda :=
    'PDV-' ||
    to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS') ||
    '-' ||
    substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);

  insert into public.vendas (
    numero_venda,
    usuario_id,
    subtotal,
    desconto,
    total,
    forma_pagamento,
    valor_recebido,
    troco,
    cliente_id
  )
  values (
    v_numero_venda,
    v_dono_id,
    v_subtotal,
    v_desconto,
    v_total,
    p_forma_pagamento,
    v_valor_recebido,
    v_troco,
    p_cliente_id
  )
  returning id into v_venda_id;

  -- Grava os itens, baixa o estoque e cria o historico na mesma transacao.
  for v_item in
    select item
    from jsonb_array_elements(p_itens) as item
    order by item->>'produto_id'
  loop
    v_quantidade := (v_item->>'quantidade')::integer;

    select produto.*
    into v_produto
    from public.produtos as produto
    where produto.id = (v_item->>'produto_id')::uuid
      and produto.usuario_id = v_dono_id
      and produto.ativo is not false;

    v_preco_unitario := v_produto.preco_venda;
    v_subtotal_item := round(v_quantidade * v_preco_unitario, 2);

    insert into public.itens_venda (
      venda_id,
      produto_id,
      nome_produto,
      sku,
      quantidade,
      preco_unitario,
      subtotal
    )
    values (
      v_venda_id,
      v_produto.id,
      v_produto.nome,
      v_produto.sku,
      v_quantidade,
      v_preco_unitario,
      v_subtotal_item
    );

    update public.produtos
    set
      quantidade_atual = quantidade_atual - v_quantidade,
      atualizado_em = now()
    where id = v_produto.id
      and usuario_id = v_dono_id;

    insert into public.movimentos_estoque (
      produto_id,
      tipo_movimento,
      quantidade,
      motivo,
      usuario_id
    )
    values (
      v_produto.id,
      'saida',
      v_quantidade,
      v_numero_venda,
      v_dono_id
    );

    v_itens_resultado :=
      v_itens_resultado ||
      jsonb_build_array(
        jsonb_build_object(
          'produto_id', v_produto.id,
          'nome', v_produto.nome,
          'sku', v_produto.sku,
          'quantidade', v_quantidade,
          'preco_unitario', v_preco_unitario,
          'subtotal', v_subtotal_item
        )
      );
  end loop;

  return jsonb_build_object(
    'venda_id', v_venda_id,
    'numero_venda', v_numero_venda,
    'usuario_id', v_dono_id,
    'realizado_por', v_usuario_autenticado,
    'cliente_id', p_cliente_id,
    'subtotal', v_subtotal,
    'desconto', v_desconto,
    'total', v_total,
    'forma_pagamento', p_forma_pagamento,
    'valor_recebido', v_valor_recebido,
    'troco', v_troco,
    'itens', v_itens_resultado
  );
end;
$$;

revoke all
on function public.processar_venda(jsonb, text, numeric, numeric, uuid)
from public;

revoke all
on function public.processar_venda(jsonb, text, numeric, numeric, uuid)
from anon;

grant execute
on function public.processar_venda(jsonb, text, numeric, numeric, uuid)
to authenticated;

comment on function public.processar_venda(jsonb, text, numeric, numeric, uuid)
is
'Processa uma venda do PDV em uma unica transacao, usando auth.uid(), precos do banco e escopo do dono da conta.';
