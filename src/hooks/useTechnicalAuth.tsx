
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TechnicalAuthContextType {
  isAuthenticated: boolean;
  sessionToken: string | null;
  loading: boolean;
  signIn: (password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const TechnicalAuthContext = createContext<TechnicalAuthContextType | undefined>(undefined);

export function TechnicalAuthProvider({ children }: { children: React.ReactNode }) {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check if there's a saved session token in localStorage
    const savedToken = localStorage.getItem('technical_session_token');
    if (savedToken) {
      // For now, just validate if the token exists
      // In a real implementation, you'd validate against the database
      setSessionToken(savedToken);
    }
    setLoading(false);
  }, []);

  const signIn = async (password: string) => {
    try {
      // Updated password check
      if (password === 'Geinfra.setur2025') {
        const token = Math.random().toString(36).substring(7);
        setSessionToken(token);
        localStorage.setItem('technical_session_token', token);

        toast({
          title: 'Login realizado com sucesso',
          description: 'Bem-vindo à área técnica!',
        });

        return { error: null };
      } else {
        toast({
          title: 'Erro no login',
          description: 'Senha incorreta para área técnica',
          variant: 'destructive',
        });
        return { error: new Error('Invalid password') };
      }
    } catch (error: any) {
      toast({
        title: 'Erro no login',
        description: error.message || 'Erro interno do servidor',
        variant: 'destructive',
      });
      return { error };
    }
  };

  const signOut = async () => {
    setSessionToken(null);
    localStorage.removeItem('technical_session_token');
    
    toast({
      title: 'Logout realizado',
      description: 'Sessão técnica encerrada',
    });
  };

  const value = {
    isAuthenticated: !!sessionToken,
    sessionToken,
    loading,
    signIn,
    signOut,
  };

  return (
    <TechnicalAuthContext.Provider value={value}>
      {children}
    </TechnicalAuthContext.Provider>
  );
}

export function useTechnicalAuth() {
  const context = useContext(TechnicalAuthContext);
  if (context === undefined) {
    throw new Error('useTechnicalAuth must be used within a TechnicalAuthProvider');
  }
  return context;
}
