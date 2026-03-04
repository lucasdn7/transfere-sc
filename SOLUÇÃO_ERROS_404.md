# Solução para Erros 404 e Avisos de Depreciação

## Problema Identificado

Os erros que você está vendo no console são causados por **cache do navegador** que está tentando carregar arquivos de uma versão de **produção anterior** da aplicação. Os arquivos com hash (como `index-dw2BlYvA.js`) são gerados apenas durante o build de produção, mas não existem no ambiente de desenvolvimento.

## Erros Específicos

### 1. Erros 404 (Failed to load resource)
```
Failed to load resource: yonisrknsnsrigmprcvk.85b7-aa38d0faef0d:1
the server responded with a status of 404 ()
```

**Causa**: Cache do navegador tentando carregar arquivos JavaScript com hash de uma versão de produção anterior.

### 2. Aviso de Depreciação
```
[Deprecation] -ms-high-contrast is in the process of being deprecated. 
Please see <URL> for tips on updating to the new Forced Colors Mode standard.
```

**Causa**: Bibliotecas CSS (provavelmente do Mapbox GL JS) usando prefixos CSS antigos do Internet Explorer.

## Soluções Implementadas

### 1. Configuração Aprimorada do Vite
- ✅ Desabilitado overlay de erros HMR
- ✅ Configurado sistema de arquivos menos restritivo
- ✅ Otimizado build com sourcemaps
- ✅ Excluído `lucide-react` das otimizações automáticas

### 2. Script de Limpeza de Cache
- ✅ Criado `clear-cache.cjs` para limpar caches do Vite
- ✅ Removido cache do node_modules/.vite

### 3. Melhorias no Componente do Mapa
- ✅ Timeout aumentado de 15s para 30s
- ✅ Melhor tratamento de erros específicos
- ✅ Validação aprimorada de token do Mapbox
- ✅ Sistema de retry implementado

## Como Resolver Completamente

### Passo 1: Limpar Cache do Servidor
```bash
# Execute o script de limpeza
node clear-cache.cjs

# Reinicie o servidor
npm run dev
```

### Passo 2: Limpar Cache do Navegador
**Opção A - Recarregamento Forçado:**
- **Chrome/Edge**: `Ctrl + Shift + R` (Windows/Linux) ou `Cmd + Shift + R` (Mac)
- **Firefox**: `Ctrl + F5` (Windows/Linux) ou `Cmd + Shift + R` (Mac)

**Opção B - Ferramentas do Desenvolvedor:**
1. Abra as Ferramentas do Desenvolvedor (`F12`)
2. Clique com botão direito no ícone de atualizar
3. Selecione **"Esvaziar cache e recarregar forçadamente"**

**Opção C - Limpar Cache Manualmente:**
1. Abra as Ferramentas do Desenvolvedor (`F12`)
2. Vá para a aba **Application** (Chrome) ou **Storage** (Firefox)
3. Clique em **Clear Storage** ou **Clear All**
4. Recarregue a página

### Passo 3: Verificar Configuração
Certifique-se de que está acessando a aplicação na **porta correta**:
- ✅ **Desenvolvimento**: `http://localhost:8080`
- ❌ **Não usar**: `http://localhost:5173` (porta padrão do Vite)

## Prevenção Futura

### 1. Headers de Cache
O Vite já está configurado para evitar cache em desenvolvimento, mas se o problema persistir, você pode:

```javascript
// vite.config.ts - já implementado
server: {
  hmr: {
    overlay: false
  },
  fs: {
    strict: false
  }
}
```

### 2. Modo Incógnito
Para testes, sempre use uma **janela incógnita/privada** que não mantém cache entre sessões.

### 3. Verificação de Porta
Sempre verifique se está acessando a porta correta:
```bash
# Verificar se o servidor está rodando
ps aux | grep vite

# Testar a aplicação
curl http://localhost:8080
```

## Status Atual

- ✅ Servidor rodando corretamente na porta 8080
- ✅ Cache do Vite limpo
- ✅ Configurações otimizadas
- ✅ Script de limpeza criado
- ⏳ **Aguardando**: Limpeza do cache do navegador pelo usuário

## Próximos Passos

1. **Limpe o cache do navegador** usando uma das opções acima
2. **Acesse** `http://localhost:8080` (não 5173)
3. **Verifique** se os erros 404 desapareceram
4. **Teste** a funcionalidade do mapa

Se os erros persistirem após essas etapas, pode ser necessário verificar se há algum service worker ou cache adicional interferindo.