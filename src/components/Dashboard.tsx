import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  DollarSign, 
  Building, 
  MapPin, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, getStatusColor, getStatusLabel } from "@/utils/processUtils";
import { SystemNotifications } from "@/components/notifications/SystemNotifications";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { EnhancedStatsCards } from "@/components/dashboard/EnhancedStatsCards";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { EnhancedCharts } from "@/components/dashboard/EnhancedCharts";
import { CustomizableDashboardCharts } from "@/components/dashboard/CustomizableDashboardCharts";
import { ProcessChart, RegionChart } from "@/components/dashboard/Charts";
import { StatusDistribution } from "@/components/dashboard/StatusDistribution";
import { ProcessInsights } from "@/components/dashboard/ProcessInsights";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Database } from "@/integrations/supabase/types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

type TransferStatus = Database['public']['Enums']['transfer_status'];

export function Dashboard() {
  const [filters, setFilters] = useState({
    year: "",
    regionalNucleus: "",
    status: "",
    period: null as Date | null
  });

  const { data: stats, isLoading } = useDashboardStats();

  const { data: regionalNuclei } = useQuery({
    queryKey: ['regional-nuclei-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('regional_nuclei')
        .select('id, name, acronym')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  const { data: statusOptions } = useQuery({
    queryKey: ['status-options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('status_processos')
        .select('nome')
        .eq('ativo', true)
        .order('ordem');
      
      if (error) throw error;
      return data || [];
    }
  });

  const { data: filteredStats } = useQuery({
    queryKey: ['filtered-dashboard-stats', filters],
    queryFn: async () => {
      let query = supabase
        .from('processes')
        .select(`
          *,
          municipalities (name),
          regional_nuclei (name, acronym),
          status_processos (nome, cor),
          process_parcels (
            value,
            payment_date
          )
        `);

      if (filters.year) {
        query = query.gte('created_at', `${filters.year}-01-01`)
                    .lt('created_at', `${parseInt(filters.year) + 1}-01-01`);
      }

      if (filters.regionalNucleus) {
        query = query.eq('regional_nucleus_id', parseInt(filters.regionalNucleus));
      }

      if (filters.status) {
        query = query.eq('status_processos.nome', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Process data for charts
      const statusDistribution = data?.reduce((acc: any, process) => {
        const status = process.status_processos?.nome || 'Não definido';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      const regionalDistribution = data?.reduce((acc: any, process) => {
        const region = process.regional_nuclei?.name || 'Não definido';
        if (!acc[region]) {
          acc[region] = { count: 0, value: 0 };
        }
        acc[region].count += 1;
        acc[region].value += process.total_portaria_value || 0;
        return acc;
      }, {});

      const totalProcesses = data?.length || 0;

      const statusData = Object.entries(statusDistribution || {}).map(([status, count]) => ({
        status,
        count: count as number,
        percentage: Math.round(((count as number) / totalProcesses) * 100)
      }));

      const regionalData = Object.entries(regionalDistribution || {}).map(([region, data]: [string, any]) => ({
        region: region.length > 15 ? region.substring(0, 15) + '...' : region,
        count: data.count,
        value: data.value
      }));

      // Calcular estatísticas de execução baseadas nos status
      // Assumindo que alguns status representam diferentes estados de execução
      const executionStats = {
        notStarted: statusDistribution?.['Em Análise'] || 0,
        inProgress: (statusDistribution?.['Em Execução'] || 0) + (statusDistribution?.['Aprovados'] || 0),
        completed: statusDistribution?.['Finalizados'] || 0,
      };

      return {
        statusData,
        regionalData,
        totalValue: data?.reduce((sum, p) => sum + (p.total_portaria_value || 0), 0) || 0,
        totalProcesses,
        processes: data || [],
        executionStats
      };
    },
    enabled: Object.values(filters).some(v => v !== "" && v !== null)
  });

  const { data: recentProcesses } = useQuery({
    queryKey: ['recent-processes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('processes')
        .select(`
          *,
          municipalities (name),
          status_processos (nome, cor)
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Finalizado':
        return <CheckCircle className="h-4 w-4" />;
      case 'Cancelado':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const displayStats = filteredStats || stats;
  const processes = displayStats?.processes || [];

  // Agrupamentos para os gráficos
  const municipios = useMemo(() => {
    const map: Record<string, { concedente: number; contrapartida: number; count: number }> = {};
    processes.forEach(p => {
      const nome = p.municipalities?.name || "Não definido";
      if (!map[nome]) map[nome] = { concedente: 0, contrapartida: 0, count: 0 };
      map[nome].concedente += p.total_concedente_value || 0;
      map[nome].contrapartida += p.total_proponente_value || 0;
      map[nome].count += 1;
    });
    return Object.entries(map).map(([name, v]) => ({ name, ...v }));
  }, [processes]);

  const nucleos = useMemo(() => {
    const map: Record<string, { concedente: number; count: number }> = {};
    processes.forEach(p => {
      const nome = p.regional_nuclei?.name || "Não definido";
      if (!map[nome]) map[nome] = { concedente: 0, count: 0 };
      map[nome].concedente += p.total_concedente_value || 0;
      map[nome].count += 1;
    });
    return Object.entries(map).map(([name, v]) => ({ name, ...v }));
  }, [processes]);

  // Estado para tipo de gráfico
  const [tipoMunicipio, setTipoMunicipio] = useState('bar');
  const [tipoContrapartida, setTipoContrapartida] = useState('bar');
  const [tipoNucleo, setTipoNucleo] = useState('bar');
  const [tipoNucleoProcessos, setTipoNucleoProcessos] = useState('bar');
  const [tipoMunicipioProcessos, setTipoMunicipioProcessos] = useState('bar');

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Visão geral das transferências financeiras</p>
          <p className="text-xs text-muted-foreground mt-1">
            Última atualização: {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
        <Button>
          <FileText className="h-4 w-4 mr-2" />
          Novo Processo
        </Button>
      </div>

      <SystemNotifications />

      {/* Quick Filters */}
      <DashboardFilters
        filters={filters}
        onFiltersChange={setFilters}
        regionalNuclei={regionalNuclei || []}
        statusOptions={statusOptions || []}
      />

      {/* Enhanced Stats Cards */}
      <EnhancedStatsCards stats={{
        totalProcesses: displayStats?.totalProcesses || 0,
        totalValue: displayStats?.totalValue || 0,
        activeMunicipalities: stats?.activeMunicipalities || 0,
        regionalNucleiCount: stats?.regionalNucleiCount || 0,
        monthlyGrowth: {
          processes: 12,
          value: 8
        },
        executionStats: stats?.executionStats,
        repasseStats: stats?.repasseStats
      }} />

      {/* NOVOS GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Valor concedente por município */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Valor Concedente por Município</CardTitle>
            <select className="border rounded px-2 py-1 text-xs" value={tipoMunicipio} onChange={e => setTipoMunicipio(e.target.value)}>
              <option value="bar">Barras</option>
              <option value="line">Linhas</option>
              <option value="pie">Pizza</option>
            </select>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              {tipoMunicipio === 'bar' ? (
                <BarChart data={municipios} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="concedente" fill="#3b82f6" name="Concedente" />
                </BarChart>
              ) : tipoMunicipio === 'line' ? (
                <LineChart data={municipios} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip />
                  <Line type="monotone" dataKey="concedente" stroke="#3b82f6" name="Concedente" />
                </LineChart>
              ) : tipoMunicipio === 'pie' ? (
                <PieChart>
                  <Pie data={municipios} dataKey="concedente" nameKey="name" cx="50%" cy="50%" outerRadius={90} label />
                  <Tooltip />
                </PieChart>
              ) : null}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Valor de contrapartida por município */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Valor de Contrapartida por Município</CardTitle>
            <select className="border rounded px-2 py-1 text-xs" value={tipoContrapartida} onChange={e => setTipoContrapartida(e.target.value)}>
              <option value="bar">Barras</option>
              <option value="line">Linhas</option>
              <option value="pie">Pizza</option>
            </select>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              {tipoContrapartida === 'bar' ? (
                <BarChart data={municipios} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="contrapartida" fill="#10b981" name="Contrapartida" />
                </BarChart>
              ) : tipoContrapartida === 'line' ? (
                <LineChart data={municipios} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip />
                  <Line type="monotone" dataKey="contrapartida" stroke="#10b981" name="Contrapartida" />
                </LineChart>
              ) : tipoContrapartida === 'pie' ? (
                <PieChart>
                  <Pie data={municipios} dataKey="contrapartida" nameKey="name" cx="50%" cy="50%" outerRadius={90} label />
                  <Tooltip />
                </PieChart>
              ) : null}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Valor concedente por núcleo regional */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Valor Concedente por Núcleo Regional</CardTitle>
            <select className="border rounded px-2 py-1 text-xs" value={tipoNucleo} onChange={e => setTipoNucleo(e.target.value)}>
              <option value="bar">Barras</option>
              <option value="line">Linhas</option>
              <option value="pie">Pizza</option>
            </select>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              {tipoNucleo === 'bar' ? (
                <BarChart data={nucleos} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="concedente" fill="#6366f1" name="Concedente" />
                </BarChart>
              ) : tipoNucleo === 'line' ? (
                <LineChart data={nucleos} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip />
                  <Line type="monotone" dataKey="concedente" stroke="#6366f1" name="Concedente" />
                </LineChart>
              ) : tipoNucleo === 'pie' ? (
                <PieChart>
                  <Pie data={nucleos} dataKey="concedente" nameKey="name" cx="50%" cy="50%" outerRadius={90} label />
                  <Tooltip />
                </PieChart>
              ) : null}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Núcleo regional por número de processos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Núcleo Regional por Nº de Processos</CardTitle>
            <select className="border rounded px-2 py-1 text-xs" value={tipoNucleoProcessos} onChange={e => setTipoNucleoProcessos(e.target.value)}>
              <option value="bar">Barras</option>
              <option value="line">Linhas</option>
              <option value="pie">Pizza</option>
            </select>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              {tipoNucleoProcessos === 'bar' ? (
                <BarChart data={nucleos} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#f59e0b" name="Nº de Processos" />
                </BarChart>
              ) : tipoNucleoProcessos === 'line' ? (
                <LineChart data={nucleos} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#f59e0b" name="Nº de Processos" />
                </LineChart>
              ) : tipoNucleoProcessos === 'pie' ? (
                <PieChart>
                  <Pie data={nucleos} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} label />
                  <Tooltip />
                </PieChart>
              ) : null}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Município por número de processos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Município por Nº de Processos</CardTitle>
            <select className="border rounded px-2 py-1 text-xs" value={tipoMunicipioProcessos} onChange={e => setTipoMunicipioProcessos(e.target.value)}>
              <option value="bar">Barras</option>
              <option value="line">Linhas</option>
              <option value="pie">Pizza</option>
            </select>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              {tipoMunicipioProcessos === 'bar' ? (
                <BarChart data={municipios} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#f43f5e" name="Nº de Processos" />
                </BarChart>
              ) : tipoMunicipioProcessos === 'line' ? (
                <LineChart data={municipios} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#f43f5e" name="Nº de Processos" />
                </LineChart>
              ) : tipoMunicipioProcessos === 'pie' ? (
                <PieChart>
                  <Pie data={municipios} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} label />
                  <Tooltip />
                </PieChart>
              ) : null}
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProcessChart />
        </div>
        <div className="lg:col-span-1">
          <StatusDistribution />
        </div>
      </div>

      <ProcessInsights />

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <RegionChart 
          regionalData={displayStats?.regionalData || stats?.regionalData || []} 
          processes={displayStats?.processes || stats?.processes || []}
        />
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Processes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Processos Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProcesses?.map((process) => (
                <div key={process.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{process.process_number}</p>
                    <p className="text-xs text-gray-600">{process.municipalities?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(process.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="secondary"
                      style={{ 
                        backgroundColor: process.status_processos?.cor + '20',
                        color: process.status_processos?.cor 
                      }}
                    >
                      {process.status_processos?.nome || 'Não definido'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status Legend */}
        <Card>
          <CardHeader>
            <CardTitle>Legenda de Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">Finalizado - Processo concluído com sucesso</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm">Em Andamento - Processo em execução</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm">Em Análise - Aguardando aprovação</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm">Cancelado - Processo cancelado ou rejeitado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm">Diligência - Aguardando documentação</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
