
import React from 'react';
import { useAuth } from '@/hooks/useAuth';

interface TechnicalAuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function TechnicalAuthGuard({ children, fallback }: TechnicalAuthGuardProps) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso restrito</h1>
          <p className="text-gray-600">Esta área é exclusiva para a equipe técnica. Faça login para acessar as funcionalidades administrativas.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
