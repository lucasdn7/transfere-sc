# Correções Implementadas para o Mapa

## Problemas Identificados

### 1. Erro 406 (Not Acceptable) na API user_roles
**Problema**: A aplicação estava tentando consultar uma tabela `user_roles` que não existe no banco de dados.
**Causa**: O hook `useAuth` estava fazendo uma query para `user_roles` com join para `roles`, mas essas tabelas não foram criadas nas migrações.

**Solução**: 
- Alterado o hook `useAuth.tsx` para consultar a tabela `profiles` que realmente existe
- A query agora busca diretamente o campo `role` da tabela `profiles`
- Removido o join desnecessário que estava causando o erro 406

### 2. Timeout do Mapa (15 segundos)
**Problema**: O mapa estava configurado com timeout muito baixo (15 segundos), causando erros prematuros.
**Causa**: Conexões lentas ou carregamento inicial do Mapbox GL JS podem demorar mais que 15 segundos.

**Solução**:
- Aumentado timeout de 15 para 30 segundos
- Adicionado verificação de conectividade de rede
- Implementado sistema de retry com botão "Tentar Novamente"
- Melhorado feedback visual com contador de tentativas

## Melhorias Implementadas

### 1. Tratamento de Erros Aprimorado
- Mensagens de erro mais específicas baseadas no tipo de erro
- Diferenciação entre erro de token, rede, estilo do mapa, etc.
- Verificação de conectividade de rede (`navigator.onLine`)

### 2. Validação de Token Melhorada
- Verificação se o token começa com "pk."
- Validação de comprimento mínimo do token (50 caracteres)
- Mensagens mais claras sobre problemas no token

### 3. Sistema de Retry
- Botão "Tentar Novamente" na tela de erro
- Contador de tentativas visível ao usuário
- Indicador de "conexão lenta" após múltiplas tentativas

### 4. Otimizações de Performance
- Configurações otimizadas do Mapbox GL JS:
  - `maxTileCacheSize: 50` - reduz uso de memória
  - `preserveDrawingBuffer: false` - melhora performance
  - `refreshExpiredTiles: true` - recarrega tiles automaticamente

### 5. Melhor Feedback Visual
- Loading indicator mostra número da tentativa
- Aviso de "conexão lenta" após múltiplas tentativas
- Mensagens mais informativas durante o carregamento

## Arquivos Modificados

1. **`src/hooks/useAuth.tsx`**
   - Linha 40-50: Alterada query de `user_roles` para `profiles`

2. **`src/components/map/InteractiveMap.tsx`**
   - Linha 219: Aumentado timeout de 15s para 30s
   - Linha 202-216: Melhorado tratamento de erros
   - Linha 40-50: Adicionado validação de token
   - Linha 67-72: Otimizações de performance do Mapbox
   - Adicionado sistema de retry e contador de tentativas

## Resultado Esperado

- Eliminação do erro 406 na API
- Redução significativa dos timeouts do mapa
- Melhor experiência do usuário com feedback claro
- Possibilidade de retry sem recarregar a página
- Diagnóstico mais preciso de problemas de conectividade

## Testes Recomendados

1. Verificar se o mapa carrega sem erros 406
2. Testar carregamento em conexões lentas
3. Verificar funcionamento do botão "Tentar Novamente"
4. Testar com token inválido para verificar mensagens de erro
5. Testar sem conexão de internet