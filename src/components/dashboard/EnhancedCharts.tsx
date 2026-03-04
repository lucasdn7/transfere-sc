
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line } from "recharts";
import { Badge } from "@/components/ui/badge";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

interface ChartsProps {
  statusData: Array<{ status: string; count: number; percentage: number }>;
  regionalData: Array<{ region: string; count: number; value: number }>;
  monthlyData?: Array<{ month: string; processes: number; value: number }>;
}

export function EnhancedCharts({ statusData, regionalData, monthlyData }: ChartsProps) {
  const chartConfig = {
    count: { label: "Quantidade" },
    value: { label: "Valor" },
    processes: { label: "Processos" }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Status dos Processos
            <Badge variant="outline">{statusData?.length || 0} status</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statusData && statusData.length > 0 ? (
            <div className="space-y-4">
              <ChartContainer config={chartConfig} className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-background border rounded-lg p-2 shadow-md">
                              <p className="font-medium">{data.status}</p>
                              <p className="text-sm text-muted-foreground">
                                {data.count} processos ({data.percentage}%)
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
              
              <div className="space-y-2">
                {statusData.map((item, index) => (
                  <div key={item.status} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span>{item.status}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.count}</span>
                      <Badge variant="secondary" className="text-xs">
                        {item.percentage}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Nenhum dado disponível
            </div>
          )}
        </CardContent>
      </Card>

      {/* Regional Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Distribuição Regional
            <Badge variant="outline">{regionalData?.length || 0} regiões</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {regionalData && regionalData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regionalData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="region" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ChartTooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-md">
                            <p className="font-medium mb-1">{label}</p>
                            <p className="text-sm text-blue-600">
                              Processos: {payload[0].value}
                            </p>
                            {payload[1] && (
                              <p className="text-sm text-green-600">
                                Valor: R$ {Number(payload[1].value).toLocaleString('pt-BR')}
                              </p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" fill="#0088FE" name="Processos" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Nenhum dado disponível
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Trend (if data available) */}
      {monthlyData && monthlyData.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Evolução Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="processes" 
                    stroke="#0088FE" 
                    strokeWidth={2}
                    name="Processos"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
