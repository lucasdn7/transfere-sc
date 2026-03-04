import { supabase } from "@/integrations/supabase/client";

// Interface para os dados do processo que serão enviados ao Google Sheets
interface ProcessDataForSheets {
  id?: number;
  process_number: string;
  object: string;
  portaria_number?: string;
  total_portaria_value: number;
  total_concedente_value: number;
  total_proponente_value: number;
  licitado_value?: number;
  vigencia_date: string;
  status_id: number;
  last_tramitacao?: string;
  municipality_id: number;
  regional_nucleus_id?: number;
  latitude?: number;
  longitude?: number;
  address?: string;
  created_at?: string;
  updated_at?: string;
  link_plataforma_governo?: string;
}

// Função para buscar o nome do município pelo ID
async function getMunicipalityName(municipalityId: number): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('municipalities')
      .select('name')
      .eq('id', municipalityId)
      .single();

    if (error) {
      console.warn('Erro ao buscar nome do município:', error);
      return '';
    }

    return data?.name || '';
  } catch (error) {
    console.warn('Erro ao buscar nome do município:', error);
    return '';
  }
}

// Função para buscar o nome do núcleo regional pelo ID
async function getRegionalNucleusName(regionalNucleusId: number): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('regional_nuclei')
      .select('name')
      .eq('id', regionalNucleusId)
      .single();

    if (error) {
      console.warn('Erro ao buscar nome do núcleo regional:', error);
      return '';
    }

    return data?.name || '';
  } catch (error) {
    console.warn('Erro ao buscar nome do núcleo regional:', error);
    return '';
  }
}

/**
 * Função para enviar dados do processo para o Google Sheets
 * Deve ser chamada logo após o envio bem-sucedido para o Supabase
 */
export async function enviarParaGoogleSheets(processData: ProcessDataForSheets): Promise<void> {
  try {
    console.log('📊 Iniciando envio para Google Sheets...', processData);

    // Buscar nomes do município e núcleo regional em paralelo
    const [municipalityName, regionalNucleusName] = await Promise.all([
      getMunicipalityName(processData.municipality_id),
      processData.regional_nucleus_id 
        ? getRegionalNucleusName(processData.regional_nucleus_id)
        : Promise.resolve('')
    ]);

    // Preparar dados para envio com nomes ao invés de IDs
    const dataToSend = {
      ...processData,
      municipality_name: municipalityName,
      regional_nucleus_name: regionalNucleusName,
      created_at: processData.created_at || new Date().toISOString(),
      updated_at: processData.updated_at || new Date().toISOString()
    };

    console.log('📝 Dados preparados com nomes:', dataToSend);

    // URL da API - ajustar conforme necessário para produção
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const endpoint = `${API_URL}/api/sheets`;

    // Fazer requisição POST para o endpoint
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToSend)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      throw new Error(`HTTP ${response.status}: ${errorData.error || 'Erro no servidor'}`);
    }

    const result = await response.json();
    console.log('✅ Dados enviados para o Google Sheets:', result);

  } catch (error) {
    console.error('❌ Erro ao enviar para o Google Sheets:', error);
    
    // Não vamos lançar o erro para não afetar o fluxo principal
    // Apenas logamos o erro conforme solicitado
    if (error instanceof Error) {
      console.log('Erro ao enviar para Google Sheets:', error.message);
    } else {
      console.log('Erro ao enviar para Google Sheets: Erro desconhecido');
    }
  }
}

/**
 * Função para testar a conectividade com o Google Sheets
 * Útil para verificar se a integração está funcionando
 */
export async function testarConexaoGoogleSheets(): Promise<boolean> {
  try {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const endpoint = `${API_URL}/api/sheets/test`;

    const response = await fetch(endpoint);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Teste de conexão Google Sheets:', result);
      return true;
    } else {
      console.error('❌ Falha no teste de conexão Google Sheets');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro no teste de conexão Google Sheets:', error);
    return false;
  }
}