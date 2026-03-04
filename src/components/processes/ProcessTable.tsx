import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Download, Clock, MapPin, Calendar, ExternalLink, Star } from "lucide-react";
import { formatCurrency } from "@/utils/processUtils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";

interface ProcessTableProps {
  processes: any[];
}

export function ProcessTable({ processes }: ProcessTableProps) {
  const { user, userRole } = useAuth();
  const { isFavorite, addToFavorites, removeFromFavorites } = useFavorites();

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'finalizado':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'em andamento':
      case 'aprovado':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'em análise':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelado':
      case 'rejeitado':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDaysUntilDeadline = (date: string) => {
    const deadline = new Date(date);
    const today = new Date();
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleFavoriteToggle = async (processId: number) => {
    if (!user || userRole !== "technical") return;
    
    if (isFavorite(processId)) {
      await removeFromFavorites.mutateAsync(processId);
    } else {
      await addToFavorites.mutateAsync(processId);
    }
  };

  if (processes.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Clock className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum processo encontrado
          </h3>
          <p className="text-gray-600">
            Tente ajustar os filtros de busca para encontrar processos.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Processos Encontrados ({processes.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Processo</TableHead>
                <TableHead>Município</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vigência</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processes.map((process) => {
                const daysLeft = getDaysUntilDeadline(process.vigencia_date);
                const isUrgent = daysLeft <= 30 && daysLeft >= 0;
                const isExpired = daysLeft < 0;
                const isProcessFavorite = isFavorite(process.id);

                return (
                  <TableRow key={process.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div>
                        <div className="font-medium">{process.process_number}</div>
                        <div className="text-sm text-gray-600 max-w-xs truncate">
                          {process.object}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{process.municipalities?.name || 'N/A'}</span>
                      </div>
                      {process.regional_nuclei && (
                        <div className="text-xs text-gray-500 mt-1">
                          {process.regional_nuclei.acronym}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={getStatusColor(process.status_processos?.nome || '')}
                      >
                        {process.status_processos?.nome || 'Não definido'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-green-600">
                        {formatCurrency(process.total_portaria_value)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="text-sm">
                            {format(new Date(process.vigencia_date), "dd/MM/yyyy", { locale: ptBR })}
                          </div>
                          <div className={`text-xs ${
                            isExpired ? 'text-red-600' : 
                            isUrgent ? 'text-yellow-600' : 
                            'text-gray-500'
                          }`}>
                            {isExpired 
                              ? `Vencido há ${Math.abs(daysLeft)} dias`
                              : `${daysLeft} dias restantes`
                            }
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {userRole === "technical" && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleFavoriteToggle(process.id)}
                            className={`${
                              isProcessFavorite 
                                ? 'text-yellow-500 hover:text-yellow-600' 
                                : 'text-gray-400 hover:text-yellow-500'
                            }`}
                            title={isProcessFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                          >
                            <Star className={`h-4 w-4 ${isProcessFavorite ? 'fill-current' : ''}`} />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/process-timeline?process=${process.id}`}>
                            <Clock className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {process.link_plataforma_governo && (
                          <Button variant="ghost" size="sm" asChild title="Acessar Plataforma do Governo">
                            <a href={process.link_plataforma_governo} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
