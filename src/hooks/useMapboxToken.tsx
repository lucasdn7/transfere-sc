import { useState, useEffect } from 'react';

const DEFAULT_MAPBOX_TOKEN = 'process.env.VITE_MAPBOX_TOKEN';

export function useMapboxToken() {
  const [token, setToken] = useState<string | null>(null);
  const [isTokenSet, setIsTokenSet] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar se já existe um token salvo no localStorage
    try {
      const savedToken = localStorage.getItem('mapbox_public_token');
      if (savedToken && savedToken.trim() && savedToken.startsWith('pk.')) {
        setToken(savedToken.trim());
        setIsTokenSet(true);
      } else {
        // Fallback para o token padrão fornecido
        setToken(DEFAULT_MAPBOX_TOKEN);
        setIsTokenSet(true);
      }
    } catch (error) {
      console.error('Erro ao carregar token do localStorage:', error);
      // Fallback para o token padrão
      setToken(DEFAULT_MAPBOX_TOKEN);
      setIsTokenSet(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveToken = (newToken: string): boolean => {
    try {
      const trimmedToken = newToken.trim();
      
      if (!trimmedToken) {
        console.error('Token vazio');
        return false;
      }

      if (!trimmedToken.startsWith('pk.')) {
        console.error('Token deve começar com "pk."');
        return false;
      }

      localStorage.setItem('mapbox_public_token', trimmedToken);
      setToken(trimmedToken);
      setIsTokenSet(true);
      console.log('Token salvo com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao salvar token:', error);
      return false;
    }
  };

  const clearToken = () => {
    try {
      localStorage.removeItem('mapbox_public_token');
      setToken(null);
      setIsTokenSet(false);
      console.log('Token removido com sucesso');
    } catch (error) {
      console.error('Erro ao remover token:', error);
    }
  };

  const validateToken = (tokenToValidate: string): boolean => {
    const trimmed = tokenToValidate.trim();
    return trimmed.length > 0 && trimmed.startsWith('pk.');
  };

  return {
    token,
    isTokenSet,
    isLoading,
    saveToken,
    clearToken,
    validateToken,
  };
}
