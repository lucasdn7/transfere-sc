
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ProcessParcel {
  id?: number;
  parcel_number: number;
  value: number;
  payment_date: string | null;
  process_id: number;
}

export interface ParcelsSummary {
  totalValue: number;
  paidValue: number;
  remainingValue: number;
  totalParcels: number;
  paidParcels: number;
  progressText: string;
  progressPercentage: number;
}

export function useProcessParcels(processId: number) {
  const [parcels, setParcels] = useState<ProcessParcel[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<ParcelsSummary>({
    totalValue: 0,
    paidValue: 0,
    remainingValue: 0,
    totalParcels: 0,
    paidParcels: 0,
    progressText: '0/0',
    progressPercentage: 0
  });

  const calculateSummary = (parcelsList: ProcessParcel[]): ParcelsSummary => {
    const totalValue = parcelsList.reduce((sum, parcel) => sum + parcel.value, 0);
    const paidParcels = parcelsList.filter(parcel => parcel.payment_date);
    const paidValue = paidParcels.reduce((sum, parcel) => sum + parcel.value, 0);
    const remainingValue = totalValue - paidValue;
    const progressPercentage = totalValue > 0 ? (paidValue / totalValue) * 100 : 0;

    return {
      totalValue,
      paidValue,
      remainingValue,
      totalParcels: parcelsList.length,
      paidParcels: paidParcels.length,
      progressText: `${paidParcels.length}/${parcelsList.length}`,
      progressPercentage
    };
  };

  const fetchParcels = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('process_parcels')
        .select('*')
        .eq('process_id', processId)
        .order('parcel_number');
      
      if (error) throw error;
      
      const parcelsList = data || [];
      setParcels(parcelsList);
      setSummary(calculateSummary(parcelsList));
    } catch (error) {
      console.error('Erro ao buscar parcelas:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const addParcels = async (count: number, value: number) => {
    try {
      const inserts = Array.from({ length: count }).map((_, i) => ({
        parcel_number: parcels.length + i + 1,
        value: value,
        process_id: processId,
        payment_date: null,
      }));
      
      const { error } = await supabase.from('process_parcels').insert(inserts);
      if (error) throw error;
      
      await fetchParcels();
    } catch (error) {
      console.error('Erro ao adicionar parcelas:', error);
      throw error;
    }
  };

  const updateParcelPayment = async (parcelId: number, paymentDate: string | null) => {
    try {
      const { error } = await supabase
        .from('process_parcels')
        .update({ payment_date: paymentDate })
        .eq('id', parcelId);
      
      if (error) throw error;
      await fetchParcels();
    } catch (error) {
      console.error('Erro ao atualizar pagamento:', error);
      throw error;
    }
  };

  const updateParcelValue = async (parcelId: number, newValue: number) => {
    try {
      const { error } = await supabase
        .from('process_parcels')
        .update({ value: newValue })
        .eq('id', parcelId);
      
      if (error) throw error;
      await fetchParcels();
    } catch (error) {
      console.error('Erro ao atualizar valor:', error);
      throw error;
    }
  };

  const deleteParcel = async (parcelId: number) => {
    try {
      const { error } = await supabase
        .from('process_parcels')
        .delete()
        .eq('id', parcelId);
      
      if (error) throw error;
      await fetchParcels();
    } catch (error) {
      console.error('Erro ao remover parcela:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (processId && processId !== 0) {
      fetchParcels();
    } else {
      setParcels([]);
      setSummary({
        totalValue: 0,
        paidValue: 0,
        remainingValue: 0,
        totalParcels: 0,
        paidParcels: 0,
        progressText: '0/0',
        progressPercentage: 0
      });
    }
  }, [processId]);

  return {
    parcels,
    summary,
    loading,
    fetchParcels,
    addParcels,
    updateParcelPayment,
    updateParcelValue,
    deleteParcel
  };
}
