import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ParcelManager } from '@/components/processes/ParcelManager';
import type { Database } from '@/integrations/supabase/types';
import { enviarParaGoogleSheets } from '@/utils/googleSheetsUtils';

interface ProcessFormData {
  process_number: string;
  object: string;
  portaria_number?: string;
  municipality_name: string;
  regional_nucleus_name?: string;
  status_name: string;
  total_portaria_value: number;
  total_concedente_value: number;
  total_proponente_value: number;
  licitado_value?: number;
  vigencia_date: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  link_plataforma_governo?: string;
}

interface Parcel {
  id?: number;
  parcel_number: number;
  value: number;
  payment_date: string | null;
  process_id?: number;
}

interface ProcessFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: (Database['public']['Tables']['processes']['Row'] & {
    municipalities?: { name: string };
    regional_nuclei?: { name: string };
    status_processos?: { nome: string };
    link_plataforma_governo?: string;
  });
  isEdit?: boolean;
}

export function ProcessForm({ onSuccess, onCancel, initialData, isEdit = false }: ProcessFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [municipalities, setMunicipalities] = useState<{ id: number; name: string }[]>([]);
  const [regionalNuclei, setRegionalNuclei] = useState<{ id: number; name: string }[]>([]);
  const [statuses, setStatuses] = useState<{ id: number; nome: string; ordem?: number }[]>([]);
  const [currentParcels, setCurrentParcels] = useState<Parcel[]>([]);
  const { toast } = useToast();
  
  const { register, handleSubmit, formState: { errors }, setValue, watch, control } = useForm<ProcessFormData>({
    defaultValues: initialData ? {
      process_number: initialData.process_number || '',
      object: initialData.object || '',
      portaria_number: initialData.portaria_number || '',
      municipality_name: initialData.municipalities?.name || '',
      regional_nucleus_name: initialData.regional_nuclei?.name || '',
      status_name: initialData.status_processos?.nome || '',
      total_portaria_value: initialData.total_portaria_value || 0,
      total_concedente_value: initialData.total_concedente_value || 0,
      total_proponente_value: initialData.total_proponente_value || 0,
      licitado_value: initialData.licitado_value || 0,
      vigencia_date: initialData.vigencia_date || '',
      address: initialData.address || '',
      latitude: initialData.latitude || 0,
      longitude: initialData.longitude || 0,
      link_plataforma_governo: initialData.link_plataforma_governo || '',
    } : {},
  });

  // Função para lidar com mudanças nas parcelas
  const handleParcelChange = (parcels: Parcel[]) => {
    setCurrentParcels(parcels);
  };

  // Remover busca por latitude/longitude já que não existem na tabela municipalities
  useEffect(() => {
    const subscription = watch(async (value, { name }) => {
      if (name === 'municipality_name' && value.municipality_name) {
        // Removido a busca por latitude/longitude pois não existem na tabela
        console.log('Município selecionado:', value.municipality_name);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, setValue]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [municResult, nucleiResult, statusResult] = await Promise.all([
        supabase.from('municipalities').select('*').order('name'),
        supabase.from('regional_nuclei').select('*').order('name'),
        supabase.from('status_processos').select('*').eq('ativo', true).order('ordem')
      ]);

      setMunicipalities(municResult.data || []);
      setRegionalNuclei(nucleiResult.data || []);
      setStatuses(statusResult.data || []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    }
  };

  const findOrCreateMunicipality = async (municipalityName: string) => {
    try {
      // Primeiro, tenta encontrar o município existente
      const { data: existingMunicipality } = await supabase
        .from('municipalities')
        .select('id')
        .ilike('name', municipalityName)
        .single();

      if (existingMunicipality) {
        return existingMunicipality.id;
      }

      // Se não existe, cria um novo município
      const { data: newMunicipality, error } = await supabase
        .from('municipalities')
        .insert([{
          name: municipalityName,
          cnpj: `TEMP-${Date.now()}`, // CNPJ temporário
        }])
        .select('id')
        .single();

      if (error) throw error;
      return newMunicipality.id;
    } catch (error) {
      console.error('Erro ao encontrar/criar município:', error);
      throw error;
    }
  };

  const findOrCreateRegionalNucleus = async (nucleusName: string) => {
    if (!nucleusName) return null;

    try {
      // Primeiro, tenta encontrar o núcleo existente
      const { data: existingNucleus } = await supabase
        .from('regional_nuclei')
        .select('id')
        .ilike('name', nucleusName)
        .single();

      if (existingNucleus) {
        return existingNucleus.id;
      }

      // Se não existe, cria um novo núcleo
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
    } catch (error) {
      console.error('Erro ao encontrar/criar núcleo regional:', error);
      throw error;
    }
  };

  const findOrCreateStatus = async (statusName: string) => {
    try {
      // Primeiro, tenta encontrar o status existente
      const { data: existingStatus } = await supabase
        .from('status_processos')
        .select('id')
        .ilike('nome', statusName)
        .single();

      if (existingStatus) {
        return existingStatus.id;
      }

      // Se não existe, cria um novo status
      const nextOrder = statuses.length > 0 ? Math.max(...statuses.map(s => s.ordem || 0)) + 1 : 1;
      const { data: newStatus, error } = await supabase
        .from('status_processos')
        .insert([{
          nome: statusName,
          descricao: `Status criado automaticamente: ${statusName}`,
          ordem: nextOrder,
          ativo: true,
          cor: '#6b7280'
        }])
        .select('id')
        .single();

      if (error) throw error;
      return newStatus.id;
    } catch (error) {
      console.error('Erro ao encontrar/criar status:', error);
      throw error;
    }
  };

  const onSubmit = async (data: ProcessFormData) => {
    setIsSubmitting(true);
    
    try {
      console.log('Iniciando salvamento do processo:', data);
      
      const municipalityId = await findOrCreateMunicipality(data.municipality_name);
      const regionalNucleusId = data.regional_nucleus_name ? 
        await findOrCreateRegionalNucleus(data.regional_nucleus_name) : null;
      const statusId = await findOrCreateStatus(data.status_name);

      const processData = {
        process_number: data.process_number,
        object: data.object,
        portaria_number: data.portaria_number || null,
        municipality_id: municipalityId,
        regional_nucleus_id: regionalNucleusId,
        status_id: statusId,
        total_portaria_value: data.total_portaria_value,
        total_concedente_value: data.total_concedente_value,
        total_proponente_value: data.total_proponente_value,
        licitado_value: data.licitado_value || null,
        vigencia_date: data.vigencia_date,
        address: data.address || null,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        link_plataforma_governo: data.link_plataforma_governo || null,
      };

      console.log('Dados do processo preparados:', processData);

      let processId: number;

      if (isEdit && initialData?.id) {
        console.log('Atualizando processo existente:', initialData.id);
        const { error } = await supabase
          .from('processes')
          .update(processData)
          .eq('id', initialData.id);

        if (error) {
          console.error('Erro ao atualizar processo:', error);
          throw error;
        }
        processId = initialData.id;
        
        // Primeiro remove todas as parcelas existentes
        console.log('Removendo parcelas existentes do processo:', processId);
        const { error: deleteError } = await supabase
          .from('process_parcels')
          .delete()
          .eq('process_id', processId);

        if (deleteError) {
          console.error('Erro ao remover parcelas existentes:', deleteError);
          throw deleteError;
        }
      } else {
        console.log('Criando novo processo');
        const { data: newProcess, error } = await supabase
          .from('processes')
          .insert([processData])
          .select('id')
          .single();

        if (error) {
          console.error('Erro ao criar processo:', error);
          throw error;
        }
        processId = newProcess.id;
        console.log('Processo criado com ID:', processId);
      }

      // Agora insere as novas parcelas
      if (currentParcels && currentParcels.length > 0) {
        const parcelasToInsert = currentParcels
          .filter(p => p.value > 0)
          .map((parcela, index) => ({
            process_id: processId,
            parcel_number: index + 1,
            value: parcela.value,
            payment_date: parcela.payment_date,
          }));

        console.log('Inserindo parcelas:', parcelasToInsert);

        if (parcelasToInsert.length > 0) {
          const { error: parcelError } = await supabase
            .from('process_parcels')
            .insert(parcelasToInsert);

          if (parcelError) {
            console.error('Erro ao inserir parcelas:', parcelError);
            throw parcelError;
          }
          console.log('Parcelas inseridas com sucesso');
        }
      }

      toast({
        title: isEdit ? 'Processo atualizado com sucesso' : 'Processo criado com sucesso',
        description: isEdit ? 'As informações do processo foram atualizadas.' : 'O novo processo foi adicionado ao sistema.',
      });

      // Enviar dados para Google Sheets após sucesso no Supabase
      try {
        await enviarParaGoogleSheets({
          id: processId,
          process_number: data.process_number,
          object: data.object,
          portaria_number: data.portaria_number,
          total_portaria_value: data.total_portaria_value,
          total_concedente_value: data.total_concedente_value,
          total_proponente_value: data.total_proponente_value,
          licitado_value: data.licitado_value,
          vigencia_date: data.vigencia_date,
          status_id: statusId,
          municipality_id: municipalityId,
          regional_nucleus_id: regionalNucleusId,
          latitude: data.latitude,
          longitude: data.longitude,
          address: data.address,
          link_plataforma_governo: data.link_plataforma_governo,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        console.log('Dados enviados para o Google Sheets');
      } catch (sheetsError) {
        console.log('Erro ao enviar para o Google Sheets');
        // Não interrompe o fluxo principal em caso de erro no Google Sheets
      }

      onSuccess();
    } catch (error: any) {
      console.error('Erro ao salvar processo:', error);
      toast({
        title: 'Erro ao salvar processo',
        description: error.message || 'Ocorreu um erro ao salvar o processo. Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>
          {isEdit ? 'Editar Processo' : 'Novo Processo'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex justify-end space-x-4 pb-4 border-b mb-4 bg-white sticky top-0 left-0 z-20">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Criar Processo')}
            </Button>
          </div>
          <div className="max-h-[80vh] overflow-y-auto pr-2">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="process_number">Número do Processo *</Label>
                  <Input
                    id="process_number"
                    {...register('process_number', { required: 'Campo obrigatório' })}
                    placeholder="Ex: 2024/001"
                  />
                  {errors.process_number && (
                    <p className="text-sm text-red-600">{errors.process_number.message}</p>
                  )}
                </div>

              <div className="space-y-2">
                <Label htmlFor="portaria_number">Número da Portaria</Label>
                <Input
                  id="portaria_number"
                  {...register('portaria_number')}
                  placeholder="Ex: PRT-001/2024"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="object">Objeto *</Label>
              <Textarea
                id="object"
                {...register('object', { required: 'Campo obrigatório' })}
                placeholder="Descreva o objeto do processo..."
                rows={3}
              />
              {errors.object && (
                <p className="text-sm text-red-600">{errors.object.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="municipality_name">Município *</Label>
                <Input
                  id="municipality_name"
                  {...register('municipality_name', { required: 'Campo obrigatório' })}
                  placeholder="Digite o nome do município"
                  list="municipalities-list"
                />
                <datalist id="municipalities-list">
                  {municipalities.map((municipality) => (
                    <option key={municipality.id} value={municipality.name} />
                  ))}
                </datalist>
                {errors.municipality_name && (
                  <p className="text-sm text-red-600">{errors.municipality_name.message}</p>
                )}
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
              <Label htmlFor="status_name">Status *</Label>
              <Input
                id="status_name"
                {...register('status_name', { required: 'Campo obrigatório' })}
                placeholder="Digite o status do processo"
                list="status-list"
              />
              <datalist id="status-list">
                {statuses.map((status) => (
                  <option key={status.id} value={status.nome} />
                ))}
              </datalist>
              {errors.status_name && (
                <p className="text-sm text-red-600">{errors.status_name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="total_portaria_value">Valor Total Portaria *</Label>
                <Input
                  id="total_portaria_value"
                  type="number"
                  step="0.01"
                  {...register('total_portaria_value', { required: 'Campo obrigatório', min: 0 })}
                  placeholder="0.00"
                />
                {errors.total_portaria_value && (
                  <p className="text-sm text-red-600">{errors.total_portaria_value.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="total_concedente_value">Valor Concedente *</Label>
                <Input
                  id="total_concedente_value"
                  type="number"
                  step="0.01"
                  {...register('total_concedente_value', { required: 'Campo obrigatório', min: 0 })}
                  placeholder="0.00"
                />
                {errors.total_concedente_value && (
                  <p className="text-sm text-red-600">{errors.total_concedente_value.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="total_proponente_value">Valor Proponente *</Label>
                <Input
                  id="total_proponente_value"
                  type="number"
                  step="0.01"
                  {...register('total_proponente_value', { required: 'Campo obrigatório', min: 0 })}
                  placeholder="0.00"
                />
                {errors.total_proponente_value && (
                  <p className="text-sm text-red-600">{errors.total_proponente_value.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="licitado_value">Valor Licitado</Label>
                <Input
                  id="licitado_value"
                  type="number"
                  step="0.01"
                  {...register('licitado_value', { min: 0 })}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vigencia_date">Data de Vigência *</Label>
                <Input
                  id="vigencia_date"
                  type="date"
                  {...register('vigencia_date', { required: 'Campo obrigatório' })}
                />
                {errors.vigencia_date && (
                  <p className="text-sm text-red-600">{errors.vigencia_date.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                {...register('address')}
                placeholder="Endereço do projeto"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  {...register('latitude')}
                  placeholder="-27.5954"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  {...register('longitude')}
                  placeholder="-48.5482"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="link_plataforma_governo">Link para Plataforma do Governo</Label>
              <Input
                id="link_plataforma_governo"
                type="url"
                {...register('link_plataforma_governo')}
                placeholder="https://plataforma.gov.br/processo/123"
              />
              {errors.link_plataforma_governo && (
                <p className="text-sm text-red-600">{errors.link_plataforma_governo.message}</p>
              )}
            </div>

            {/* Seção de gestão de parcelas */}
            <div className="mt-6">
              <ParcelManager
                processId={initialData?.id}
                onParcelChange={handleParcelChange}
                isEdit={isEdit}
              />
            </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
