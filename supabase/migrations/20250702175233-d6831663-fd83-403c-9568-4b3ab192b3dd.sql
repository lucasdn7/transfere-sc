
-- Criar tabela para documentos se não existir
CREATE TABLE IF NOT EXISTS public.documents (
  id SERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  description TEXT,
  file_name VARCHAR NOT NULL,
  file_path VARCHAR NOT NULL,
  file_size INTEGER,
  file_mime_type VARCHAR,
  document_category_id INTEGER REFERENCES document_categories(id),
  uploaded_by_user_id INTEGER,
  is_public BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  validity_date DATE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Habilitar RLS para documentos
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Policy para visualização pública de documentos públicos
CREATE POLICY "Public can view public documents" 
ON public.documents FOR SELECT 
USING (is_public = true);

-- Policy para área técnica gerenciar documentos
CREATE POLICY "Technical sessions can manage documents" 
ON public.documents FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM technical_sessions 
    WHERE session_token = current_setting('app.current_session_token', true)
    AND expires_at > now() 
    AND is_active = true
  )
);

-- Criar bucket de storage para documentos se não existir
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Policy para upload de documentos (área técnica)
CREATE POLICY "Technical sessions can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM technical_sessions 
    WHERE session_token = current_setting('app.current_session_token', true)
    AND expires_at > now() 
    AND is_active = true
  )
);

-- Policy para visualização pública de documentos
CREATE POLICY "Public can view documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');
