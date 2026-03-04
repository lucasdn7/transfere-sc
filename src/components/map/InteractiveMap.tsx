import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Settings, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/processUtils';

interface InteractiveMapProps {
  token: string;
  mapStyle: string;
  showLabels: boolean;
  onConfigureToken: () => void;
  statusFilter?: string;
  regionFilter?: string;
  searchTerm?: string;
  vigenciaFilter?: 'all' | 'vigentes' | 'proximos' | 'vencidos' | 'concluidas';
  onlyWithContrapartida?: boolean;
  showConnections?: boolean;
}

export function InteractiveMap({ token, mapStyle, showLabels, onConfigureToken, statusFilter, regionFilter, searchTerm, vigenciaFilter = 'all', onlyWithContrapartida = false, showConnections = true }: InteractiveMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const initializeMap = () => {
    setRetryCount(prev => prev + 1);
    setError(null);
    setIsLoaded(false);
    setIsInitializing(true);
    
    // Clear existing map
    if (map.current) {
      map.current.remove();
      map.current = null;
    }
  };

  useEffect(() => {
    if (!mapContainer.current || !token) return;
    
    // Evitar re-inicialização se o mapa já está carregado e não houve mudança significativa
    if (map.current && isLoaded && !error) {
      return;
    }

    // Só inicializar se não estiver já inicializando
    if (isInitializing) return;

    initializeMap();

    try {
      // Verificar se o token é válido
      if (!token.startsWith('pk.')) {
        setError('Token inválido. A chave deve começar com "pk.". Verifique e tente novamente.');
        setIsInitializing(false);
        return;
      }

      // Verificar se o token tem o formato correto
      if (token.length < 50) {
        setError('Token muito curto. Verifique se copiou a chave completa do Mapbox.');
        setIsInitializing(false);
        return;
      }

      mapboxgl.accessToken = token;

      // Verificar se o container está disponível
      if (!mapContainer.current) {
        setError('Erro interno: container do mapa não encontrado.');
        setIsInitializing(false);
        return;
      }

      // Verificar suporte ao WebGL
      if (!mapboxgl.supported()) {
        setError('Seu navegador não suporta WebGL, necessário para exibir o mapa. Tente atualizar seu navegador ou usar outro.');
        setIsInitializing(false);
        return;
      }

      // Configurar estilos baseado na seleção
      const styleMap: { [key: string]: string } = {
        satellite: 'mapbox://styles/mapbox/satellite-v9',
        street: 'mapbox://styles/mapbox/streets-v12',
        terrain: 'mapbox://styles/mapbox/outdoors-v12',
        dark: 'mapbox://styles/mapbox/dark-v11'
      };

      const mapInstance = new mapboxgl.Map({
        container: mapContainer.current,
        style: styleMap[mapStyle] || styleMap.satellite,
        center: [-48.5482, -27.5954], // Centro de Santa Catarina
        zoom: 7,
        pitch: 0, // Reduzir pitch inicial para evitar problemas de WebGL
        bearing: 0,
        antialias: true,
        failIfMajorPerformanceCaveat: false, // Permitir renderização mesmo com performance limitada
        maxTileCacheSize: 50, // Reduzir cache para evitar problemas de memória
        preserveDrawingBuffer: false, // Melhorar performance
        refreshExpiredTiles: true, // Recarregar tiles expirados automaticamente
      });

      map.current = mapInstance;

      // Timeout para detectar problemas de carregamento
      const loadTimeout = setTimeout(() => {
        // Verificar se o mapa ainda existe e não foi carregado
        if (!isLoaded && map.current && !error) {
          console.warn('Mapa demorou muito para carregar');
          
          // Check network connectivity
          if (!navigator.onLine) {
            setError('Sem conexão com a internet. Verifique sua conexão e tente novamente.');
          } else {
            setError('O mapa está demorando para carregar. Verifique sua conexão e chave API.');
          }
          setIsInitializing(false);
        }
      }, 30000); // 30 segundos

      // Adicionar controles de navegação
      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        'top-right'
      );

      // Adicionar controle de escala
      map.current.addControl(new mapboxgl.ScaleControl());

      // Funções auxiliares
      const getVigenciaStatus = (vigenciaDate?: string, isFinished?: boolean) => {
        if (isFinished) return 'concluidas';
        if (!vigenciaDate) return 'vigentes';
        const today = new Date();
        const date = new Date(vigenciaDate);
        const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return 'vencidos';
        if (diffDays <= 30) return 'proximos';
        return 'vigentes';
      };

      const getMarkerColor = (vigenciaDate?: string, isFinished?: boolean) => {
        if (isFinished) return '#3b82f6'; // azul para concluídas
        const status = getVigenciaStatus(vigenciaDate, false);
        if (status === 'vencidos') return '#ef4444';
        if (status === 'proximos') return '#f59e0b';
        return '#10b981';
      };

      // Evento quando o mapa carrega
      map.current.on('load', async () => {
        console.log('Mapa carregado com sucesso');
        setIsLoaded(true);
        setIsInitializing(false);
        
        // Limpar o timeout quando o mapa carregar com sucesso
        clearTimeout(loadTimeout);

        // Buscar processos da base de dados
        try {
          let query: any = supabase
            .from('processes')
            .select(`
              *,
              municipalities(name),
              status_processos(nome, cor)
            `)
            .not('latitude', 'is', null)
            .not('longitude', 'is', null);
          if (statusFilter && statusFilter !== 'all') {
            query = query.eq('current_status', statusFilter);
          }
          if (regionFilter && regionFilter !== 'all') {
            query = query.ilike('municipalities.region', `%${regionFilter}%`);
          }
          if (searchTerm) {
            query = query.ilike('municipalities.name', `%${searchTerm}%`);
          }
          if (onlyWithContrapartida) {
            query = query.gt('total_proponente_value', 0);
          }
          const result = await query as any;
          const data = result.data;
          const error = result.error;
          let processes = (Array.isArray(data) ? data : []) as any[];

          if (error) {
            console.error('Erro ao buscar processos:', error);
            // Don't fail the entire map if data loading fails
            console.warn('Mapa carregado sem dados dos processos devido a erro na consulta');
            return;
          }

          // Filtrar por vigência conforme seleção (pós-consulta)
          if (vigenciaFilter && vigenciaFilter !== 'all') {
            processes = processes.filter((p) => {
              const isFinished = (p.status_processos && 'nome' in p.status_processos) ? String(p.status_processos.nome).toLowerCase().includes('final') : false;
              const status = getVigenciaStatus(p.vigencia_date, isFinished);
              return status === vigenciaFilter;
            });
          }

          console.log('Processos encontrados para o mapa:', processes?.length || 0);

          // Adicionar marcadores para cada processo
          processes?.forEach((process) => {
            if (process.latitude && process.longitude) {
              const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
                <div style="padding: 12px; max-width: 300px;">
                  <h3 style="margin: 0 0 8px 0; font-weight: bold; font-size: 14px;">${process.process_number}</h3>
                  <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">${process.object}</p>
                  <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Município:</strong> ${(process.municipalities && 'name' in process.municipalities) ? process.municipalities.name : 'N/A'}</p>
                  <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Valor:</strong> ${formatCurrency(process.total_portaria_value)}</p>
                  <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Status:</strong> ${process.status_processos?.nome || 'N/A'}</p>
                  <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Vigência:</strong> ${process.vigencia_date ? new Date(process.vigencia_date).toLocaleDateString('pt-BR') : 'N/A'}</p>
                  <p style="margin: 0 0 0 0; font-size: 12px;"><strong>Contrapartida:</strong> ${formatCurrency(process.total_proponente_value || 0)}</p>
                </div>
              `);

              // Definir cor do marcador baseado na vigência/conclusão
              const isFinished = (process.status_processos && 'nome' in process.status_processos) ? String(process.status_processos.nome).toLowerCase().includes('final') : false;
              const markerColor = getMarkerColor(process.vigencia_date, isFinished);

              new mapboxgl.Marker({
                color: markerColor,
                scale: 0.8
              })
                .setLngLat([process.longitude, process.latitude])
                .setPopup(popup)
                .addTo(map.current!);
            }
          });

          // Conectar processos do mesmo município com linhas
          if (showConnections) {
            const municipalityGroups = processes?.reduce((groups: any, process) => {
              const municipalityName = (process.municipalities && 'name' in process.municipalities) ? process.municipalities.name : undefined;
              if (municipalityName && process.latitude && process.longitude) {
                if (!groups[municipalityName]) {
                  groups[municipalityName] = [];
                }
                groups[municipalityName].push(process);
              }
              return groups;
            }, {});

            Object.entries(municipalityGroups || {}).forEach(([municipalityName, municipalityProcesses]: [string, any]) => {
              if (municipalityProcesses.length > 1) {
                const coordinates = municipalityProcesses.map((p: any) => [p.longitude, p.latitude]);
                const sourceId = `municipality-connections-${municipalityName.replace(/\s+/g, '-')}`;
                const layerId = `municipality-lines-${municipalityName.replace(/\s+/g, '-')}`;
                map.current!.addSource(sourceId, {
                  type: 'geojson',
                  data: {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                      type: 'LineString',
                      coordinates: coordinates
                    }
                  }
                });
                map.current!.addLayer({
                  id: layerId,
                  type: 'line',
                  source: sourceId,
                  layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                  },
                  paint: {
                    'line-color': '#3b82f6',
                    'line-width': 2,
                    'line-opacity': 0.6
                  }
                });
              }
            });
          }

        } catch (error) {
          console.error('Erro ao carregar processos no mapa:', error);
        }
      });

      // Tratamento de erros
      map.current.on('error', (e) => {
        console.error('Erro no Mapbox:', e.error);
        
        // Limpar o timeout quando há erro
        clearTimeout(loadTimeout);
        
        // More specific error messages based on the error type
        if (e.error?.message?.includes('401') || e.error?.message?.includes('Unauthorized')) {
          setError('Token do Mapbox inválido ou expirado. Verifique sua chave API.');
        } else if (e.error?.message?.includes('network') || e.error?.message?.includes('fetch')) {
          setError('Erro de conexão. Verifique sua internet e tente novamente.');
        } else if (e.error?.message?.includes('style')) {
          setError('Erro ao carregar o estilo do mapa. Tente outro estilo.');
        } else {
          setError('Erro ao carregar o mapa. Verifique sua chave API e conexão.');
        }
        
        setIsInitializing(false);
      });

      return () => {
        clearTimeout(loadTimeout);
        if (map.current) {
          map.current.remove();
          map.current = null;
        }
      };

    } catch (error) {
      console.error('Erro ao inicializar o mapa:', error);
      setError('Erro ao inicializar o mapa. Tente recarregar a página ou verificar sua chave API.');
      setIsInitializing(false);
    }
  }, [token, mapStyle, statusFilter, regionFilter, searchTerm, vigenciaFilter, onlyWithContrapartida, showConnections]);

  // Atualizar visibilidade dos rótulos
  useEffect(() => {
    if (map.current && isLoaded) {
      const visibility = showLabels ? 'visible' : 'none';
      
      try {
        const style = map.current.getStyle();
        style.layers?.forEach((layer) => {
          if (layer.type === 'symbol' && layer.layout && 'text-field' in layer.layout) {
            map.current?.setLayoutProperty(layer.id, 'visibility', visibility);
          }
        });
      } catch (error) {
        console.log('Não foi possível alterar a visibilidade dos rótulos:', error);
      }
    }
  }, [showLabels, isLoaded]);

  if (!token) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="text-center space-y-4">
          <p className="text-gray-600">Token do Mapbox não configurado</p>
          <Button onClick={onConfigureToken}>
            <Settings className="h-4 w-4 mr-2" />
            Configurar Token
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-left">
              {error}
              {retryCount > 1 && (
                <div className="mt-2 text-sm text-muted-foreground">
                  Tentativa {retryCount} de carregamento
                </div>
              )}
            </AlertDescription>
          </Alert>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button onClick={initializeMap} variant="outline">
                Tentar Novamente
              </Button>
              <Button onClick={onConfigureToken} variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Reconfigurar Token
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Certifique-se de que sua chave API está correta e ativa.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
      
      {(isInitializing || !isLoaded) && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="text-center space-y-3">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Carregando mapa...</p>
              <p className="text-xs text-muted-foreground">
                {retryCount > 1 ? `Tentativa ${retryCount}...` : 'Inicializando Mapbox GL JS'}
              </p>
              {retryCount > 2 && (
                <p className="text-xs text-yellow-600">
                  Conexão lenta detectada. Aguarde...
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm"
        onClick={onConfigureToken}
      >
        <Settings className="h-4 w-4 mr-2" />
        Reconfigurar
      </Button>
    </div>
  );
}
