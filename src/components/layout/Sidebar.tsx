
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Home, 
  BarChart3, 
  FileText, 
  Building, 
  MapPin, 
  Map, 
  Settings, 
  Calendar,
  Clock,
  BookOpen,
  Star
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const sidebarItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Processos", href: "/processes", icon: FileText },
  { name: "Timeline", href: "/process-timeline", icon: Clock },
  { name: "Calendário", href: "/process-calendar", icon: Calendar },
  { name: "Municípios", href: "/municipalities", icon: Building },
  { name: "Núcleos Regionais", href: "/regional-nuclei", icon: MapPin },
  { name: "Documentação", href: "/documents", icon: BookOpen },
  { name: "Mapa", href: "/map", icon: Map },
  { name: "Relatórios", href: "/reports", icon: BarChart3 },
  { name: "Configurações", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const { userRole } = useAuth();

  return (
    <div className="flex h-full flex-col border-r bg-muted/10">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <MapPin className="h-6 w-6" />
          <span>GEINFRA</span>
        </Link>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2 p-4 lg:p-6">
          {sidebarItems.map((item) => (
            <Button
              key={item.name}
              variant={location.pathname === item.href ? "secondary" : "ghost"}
              className="justify-start"
              asChild
            >
              <Link to={item.href}>
                <item.icon className="mr-2 h-4 w-4" />
                {item.name}
              </Link>
            </Button>
          ))}
          
          {/* Item Favoritos - visível apenas para área técnica */}
          {userRole === "technical" && (
            <Button
              variant={location.pathname === "/favorites" ? "secondary" : "ghost"}
              className="justify-start"
              asChild
            >
              <Link to="/favorites">
                <Star className="mr-2 h-4 w-4" />
                Favoritos
              </Link>
            </Button>
          )}
          
          <Separator className="my-4" />
          
          <Button variant="ghost" className="justify-start" asChild>
            <Link to="/app-settings">
              <Settings className="mr-2 h-4 w-4" />
              Config. Aplicação
            </Link>
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
}
