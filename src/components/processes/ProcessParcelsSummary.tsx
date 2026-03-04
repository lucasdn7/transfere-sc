
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ParcelProgressBar } from "./ParcelProgressBar";
import { calculateParcelsSummary, formatCurrencyBR } from "@/utils/parcelUtils";

interface ProcessParcelsSummaryProps {
  processId: number;
  className?: string;
}

interface ParcelsSummary {
  totalValue: number;
  paidValue: number;
  remainingValue: number;
  totalParcels: number;
  paidParcels: number;
  progressText: string;
  progressPercentage: number;
}

export function ProcessParcelsSummary({ processId, className = "" }: ProcessParcelsSummaryProps) {
  const [summary, setSummary] = useState<ParcelsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchParcelsSummary();
  }, [processId]);

  async function fetchParcelsSummary() {
    try {
      const { data, error } = await supabase
        .from('process_parcels')
        .select('value, payment_date')
        .eq('process_id', processId);
      
      if (error) throw error;

      const calculatedSummary = calculateParcelsSummary(data || []);
      setSummary(calculatedSummary);
    } catch (error) {
      console.error('Erro ao buscar resumo das parcelas:', error);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-24"></div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className={`text-gray-500 text-sm ${className}`}>
        Nenhuma parcela cadastrada
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600">Saldo a repassar:</span>
        <span className="font-medium text-orange-600">
          {formatCurrencyBR(summary.remainingValue)}
        </span>
      </div>
      
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600">Valor repassado:</span>
        <span className="font-medium text-green-600">
          {formatCurrencyBR(summary.paidValue)}
        </span>
      </div>
      
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600">Parcelas pagas:</span>
        <span className="font-medium text-blue-600">
          {summary.progressText}
        </span>
      </div>

      <ParcelProgressBar progressPercentage={summary.progressPercentage} />
    </div>
  );
}
