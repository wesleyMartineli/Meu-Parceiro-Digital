-- Tabela para armazenar as taxas do BCB
CREATE TABLE public.financing_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_name varchar(255) NOT NULL,
  institution_code varchar(50),
  modality varchar(255) NOT NULL,
  person_type varchar(50) NOT NULL,
  monthly_rate numeric(10, 4) NOT NULL,
  annual_rate numeric(10, 4) NOT NULL,
  reference_date date NOT NULL,
  source varchar(50) DEFAULT 'BCB',
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Trigger para updated_at na tabela financing_rates
CREATE TRIGGER set_timestamp_financing_rates
BEFORE UPDATE ON public.financing_rates
FOR EACH ROW
EXECUTE PROCEDURE public.trigger_set_timestamp();

-- Adicionando colunas de snapshot à tabela simulacoes
ALTER TABLE public.simulacoes
ADD COLUMN IF NOT EXISTS financing_monthly_rate_used numeric(10, 4),
ADD COLUMN IF NOT EXISTS financing_annual_rate_used numeric(10, 4),
ADD COLUMN IF NOT EXISTS financing_reference_date date,
ADD COLUMN IF NOT EXISTS financing_term integer,
ADD COLUMN IF NOT EXISTS financing_principal numeric(15, 2),
ADD COLUMN IF NOT EXISTS financing_down_payment numeric(15, 2),
ADD COLUMN IF NOT EXISTS financing_monthly_payment numeric(15, 2),
ADD COLUMN IF NOT EXISTS financing_total_paid numeric(15, 2),
ADD COLUMN IF NOT EXISTS financing_source varchar(50);
