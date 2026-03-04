import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Search, Filter, Layers, Settings, ZoomIn, ZoomOut, RotateCcw, Link2 } from "lucide-react";
import { useMapboxToken } from "@/hooks/useMapboxToken";
import { MapboxTokenForm } from "@/components/map/MapboxTokenForm";
import { InteractiveMap } from "@/components/map/InteractiveMap";

export default function Map() {
  const { token, isTokenSet, isLoading, saveToken, clearToken } = useMapboxToken();
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [mapStyle, setMapStyle] = useState("satellite");
  const [showLabels, setShowLabels] = useState(true);
  const [showTokenForm, setShowTokenForm] = useState(false);
  const [vigenciaFilter, setVigenciaFilter] = useState<'all' | 'vigentes' | 'proximos' | 'vencidos' | 'concluidas'>('all');
  const [onlyWithContrapartida, setOnlyWithContrapartida] = useState(false);
  const [showConnections, setShowConnections] = useState(true);

  const regions = [
    "Grande Florianópolis",
    "Norte",
    "Vale do Itajaí", 
    "Oeste",
    "Sul",
    "Planalto Norte",
    "Planalto Serrano"
  ];

  const statusOptions = [
    { value: "created", label: "Criado" },
    { value: "in_analysis", label: "Em Análise" },
    { value: "approved", label: "Aprovado" },
    { value: "in_execution", label: "Em Execução" },
    { value: "finished", label: "Finalizado" },
    { value: "cancelled", label: "Cancelado" }
  ];

  const handleTokenSave = (newToken: string) => {
    const success = saveToken(newToken);
    if (success) {
      setShowTokenForm(false);
    }
    return success;
  };

  const handleConfigureToken = () => {
    setShowTokenForm(true);
  };

  // Mostrar loading enquanto verifica token
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="lg:col-span-3">
            <Skeleton className="h-[800px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Se não tem token ou está mostrando formulário, mostrar tela de configuração
  if (!isTokenSet || showTokenForm) {
    return <MapboxTokenForm onTokenSave={handleTokenSave} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mapa Interativo</h1>
        <p className="text-muted-foreground">
          Visualize as transferências financeiras geograficamente
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filtros e Configurações */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search">Buscar Município</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Digite o nome do município..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Região</Label>
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma região" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Regiões</SelectItem>
                    {regions.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status dos Processos</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Vigência</Label>
                <Select value={vigenciaFilter} onValueChange={(v) => setVigenciaFilter(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a vigência" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="vigentes">Vigentes</SelectItem>
                    <SelectItem value="proximos">Próximo ao vencimento (≤ 30 dias)</SelectItem>
                    <SelectItem value="vencidos">Vencidas</SelectItem>
                    <SelectItem value="concluidas">Concluídas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label>Somente com Contrapartida</Label>
                <Button 
                  variant={onlyWithContrapartida ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setOnlyWithContrapartida(!onlyWithContrapartida)}
                >
                  {onlyWithContrapartida ? 'Ativo' : 'Inativo'}
                </Button>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Filtros Ativos</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedRegion !== "all" && (
                    <Badge variant="secondary" className="text-xs">
                      Região: {selectedRegion}
                    </Badge>
                  )}
                  {selectedStatus !== "all" && (
                    <Badge variant="secondary" className="text-xs">
                      Status: {statusOptions.find(s => s.value === selectedStatus)?.label}
                    </Badge>
                  )}
                  {searchTerm && (
                    <Badge variant="secondary" className="text-xs">
                      Busca: {searchTerm}
                    </Badge>
                  )}
                  {vigenciaFilter !== 'all' && (
                    <Badge variant="secondary" className="text-xs">
                      Vigência: {vigenciaFilter}
                    </Badge>
                  )}
                  {onlyWithContrapartida && (
                    <Badge variant="secondary" className="text-xs">
                      Contrapartida: Sim
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configurações do Mapa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Estilo do Mapa</Label>
                <Select value={mapStyle} onValueChange={setMapStyle}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="satellite">Satélite</SelectItem>
                    <SelectItem value="street">Ruas</SelectItem>
                    <SelectItem value="terrain">Terreno</SelectItem>
                    <SelectItem value="dark">Escuro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label>Mostrar Rótulos</Label>
                <Button 
                  variant={showLabels ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setShowLabels(!showLabels)}
                >
                  <Layers className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <Label>Conectar por Município</Label>
                <Button 
                  variant={showConnections ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setShowConnections(!showConnections)}
                >
                  <Link2 className="h-4 w-4" />
                </Button>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Controles</Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Separator />

              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleConfigureToken}
                className="w-full"
              >
                <Settings className="h-4 w-4 mr-2" />
                Reconfigurar Token
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Legenda - Status por Cor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-sm"></div>
                <span className="text-sm">Concluídas</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow-sm"></div>
                <span className="text-sm">Vigentes (mais de 30 dias)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-yellow-500 border-2 border-white shadow-sm"></div>
                <span className="text-sm">Próximo ao vencimento (até 30 dias)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-sm"></div>
                <span className="text-sm">Vencido</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Área do Mapa */}
        <div className="lg:col-span-3">
          <Card className="h-[800px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Mapa de Santa Catarina
              </CardTitle>
            </CardHeader>
            <CardContent className="h-full p-4">
              <InteractiveMap
                token={token}
                mapStyle={mapStyle}
                showLabels={showLabels}
                onConfigureToken={handleConfigureToken}
                statusFilter={selectedStatus}
                regionFilter={selectedRegion}
                searchTerm={searchTerm}
                vigenciaFilter={vigenciaFilter}
                onlyWithContrapartida={onlyWithContrapartida}
                showConnections={showConnections}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
