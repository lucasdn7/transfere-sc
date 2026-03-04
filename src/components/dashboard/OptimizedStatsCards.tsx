
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, FileText, Building, MapPin, BarChart3 } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { formatCurrency } from "@/utils/processUtils";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
  color?: string;
}

function StatCard({ title, value, change, trend, icon: Icon, color = "text-blue-600" }: StatCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-5 w-5 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            {trend === 'up' && <TrendingUp className="mr-1 h-3 w-3 text-green-500" />}
            {trend === 'down' && <TrendingDown className="mr-1 h-3 w-3 text-red-500" />}
            <span className={trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : ''}>
              {change}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function OptimizedStatsCards() {
  const { data: stats, isLoading, error } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-6 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Erro ao carregar estatísticas</p>
      </div>
    );
  }

  const statsData = [
    {
      title: "Total de Processos",
      value: stats?.totalProcesses?.toLocaleString('pt-BR') || "0",
      change: "Dados atualizados em tempo real",
      trend: 'neutral' as const,
      icon: FileText,
      color: "text-blue-600"
    },
    {
      title: "Valor Total Transferido",
      value: formatCurrency(stats?.totalValue || 0),
      change: "Investimento em Santa Catarina",
      trend: 'up' as const,
      icon: DollarSign,
      color: "text-green-600"
    },
    {
      title: "Municípios Beneficiados",
      value: stats?.activeMunicipalities?.toString() || "0",
      change: "Municípios ativos no programa",
      trend: 'neutral' as const,
      icon: Building,
      color: "text-purple-600"
    },
    {
      title: "Núcleos Regionais",
      value: stats?.regionalNucleiCount?.toString() || "0",
      change: "Cobertura estadual completa",
      trend: 'neutral' as const,
      icon: MapPin,
      color: "text-orange-600"
    }
  ];

  // Cards de repasse
  const repasseCards = [
    {
      title: "Municípios com Repasse Concluído",
      value: stats?.repasseStats?.municipiosRepasseConcluido?.toLocaleString('pt-BR') || '0',
      change: "Valor repassado igual ao concedente",
      trend: "up" as const,
      icon: TrendingUp,
      color: "text-green-700"
    },
    {
      title: "Municípios com 1ª Parcela Paga (Parcial)",
      value: stats?.repasseStats?.municipiosPrimeiraParcela?.toLocaleString('pt-BR') || '0',
      change: "Já receberam parte do valor, mas ainda há saldo a repassar",
      trend: "neutral" as const,
      icon: TrendingDown,
      color: "text-yellow-600"
    }
  ];

  // Cards de insights
  const totalProcesses = stats?.totalProcesses || 0;
  const completed = stats?.executionStats?.completed || 0;
  const inProgress = stats?.executionStats?.inProgress || 0;
  const notStarted = stats?.executionStats?.notStarted || 0;
  const completionRate = totalProcesses > 0 ? (completed / totalProcesses) * 100 : 0;
  const executionRate = totalProcesses > 0 ? (inProgress / totalProcesses) * 100 : 0;
  const notStartedRate = totalProcesses > 0 ? (notStarted / totalProcesses) * 100 : 0;
  const insightsCards = [
    {
      title: "Taxa de Conclusão",
      value: `${completionRate.toFixed(1)}%`,
      change: `${completed} de ${totalProcesses} processos concluídos\n(Apenas status 'Executado' ou 'Finalizado')`,
      trend: "up" as const,
      icon: BarChart3,
      color: "text-blue-700"
    },
    {
      title: "Em Execução",
      value: `${executionRate.toFixed(1)}%`,
      change: `${inProgress} processos em andamento\n(Contrato assinado, Em pagamento, Termo de aditivo, Prestação de contas)`,
      trend: "neutral" as const,
      icon: TrendingUp,
      color: "text-yellow-700"
    },
    {
      title: "A Iniciar",
      value: `${notStartedRate.toFixed(1)}%`,
      change: `${notStarted} processos a iniciar\n(Nenhuma etapa executiva iniciada)`,
      trend: "neutral" as const,
      icon: FileText,
      color: "text-gray-700"
    },
    {
      title: "Valor Médio",
      value: formatCurrency(totalProcesses > 0 ? (stats?.totalValue || 0) / totalProcesses : 0),
      change: "Valor médio por processo",
      trend: "neutral" as const,
      icon: DollarSign,
      color: "text-green-700"
    }
  ];

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>
      {/* Cards de repasse e insights juntos */}
      <div className="grid gap-4 mt-4 md:grid-cols-2 lg:grid-cols-4">
        {repasseCards.concat(insightsCards).map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>
    </>
  );
}
