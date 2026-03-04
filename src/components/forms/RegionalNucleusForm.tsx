import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface RegionalNucleusFormData {
  id?: number;
  name: string;
  acronym: string;
  region_name?: string;
  technical_responsible_name?: string;
  phone?: string;
  email?: string;
  observations?: string;
}

interface RegionalNucleusFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Partial<RegionalNucleusFormData>;
  isEdit?: boolean;
}

export function RegionalNucleusForm({ onSuccess, onCancel, initialData, isEdit = false }: RegionalNucleusFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [regions, setRegions] = useState<any[]>([]);
  const { toast } = useToast();
  
  const { register, handleSubmit, formState: { errors } } = useForm<RegionalNucleusFormData>({
    defaultValues: initialData || {},
  });

  useEffect(() => {
    fetchRegions();
  }, []);

  const fetchRegions = async () => {
    try {
      const { data } = await supabase
        .from('regioes')
        .select('*')
        .eq('ativo', true)
        .order('nome');
      
      setRegions(data || []);
    } catch (error) {
      console.error('Erro ao buscar regiões:', error);
    }
  };

  const findOrCreateRegion = async (regionName: string) => {
    if (!regionName) return null;

    // Primeiro, tenta encontrar a região existente
    const { data: existingRegion } = await supabase
      .from('regioes')
      .select('id')
      .ilike('nome', regionName)
      .single();

    if (existingRegion) {
      return existingRegion.id;
    }

    // Se não existe, cria uma nova região
    const { data: newRegion, error } = await supabase
      .from('regioes')
      .insert([{
        nome: regionName,
        sigla: regionName.substring(0, 3).toUpperCase(),
        ativo: true
      }])
      .select('id')
      .single();

    if (error) throw error;
    return newRegion.id;
  };

  const onSubmit = async (data: RegionalNucleusFormData) => {
    setIsSubmitting(true);
    
    try {
      const regionId = data.region_name ? await findOrCreateRegion(data.region_name) : null;

      const nucleusData = {
        name: data.name,
        acronym: data.acronym,
        region_id: regionId,
        technical_responsible_name: data.technical_responsible_name || null,
        phone: data.phone || null,
        email: data.email || null,
        observations: data.observations || null,
      };

      if (isEdit && initialData?.id) {
        const { error } = await supabase
          .from('regional_nuclei')
          .update(nucleusData)
          .eq('id', initialData.id);

        if (error) throw error;
        
        toast({
          title: 'Núcleo regional atualizado com sucesso',
          description: 'As informações do núcleo regional foram atualizadas.',
        });
      } else {
        const { error } = await supabase
          .from('regional_nuclei')
          .insert([nucleusData]);

        if (error) throw error;
        
        toast({
          title: 'Núcleo regional criado com sucesso',
          description: 'O novo núcleo regional foi adicionado ao sistema.',
        });
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar núcleo regional',
        description: 'Ocorreu um erro ao salvar o núcleo regional. Tente novamente mais tarde.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {isEdit ? 'Editar Núcleo Regional' : 'Novo Núcleo Regional'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex justify-end space-x-4 pb-4 border-b mb-4 bg-white sticky top-0 left-0 z-20">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Criar Núcleo')}
            </Button>
          </div>
          <div className="max-h-[60vh] overflow-y-auto pr-2 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  {...register('name', { required: 'Campo obrigatório' })}
                  placeholder="Nome do núcleo regional"
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="acronym">Sigla *</Label>
                <Input
                  id="acronym"
                  {...register('acronym', { required: 'Campo obrigatório' })}
                  placeholder="Ex: NR01"
                />
                {errors.acronym && (
                  <p className="text-sm text-red-600">{errors.acronym.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="region_name">Região</Label>
              <Input
                id="region_name"
                {...register('region_name')}
                placeholder="Digite o nome da região"
                list="regions-list"
              />
              <datalist id="regions-list">
                {regions.map((region) => (
                  <option key={region.id} value={region.nome} />
                ))}
              </datalist>
            </div>

            <div className="space-y-2">
              <Label htmlFor="technical_responsible_name">Responsável Técnico</Label>
              <Input
                id="technical_responsible_name"
                {...register('technical_responsible_name')}
                placeholder="Nome do responsável técnico"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  {...register('phone')}
                  placeholder="(48) 9999-9999"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="contato@nucleo.sc.gov.br"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observations">Observações</Label>
              <Textarea
                id="observations"
                {...register('observations')}
                placeholder="Observações sobre o núcleo regional..."
                rows={3}
              />
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
