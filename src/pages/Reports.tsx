import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { ReportCard } from '@/components/reports/ReportCard';
import { FileText, BarChart3, TrendingUp, Users, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';
import { useProcesses } from '@/hooks/useProcesses';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

// Lista de campos importantes para relatório de repasses
const ALL_FIELDS = [
  { key: 'process_number', label: 'Número do Processo' },
  { key: 'object', label: 'Objeto do Processo' },
  { key: 'municipalities.name', label: 'Município' },
  { key: 'municipalities.regioes.nome', label: 'Região' },
  { key: 'regional_nuclei.name', label: 'Núcleo Regional' },
  { key: 'status_processos.nome', label: 'Status do Processo' },
  { key: 'total_portaria_value', label: 'Valor Total da Portaria' },
  { key: 'total_proponente_value', label: 'Valor Total do Proponente' },
  { key: 'total_concedente_value', label: 'Valor Total do Concedente' },
  { key: 'licitado_value', label: 'Valor Licitado' },
  { key: 'created_at', label: 'Data de Criação' },
  { key: 'vigencia_date', label: 'Data de Vigência' },
  { key: 'last_tramitacao', label: 'Última Tramitação' },
  { key: 'address', label: 'Endereço da Obra/Projeto' },
  { key: 'latitude', label: 'Latitude' },
  { key: 'longitude', label: 'Longitude' },
  { key: 'portaria_number', label: 'Número da Portaria' },
];

const DEFAULT_FIELDS = [
  'process_number', 'object', 'municipalities.name', 'municipalities.regioes.nome',
  'regional_nuclei.name', 'status_processos.nome', 'total_portaria_value',
  'total_proponente_value', 'total_concedente_value', 'created_at', 'vigencia_date'
];

// Mapeamento de campos padrão para cada tipo de relatório
const REPORT_FIELDS: Record<string, string[]> = {
  process: [
    'process_number', 'object', 'municipalities.name', 'regional_nuclei.name',
    'status_processos.nome', 'total_portaria_value', 'created_at', 'vigencia_date'
  ],
  financial: [
    'process_number', 'municipalities.name', 'regional_nuclei.name',
    'total_portaria_value', 'total_concedente_value', 'total_proponente_value',
    'licitado_value', 'created_at', 'vigencia_date'
  ],
  municipality: [
    'municipalities.name', 'process_number', 'object', 'status_processos.nome',
    'total_portaria_value', 'created_at', 'vigencia_date'
  ],
  dashboard: [
    'process_number', 'municipalities.name', 'regional_nuclei.name',
    'status_processos.nome', 'total_portaria_value', 'created_at'
  ]
};

export default function Reports() {
  const [dateRange, setDateRange] = useState<{from?: Date, to?: Date}>({});
  const [municipality, setMunicipality] = useState('all');
  const [nucleus, setNucleus] = useState('all');
  const [reportType, setReportType] = useState('');
  const [showFieldSelector, setShowFieldSelector] = useState(false);
  const [selectedFields, setSelectedFields] = useState<string[]>(DEFAULT_FIELDS);
  const { toast } = useToast();

  // --- NOVOS HOOKS PARA MUNICÍPIOS, NÚCLEOS E REGIÕES ---
  const { data: allMunicipalities = [] } = useQuery({
    queryKey: ['all-municipalities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('municipalities')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });
  const { data: allNuclei = [] } = useQuery({
    queryKey: ['all-nuclei'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('regional_nuclei')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });
  const { data: allRegions = [] } = useQuery({
    queryKey: ['all-regions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('regioes')
        .select('id, nome')
        .order('nome');
      if (error) throw error;
      return data || [];
    },
  });

  // --- ESTADO PARA FILTROS E ORDENAÇÃO ---
  const [region, setRegion] = useState('all');
  const [proponentValue, setProponentValue] = useState('');
  const [sortField, setSortField] = useState('total_concedente_value');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [vigenciaStatus, setVigenciaStatus] = useState('all');

  const { data: processesData = [], isLoading: isLoadingProcesses } = useProcesses({
    searchTerm: '',
    municipality,
    nucleus,
    dateFrom: dateRange.from,
    dateTo: dateRange.to,
  });

  // --- FILTRAGEM E ORDENAÇÃO DOS DADOS ---
  const filteredData = useMemo(() => {
    let data = [...processesData];
    if (municipality !== 'all') {
      data = data.filter(p => p.municipality_id === Number(municipality));
    }
    if (nucleus !== 'all') {
      data = data.filter(p => p.regional_nucleus_id === Number(nucleus));
    }
    if (region !== 'all') {
      data = data.filter(p => p.municipalities?.regioes?.nome === region);
    }
    if (proponentValue) {
      data = data.filter(p => (p.total_proponente_value || 0) >= Number(proponentValue));
    }
    // Filtro de vigência
    const today = new Date();
    const plus30 = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (vigenciaStatus === 'vencidos') {
      data = data.filter(p => new Date(p.vigencia_date) < today);
    } else if (vigenciaStatus === 'vigentes') {
      data = data.filter(p => new Date(p.vigencia_date) >= today);
    } else if (vigenciaStatus === 'proximos') {
      data = data.filter(p => {
        const d = new Date(p.vigencia_date);
        return d >= today && d <= plus30;
      });
    }
    // Ordenação
    data = data.sort((a, b) => {
      const aValue = a[sortField] || 0;
      const bValue = b[sortField] || 0;
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });
    return data;
  }, [processesData, municipality, nucleus, region, proponentValue, sortField, sortOrder, vigenciaStatus]);

  // Função para filtrar os campos exportados, tratando nulos e aninhados
  function filterFields(data: any[], fields: string[]) {
    return data.map(item => {
      const filtered: Record<string, any> = {};
      fields.forEach(field => {
        // Suporte a campos aninhados
        let value = field.split('.').reduce((acc, key) => acc?.[key], item);
        if (value === null || value === undefined) value = '';
        if (typeof value === 'object' && value !== null) value = JSON.stringify(value);
        filtered[field] = value;
      });
      return filtered;
    });
  }

  function exportToExcel(data: any[], fileName: string, fields: string[]) {
    try {
      const filtered = filterFields(data, fields);
      const worksheet = XLSX.utils.json_to_sheet(filtered);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório');
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      saveAs(blob, `${fileName}.xlsx`);
      toast({ title: 'Download iniciado', description: 'Arquivo Excel gerado com sucesso.' });
    } catch (e) {
      throw e;
    }
  }

  function exportToCSV(data: any[], fileName: string, fields: string[]) {
    try {
      const filtered = filterFields(data, fields);
      const worksheet = XLSX.utils.json_to_sheet(filtered);
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `${fileName}.csv`);
      toast({ title: 'Download iniciado', description: 'Arquivo CSV gerado com sucesso.' });
    } catch (e) {
      throw e;
    }
  }

  function exportToPDF(data: any[], fileName: string, fields: string[]) {
    try {
      const filtered = filterFields(data, fields);
      const columns = fields.map(f => ALL_FIELDS.find(x => x.key === f)?.label || f);
      const rows = filtered.map(obj => fields.map(col => obj[col]));
      // Usar orientação paisagem
      const doc = new jsPDF({ orientation: 'landscape' });
      autoTable(doc, { head: [columns], body: rows });
      doc.save(`${fileName}.pdf`);
      toast({ title: 'Download iniciado', description: 'Arquivo PDF gerado com sucesso.' });
    } catch (e) {
      throw e;
    }
  }

  // Função para exportar relatório pré-definido
  function handlePredefinedDownload(reportType: string, fileFormat: 'PDF' | 'XLSX' | 'CSV', reportName: string) {
    const data = processesData;
    const fields = REPORT_FIELDS[reportType] || DEFAULT_FIELDS;
    if (!data || data.length === 0) {
      toast({ title: 'Nenhum dado encontrado', description: 'Não há dados para exportação.', variant: 'destructive' });
      return;
    }
    try {
      if (fileFormat === 'PDF') exportToPDF(data, reportName, fields);
      if (fileFormat === 'XLSX') exportToExcel(data, reportName, fields);
      if (fileFormat === 'CSV') exportToCSV(data, reportName, fields);
    } catch (e) {
      toast({ title: 'Erro ao exportar', description: 'Ocorreu um erro ao gerar o arquivo.', variant: 'destructive' });
    }
  }

  // --- ATUALIZAR EXPORTAÇÃO PARA USAR filteredData ---
  const handleDownload = (reportName: string, fileFormat: 'PDF' | 'XLSX' | 'CSV') => {
    const data = filteredData;
    if (!data || data.length === 0) {
      toast({ title: 'Nenhum dado encontrado', description: 'Não há dados para exportação.', variant: 'destructive' });
      return;
    }
    try {
      if (fileFormat === 'PDF') exportToPDF(data, reportName, selectedFields);
      if (fileFormat === 'XLSX') exportToExcel(data, reportName, selectedFields);
      if (fileFormat === 'CSV') exportToCSV(data, reportName, selectedFields);
    } catch (e) {
      toast({ title: 'Erro ao exportar', description: 'Ocorreu um erro ao gerar o arquivo.', variant: 'destructive' });
    }
  };

  const generateReport = (reportName: string) => {
    handleDownload(reportName, 'PDF');
  };

  const reports = [
    {
      title: 'Relatório de Processos',
      description: 'Relatório completo de todos os processos com status, valores e prazos',
      type: 'process' as const,
      status: 'available' as const,
      lastGenerated: '2024-07-04T10:30:00'
    },
    {
      title: 'Análise Financeira',
      description: 'Análise detalhada dos valores investidos por região e município',
      type: 'financial' as const,
      status: 'available' as const,
      lastGenerated: '2024-07-03T15:45:00'
    },
    {
      title: 'Dashboard Executivo',
      description: 'Visão executiva com principais KPIs e indicadores',
      type: 'dashboard' as const,
      status: 'processing' as const
    },
    {
      title: 'Relatório por Município',
      description: 'Detalhamento dos investimentos por município',
      type: 'municipality' as const,
      status: 'available' as const,
      lastGenerated: '2024-07-04T08:15:00'
    }
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Início</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Relatórios</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-muted-foreground">
          Gere relatórios personalizados sobre transferências e investimentos
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Última atualização: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
        </p>
      </div>

      {/* Botão Personalizar Campos do Relatório - AGORA MAIS VISÍVEL */}
      <div className="flex justify-end mb-4">
        <Dialog open={showFieldSelector} onOpenChange={setShowFieldSelector}>
          <DialogTrigger asChild>
            <Button variant="outline" onClick={() => setShowFieldSelector(true)}>
              Personalizar Campos do Relatório
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Selecione os campos para exportação</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {ALL_FIELDS.map(field => (
                <div key={field.key} className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedFields.includes(field.key)}
                    onCheckedChange={checked => {
                      if (checked) setSelectedFields([...selectedFields, field.key]);
                      else setSelectedFields(selectedFields.filter(f => f !== field.key));
                    }}
                  />
                  <span>{field.label}</span>
                </div>
              ))}
            </div>
            {/* Indicação clara de download */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded flex flex-col gap-2">
              <span className="font-medium text-blue-700">Após personalizar os campos, baixe o relatório no formato desejado:</span>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" onClick={() => handleDownload('Relatório Personalizado', 'PDF')}>
                  Baixar PDF
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleDownload('Relatório Personalizado', 'XLSX')}>
                  Baixar XLS
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleDownload('Relatório Personalizado', 'CSV')}>
                  Baixar CSV
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Filtros de Relatório
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Período (De)</label>
              <DatePicker
                selected={dateRange.from}
                onSelect={(date) => setDateRange(prev => ({...prev, from: date}))}
                placeholderText="Data inicial"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Período (Até)</label>
              <DatePicker
                selected={dateRange.to}
                onSelect={(date) => setDateRange(prev => ({...prev, to: date}))}
                placeholderText="Data final"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Município</label>
              <Select value={municipality} onValueChange={setMunicipality}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um município" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os municípios</SelectItem>
                  {allMunicipalities.map((m: any) => (
                    <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Núcleo Regional</label>
              <Select value={nucleus} onValueChange={setNucleus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um núcleo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os núcleos</SelectItem>
                  {allNuclei.map((n: any) => (
                    <SelectItem key={n.id} value={String(n.id)}>{n.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Região</label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma região" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as regiões</SelectItem>
                  {allRegions.map((r: any) => (
                    <SelectItem key={r.id} value={r.nome}>{r.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Valor Proponente (mínimo)</label>
              <input type="number" className="input input-bordered w-full" value={proponentValue} onChange={e => setProponentValue(e.target.value)} placeholder="Valor mínimo" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Prazo de Vigência</label>
              <Select value={vigenciaStatus} onValueChange={setVigenciaStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="vencidos">Vencidos</SelectItem>
                  <SelectItem value="vigentes">Vigentes</SelectItem>
                  <SelectItem value="proximos">Próximos do vencimento (30 dias)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Outros filtros relevantes podem ser adicionados aqui */}
          </div>
          <div className="flex gap-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ordenar por</label>
              <Select value={sortField} onValueChange={setSortField}>
                <SelectTrigger>
                  <SelectValue placeholder="Campo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="total_concedente_value">Valor do Concedente</SelectItem>
                  <SelectItem value="total_proponente_value">Valor do Proponente</SelectItem>
                  <SelectItem value="total_portaria_value">Valor Total da Portaria</SelectItem>
                  <SelectItem value="saldo_repassar">Saldo a Repassar</SelectItem>
                  <SelectItem value="valor_repassado">Valor Repassado</SelectItem>
                  <SelectItem value="num_processos">Número de Processos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ordem</label>
              <Select value={sortOrder} onValueChange={v => setSortOrder(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Ordem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Maior para menor</SelectItem>
                  <SelectItem value="asc">Menor para maior</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">24</p>
                <p className="text-xs text-muted-foreground">Relatórios Gerados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">R$ 67M</p>
                <p className="text-xs text-muted-foreground">Valor Total Analisado</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">60</p>
                <p className="text-xs text-muted-foreground">Municípios Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <MapPin className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">21</p>
                <p className="text-xs text-muted-foreground">Núcleos Regionais</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Relatórios */}
      {isLoadingProcesses ? (
        <div className="text-center py-8">Carregando dados dos relatórios...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report, index) => (
            <ReportCard
              key={index}
              title={report.title}
              description={report.description}
              type={report.type}
              status={report.status}
              lastGenerated={report.lastGenerated}
              onGenerate={() => generateReport(report.title)}
              onView={report.status === 'available' ? () => console.log(`Visualizar ${report.title}`) : undefined}
              onDownloadPDF={() => handlePredefinedDownload(report.type, 'PDF', report.title)}
              onDownloadExcel={() => handlePredefinedDownload(report.type, 'XLSX', report.title)}
              onDownloadCSV={() => handlePredefinedDownload(report.type, 'CSV', report.title)}
            />
          ))}
        </div>
      )}

      {/* Ações Rápidas */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => handleDownload('Relatório Completo', 'PDF')}>
              Relatório Completo (PDF)
            </Button>
            <Button variant="outline" onClick={() => handleDownload('Dados Exportação', 'XLSX')}>
              Exportar Dados (XLSX)
            </Button>
            <Button variant="outline" onClick={() => handleDownload('Resumo Executivo', 'CSV')}>
              Resumo Executivo (CSV)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
