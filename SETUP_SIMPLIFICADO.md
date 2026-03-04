# Configuração do Supabase - Transfer Radar SC

## Configuração Simplificada (Apenas Supabase)

O projeto agora usa apenas o Supabase como banco de dados, sem integração com Google Sheets.

## Passos para Configurar:

1. **Copie o arquivo de exemplo:**
   ```bash
   cp .env.example .env
   ```

2. **O arquivo `.env` já contém as credenciais do Supabase:**
   ```env
   # Supabase Configuration
   VITE_SUPABASE_URL=https://yonisrknsnsrigmgrcvk.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlvbmlzcmtuc25zcmlnbWdyY3ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NTQyNzIsImV4cCI6MjA2NDEzMDI3Mn0.XOdf0QUrpyUfj-CeUL-WNaYUZ8LqXu2ZvYNU_pJahVM
   ```

## Iniciar o Projeto:

```bash
npm run dev
```

## Arquivos de Configuração:

- `.env.example` - Arquivo de exemplo com as variáveis necessárias
- `src/integrations/supabase/client.ts` - Cliente Supabase configurado

## Segurança:

- ✅ Arquivo `.env` está no `.gitignore`
- ✅ Variáveis de ambiente usando `import.meta.env`
- ✅ Fallback para credenciais hardcoded

## Funcionalidades Disponíveis:

- ✅ Conexão com Supabase
- ✅ Autenticação de usuários
- ✅ CRUD de processos, municípios, núcleos regionais
- ✅ Sistema de notificações
- ✅ Dashboard com estatísticas
- ✅ Exportação de dados (CSV, PDF)
- ✅ Timeline de processos
- ✅ Calendário integrado
