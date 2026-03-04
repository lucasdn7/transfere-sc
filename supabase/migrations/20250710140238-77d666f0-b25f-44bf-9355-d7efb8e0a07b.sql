
-- Verificar se a tabela process_parcels tem todos os campos necessários
-- Caso não tenha algum campo, será adicionado

-- Garantir que temos os campos necessários na tabela process_parcels
DO $$
BEGIN
    -- Verificar se a coluna payment_date existe e é do tipo correto
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'process_parcels' 
        AND column_name = 'payment_date'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.process_parcels 
        ADD COLUMN payment_date DATE;
    END IF;
    
    -- Garantir que temos um trigger para atualizar updated_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_process_parcels_updated_at'
        AND event_object_table = 'process_parcels'
    ) THEN
        CREATE TRIGGER update_process_parcels_updated_at
            BEFORE UPDATE ON public.process_parcels
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;
