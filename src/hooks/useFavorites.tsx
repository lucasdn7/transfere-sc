import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export function useFavorites() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar favoritos do usuário
  const { data: favorites, isLoading: isLoadingFavorites } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('process_favorites')
        .select(`
          process_id,
          created_at,
          processes (
            id,
            process_number,
            object,
            total_concedente_value,
            total_proponente_value,
            vigencia_date,
            municipalities (name),
            regional_nuclei (name),
            status_processos (nome, cor)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Buscar anotações técnicas
  const { data: technicalNotes, isLoading: isLoadingNotes } = useQuery({
    queryKey: ['technical-notes', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('process_technical_notes')
        .select('process_id, notes, updated_at')
        .eq('user_id', user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Adicionar aos favoritos
  const addToFavorites = useMutation({
    mutationFn: async (processId: number) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('process_favorites')
        .insert({
          user_id: user.id,
          process_id: processId,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
      toast({
        title: "Processo adicionado aos favoritos",
        description: "O processo foi marcado como favorito com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar aos favoritos",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remover dos favoritos
  const removeFromFavorites = useMutation({
    mutationFn: async (processId: number) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('process_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('process_id', processId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
      toast({
        title: "Processo removido dos favoritos",
        description: "O processo foi removido dos favoritos com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover dos favoritos",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Salvar anotação técnica
  const saveTechnicalNote = useMutation({
    mutationFn: async ({ processId, notes }: { processId: number; notes: string }) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('process_technical_notes')
        .upsert({
          user_id: user.id,
          process_id: processId,
          notes,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technical-notes', user?.id] });
      toast({
        title: "Anotação salva",
        description: "A anotação técnica foi salva com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar anotação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Verificar se um processo é favorito
  const isFavorite = (processId: number) => {
    return favorites?.some(fav => fav.process_id === processId) || false;
  };

  // Obter anotação de um processo
  const getTechnicalNote = (processId: number) => {
    return technicalNotes?.find(note => note.process_id === processId)?.notes || '';
  };

  return {
    favorites,
    technicalNotes,
    isLoadingFavorites,
    isLoadingNotes,
    addToFavorites,
    removeFromFavorites,
    saveTechnicalNote,
    isFavorite,
    getTechnicalNote,
  };
} 