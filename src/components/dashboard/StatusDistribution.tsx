
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import type { Database } from "@/integrations/supabase/types";

type TransferStatus = Database['public']['Enums']['transfer_status'];

export function StatusDistribution() {
  const { data: stats, isLoading, error } = useDashboardStats();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Finalizado':
        return <CheckCircle className="h-4 w-4" />;
      case 'Cancelado':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Finalizado':
        return 'bg-green-100 text-green-800';
      case 'Cancelado':
        return 'bg-red-100 text-red-800';
      case 'TEV':
        return 'bg-blue-100 text-blue-800';
      case 'Aprovado':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-6 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">Erro ao carregar dados</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="h-5 w-5 mr-2" />
          Distribuição por Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(stats?.statusDistribution || {}).map(([status, count]) => (
            <div key={status} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getStatusIcon(status)}
                <span className="text-sm font-medium">
                  {status}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(status)}>
                  {count}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
