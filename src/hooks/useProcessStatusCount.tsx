import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProcessStatusCount {
  id: number;
  nome: string;
  cor: string | null;
  count: number;
  processes: Array<{
    id: number;
    process_number: string;
    object: string;
    link_plataforma_governo: string | null;
    municipality: {
      name: string;
    };
  }>;
}

export function useProcessStatusCount() {
  return useQuery<ProcessStatusCount[]>({
    queryKey: ['process-status-count'],
    queryFn: async () => {
      // Buscar todos os status
      const { data: statusList, error: statusError } = await supabase
        .from('status_processos')
        .select('id, nome, cor, ordem')
        .eq('ativo', true)
        .order('ordem');

      if (statusError) throw statusError;

      // Para cada status, buscar a contagem e os processos
      const statusWithCounts = await Promise.all(
        statusList.map(async (status) => {
          const { data: processes, error: processError } = await supabase
            .from('processes')
            .select(`
              id,
              process_number,
              object,
              link_plataforma_governo,
              municipalities(name)
            `)
            .eq('status_id', status.id);

          if (processError) throw processError;

          return {
            ...status,
            count: processes?.length || 0,
            processes: processes?.map(p => ({
              id: p.id,
              process_number: p.process_number,
              object: p.object,
              link_plataforma_governo: p.link_plataforma_governo,
              municipality: {
                name: p.municipalities?.name || 'Não informado'
              }
            })) || []
          };
        })
      );

      return statusWithCounts;
    },
    refetchInterval: 60000, // Atualizar a cada minuto
  });
}