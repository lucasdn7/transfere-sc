
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function ProcessHeader() {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Processos</h1>
        <p className="text-gray-600">Gerenciar processos de transferência</p>
      </div>
      <Button>
        <Download className="h-4 w-4 mr-2" />
        Exportar
      </Button>
    </div>
  );
}
