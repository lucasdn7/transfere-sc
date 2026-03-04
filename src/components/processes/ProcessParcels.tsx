
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AddParcelForm } from "./AddParcelForm";
import { ParcelItem } from "./ParcelItem";
import { ParcelsFinancialSummary } from "./ParcelsFinancialSummary";

interface Parcel {
  id?: number;
  parcel_number: number;
  value: number;
  payment_date: string | null;
  process_id: number;
}

interface ProcessParcelsProps {
  processId: number;
  onParcelsUpdate?: (summary: {
    totalValue: number;
    paidValue: number;
    remainingValue: number;
    totalParcels: number;
    paidParcels: number;
    progressText: string;
  }) => void;
}

export function ProcessParcels({ processId, onParcelsUpdate }: ProcessParcelsProps) {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchParcels();
  }, [processId]);

  // Calcular resumo e notificar componente pai sempre que parcelas mudarem
  useEffect(() => {
    const totalValue = parcels.reduce((sum, parcel) => sum + parcel.value, 0);
    const paidParcels = parcels.filter(parcel => parcel.payment_date);
    const paidValue = paidParcels.reduce((sum, parcel) => sum + parcel.value, 0);
    const remainingValue = totalValue - paidValue;

    const summary = {
      totalValue,
      paidValue,
      remainingValue,
      totalParcels: parcels.length,
      paidParcels: paidParcels.length,
      progressText: `${paidParcels.length}/${parcels.length}`
    };

    onParcelsUpdate?.(summary);
  }, [parcels, onParcelsUpdate]);

  async function fetchParcels() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('process_parcels')
        .select('*')
        .eq('process_id', processId)
        .order('parcel_number');
      
      if (error) throw error;
      setParcels(data || []);
    } catch (error) {
      console.error('Erro ao buscar parcelas:', error);
      toast({
        title: "Erro ao carregar parcelas",
        description: "Não foi possível carregar as parcelas do processo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const totalValue = parcels.reduce((sum, parcel) => sum + parcel.value, 0);
  const paidValue = parcels
    .filter(parcel => parcel.payment_date)
    .reduce((sum, parcel) => sum + parcel.value, 0);
  const remainingValue = totalValue - paidValue;

  if (loading && parcels.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse text-center">Carregando parcelas...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Gerenciar Parcelas</span>
          <div className="text-sm font-normal space-x-4">
            <span className="text-green-600">Repassado: R$ {paidValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            <span className="text-orange-600">Saldo a repassar: R$ {remainingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            <span className="text-blue-600">Total: R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Formulário para adicionar novas parcelas */}
        <AddParcelForm 
          processId={processId}
          existingParcelsCount={parcels.length}
          onParcelAdded={fetchParcels}
        />

        {/* Lista de parcelas existentes */}
        {parcels.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Parcelas Cadastradas</h3>
            <div className="space-y-2">
              {parcels.map(parcel => (
                <ParcelItem 
                  key={parcel.id} 
                  parcel={parcel}
                  onParcelUpdated={fetchParcels}
                />
              ))}
            </div>
          </div>
        )}

        {/* Resumo das parcelas */}
        <ParcelsFinancialSummary parcels={parcels} />

        {parcels.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>Nenhuma parcela cadastrada ainda.</p>
            <p className="text-sm">Use o formulário acima para adicionar parcelas.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
