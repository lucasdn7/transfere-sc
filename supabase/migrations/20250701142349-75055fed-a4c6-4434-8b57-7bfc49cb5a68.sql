
-- Atualizar políticas RLS para permitir acesso público de leitura completo
-- Remover políticas restritivas existentes e criar novas

-- Processos: acesso público completo para leitura
DROP POLICY IF EXISTS "Public can view processes" ON public.processes;
CREATE POLICY "Public can view processes" ON public.processes
  FOR SELECT USING (true);

-- Municípios: acesso público completo para leitura  
DROP POLICY IF EXISTS "Public can view municipalities" ON public.municipalities;
CREATE POLICY "Public can view municipalities" ON public.municipalities
  FOR SELECT USING (true);

-- Núcleos regionais: acesso público completo para leitura
DROP POLICY IF EXISTS "Public can view regional_nuclei" ON public.regional_nuclei;
CREATE POLICY "Public can view regional_nuclei" ON public.regional_nuclei
  FOR SELECT USING (true);

-- Documentos: permitir acesso público aos documentos públicos
CREATE POLICY "Public can view public documents" ON public.documents
  FOR SELECT USING (is_public = true);

-- Anexos de processos: acesso público para visualização
CREATE POLICY "Public can view process attachments" ON public.process_attachments
  FOR SELECT USING (true);

-- Categorias de documentos: acesso público
CREATE POLICY "Public can view document categories" ON public.document_categories
  FOR SELECT USING (true);

-- FAQs: acesso público
CREATE POLICY "Public can view faqs" ON public.faqs
  FOR SELECT USING (true);

-- Glossário: acesso público
CREATE POLICY "Public can view glossary terms" ON public.glossary_terms
  FOR SELECT USING (true);

-- Alertas públicos: acesso público
CREATE POLICY "Public can view public alerts" ON public.public_alerts
  FOR SELECT USING (true);

-- Atualizar função para autenticação simplificada
-- Criar uma função para verificar senha fixa
CREATE OR REPLACE FUNCTION public.authenticate_technical_user(password_input TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Senha fixa: Geinfra.setur2025
  RETURN password_input = 'Geinfra.setur2025';
END;
$$;

-- Criar tabela para sessões temporárias da área técnica
CREATE TABLE IF NOT EXISTS public.technical_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Habilitar RLS na tabela de sessões
ALTER TABLE public.technical_sessions ENABLE ROW LEVEL SECURITY;

-- Política para limpar sessões expiradas automaticamente
CREATE POLICY "Auto cleanup expired sessions" ON public.technical_sessions
  FOR SELECT USING (expires_at > now() AND is_active = true);

-- Função para criar sessão técnica
CREATE OR REPLACE FUNCTION public.create_technical_session(password_input TEXT)
RETURNS TABLE(session_token TEXT, expires_at TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_token TEXT;
  expiry_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Verificar senha
  IF NOT public.authenticate_technical_user(password_input) THEN
    RAISE EXCEPTION 'Invalid password';
  END IF;
  
  -- Gerar token único
  new_token := encode(gen_random_bytes(32), 'hex');
  expiry_time := now() + interval '24 hours';
  
  -- Inserir nova sessão
  INSERT INTO public.technical_sessions (session_token, expires_at)
  VALUES (new_token, expiry_time);
  
  RETURN QUERY SELECT new_token, expiry_time;
END;
$$;

-- Função para validar sessão técnica
CREATE OR REPLACE FUNCTION public.validate_technical_session(token_input TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.technical_sessions 
    WHERE session_token = token_input 
      AND expires_at > now() 
      AND is_active = true
  );
END;
$$;

-- Função para invalidar sessão
CREATE OR REPLACE FUNCTION public.invalidate_technical_session(token_input TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.technical_sessions 
  SET is_active = false 
  WHERE session_token = token_input;
  
  RETURN FOUND;
END;
$$;

-- Atualizar políticas para usar o novo sistema de autenticação
-- Substituir verificação de roles por verificação de sessão técnica

-- Processos: somente sessões técnicas válidas podem modificar
DROP POLICY IF EXISTS "Technical users can modify processes" ON public.processes;
CREATE POLICY "Technical sessions can modify processes" ON public.processes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.technical_sessions 
      WHERE session_token = current_setting('app.current_session_token', true)
        AND expires_at > now() 
        AND is_active = true
    )
  );

-- Municípios: somente sessões técnicas válidas podem modificar
DROP POLICY IF EXISTS "Technical users can modify municipalities" ON public.municipalities;
CREATE POLICY "Technical sessions can modify municipalities" ON public.municipalities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.technical_sessions 
      WHERE session_token = current_setting('app.current_session_token', true)
        AND expires_at > now() 
        AND is_active = true
    )
  );

-- Núcleos regionais: somente sessões técnicas válidas podem modificar
DROP POLICY IF EXISTS "Technical users can modify regional_nuclei" ON public.regional_nuclei;
CREATE POLICY "Technical sessions can modify regional_nuclei" ON public.regional_nuclei
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.technical_sessions 
      WHERE session_token = current_setting('app.current_session_token', true)
        AND expires_at > now() 
        AND is_active = true
    )
  );

-- Documentos: sessões técnicas podem gerenciar todos os documentos
CREATE POLICY "Technical sessions can manage documents" ON public.documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.technical_sessions 
      WHERE session_token = current_setting('app.current_session_token', true)
        AND expires_at > now() 
        AND is_active = true
    )
  );

-- Configurações do sistema: apenas sessões técnicas
DROP POLICY IF EXISTS "Admins can manage settings" ON public.system_settings;
DROP POLICY IF EXISTS "Technical users can view settings" ON public.system_settings;

CREATE POLICY "Technical sessions can manage settings" ON public.system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.technical_sessions 
      WHERE session_token = current_setting('app.current_session_token', true)
        AND expires_at > now() 
        AND is_active = true
    )
  );

-- Adicionar configurações para layout e tema
INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
('layout_position', '"sidebar"', 'Posição do menu: sidebar ou top'),
('theme_mode', '"light"', 'Modo do tema: light ou dark'),
('font_size', '"medium"', 'Tamanho da fonte: small, medium, large'),
('language', '"pt-BR"', 'Idioma do sistema')
ON CONFLICT (setting_key) DO NOTHING;
