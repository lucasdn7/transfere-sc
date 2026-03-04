
-- Adicionar índices para melhorar performance das consultas
CREATE INDEX IF NOT EXISTS idx_processes_status ON processes(current_status);
CREATE INDEX IF NOT EXISTS idx_processes_municipality ON processes(municipality_id);
CREATE INDEX IF NOT EXISTS idx_processes_vigencia ON processes(vigencia_date);
CREATE INDEX IF NOT EXISTS idx_processes_created_at ON processes(created_at);

-- Adicionar tabela para estatísticas em cache
CREATE TABLE IF NOT EXISTS public.dashboard_stats (
  id SERIAL PRIMARY KEY,
  stat_key VARCHAR(50) UNIQUE NOT NULL,
  stat_value JSONB NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar RLS para estatísticas
ALTER TABLE public.dashboard_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view dashboard stats"
  ON public.dashboard_stats
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Technical sessions can update stats"
  ON public.dashboard_stats
  FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM technical_sessions 
      WHERE session_token = current_setting('app.current_session_token', true)
      AND expires_at > now() 
      AND is_active = true
    )
  );

-- Função para atualizar estatísticas automaticamente
CREATE OR REPLACE FUNCTION public.update_dashboard_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_processes INTEGER;
  total_value NUMERIC;
  active_municipalities INTEGER;
  regional_nuclei_count INTEGER;
  status_distribution JSONB;
BEGIN
  -- Calcular estatísticas
  SELECT COUNT(*) INTO total_processes FROM processes;
  SELECT COALESCE(SUM(total_portaria_value), 0) INTO total_value FROM processes;
  SELECT COUNT(DISTINCT municipality_id) INTO active_municipalities FROM processes;
  SELECT COUNT(*) INTO regional_nuclei_count FROM regional_nuclei;
  
  -- Distribuição por status
  SELECT jsonb_object_agg(current_status, count)
  INTO status_distribution
  FROM (
    SELECT current_status, COUNT(*) as count
    FROM processes
    GROUP BY current_status
  ) t;

  -- Inserir ou atualizar estatísticas
  INSERT INTO dashboard_stats (stat_key, stat_value)
  VALUES 
    ('total_processes', to_jsonb(total_processes)),
    ('total_value', to_jsonb(total_value)),
    ('active_municipalities', to_jsonb(active_municipalities)),
    ('regional_nuclei_count', to_jsonb(regional_nuclei_count)),
    ('status_distribution', status_distribution)
  ON CONFLICT (stat_key) 
  DO UPDATE SET 
    stat_value = EXCLUDED.stat_value,
    last_updated = NOW();
END;
$$;

-- Adicionar campos úteis à tabela de processos
ALTER TABLE public.processes 
ADD COLUMN IF NOT EXISTS portaria_date DATE,
ADD COLUMN IF NOT EXISTS execution_percentage NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_update_notes TEXT;

-- Melhorar tabela de municípios com informações geográficas
ALTER TABLE public.municipalities
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,8),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(11,8),
ADD COLUMN IF NOT EXISTS area_km2 NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS gdp_per_capita NUMERIC(12,2);

-- Criar tabela de logs de atividade para auditoria
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id SERIAL PRIMARY KEY,
  table_name VARCHAR(50) NOT NULL,
  operation VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
  record_id INTEGER,
  old_data JSONB,
  new_data JSONB,
  user_session TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para logs de auditoria
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Technical sessions can view audit logs"
  ON public.audit_logs
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM technical_sessions 
      WHERE session_token = current_setting('app.current_session_token', true)
      AND expires_at > now() 
      AND is_active = true
    )
  );

-- Atualizar estatísticas iniciais
SELECT public.update_dashboard_stats();
