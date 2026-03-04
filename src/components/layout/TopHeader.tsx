
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { useAuth } from '@/hooks/useAuth';
import { LogIn, LogOut, User, Shield, Menu, X, Home, FileText, Building, MapPin, BarChart3, Settings } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const publicNavItems = [
  { to: "/", icon: Home, label: "Dashboard" },
  { to: "/map", icon: MapPin, label: "Mapa" },
  { to: "/reports", icon: BarChart3, label: "Relatórios" },
];

const technicalNavItems = [
  { to: "/processes", icon: FileText, label: "Processos" },
  { to: "/municipalities", icon: Building, label: "Municípios" },
  { to: "/regional-nuclei", icon: MapPin, label: "Núcleos Regionais" },
];

export function TopHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleAuthAction = () => {
    if (isAuthenticated) {
      signOut();
    } else {
      navigate('/technical-auth');
    }
  };

  const getNavItems = () => {
    let items = [...publicNavItems];
    
    if (isAuthenticated) {
      items = [...items, ...technicalNavItems];
    }
    
    return items;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      {/* Main Header */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Transfer Radar SC</h1>
              <p className="text-xs text-gray-600">Sistema de Transferências Financeiras</p>
            </div>
          </Link>

          <div className="flex items-center space-x-4">
            {isAuthenticated && <NotificationCenter />}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            <div className="hidden md:flex items-center space-x-2">
              {isAuthenticated && (
                <div className="flex items-center space-x-2 mr-4">
                  <User className="h-4 w-4 text-gray-600" />
                  <Badge className="bg-blue-100 text-blue-800">
                    Área Técnica
                  </Badge>
                </div>
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
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="border-t border-gray-200 bg-gray-50">
        <div className="px-6">
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-1">
            {getNavItems().map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors border-b-2",
                  location.pathname === item.to
                    ? "border-blue-600 text-blue-700 bg-blue-50"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            ))}
            
            <Link
              to="/app-settings"
              className={cn(
                "flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors border-b-2",
                location.pathname === "/app-settings"
                  ? "border-blue-600 text-blue-700 bg-blue-50"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              <Settings className="h-4 w-4" />
              <span>Configurações</span>
            </Link>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-2 space-y-1">
              {getNavItems().map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
                    location.pathname === item.to
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
              
              <Link
                to="/app-settings"
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
                  location.pathname === "/app-settings"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                )}
              >
                <Settings className="h-4 w-4" />
                <span>Configurações</span>
              </Link>

              {/* Mobile Auth */}
              <div className="pt-2 border-t border-gray-200 mt-2">
                {isAuthenticated && (
                  <div className="flex items-center space-x-2 px-4 py-2 text-sm">
                    <User className="h-4 w-4 text-gray-600" />
                    <Badge className="bg-blue-100 text-blue-800">
                      Área Técnica
                    </Badge>
                  </div>
                )}
                
                <Button
                  variant={isAuthenticated ? "outline" : "default"}
                  size="sm"
                  onClick={handleAuthAction}
                  className="w-full mx-4 mt-2 flex items-center justify-center space-x-2"
                >
                  {isAuthenticated ? (
                    <>
                      <LogOut className="h-4 w-4" />
                      <span>Sair da Área Técnica</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4" />
                      <span>Acessar Área Técnica</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
