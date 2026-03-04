import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { Download, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#6b7280", "#ef4444"];

const METRICS = [
  { key: "valor_concedente", label: "Valor Concedente" },
  { key: "valor_contrapartida", label: "Valor de Contrapartida" },
  { key: "num_processos", label: "Número de Processos" },
];

const GROUPS = [
  { key: "municipio", label: "Município" },
  { key: "nucleo", label: "Núcleo Regional" },
];

const CHART_TYPES = [
  { key: "bar", label: "Barras" },
  { key: "line", label: "Linhas" },
  { key: "pie", label: "Pizza" },
];

export function DashboardCharts() {
  const { metricsData, isLoading, valoresPagosPorMes, valoresPagosPorAno, valoresEmpilhadosPorMunicipio, valoresEmpilhadosPorNucleo } = useDashboardMetrics();
  const [metric, setMetric] = useState("valor_concedente");
  const [group, setGroup] = useState("municipio");
  const [chartType, setChartType] = useState("bar");

  // Prepara os dados para os gráficos conforme seleção
  const chartData = useMemo(() => {
    if (!metricsData || isLoading) return [];
    let data = [];
    if (group === "municipio") {
      if (metric === "valor_concedente") {
        data = metricsData.valor_concedente_por_municipio || [];
      } else if (metric === "valor_contrapartida") {
        data = metricsData.valor_contrapartida_por_municipio || [];
      } else if (metric === "num_processos") {
        data = metricsData.num_processos_por_municipio || [];
      }
    } else if (group === "nucleo") {
      if (metric === "valor_concedente") {
        data = metricsData.valor_concedente_por_nucleo || [];
      } else if (metric === "valor_contrapartida") {
        data = metricsData.valor_contrapartida_por_nucleo || [];
      } else if (metric === "num_processos") {
        data = metricsData.num_processos_por_nucleo || [];
      }
    }
    return data;
  }, [metricsData, metric, group, isLoading]);

  const metricLabel = METRICS.find(m => m.key === metric)?.label || "";
  const groupLabel = GROUPS.find(g => g.key === group)?.label || "";

  // Função de exportação PDF/XLS
  function exportChart(data, columns, title, type) {
    if (type === 'pdf') {
      const doc = new jsPDF();
      doc.text(title, 14, 16);
      autoTable(doc, {
        head: [columns],
        body: data.map(row => columns.map(col => row[col])),
        startY: 22
      });
      doc.save(`${title}.pdf`);
    } else if (type === 'xls') {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      XLSX.writeFile(wb, `${title}.xlsx`);
    }
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle className="text-lg font-semibold">{metricLabel} por {groupLabel}</CardTitle>
          <div className="flex gap-2 flex-wrap">
            <Select value={metric} onValueChange={setMetric}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METRICS.map(m => (
                  <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={group} onValueChange={setGroup}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GROUPS.map(g => (
                  <SelectItem key={g.key} value={g.key}>{g.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={chartType} onValueChange={setChartType}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHART_TYPES.map(t => (
                  <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-pulse text-muted-foreground">Carregando...</div>
            </div>
          ) : (
            <div className="w-full h-[350px]">
              <ChartRenderer type={chartType} data={chartData} metricLabel={metricLabel} />
            </div>
          )}
        </CardContent>
      </Card>
      {/* NOVOS GRÁFICOS */}
      {/* Gráfico de valores pagos por mês */}
      <Card className="w-full mt-6">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-lg font-semibold">Valores Pagos por Mês</CardTitle>
          <div className="flex gap-2">
            <button title="Exportar PDF" className="text-gray-400 hover:text-blue-600" onClick={() => exportChart(valoresPagosPorMes, ['name', 'value'], 'Valores Pagos por Mês', 'pdf')}><FileText size={18} /></button>
            <button title="Exportar Excel" className="text-gray-400 hover:text-green-600" onClick={() => exportChart(valoresPagosPorMes, ['name', 'value'], 'Valores Pagos por Mês', 'xls')}><Download size={18} /></button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={valoresPagosPorMes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [typeof value === 'number' ? value.toLocaleString('pt-BR') : value, 'Valor']} />
                <Bar dataKey="value" fill="#3b82f6" name="Valor Pago" />
                <Line type="monotone" dataKey="value" stroke="#10b981" name="Valor Pago" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      {/* Gráfico de valores pagos por ano */}
      <Card className="w-full mt-6">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-lg font-semibold">Valores Pagos por Ano</CardTitle>
          <div className="flex gap-2">
            <button title="Exportar PDF" className="text-gray-400 hover:text-blue-600" onClick={() => exportChart(valoresPagosPorAno, ['name', 'value'], 'Valores Pagos por Ano', 'pdf')}><FileText size={18} /></button>
            <button title="Exportar Excel" className="text-gray-400 hover:text-green-600" onClick={() => exportChart(valoresPagosPorAno, ['name', 'value'], 'Valores Pagos por Ano', 'xls')}><Download size={18} /></button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={valoresPagosPorAno}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [typeof value === 'number' ? value.toLocaleString('pt-BR') : value, 'Valor']} />
                <Bar dataKey="value" fill="#3b82f6" name="Valor Pago" />
                <Line type="monotone" dataKey="value" stroke="#10b981" name="Valor Pago" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      {/* Gráfico empilhado por município */}
      <Card className="w-full mt-6">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-lg font-semibold">Valores Repassados e a Repassar por Município</CardTitle>
          <div className="flex gap-2">
            <button title="Exportar PDF" className="text-gray-400 hover:text-blue-600" onClick={() => exportChart(valoresEmpilhadosPorMunicipio, ['name', 'repassado', 'aRepassar'], 'Valores Empilhados por Município', 'pdf')}><FileText size={18} /></button>
            <button title="Exportar Excel" className="text-gray-400 hover:text-green-600" onClick={() => exportChart(valoresEmpilhadosPorMunicipio, ['name', 'repassado', 'aRepassar'], 'Valores Empilhados por Município', 'xls')}><Download size={18} /></button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={valoresEmpilhadosPorMunicipio} stackOffset="none">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value, name) => [typeof value === 'number' ? value.toLocaleString('pt-BR') : value, name === 'repassado' ? 'Repassado' : 'A Repassar']} />
                <Bar dataKey="repassado" stackId="a" fill="#2563eb" name="Repassado" />
                <Bar dataKey="aRepassar" stackId="a" fill="#93c5fd" name="A Repassar" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      {/* Gráfico empilhado por núcleo */}
      <Card className="w-full mt-6">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-lg font-semibold">Valores Repassados e a Repassar por Núcleo Regional</CardTitle>
          <div className="flex gap-2">
            <button title="Exportar PDF" className="text-gray-400 hover:text-blue-600" onClick={() => exportChart(valoresEmpilhadosPorNucleo, ['name', 'repassado', 'aRepassar'], 'Valores Empilhados por Núcleo', 'pdf')}><FileText size={18} /></button>
            <button title="Exportar Excel" className="text-gray-400 hover:text-green-600" onClick={() => exportChart(valoresEmpilhadosPorNucleo, ['name', 'repassado', 'aRepassar'], 'Valores Empilhados por Núcleo', 'xls')}><Download size={18} /></button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={valoresEmpilhadosPorNucleo} stackOffset="none">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value, name) => [typeof value === 'number' ? value.toLocaleString('pt-BR') : value, name === 'repassado' ? 'Repassado' : 'A Repassar']} />
                <Bar dataKey="repassado" stackId="a" fill="#2563eb" name="Repassado" />
                <Bar dataKey="aRepassar" stackId="a" fill="#93c5fd" name="A Repassar" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function ChartRenderer({ type, data, metricLabel }: { type: string; data: any[]; metricLabel: string }) {
  if (type === "bar") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(value: any) => [typeof value === 'number' ? value.toLocaleString('pt-BR') : value, metricLabel]} />
          <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} name={metricLabel} />
        </BarChart>
      </ResponsiveContainer>
    );
  }
  if (type === "line") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(value: any) => [typeof value === 'number' ? value.toLocaleString('pt-BR') : value, metricLabel]} />
          <Line type="monotone" dataKey="value" stroke="#10b981" name={metricLabel} />
        </LineChart>
      </ResponsiveContainer>
    );
  }
  if (type === "pie") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: any) => [typeof value === 'number' ? value.toLocaleString('pt-BR') : value, metricLabel]} />
        </PieChart>
      </ResponsiveContainer>
    );
  }
  return null;
} 