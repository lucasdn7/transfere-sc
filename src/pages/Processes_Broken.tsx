import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Filter, Plus, FileText, MapPin, Calendar, Edit, ExternalLink, Star, List, LayoutGrid, Download, Trash2, Eye, Settings } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import { getStatusColor, getStatusLabel, formatCurrency } from "@/utils/processUtils";
import type { Database } from "@/integrations/supabase/types";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ProcessForm } from "@/components/forms/ProcessForm";
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

type TransferStatus = Database['public']['Enums']['transfer_status'];

interface FilterState {
  status: string;
  municipality: string;
  nucleus: string;
  searchTerm: string;
  sortField: string;
  sortOrder: 'asc' | 'desc' | 'alpha';
}

interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  order: number;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'process_number', label: 'Nº Processo', visible: true, order: 1 },
  { id: 'object', label: 'Objeto', visible: true, order: 2 },
  { id: 'municipality', label: 'Município', visible: true, order: 3 },
  { id: 'nucleus', label: 'Núcleo', visible: true, order: 4 },
  { id: 'status', label: 'Status', visible: true, order: 5 },
  { id: 'total_portaria_value', label: 'Valor Portaria', visible: true, order: 6 },
  { id: 'total_concedente_value', label: 'Valor Concedente', visible: false, order: 7 },
  { id: 'total_proponente_value', label: 'Contrapartida', visible: false, order: 8 },
  { id: 'vigencia_date', label: 'Vigência', visible: true, order: 9 },
  { id: 'parcels_progress', label: 'Progresso Parcelas', visible: true, order: 10 },
];

export default function Processes() {
  const { isAuthenticated, userRole } = useAuth();
  const { isFavorite, addToFavorites, removeFromFavorites } = useFavorites();
  const queryClient = useQueryClient();
  
  // Estados de filtros e seleção
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProcess, setEditingProcess] = useState<any>(null);
  const [parcelsMap, setParcelsMap] = useState<Record<number, any[]>>({});
  const [selectedProcesses, setSelectedProcesses] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  
  // Estado persistido dos filtros
  const [filters, setFilters] = useState<FilterState>(() => {
    const saved = localStorage.getItem('processes-filters');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback para valores padrão
      }
    }
    return {
      status: 'all',
      municipality: 'all',
      nucleus: 'all',
      searchTerm: '',
      sortField: 'total_portaria_value',
      sortOrder: 'desc' as const
    };
  });
  
  // Estado persistido das colunas
  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    const saved = localStorage.getItem('processes-columns');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback para colunas padrão
      }
    }
    return DEFAULT_COLUMNS;
  });

  // Persistir filtros no localStorage
  useEffect(() => {
    localStorage.setItem('processes-filters', JSON.stringify(filters));
  }, [filters]);
  
  // Persistir configuração de colunas no localStorage
  useEffect(() => {
    localStorage.setItem('processes-columns', JSON.stringify(columns));
  }, [columns]);
  
  // Sincronizar searchTerm com filters
  useEffect(() => {
    setFilters(prev => ({ ...prev, searchTerm }));
  }, [searchTerm]);
  
  // Mutation para soft delete
  const softDeleteMutation = useMutation({
    mutationFn: async (processIds: number[]) => {
      const { error } = await supabase
        .from('processes')
        .update({ deleted_at: new Date().toISOString() })
        .in('id', processIds);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`${selectedProcesses.size} processo(s) excluído(s) com sucesso`);
      setSelectedProcesses(new Set());
      queryClient.invalidateQueries({ queryKey: ['processes'] });
    },
    onError: (error) => {
      toast.error('Erro ao excluir processos');
      console.error(error);
    }
  });
  
  // Mutation para alterar status em lote
  const batchStatusMutation = useMutation({
    mutationFn: async ({ processIds, newStatus }: { processIds: number[]; newStatus: string }) => {
      const { error } = await supabase
        .from('processes')
        .update({ status: newStatus })
        .in('id', processIds);
      
      if (error) throw error;
    },
    onSuccess: (_, { newStatus }) => {
      toast.success(`Status alterado para "${newStatus}" em ${selectedProcesses.size} processo(s)`);
      setSelectedProcesses(new Set());
      queryClient.invalidateQueries({ queryKey: ['processes'] });
    },
    onError: (error) => {
      toast.error('Erro ao alterar status');
      console.error(error);
    }
  });
  
  // Funções de exportação
  const exportToCSV = () => {
    const visibleColumns = columns.filter(c => c.visible).sort((a, b) => a.order - b.order);
    const headers = visibleColumns.map(c => c.label).join(',');
    
    const rows = filteredProcesses.map(process => {
      return visibleColumns.map(col => {
        switch (col.id) {
          case 'process_number':
            return process.process_number;
          case 'object':
            return `"${process.object}"`;
          case 'municipality':
            return process.municipalities?.name || '';
          case 'nucleus':
            return process.regional_nuclei?.name || '';
          case 'status':
            return process.status_processos?.nome || '';
          case 'total_portaria_value':
            return process.total_portaria_value || 0;
          case 'total_concedente_value':
            return process.total_concedente_value || 0;
          case 'total_proponente_value':
            return process.total_proponente_value || 0;
          case 'vigencia_date':
            return new Date(process.vigencia_date).toLocaleDateString('pt-BR');
          case 'parcels_progress':
            const parcels = parcelsMap[process.id] || [];
            const paidParcels = parcels.filter(p => p.payment_date).length;
            return `${paidParcels}/${parcels.length}`;
          default:
            return '';
        }
      }).join(',');
    }).join('\n');
    
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `processos-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    
    toast.success('CSV exportado com sucesso');
  };
  
  // Funções de seleção
  const toggleProcessSelection = (processId: number) => {
    setSelectedProcesses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(processId)) {
        newSet.delete(processId);
      } else {
        newSet.add(processId);
      }
      return newSet;
    });
  };
  
  const toggleAllSelection = () => {
    if (selectedProcesses.size === filteredProcesses.length) {
      setSelectedProcesses(new Set());
    } else {
      setSelectedProcesses(new Set(filteredProcesses.map(p => p.id)));
    }
  };
  
  // Funções de configuração de colunas
  const toggleColumnVisibility = (columnId: string) => {
    setColumns(prev => prev.map(col => 
      col.id === columnId ? { ...col, visible: !col.visible } : col
    ));
  };
  
  const resetColumns = () => {
    setColumns(DEFAULT_COLUMNS);
    toast.success('Configuração de colunas redefinida');
  const { data: processes, isLoading, error, refetch } = useQuery({
    queryKey: ['processes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('processes')
        .select(`
          *,
          municipalities(name, regioes(nome)),
          regional_nuclei(name, acronym),
          status_processos(nome, cor)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Buscar status do Supabase para o filtro
  const { data: statusList = [] } = useQuery({
    queryKey: ['status-processos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('status_processos')
        .select('nome')
        .order('nome', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const debouncedSearchTerm = useDebouncedValue(searchTerm, 400);
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
      if (filters.sortOrder === 'alpha') {
        return String(a[filters.sortField] || '').localeCompare(String(b[filters.sortField] || ''));
      }
      const aValue = a[filters.sortField] || 0;
      const bValue = b[filters.sortField] || 0;
      return filters.sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

  useEffect(() => {
    async function fetchAllParcels() {
      if (!processes) return;
      const ids = processes.map((p: any) => p.id);
      const { data } = await supabase
        .from('process_parcels')
        .select('*')
        .in('process_id', ids);
      const map: Record<number, any[]> = {};
      (data || []).forEach((parcel) => {
        if (!map[parcel.process_id]) map[parcel.process_id] = [];
        map[parcel.process_id].push(parcel);
      });
      setParcelsMap(map);
    }
    fetchAllParcels();
  }, [processes]);

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingProcess(null);
    refetch();
  };

  const handleEdit = (process: any) => {
    setEditingProcess(process);
    setIsFormOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Processos</h1>
          <p className="text-muted-foreground">
            Carregando processos...
          </p>
        </div>
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Processos</h1>
          <p className="text-red-600">
            Erro ao carregar processos: {error.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Processos</h1>
          <p className="text-muted-foreground">
            Gestão de processos de transferências financeiras
          </p>
        </div>
        {isAuthenticated && (
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingProcess(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Processo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl">
              <DialogHeader>
                <DialogTitle>
                  {editingProcess ? 'Editar Processo' : 'Novo Processo'}
                </DialogTitle>
              </DialogHeader>
              <ProcessForm
                onSuccess={handleFormSuccess}
                onCancel={() => {
                  setIsFormOpen(false);
                  setEditingProcess(null);
                }}
                initialData={editingProcess}
                isEdit={!!editingProcess}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

  const handleFavoriteToggle = async (processId: number) => {
    if (!isAuthenticated || userRole !== "technical") return;
    
    if (isFavorite(processId)) {
      await removeFromFavorites.mutateAsync(processId);
    } else {
      await addToFavorites.mutateAsync(processId);
    }
  };

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Checkbox 
            checked={selectedProcesses.size === filteredProcesses.length && filteredProcesses.length > 0}
            onCheckedChange={toggleAllSelection}
          />
          <span className="text-sm text-gray-600">
            {selectedProcesses.size > 0 && `${selectedProcesses.size} de `}
            {filteredProcesses.length} processo(s)
          </span>
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
      {viewMode === 'cards' ? (
        <div className="grid gap-6">
          {filteredProcesses.length > 0 ? (
            filteredProcesses.map((process) => {
              const parcels = parcelsMap[process.id] || [];
              const totalParcels = parcels.length;
              const paidParcels = parcels.filter(p => p.payment_date).length;
              const repassedValue = parcels.filter(p => p.payment_date).reduce((sum, p) => sum + (p.value || 0), 0);
              const saldoARepassar = (process.total_concedente_value || 0) - repassedValue;
              return (
                <Card key={process.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3 flex-1">
                        <Checkbox 
                          checked={selectedProcesses.has(process.id)}
                          onCheckedChange={() => toggleProcessSelection(process.id)}
                        />
                        <div className="space-y-2 flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            {process.process_number}
                            {/* Botão de link externo */}
                            {process.link_plataforma_governo && (
                              <a
                                href={process.link_plataforma_governo}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-2 text-blue-600 hover:text-blue-800"
                                title="Acessar plataforma do governo"
                              >
                                <ExternalLink className="h-5 w-5 inline" />
                              </a>
                            )}
                          </CardTitle>
                          <Badge variant="secondary">
                            {process.status_processos?.nome || 'Não definido'}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(process.total_portaria_value)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Valor Total
                          </div>
                        </div>
                        {userRole === "technical" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFavoriteToggle(process.id)}
                            className={`${
                              isFavorite(process.id)
                                ? 'text-yellow-500 hover:text-yellow-600'
                                : 'text-gray-400 hover:text-yellow-500'
                            }`}
                            title={isFavorite(process.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                          >
                            <Star className={`h-4 w-4 ${isFavorite(process.id) ? 'fill-current' : ''}`} />
                          </Button>
                        )}
                        {isAuthenticated && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(process)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-1">Objeto:</h3>
                      <p className="text-gray-600">{process.object}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>
                          {process.municipalities?.name}
                          {process.municipalities?.regioes && ` - ${process.municipalities.regioes.nome}`}
                        </span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>
                          Vigência: {new Date(process.vigencia_date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>

                    {process.portaria_number && (
                      <div className="text-sm text-gray-600">
                        <strong>Portaria:</strong> {process.portaria_number}
                      </div>
                    )}

                    {process.regional_nuclei && (
                      <div className="text-sm text-gray-600">
                        <strong>Núcleo Regional:</strong> {process.regional_nuclei.name} ({process.regional_nuclei.acronym})
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(process.total_concedente_value)}
                        </div>
                        <div className="text-xs text-gray-500">Concedente</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(process.total_proponente_value)}
                        </div>
                        <div className="text-xs text-gray-500">Contrapartida</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">
                          {process.licitado_value ? formatCurrency(process.licitado_value) : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">Licitado</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 pt-2">
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">
                          {paidParcels}/{totalParcels}
                        </div>
                        <div className="text-xs text-gray-500">Parcelas Pagas</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(repassedValue)}
                        </div>
                        <div className="text-xs text-gray-500">Valor Repassado</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(saldoARepassar)}
                        </div>
                        <div className="text-xs text-gray-500">Saldo a Repassar</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'Nenhum processo encontrado' : 'Nenhum processo cadastrado'}
              </h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? 'Tente alterar os termos de busca.' 
                  : 'Não há processos cadastrados no sistema.'
                }
              </p>
              {isAuthenticated && !searchTerm && (
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Primeiro Processo
                </Button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border px-2 py-1 bg-gray-100 w-12">
                  <Checkbox 
                    checked={selectedProcesses.size === filteredProcesses.length && filteredProcesses.length > 0}
                    onCheckedChange={toggleAllSelection}
                  />
                </th>
                {columns.filter(c => c.visible).sort((a, b) => a.order - b.order).map(column => (
                  <th key={column.id} className="border px-2 py-1 bg-gray-100">
                    {column.label}
                  </th>
                ))}
                <th className="border px-2 py-1 bg-gray-100 w-32">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredProcesses.map((process: any) => (
                <tr key={process.id}>
                  <td className="border px-2 py-1">
                    <Checkbox 
                      checked={selectedProcesses.has(process.id)}
                      onCheckedChange={() => toggleProcessSelection(process.id)}
                    />
                  </td>
                  {columns.filter(c => c.visible).sort((a, b) => a.order - b.order).map(column => (
                    <td key={column.id} className="border px-2 py-1">
                      {(() => {
                        switch (column.id) {
                          case 'process_number':
                            return process.process_number;
                          case 'object':
                            return <span title={process.object}>{process.object.substring(0, 50)}...</span>;
                          case 'municipality':
                            return process.municipalities?.name;
                          case 'nucleus':
                            return process.regional_nuclei?.name;
                          case 'status':
                            return (
                              <Badge variant="secondary" className="text-xs">
                                {process.status_processos?.nome || 'Não definido'}
                              </Badge>
                            );
                          case 'total_portaria_value':
                            return formatCurrency(process.total_portaria_value);
                          case 'total_concedente_value':
                            return formatCurrency(process.total_concedente_value || 0);
                          case 'total_proponente_value':
                            return formatCurrency(process.total_proponente_value || 0);
                          case 'vigencia_date':
                            return new Date(process.vigencia_date).toLocaleDateString('pt-BR');
                          case 'parcels_progress':
                            const parcels = parcelsMap[process.id] || [];
                            const paidParcels = parcels.filter(p => p.payment_date).length;
                            return `${paidParcels}/${parcels.length}`;
                          default:
                            return '';
                        }
                      })()}
                    </td>
                  ))}
                  <td className="border px-2 py-1">
                    <div className="flex items-center gap-1">
                      {process.link_plataforma_governo && (
                        <a
                          href={process.link_plataforma_governo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                          title="Acessar plataforma do governo"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      {userRole === "technical" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFavoriteToggle(process.id)}
                          className={`${isFavorite(process.id) ? 'text-yellow-500 hover:text-yellow-600' : 'text-gray-400 hover:text-yellow-500'}`}
                          title={isFavorite(process.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                        >
                          <Star className={`h-4 w-4 ${isFavorite(process.id) ? 'fill-current' : ''}`} />
                        </Button>
                      )}
                      {isAuthenticated && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(process)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
