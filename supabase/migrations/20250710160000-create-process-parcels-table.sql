-- Criar a tabela process_parcels se ela não existir
CREATE TABLE IF NOT EXISTS public.process_parcels (
    id SERIAL PRIMARY KEY,
    process_id INTEGER NOT NULL REFERENCES public.processes(id) ON DELETE CASCADE,
    parcel_number INTEGER NOT NULL,
    value DECIMAL(15,2) NOT NULL DEFAULT 0,
    payment_date DATE NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_process_parcels_process_id ON public.process_parcels(process_id);
CREATE INDEX IF NOT EXISTS idx_process_parcels_payment_date ON public.process_parcels(payment_date);

-- Habilitar RLS
ALTER TABLE public.process_parcels ENABLE ROW LEVEL SECURITY;

-- Garantir que temos as políticas necessárias
DO $$
BEGIN
    -- Política para leitura pública
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'process_parcels' 
        AND policyname = 'Allow public read access to process_parcels'
    ) THEN
        CREATE POLICY "Allow public read access to process_parcels"
        ON public.process_parcels
        FOR SELECT USING (true);
    END IF;

    -- Política para inserção por sessões técnicas
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'process_parcels' 
        AND policyname = 'Allow insert on process_parcels'
    ) THEN
        CREATE POLICY "Allow insert on process_parcels"
        ON public.process_parcels
        FOR INSERT WITH CHECK (true);
    END IF;

    -- Política para atualização por sessões técnicas
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'process_parcels' 
        AND policyname = 'Allow update on process_parcels'
    ) THEN
        CREATE POLICY "Allow update on process_parcels"
        ON public.process_parcels
        FOR UPDATE USING (true);
    END IF;

    -- Política para exclusão por sessões técnicas
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'process_parcels' 
        AND policyname = 'Allow delete on process_parcels'
    ) THEN
        CREATE POLICY "Allow delete on process_parcels"
        ON public.process_parcels
        FOR DELETE USING (true);
    END IF;
END $$;

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_process_parcels_updated_at ON public.process_parcels;
CREATE TRIGGER update_process_parcels_updated_at
    BEFORE UPDATE ON public.process_parcels
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Garantir que a constraint de unicidade existe para evitar parcelas duplicadas
ALTER TABLE public.process_parcels 
ADD CONSTRAINT IF NOT EXISTS unique_process_parcel_number 
UNIQUE (process_id, parcel_number);