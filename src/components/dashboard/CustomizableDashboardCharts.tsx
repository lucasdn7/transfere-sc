
import * as React from "react";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

// Métricas disponíveis
const METRICS = [
  { key: "valor_total", label: "Valor Total" },
  { key: "valor_concedente", label: "Valor Concedente" },
  { key: "valor_contrapartida", label: "Valor Contrapartida" },
  { key: "valor_total_nucleo", label: "Valor Total por Núcleo" },
  { key: "valor_total_municipio", label: "Valor Total por Município" },
];

const CHART_TYPES = [
  { key: "bar", label: "Barras" },
  { key: "line", label: "Linhas" },
  { key: "pie", label: "Pizza" },
];

// Tipo para cada gráfico customizável
interface CustomChart {
  id: string;
  metric: string;
  chartType: string;
  editing?: boolean; // Adicionado para controlar o estado de edição
}

// Tipos dos dados recebidos via props
interface Process {
  total_portaria_value: number;
  total_concedente_value: number;
  total_proponente_value: number;
  created_at: string;
  municipalities?: { name: string };
  regional_nuclei?: { name: string };
}

interface RegionalDataItem {
  region: string;
  count: number;
  value: number;
}

interface CustomizableDashboardChartsProps {
  processes: Process[];
  regionalData: RegionalDataItem[];
}

export const CustomizableDashboardCharts: React.FC<CustomizableDashboardChartsProps> = ({ processes, regionalData }) => {
  const [charts, setCharts] = useState<CustomChart[]>([
    { id: "1", metric: "valor_total", chartType: "bar" },
  ]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Cálculo das métricas reais
  const metricsData = useMemo(() => {
    // Agrupar por mês para valor total, concedente e contrapartida
    const groupByMonth = (arr: Process[], field: keyof Process) => {
      const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const result: { name: string; value: number }[] = [];
      for (let i = 0; i < 12; i++) {
        const month = i + 1;
        const monthStr = month.toString().padStart(2, "0");
        const filtered = arr.filter(p => p.created_at.slice(5, 7) === monthStr);
        result.push({
          name: months[i],
          value: filtered.reduce((sum, p) => sum + (p[field] as number || 0), 0)
        });
      }
      // Só retorna meses com valor > 0
      return result.filter(item => item.value > 0);
    };

    // Valor total por núcleo
    const valorTotalNucleo = (regionalData || []).map(r => ({ name: r.region, value: r.value }));

    // Valor total por município
    const municipioMap: Record<string, number> = {};
    processes.forEach(p => {
      const nome = p.municipalities?.name || "Não definido";
      municipioMap[nome] = (municipioMap[nome] || 0) + (p.total_portaria_value || 0);
    });
    const valorTotalMunicipio = Object.entries(municipioMap).map(([name, value]) => ({ name, value }));

    return {
      valor_total: groupByMonth(processes, "total_portaria_value"),
      valor_concedente: groupByMonth(processes, "total_concedente_value"),
      valor_contrapartida: groupByMonth(processes, "total_proponente_value"),
      valor_total_nucleo: valorTotalNucleo,
      valor_total_municipio: valorTotalMunicipio,
    };
  }, [processes, regionalData]);

  // Adiciona novo gráfico
  const addChart = () => {
    setCharts((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        metric: METRICS[0].key,
        chartType: CHART_TYPES[0].key,
      },
    ]);
  };

  // Remove gráfico
  const removeChart = (id: string) => {
    setCharts((prev) => prev.filter((c) => c.id !== id));
  };

  // Atualiza métrica ou tipo de gráfico
  const updateChart = (id: string, field: "metric" | "chartType", value: string) => {
    setCharts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  // Drag and drop simples (sem dependências externas)
  const onDragStart = (index: number) => setDraggedIndex(index);
  const onDragOver = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;
    setCharts((prev) => {
      const newCharts = [...prev];
      const [removed] = newCharts.splice(draggedIndex, 1);
      newCharts.splice(index, 0, removed);
      return newCharts;
    });
    setDraggedIndex(index);
  };
  const onDragEnd = () => setDraggedIndex(null);

  return (
    <div className="grid gap-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold">Gráficos Personalizáveis</h2>
        <Button onClick={addChart} variant="outline">Adicionar Gráfico</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {charts.map((chart, idx) => (
          <div
            key={chart.id}
            draggable
            onDragStart={() => onDragStart(idx)}
            onDragOver={(e) => { e.preventDefault(); onDragOver(idx); }}
            onDragEnd={onDragEnd}
            className="cursor-move"
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between relative">
                <CardTitle className="text-base">
                  {METRICS.find((m) => m.key === chart.metric)?.label}
                  {" - "}
                  {CHART_TYPES.find((t) => t.key === chart.chartType)?.label}
                </CardTitle>
                <div className="flex items-center gap-2 absolute top-2 right-2 z-10">
                  <button
                    className="p-1 rounded hover:bg-muted transition"
                    onClick={() => setCharts((prev) => prev.map((c, i) => i === idx ? { ...c, editing: !c.editing } : c))}
                    title="Editar gráfico"
                    type="button"
                  >
                    <Settings className="h-5 w-5 text-muted-foreground" />
                  </button>
                  <button
                    className="p-1 rounded hover:bg-muted transition"
                    onClick={async (e) => {
                      const card = (e.currentTarget.closest(".cursor-move") as HTMLElement)?.querySelector(".card") as HTMLElement;
                      if (!card) return;
                      const canvas = await html2canvas(card);
                      const imgData = canvas.toDataURL("image/png");
                      const pdf = new jsPDF({ orientation: "landscape" });
                      const width = pdf.internal.pageSize.getWidth();
                      const height = pdf.internal.pageSize.getHeight();
                      pdf.addImage(imgData, "PNG", 0, 0, width, height);
                      pdf.save(`grafico-${chart.metric}.pdf`);
                    }}
                    title="Exportar PDF"
                    type="button"
                  >
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-muted-foreground"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  </button>
                  <button
                    className="p-1 rounded hover:bg-muted transition"
                    onClick={() => {
                      const data = metricsData[chart.metric as keyof typeof metricsData] || [];
                      const ws = XLSX.utils.json_to_sheet(data);
                      const wb = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(wb, ws, "Dados");
                      XLSX.writeFile(wb, `grafico-${chart.metric}.xlsx`);
                    }}
                    title="Exportar XLS"
                    type="button"
                  >
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-muted-foreground"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h16v16H4z" /></svg>
                  </button>
                </div>
                {chart.editing && (
                  <div className="absolute right-0 top-8 bg-white border rounded shadow p-2 z-20 flex flex-col gap-2 min-w-[180px]">
                    <label className="text-xs font-semibold">Métrica</label>
                    <select
                      className="border rounded px-2 py-1 mb-2"
                      value={chart.metric}
                      onChange={(e) => updateChart(chart.id, "metric", e.target.value)}
                    >
                      {METRICS.map((m) => (
                        <option key={m.key} value={m.key}>{m.label}</option>
                      ))}
                    </select>
                    <label className="text-xs font-semibold">Tipo de Gráfico</label>
                    <select
                      className="border rounded px-2 py-1"
                      value={chart.chartType}
                      onChange={(e) => updateChart(chart.id, "chartType", e.target.value)}
                    >
                      {CHART_TYPES.map((t) => (
                        <option key={t.key} value={t.key}>{t.label}</option>
                      ))}
                    </select>
                    <button
                      className="mt-2 text-xs text-primary underline"
                      onClick={() => setCharts((prev) => prev.map((c, i) => i === idx ? { ...c, editing: false } : c))}
                      type="button"
                    >Fechar</button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <ChartRenderer
                  type={chart.chartType}
                  data={metricsData[chart.metric as keyof typeof metricsData] || []}
                  metricLabel={METRICS.find((m) => m.key === chart.metric)?.label || ""}
                />
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

// Renderiza o gráfico conforme o tipo
const ChartRenderer: React.FC<{ type: string; data: any[]; metricLabel: string }> = ({ type, data, metricLabel }) => {
  if (type === "bar") {
    return (
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} name={metricLabel} />
        </BarChart>
      </ResponsiveContainer>
    );
  }
  if (type === "line") {
    return (
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#10b981" name={metricLabel} />
        </LineChart>
      </ResponsiveContainer>
    );
  }
  if (type === "pie") {
    return (
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#6b7280"][idx % 5]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  }
  return null;
}; 
