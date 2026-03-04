import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, Plus, Filter, Download, Trash2, Edit, Eye, Calendar, MapPin, Users, ChevronLeft, ChevronRight, LayoutGrid, List, MoreHorizontal } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

export default function Municipalities() {
  const { isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [page, setPage] = useState(1);
  const pageSize = 20;
  
  // Filtros
  const [showOnlyProblems, setShowOnlyProblems] = useState(false);
  const [selectedMunicipalities, setSelectedMunicipalities] = useState<Set<number>>(new Set());
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonData, setComparisonData] = useState<any[]>([]);

  const debouncedSearchTerm = useDebouncedValue(searchTerm, 400);

  // Carregar municípios
  const { data: municipalities, isLoading, error, refetch } = useQuery({
    queryKey: ['municipalities', debouncedSearchTerm],
    queryFn: async () => {
      let query = supabase
        .from('municipalities')
        .select(`
          *,
          municipality_classifications(name),
          regional_nuclei(name, acronym),
          regioes(nome, sigla)
        `)
        .order('name', { ascending: true });

      if (debouncedSearchTerm) {
        query = query.or(`name.ilike.%${debouncedSearchTerm}%,mayor_name.ilike.%${debouncedSearchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Carregar estatísticas dos municípios
  const { data: municipalityStats } = useQuery({
    queryKey: ['municipality-stats'],
    queryFn: async () => {
      const { data: processes, error } = await supabase
        .from('processes')
        .select('municipality_id, total_portaria_value, status_processos!inner(nome)');

      if (error) throw error;

      const stats = processes?.reduce((acc: any, process: any) => {
        const municipalityId = process.municipality_id;
        if (!acc[municipalityId]) {
          acc[municipalityId] = {
            totalProcesses: 0,
            totalValue: 0,
            statuses: {}
          };
        }
        
        acc[municipalityId].totalProcesses++;
        acc[municipalityId].totalValue += process.total_portaria_value || 0;
        
        const status = process.status_processos?.nome || 'Não definido';
        acc[municipalityId].statuses[status] = (acc[municipalityId].statuses[status] || 0) + 1;
        
        return acc;
      }, {});
      
      return stats || {};
    }
  });

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

  const filteredMunicipalities = municipalities?.filter(municipality => {
    if (showOnlyProblems) {
      const stats = municipalityStats?.[municipality.id];
      return hasProblems(municipality, stats);
    }
    return true;
  }) || [];

  // Paginação
  const total = filteredMunicipalities.length;
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedMunicipalities = filteredMunicipalities.slice(startIndex, endIndex);

  const toggleMunicipalitySelection = (municipalityId: number) => {
    const newSet = new Set(selectedMunicipalities);
    if (newSet.has(municipalityId)) {
      newSet.delete(municipalityId);
    } else {
      newSet.add(municipalityId);
    }
    setSelectedMunicipalities(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedMunicipalities.size === paginatedMunicipalities.length) {
      setSelectedMunicipalities(new Set());
    } else {
      setSelectedMunicipalities(new Set(paginatedMunicipalities.map(m => m.id)));
    }
  };

  const startComparison = () => {
    if (selectedMunicipalities.size < 2) {
      toast.error('Selecione pelo menos 2 municípios para comparar');
      return;
    }
    
    const selectedData = municipalities?.filter(m => selectedMunicipalities.has(m.id)) || [];
    setComparisonData(selectedData);
    setShowComparison(true);
  };

  const exportComparisonData = () => {
    if (comparisonData.length === 0) {
      toast.error('Selecione municípios para comparar');
      return;
    }
    
    const csvHeaders = ['Município', 'Processos', 'Valor Total', 'Taxa de Finalização', 'Status'];
    const csvData = comparisonData.map(m => {
      const stats = municipalityStats?.[m.id];
      const finalizados = stats?.statuses['Finalizado'] || 0;
      const rate = stats?.totalProcesses > 0 ? (finalizados / stats.totalProcesses * 100).toFixed(1) : '0';
      
      return [
        m.name,
        stats?.totalProcesses || 0,
        stats ? formatCurrency(stats.totalValue) : 'R$ 0,00',
        `${rate}%`,
        hasProblems(m, stats) ? 'Com problemas' : 'Normal'
      ];
    });

    const csv = [csvHeaders.join(','), ...csvData.map(row => row.map(v => `"${v}"`).join(','))].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `comparacao_municipios_${format(new Date(), 'dd-MM-yyyy')}.csv`;
    link.click();
    
    toast.success('Dados exportados com sucesso!');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Municípios</h1>
          <p className="text-gray-600">
            Gerenciar municípios de Santa Catarina ({total} encontrados)
          </p>
        </div>
        {isAuthenticated && (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Município
          </Button>
        )}
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Buscar município..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button 
              variant={showOnlyProblems ? "default" : "outline"}
              onClick={() => setShowOnlyProblems(!showOnlyProblems)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Apenas com Problemas
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Ações em lote */}
      {selectedMunicipalities.size > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-blue-800">
                  {selectedMunicipalities.size} município(s) selecionado(s)
                </span>
                <Button variant="outline" size="sm" onClick={() => setSelectedMunicipalities(new Set())}>
                  Limpar seleção
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={startComparison}>
                  <Filter className="h-4 w-4 mr-2" />
                  Comparar Selecionados
                </Button>
                <Button variant="outline" size="sm" onClick={exportComparisonData}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controles de visualização */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button variant={viewMode === 'cards' ? 'default' : 'outline'} onClick={() => setViewMode('cards')}>
            <LayoutGrid className="h-4 w-4 mr-2" />
            Cards
          </Button>
          <Button variant={viewMode === 'list' ? 'default' : 'outline'} onClick={() => setViewMode('list')}>
            <List className="h-4 w-4 mr-2" />
            Lista
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <Checkbox 
            checked={selectedMunicipalities.size === paginatedMunicipalities.length && paginatedMunicipalities.length > 0}
            onCheckedChange={toggleSelectAll}
          />
          <span className="text-sm text-gray-600">Selecionar todos</span>
        </div>
      </div>

      {/* Lista de municípios */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedMunicipalities.map((municipality) => {
            const stats = municipalityStats?.[municipality.id];
            const regularity = getRegularityIndicator(stats);
            const hasIssues = hasProblems(municipality, stats);
            
            return (
              <Card key={municipality.id} className={`hover:shadow-lg transition-shadow ${hasIssues ? 'border-red-200 bg-red-50' : ''}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-2">
                      <Checkbox 
                        checked={selectedMunicipalities.has(municipality.id)}
                        onCheckedChange={() => toggleMunicipalitySelection(municipality.id)}
                      />
                      <div>
                        <h3 className="font-semibold text-lg">{municipality.name}</h3>
                        <Badge className={regularity.color}>
                          {regularity.label}
                        </Badge>
                      </div>
                    </div>
                    {hasIssues && (
                      <Badge variant="destructive" className="text-xs">
                        Problemas
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Processos</span>
                      <span className="font-semibold">{stats?.totalProcesses || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Valor Total</span>
                      <span className="font-semibold text-green-600">
                        {stats ? formatCurrency(stats.totalValue) : 'R$ 0,00'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Taxa Finalização</span>
                      <span className="font-semibold">
                        {stats ? ((stats.statuses['Finalizado'] || 0) / stats.totalProcesses * 100).toFixed(1) : '0'}%
                      </span>
                    </div>
                    {municipality.mayor_name && (
                      <div className="text-sm text-gray-600">
                        <strong>Prefeito:</strong> {municipality.mayor_name}
                      </div>
                    )}
                    {municipality.regional_nuclei && (
                      <div className="text-sm text-gray-600">
                        <strong>Núcleo:</strong> {municipality.regional_nuclei.name}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border px-4 py-2 bg-gray-100">
                  <Checkbox 
                    checked={selectedMunicipalities.size === paginatedMunicipalities.length && paginatedMunicipalities.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th className="border px-4 py-2 bg-gray-100">Nome</th>
                <th className="border px-4 py-2 bg-gray-100">Prefeito</th>
                <th className="border px-4 py-2 bg-gray-100">Núcleo</th>
                <th className="border px-4 py-2 bg-gray-100">Processos</th>
                <th className="border px-4 py-2 bg-gray-100">Valor Total</th>
                <th className="border px-4 py-2 bg-gray-100">Taxa Finalização</th>
                <th className="border px-4 py-2 bg-gray-100">Status</th>
                <th className="border px-4 py-2 bg-gray-100">Ações</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMunicipalities.map((m) => {
                const stats = municipalityStats?.[m.id];
                const hasIssues = hasProblems(m, stats);
                
                return (
                  <tr key={m.id} className={hasIssues ? 'bg-red-50' : ''}>
                    <td className="border px-4 py-2">
                      <Checkbox 
                        checked={selectedMunicipalities.has(m.id)}
                        onCheckedChange={() => toggleMunicipalitySelection(m.id)}
                      />
                    </td>
                    <td className="border px-4 py-2 font-medium">{m.name}</td>
                    <td className="border px-4 py-2">{m.mayor_name || '-'}</td>
                    <td className="border px-4 py-2">{m.regional_nuclei?.name || '-'}</td>
                    <td className="border px-4 py-2 text-center">{stats?.totalProcesses || 0}</td>
                    <td className="border px-4 py-2">{stats ? formatCurrency(stats.totalValue) : '-'}</td>
                    <td className="border px-4 py-2 text-center">
                      {stats ? ((stats.statuses['Finalizado'] || 0) / stats.totalProcesses * 100).toFixed(1) : '0'}%
                    </td>
                    <td className="border px-4 py-2">
                      <Badge className={getRegularityIndicator(stats).color}>
                        {getRegularityIndicator(stats).label}
                      </Badge>
                    </td>
                    <td className="border px-4 py-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalhes
                          </DropdownMenuItem>
                          {isAuthenticated && (
                            <>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Comparação */}
      <Dialog open={showComparison} onOpenChange={setShowComparison}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Comparação de Municípios</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-600">{comparisonData.length}</div>
                  <div className="text-sm text-gray-600">Municípios Selecionados</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {comparisonData.reduce((sum, m) => (municipalityStats?.[m.id]?.totalProcesses || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total de Processos</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-purple-600">
                    {((comparisonData.reduce((sum, m) => {
                      const stats = municipalityStats?.[m.id];
                      const finalizados = stats?.statuses['Finalizado'] || 0;
                      return sum + (stats?.totalProcesses > 0 ? (finalizados / stats.totalProcesses) : 0);
                    }, 0) / comparisonData.length * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Taxa Média Finalização</div>
                </CardContent>
              </Card>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border px-4 py-2 bg-gray-100">Município</th>
                    <th className="border px-4 py-2 bg-gray-100">Processos</th>
                    <th className="border px-4 py-2 bg-gray-100">Valor Total</th>
                    <th className="border px-4 py-2 bg-gray-100">Taxa Finalização</th>
                    <th className="border px-4 py-2 bg-gray-100">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map(m => {
                    const stats = municipalityStats?.[m.id];
                    const finalizados = stats?.statuses['Finalizado'] || 0;
                    const rate = stats?.totalProcesses > 0 ? (finalizados / stats.totalProcesses * 100).toFixed(1) : '0';
                    
                    return (
                      <tr key={m.id}>
                        <td className="border px-4 py-2 font-medium">{m.name}</td>
                        <td className="border px-4 py-2 text-center">{stats?.totalProcesses || 0}</td>
                        <td className="border px-4 py-2">{stats ? formatCurrency(stats.totalValue) : '-'}</td>
                        <td className="border px-4 py-2 text-center">{rate}%</td>
                        <td className="border px-4 py-2">
                          <Badge className={getRegularityIndicator(stats).color}>
                            {getRegularityIndicator(stats).label}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={exportComparisonData}>
                <Download className="h-4 w-4 mr-2" />
                Exportar Comparação
              </Button>
              <Button onClick={() => setShowComparison(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Paginação */}
      <div className="flex justify-between items-center py-4">
        <span className="text-sm text-gray-600">
          Página {page} de {totalPages} ({total} municípios)
        </span>
        <div className="flex gap-2">
          <button
            className="p-2 rounded disabled:opacity-50 border"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            className="p-2 rounded disabled:opacity-50 border"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {paginatedMunicipalities.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="h-12 w-12 mx-auto" />
          </div>
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
                ? 'Tente remover o filtro "Apenas com Problemas" para ver todos os municípios.'
                : 'Não há municípios cadastrados no sistema.'
            }
          </p>
        </div>
      )}
    </div>
  );
}
