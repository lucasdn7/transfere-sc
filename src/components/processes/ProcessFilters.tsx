
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Filter, Calendar as CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Database } from "@/integrations/supabase/types";

type TransferStatus = Database['public']['Enums']['transfer_status'];

interface ProcessFiltersProps {
  searchTerm: string;
  statusFilter: TransferStatus | "all";
  onSearchChange: (value: string) => void;
  onStatusChange: (value: TransferStatus | "all") => void;
  filters?: {
    municipality: string;
    regionalNucleus: string;
    minValue: string;
    maxValue: string;
    deadline: Date | null;
    vigenciaStatus?: string; // novo filtro
  };
  onFiltersChange?: (filters: any) => void;
}

export function ProcessFilters({
  searchTerm,
  statusFilter,
  onSearchChange,
  onStatusChange,
  filters,
  onFiltersChange
}: ProcessFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFilterChange = (key: string, value: any) => {
    if (onFiltersChange && filters) {
      onFiltersChange({
        ...filters,
        [key]: value
      });
    }
  };

  const clearFilters = () => {
    onSearchChange("");
    onStatusChange("all");
    if (onFiltersChange) {
      onFiltersChange({
        municipality: "",
        regionalNucleus: "",
        minValue: "",
        maxValue: "",
        deadline: null
      });
    }
  };

  const hasActiveFilters = searchTerm || statusFilter !== "all" || 
    (filters && (filters.municipality || filters.regionalNucleus || filters.minValue || filters.maxValue || filters.deadline));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Busca
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'Filtros Simples' : 'Filtros Avançados'}
            </Button>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros básicos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Buscar processo</label>
            <Input
              placeholder="Número do processo ou objeto..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select value={statusFilter} onValueChange={onStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="Em Análise">Em Análise</SelectItem>
                <SelectItem value="Aprovado">Aprovado</SelectItem>
                <SelectItem value="Finalizado">Finalizado</SelectItem>
                <SelectItem value="Cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filtros avançados */}
        {showAdvanced && filters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <label className="text-sm font-medium mb-2 block">Município</label>
              <Input
                placeholder="Nome do município"
                value={filters.municipality}
                onChange={(e) => handleFilterChange('municipality', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Núcleo Regional</label>
              <Input
                placeholder="Nome do núcleo"
                value={filters.regionalNucleus}
                onChange={(e) => handleFilterChange('regionalNucleus', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Data Limite</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.deadline ? format(filters.deadline, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.deadline}
                    onSelect={(date) => handleFilterChange('deadline', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Valor Mínimo</label>
              <Input
                type="number"
                placeholder="R$ 0,00"
                value={filters.minValue}
                onChange={(e) => handleFilterChange('minValue', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Valor Máximo</label>
              <Input
                type="number"
                placeholder="R$ 999.999,99"
                value={filters.maxValue}
                onChange={(e) => handleFilterChange('maxValue', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Prazo de Vigência</label>
              <Select value={filters.vigenciaStatus || 'all'} onValueChange={v => handleFilterChange('vigenciaStatus', v)}>
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
          </div>
        )}

        {/* Active filters display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <span className="text-sm text-gray-600">Filtros ativos:</span>
            {searchTerm && (
              <Badge variant="secondary">
                Busca: {searchTerm}
                <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => onSearchChange("")} />
              </Badge>
            )}
            {statusFilter !== "all" && (
              <Badge variant="secondary">
                Status: {statusFilter}
                <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => onStatusChange("all")} />
              </Badge>
            )}
            {filters?.municipality && (
              <Badge variant="secondary">
                Município: {filters.municipality}
                <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => handleFilterChange('municipality', '')} />
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
