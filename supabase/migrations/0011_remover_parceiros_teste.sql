-- Migration: 0011_remover_parceiros_teste.sql
-- Descrição: Limpeza de dados de teste legados e garantia de que apenas parceiros válidos reflitam no CRM e propostas.

-- 1. Excluir negócios no CRM vinculados a contatos de teste
DELETE FROM negocios_crm 
WHERE cliente_id IN (
  SELECT id FROM leads 
  WHERE nome IN ('John Do', 'Joao Maria', 'jose padaria', 'Lead1', 'Panicooo', 'Jorge Amado', 'cliente jorge', 'CLIENTE TESTE')
);

-- 2. Excluir propostas vinculadas a contatos de teste
DELETE FROM propostas 
WHERE lead_id IN (
  SELECT id FROM leads 
  WHERE nome IN ('John Do', 'Joao Maria', 'jose padaria', 'Lead1', 'Panicooo', 'Jorge Amado', 'cliente jorge', 'CLIENTE TESTE')
);

-- 3. Excluir os contatos de teste da tabela de leads
DELETE FROM leads 
WHERE nome IN ('John Do', 'Joao Maria', 'jose padaria', 'Lead1', 'Panicooo', 'Jorge Amado', 'cliente jorge', 'CLIENTE TESTE');
