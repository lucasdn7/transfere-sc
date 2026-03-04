import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/utils/processUtils";

interface TransferStats {
  totalConcedente: number;
  totalProponente: number;
  valorRepassado: number;
  saldoARepassar: number;
  percentualRepassado: number;
}

export function TransferProgressBar() {
  const { data: stats, isLoading } = useQuery<TransferStats>({
    queryKey: ['transfer-progress'],
    queryFn: async () => {
      // Buscar todos os processos
      const { data: processes, error: processError } = await supabase
        .from('processes')
        .select('id, total_concedente_value, total_proponente_value');

      if (processError) throw processError;

      // Buscar todas as parcelas pagas
      const { data: parcels, error: parcelError } = await supabase
        .from('process_parcels')
        .select('value, payment_date')
        .not('payment_date', 'is', null);

      if (parcelError) throw parcelError;

      // Calcular estatísticas
      const totalConcedente = processes?.reduce((sum, p) => sum + (p.total_concedente_value || 0), 0) || 0;
      const totalProponente = processes?.reduce((sum, p) => sum + (p.total_proponente_value || 0), 0) || 0;
      const valorRepassado = parcels?.reduce((sum, p) => sum + (p.value || 0), 0) || 0;
      const saldoARepassar = totalConcedente - valorRepassado;
      const percentualRepassado = totalConcedente > 0 ? (valorRepassado / totalConcedente) * 100 : 0;

      return {
        totalConcedente,
        totalProponente,
        valorRepassado,
        saldoARepassar,
        percentualRepassado,
      };
    },
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  if (isLoading || !stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Status das Transferências</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progressColor = stats.percentualRepassado >= 75 ? "bg-green-500" : 
                       stats.percentualRepassado >= 50 ? "bg-yellow-500" : 
                       "bg-blue-500";

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Status das Transferências</span>
          <span className="text-sm font-normal text-gray-500">
            {stats.percentualRepassado.toFixed(1)}% concluído
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Barra de Progressão Principal */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium">Progresso dos Repasses</span>
            <span className="text-gray-600">
              {formatCurrency(stats.valorRepassado)} de {formatCurrency(stats.totalConcedente)}
            </span>
          </div>
          
          <div className="relative">
            <Progress 
              value={stats.percentualRepassado} 
              className="h-4"
            />
            <div 
              className="absolute top-0 left-0 h-4 rounded transition-all duration-500 ease-out"
              style={{ 
                width: `${Math.min(stats.percentualRepassado, 100)}%`,
                background: `linear-gradient(90deg, 
                  ${stats.percentualRepassado >= 75 ? '#10b981' : 
                    stats.percentualRepassado >= 50 ? '#f59e0b' : '#3b82f6'} 0%, 
                  ${stats.percentualRepassado >= 75 ? '#059669' : 
                    stats.percentualRepassado >= 50 ? '#d97706' : '#1d4ed8'} 100%)`
              }}
            />
          </div>
          
          <div className="text-center">
            <span className="text-2xl font-bold text-green-600">
              {stats.percentualRepassado.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Grid com Métricas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Valor Repassado */}
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-sm font-medium text-green-700">Valor Repassado</div>
            <div className="text-lg font-bold text-green-800">
              {formatCurrency(stats.valorRepassado)}
            </div>
            <div className="text-xs text-green-600">
              {stats.percentualRepassado.toFixed(1)}% do total
            </div>
          </div>

          {/* Saldo a Repassar */}
          <div className="bg-orange-50 p-3 rounded-lg">
            <div className="text-sm font-medium text-orange-700">Saldo a Repassar</div>
            <div className="text-lg font-bold text-orange-800">
              {formatCurrency(stats.saldoARepassar)}
            </div>
            <div className="text-xs text-orange-600">
              {(100 - stats.percentualRepassado).toFixed(1)}% restante
            </div>
          </div>

          {/* Total Concedente */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-sm font-medium text-blue-700">Total Concedente</div>
            <div className="text-lg font-bold text-blue-800">
              {formatCurrency(stats.totalConcedente)}
            </div>
            <div className="text-xs text-blue-600">Meta total</div>
          </div>

          {/* Contrapartida */}
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="text-sm font-medium text-purple-700">Contrapartida</div>
            <div className="text-lg font-bold text-purple-800">
              {formatCurrency(stats.totalProponente)}
            </div>
            <div className="text-xs text-purple-600">Recursos municipais</div>
          </div>
        </div>

        {/* Indicadores Visuais */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Repassado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span>Pendente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <span>Total</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}