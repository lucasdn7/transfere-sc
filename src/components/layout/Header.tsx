
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { useAuth } from '@/hooks/useAuth';
import { LogIn, LogOut, User, Shield, Menu, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { TestGoogleSheetsButton } from "./TestGoogleSheetsButton";

interface HeaderProps {
  onMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
}

export function Header({ onMenuToggle, isMobileMenuOpen }: HeaderProps) {
  const { isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();

  const handleAuthAction = () => {
    if (isAuthenticated) {
      signOut();
    } else {
      navigate('/technical-auth');
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {onMenuToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuToggle}
              className="md:hidden"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          )}
          
          <Link to="/" className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Transfer Radar SC</h1>
              <p className="text-xs text-gray-600">Sistema de Transferências Financeiras</p>
            </div>
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          {isAuthenticated && (
            <>
              <NotificationCenter />
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-600" />
                <Badge className="bg-blue-100 text-blue-800">
                  Área Técnica
                </Badge>
              </div>
              <TestGoogleSheetsButton />
            </>
          )}

          <Button
            variant={isAuthenticated ? "outline" : "default"}
            size="sm"
            onClick={handleAuthAction}
            className="flex items-center space-x-2"
          >
            {isAuthenticated ? (
              <>
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                <span>Área Técnica</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
