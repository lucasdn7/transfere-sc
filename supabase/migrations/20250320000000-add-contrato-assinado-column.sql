-- Adicionar coluna contrato_assinado na tabela processes
ALTER TABLE public.processes 
ADD COLUMN IF NOT EXISTS contrato_assinado BOOLEAN DEFAULT FALSE;

-- Adicionar comentário na coluna
COMMENT ON COLUMN public.processes.contrato_assinado IS 'Indica se o contrato foi assinado';
