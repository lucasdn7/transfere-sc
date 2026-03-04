
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Filter, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DashboardFiltersProps {
  filters: {
    year: string;
    regionalNucleus: string;
    status: string;
    period: Date | null;
  };
  onFiltersChange: (filters: any) => void;
  regionalNuclei: Array<{ id: number; name: string; acronym: string }>;
  statusOptions: Array<{ nome: string }>;
}

export function DashboardFilters({ 
  filters, 
  onFiltersChange, 
  regionalNuclei = [], 
  statusOptions = [] 
}: DashboardFiltersProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  
  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== "" && value !== null
  ).length;

  const clearFilters = () => {
    onFiltersChange({
      year: "",
      regionalNucleus: "",
      status: "",
      period: null
    });
  };

  const updateFilter = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  return (
    <Card className="border-dashed">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">Filtros Rápidos</span>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFiltersCount} ativo{activeFiltersCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-3 w-3 mr-1" />
              Limpar
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Ano</label>
            <Select value={filters.year} onValueChange={(value) => updateFilter('year', value)}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Todos os anos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os anos</SelectItem>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Núcleo Regional</label>
            <Select value={filters.regionalNucleus} onValueChange={(value) => updateFilter('regionalNucleus', value)}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Todos os núcleos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os núcleos</SelectItem>
                {regionalNuclei.map(nucleus => (
                  <SelectItem key={nucleus.id} value={nucleus.id.toString()}>
                    {nucleus.acronym} - {nucleus.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os status</SelectItem>
                {statusOptions.map(status => (
                  <SelectItem key={status.nome} value={status.nome}>
                    {status.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Período</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-8 w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-3 w-3" />
                  {filters.period ? format(filters.period, "MMM/yyyy", { locale: ptBR }) : "Selecionar"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.period}
                  onSelect={(date) => updateFilter('period', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
