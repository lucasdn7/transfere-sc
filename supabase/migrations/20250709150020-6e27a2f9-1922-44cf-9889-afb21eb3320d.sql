
-- Adicionar políticas RLS para a tabela process_parcels
CREATE POLICY "Allow public read access to process_parcels" 
  ON public.process_parcels 
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow insert on process_parcels" 
  ON public.process_parcels 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow update on process_parcels" 
  ON public.process_parcels 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Allow delete on process_parcels" 
  ON public.process_parcels 
  FOR DELETE 
  USING (true);
