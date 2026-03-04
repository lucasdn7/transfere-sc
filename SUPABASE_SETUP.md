# Configuração do Supabase - Transfer Radar SC

## Arquivos de Configuração

O projeto agora usa variáveis de ambiente para configurar a conexão com o Supabase. Você precisa criar um arquivo `.env` na raiz do projeto com suas credenciais.

### Passos para Configurar:

1. **Copie o arquivo de exemplo:**
   ```bash
   cp .env.example .env
   ```

2. **Edite o arquivo `.env`** com suas credenciais do Supabase:
   ```env
   # Supabase Configuration
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anonima

   # URL da API do servidor Express para Google Sheets
   VITE_API_URL=http://localhost:3001
   ```

### Onde encontrar suas credenciais:

1. **Supabase:**
   - Acesse o [painel do Supabase](https://supabase.com/dashboard)
   - Selecione seu projeto
   - Vá para **Settings** > **API**
   - Copie a **URL** e a **anon public key**

2. **VITE_API_URL (API do Google Sheets):**
   - Esta é a URL do servidor Express local para integração com Google Sheets
   - **Para desenvolvimento:** `http://localhost:3001` (já configurado)
   - **Para produção:** URL do seu servidor hospedado (ex: `https://api.seuprojeto.com`)
   - **Requisitos:** 
     - Arquivo `credenciais.json` na pasta `api/` com credenciais do Google Service Account
     - Planilha Google Sheets compartilhada com o service account

### Arquivos de Configuração Disponíveis:

- `.env.example` - Arquivo de exemplo com as variáveis necessárias
- `.env.template` - Template para copiar e colar suas credenciais
- `src/integrations/supabase/client.ts` - Cliente Supabase configurado

### Segurança:

- **NUNCA** commit o arquivo `.env` no Git
- O arquivo `.env` já está no `.gitignore`
- Use chaves diferentes para desenvolvimento e produção
- Mantenha suas chaves seguras e não as compartilhe publicamente

### Variáveis de Ambiente:

- `VITE_SUPABASE_URL`: URL do seu projeto Supabase
- `VITE_SUPABASE_ANON_KEY`: Chave pública anônima do Supabase
- `VITE_API_URL`: URL da API do servidor (para integrações externas)

### Teste da Conexão:

Após configurar as credenciais, inicie o projeto:

```bash
npm run dev
```

O sistema tentará conectar automaticamente ao Supabase usando as variáveis de ambiente configuradas.
