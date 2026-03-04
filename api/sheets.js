const express = require('express');
const { google } = require('googleapis');
const path = require('path');

const router = express.Router();

// Configuração do Google Sheets
const SPREADSHEET_ID = '1WNv8peVjLwu-iJ4vvQFJM5HwpRg8YEBlfchCTWtSojA';
const SHEET_NAME = 'GEINFRA';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// Função para autenticar com Google Sheets
async function getGoogleSheetsAuth() {
  try {
    const credentialsPath = path.join(process.cwd(), 'credenciais.json');
    const auth = new google.auth.GoogleAuth({
      keyFile: credentialsPath,
      scopes: SCOPES,
    });
    
    return auth;
  } catch (error) {
    console.error('Erro na autenticação do Google:', error);
    throw error;
  }
}

// Função para adicionar timestamp ID
function generateTimestampId() {
  return new Date().toISOString();
}

// Endpoint POST para inserir dados na planilha
router.post('/sheets', async (req, res) => {
  try {
    console.log('📊 Recebendo dados para Google Sheets:', req.body);

    // Extrair dados do corpo da requisição
    const {
      id,
      process_number,
      object,
      portaria_number,
      total_portaria_value,
      total_concedente_value,
      total_proponente_value,
      licitado_value,
      vigencia_date,
      status_id,
      last_tramitacao,
      municipality_id,
      regional_nucleus_id,
      latitude,
      longitude,
      address,
      created_at,
      updated_at,
      link_plataforma_governo,
      municipality_name, // Nome do município
      regional_nucleus_name // Nome do núcleo regional
    } = req.body;

    // Validar campos obrigatórios
    if (!process_number || !object) {
      return res.status(400).json({
        error: 'Campos obrigatórios: process_number, object'
      });
    }

    // Autenticar com Google Sheets
    const auth = await getGoogleSheetsAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    // Preparar dados para inserção
    // Colunas A a S: ID (timestamp), id, process_number, object, portaria_number, 
    // total_portaria_value, total_concedente_value, total_proponente_value, 
    // licitado_value, vigencia_date, status_id, last_tramitacao, 
    // municipality_id, regional_nucleus_id, latitude, longitude, address, 
    // created_at, updated_at, link_plataforma_governo
    const timestampId = generateTimestampId();
    
    const rowData = [
      timestampId, // ID (timestamp) - Coluna A
      id || '', // id - Coluna B
      process_number || '', // process_number - Coluna C
      object || '', // object - Coluna D
      portaria_number || '', // portaria_number - Coluna E
      total_portaria_value || 0, // total_portaria_value - Coluna F
      total_concedente_value || 0, // total_concedente_value - Coluna G
      total_proponente_value || 0, // total_proponente_value - Coluna H
      licitado_value || 0, // licitado_value - Coluna I
      vigencia_date || '', // vigencia_date - Coluna J
      status_id || '', // status_id - Coluna K
      last_tramitacao || '', // last_tramitacao - Coluna L
      municipality_name || municipality_id || '', // municipality (nome preferível) - Coluna M
      regional_nucleus_name || regional_nucleus_id || '', // regional_nucleus (nome preferível) - Coluna N
      latitude || '', // latitude - Coluna O
      longitude || '', // longitude - Coluna P
      address || '', // address - Coluna Q
      created_at || '', // created_at - Coluna R
      updated_at || '', // updated_at - Coluna S
      link_plataforma_governo || '' // link_plataforma_governo - Coluna T (se necessário)
    ];

    console.log('📝 Dados preparados para inserção:', rowData);

    // Inserir dados na planilha
    const range = `${SHEET_NAME}!A:S`; // Colunas A até S
    
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [rowData]
      }
    });

    console.log('✅ Dados inseridos com sucesso no Google Sheets:', response.data);

    res.json({
      message: 'Dados salvos na planilha!',
      timestampId: timestampId,
      insertedRange: response.data.updates?.updatedRange
    });

  } catch (error) {
    console.error('❌ Erro ao salvar no Google Sheets:', error);
    
    // Tratar diferentes tipos de erro
    if (error.code === 'ENOENT') {
      return res.status(500).json({
        error: 'Arquivo de credenciais não encontrado'
      });
    }
    
    if (error.code === 403) {
      return res.status(403).json({
        error: 'Permissão negada. Verifique se a planilha foi compartilhada com a service account'
      });
    }
    
    if (error.code === 404) {
      return res.status(404).json({
        error: 'Planilha não encontrada. Verifique o SPREADSHEET_ID'
      });
    }

    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// Endpoint GET para testar conectividade
router.get('/sheets/test', async (req, res) => {
  try {
    const auth = await getGoogleSheetsAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Tentar ler a primeira célula da planilha
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1`,
    });

    res.json({
      message: 'Conexão com Google Sheets funcionando!',
      spreadsheetId: SPREADSHEET_ID,
      sheetName: SHEET_NAME,
      testCell: response.data.values || 'Célula vazia'
    });
  } catch (error) {
    console.error('Erro no teste de conectividade:', error);
    res.status(500).json({
      error: 'Erro na conexão com Google Sheets',
      details: error.message
    });
  }
});

module.exports = router;