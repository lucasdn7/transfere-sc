
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StatusLegend() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Legenda de Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm">Finalizado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-sm">Em Andamento</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm">Em Análise</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm">Cancelado/Rejeitado</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
