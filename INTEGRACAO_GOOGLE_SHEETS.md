# Integração com Google Sheets

## 📋 Visão Geral

Esta integração permite que os dados do formulário de processos sejam automaticamente enviados para uma planilha do Google Sheets após serem salvos no Supabase.

## 🏗️ Estrutura Implementada

### **Backend (API)**
- **Servidor Express**: `api/server.js`
- **Endpoint Google Sheets**: `api/sheets.js`
- **Credenciais**: `credenciais.json`

### **Frontend**
- **Função auxiliar**: `src/utils/googleSheetsUtils.ts`
- **Integração no formulário**: `src/components/forms/ProcessForm.tsx`

---

## ⚙️ Configuração

### **1. Dependências Instaladas**
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "googleapis": "^128.0.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.17",
    "@types/cors": "^2.8.13"
  }
}
```

### **2. Scripts Adicionados**
```json
{
  "scripts": {
    "api": "node api/server.js",
    "dev:api": "nodemon api/server.js"
  }
}
```

### **3. Variáveis de Ambiente**
Criar arquivo `.env` com:
```bash
VITE_API_URL=http://localhost:3001
```

---

## 🔧 Como Usar

### **Configuração Inicial**

#### **1. Definir ID da Planilha**
No arquivo `api/sheets.js`, a planilha já está configurada:
```javascript
const SPREADSHEET_ID = '1WNv8peVjLwu-iJ4vvQFJM5HwpRg8YEBlfchCTWtSojA';
```

#### **2. Compartilhar a Planilha**
Compartilhar a planilha do Google Sheets com o e-mail da service account:
```
formulario-de-processos@formulario-de-processos.iam.gserviceaccount.com
```

#### **3. Criar Aba "GEINFRA"**
Certifique-se de que existe uma aba chamada "GEINFRA" na planilha.

### **Executar o Sistema**

#### **1. Iniciar API (Terminal 1)**
```bash
npm run api
# ou para desenvolvimento:
npm run dev:api
```

#### **2. Iniciar Frontend (Terminal 2)**
```bash
npm run dev
```

---

## 📊 Estrutura dos Dados na Planilha

### **Colunas A a S (conforme solicitado):**

| Coluna | Campo | Descrição |
|--------|-------|-----------|
| A | `ID (timestamp)` | Timestamp gerado automaticamente |
| B | `id` | ID do processo no banco |
| C | `process_number` | Número do processo |
| D | `object` | Objeto do processo |
| E | `portaria_number` | Número da portaria |
| F | `total_portaria_value` | Valor total da portaria |
| G | `total_concedente_value` | Valor do concedente |
| H | `total_proponente_value` | Valor do proponente |
| I | `licitado_value` | Valor licitado |
| J | `vigencia_date` | Data de vigência |
| K | `status_id` | ID do status |
| L | `last_tramitacao` | Última tramitação |
| M | `municipality_name` | **Nome do município** (não ID) |
| N | `regional_nucleus_name` | **Nome do núcleo regional** (não ID) |
| O | `latitude` | Latitude |
| P | `longitude` | Longitude |
| Q | `address` | Endereço |
| R | `created_at` | Data de criação |
| S | `updated_at` | Data de atualização |

### **Melhorias Implementadas:**
- ✅ **Nomes ao invés de IDs**: Município e núcleo regional aparecem com nomes
- ✅ **Timestamp único**: Cada registro tem ID único baseado em timestamp
- ✅ **Tratamento de erros**: Falhas não interrompem o fluxo principal

---

## 🔍 Endpoints da API

### **POST /api/sheets**
Insere dados na planilha do Google Sheets.

**Corpo da requisição:**
```json
{
  "id": 123,
  "process_number": "2024/001",
  "object": "Descrição do objeto...",
  "portaria_number": "PRT-001/2024",
  "total_portaria_value": 5000000,
  "total_concedente_value": 4000000,
  "total_proponente_value": 1000000,
  "licitado_value": 4500000,
  "vigencia_date": "2024-12-31",
  "status_id": 1,
  "municipality_id": 1,
  "regional_nucleus_id": 1,
  "latitude": -27.5954,
  "longitude": -48.5482,
  "address": "Rua Exemplo, 123",
  "link_plataforma_governo": "https://plataforma.gov.br/123"
}
```

**Resposta de sucesso:**
```json
{
  "message": "Dados salvos na planilha!",
  "timestampId": "2024-01-15T10:30:00.000Z",
       "insertedRange": "GEINFRA!A2:S2"
}
```

### **GET /api/sheets/test**
Testa a conectividade com a planilha.

**Resposta:**
```json
{
     "message": "Conexão com Google Sheets funcionando!",
   "spreadsheetId": "1WNv8peVjLwu-iJ4vvQFJM5HwpRg8YEBlfchCTWtSojA",
   "sheetName": "GEINFRA",
  "testCell": ["Conteúdo da célula A1"]
}
```

---

## 🧪 Testando a Integração

### **1. Teste de Conectividade**
```bash
curl http://localhost:3001/api/sheets/test
```

### **2. Teste de Inserção**
```bash
curl -X POST http://localhost:3001/api/sheets \
  -H "Content-Type: application/json" \
  -d '{
    "process_number": "TESTE/2024",
    "object": "Processo de teste",
    "total_portaria_value": 1000000,
    "total_concedente_value": 800000,
    "total_proponente_value": 200000,
    "vigencia_date": "2024-12-31",
    "status_id": 1,
    "municipality_id": 1
  }'
```

### **3. Teste no Frontend**
1. Acesse o formulário de processos
2. Preencha os dados obrigatórios
3. Submeta o formulário
4. Verifique os logs do console:
   - ✅ `"Dados enviados para o Google Sheets"`
   - ❌ `"Erro ao enviar para o Google Sheets"`

---

## 🚀 Fluxo de Funcionamento

### **Sequência de Eventos:**

1. **Usuário preenche** o formulário de processos
2. **Dados são salvos** no Supabase
3. **Toast de sucesso** é exibido
4. **Função auxiliar é chamada** automaticamente
5. **Nomes são buscados** (município e núcleo regional)
6. **Dados são enviados** para a API `/api/sheets`
7. **API autentica** com Google Sheets via service account
8. **Dados são inseridos** na planilha (aba "GEINFRA")
9. **Logs são gerados** no console (sucesso ou erro)

### **Tratamento de Erros:**
- ❌ Falhas no Google Sheets **NÃO interrompem** o fluxo principal
- ✅ Dados são sempre salvos no Supabase primeiro
- 📝 Erros são logados no console para monitoramento

---

## 📁 Arquivos Modificados/Criados

### **Novos Arquivos:**
- ✅ `credenciais.json` - Credenciais da service account
- ✅ `api/server.js` - Servidor Express
- ✅ `api/sheets.js` - Endpoint para Google Sheets
- ✅ `src/utils/googleSheetsUtils.ts` - Função auxiliar
- ✅ `.env.example` - Exemplo de variáveis de ambiente

### **Arquivos Modificados:**
- ✅ `package.json` - Dependências e scripts
- ✅ `src/components/forms/ProcessForm.tsx` - Integração da função auxiliar

---

## 🔒 Segurança

### **Credenciais:**
- ✅ Arquivo `credenciais.json` contém chave privada da service account
- ⚠️ **NUNCA commitar** credenciais em repositórios públicos
- 🔐 Usar variáveis de ambiente em produção

### **CORS:**
- ✅ Configurado para aceitar apenas URLs do frontend
- 🔧 Ajustar origins em produção conforme necessário

---

## 🎯 Próximos Passos

### **Para Produção:**
1. **Substituir** `'SUA_PLANILHA_ID'` pelo ID real da planilha
2. **Configurar** variáveis de ambiente de produção
3. **Deploy** do servidor Express em ambiente separado
4. **Atualizar** CORS origins para URLs de produção
5. **Monitorar** logs para verificar funcionamento

### **Melhorias Opcionais:**
- 📊 Dashboard de monitoramento de envios
- 🔄 Retry automático em caso de falha
- 📈 Métricas de sucesso/erro
- 🔔 Notificações em caso de problemas

---

## ✅ Status da Implementação

| Funcionalidade | Status | Observações |
|----------------|--------|-------------|
| Endpoint API | ✅ **Concluído** | `/api/sheets` funcionando |
| Autenticação Google | ✅ **Concluído** | Service account configurada |
| Função auxiliar | ✅ **Concluído** | Busca nomes automaticamente |
| Integração formulário | ✅ **Concluído** | Envio automático após Supabase |
| Tratamento de erros | ✅ **Concluído** | Não interrompe fluxo principal |
| Documentação | ✅ **Concluído** | Guia completo criado |
| Testes | ✅ **Concluído** | Endpoints testados |

**🎉 Integração 100% funcional e pronta para uso!**

---

## 📞 Suporte

Se precisar de ajuda:
1. Verificar logs do console (frontend e API)
2. Testar conectividade com `/api/sheets/test`
3. Confirmar que a planilha está compartilhada corretamente
4. Validar se o `SPREADSHEET_ID` está correto