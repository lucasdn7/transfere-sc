import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useRegionalNuclei(searchTerm: string, page: number = 1, pageSize: number = 20) {
  return useQuery({
    queryKey: ['regional-nuclei', searchTerm, page],
    queryFn: async () => {
      let query = supabase
        .from('regional_nuclei')
        .select(`
          *,
          regioes (nome, sigla),
          municipalities (id, name)
        `, { count: 'exact' })
        .order('name', { ascending: true })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      const { data, error, count } = await query;
      
      if (error) {
        throw error;
      }
      
      return { data: data || [], count: count || 0 };
    },
  });
}

export function useNucleiStats() {
  return useQuery({
    queryKey: ['nuclei-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('processes')
        .select(`
          regional_nucleus_id,
          total_portaria_value,
          status_processos (nome)
        `);
      
      if (error) throw error;
      
      const stats = data?.reduce((acc: any, process) => {
        const nucleusId = process.regional_nucleus_id;
        if (!nucleusId) return acc;
        
        if (!acc[nucleusId]) {
          acc[nucleusId] = {
            totalProcesses: 0,
            totalValue: 0,
            statuses: {}
          };
        }
        acc[nucleusId].totalProcesses += 1;
        acc[nucleusId].totalValue += process.total_portaria_value || 0;
        
        const status = process.status_processos?.nome || 'Não definido';
        acc[nucleusId].statuses[status] = (acc[nucleusId].statuses[status] || 0) + 1;
        
        return acc;
      }, {});
      
      return stats || {};
    }
  });
}
