# Funcionalidade: Status dos Processos no Dashboard

## Descrição

Foi implementada uma nova funcionalidade no dashboard que exibe a quantidade de processos em cada status definido na tabela `status_processos` do Supabase.

## Localização

A funcionalidade está posicionada no dashboard principal, logo abaixo do card "Status das Transferências" e acima dos gráficos personalizáveis.

## Características

### Layout Horizontal
- Os status são exibidos em cards horizontais que podem ser rolados lateralmente
- Cada card mostra:
  - Indicador colorido baseado na cor definida no status
  - Nome do status (truncado se muito longo)
  - Número de processos nesse status
  - Texto explicativo (processo/processos)

### Modal de Detalhes
- Ao clicar em qualquer card de status, abre-se um modal com:
  - Lista de todos os processos naquele status
  - Informações de cada processo:
    - Número do processo
    - Objeto/descrição
    - Município responsável
    - Botão de link externo (quando disponível)

### Informações Adicionais
- Total geral de processos na parte inferior
- Atualização automática a cada minuto
- Interface responsiva e otimizada

## Estrutura Técnica

### Componentes Criados
1. **ProcessStatusOverview.tsx** - Componente principal
2. **useProcessStatusCount.tsx** - Hook para buscar dados

### Integração com Supabase
- Busca dados da tabela `status_processos`
- Relaciona com a tabela `processes` através do campo `status_id`
- Inclui informações dos municípios relacionados

### Estados e Loading
- Loading states durante carregamento
- Tratamento de estados vazios
- Interface adaptativa para diferentes cenários

## Configuração

A funcionalidade utiliza as configurações existentes do Supabase e não requer configuração adicional. Os status são gerenciados através da tabela `status_processos` que contém:

- `id` - Identificador único
- `nome` - Nome do status
- `cor` - Cor para identificação visual
- `ordem` - Ordem de exibição
- `ativo` - Se o status está ativo ou não

## Benefícios

1. **Visão Rápida**: Permite visualizar rapidamente a distribuição dos processos
2. **Acesso Direto**: Links externos diretos para a plataforma do governo
3. **Organização**: Interface organizada e intuitiva
4. **Responsividade**: Funciona bem em diferentes tamanhos de tela
5. **Performance**: Otimizado com cache e atualizações inteligentes