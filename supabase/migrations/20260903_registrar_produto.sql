-- Cadastro transacional de produto para o EstoqueSystem.
-- Requer as tabelas public.produtos, public.movimentos_estoque,
-- public.perfis e public.membros.

-- Validacao preventiva da estrutura usada pela funcao.
do $$
declare
  v_coluna text;
  v_colunas_movimento text[] := array[
    'produto_id',
    'usuario_id',
    'tipo_movimento',
    'quantidade'
  ];
begin
  foreach v_coluna in array v_colunas_movimento loop
    if not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'movimentos_estoque'
        and column_name = v_coluna
    ) then
      raise exception
        'A coluna public.movimentos_estoque.% nao existe. Revise a estrutura antes de criar registrar_produto.',
        v_coluna;
    end if;
  end loop;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'perfis'
      and column_name = 'tipo_plano'
  ) then
    raise exception 'A coluna public.perfis.tipo_plano nao existe.';
  end if;
end;
$$;

create or replace function public.registrar_produto(
  p_nome text,
  p_descricao text default null,
  p_marca text default null,
  p_sku text default null,
  p_categoria text default null,
  p_quantidade_inicial integer default 0,
  p_quantidade_minima integer default 10,
  p_preco_custo numeric default 0,
  p_preco_venda numeric default 0,
  p_data_validade date default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario_autenticado uuid;
  v_dono_id uuid;
  v_nome text;
  v_descricao text;
  v_marca text;
  v_sku text;
  v_categoria text;
  v_quantidade_inicial integer;
  v_quantidade_minima integer;
  v_preco_custo numeric;
  v_preco_venda numeric;
  v_data_validade date;
  v_tipo_plano text;
  v_is_admin boolean := false;
  v_limite_produtos integer;
  v_total_produtos integer;
  v_tem_validade boolean;
  v_produto_id uuid;
  v_criado_em timestamp;
  v_movimento_id uuid;
begin
  v_usuario_autenticado := auth.uid();

  if v_usuario_autenticado is null then
    raise exception 'Usuario nao autenticado.';
  end if;

  -- Membro ativo opera dentro da conta do dono.
  select membro.dono_id
    into v_dono_id
  from public.membros membro
  where membro.user_id = v_usuario_autenticado
    and membro.status = 'ativo'
  order by membro.created_at desc
  limit 1;

  v_dono_id := coalesce(v_dono_id, v_usuario_autenticado);

  -- Normalizacao.
  v_nome := nullif(
    left(regexp_replace(trim(coalesce(p_nome, '')), '\s+', ' ', 'g'), 255),
    ''
  );
  v_descricao := nullif(left(trim(coalesce(p_descricao, '')), 500), '');
  v_marca := nullif(
    left(regexp_replace(trim(coalesce(p_marca, '')), '\s+', ' ', 'g'), 120),
    ''
  );
  v_sku := nullif(left(trim(coalesce(p_sku, '')), 100), '');
  v_categoria := nullif(left(trim(coalesce(p_categoria, '')), 120), '');
  v_quantidade_inicial := coalesce(p_quantidade_inicial, 0);
  v_quantidade_minima := coalesce(p_quantidade_minima, 10);
  v_preco_custo := round(coalesce(p_preco_custo, 0), 2);
  v_preco_venda := round(coalesce(p_preco_venda, 0), 2);
  v_data_validade := p_data_validade;

  if v_nome is null then
    raise exception 'Informe o nome do produto.';
  end if;

  if char_length(v_nome) < 2 then
    raise exception 'O nome do produto deve ter pelo menos 2 caracteres.';
  end if;

  if v_sku is null then
    raise exception 'Informe o SKU ou codigo de barras.';
  end if;

  if v_quantidade_inicial < 0 then
    raise exception 'A quantidade inicial nao pode ser negativa.';
  end if;

  if v_quantidade_minima < 0 then
    raise exception 'O estoque minimo nao pode ser negativo.';
  end if;

  if v_preco_custo < 0 then
    raise exception 'O preco de custo nao pode ser negativo.';
  end if;

  if v_preco_venda <= 0 then
    raise exception 'O preco de venda deve ser maior que zero.';
  end if;

  -- Serializa cadastros da conta para proteger limite e SKU concorrentes.
  perform pg_advisory_xact_lock(hashtextextended(v_dono_id::text, 1));

  select
    lower(coalesce(perfil.tipo_plano, perfil.plano, 'iniciante')),
    coalesce(perfil.is_admin, false)
  into
    v_tipo_plano,
    v_is_admin
  from public.perfis perfil
  where perfil.id = v_dono_id
  limit 1;

  if not found then
    raise exception 'Perfil da conta nao encontrado.';
  end if;

  -- Limites alinhados aos planos atuais do EstoqueSystem.
  -- Admin permanece ilimitado para administracao e testes.
  v_limite_produtos := case v_tipo_plano
    when 'iniciante' then 100
    when 'profissional' then 1000
    when 'negocio' then 10000
    else 100
  end;

  if not v_is_admin then
    select count(*)
      into v_total_produtos
    from public.produtos produto
    where produto.usuario_id = v_dono_id;

    if v_total_produtos >= v_limite_produtos then
      raise exception
        'Limite de % produtos atingido no plano %. Faca upgrade para continuar.',
        v_limite_produtos,
        initcap(v_tipo_plano);
    end if;
  end if;

  -- Validade disponivel nos planos Profissional e Negocio.
  v_tem_validade := v_is_admin or v_tipo_plano in ('profissional', 'negocio');

  if v_data_validade is not null and not v_tem_validade then
    raise exception 'Controle de validade nao esta disponivel no plano atual.';
  end if;

  if exists (
    select 1
    from public.produtos produto
    where produto.usuario_id = v_dono_id
      and lower(trim(produto.sku)) = lower(v_sku)
  ) then
    raise exception 'Este SKU ou codigo de barras ja esta cadastrado nesta conta.';
  end if;

  insert into public.produtos (
    nome,
    descricao,
    marca,
    sku,
    categoria,
    quantidade_atual,
    quantidade_minima,
    preco_custo,
    preco_venda,
    data_validade,
    ativo,
    usuario_id
  )
  values (
    v_nome,
    v_descricao,
    coalesce(v_marca, ''),
    v_sku,
    v_categoria,
    v_quantidade_inicial,
    v_quantidade_minima,
    v_preco_custo,
    v_preco_venda,
    v_data_validade,
    true,
    v_dono_id
  )
  returning id, criado_em
    into v_produto_id, v_criado_em;

  -- Registra o saldo inicial sem alterar novamente produtos.quantidade_atual.
  -- O tipo 'entrada' deve estar permitido por movimentos_estoque_tipo_movimento_check.
  if v_quantidade_inicial > 0 then
    insert into public.movimentos_estoque (
      produto_id,
      usuario_id,
      tipo_movimento,
      quantidade
    )
    values (
      v_produto_id,
      v_dono_id,
      'entrada',
      v_quantidade_inicial
    )
    returning id into v_movimento_id;
  end if;

  return jsonb_build_object(
    'id', v_produto_id,
    'nome', v_nome,
    'sku', v_sku,
    'quantidade_atual', v_quantidade_inicial,
    'quantidade_minima', v_quantidade_minima,
    'preco_custo', v_preco_custo,
    'preco_venda', v_preco_venda,
    'data_validade', v_data_validade,
    'ativo', true,
    'usuario_id', v_dono_id,
    'cadastrado_por', v_usuario_autenticado,
    'movimento_inicial_id', v_movimento_id,
    'criado_em', v_criado_em
  );
end;
$$;

revoke all
on function public.registrar_produto(
  text, text, text, text, text, integer, integer, numeric, numeric, date
)
from public;

revoke all
on function public.registrar_produto(
  text, text, text, text, text, integer, integer, numeric, numeric, date
)
from anon;

grant execute
on function public.registrar_produto(
  text, text, text, text, text, integer, integer, numeric, numeric, date
)
to authenticated;

comment on function public.registrar_produto(
  text, text, text, text, text, integer, integer, numeric, numeric, date
)
is
'Cadastra produto no escopo do dono, aplica limite do plano, valida SKU por conta e registra a entrada inicial na mesma transacao.';
