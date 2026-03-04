
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { MetricOption } from "@/components/dashboard/DashboardMetricsSelector";

interface ProcessMetrics {
  total_portaria_value: number;
  total_concedente_value: number;
  total_proponente_value: number;
  licitado_value: number;
  created_at: string;
  municipalities?: { name: string };
  regional_nuclei?: { name: string };
  process_parcels?: Array<{
    value: number;
    payment_date: string | null;
  }>;
}

export function useDashboardMetrics() {
  const [selectedMetrics, setSelectedMetrics] = useState<MetricOption[]>([
    {
      key: "valor_total_portaria",
      label: "Valor Total Portaria",
      description: "Valor total definido na portaria do processo",
      enabled: true
    },
    {
      key: "valor_concedente",
      label: "Valor Concedente",
      description: "Valor a ser repassado pelo concedente (Estado)",
      enabled: true
    },
    {
      key: "valor_contrapartida",
      label: "Valor de Contrapartida",
      description: "Valor de contrapartida do proponente (Município)",
      enabled: false
    },
    {
      key: "valor_licitacao",
      label: "Valor Licitação",
      description: "Valor final após processo licitatório",
      enabled: false
    },
    {
      key: "saldo_repassar",
      label: "Saldo a Repassar",
      description: "Diferença entre valor concedente e parcelas pagas",
      enabled: false
    },
    {
      key: "percentual_executado",
      label: "Percentual Executado",
      description: "Percentual do valor concedente já pago em parcelas",
      enabled: false
    }
  ]);

  // Buscar dados dos processos
  const { data: processesData } = useQuery({
    queryKey: ['dashboard-metrics-processes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('processes')
        .select(`
          total_portaria_value,
          total_concedente_value,
          total_proponente_value,
          licitado_value,
          created_at,
          municipalities (name),
          regional_nuclei (name),
          process_parcels (
            value,
            payment_date
          )
        `);
      
      if (error) throw error;
      return data as ProcessMetrics[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Calcular métricas baseadas nos dados
  const calculateMetrics = () => {
    if (!processesData) return {};

    const metrics: Record<string, any[]> = {};

    // Agrupar por mês
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    
    const groupByMonth = (data: ProcessMetrics[], valueExtractor: (item: ProcessMetrics) => number) => {
      const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        name: monthNames[i],
        value: 0
      }));

      data.forEach(process => {
        const month = new Date(process.created_at).getMonth();
        monthlyData[month].value += valueExtractor(process);
      });

      return monthlyData.filter(item => item.value > 0);
    };

    // Valor Total Portaria
    metrics.valor_total_portaria = groupByMonth(
      processesData, 
      (p) => p.total_portaria_value || 0
    );

    // Valor Concedente
    metrics.valor_concedente = groupByMonth(
      processesData, 
      (p) => p.total_concedente_value || 0
    );

    // Valor Contrapartida
    metrics.valor_contrapartida = groupByMonth(
      processesData, 
      (p) => p.total_proponente_value || 0
    );

    // Valor Licitação
    metrics.valor_licitacao = groupByMonth(
      processesData.filter(p => p.licitado_value), 
      (p) => p.licitado_value || 0
    );

    // Saldo a Repassar
    metrics.saldo_repassar = groupByMonth(
      processesData,
      (p) => {
        const valorConcedente = p.total_concedente_value || 0;
        const valorPago = (p.process_parcels || [])
          .filter(parcel => parcel.payment_date)
          .reduce((sum, parcel) => sum + parcel.value, 0);
        return valorConcedente - valorPago;
      }
    );

    // Percentual Executado
    metrics.percentual_executado = processesData.map(p => {
      const valorConcedente = p.total_concedente_value || 0;
      const valorPago = (p.process_parcels || [])
        .filter(parcel => parcel.payment_date)
        .reduce((sum, parcel) => sum + parcel.value, 0);
      
      const percentual = valorConcedente > 0 ? (valorPago / valorConcedente) * 100 : 0;
      
      return {
        name: p.municipalities?.name || 'Não definido',
        value: Math.round(percentual)
      };
    }).filter(item => item.value > 0);

    // --- NOVAS MÉTRICAS PARA OS GRÁFICOS DO DASHBOARD ---
    // Valor Concedente por Município
    metrics.valor_concedente_por_municipio = Object.values(
      processesData.reduce((acc, p) => {
        const nome = p.municipalities?.name || 'Não definido';
        acc[nome] = acc[nome] || { name: nome, value: 0 };
        acc[nome].value += p.total_concedente_value || 0;
        return acc;
      }, {} as Record<string, { name: string; value: number }>)
    ).filter(item => item.value > 0);

    // Valor Concedente por Núcleo Regional
    metrics.valor_concedente_por_nucleo = Object.values(
      processesData.reduce((acc, p) => {
        const nome = p.regional_nuclei?.name || 'Não definido';
        acc[nome] = acc[nome] || { name: nome, value: 0 };
        acc[nome].value += p.total_concedente_value || 0;
        return acc;
      }, {} as Record<string, { name: string; value: number }>)
    ).filter(item => item.value > 0);

    // Valor Contrapartida por Município
    metrics.valor_contrapartida_por_municipio = Object.values(
      processesData.reduce((acc, p) => {
        const nome = p.municipalities?.name || 'Não definido';
        acc[nome] = acc[nome] || { name: nome, value: 0 };
        acc[nome].value += p.total_proponente_value || 0;
        return acc;
      }, {} as Record<string, { name: string; value: number }>)
    ).filter(item => item.value > 0);

    // Valor Contrapartida por Núcleo Regional
    metrics.valor_contrapartida_por_nucleo = Object.values(
      processesData.reduce((acc, p) => {
        const nome = p.regional_nuclei?.name || 'Não definido';
        acc[nome] = acc[nome] || { name: nome, value: 0 };
        acc[nome].value += p.total_proponente_value || 0;
        return acc;
      }, {} as Record<string, { name: string; value: number }>)
    ).filter(item => item.value > 0);

    // Número de Processos por Município
    metrics.num_processos_por_municipio = Object.values(
      processesData.reduce((acc, p) => {
        const nome = p.municipalities?.name || 'Não definido';
        acc[nome] = acc[nome] || { name: nome, value: 0 };
        acc[nome].value += 1;
        return acc;
      }, {} as Record<string, { name: string; value: number }>)
    ).filter(item => item.value > 0);

    // Número de Processos por Núcleo Regional
    metrics.num_processos_por_nucleo = Object.values(
      processesData.reduce((acc, p) => {
        const nome = p.regional_nuclei?.name || 'Não definido';
        acc[nome] = acc[nome] || { name: nome, value: 0 };
        acc[nome].value += 1;
        return acc;
      }, {} as Record<string, { name: string; value: number }>)
    ).filter(item => item.value > 0);

    return metrics;
  };

  // Calcular dados de parcelas pagas no escopo principal do hook
  const parcelasPagas: { value: number; payment_date: string; municipio?: string; nucleo?: string; concedente?: number }[] = [];
  if (processesData) {
    processesData.forEach(p => {
      (p.process_parcels || []).forEach(parcel => {
        if (parcel.payment_date) {
          parcelasPagas.push({
            value: parcel.value,
            payment_date: parcel.payment_date,
            municipio: p.municipalities?.name || 'Não definido',
            nucleo: p.regional_nuclei?.name || 'Não definido',
            concedente: p.total_concedente_value || 0
          });
        }
      });
    });
  }

  // Por mês
  const valoresPagosPorMes: { name: string; value: number }[] = [];
  parcelasPagas.forEach(p => {
    const d = new Date(p.payment_date);
    const key = `${('0'+(d.getMonth()+1)).slice(-2)}/${d.getFullYear()}`;
    const found = valoresPagosPorMes.find(v => v.name === key);
    if (found) found.value += p.value;
    else valoresPagosPorMes.push({ name: key, value: p.value });
  });
  valoresPagosPorMes.sort((a, b) => {
    const [ma, ya] = a.name.split('/').map(Number);
    const [mb, yb] = b.name.split('/').map(Number);
    return ya !== yb ? ya - yb : ma - mb;
  });

  // Por ano
  const valoresPagosPorAno: { name: string; value: number }[] = [];
  parcelasPagas.forEach(p => {
    const d = new Date(p.payment_date);
    const key = `${d.getFullYear()}`;
    const found = valoresPagosPorAno.find(v => v.name === key);
    if (found) found.value += p.value;
    else valoresPagosPorAno.push({ name: key, value: p.value });
  });
  valoresPagosPorAno.sort((a, b) => Number(a.name) - Number(b.name));

  // Empilhado por município
  const valoresEmpilhadosPorMunicipio: { name: string; repassado: number; aRepassar: number }[] = [];
  if (processesData) {
    const municipios = Array.from(new Set(processesData.map(p => p.municipalities?.name || 'Não definido')));
    municipios.forEach(mun => {
      const processosMun = processesData.filter(p => (p.municipalities?.name || 'Não definido') === mun);
      const concedente = processosMun.reduce((sum, p) => sum + (p.total_concedente_value || 0), 0);
      const repassado = processosMun.reduce((sum, p) => sum + (p.process_parcels || []).filter(pp => pp.payment_date).reduce((s, pp) => s + (pp.value || 0), 0), 0);
      valoresEmpilhadosPorMunicipio.push({ name: mun, repassado, aRepassar: Math.max(concedente - repassado, 0) });
    });
  }

  // Empilhado por núcleo
  const valoresEmpilhadosPorNucleo: { name: string; repassado: number; aRepassar: number }[] = [];
  if (processesData) {
    const nucleos = Array.from(new Set(processesData.map(p => p.regional_nuclei?.name || 'Não definido')));
    nucleos.forEach(nuc => {
      const processosNuc = processesData.filter(p => (p.regional_nuclei?.name || 'Não definido') === nuc);
      const concedente = processosNuc.reduce((sum, p) => sum + (p.total_concedente_value || 0), 0);
      const repassado = processosNuc.reduce((sum, p) => sum + (p.process_parcels || []).filter(pp => pp.payment_date).reduce((s, pp) => s + (pp.value || 0), 0), 0);
      valoresEmpilhadosPorNucleo.push({ name: nuc, repassado, aRepassar: Math.max(concedente - repassado, 0) });
    });
  }

  return {
    selectedMetrics,
    setSelectedMetrics,
    metricsData: calculateMetrics(),
    isLoading: !processesData,
    valoresPagosPorMes,
    valoresPagosPorAno,
    valoresEmpilhadosPorMunicipio,
    valoresEmpilhadosPorNucleo
  };
}
