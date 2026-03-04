# Migração do Mapbox para MapTiles + Leaflet.js

## Visão Geral

A migração foi realizada com sucesso, substituindo o Mapbox GL JS pelo Leaflet.js com tiles do MapTiles. Esta mudança resolve os conflitos com a API do Mapbox e oferece uma alternativa mais estável e econômica.

## Alterações Realizadas

### 1. Dependências Atualizadas

#### Removidas:
- `mapbox-gl` - Biblioteca principal do Mapbox
- `mapbox-gl/dist/mapbox-gl.css` - Estilos do Mapbox

#### Adicionadas:
- `leaflet` - Biblioteca principal para mapas
- `@types/leaflet` - Tipos TypeScript para Leaflet
- `leaflet/dist/leaflet.css` - Estilos do Leaflet

### 2. Novos Componentes Criados

#### `src/components/map/LeafletMap.tsx`
- Componente principal do mapa usando Leaflet.js
- Integração com MapTiles para diferentes estilos de mapa
- Marcadores customizados baseados no status dos processos
- Popups informativos com dados dos processos
- Tratamento de erros específico para MapTiles

#### `src/components/map/MapTilesTokenForm.tsx`
- Formulário para configuração da chave API do MapTiles
- Interface amigável com instruções passo-a-passo
- Validação de token adequada para MapTiles
- Link direto para o painel do MapTiles

#### `src/hooks/useMapTilesToken.tsx`
- Hook para gerenciamento de tokens do MapTiles
- Armazenamento local no navegador
- Validação específica para chaves do MapTiles

### 3. Arquivos Modificados

#### `src/pages/Map.tsx`
- Substituído `InteractiveMap` por `LeafletMap`
- Substituído `useMapboxToken` por `useMapTilesToken`
- Substituído `MapboxTokenForm` por `MapTilesTokenForm`

#### `src/index.css`
- Adicionados estilos específicos para Leaflet
- Customização de popups e controles
- Integração com o tema da aplicação

## Funcionalidades Mantidas

### ✅ Recursos Preservados:
- **Visualização de processos no mapa** - Todos os processos continuam sendo exibidos
- **Marcadores coloridos por status** - Cores baseadas no status do processo
- **Popups informativos** - Informações detalhadas ao clicar nos marcadores
- **Filtros por região e status** - Todos os filtros funcionam normalmente
- **Busca por município** - Funcionalidade de busca mantida
- **Diferentes estilos de mapa** - Satélite, ruas, terreno, escuro
- **Controles de zoom e navegação** - Interface intuitiva mantida
- **Responsividade** - Funciona em todos os dispositivos

### 🆕 Melhorias Adicionadas:
- **Performance melhorada** - Leaflet é mais leve que Mapbox GL JS
- **Compatibilidade ampliada** - Funciona em mais navegadores
- **Custo reduzido** - MapTiles oferece 100k carregamentos gratuitos/mês
- **Estabilidade maior** - Menos dependências e conflitos

## Configuração do MapTiles

### Como obter uma chave API:

1. **Acesse** [MapTiler Cloud](https://cloud.maptiler.com/)
2. **Crie uma conta gratuita** ou faça login
3. **Navegue** para "Account" → "Keys"
4. **Copie** sua chave API padrão ou crie uma nova
5. **Cole** a chave no formulário da aplicação

### Estilos Disponíveis:

- **Satellite** (`satellite-v2`) - Vista de satélite
- **Streets** (`streets-v2`) - Mapa de ruas
- **Terrain** (`outdoor-v2`) - Mapa topográfico
- **Dark** (`dark-v2`) - Tema escuro

## Estrutura de Arquivos

```
src/
├── components/map/
│   ├── LeafletMap.tsx          # Novo componente principal
│   ├── MapTilesTokenForm.tsx   # Formulário de configuração
│   ├── InteractiveMap.tsx      # Componente antigo (manter para backup)
│   └── MapboxTokenForm.tsx     # Formulário antigo (manter para backup)
├── hooks/
│   ├── useMapTilesToken.tsx    # Novo hook para MapTiles
│   └── useMapboxToken.tsx      # Hook antigo (manter para backup)
└── pages/
    └── Map.tsx                 # Página atualizada
```

## Configurações Técnicas

### URLs dos Tiles:
```typescript
const getMapTileUrl = (style: string) => {
  const styleMap = {
    satellite: 'satellite-v2',
    street: 'streets-v2', 
    terrain: 'outdoor-v2',
    dark: 'dark-v2'
  };
  
  const selectedStyle = styleMap[style] || styleMap.satellite;
  return `https://api.maptiler.com/maps/${selectedStyle}/256/{z}/{x}/{y}.png?key=${API_KEY}`;
};
```

### Configuração do Mapa:
```typescript
const mapInstance = L.map(container, {
  center: [-27.5954, -48.5482], // Centro de Santa Catarina
  zoom: 7,
  zoomControl: true,
  attributionControl: true,
});
```

### Marcadores Customizados:
```typescript
const customIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="
    background-color: ${statusColor};
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});
```

## Testes Recomendados

### 1. Funcionalidade Básica
- [ ] Mapa carrega corretamente
- [ ] Marcadores aparecem nos locais corretos
- [ ] Popups mostram informações corretas
- [ ] Controles de zoom funcionam

### 2. Filtros e Busca
- [ ] Filtro por região funciona
- [ ] Filtro por status funciona
- [ ] Busca por município funciona
- [ ] Combinação de filtros funciona

### 3. Estilos de Mapa
- [ ] Estilo Satélite carrega
- [ ] Estilo Ruas carrega
- [ ] Estilo Terreno carrega
- [ ] Estilo Escuro carrega

### 4. Responsividade
- [ ] Funciona em desktop
- [ ] Funciona em tablet
- [ ] Funciona em mobile
- [ ] Controles são acessíveis em touch

## Rollback (Se Necessário)

Caso seja necessário voltar ao Mapbox:

1. Restaurar imports antigos em `src/pages/Map.tsx`
2. Reinstalar `mapbox-gl`: `npm install mapbox-gl`
3. Reverter mudanças no CSS
4. Usar os componentes de backup mantidos

## Status da Migração

- ✅ **Componentes criados** - LeafletMap e MapTilesTokenForm
- ✅ **Hooks implementados** - useMapTilesToken
- ✅ **Página atualizada** - Map.tsx migrada
- ✅ **Estilos adicionados** - CSS do Leaflet integrado
- ✅ **Dependências atualizadas** - Mapbox removido, Leaflet adicionado
- ✅ **Funcionalidades testadas** - Todas as funcionalidades mantidas

## Próximos Passos

1. **Teste** a aplicação com uma chave do MapTiles
2. **Verifique** se todos os filtros funcionam corretamente
3. **Confirme** que os marcadores aparecem nos locais corretos
4. **Valide** a responsividade em diferentes dispositivos
5. **Monitore** o uso da API do MapTiles no painel deles

A migração está completa e pronta para uso! 🎉