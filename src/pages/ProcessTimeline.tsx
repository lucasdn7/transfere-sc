import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, MapPin, AlertTriangle, ArrowLeft, Download, CheckCircle, XCircle, PlayCircle, Filter, CalendarDays, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/processUtils';
import { Link } from 'react-router-dom';
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { format, startOfYear, endOfYear, startOfQuarter, endOfQuarter, startOfMonth, endOfMonth, getQuarter } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FilterOptions {
  period: 'all' | 'current-quarter' | 'current-semester' | 'year' | 'quarter-1' | 'quarter-2' | 'quarter-3' | 'quarter-4' | 'semester-1' | 'semester-2';
  groupBy: 'month' | 'quarter' | 'semester' | 'status';
  status: 'all' | 'Vencido' | 'Próximo ao Vencimento' | 'Vigente';
}

interface ProcessGroup {
  key: string;
  label: string;
  processes: any[];
  status?: string;
  color?: string;
}

export default function ProcessTimeline() {
  const [filters, setFilters] = useState<FilterOptions>({
    period: 'all',
    groupBy: 'month',
    status: 'all'
  });
  const { data: processes, isLoading, error } = useQuery({
    queryKey: ['process-timeline', filters],
    queryFn: async () => {
      let query = supabase
        .from('processes')
        .select(`
          *,
          municipalities(name),
          regional_nuclei(name, acronym),
          status_processos(nome, cor)
        `)
        .order('vigencia_date', { ascending: true });
      
      // Aplicar filtros de período
      const today = new Date();
      let startDate: Date | null = null;
      let endDate: Date | null = null;
      
      switch (filters.period) {
        case 'current-quarter':
          startDate = startOfQuarter(today);
          endDate = endOfQuarter(today);
          break;
        case 'current-semester':
          const currentQuarter = getQuarter(today);
          startDate = currentQuarter <= 2 ? startOfYear(today) : startOfMonth(new Date(today.getFullYear(), 6, 1));
          endDate = currentQuarter <= 2 ? endOfMonth(new Date(today.getFullYear(), 5, 30)) : endOfYear(today);
          break;
        case 'year':
          startDate = startOfYear(today);
          endDate = endOfYear(today);
          break;
        case 'quarter-1':
          startDate = startOfMonth(new Date(today.getFullYear(), 0, 1));
          endDate = endOfMonth(new Date(today.getFullYear(), 2, 31));
          break;
        case 'quarter-2':
          startDate = startOfMonth(new Date(today.getFullYear(), 3, 1));
          endDate = endOfMonth(new Date(today.getFullYear(), 5, 30));
          break;
        case 'quarter-3':
          startDate = startOfMonth(new Date(today.getFullYear(), 6, 1));
          endDate = endOfMonth(new Date(today.getFullYear(), 8, 31));
          break;
        case 'quarter-4':
          startDate = startOfMonth(new Date(today.getFullYear(), 9, 1));
          endDate = endOfMonth(new Date(today.getFullYear(), 11, 31));
          break;
        case 'semester-1':
          startDate = startOfYear(today);
          endDate = endOfMonth(new Date(today.getFullYear(), 5, 30));
          break;
        case 'semester-2':
          startDate = startOfMonth(new Date(today.getFullYear(), 6, 1));
          endDate = endOfYear(today);
          break;
      }
      
      if (startDate && endDate) {
        query = query.gte('vigencia_date', startDate.toISOString().split('T')[0])
                      .lte('vigencia_date', endDate.toISOString().split('T')[0]);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
  });

  const getTimelineStatus = (vigenciaDate: string) => {
    const today = new Date();
    const vigencia = new Date(vigenciaDate);
    const diffTime = vigencia.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { 
      status: 'expired', 
      label: 'Vencido', 
      color: 'bg-red-500',
      icon: XCircle,
      textColor: 'text-red-600'
    };
    if (diffDays <= 7) return { 
      status: 'critical', 
      label: 'Crítico', 
      color: 'bg-red-400',
      icon: AlertTriangle,
      textColor: 'text-red-500'
    };
    if (diffDays <= 30) return { 
      status: 'warning', 
      label: 'Atenção', 
      color: 'bg-yellow-400',
      icon: Clock,
      textColor: 'text-yellow-600'
    };
    return { 
      status: 'normal', 
      label: 'Normal', 
      color: 'bg-green-400',
      icon: CheckCircle,
      textColor: 'text-green-600'
    };
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'finalizado':
        return { icon: CheckCircle, color: 'text-green-600' };
      case 'em análise':
        return { icon: PlayCircle, color: 'text-blue-600' };
      case 'cancelado':
        return { icon: XCircle, color: 'text-red-600' };
      default:
        return { icon: Clock, color: 'text-yellow-600' };
    }
  };

  const exportToPDF = () => {
    // Implementar exportação para PDF
  };

  if (isLoading) {
    return (
      <div className="page-section">
        <div className="page-header">
          <h1 className="page-title">Timeline de Processos</h1>
          <p className="page-description text-muted-foreground">
            Carregando timeline...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-section">
        <div className="page-header">
          <h1 className="page-title">Timeline de Processos</h1>
          <p className="page-description text-red-600">
            Erro ao carregar timeline: {error.message}
          </p>
        </div>
      </div>
    );
  }

  // Função para agrupar processos
  const groupProcesses = (processes: any[]): ProcessGroup[] => {
    if (!processes) return [];
    
    // Aplicar filtro de status
    let filteredProcesses = processes;
    if (filters.status !== 'all') {
      filteredProcesses = processes.filter(process => {
        const timelineStatus = getTimelineStatus(process.vigencia_date);
        switch (filters.status) {
          case 'Vencido':
            return timelineStatus.status === 'expired';
          case 'Próximo ao Vencimento':
            return timelineStatus.status === 'critical' || timelineStatus.status === 'warning';
          case 'Vigente':
            return timelineStatus.status === 'normal';
          default:
            return true;
        }
      });
    }
    
    // Agrupar pelo critério selecionado
    switch (filters.groupBy) {
      case 'status':
        const statusGroups: Record<string, any[]> = {
          'Vencido': [],
          'Próximo ao Vencimento': [],
          'Vigente': []
        };
        
        filteredProcesses.forEach(process => {
          const timelineStatus = getTimelineStatus(process.vigencia_date);
          if (timelineStatus.status === 'expired') {
            statusGroups['Vencido'].push(process);
          } else if (timelineStatus.status === 'critical' || timelineStatus.status === 'warning') {
            statusGroups['Próximo ao Vencimento'].push(process);
          } else {
            statusGroups['Vigente'].push(process);
          }
        });
        
        return Object.entries(statusGroups)
          .filter(([_, processes]) => processes.length > 0)
          .map(([status, processes]) => ({
            key: status,
            label: status,
            processes,
            status,
            color: status === 'Vencido' ? 'red' : status === 'Próximo ao Vencimento' ? 'yellow' : 'green'
          }));
        
      case 'quarter':
        const quarterGroups: Record<string, any[]> = {};
        filteredProcesses.forEach(process => {
          const date = new Date(process.vigencia_date);
          const year = date.getFullYear();
          const quarter = getQuarter(date);
          const key = `${year}-Q${quarter}`;
          if (!quarterGroups[key]) quarterGroups[key] = [];
          quarterGroups[key].push(process);
        });
        
        return Object.entries(quarterGroups)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, processes]) => ({
            key,
            label: `Trimestre ${key.split('-')[1]} - ${key.split('-')[0]}`,
            processes
          }));
        
      case 'semester':
        const semesterGroups: Record<string, any[]> = {};
        filteredProcesses.forEach(process => {
          const date = new Date(process.vigencia_date);
          const year = date.getFullYear();
          const month = date.getMonth();
          const semester = month < 6 ? 1 : 2;
          const key = `${year}-S${semester}`;
          if (!semesterGroups[key]) semesterGroups[key] = [];
          semesterGroups[key].push(process);
        });
        
        return Object.entries(semesterGroups)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, processes]) => ({
            key,
            label: `Semestre ${key.split('-')[1]} - ${key.split('-')[0]}`,
            processes
          }));
        
      default: // month
        const monthGroups: Record<string, any[]> = {};
        filteredProcesses.forEach(process => {
          const month = new Date(process.vigencia_date).toLocaleDateString('pt-BR', { 
            year: 'numeric', 
            month: 'long' 
          });
          if (!monthGroups[month]) monthGroups[month] = [];
          monthGroups[month].push(process);
        });
        
        return Object.entries(monthGroups)
          .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
          .map(([key, processes]) => ({
            key,
            label: key,
            processes
          }));
    }
  };
  
  const groupedProcesses = groupProcesses(processes);

  return (
    <div className="page-section space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Início</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Timeline de Processos</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header fixo */}
      <div className="sticky top-0 bg-white z-10 pb-4 border-b">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <Link to="/processes">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar aos Processos
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Timeline de Processos</h1>
              <p className="text-muted-foreground">
                Cronograma de vigência dos processos organizados por período e status
              </p>
            </div>
          </div>
          <Button onClick={exportToPDF}>
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
        
        {/* Filtros */}
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filtros:</span>
          </div>
          
          <Select value={filters.period} onValueChange={(value) => setFilters(prev => ({ ...prev, period: value as any }))}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="current-quarter">Trimestre Atual</SelectItem>
              <SelectItem value="current-semester">Semestre Atual</SelectItem>
              <SelectItem value="year">Ano Atual</SelectItem>
              <SelectItem value="quarter-1">1º Trimestre</SelectItem>
              <SelectItem value="quarter-2">2º Trimestre</SelectItem>
              <SelectItem value="quarter-3">3º Trimestre</SelectItem>
              <SelectItem value="quarter-4">4º Trimestre</SelectItem>
              <SelectItem value="semester-1">1º Semestre</SelectItem>
              <SelectItem value="semester-2">2º Semestre</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filters.groupBy} onValueChange={(value) => setFilters(prev => ({ ...prev, groupBy: value as any }))}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Agrupar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Mês</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
              <SelectItem value="semester">Semestre</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as any }))}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Vencido">Vencido</SelectItem>
              <SelectItem value="Próximo ao Vencimento">Próximo ao Vencimento</SelectItem>
              <SelectItem value="Vigente">Vigente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-8">
        {groupedProcesses.map((group) => (
          <div key={group.key} className="space-y-4">
            <div className="flex items-center gap-2">
              {filters.groupBy === 'status' ? (
                <div className={`w-3 h-3 rounded-full bg-${group.color}-500`} />
              ) : (
                <Calendar className="h-5 w-5 text-blue-600" />
              )}
              <h2 className="text-xl font-semibold capitalize">{group.label}</h2>
              <Badge variant="outline">{group.processes.length} processos</Badge>
              {filters.groupBy === 'status' && (
                <Badge 
                  variant={group.color === 'red' ? 'destructive' : group.color === 'yellow' ? 'secondary' : 'default'}
                  className="ml-2"
                >
                  {group.status}
                </Badge>
              )}
            </div>
            
            <div className="space-y-4 ml-7 relative">
              {/* Linha vertical da timeline */}
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              
              {group.processes.map((process, index) => {
                const timelineStatus = getTimelineStatus(process.vigencia_date);
                const statusIcon = getStatusIcon(process.status_processos?.nome || '');
                const daysUntilExpiry = Math.ceil(
                  (new Date(process.vigencia_date).getTime() - new Date().getTime()) / 
                  (1000 * 60 * 60 * 24)
                );
                
                return (
                  <Card key={process.id} className="relative ml-6 hover:shadow-lg transition-shadow bg-white border-gray-200 shadow-sm">
                    {/* Ícone da timeline */}
                    <div className={`absolute -left-8 top-6 w-4 h-4 rounded-full ${timelineStatus.color} border-2 border-white shadow-sm flex items-center justify-center`}>
                      <timelineStatus.icon className="h-2 w-2 text-white" />
                    </div>
                    
                    <CardHeader className="pb-3 bg-white border-b border-gray-100">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                            <statusIcon.icon className={`h-5 w-5 ${statusIcon.color}`} />
                            {process.process_number}
                          </CardTitle>
                          <div className="flex gap-2">
                            <Badge variant="secondary">
                              {process.status_processos?.nome || 'Não definido'}
                            </Badge>
                            <Badge variant={timelineStatus.status === 'expired' ? 'destructive' : 'secondary'}>
                              {timelineStatus.label}
                            </Badge>
                            {daysUntilExpiry <= 30 && daysUntilExpiry >= 0 && (
                              <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                                Prazo Crítico
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            {formatCurrency(process.total_portaria_value)}
                          </div>
                          <div className="text-sm text-gray-500">Valor Total</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-gray-600 text-sm">{process.object}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span>{process.municipalities?.name || 'N/A'}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>Vigência: {new Date(process.vigencia_date).toLocaleDateString('pt-BR')}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span className={timelineStatus.textColor}>
                            {daysUntilExpiry < 0 
                              ? `Vencido há ${Math.abs(daysUntilExpiry)} dias`
                              : `${daysUntilExpiry} dias restantes`
                            }
                          </span>
                          {daysUntilExpiry <= 30 && daysUntilExpiry >= 0 && (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        
                        {process.regional_nuclei && (
                          <div className="text-gray-600">
                            <strong>Núcleo:</strong> {process.regional_nuclei.acronym}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {processes?.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum processo encontrado
          </h3>
          <p className="text-gray-600">
            Não há processos cadastrados no sistema.
          </p>
        </div>
      )}
    </div>
  );
}
