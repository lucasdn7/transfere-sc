
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Settings, BarChart3 } from "lucide-react";

export interface MetricOption {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
}

interface DashboardMetricsSelectorProps {
  metrics: MetricOption[];
  onMetricsChange: (metrics: MetricOption[]) => void;
}

export function DashboardMetricsSelector({ metrics, onMetricsChange }: DashboardMetricsSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleMetricToggle = (metricKey: string, enabled: boolean) => {
    const updatedMetrics = metrics.map(metric =>
      metric.key === metricKey ? { ...metric, enabled } : metric
    );
    onMetricsChange(updatedMetrics);
  };

  const enabledCount = metrics.filter(m => m.enabled).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Métricas do Dashboard
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Configurar ({enabledCount})
          </Button>
        </CardTitle>
      </CardHeader>
      
      {isOpen && (
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground mb-4">
            Selecione quais métricas você deseja visualizar nos gráficos do dashboard:
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {metrics.map((metric) => (
              <div key={metric.key} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50">
                <Checkbox
                  id={metric.key}
                  checked={metric.enabled}
                  onCheckedChange={(checked) => handleMetricToggle(metric.key, !!checked)}
                />
                <div className="space-y-1 flex-1">
                  <Label 
                    htmlFor={metric.key} 
                    className="text-sm font-medium cursor-pointer"
                  >
                    {metric.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {metric.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const allEnabled = metrics.map(m => ({ ...m, enabled: true }));
                onMetricsChange(allEnabled);
              }}
            >
              Selecionar Todos
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const allDisabled = metrics.map(m => ({ ...m, enabled: false }));
                onMetricsChange(allDisabled);
              }}
            >
              Desmarcar Todos
            </Button>
            <Button
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Fechar
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
