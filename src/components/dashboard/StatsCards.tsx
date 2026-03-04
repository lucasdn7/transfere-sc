
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, FileText, Building, Clock } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
}

function StatCard({ title, value, change, trend, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <div className="flex items-center text-xs text-muted-foreground">
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

export function StatsCards() {
  const stats = [
    {
      title: "Total de Processos",
      value: "1,234",
      change: "+12% em relação ao mês anterior",
      trend: 'up' as const,
      icon: FileText
    },
    {
      title: "Valor Total Transferido",
      value: "R$ 125,7M",
      change: "+8% em relação ao mês anterior",
      trend: 'up' as const,
      icon: DollarSign
    },
    {
      title: "Municípios Atendidos",
      value: "295",
      change: "Todos os municípios de SC",
      trend: 'neutral' as const,
      icon: Building
    },
    {
      title: "Processos em Andamento",
      value: "187",
      change: "-5% em relação ao mês anterior",
      trend: 'down' as const,
      icon: Clock
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}
