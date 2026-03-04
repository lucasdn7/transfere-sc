
import { useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { TopHeader } from "./TopHeader";
import { useTheme } from "@/hooks/useTheme";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { layoutPosition } = useTheme();

  const handleMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleSidebarClose = () => {
    setIsMobileMenuOpen(false);
  };

  if (layoutPosition === 'top') {
    return (
      <div className="min-h-screen bg-background">
        <TopHeader />
        <main className="pt-28">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuToggle={handleMenuToggle} isMobileMenuOpen={isMobileMenuOpen} />
      
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleSidebarClose}></div>
          <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
            <Sidebar />
          </div>
        </div>
      )}
      
      {/* Desktop Sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col md:pt-16">
        <Sidebar />
      </div>
      
      <main className="md:pl-64 pt-16">
        <div className="container mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
