import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useDocuments(searchTerm: string, selectedCategory: string) {
  return useQuery({
    queryKey: ['documents', searchTerm, selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from('documents')
        .select(`
          *,
          document_categories(name)
        `)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      // Só aplica filtro se selectedCategory for número válido
      if (selectedCategory && selectedCategory !== 'all' && !isNaN(Number(selectedCategory))) {
        query = query.eq('document_category_id', parseInt(selectedCategory));
      }

      const { data, error } = await query;
      if (error) {
        throw error;
      }
      
      return data || [];
    },
  });
}

export function useDocumentCategories() {
  return useQuery({
    queryKey: ['document-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_categories')
        .select('*')
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });
}
