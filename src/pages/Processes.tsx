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

export default function Processes() {
  const { isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [page, setPage] = useState(1);
  const pageSize = 20;
  
  // Filtros persistidos
  const [filters, setFilters] = useState({
    status: 'all',
    municipality: 'all',
    nucleus: 'all',
    searchTerm: ''
  });
  
  // Seleção múltipla
  const [selectedProcesses, setSelectedProcesses] = useState<Set<number>>(new Set());
  const [showBatchActions, setShowBatchActions] = useState(false);
  
  // Configuração de colunas
  const [columnConfig, setColumnConfig] = useState({
    process_number: true,
    object: true,
    municipality: true,
    status: true,
    value: true,
    date: true,
    actions: true
  });

  const debouncedSearchTerm = useDebouncedValue(searchTerm, 400);
  const queryClient = useQueryClient();

  // Carregar processos
  const { data: processes, isLoading, error, refetch } = useQuery({
    queryKey: ['processes', debouncedSearchTerm],
    queryFn: async () => {
      let query = supabase
        .from('processes')
        .select(`
          *,
          municipalities(name),
          regional_nuclei(name, acronym),
          status_processos(nome, cor)
        `)
        .order('created_at', { ascending: false });

      if (debouncedSearchTerm) {
        query = query.or(`process_number.ilike.%${debouncedSearchTerm}%,object.ilike.%${debouncedSearchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Carregar opções de filtros
  const { data: statusOptions } = useQuery({
    queryKey: ['status-options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('status_processos')
        .select('nome')
        .order('nome', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Filtros aplicados
  const filteredProcesses = (processes || [])
    .filter(process =>
      (filters.status === 'all' || process.status_processos?.nome === filters.status) &&
      (filters.municipality === 'all' || process.municipalities?.name === filters.municipality) &&
      (filters.nucleus === 'all' || process.regional_nuclei?.name === filters.nucleus) &&
      (
        process.process_number.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        process.object.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        process.municipalities?.name.toLowerCase().includes(filters.searchTerm.toLowerCase())
      )
    )
    .sort((a, b) => {
      // Ordenar por data de vigência (mais próximos primeiro)
      const dateA = new Date(a.vigencia_date || '9999-12-31');
      const dateB = new Date(b.vigencia_date || '9999-12-31');
      return dateA.getTime() - dateB.getTime();
    });

  // Paginação
  const total = filteredProcesses.length;
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedProcesses = filteredProcesses.slice(startIndex, endIndex);

  // Persistir filtros
  useEffect(() => {
    localStorage.setItem('processes-filters', JSON.stringify(filters));
  }, [filters]);

  useEffect(() => {
    localStorage.setItem('processes-columns', JSON.stringify(columnConfig));
  }, [columnConfig]);

  // Carregar filtros salvos
  useEffect(() => {
    const savedFilters = localStorage.getItem('processes-filters');
    const savedColumns = localStorage.getItem('processes-columns');
    
    if (savedFilters) {
      setFilters(JSON.parse(savedFilters));
    }
    if (savedColumns) {
      setColumnConfig(JSON.parse(savedColumns));
    }
  }, []);

  // Soft delete mutation
  const softDeleteMutation = useMutation({
    mutationFn: async (processIds: number[]) => {
      const promises = processIds.map(id => 
        supabase.from('processes').update({ deleted_at: new Date().toISOString() }).eq('id', id)
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      toast.success('Processos excluídos com sucesso!');
      setSelectedProcesses(new Set());
      setShowBatchActions(false);
      refetch();
    },
    onError: () => {
      toast.error('Erro ao excluir processos');
    }
  });

  // Status update mutation
  const statusUpdateMutation = useMutation({
    mutationFn: async ({ processIds, statusId }: { processIds: number[], statusId: number }) => {
      const promises = processIds.map(id => 
        supabase.from('processes').update({ status_id: statusId }).eq('id', id)
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      toast.success('Status atualizado com sucesso!');
      setSelectedProcesses(new Set());
      setShowBatchActions(false);
      refetch();
    },
    onError: () => {
      toast.error('Erro ao atualizar status');
    }
  });

  // Export CSV
  const exportToCSV = () => {
    const data = paginatedProcesses.map(process => ({
      'Número': process.process_number,
      'Objeto': process.object,
      'Município': process.municipalities?.name || '',
      'Núcleo': process.regional_nuclei?.name || '',
      'Status': process.status_processos?.nome || '',
      'Valor': process.total_portaria_value || 0,
      'Vigência': process.vigencia_date || '',
      'Data Criação': process.created_at
    }));

    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).map(v => `"${v}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `processos_${format(new Date(), 'dd-MM-yyyy')}.csv`;
    link.click();
    
    toast.success('Dados exportados com sucesso!');
  };

  const toggleProcessSelection = (processId: number) => {
    const newSelection = new Set(selectedProcesses);
    if (newSelection.has(processId)) {
      newSelection.delete(processId);
    } else {
      newSelection.add(processId);
    }
    setSelectedProcesses(newSelection);
    setShowBatchActions(newSelection.size > 0);
  };

  const toggleSelectAll = () => {
    if (selectedProcesses.size === paginatedProcesses.length) {
      setSelectedProcesses(new Set());
      setShowBatchActions(false);
    } else {
      setSelectedProcesses(new Set(paginatedProcesses.map(p => p.id)));
      setShowBatchActions(true);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const getVigenciaStatus = (vigenciaDate: string) => {
    if (!vigenciaDate) return { color: 'bg-gray-500', label: 'Sem data' };
    
    const today = new Date();
    const vigencia = new Date(vigenciaDate);
    const diffDays = Math.ceil((vigencia.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { color: 'bg-red-500', label: 'Vencido' };
    if (diffDays <= 30) return { color: 'bg-orange-500', label: 'Próximo ao vencimento' };
    if (diffDays <= 90) return { color: 'bg-yellow-500', label: 'Atenção' };
    return { color: 'bg-green-500', label: 'Vigente' };
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
        <p className="text-red-600">Erro ao carregar processos: {error.message}</p>
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
    <div className="page-section">
      <div className="page-header">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="page-title">Processos</h1>
            <p className="page-description">
              Gerenciar processos de transferência ({total} encontrados)
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
            {isAuthenticated && (
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Processo
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-section">
        <div className="filters-grid">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Buscar processo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {statusOptions?.map(status => (
                  <SelectItem key={status.nome} value={status.nome}>
                    {status.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.municipality} onValueChange={(value) => setFilters(prev => ({ ...prev, municipality: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Município" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os municípios</SelectItem>
                {/* Adicionar municípios dinamicamente */}
              </SelectContent>
            </Select>
            <Select value={filters.nucleus} onValueChange={(value) => setFilters(prev => ({ ...prev, nucleus: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Núcleo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os núcleos</SelectItem>
                {/* Adicionar núcleos dinamicamente */}
              </SelectContent>
            </Select>
          </div>
      </div>

      {/* Ações em lote */}
      {showBatchActions && (
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-4 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-blue-800">
                  {selectedProcesses.size} processo(s) selecionado(s)
                </span>
                <Button variant="outline" size="sm" onClick={() => setSelectedProcesses(new Set())} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                  Limpar seleção
                </Button>
              </div>
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                      Atualizar Status
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {statusOptions?.map(status => (
                      <DropdownMenuItem 
                        key={status.nome}
                        onClick={() => statusUpdateMutation.mutate({ 
                          processIds: Array.from(selectedProcesses), 
                          statusId: 1 // TODO: Mapear nome para ID
                        })}
                      >
                        {status.nome}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => softDeleteMutation.mutate(Array.from(selectedProcesses))}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
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
            checked={selectedProcesses.size === paginatedProcesses.length && paginatedProcesses.length > 0}
            onCheckedChange={toggleSelectAll}
          />
          <span className="text-sm text-gray-600">Selecionar todos</span>
        </div>
      </div>

      {/* Lista de processos */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedProcesses.map((process) => (
            <Card key={process.id} className="hover:shadow-lg transition-shadow bg-white border-gray-200 shadow-sm">
              <CardHeader className="bg-white border-b border-gray-100">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-2">
                    <Checkbox 
                      checked={selectedProcesses.has(process.id)}
                      onCheckedChange={() => toggleProcessSelection(process.id)}
                    />
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{process.process_number}</h3>
                      <Badge className={getVigenciaStatus(process.vigencia_date).color}>
                        {getVigenciaStatus(process.vigencia_date).label}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 hover:bg-gray-50">
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
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => softDeleteMutation.mutate([process.id])}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 line-clamp-2">{process.object}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{process.municipalities?.name || 'Não definido'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>{process.regional_nuclei?.name || 'Não definido'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-green-600">
                      {formatCurrency(process.total_portaria_value)}
                    </span>
                    <Badge variant="outline">
                      {process.status_processos?.nome || 'Sem status'}
                    </Badge>
                  </div>
                  {process.vigencia_date && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Vigência: {format(new Date(process.vigencia_date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white border-gray-200">
            <thead>
              <tr>
                <th className="border px-4 py-2 bg-gray-50">
                  <Checkbox 
                    checked={selectedProcesses.size === paginatedProcesses.length && paginatedProcesses.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                {columnConfig.process_number && <th className="border px-4 py-2 bg-gray-50">Número</th>}
                {columnConfig.object && <th className="border px-4 py-2 bg-gray-50">Objeto</th>}
                {columnConfig.municipality && <th className="border px-4 py-2 bg-gray-50">Município</th>}
                {columnConfig.status && <th className="border px-4 py-2 bg-gray-50">Status</th>}
                {columnConfig.value && <th className="border px-4 py-2 bg-gray-50">Valor</th>}
                {columnConfig.date && <th className="border px-4 py-2 bg-gray-50">Vigência</th>}
                {columnConfig.actions && <th className="border px-4 py-2 bg-gray-50">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {paginatedProcesses.map((process) => (
                <tr key={process.id}>
                  <td className="border px-4 py-2">
                    <Checkbox 
                      checked={selectedProcesses.has(process.id)}
                      onCheckedChange={() => toggleProcessSelection(process.id)}
                    />
                  </td>
                  {columnConfig.process_number && <td className="border px-4 py-2">{process.process_number}</td>}
                  {columnConfig.object && <td className="border px-4 py-2">{process.object}</td>}
                  {columnConfig.municipality && <td className="border px-4 py-2">{process.municipalities?.name || ''}</td>}
                  {columnConfig.municipality && <td className="border px-4 py-2">{process.regional_nuclei?.name || ''}</td>}
                  {columnConfig.status && <td className="border px-4 py-2">{process.status_processos?.nome || ''}</td>}
                  {columnConfig.value && <td className="border px-4 py-2">{formatCurrency(process.total_portaria_value)}</td>}
                  {columnConfig.date && <td className="border px-4 py-2">{process.vigencia_date || ''}</td>}
                  {columnConfig.actions && (
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
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => softDeleteMutation.mutate([process.id])}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginação */}
      <div className="flex justify-between items-center py-4">
        <span className="text-sm text-gray-600">
          Página {page} de {totalPages} ({total} processos)
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

      {paginatedProcesses.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'Nenhum processo encontrado' : 'Nenhum processo cadastrado'}
          </h3>
          <p className="text-gray-600">
            {searchTerm 
              ? 'Tente alterar os termos de busca.' 
              : 'Não há processos cadastrados no sistema.'
            }
          </p>
        </div>
      )}
    </div>
  );
}
