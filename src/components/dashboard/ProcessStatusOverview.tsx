import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExternalLink, FileText } from "lucide-react";
import { useProcessStatusCount, ProcessStatusCount } from "@/hooks/useProcessStatusCount";

interface ProcessStatusModalProps {
  status: ProcessStatusCount;
  isOpen: boolean;
  onClose: () => void;
}

function ProcessStatusModal({ status, isOpen, onClose }: ProcessStatusModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: status.cor || '#6b7280' }}
            />
            {status.nome} ({status.count} processos)
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          {status.processes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum processo encontrado com este status</p>
            </div>
          ) : (
            <div className="space-y-3">
              {status.processes.map((process) => (
                <div 
                  key={process.id} 
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-sm text-gray-900">
                          {process.process_number}
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          {process.municipality.name}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 overflow-hidden" style={{ 
                        display: '-webkit-box', 
                        WebkitLineClamp: 2, 
                        WebkitBoxOrient: 'vertical' 
                      }}>
                        {process.object}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      {process.link_plataforma_governo ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-3"
                          onClick={() => window.open(process.link_plataforma_governo!, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          <span className="text-xs">Ver</span>
                        </Button>
                      ) : (
                        <div className="text-xs text-gray-400 italic px-3 py-1">
                          Link não disponível
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ProcessStatusOverview() {
  const { data: statusCounts, isLoading } = useProcessStatusCount();
  const [selectedStatus, setSelectedStatus] = useState<ProcessStatusCount | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Status dos Processos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="flex gap-2 overflow-x-auto">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 w-32 bg-gray-200 rounded-lg flex-shrink-0"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!statusCounts || statusCounts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Status dos Processos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum status encontrado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Status dos Processos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {statusCounts.map((status) => (
              <Button
                key={status.id}
                variant="outline"
                className="h-auto p-4 flex-shrink-0 hover:shadow-md transition-all"
                onClick={() => setSelectedStatus(status)}
              >
                <div className="text-center min-w-[120px]">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: status.cor || '#6b7280' }}
                    />
                    <span className="font-medium text-sm truncate max-w-[80px]" title={status.nome}>
                      {status.nome}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {status.count}
                  </div>
                  <div className="text-xs text-gray-500">
                    {status.count === 1 ? 'processo' : 'processos'}
                  </div>
                </div>
              </Button>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Total de processos:</span>
              <span className="font-semibold text-gray-900">
                {statusCounts.reduce((total, status) => total + status.count, 0)}
              </span>
            </div>
            <div className="mt-2 text-center text-xs text-gray-500">
              Clique em um status para ver os processos correspondentes
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedStatus && (
        <ProcessStatusModal
          status={selectedStatus}
          isOpen={!!selectedStatus}
          onClose={() => setSelectedStatus(null)}
        />
      )}
    </>
  );
}