import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { ThemeProvider } from "./components/providers/ThemeProvider";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Processes from "./pages/Processes";
import ProcessTimeline from "./pages/ProcessTimeline";
import ProcessCalendar from "./pages/ProcessCalendar";
import Municipalities from "./pages/Municipalities";
import RegionalNuclei from "./pages/RegionalNuclei";
import Documents from "./pages/Documents";
import Map from "./pages/Map";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import AppSettings from "./pages/AppSettings";
import Auth from "./pages/Auth";
import TechnicalAuth from "./pages/TechnicalAuth";
import Favorites from "./pages/Favorites";
import NotFound from "./pages/NotFound";
import { Component, ReactNode } from "react";
import { AuthProvider } from "@/hooks/useAuth";

const queryClient = new QueryClient();

class GlobalErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: { componentStack: string }) {
    // Logar erro para monitoramento
    console.error("Erro global capturado:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Erro inesperado</h1>
            <p className="text-xl text-gray-600 mb-4">Ocorreu um erro inesperado. Tente recarregar a página.</p>
            <button onClick={() => window.location.reload()} className="text-blue-500 hover:text-blue-700 underline">Recarregar</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const App = () => (
  <GlobalErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppLayout>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/processes" element={<Processes />} />
                  <Route path="/process-timeline" element={<ProcessTimeline />} />
                  <Route path="/process-calendar" element={<ProcessCalendar />} />
                  <Route path="/municipalities" element={<Municipalities />} />
                  <Route path="/regional-nuclei" element={<RegionalNuclei />} />
                  <Route path="/documents" element={<Documents />} />
                  <Route path="/map" element={<Map />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/app-settings" element={<AppSettings />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/technical-auth" element={<TechnicalAuth />} />
                  <Route path="/favorites" element={<Favorites />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AppLayout>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  </GlobalErrorBoundary>
);

export default App;
