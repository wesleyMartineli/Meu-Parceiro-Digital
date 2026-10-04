-- Adiciona colunas para o novo modelo de parceiros (Base e Lead)
ALTER TABLE public.leads
ADD COLUMN tipo_parceiro varchar(50) DEFAULT 'base',
ADD COLUMN codigo_pv varchar(100),
ADD COLUMN nome_responsavel varchar(255),
ADD COLUMN cidade varchar(255),
ADD COLUMN estado varchar(2);
