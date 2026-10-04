alter table public.usuarios 
add column if not exists primeiro_acesso boolean not null default true;
