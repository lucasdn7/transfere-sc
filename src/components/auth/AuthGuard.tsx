
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

interface AuthGuardProps {
  children: React.ReactNode;
  requireRole?: 'viewer' | 'technical' | 'admin';
}

export function AuthGuard({ children, requireRole = 'viewer' }: AuthGuardProps) {
  const { isAuthenticated, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Check role permissions
  const hasPermission = () => {
    if (!userRole) return false;
    
    switch (requireRole) {
      case 'admin':
        return userRole === 'admin';
      case 'technical':
        return userRole === 'technical' || userRole === 'admin';
      case 'viewer':
        return ['viewer', 'technical', 'admin'].includes(userRole);
      default:
        return false;
    }
  };

  if (!hasPermission()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
          <p className="text-gray-600">Você não tem permissão para acessar esta área.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
