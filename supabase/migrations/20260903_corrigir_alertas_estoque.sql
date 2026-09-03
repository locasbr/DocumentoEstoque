create or replace function public.verificar_estoque_minimo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario_id uuid;
  v_tipo_alerta text;
  v_alerta_id uuid;
begin
  v_usuario_id := new.usuario_id;

  if v_usuario_id is null then
    raise exception
      'O produto % não possui usuário responsável.',
      new.id;
  end if;

  -- Produto voltou ao nível normal.
  if
    new.quantidade_minima <= 0
    or new.quantidade_atual >= new.quantidade_minima
  then
    update public.alertas
    set visualizado = true
    where produto_id = new.id
      and usuario_id = v_usuario_id
      and visualizado is not true;

    return new;
  end if;

  v_tipo_alerta :=
    case
      when new.quantidade_atual <= 0
        then 'estoque_critico'
      else 'estoque_baixo'
    end;

  select alerta.id
  into v_alerta_id
  from public.alertas as alerta
  where alerta.produto_id = new.id
    and alerta.usuario_id = v_usuario_id
    and alerta.visualizado is not true
  order by alerta.criado_em desc
  limit 1
  for update;

  if v_alerta_id is not null then
    update public.alertas
    set tipo_alerta = v_tipo_alerta
    where id = v_alerta_id;
  else
    insert into public.alertas (
      produto_id,
      usuario_id,
      tipo_alerta,
      visualizado
    )
    values (
      new.id,
      v_usuario_id,
      v_tipo_alerta,
      false
    );
  end if;

  return new;
end;
$$;