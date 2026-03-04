import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProcessHeader } from "./processes/ProcessHeader";
import { ProcessFilters } from "./processes/ProcessFilters";
import { ProcessTable } from "./processes/ProcessTable";
import { ProcessListLoading } from "./processes/ProcessListLoading";
import type { Database } from "@/integrations/supabase/types";
import { ChevronLeft, ChevronRight } from "lucide-react";

type TransferStatus = Database['public']['Enums']['transfer_status'];

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

export function ProcessList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<TransferStatus | "all">("all");
  const [advancedFilters, setAdvancedFilters] = useState({
    municipality: "",
    regionalNucleus: "",
    minValue: "",
    maxValue: "",
    deadline: null as Date | null,
    vigenciaStatus: 'all' as string // novo filtro
  });
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const debouncedSearchTerm = useDebouncedValue(searchTerm, 400);

  const { data: processes, isLoading, error } = useQuery({
    queryKey: ['processes', debouncedSearchTerm, statusFilter, advancedFilters, page],
    queryFn: async () => {
      let query = supabase
        .from('processes')
        .select(`
          *,
          municipalities (name),
          regional_nuclei (name, acronym),
          status_processos (nome, cor)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (debouncedSearchTerm) {
        query = query.or(`process_number.ilike.%${debouncedSearchTerm}%,object.ilike.%${debouncedSearchTerm}%`);
      }
      if (advancedFilters.municipality) {
        query = query.ilike('municipalities.name', `%${advancedFilters.municipality}%`);
      }
      if (advancedFilters.minValue) {
        query = query.gte('total_portaria_value', parseFloat(advancedFilters.minValue));
      }
      if (advancedFilters.maxValue) {
        query = query.lte('total_portaria_value', parseFloat(advancedFilters.maxValue));
      }
      if (advancedFilters.deadline) {
        query = query.lte('vigencia_date', advancedFilters.deadline.toISOString().split('T')[0]);
      }
      // Filtro de vigência
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const plus30 = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      const plus30Str = plus30.toISOString().split('T')[0];
      if (advancedFilters.vigenciaStatus === 'vencidos') {
        query = query.lt('vigencia_date', todayStr);
      } else if (advancedFilters.vigenciaStatus === 'vigentes') {
        query = query.gte('vigencia_date', todayStr);
      } else if (advancedFilters.vigenciaStatus === 'proximos') {
        query = query.gte('vigencia_date', todayStr).lte('vigencia_date', plus30Str);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: data || [], count: count || 0 };
    },
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  const total = processes?.count || 0;
  const totalPages = Math.ceil(total / pageSize);

  if (isLoading) {
    return <ProcessListLoading />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Erro ao carregar processos: {(error as Error).message}</p>
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
      <ProcessHeader />
      
      <ProcessFilters
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        onSearchChange={setSearchTerm}
        onStatusChange={setStatusFilter}
        filters={advancedFilters}
        onFiltersChange={setAdvancedFilters}
      />

      <ProcessTable processes={processes?.data || []} />
      
      <div className="flex justify-between items-center py-4">
        <span className="text-sm text-gray-600">
          Página {page} de {totalPages} ({total} processos)
        </span>
        <div className="flex gap-2">
          <button
            className="p-2 rounded disabled:opacity-50 border"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            className="p-2 rounded disabled:opacity-50 border"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            aria-label="Próxima página"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
