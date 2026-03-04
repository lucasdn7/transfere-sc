# 🚀 Instruções para Aplicar Migração de Favoritos

## 📋 Pré-requisitos
- Acesso ao Supabase Dashboard
- Permissões de administrador no projeto

## 🔧 Passos para Aplicar a Migração

### 1. Acesse o Supabase Dashboard
1. Vá para [supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Selecione o projeto do Transfer Radar SC

### 2. Abra o SQL Editor
1. No menu lateral, clique em **"SQL Editor"**
2. Clique em **"New query"** para criar uma nova consulta

### 3. Execute a Migração
1. Copie todo o conteúdo do arquivo: `supabase/migrations/20250719000000-create-favorites-tables.sql`
2. Cole no SQL Editor
3. Clique em **"Run"** para executar

### 4. Verifique a Execução
Após executar, você deve ver:
- ✅ Tabela `process_favorites` criada
- ✅ Tabela `process_technical_notes` criada
- ✅ Índices criados
- ✅ Políticas RLS configuradas
- ✅ Triggers configurados

## 🧪 Como Testar a Funcionalidade

### 1. Teste de Marcação de Favoritos
1. Faça login como usuário da área técnica
2. Vá para **"Processos"**
3. Clique na estrela ⭐ ao lado de qualquer processo
4. A estrela deve ficar preenchida (amarela)

### 2. Teste da Página de Favoritos
1. No menu lateral, clique em **"Favoritos"**
2. Verifique se o processo marcado aparece na lista
3. Clique em **"Ver detalhes"** para expandir o card
4. Adicione uma observação técnica
5. Clique em **"Salvar"**

### 3. Teste de Remoção
1. Na página de favoritos, clique na estrela preenchida
2. O processo deve ser removido da lista
3. Volte para "Processos" e verifique se a estrela está vazia

## 🔍 Verificação no Banco de Dados

### Verificar Tabelas Criadas
```sql
-- Verificar se as tabelas existem
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('process_favorites', 'process_technical_notes');
```

### Verificar Políticas RLS
```sql
-- Verificar políticas de process_favorites
SELECT * FROM pg_policies WHERE tablename = 'process_favorites';

-- Verificar políticas de process_technical_notes
SELECT * FROM pg_policies WHERE tablename = 'process_technical_notes';
```

## 🚨 Solução de Problemas

### Erro: "relation does not exist"
- Verifique se você está no projeto correto
- Execute a migração novamente

### Erro: "permission denied"
- Verifique se você tem permissões de administrador
- Entre em contato com o administrador do projeto

### Funcionalidade não aparece
- Verifique se o usuário tem role "technical"
- Limpe o cache do navegador
- Faça logout e login novamente

## 📞 Suporte
Se encontrar problemas, verifique:
1. Logs do console do navegador (F12)
2. Logs do Supabase (Dashboard > Logs)
3. Status das políticas RLS

---

**✅ Após aplicar a migração, a funcionalidade de favoritos estará 100% operacional!** 