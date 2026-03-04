import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UseProcessesFilters {
  searchTerm?: string;
  municipality?: string;
  nucleus?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export function useProcesses({ searchTerm = '', municipality = 'all', nucleus = 'all', dateFrom, dateTo }: UseProcessesFilters) {
  return useQuery({
    queryKey: ['processes', searchTerm, municipality, nucleus, dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase
        .from('processes')
        .select(`
          *,
          municipalities(name, regioes(nome)),
          regional_nuclei(name, acronym),
          status_processos(nome, cor)
        `)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`process_number.ilike.%${searchTerm}%,object.ilike.%${searchTerm}%,municipalities.name.ilike.%${searchTerm}%`);
      }
      if (municipality && municipality !== 'all') {
        query = query.eq('municipality_id', Number(municipality));
      }
      if (nucleus && nucleus !== 'all') {
        query = query.eq('regional_nucleus_id', Number(nucleus));
      }
      if (dateFrom) {
        query = query.gte('created_at', dateFrom.toISOString());
      }
      if (dateTo) {
        query = query.lte('created_at', dateTo.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
} 