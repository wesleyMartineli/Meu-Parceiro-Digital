-- Migration: 0012_deduplicar_parceiros.sql
-- Descrição: Limpeza e unificação dos 6 parceiros duplicados legados gerados por duplo envio.

-- 1. Reatribuir simulações do parceiro PV 1120458 duplicado para o mantido
UPDATE public.simulacoes
SET lead_id = '23293d0b-dc56-4f0b-bb90-cf1d1bb06bcd'
WHERE lead_id = 'c8513267-33a1-4a26-a503-b3f3500ec6fe';

-- 2. Excluir negócios de placeholder iniciais dos IDs duplicados
DELETE FROM public.negocios_crm
WHERE cliente_id IN (
  'be1364b6-26cc-49d1-9ac8-8558c3136235', -- BSR BRASIL SANTOS LTDA
  '34cd1bd1-5c9b-48d0-bdeb-c2314badec9d', -- CRISTINA BATISTA DA SILVA
  '2d4ebba0-afee-4955-a9a2-262b1d46295e', -- DINAMIC NEGOCIOS LTDA
  'd8ea9e96-edc3-4724-a30e-f33337d9639d', -- MORUMBIA MAX
  'c8513267-33a1-4a26-a503-b3f3500ec6fe', -- PV 1120458
  '73df4549-d2b3-4170-876e-52ad9e86a7a8'  -- SIEED CORRETORA
);

-- 3. Excluir os registros duplicados da tabela de leads
DELETE FROM public.leads
WHERE id IN (
  'be1364b6-26cc-49d1-9ac8-8558c3136235',
  '34cd1bd1-5c9b-48d0-bdeb-c2314badec9d',
  '2d4ebba0-afee-4955-a9a2-262b1d46295e',
  'd8ea9e96-edc3-4724-a30e-f33337d9639d',
  'c8513267-33a1-4a26-a503-b3f3500ec6fe',
  '73df4549-d2b3-4170-876e-52ad9e86a7a8'
);
