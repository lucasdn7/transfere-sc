-- Criar a tabela process_favorites
CREATE TABLE IF NOT EXISTS public.process_favorites (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    process_id INTEGER NOT NULL REFERENCES public.processes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, process_id)
);

-- Criar a tabela process_technical_notes
CREATE TABLE IF NOT EXISTS public.process_technical_notes (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    process_id INTEGER NOT NULL REFERENCES public.processes(id) ON DELETE CASCADE,
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, process_id)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_process_favorites_user_id ON public.process_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_process_favorites_process_id ON public.process_favorites(process_id);
CREATE INDEX IF NOT EXISTS idx_process_technical_notes_user_id ON public.process_technical_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_process_technical_notes_process_id ON public.process_technical_notes(process_id);

-- Habilitar RLS
ALTER TABLE public.process_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.process_technical_notes ENABLE ROW LEVEL SECURITY;

-- Políticas para process_favorites
CREATE POLICY "Users can view their own favorites"
ON public.process_favorites
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites"
ON public.process_favorites
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
ON public.process_favorites
FOR DELETE USING (auth.uid() = user_id);

-- Políticas para process_technical_notes
CREATE POLICY "Users can view their own technical notes"
ON public.process_technical_notes
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own technical notes"
ON public.process_technical_notes
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own technical notes"
ON public.process_technical_notes
FOR UPDATE USING (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_process_favorites_updated_at ON public.process_favorites;
CREATE TRIGGER update_process_favorites_updated_at
    BEFORE UPDATE ON public.process_favorites
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_process_technical_notes_updated_at ON public.process_technical_notes;
CREATE TRIGGER update_process_technical_notes_updated_at
    BEFORE UPDATE ON public.process_technical_notes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column(); 