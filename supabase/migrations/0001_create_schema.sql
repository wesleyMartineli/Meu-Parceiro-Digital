-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Create Enums
create type user_role as enum ('master', 'superintendente', 'regional', 'gerente_negocio', 'ponto_venda');
create type usuario_status as enum ('ativo', 'inativo');

-- 2. Create Tables

-- usuarios
create table public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  supervisor_id uuid references public.usuarios(id) on delete set null,
  nome varchar(255) not null,
  email varchar(255) not null unique,
  telefone varchar(20),
  role user_role not null default 'ponto_venda',
  ativo boolean not null default true,
  avatar_url text,
  aceite_termos_em timestamp with time zone,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- administradoras
create table public.administradoras (
  id uuid primary key default gen_random_uuid(),
  nome varchar(255) not null unique,
  slug varchar(255) not null unique,
  ativa boolean not null default true,
  possui_engine boolean not null default false,
  engine_key varchar(50),
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- leads
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  vendedor_id uuid references public.usuarios(id) on delete set null,
  nome varchar(255) not null,
  telefone varchar(20),
  temperatura varchar(50) default 'morna',
  etapa_funil varchar(50) default 'sem_contato',
  origem varchar(100),
  observacoes text,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- simulacoes
create table public.simulacoes (
  id uuid primary key default gen_random_uuid(),
  vendedor_id uuid references public.usuarios(id) on delete set null,
  lead_id uuid references public.leads(id) on delete cascade,
  administradora_id uuid references public.administradoras(id) on delete set null,
  produto varchar(50) not null,
  modalidade varchar(50) not null,
  credito_total numeric(15, 2) not null,
  parcela_inicial numeric(15, 2) not null,
  parcela_final numeric(15, 2) not null,
  credito_liquido numeric(15, 2) not null,
  lance_total numeric(15, 2) not null default 0.00,
  lance_embutido numeric(15, 2) not null default 0.00,
  recursos_proprios numeric(15, 2) not null default 0.00,
  saldo_devedor numeric(15, 2) not null default 0.00,
  status varchar(50) default 'rascunho',
  engine_key varchar(50) not null,
  engine_version varchar(20) not null,
  input_json jsonb not null,
  output_json jsonb not null,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- simulacao_cotas
create table public.simulacao_cotas (
  id uuid primary key default gen_random_uuid(),
  simulacao_id uuid not null references public.simulacoes(id) on delete cascade,
  ordem integer not null,
  produto varchar(50) not null,
  modalidade varchar(50) not null,
  credito_bruto numeric(15, 2) not null,
  credito_liquido numeric(15, 2) not null,
  prazo integer not null,
  parcela_inicial numeric(15, 2) not null,
  parcela_final numeric(15, 2) not null,
  lance_total numeric(15, 2) not null default 0.00,
  lance_embutido numeric(15, 2) not null default 0.00,
  recursos_proprios numeric(15, 2) not null default 0.00,
  saldo_devedor numeric(15, 2) not null default 0.00,
  resultado_json jsonb not null,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- propostas
create table public.propostas (
  id uuid primary key default gen_random_uuid(),
  vendedor_id uuid references public.usuarios(id) on delete set null,
  lead_id uuid references public.leads(id) on delete cascade,
  simulacao_id uuid references public.simulacoes(id) on delete cascade,
  status varchar(50) default 'pendente',
  pdf_url text,
  public_link text,
  visualizacoes integer not null default 0,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- campanhas
create table public.campanhas (
  id uuid primary key default gen_random_uuid(),
  vendedor_id uuid references public.usuarios(id) on delete set null,
  simulacao_id uuid references public.simulacoes(id) on delete set null,
  tipo varchar(50),
  headline text,
  subheadline text,
  copy text,
  cta text,
  arte_feed_url text,
  arte_stories_url text,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- followups
create table public.followups (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  vendedor_id uuid references public.usuarios(id) on delete set null,
  titulo varchar(255) not null,
  descricao text,
  tipo varchar(50) default 'outros',
  data_followup timestamp with time zone not null,
  status varchar(50) default 'pendente',
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- comissoes
create table public.comissoes (
  id uuid primary key default gen_random_uuid(),
  vendedor_id uuid references public.usuarios(id) on delete set null,
  simulacao_id uuid references public.simulacoes(id) on delete set null,
  valor_credito numeric(15, 2) not null,
  percentual_comissao numeric(5, 2) not null,
  valor_comissao numeric(15, 2) not null,
  status varchar(50) default 'pendente',
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- metas
create table public.metas (
  id uuid primary key default gen_random_uuid(),
  vendedor_id uuid not null references public.usuarios(id) on delete cascade,
  periodo varchar(7) not null,
  meta_credito numeric(15, 2) not null,
  meta_fechamentos integer not null default 0,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now()),
  unique(vendedor_id, periodo)
);

-- audit_logs
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid,
  acao varchar(100) not null,
  entidade varchar(100) not null,
  entidade_id uuid,
  payload jsonb,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- 3. Create updated_at trigger helper
create or replace function public.trigger_set_timestamp()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Apply updated_at trigger to all tables
create trigger set_timestamp_usuarios before update on public.usuarios for each row execute procedure public.trigger_set_timestamp();
create trigger set_timestamp_administradoras before update on public.administradoras for each row execute procedure public.trigger_set_timestamp();
create trigger set_timestamp_leads before update on public.leads for each row execute procedure public.trigger_set_timestamp();
create trigger set_timestamp_simulacoes before update on public.simulacoes for each row execute procedure public.trigger_set_timestamp();
create trigger set_timestamp_propostas before update on public.propostas for each row execute procedure public.trigger_set_timestamp();
create trigger set_timestamp_campanhas before update on public.campanhas for each row execute procedure public.trigger_set_timestamp();
create trigger set_timestamp_followups before update on public.followups for each row execute procedure public.trigger_set_timestamp();
create trigger set_timestamp_comissoes before update on public.comissoes for each row execute procedure public.trigger_set_timestamp();
create trigger set_timestamp_metas before update on public.metas for each row execute procedure public.trigger_set_timestamp();

-- 4. Initial seed for administradoras
insert into public.administradoras (nome, slug, ativa, possui_engine, engine_key) values
  ('Rodobens', 'rodobens', true, true, 'rodobens');

-- 5. Trigger to handle profile creation on Auth user sign-up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.usuarios (id, email, nome, role, ativo)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nome', new.raw_user_meta_data->>'name', 'Usuário Sem Nome'),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'ponto_venda'::public.user_role),
    true
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
