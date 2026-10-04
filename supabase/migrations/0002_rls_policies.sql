-- 1. Security Definer Helpers (bypasses RLS to prevent recursion)

create or replace function public.get_auth_user_role()
returns public.user_role as $$
declare
  r public.user_role;
begin
  select role into r from public.usuarios where id = auth.uid();
  return r;
end;
$$ language plpgsql security definer;

create or replace function public.is_active_user()
returns boolean as $$
declare
  u_ativo boolean;
begin
  select ativo into u_ativo
  from public.usuarios
  where id = auth.uid();
  
  if u_ativo = false or u_ativo is null then
    return false;
  end if;
  
  return true;
end;
$$ language plpgsql security definer;

create or replace function public.is_subordinate(supervisor_id_param uuid, subordinate_id_param uuid)
returns boolean as $$
declare
  is_sub boolean;
begin
  if supervisor_id_param = subordinate_id_param then
    return true;
  end if;

  with recursive subordinates as (
    select id, supervisor_id from public.usuarios where id = supervisor_id_param
    union all
    select u.id, u.supervisor_id from public.usuarios u
    inner join subordinates s on u.supervisor_id = s.id
  )
  select exists(select 1 from subordinates where id = subordinate_id_param) into is_sub;
  return is_sub;
end;
$$ language plpgsql security definer;

-- 2. Row Level Security Policies

-- usuarios
alter table public.usuarios enable row level security;

create policy "usuarios_select" on public.usuarios
  for select using (
    public.get_auth_user_role() = 'master'
    or public.is_subordinate(auth.uid(), id)
    or supervisor_id = auth.uid()
  );

create policy "usuarios_write" on public.usuarios
  for all using (
    public.get_auth_user_role() = 'master'
    or public.is_subordinate(auth.uid(), id)
  );

-- administradoras
alter table public.administradoras enable row level security;

create policy "administradoras_select" on public.administradoras
  for select using (auth.uid() is not null);

create policy "administradoras_all_admin" on public.administradoras
  for all using (public.get_auth_user_role() = 'master');

-- leads
alter table public.leads enable row level security;

create policy "leads_select" on public.leads
  for select using (
    public.get_auth_user_role() = 'master'
    or (
      public.is_active_user()
      and public.is_subordinate(auth.uid(), vendedor_id)
    )
  );

create policy "leads_write" on public.leads
  for all using (
    public.get_auth_user_role() = 'master'
    or (
      public.is_active_user()
      and public.is_subordinate(auth.uid(), vendedor_id)
    )
  );

-- simulacoes
alter table public.simulacoes enable row level security;

create policy "simulacoes_select" on public.simulacoes
  for select using (
    public.get_auth_user_role() = 'master'
    or (
      public.is_active_user()
      and public.is_subordinate(auth.uid(), vendedor_id)
    )
  );

create policy "simulacoes_write" on public.simulacoes
  for all using (
    public.get_auth_user_role() = 'master'
    or (
      public.is_active_user()
      and public.is_subordinate(auth.uid(), vendedor_id)
    )
  );

-- simulacao_cotas
alter table public.simulacao_cotas enable row level security;

create policy "simulacao_cotas_all" on public.simulacao_cotas
  for all using (
    exists (
      select 1 from public.simulacoes s
      where s.id = simulacao_id
    )
  );

-- propostas
alter table public.propostas enable row level security;

create policy "propostas_select" on public.propostas
  for select using (
    public.get_auth_user_role() = 'master'
    or public_link is not null
    or (
      public.is_active_user()
      and public.is_subordinate(auth.uid(), vendedor_id)
    )
  );

create policy "propostas_write" on public.propostas
  for all using (
    public.get_auth_user_role() = 'master'
    or (
      public.is_active_user()
      and public.is_subordinate(auth.uid(), vendedor_id)
    )
  );

-- campanhas
alter table public.campanhas enable row level security;

create policy "campanhas_select" on public.campanhas
  for select using (
    public.get_auth_user_role() = 'master'
    or (
      public.is_active_user()
      and public.is_subordinate(auth.uid(), vendedor_id)
    )
  );

create policy "campanhas_write" on public.campanhas
  for all using (
    public.get_auth_user_role() = 'master'
    or (
      public.is_active_user()
      and public.is_subordinate(auth.uid(), vendedor_id)
    )
  );

-- followups
alter table public.followups enable row level security;

create policy "followups_select" on public.followups
  for select using (
    public.get_auth_user_role() = 'master'
    or (
      public.is_active_user()
      and public.is_subordinate(auth.uid(), vendedor_id)
    )
  );

create policy "followups_write" on public.followups
  for all using (
    public.get_auth_user_role() = 'master'
    or (
      public.is_active_user()
      and public.is_subordinate(auth.uid(), vendedor_id)
    )
  );

-- comissoes
alter table public.comissoes enable row level security;

create policy "comissoes_select" on public.comissoes
  for select using (
    public.get_auth_user_role() = 'master'
    or (
      public.is_active_user()
      and public.is_subordinate(auth.uid(), vendedor_id)
    )
  );

create policy "comissoes_write" on public.comissoes
  for all using (
    public.get_auth_user_role() = 'master'
    or (
      public.is_active_user()
      and public.is_subordinate(auth.uid(), vendedor_id)
    )
  );

-- metas
alter table public.metas enable row level security;

create policy "metas_select" on public.metas
  for select using (
    public.get_auth_user_role() = 'master'
    or (
      public.is_active_user()
      and public.is_subordinate(auth.uid(), vendedor_id)
    )
  );

create policy "metas_write" on public.metas
  for all using (
    public.get_auth_user_role() = 'master'
    or (
      public.is_active_user()
      and public.is_subordinate(auth.uid(), vendedor_id)
    )
  );

-- audit_logs
alter table public.audit_logs enable row level security;

create policy "audit_logs_select" on public.audit_logs
  for select using (
    public.get_auth_user_role() = 'master'
    or public.is_subordinate(auth.uid(), usuario_id)
  );

create policy "audit_logs_insert" on public.audit_logs
  for insert with check (true);


-- 3. Automatic Audit Logging Triggers

create or replace function public.log_critical_action()
returns trigger as $$
declare
  usuario_id_val uuid;
begin
  usuario_id_val := auth.uid();
  
  if usuario_id_val is null then
    return new;
  end if;

  insert into public.audit_logs (usuario_id, acao, entidade, entidade_id, payload)
  values (
    usuario_id_val,
    TG_OP,
    TG_TABLE_NAME,
    new.id,
    row_to_json(new)::jsonb
  );
  
  return new;
end;
$$ language plpgsql security definer;

create trigger audit_simulacoes
  after insert or update on public.simulacoes
  for each row execute procedure public.log_critical_action();

create trigger audit_propostas
  after insert or update on public.propostas
  for each row execute procedure public.log_critical_action();

create trigger audit_comissoes
  after insert or update on public.comissoes
  for each row execute procedure public.log_critical_action();
