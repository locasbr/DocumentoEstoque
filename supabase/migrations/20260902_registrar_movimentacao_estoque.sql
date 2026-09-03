-- Registra entrada ou saída de estoque de forma transacional.
-- Se qualquer etapa falhar, nenhuma alteração é confirmada.

create or replace function public.registrar_movimentacao_estoque(
  p_produto_id uuid,
  p_tipo_movimento text,
  p_quantidade integer,
  p_motivo text
)
returns table (
  movimento_id uuid,
  produto_id uuid,
  quantidade_anterior integer,
  quantidade_movimentada integer,
  nova_quantidade integer,
  tipo_movimento text
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_usuario_id uuid;
  v_produto public.produtos%rowtype;
  v_nova_quantidade integer;
  v_movimento_id uuid;
begin
  -- Identifica quem está chamando a função.
  v_usuario_id := auth.uid();

  if v_usuario_id is null then
    raise exception 'Usuário não autenticado.';
  end if;

  -- Valida o tipo de movimentação.
  if p_tipo_movimento not in ('entrada', 'saida') then
    raise exception 'Tipo de movimentação inválido.';
  end if;

  -- A quantidade precisa ser inteira e positiva.
  if p_quantidade is null or p_quantidade <= 0 then
    raise exception 'A quantidade deve ser maior que zero.';
  end if;

  -- O motivo é obrigatório.
  if p_motivo is null or length(trim(p_motivo)) = 0 then
    raise exception 'O motivo da movimentação é obrigatório.';
  end if;

  if length(p_motivo) > 500 then
    raise exception 'O motivo da movimentação é muito longo.';
  end if;

  -- Busca e bloqueia o produto durante a transação.
  -- Como a função é SECURITY INVOKER, as políticas RLS continuam valendo.
  select produto.*
  into v_produto
  from public.produtos as produto
  where produto.id = p_produto_id
    and produto.ativo is not false
  for update;

  if not found then
    raise exception 'Produto não encontrado ou acesso não permitido.';
  end if;

  -- Calcula o novo saldo.
  if p_tipo_movimento = 'entrada' then
    v_nova_quantidade :=
      v_produto.quantidade_atual + p_quantidade;
  else
    if p_quantidade > v_produto.quantidade_atual then
      raise exception
        'Estoque insuficiente. Disponível: % unidade(s).',
        v_produto.quantidade_atual;
    end if;

    v_nova_quantidade :=
      v_produto.quantidade_atual - p_quantidade;
  end if;

  -- Proteção adicional contra estoque negativo.
  if v_nova_quantidade < 0 then
    raise exception 'A movimentação deixaria o estoque negativo.';
  end if;

  -- Atualiza o saldo.
  update public.produtos
  set
    quantidade_atual = v_nova_quantidade,
    atualizado_em = now()
  where id = v_produto.id;

  -- Registra o histórico.
  insert into public.movimentos_estoque (
    produto_id,
    tipo_movimento,
    quantidade,
    motivo,
    usuario_id
  )
  values (
    v_produto.id,
    p_tipo_movimento,
    p_quantidade,
    trim(p_motivo),
    v_usuario_id
  )
  returning id into v_movimento_id;

  return query
  select
    v_movimento_id,
    v_produto.id,
    v_produto.quantidade_atual,
    p_quantidade,
    v_nova_quantidade,
    p_tipo_movimento;
end;
$$;

-- Somente usuários autenticados podem chamar a função.
revoke all
on function public.registrar_movimentacao_estoque(
  uuid,
  text,
  integer,
  text
)
from public;

revoke all
on function public.registrar_movimentacao_estoque(
  uuid,
  text,
  integer,
  text
)
from anon;

grant execute
on function public.registrar_movimentacao_estoque(
  uuid,
  text,
  integer,
  text
)
to authenticated;

comment on function public.registrar_movimentacao_estoque(
  uuid,
  text,
  integer,
  text
)
is
'Registra uma movimentação e atualiza o saldo em uma única transação; os alertas são mantidos pelo gatilho de estoque.';