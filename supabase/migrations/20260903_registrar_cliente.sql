-- Cadastra clientes de forma segura no escopo do dono da conta.
-- O navegador nao envia usuario_id. A funcao usa auth.uid(), resolve membros
-- ativos, normaliza os dados e impede CPF, telefone ou e-mail duplicados.

create or replace function public.registrar_cliente(
  p_nome text,
  p_telefone text default null,
  p_cpf text default null,
  p_email text default null,
  p_endereco text default null,
  p_notas text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario_autenticado uuid;
  v_dono_id uuid;
  v_cliente_id uuid;
  v_criado_em timestamptz;

  v_nome text;
  v_telefone text;
  v_cpf text;
  v_email text;
  v_endereco text;
  v_notas text;

  v_soma integer;
  v_resto integer;
  v_digito_1 integer;
  v_digito_2 integer;
  v_indice integer;
begin
  v_usuario_autenticado := auth.uid();

  if v_usuario_autenticado is null then
    raise exception 'Usuario nao autenticado.';
  end if;

  -- Funcionarios ativos cadastram clientes no escopo do dono.
  select membro.dono_id
  into v_dono_id
  from public.membros as membro
  where membro.user_id = v_usuario_autenticado
    and membro.status = 'ativo'
  order by membro.created_at desc
  limit 1;

  v_dono_id := coalesce(v_dono_id, v_usuario_autenticado);

  -- Normalizacao e limites de tamanho.
  v_nome := nullif(left(regexp_replace(trim(coalesce(p_nome, '')), '\s+', ' ', 'g'), 120), '');
  v_telefone := nullif(regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g'), '');
  v_cpf := nullif(regexp_replace(coalesce(p_cpf, ''), '\D', '', 'g'), '');
  v_email := nullif(lower(trim(coalesce(p_email, ''))), '');
  v_endereco := nullif(left(regexp_replace(trim(coalesce(p_endereco, '')), '\s+', ' ', 'g'), 250), '');
  v_notas := nullif(left(trim(coalesce(p_notas, '')), 500), '');

  if v_nome is null then
    raise exception 'O nome do cliente e obrigatorio.';
  end if;

  if char_length(v_nome) < 2 then
    raise exception 'O nome do cliente deve ter pelo menos 2 caracteres.';
  end if;

  if v_telefone is not null and char_length(v_telefone) not between 10 and 13 then
    raise exception 'Telefone invalido. Informe DDD e numero.';
  end if;

  if v_email is not null then
    if char_length(v_email) > 160 then
      raise exception 'O e-mail excede o limite de 160 caracteres.';
    end if;

    if v_email !~* '^[A-Z0-9.!#$%&''*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$' then
      raise exception 'E-mail invalido.';
    end if;
  end if;

  -- Validacao completa dos digitos verificadores do CPF.
  if v_cpf is not null then
    if char_length(v_cpf) <> 11 then
      raise exception 'CPF invalido. Informe 11 digitos.';
    end if;

    if v_cpf ~ '^([0-9])\1{10}$' then
      raise exception 'CPF invalido.';
    end if;

    v_soma := 0;
    for v_indice in 1..9 loop
      v_soma := v_soma + substring(v_cpf from v_indice for 1)::integer * (11 - v_indice);
    end loop;

    v_resto := (v_soma * 10) % 11;
    v_digito_1 := case when v_resto = 10 then 0 else v_resto end;

    if v_digito_1 <> substring(v_cpf from 10 for 1)::integer then
      raise exception 'CPF invalido.';
    end if;

    v_soma := 0;
    for v_indice in 1..10 loop
      v_soma := v_soma + substring(v_cpf from v_indice for 1)::integer * (12 - v_indice);
    end loop;

    v_resto := (v_soma * 10) % 11;
    v_digito_2 := case when v_resto = 10 then 0 else v_resto end;

    if v_digito_2 <> substring(v_cpf from 11 for 1)::integer then
      raise exception 'CPF invalido.';
    end if;
  end if;

  -- Serializa cadastros da mesma conta para impedir duplicidade concorrente.
  perform pg_advisory_xact_lock(hashtextextended(v_dono_id::text, 0));

  if v_cpf is not null and exists (
    select 1
    from public.clientes as cliente
    where cliente.usuario_id = v_dono_id
      and regexp_replace(coalesce(cliente.cpf, ''), '\D', '', 'g') = v_cpf
  ) then
    raise exception 'Ja existe um cliente com este CPF.';
  end if;

  if v_telefone is not null and exists (
    select 1
    from public.clientes as cliente
    where cliente.usuario_id = v_dono_id
      and regexp_replace(coalesce(cliente.telefone, ''), '\D', '', 'g') = v_telefone
  ) then
    raise exception 'Ja existe um cliente com este telefone.';
  end if;

  if v_email is not null and exists (
    select 1
    from public.clientes as cliente
    where cliente.usuario_id = v_dono_id
      and lower(trim(coalesce(cliente.email, ''))) = v_email
  ) then
    raise exception 'Ja existe um cliente com este e-mail.';
  end if;

  insert into public.clientes (
    usuario_id,
    nome,
    telefone,
    cpf,
    email,
    endereco,
    notas
  )
  values (
    v_dono_id,
    v_nome,
    coalesce(v_telefone, ''),
    coalesce(v_cpf, ''),
    coalesce(v_email, ''),
    coalesce(v_endereco, ''),
    coalesce(v_notas, '')
  )
  returning id, criado_em
  into v_cliente_id, v_criado_em;

  return jsonb_build_object(
    'id', v_cliente_id,
    'usuario_id', v_dono_id,
    'nome', v_nome,
    'telefone', coalesce(v_telefone, ''),
    'cpf', coalesce(v_cpf, ''),
    'email', coalesce(v_email, ''),
    'endereco', coalesce(v_endereco, ''),
    'notas', coalesce(v_notas, ''),
    'criado_em', v_criado_em,
    'cadastrado_por', v_usuario_autenticado
  );
end;
$$;

revoke all
on function public.registrar_cliente(text, text, text, text, text, text)
from public;

revoke all
on function public.registrar_cliente(text, text, text, text, text, text)
from anon;

grant execute
on function public.registrar_cliente(text, text, text, text, text, text)
to authenticated;

comment on function public.registrar_cliente(text, text, text, text, text, text)
is
'Cadastra cliente no escopo do dono, normaliza dados e impede CPF, telefone ou e-mail duplicados na mesma conta.';
