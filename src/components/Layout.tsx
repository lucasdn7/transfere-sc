
import { useState } from "react";
import { Search, Menu, X, FileText, MapPin, Building, Users, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '#', icon: FileText, current: true },
    { name: 'Processos', href: '#', icon: FileText, current: false },
    { name: 'Municípios', href: '#', icon: Building, current: false },
    { name: 'Núcleos Regionais', href: '#', icon: MapPin, current: false },
    { name: 'Documentos', href: '#', icon: FileText, current: false },
    { name: 'Relatórios', href: '#', icon: Users, current: false },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-blue-900">SC Transfer Radar</h1>
                <p className="text-xs text-gray-600">Transferências Financeiras - SC</p>
              </div>
            </div>
            
            <div className="hidden md:block">
              <div className="ml-4 flex items-center space-x-4">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                  <Input
                    className="pl-10 w-64"
                    placeholder="Buscar processos, municípios..."
                  />
                </div>
                <Button variant="outline" size="sm">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Alertas
                </Button>
              </div>
            </div>

            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:block w-64 bg-white shadow-sm min-h-screen`}>
          <div className="p-4">
            <div className="space-y-1">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className={`${
                    item.current
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } group flex items-center px-3 py-2 text-sm font-medium rounded-l-md transition-colors`}
                >
                  <item.icon
                    className={`${
                      item.current ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                    } mr-3 h-5 w-5`}
                  />
                  {item.name}
                </a>
              ))}
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
