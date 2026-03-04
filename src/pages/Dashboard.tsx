import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, TrendingUp, TrendingDown, Minus, Download, Calendar, Filter, DollarSign, Users, Building, Clock, AlertCircle, BarChart3, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/processUtils';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { format, subDays, startOfYear, endOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface ContratosMetrics {
  total: number;
  porStatus: {
    'Contrato Assinado': number;
    'Em pagamento': number;
    'Termo de Aditivo': number;
    'Em prestação de contas': number;
    'Finalizado': number;
  };
  variacaoPercentual: number;
  periodoAnterior: number;
}

export default function Dashboard() {
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    return {
      startDate: new Date(2020, 0, 1), // 1º de janeiro de 2020
      endDate: new Date() // Data atual
    };
  });
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedNucleus, setSelectedNucleus] = useState<string>('all');

  // Buscar métricas de contratos firmados
  const { data: contratosMetrics, isLoading, refetch } = useQuery({
    queryKey: ['contratos-firmados', dateRange, selectedRegion, selectedNucleus],
    queryFn: async (): Promise<ContratosMetrics> => {
      // Período anterior para comparação
      const daysDiff = Math.ceil((dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24));
      const periodoAnteriorStart = subDays(dateRange.startDate, daysDiff);
      const periodoAnteriorEnd = dateRange.startDate;
      
      // Query para período atual
      let query = supabase
        .from('processes')
        .select(`
          *,
          status_processos!inner(nome),
          regional_nuclei(name)
        `, { count: 'exact' })
        .in('status_processos.nome', [
          'Contrato Assinado',
          'Em pagamento',
          'Termo de Aditivo',
          'Em prestação de contas',
          'Finalizado'
        ])
        .gte('created_at', dateRange.startDate.toISOString())
        .lte('created_at', dateRange.endDate.toISOString());

      // Aplicar filtros de região/núcleo se selecionados
      if (selectedRegion !== 'all') {
        query = query.eq('regional_nuclei.name', selectedRegion);
      }
      if (selectedNucleus !== 'all') {
        query = query.eq('regional_nuclei.id', parseInt(selectedNucleus));
      }

      const { data: currentData, count: currentCount, error: currentError } = await query;

      if (currentError) throw currentError;

      // Query para período anterior
      let queryAnterior = supabase
        .from('processes')
        .select(`
          *,
          status_processos!inner(nome),
          regional_nuclei(name)
        `, { count: 'exact' })
        .in('status_processos.nome', [
          'Contrato Assinado',
          'Em pagamento',
          'Termo de Aditivo',
          'Em prestação de contas',
          'Finalizado'
        ])
        .gte('created_at', periodoAnteriorStart.toISOString())
        .lte('created_at', periodoAnteriorEnd.toISOString());

      if (selectedRegion !== 'all') {
        queryAnterior = queryAnterior.eq('regional_nuclei.name', selectedRegion);
      }
      if (selectedNucleus !== 'all') {
        queryAnterior = queryAnterior.eq('regional_nuclei.id', parseInt(selectedNucleus));
      }

      const { count: anteriorCount, error: anteriorError } = await queryAnterior;

      if (anteriorError) throw anteriorError;

      // Agrupar por status
      const porStatus = {
        'Contrato Assinado': 0,
        'Em pagamento': 0,
        'Termo de Aditivo': 0,
        'Em prestação de contas': 0,
        'Finalizado': 0
      };

      currentData?.forEach(process => {
        const statusName = process.status_processos?.nome;
        if (statusName && statusName in porStatus) {
          porStatus[statusName as keyof typeof porStatus]++;
        }
      });

      // Calcular variação percentual
      const variacaoPercentual = anteriorCount && anteriorCount > 0 
        ? ((currentCount - anteriorCount) / anteriorCount) * 100 
        : 0;

      return {
        total: currentCount || 0,
        porStatus,
        variacaoPercentual,
        periodoAnterior: anteriorCount || 0
      };
    },
    refetchInterval: 30000
  });

  // Buscar métricas financeiras
  const { data: financialMetrics } = useQuery({
    queryKey: ['financial-metrics', dateRange, selectedRegion, selectedNucleus],
    queryFn: async () => {
      let query = supabase
        .from('processes')
        .select('total_portaria_value, total_concedente_value, total_proponente_value, regional_nuclei(name)')
        .gte('created_at', dateRange.startDate.toISOString())
        .lte('created_at', dateRange.endDate.toISOString());

      if (selectedRegion !== 'all') {
        query = query.eq('regional_nuclei.name', selectedRegion);
      }
      if (selectedNucleus !== 'all') {
        query = query.eq('regional_nuclei.id', parseInt(selectedNucleus));
      }

      const { data, error } = await query;
      if (error) throw error;

      const totalPortaria = data?.reduce((sum, p) => sum + (p.total_portaria_value || 0), 0) || 0;
      const totalConcedente = data?.reduce((sum, p) => sum + (p.total_concedente_value || 0), 0) || 0;
      const totalProponente = data?.reduce((sum, p) => sum + (p.total_proponente_value || 0), 0) || 0;

      return {
        totalPortaria,
        totalConcedente,
        totalProponente,
        mediaPorProcesso: data?.length ? totalPortaria / data.length : 0
      };
    },
    refetchInterval: 30000
  });

  // Buscar métricas de municípios
  const { data: municipalityMetrics } = useQuery({
    queryKey: ['municipality-metrics', dateRange, selectedRegion, selectedNucleus],
    queryFn: async () => {
      let query = supabase
        .from('processes')
        .select('municipality_id, regional_nuclei(name)')
        .gte('created_at', dateRange.startDate.toISOString())
        .lte('created_at', dateRange.endDate.toISOString());

      if (selectedRegion !== 'all') {
        query = query.eq('regional_nuclei.name', selectedRegion);
      }
      if (selectedNucleus !== 'all') {
        query = query.eq('regional_nuclei.id', parseInt(selectedNucleus));
      }

      const { data, error } = await query;
      if (error) throw error;

      const uniqueMunicipalities = [...new Set(data?.map(p => p.municipality_id))];
      return {
        totalMunicipalities: uniqueMunicipalities.length,
        totalProcessos: data?.length || 0
      };
    },
    refetchInterval: 30000
  });

  // Buscar métricas de tempo
  const { data: timeMetrics } = useQuery({
    queryKey: ['time-metrics', dateRange, selectedRegion, selectedNucleus],
    queryFn: async () => {
      let query = supabase
        .from('processes')
        .select('created_at, vigencia_date, regional_nuclei(name)')
        .gte('created_at', dateRange.startDate.toISOString())
        .lte('created_at', dateRange.endDate.toISOString());

      if (selectedRegion !== 'all') {
        query = query.eq('regional_nuclei.name', selectedRegion);
      }
      if (selectedNucleus !== 'all') {
        query = query.eq('regional_nuclei.id', parseInt(selectedNucleus));
      }

      const { data, error } = await query;
      if (error) throw error;

      const today = new Date();
      const vencidos = data?.filter(p => {
        if (!p.vigencia_date) return false;
        return new Date(p.vigencia_date) < today;
      }).length || 0;

      const proximosVencimento = data?.filter(p => {
        if (!p.vigencia_date) return false;
        const diffDays = Math.ceil((new Date(p.vigencia_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 30;
      }).length || 0;

      return {
        vencidos,
        proximosVencimento,
        totalProcessos: data?.length || 0
      };
    },
    refetchInterval: 30000
  });

  // Buscar regiões e núcleos para filtros
  const { data: regions } = useQuery({
    queryKey: ['regions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('regional_nuclei')
        .select('name, acronym')
        .not('name', 'is', null);
      
      if (error) throw error;
      
      // Retornar nomes únicos como "regiões"
      const uniqueRegions = [...new Set(data?.map(r => r.name))];
      return uniqueRegions.filter(Boolean);
    }
  });

  const { data: nuclei } = useQuery({
    queryKey: ['nuclei', selectedRegion],
    queryFn: async () => {
      if (selectedRegion === 'all') return [];
      
      const { data, error } = await supabase
        .from('regional_nuclei')
        .select('id, name, acronym')
        .eq('name', selectedRegion);
      
      if (error) throw error;
      return data || [];
    },
    enabled: selectedRegion !== 'all'
  });

  // Presets de período
  const datePresets = [
    { label: 'Todos os Processos', days: null, custom: () => ({ startDate: new Date(2020, 0, 1), endDate: new Date() }) },
    { label: '2026', days: null, custom: () => ({ startDate: new Date(2026, 0, 1), endDate: new Date(2026, 11, 31) }) },
    { label: '2025', days: null, custom: () => ({ startDate: new Date(2025, 0, 1), endDate: new Date(2025, 11, 31) }) },
    { label: '2024', days: null, custom: () => ({ startDate: new Date(2024, 0, 1), endDate: new Date(2024, 11, 31) }) },
    { label: '2023', days: null, custom: () => ({ startDate: new Date(2023, 0, 1), endDate: new Date(2023, 11, 31) }) },
    { label: '2022', days: null, custom: () => ({ startDate: new Date(2022, 0, 1), endDate: new Date(2022, 11, 31) }) },
    { label: '2021', days: null, custom: () => ({ startDate: new Date(2021, 0, 1), endDate: new Date(2021, 11, 31) }) },
    { label: 'Últimos 7 dias', days: 7 },
    { label: 'Últimos 30 dias', days: 30 },
    { label: 'Últimos 90 dias', days: 90 },
    { label: 'Este ano', days: null, custom: () => ({ startDate: startOfYear(new Date()), endDate: endOfYear(new Date()) }) },
    { label: 'Ano passado', days: null, custom: () => {
      const lastYear = new Date().getFullYear() - 1;
      return { startDate: new Date(lastYear, 0, 1), endDate: new Date(lastYear, 11, 31) };
    }}
  ];

  const [selectedPeriod, setSelectedPeriod] = useState<string>('Todos os Processos');

  const applyDatePreset = (preset: any) => {
    setSelectedPeriod(preset.label);
    if (preset.custom) {
      setDateRange(preset.custom());
    } else {
      setDateRange({
        startDate: subDays(new Date(), preset.days),
        endDate: new Date()
      });
    }
  };

  // Exportar PDF
  const exportToPDF = async () => {
    try {
      const element = document.getElementById('dashboard-cards');
      if (!element) {
        toast.error('Cards não encontrados para exportação');
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`dashboard-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('PDF exportado com sucesso');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao exportar PDF');
    }
  };

  const getVariationIcon = () => {
    if (contratosMetrics?.variacaoPercentual > 0) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (contratosMetrics?.variacaoPercentual < 0) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  const getVariationColor = () => {
    if (contratosMetrics?.variacaoPercentual > 0) return 'metric-change-positive';
    if (contratosMetrics?.variacaoPercentual < 0) return 'metric-change-negative';
    return 'metric-change-neutral';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Carregando métricas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-white min-h-screen p-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Início</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-description">
          Visão geral das transferências financeiras do Estado de SC para os municípios
        </p>
      </div>

      {/* Filtros */}
      <div className="filters-section">
        <div className="card-header">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </div>
        <div className="filters-grid">
            {/* Período */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <Select value={selectedPeriod} onValueChange={(value) => {
                const preset = datePresets.find(p => p.label === value);
                if (preset) applyDatePreset(preset);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  {datePresets.map(preset => (
                    <SelectItem key={preset.label} value={preset.label}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Região */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Região</label>
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as regiões" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as regiões</SelectItem>
                  {regions?.map(region => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Núcleo */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Núcleo Regional</label>
              <Select 
                value={selectedNucleus} 
                onValueChange={setSelectedNucleus}
                disabled={selectedRegion === 'all'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os núcleos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os núcleos</SelectItem>
                  {nuclei?.map(nucleus => (
                    <SelectItem key={nucleus.id} value={nucleus.id.toString()}>
                      {nucleus.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Período selecionado */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Período Selecionado</label>
              <div className="p-2 border rounded-md bg-white border-gray-200 text-sm">
                {format(dateRange.startDate, 'dd/MM/yyyy')} - {format(dateRange.endDate, 'dd/MM/yyyy')}
              </div>
            </div>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div id="dashboard-cards" className="metrics-grid">
        {/* Card Contratos Firmados */}
        <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-blue-600" />
              <h3 className="font-semibold text-lg">Contratos Firmados</h3>
            </div>
            <div className="flex items-center gap-2">
              {getVariationIcon()}
              <span className={`metric-change ${getVariationColor()}`}>
                {contratosMetrics?.variacaoPercentual > 0 ? '+' : ''}
                {contratosMetrics?.variacaoPercentual.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="metric-value text-blue-600">
            {contratosMetrics?.total.toLocaleString('pt-BR') || '0'}
          </div>
          <div className="metric-label">
            vs {contratosMetrics?.periodoAnterior} no período anterior
          </div>
        </div>

        {/* Card Valor Total */}
        <div className="metric-card">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="h-6 w-6 text-green-600" />
            <h3 className="font-semibold text-lg">Valor Total</h3>
          </div>
          <div className="metric-value text-green-600">
            {formatCurrency(financialMetrics?.totalPortaria || 0)}
          </div>
          <div className="metric-label">
            Média por processo: {formatCurrency(financialMetrics?.mediaPorProcesso || 0)}
          </div>
        </div>

        {/* Card Municípios Atendidos */}
        <div className="metric-card">
          <div className="flex items-center gap-3 mb-4">
            <Building className="h-6 w-6 text-purple-600" />
            <h3 className="font-semibold text-lg">Municípios Atendidos</h3>
          </div>
          <div className="metric-value text-purple-600">
            {municipalityMetrics?.totalMunicipalities.toLocaleString('pt-BR') || '0'}
          </div>
          <div className="metric-label">
            {municipalityMetrics?.totalProcessos || 0} processos no total
          </div>
        </div>

        {/* Card Status Vigência */}
        <div className="metric-card">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="h-6 w-6 text-orange-600" />
            <h3 className="font-semibold text-lg">Status Vigência</h3>
          </div>
          <div className="metric-value text-orange-600">
            {timeMetrics?.proximosVencimento || '0'}
          </div>
          <div className="metric-label">
            {timeMetrics?.vencidos || 0} vencidos • {timeMetrics?.proximosVencimento || 0} próximos ao vencimento
          </div>
        </div>
      </div>

      {/* Card Detalhado Contratos Firmados */}
      <div id="contratos-card">
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="bg-white border-b border-gray-100">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-gray-900">
                <FileText className="h-6 w-6 text-blue-600" />
                Detalhamento - Contratos Firmados
              </CardTitle>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={exportToPDF}
                  className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <Download className="h-4 w-4" />
                  Exportar PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 bg-white">
            <div className="text-center">
              {/* Número principal */}
              <div className="text-6xl font-bold text-blue-600 mb-4">
                {contratosMetrics?.total.toLocaleString('pt-BR') || '0'}
              </div>
              
              {/* Variação percentual */}
              <div className={`flex items-center justify-center gap-2 text-lg font-medium ${getVariationColor()}`}>
                {getVariationIcon()}
                <span>
                  {contratosMetrics?.variacaoPercentual > 0 ? '+' : ''}
                  {contratosMetrics?.variacaoPercentual.toFixed(1)}% vs período anterior
                </span>
              </div>
              
              {/* Breakdown por status */}
              <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(contratosMetrics?.porStatus || {}).map(([status, count]) => (
                  <div key={status} className="text-center p-4 bg-white border border-gray-200 rounded-lg">
                    <div className="text-2xl font-bold text-gray-800">{count}</div>
                    <div className="text-sm text-gray-600 mt-1">{status}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cards Financeiros Detalhados */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="bg-white border-b border-gray-100">
            <CardTitle className="flex items-center gap-3 text-gray-900">
              <DollarSign className="h-6 w-6 text-green-600" />
              Valor Portaria
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-white">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">
                {formatCurrency(financialMetrics?.totalPortaria || 0)}
              </div>
              <div className="text-sm text-gray-600">
                Valor total autorizado
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="bg-white border-b border-gray-100">
            <CardTitle className="flex items-center gap-3 text-gray-900">
              <DollarSign className="h-6 w-6 text-blue-600" />
              Valor Concedente
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-white">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {formatCurrency(financialMetrics?.totalConcedente || 0)}
              </div>
              <div className="text-sm text-gray-600">
                Valor repassado pelo Estado
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="bg-white border-b border-gray-100">
            <CardTitle className="flex items-center gap-3 text-gray-900">
              <DollarSign className="h-6 w-6 text-purple-600" />
              Valor Proponente
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-white">
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">
                {formatCurrency(financialMetrics?.totalProponente || 0)}
              </div>
              <div className="text-sm text-gray-600">
                Contrapartida do município
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Novos Cards de Métricas Adicionais */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {/* Card Processos em Andamento */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="bg-white border-b border-gray-100">
            <CardTitle className="flex items-center gap-3 text-gray-900">
              <Clock className="h-6 w-6 text-yellow-600" />
              Processos em Andamento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-white">
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-600 mb-2">
                {contratosMetrics?.porStatus['Em pagamento'] || 0}
              </div>
              <div className="text-sm text-gray-600">
                Em fase de pagamento
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card Processos Finalizados */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="bg-white border-b border-gray-100">
            <CardTitle className="flex items-center gap-3 text-gray-900">
              <FileText className="h-6 w-6 text-green-600" />
              Processos Finalizados
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-white">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">
                {contratosMetrics?.porStatus['Finalizado'] || 0}
              </div>
              <div className="text-sm text-gray-600">
                Concluídos com sucesso
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card Taxa de Finalização */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="bg-white border-b border-gray-100">
            <CardTitle className="flex items-center gap-3 text-gray-900">
              <TrendingUp className="h-6 w-6 text-blue-600" />
              Taxa de Finalização
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-white">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {contratosMetrics?.total ? 
                  ((contratosMetrics.porStatus['Finalizado'] || 0) / contratosMetrics.total * 100).toFixed(1) 
                  : '0'}%
              </div>
              <div className="text-sm text-gray-600">
                Dos processos totais
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card Aditivos */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="bg-white border-b border-gray-100">
            <CardTitle className="flex items-center gap-3 text-gray-900">
              <FileText className="h-6 w-6 text-purple-600" />
              Termos de Aditivo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-white">
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">
                {contratosMetrics?.porStatus['Termo de Aditivo'] || 0}
              </div>
              <div className="text-sm text-gray-600">
                Processos com aditivos
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seção de Gráficos e Estatísticas */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Card de Distribuição por Status */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="bg-white border-b border-gray-100">
            <CardTitle className="flex items-center gap-3 text-gray-900">
              <BarChart3 className="h-6 w-6 text-gray-600" />
              Distribuição por Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-white">
            <div className="space-y-4">
              {Object.entries(contratosMetrics?.porStatus || {}).map(([status, count]) => {
                const percentage = contratosMetrics?.total ? 
                  (count / contratosMetrics.total * 100).toFixed(1) : '0';
                const colors = {
                  'Contrato Assinado': 'bg-blue-500',
                  'Em pagamento': 'bg-yellow-500',
                  'Termo de Aditivo': 'bg-purple-500',
                  'Em prestação de contas': 'bg-orange-500',
                  'Finalizado': 'bg-green-500'
                };
                
                return (
                  <div key={status} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{status}</span>
                      <span className="text-gray-600">{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`${colors[status as keyof typeof colors] || 'bg-gray-500'} h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Card de Métricas de Desempenho */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="bg-white border-b border-gray-100">
            <CardTitle className="flex items-center gap-3 text-gray-900">
              <TrendingUp className="h-6 w-6 text-gray-600" />
              Métricas de Desempenho
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-white">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-white border border-gray-200 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {financialMetrics?.mediaPorProcesso ? 
                    formatCurrency(financialMetrics.mediaPorProcesso) : 
                    formatCurrency(0)
                  }
                </div>
                <div className="text-sm text-gray-600 mt-1">Média por Processo</div>
              </div>
              <div className="text-center p-4 bg-white border border-gray-200 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {municipalityMetrics?.totalProcessos && municipalityMetrics.totalMunicipalities ?
                    (municipalityMetrics.totalProcessos / municipalityMetrics.totalMunicipalities).toFixed(1) :
                    '0'
                  }
                </div>
                <div className="text-sm text-gray-600 mt-1">Média por Município</div>
              </div>
              <div className="text-center p-4 bg-white border border-gray-200 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {timeMetrics?.totalProcessos && timeMetrics.proximosVencimento ?
                    ((timeMetrics.proximosVencimento / timeMetrics.totalProcessos) * 100).toFixed(1) :
                    '0'
                }%
                </div>
                <div className="text-sm text-gray-600 mt-1">Próximos ao Vencimento</div>
              </div>
              <div className="text-center p-4 bg-white border border-gray-200 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {timeMetrics?.totalProcessos && timeMetrics.vencidos ?
                    ((timeMetrics.vencidos / timeMetrics.totalProcessos) * 100).toFixed(1) :
                    '0'
                }%
                </div>
                <div className="text-sm text-gray-600 mt-1">Vencidos</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seção de Alertas e Ações */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Card de Alertas */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="bg-white border-b border-gray-100">
            <CardTitle className="flex items-center gap-3 text-gray-900">
              <AlertCircle className="h-6 w-6 text-red-600" />
              Alertas Críticos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-white">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium">Processos Vencidos</span>
                </div>
                <Badge variant="destructive" className="text-xs">
                  {timeMetrics?.vencidos || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm font-medium">Vencimento em 30 dias</span>
                </div>
                <Badge variant="secondary" className="text-xs bg-orange-200 text-orange-800">
                  {timeMetrics?.proximosVencimento || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm font-medium">Em Prestação de Contas</span>
                </div>
                <Badge variant="secondary" className="text-xs bg-yellow-200 text-yellow-800">
                  {contratosMetrics?.porStatus['Em prestação de contas'] || 0}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card de Ações Rápidas */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="bg-white border-b border-gray-100">
            <CardTitle className="flex items-center gap-3 text-gray-900">
              <Settings className="h-6 w-6 text-gray-600" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-white">
            <div className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar Relatório Completo
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Agendar Relatório Mensal
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Notificar Gestores
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Gerar Termo de Referência
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Card de Resumo Financeiro */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="bg-white border-b border-gray-100">
            <CardTitle className="flex items-center gap-3 text-gray-900">
              <DollarSign className="h-6 w-6 text-green-600" />
              Resumo Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-white">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg">
                <span className="text-sm font-medium">Total Portaria</span>
                <span className="text-sm font-bold text-green-600">
                  {formatCurrency(financialMetrics?.totalPortaria || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg">
                <span className="text-sm font-medium">Total Concedente</span>
                <span className="text-sm font-bold text-blue-600">
                  {formatCurrency(financialMetrics?.totalConcedente || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg">
                <span className="text-sm font-medium">Total Proponente</span>
                <span className="text-sm font-bold text-purple-600">
                  {formatCurrency(financialMetrics?.totalProponente || 0)}
                </span>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Eficiência</span>
                  <Badge className="bg-green-100 text-green-800">
                    {financialMetrics?.totalPortaria && financialMetrics.totalConcedente ?
                      ((financialMetrics.totalConcedente / financialMetrics.totalPortaria) * 100).toFixed(1) :
                      '0'
                    }%
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informações do sistema */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <div className="bg-white border-gray-200 shadow-sm rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Sobre o Sistema</h3>
            <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">SC</span>
            </div>
          </div>
          <div className="space-y-3 text-sm text-gray-700">
            <p>
              O Transfer Radar é o sistema oficial de monitoramento das transferências 
              financeiras do Estado de Santa Catarina para os municípios.
            </p>
            <p>
              Desenvolvido pela GEINFRA/SETUR, oferece transparência e controle 
              sobre os recursos públicos investidos em infraestrutura municipal.
            </p>
            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs text-blue-600 font-medium">
                Portal desenvolvido pela GEINFRA/SETUR - Governo do Estado de SC
              </p>
            </div>
          </div>
        </div>

        {/* Resumo dos filtros aplicados */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="bg-white border-b border-gray-100">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Calendar className="h-5 w-5 text-gray-600" />
              Resumo da Análise
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-white">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Período analisado:</span>
                <span className="text-sm font-medium">
                  {format(dateRange.startDate, 'dd/MM/yyyy')} - {format(dateRange.endDate, 'dd/MM/yyyy')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Região:</span>
                <span className="text-sm font-medium">
                  {selectedRegion === 'all' ? 'Todas' : selectedRegion}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Núcleo:</span>
                <span className="text-sm font-medium">
                  {selectedNucleus === 'all' ? 'Todos' : nuclei?.find(n => n.id.toString() === selectedNucleus)?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Período anterior:</span>
                <span className="text-sm font-medium">
                  {contratosMetrics?.periodoAnterior} contratos
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
