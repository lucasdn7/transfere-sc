import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Mail, Users, Edit } from "lucide-react";
import { Link } from "react-router-dom";

interface RegionalNucleusCardProps {
  nucleus: any;
  stats: any;
  isAuthenticated: boolean;
  onEdit: (nucleus: any) => void;
}

export function RegionalNucleusCard({ nucleus, stats, isAuthenticated, onEdit }: RegionalNucleusCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{nucleus.name}</CardTitle>
            <Badge variant="outline" className="mt-2">
              {nucleus.acronym}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/municipalities?nucleus=${nucleus.id}`}>
                Ver Municípios
              </Link>
            </Button>
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(nucleus)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumo do Núcleo */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-lg font-bold text-blue-600">
              {stats?.totalProcesses || 0}
            </div>
            <div className="text-xs text-blue-600">Processos</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-sm font-bold text-green-600">
              {stats ? formatCurrency(stats.totalValue) : 'R$ 0,00'}
            </div>
            <div className="text-xs text-green-600">Valor Total</div>
          </div>
        </div>

        {/* Gráfico de Distribuição de Municípios */}
        {nucleus.municipalities && nucleus.municipalities.length > 0 && (
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="text-lg font-bold text-purple-600">
              {nucleus.municipalities.length}
            </div>
            <div className="text-xs text-purple-600">Municípios</div>
          </div>
        )}

        {nucleus.regioes && (
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span className="text-sm">{nucleus.regioes.nome}</span>
          </div>
        )}

        {nucleus.technical_responsible_name && (
          <div>
            <div className="text-sm font-medium text-gray-900">
              {nucleus.technical_responsible_name}
            </div>
            <div className="text-xs text-gray-500">Responsável Técnico</div>
          </div>
        )}

        <div className="space-y-2">
          {nucleus.phone && (
            <div className="flex items-center space-x-2 text-sm">
              <Phone className="h-3 w-3 text-gray-400" />
              <span>{nucleus.phone}</span>
            </div>
          )}

          {nucleus.email && (
            <div className="flex items-center space-x-2 text-sm">
              <Mail className="h-3 w-3 text-gray-400" />
              <span>{nucleus.email}</span>
            </div>
          )}
        </div>

        {/* Municípios do Núcleo */}
        {nucleus.municipalities && nucleus.municipalities.length > 0 && (
          <div className="pt-3 border-t">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium">Municípios ({nucleus.municipalities.length})</span>
            </div>
            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
              {Array.from(new Map(
                nucleus.municipalities.map((m: any) => [m.id, m])
              ).values()).map((municipality: any) => (
                <Badge key={municipality.id} variant="secondary" className="text-xs">
                  {municipality.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Distribuição de Status dos Processos */}
        {stats && stats.statuses && Object.keys(stats.statuses).length > 0 && (
          <div className="pt-3 border-t">
            <div className="text-sm font-medium mb-2">Status dos Processos</div>
            <div className="space-y-1">
              {Object.entries(stats.statuses).map(([status, count]: [string, any]) => (
                <div key={status} className="flex justify-between text-xs">
                  <span>{status}:</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {nucleus.observations && (
          <div className="pt-2 border-t">
            <div className="text-sm text-gray-600">
              {nucleus.observations}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
