# Configuração da API Google Sheets

## O que é o VITE_API_URL?

O `VITE_API_URL` é a URL do servidor Express que faz a integração entre seu aplicativo React e o Google Sheets.

## Arquivos da API

### 1. `api/server.js`
- Servidor Express que roda na porta 3001
- Configura CORS e middleware
- Endpoint de health check em `/health`

### 2. `api/sheets.js`
- Contém as rotas para integração com Google Sheets
- Endpoint `POST /api/sheets` para inserir dados
- Endpoint `GET /api/sheets/test` para testar conexão

## Como Configurar

### Passo 1: Credenciais Google Sheets
1. Crie um projeto no [Google Cloud Console](https://console.cloud.google.com/)
2. Ative a API Google Sheets
3. Crie uma Service Account
4. Faça o download do arquivo JSON (renomeie para `credenciais.json`)
5. Coloque o arquivo na pasta `api/`

### Passo 2: Compartilhar Planilha
1. Abra sua planilha Google Sheets
2. Compartilhe com o email da Service Account
3. Dê permissão de "Editor"

### Passo 3: Configurar Variável de Ambiente
No seu arquivo `.env`:
```env
# Para desenvolvimento local
VITE_API_URL=http://localhost:3001

# Para produção (substitua pela URL real)
VITE_API_URL=https://api.seuprojeto.com
```

## Como Usar

### Iniciar a API
```bash
# Apenas a API
npm run api

# API com auto-reload (desenvolvimento)
npm run dev:api
```

### Testar a API
```bash
# Testar health check
curl http://localhost:3001/health

# Testar conexão Google Sheets
curl http://localhost:3001/api/sheets/test
```

## Estrutura do Projeto

```
api/
├── server.js          # Servidor Express principal
├── sheets.js         # Rotas Google Sheets
└── credenciais.json  # Credenciais Google (NÃO commitar)
```

## Segurança

- ✅ Arquivo `credenciais.json` está no `.gitignore`
- ✅ CORS configurado para URLs específicas
- ✅ Validação de dados nos endpoints
- ✅ Tratamento de erros detalhado

## Variáveis de Ambiente

- `VITE_API_URL`: URL base da API para o frontend
- `API_PORT`: Porta do servidor (padrão: 3001)

## Endpoints Disponíveis

- `GET /health` - Health check da API
- `POST /api/sheets` - Inserir dados na planilha
- `GET /api/sheets/test` - Testar conexão Google Sheets
