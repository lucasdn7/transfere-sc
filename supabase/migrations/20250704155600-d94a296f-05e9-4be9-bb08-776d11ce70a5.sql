
-- Remove a coluna geographic_region da tabela regional_nuclei se ela existir
ALTER TABLE public.regional_nuclei DROP COLUMN IF EXISTS geographic_region;

-- Garante que existe pelo menos um status padrão
INSERT INTO public.status_processos (nome, descricao, ordem, ativo, cor)
VALUES ('Em Análise', 'Status padrão para novos processos', 1, true, '#3b82f6')
ON CONFLICT DO NOTHING;

-- Adiciona RLS policies para permitir leitura dos dados
ALTER TABLE public.municipalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regional_nuclei ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_processos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regioes ENABLE ROW LEVEL SECURITY;

-- Policies para permitir leitura pública dos dados
CREATE POLICY "Allow public read access to municipalities" ON public.municipalities FOR SELECT USING (true);
CREATE POLICY "Allow public read access to regional_nuclei" ON public.regional_nuclei FOR SELECT USING (true);
CREATE POLICY "Allow public read access to processes" ON public.processes FOR SELECT USING (true);
CREATE POLICY "Allow public read access to status_processos" ON public.status_processos FOR SELECT USING (true);
CREATE POLICY "Allow public read access to regioes" ON public.regioes FOR SELECT USING (true);

-- Policies para permitir inserção (para criação automática)
CREATE POLICY "Allow insert on municipalities" ON public.municipalities FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert on regional_nuclei" ON public.regional_nuclei FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert on processes" ON public.processes FOR INSERT WITH CHECK (true);

-- Policies para permitir atualização
CREATE POLICY "Allow update on municipalities" ON public.municipalities FOR UPDATE USING (true);
CREATE POLICY "Allow update on regional_nuclei" ON public.regional_nuclei FOR UPDATE USING (true);
CREATE POLICY "Allow update on processes" ON public.processes FOR UPDATE USING (true);
