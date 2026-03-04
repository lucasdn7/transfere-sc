import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface MunicipalityFormData {
  id?: number;
  name: string;
  cnpj: string;
  mayor_name?: string;
  secretary_name?: string;
  phone?: string;
  email?: string;
  population?: number;
  region_name?: string;
  regional_nucleus_name?: string;
  municipality_classification_name?: string;
}

interface MunicipalityFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Partial<MunicipalityFormData>;
  isEdit?: boolean;
}

export function MunicipalityForm({ onSuccess, onCancel, initialData, isEdit = false }: MunicipalityFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [regions, setRegions] = useState<any[]>([]);
  const [regionalNuclei, setRegionalNuclei] = useState<any[]>([]);
  const [classifications, setClassifications] = useState<any[]>([]);
  const { toast } = useToast();
  
  const { register, handleSubmit, formState: { errors } } = useForm<MunicipalityFormData>({
    defaultValues: initialData || {},
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [regionsResult, nucleiResult, classificationsResult] = await Promise.all([
        supabase.from('regioes').select('*').eq('ativo', true).order('nome'),
        supabase.from('regional_nuclei').select('*').order('name'),
        supabase.from('municipality_classifications').select('*').order('name')
      ]);

      setRegions(regionsResult.data || []);
      setRegionalNuclei(nucleiResult.data || []);
      setClassifications(classificationsResult.data || []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    }
  };

  const findOrCreateRegion = async (regionName: string) => {
    if (!regionName) return null;

    const { data: existingRegion } = await supabase
      .from('regioes')
      .select('id')
      .ilike('nome', regionName)
      .single();

    if (existingRegion) {
      return existingRegion.id;
    }

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

  const findOrCreateRegionalNucleus = async (nucleusName: string) => {
    if (!nucleusName) return null;

    const { data: existingNucleus } = await supabase
      .from('regional_nuclei')
      .select('id')
      .ilike('name', nucleusName)
      .single();

    if (existingNucleus) {
      return existingNucleus.id;
    }

    const acronym = nucleusName.substring(0, 5).toUpperCase().replace(/\s/g, '');
    const { data: newNucleus, error } = await supabase
      .from('regional_nuclei')
      .insert([{
        name: nucleusName,
        acronym: acronym,
      }])
      .select('id')
      .single();

    if (error) throw error;
    return newNucleus.id;
  };

  const findOrCreateClassification = async (classificationName: string) => {
    if (!classificationName) return null;

    const { data: existingClassification } = await supabase
      .from('municipality_classifications')
      .select('id')
      .ilike('name', classificationName)
      .single();

    if (existingClassification) {
      return existingClassification.id;
    }

    const { data: newClassification, error } = await supabase
      .from('municipality_classifications')
      .insert([{
        name: classificationName,
      }])
      .select('id')
      .single();

    if (error) throw error;
    return newClassification.id;
  };

  const onSubmit = async (data: MunicipalityFormData) => {
    setIsSubmitting(true);
    
    try {
      const regionId = data.region_name ? await findOrCreateRegion(data.region_name) : null;
      const regionalNucleusId = data.regional_nucleus_name ? 
        await findOrCreateRegionalNucleus(data.regional_nucleus_name) : null;
      const classificationId = data.municipality_classification_name ? 
        await findOrCreateClassification(data.municipality_classification_name) : null;

      const municipalityData = {
        name: data.name,
        cnpj: data.cnpj,
        mayor_name: data.mayor_name || null,
        secretary_name: data.secretary_name || null,
        phone: data.phone || null,
        email: data.email || null,
        population: data.population || null,
        region_id: regionId,
        regional_nucleus_id: regionalNucleusId,
        municipality_classification_id: classificationId,
      };

      if (isEdit && initialData?.id) {
        const { error } = await supabase
          .from('municipalities')
          .update(municipalityData)
          .eq('id', initialData.id);

        if (error) throw error;
        
        toast({
          title: 'Município atualizado com sucesso',
          description: 'As informações do município foram atualizadas.',
        });
      } else {
        const { error } = await supabase
          .from('municipalities')
          .insert([municipalityData]);

        if (error) throw error;
        
        toast({
          title: 'Município criado com sucesso',
          description: 'O novo município foi adicionado ao sistema.',
        });
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar município',
        description: 'Ocorreu um erro ao salvar o município. Tente novamente mais tarde.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>
          {isEdit ? 'Editar Município' : 'Novo Município'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex justify-end space-x-4 pb-4 border-b mb-4 bg-white sticky top-0 left-0 z-20">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Criar Município')}
            </Button>
          </div>
          <div className="max-h-[60vh] overflow-y-auto pr-2 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  {...register('name', { required: 'Campo obrigatório' })}
                  placeholder="Nome do município"
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ *</Label>
                <Input
                  id="cnpj"
                  {...register('cnpj', { required: 'Campo obrigatório' })}
                  placeholder="00.000.000/0000-00"
                />
                {errors.cnpj && (
                  <p className="text-sm text-red-600">{errors.cnpj.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mayor_name">Nome do Prefeito</Label>
                <Input
                  id="mayor_name"
                  {...register('mayor_name')}
                  placeholder="Nome do prefeito"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="secretary_name">Nome do Secretário</Label>
                <Input
                  id="secretary_name"
                  {...register('secretary_name')}
                  placeholder="Nome do secretário"
                />
              </div>
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
                  placeholder="contato@municipio.sc.gov.br"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="population">População</Label>
              <Input
                id="population"
                type="number"
                {...register('population', { min: 0 })}
                placeholder="Número de habitantes"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label htmlFor="regional_nucleus_name">Núcleo Regional</Label>
                <Input
                  id="regional_nucleus_name"
                  {...register('regional_nucleus_name')}
                  placeholder="Digite o nome do núcleo regional"
                  list="nuclei-list"
                />
                <datalist id="nuclei-list">
                  {regionalNuclei.map((nucleus) => (
                    <option key={nucleus.id} value={nucleus.name} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="municipality_classification_name">Classificação</Label>
              <Input
                id="municipality_classification_name"
                {...register('municipality_classification_name')}
                placeholder="Digite a classificação do município"
                list="classifications-list"
              />
              <datalist id="classifications-list">
                {classifications.map((classification) => (
                  <option key={classification.id} value={classification.name} />
                ))}
              </datalist>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
