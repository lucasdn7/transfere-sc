import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, MapPin, Phone, Mail, Users, Plus, Edit, List, LayoutGrid, Filter, AlertTriangle, BarChart3, TrendingUp, Download, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/hooks/useAuth';
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MunicipalityForm } from "@/components/forms/MunicipalityForm";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';

export default function Municipalities() {
  const { isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMunicipality, setEditingMunicipality] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [showOnlyProblems, setShowOnlyProblems] = useState(false);
  const [selectedMunicipalities, setSelectedMunicipalities] = useState<Set<number>>(new Set());
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonData, setComparisonData] = useState<any[]>([]);

  // Função para identificar municípios com problemas
  const hasProblems = (municipality: any, stats: any) => {
    if (!stats) return false;
    
    // Verificar se tem poucos processos (< 3)
    if (stats.totalProcesses < 3) return true;
    
    // Verificar se tem baixa taxa de finalização (< 50%)
    const finalizados = stats.statuses['Finalizado'] || 0;
    const rate = finalizados / stats.totalProcesses;
    if (rate < 0.5) return true;
    
    // Verificar se tem processos vencidos
    const vencidos = stats.statuses['Vencido'] || 0;
    if (vencidos > 0) return true;
    
    return false;
  };

  // Função para exportar dados comparativos
  const exportComparisonData = () => {
    if (comparisonData.length === 0) {
      toast.error('Selecione municípios para comparar');
      return;
    }
    
    const csvHeaders = ['Município', 'Processos', 'Valor Total', 'Taxa de Finalização', 'Status'];
    const csvRows = comparisonData.map(m => {
      const stats = municipalityStats?.[m.id];
      const finalizados = stats?.statuses['Finalizado'] || 0;
      const rate = stats?.totalProcesses > 0 ? (finalizados / stats.totalProcesses * 100).toFixed(1) : '0';
      
      return [
        m.name,
        stats?.totalProcesses || 0,
        stats ? formatCurrency(stats.totalValue) : 'R$ 0,00',
        `${rate}%`,
        hasProblems(m, stats) ? 'Com Problemas' : 'Normal'
      ];
    });
    
    const csv = [csvHeaders, ...csvRows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `comparacao-municipios-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    
    toast.success('Dados exportados com sucesso');
  };

  // Função para gerar gráfico de radar
  const generateRadarData = () => {
    return comparisonData.map(m => {
      const stats = municipalityStats?.[m.id];
      const finalizados = stats?.statuses['Finalizado'] || 0;
      const rate = stats?.totalProcesses > 0 ? (finalizados / stats.totalProcesses) : 0;
      
      return {
        municipality: m.name,
        processos: stats?.totalProcesses || 0,
        valor: stats?.totalValue || 0,
        taxaFinalizacao: rate,
        regularidade: rate >= 0.8 ? 1 : rate >= 0.6 ? 0.5 : 0,
        problemas: hasProblems(m, stats) ? 1 : 0
      };
    });
  };

  // Função para alternar seleção
  const toggleMunicipalitySelection = (municipalityId: number) => {
    setSelectedMunicipalities(prev => {
      const newSet = new Set(prev);
      if (newSet.has(municipalityId)) {
        newSet.delete(municipalityId);
      } else {
        newSet.add(municipalityId);
      }
      return newSet;
    });
  };

  // Função para selecionar todos
  const toggleSelectAll = () => {
    if (selectedMunicipalities.size === filteredMunicipalities.length) {
      setSelectedMunicipalities(new Set());
    } else {
      setSelectedMunicipalities(new Set(filteredMunicipalities.map(m => m.id)));
    }
  };

  // Função para iniciar comparação
  const startComparison = () => {
    if (selectedMunicipalities.size < 2) {
      toast.error('Selecione pelo menos 2 municípios para comparar');
      return;
    }
    
    const selectedData = municipalities?.filter(m => selectedMunicipalities.has(m.id)) || [];
    setComparisonData(selectedData);
    setShowComparison(true);
  };

  // Filtrar municípios
  const filteredMunicipalities = municipalities?.filter(municipality => {
    if (showOnlyProblems) {
      const stats = municipalityStats?.[municipality.id];
      return hasProblems(municipality, stats);
    }
    return true;
  }) || [];
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 400);
  const { data: municipalities, isLoading, error, refetch } = useQuery({
    queryKey: ['municipalities', debouncedSearchTerm],
    queryFn: async () => {
      let query = supabase
        .from('municipalities')
        .select(`
          *,
          regional_nuclei (name, acronym),
          regioes (nome, sigla),
          municipality_classifications (name)
        `)
        .order('name', { ascending: true });

      if (debouncedSearchTerm) {
        query = query.ilike('name', `%${debouncedSearchTerm}%`);
      }

      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      return data || [];
    }
  });

  // Buscar estatísticas dos processos por município
  const { data: municipalityStats } = useQuery({
    queryKey: ['municipality-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('processes')
        .select(`
          municipality_id,
          total_portaria_value,
          status_processos (nome)
        `);
      
      if (error) throw error;
      
      const stats = data?.reduce((acc: any, process) => {
        const municipalityId = process.municipality_id;
        if (!acc[municipalityId]) {
          acc[municipalityId] = {
            totalProcesses: 0,
            totalValue: 0,
            statuses: {}
          };
        }
        acc[municipalityId].totalProcesses += 1;
        acc[municipalityId].totalValue += process.total_portaria_value || 0;
        
        const status = process.status_processos?.nome || 'Não definido';
        acc[municipalityId].statuses[status] = (acc[municipalityId].statuses[status] || 0) + 1;
        
        return acc;
      }, {});
      
      return stats || {};
    }
  });

  const getRegularityIndicator = (stats: any) => {
    if (!stats || stats.totalProcesses === 0) {
      return { color: 'bg-gray-400', label: 'Sem dados' };
    }
    
    const finalizados = stats.statuses['Finalizado'] || 0;
    const total = stats.totalProcesses;
    const rate = finalizados / total;
    
    if (rate >= 0.8) return { color: 'bg-green-500', label: 'Excelente' };
    if (rate >= 0.6) return { color: 'bg-yellow-500', label: 'Bom' };
    return { color: 'bg-red-500', label: 'Atenção' };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingMunicipality(null);
    refetch();
  };

  const handleEdit = (municipality: any) => {
    setEditingMunicipality(municipality);
    setIsFormOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Erro ao carregar municípios: {error.message}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Tentar Novamente
        </button>
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
            <BreadcrumbPage>Municípios</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Municípios</h1>
          <p className="text-gray-600">Gerenciar municípios de Santa Catarina ({municipalities?.length || 0} encontrados)</p>
          <p className="text-xs text-muted-foreground mt-1">
            Última atualização: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
          </p>
        </div>
        {isAuthenticated && (
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingMunicipality(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Município
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>
                  {editingMunicipality ? 'Editar Município' : 'Novo Município'}
                </DialogTitle>
              </DialogHeader>
              <MunicipalityForm
                onSuccess={handleFormSuccess}
                onCancel={() => {
                  setIsFormOpen(false);
                  setEditingMunicipality(null);
                }}
                initialData={editingMunicipality}
                isEdit={!!editingMunicipality}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filtros e Ações */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Campo de Busca */}
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Buscar município..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filtros */}
            <div className="flex gap-2 items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span className="text-sm font-medium">Filtros:</span>
              </div>
              
              <Button
                variant={showOnlyProblems ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowOnlyProblems(!showOnlyProblems)}
                className="flex items-center gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                {showOnlyProblems ? 'Mostrar Todos' : 'Apenas com Problemas'}
              </Button>
              
              {selectedMunicipalities.size > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startComparison}
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  Comparar ({selectedMunicipalities.size})
                </Button>
              )}
            </div>
          </div>
          
          {/* Barra de Seleção */}
          {selectedMunicipalities.size > 0 && (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedMunicipalities.size === filteredMunicipalities.length}
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-sm font-medium">
                  {selectedMunicipalities.size} município(s) selecionado(s)
                </span>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startComparison}
                  disabled={selectedMunicipalities.size < 2}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Comparar Selecionados
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportComparisonData}
                  disabled={comparisonData.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Barra de Visualização */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {showOnlyProblems 
            ? `Mostrando ${filteredMunicipalities.length} município(s) com problemas`
            : `Mostrando ${filteredMunicipalities.length} município(s) de ${municipalities?.length || 0} totais`
          }
        </div>
        
        <div className="flex gap-2">
          <Button variant={viewMode === 'cards' ? 'default' : 'outline'} onClick={() => setViewMode('cards')}>
            <LayoutGrid className="h-4 w-4 mr-1" /> Cards
          </Button>
          <Button variant={viewMode === 'list' ? 'default' : 'outline'} onClick={() => setViewMode('list')}>
            <List className="h-4 w-4 mr-1" /> Lista
          </Button>
        </div>
      </div>
      {/* Modal de Comparação */}
      {showComparison && (
        <Dialog open={showComparison} onOpenChange={setShowComparison}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Comparação de Municípios</span>
                </div>
                <Button variant="outline" onClick={() => setShowComparison(false)}>
                  X
                </Button>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Tabela Comparativa */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border px-4 py-2 text-left">Município</th>
                      <th className="border px-4 py-2 text-center">Processos</th>
                      <th className="border px-4 py-2 text-center">Valor Total</th>
                      <th className="border px-4 py-2 text-center">Taxa Finalização</th>
                      <th className="border px-4 py-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.map((municipality) => {
                      const stats = municipalityStats?.[municipality.id];
                      const finalizados = stats?.statuses['Finalizado'] || 0;
                      const rate = stats?.totalProcesses > 0 ? (finalizados / stats.totalProcesses * 100).toFixed(1) : '0';
                      const hasIssues = hasProblems(municipality, stats);
                      
                      return (
                        <tr key={municipality.id} className={hasIssues ? 'bg-red-50' : ''}>
                          <td className="border px-4 py-2">
                            <div className="flex items-center gap-2">
                              {hasIssues && <AlertTriangle className="h-4 w-4 text-red-500" />}
                              <span className="font-medium">{municipality.name}</span>
                            </div>
                          </td>
                          <td className="border px-4 py-2 text-center">{stats?.totalProcesses || 0}</td>
                          <td className="border px-4 py-2 text-right">{stats ? formatCurrency(stats.totalValue) : 'R$ 0,00'}</td>
                          <td className="border px-4 py-2 text-center">
                            <Badge variant={parseFloat(rate) >= 80 ? 'default' : parseFloat(rate) >= 60 ? 'secondary' : 'destructive'}>
                              {rate}%
                            </Badge>
                          </td>
                          <td className="border px-4 py-2 text-center">
                            <Badge variant={hasIssues ? 'destructive' : 'default'}>
                              {hasIssues ? 'Com Problemas' : 'Normal'}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Métricas Gerais */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {comparisonData.reduce((sum, m) => sum + (municipalityStats?.[m.id]?.totalProcesses || 0), 0)}
                    </div>
                    <div className="text-sm text-blue-600">Total de Processos</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(comparisonData.reduce((sum, m) => sum + (municipalityStats?.[m.id]?.totalValue || 0), 0))}
                    </div>
                    <div className="text-sm text-green-600">Valor Total</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {(comparisonData.reduce((sum, m) => {
                        const stats = municipalityStats?.[m.id];
                        const finalizados = stats?.statuses['Finalizado'] || 0;
                        return sum + (stats?.totalProcesses > 0 ? (finalizados / stats.totalProcesses) : 0);
                      }, 0) / comparisonData.length * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-yellow-600">Taxa Média Finalização</div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Gráfico de Radar (Placeholder) */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Análise Comparativa
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                    <p>Gráfico de radar para análise comparativa</p>
                    <p className="text-sm">(Implementação futura)</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMunicipalities.map((municipality) => {
            const stats = municipalityStats?.[municipality.id];
            const regularity = getRegularityIndicator(stats);
            const hasIssues = hasProblems(municipality, stats);
            
            return (
              <Card key={municipality.id} className={`hover:shadow-lg transition-shadow ${hasIssues ? 'border-red-200 bg-red-50' : ''}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {municipality.name}
                        {hasIssues && <AlertTriangle className="h-4 w-4 text-red-500" />}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${regularity.color}`}></div>
                        <span className="text-sm text-gray-600">{regularity.label}</span>
                        {hasIssues && (
                          <Badge variant="destructive" className="ml-2">
                            Atenção
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedMunicipalities.has(municipality.id)}
                          onCheckedChange={() => toggleMunicipalitySelection(municipality.id)}
                        />
                        <span className="text-xs text-gray-500">Selecionar</span>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/map?municipality=${municipality.id}`}>
                          <MapPin className="h-4 w-4" />
                        </Link>
                      </Button>
                      {isAuthenticated && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(municipality)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Mini Cards de Resumo */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">
                        {stats?.totalProcesses || 0}
                      </div>
                      <div className="text-xs text-blue-600">Processos</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-sm font-bold text-green-600">
                        {stats ? formatCurrency(stats.totalValue) : 'R$ 0,00'}
                      </div>
                      <div className="text-xs text-green-600">Valor Total</div>
                    </div>
                  </div>

                  {/* Informações do Município */}
                  <div className="space-y-2">
                    {municipality.regioes && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{municipality.regioes.nome}</span>
                      </div>
                    )}

                    {municipality.regional_nuclei && (
                      <div>
                        <Badge variant="outline">
                          {municipality.regional_nuclei.acronym}
                        </Badge>
                      </div>
                    )}

                    {municipality.mayor_name && (
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {municipality.mayor_name}
                        </div>
                        <div className="text-xs text-gray-500">Prefeito</div>
                      </div>
                    )}

                    <div className="text-xs text-gray-500">
                      CNPJ: {municipality.cnpj}
                    </div>
                  </div>

                  {/* Contatos */}
                  <div className="space-y-1">
                    {municipality.phone && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Phone className="h-3 w-3 text-gray-400" />
                        <span>{municipality.phone}</span>
                      </div>
                    )}

                    {municipality.email && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Mail className="h-3 w-3 text-gray-400" />
                        <span>{municipality.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Distribuição de Status */}
                  {stats && stats.statuses && Object.keys(stats.statuses).length > 0 && (
                    <div className="pt-3 border-t">
                      <div className="text-sm font-medium mb-2">Status dos Processos</div>
                      <div className="space-y-1">
                        {Object.entries(stats.statuses).map(([status, count]: [string, any]) => (
                          <div key={status} className="flex justify-between text-xs">
                            <span>{status}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border px-2 py-1">
                  <Checkbox
                    checked={selectedMunicipalities.size === filteredMunicipalities.length && filteredMunicipalities.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th className="border px-2 py-1">Município</th>
                <th className="border px-2 py-1">Região</th>
                <th className="border px-2 py-1">Núcleo</th>
                <th className="border px-2 py-1">CNPJ</th>
                <th className="border px-2 py-1">Telefone</th>
                <th className="border px-2 py-1">E-mail</th>
                <th className="border px-2 py-1">Status</th>
                <th className="border px-2 py-1">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredMunicipalities && filteredMunicipalities.length > 0 ? (
                filteredMunicipalities.map((m: any) => {
                  const stats = municipalityStats?.[m.id];
                  const hasIssues = hasProblems(m, stats);
                  
                  return (
                    <tr key={m.id} className={hasIssues ? 'bg-red-50' : ''}>
                      <td className="border px-2 py-1">
                        <Checkbox
                          checked={selectedMunicipalities.has(m.id)}
                          onCheckedChange={() => toggleMunicipalitySelection(m.id)}
                        />
                      </td>
                      <td className="border px-2 py-1">
                        <div className="flex items-center gap-2">
                          {hasIssues && <AlertTriangle className="h-4 w-4 text-red-500" />}
                          <span className="font-medium">{m.name}</span>
                        </div>
                      </td>
                      <td className="border px-2 py-1">{m.regioes?.nome}</td>
                      <td className="border px-2 py-1">{m.regional_nuclei?.name}</td>
                      <td className="border px-2 py-1">{m.cnpj}</td>
                      <td className="border px-2 py-1">{m.phone}</td>
                      <td className="border px-2 py-1">{m.email}</td>
                      <td className="border px-2 py-1">
                        <Badge variant={hasIssues ? 'destructive' : 'default'}>
                          {hasIssues ? 'Com Problemas' : 'Normal'}
                        </Badge>
                      </td>
                      <td className="border px-2 py-1">
                        <Button variant="ghost" size="sm" asChild className="mr-2">
                          <Link to={`/map?municipality=${m.id}`} title="Ver no Mapa">
                            <MapPin className="h-4 w-4" />
                          </Link>
                        </Button>
                        {isAuthenticated && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingMunicipality(m)}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="text-center py-8 border px-2 py-1">Nenhum município disponível</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {filteredMunicipalities.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm 
              ? 'Nenhum município encontrado'
              : showOnlyProblems 
                ? 'Nenhum município com problemas encontrado'
                : 'Nenhum município cadastrado'
            }
          </h3>
          <p className="text-gray-600">
            {searchTerm 
              ? 'Tente alterar os termos de busca.' 
              : showOnlyProblems 
                ? 'Tente remover o filtro "Apenas com problemas" para ver todos os municípios.'
                : 'Não há municípios cadastrados no sistema.'
            }
          </p>
          {isAuthenticated && !searchTerm && !showOnlyProblems && (
            <Button className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Primeiro Município
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
