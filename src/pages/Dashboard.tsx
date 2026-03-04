
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, TrendingUp, TrendingDown, Minus, Download, Calendar, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/processUtils';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import { html2canvas } from 'html2canvas';
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
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: subDays(new Date(), 30),
    endDate: new Date()
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
        .select('*', { count: 'exact' })
        .in('status', [
          'Contrato Assinado',
          'Em pagamento',
          'Termo de Aditivo',
          'Em prestação de contas',
          'Finalizado'
        ])
        .gte('created_at', dateRange.startDate.toISOString())
        .lte('created_at', dateRange.endDate.toISOString())
        .is('deleted_at', null);

      // Aplicar filtros de região/núcleo se selecionados
      if (selectedRegion !== 'all') {
        query = query.eq('regional_nuclei.region', selectedRegion);
      }
      if (selectedNucleus !== 'all') {
        query = query.eq('regional_nuclei.id', selectedNucleus);
      }

      const { data: currentData, count: currentCount, error: currentError } = await query;

      if (currentError) throw currentError;

      // Query para período anterior
      let queryAnterior = supabase
        .from('processes')
        .select('*', { count: 'exact' })
        .in('status', [
          'Contrato Assinado',
          'Em pagamento',
          'Termo de Aditivo',
          'Em prestação de contas',
          'Finalizado'
        ])
        .gte('created_at', periodoAnteriorStart.toISOString())
        .lte('created_at', periodoAnteriorEnd.toISOString())
        .is('deleted_at', null);

      if (selectedRegion !== 'all') {
        queryAnterior = queryAnterior.eq('regional_nuclei.region', selectedRegion);
      }
      if (selectedNucleus !== 'all') {
        queryAnterior = queryAnterior.eq('regional_nuclei.id', selectedNucleus);
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
        if (process.status in porStatus) {
          porStatus[process.status as keyof typeof porStatus]++;
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

  // Buscar regiões e núcleos para filtros
  const { data: regions } = useQuery({
    queryKey: ['regions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('regional_nuclei')
        .select('region')
        .not('region', 'is', null);
      
      if (error) throw error;
      
      const uniqueRegions = [...new Set(data?.map(r => r.region))];
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
        .eq('region', selectedRegion);
      
      if (error) throw error;
      return data || [];
    },
    enabled: selectedRegion !== 'all'
  });

  // Presets de período
  const datePresets = [
    { label: 'Últimos 7 dias', days: 7 },
    { label: 'Últimos 30 dias', days: 30 },
    { label: 'Últimos 90 dias', days: 90 },
    { label: 'Este ano', days: null, custom: () => ({ startDate: startOfYear(new Date()), endDate: endOfYear(new Date()) }) },
    { label: 'Ano passado', days: null, custom: () => {
      const lastYear = new Date().getFullYear() - 1;
      return { startDate: new Date(lastYear, 0, 1), endDate: new Date(lastYear, 11, 31) };
    }}
  ];

  const applyDatePreset = (preset: any) => {
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
      const element = document.getElementById('contratos-card');
      if (!element) {
        toast.error('Card não encontrado para exportação');
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

      pdf.save(`contratos-firmados-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('PDF exportado com sucesso');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao exportar PDF');
    }
  };

  // Exportar PNG
  const exportToPNG = async () => {
    try {
      const element = document.getElementById('contratos-card');
      if (!element) {
        toast.error('Card não encontrado para exportação');
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff'
      });
      
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `contratos-firmados-${format(new Date(), 'yyyy-MM-dd')}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.success('PNG exportado com sucesso');
        }
      });
    } catch (error) {
      console.error('Erro ao exportar PNG:', error);
      toast.error('Erro ao exportar PNG');
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
    if (contratosMetrics?.variacaoPercentual > 0) return 'text-green-600';
    if (contratosMetrics?.variacaoPercentual < 0) return 'text-red-600';
    return 'text-gray-600';
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
    <div className="space-y-6">
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

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral das transferências financeiras do Estado de SC para os municípios
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Período */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <Select onValueChange={(value) => {
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
                    <SelectItem key={nucleus.id} value={nucleus.id}>
                      {nucleus.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Período selecionado */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Período Selecionado</label>
              <div className="p-2 border rounded-md bg-gray-50 text-sm">
                {format(dateRange.startDate, 'dd/MM/yyyy')} - {format(dateRange.endDate, 'dd/MM/yyyy')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card Contratos Firmados */}
      <div id="contratos-card">
        <Card className="border-2 border-blue-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-blue-900">
                <FileText className="h-6 w-6" />
                Contratos Firmados
              </CardTitle>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={exportToPDF}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Exportar PDF
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={exportToPNG}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Exportar PNG
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
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
                  <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-800">{count}</div>
                    <div className="text-sm text-gray-600 mt-1">{status}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informações do sistema */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-6">
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
            <div className="pt-3 border-t border-blue-200">
              <p className="text-xs text-blue-600 font-medium">
                Portal desenvolvido pela GEINFRA/SETUR - Governo do Estado de SC
              </p>
            </div>
          </div>
        </div>

        {/* Resumo dos filtros aplicados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Resumo da Análise
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                  {selectedNucleus === 'all' ? 'Todos' : nuclei?.find(n => n.id === selectedNucleus)?.name}
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
