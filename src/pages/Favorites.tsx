import { useState } from "react";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Calendar, DollarSign, ChevronDown, ChevronUp } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Navigate } from "react-router-dom";

export default function Favorites() {
  const { user, userRole } = useAuth();
  const {
    favorites,
    technicalNotes,
    isLoadingFavorites,
    removeFromFavorites,
    saveTechnicalNote,
    getTechnicalNote,
  } = useFavorites();

  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [notes, setNotes] = useState<Record<number, string>>({});

  // Verificar se o usuário tem permissão para acessar esta página
  if (!user || userRole !== "technical") {
    return <Navigate to="/" replace />;
  }

  const toggleCardExpansion = (processId: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(processId)) {
      newExpanded.delete(processId);
    } else {
      newExpanded.add(processId);
    }
    setExpandedCards(newExpanded);
  };

  const handleNoteChange = (processId: number, value: string) => {
    setNotes(prev => ({ ...prev, [processId]: value }));
  };

  const handleSaveNote = async (processId: number) => {
    const noteText = notes[processId] || '';
    await saveTechnicalNote.mutateAsync({ processId, notes: noteText });
  };

  const handleRemoveFavorite = async (processId: number) => {
    await removeFromFavorites.mutateAsync(processId);
  };

  if (isLoadingFavorites) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando favoritos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Favoritos
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Processos marcados como favoritos para acompanhamento técnico
        </p>
      </div>

      {favorites && favorites.length === 0 ? (
        <div className="text-center py-12">
          <Star className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Nenhum favorito encontrado
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Marque processos como favoritos na página de Processos para vê-los aqui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites?.map((favorite) => {
            const process = favorite.processes;
            const isExpanded = expandedCards.has(process.id);
            const currentNote = notes[process.id] ?? getTechnicalNote(process.id);

            return (
              <Card key={process.id} className="relative hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                        {process.process_number}
                      </CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {process.object}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFavorite(process.id)}
                      className="text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950"
                    >
                      <Star className="h-5 w-5 fill-current" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Informações principais */}
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span className="truncate">
                        {process.municipalities?.name || "Município não informado"}
                      </span>
                    </div>

                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <DollarSign className="h-4 w-4 mr-2" />
                      <span>
                        {formatCurrency(process.total_concedente_value)}
                      </span>
                    </div>

                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>
                        Vigência: {formatDate(process.vigencia_date)}
                      </span>
                    </div>

                    {process.status_processos && (
                      <Badge
                        variant="secondary"
                        className="w-fit"
                        style={{
                          backgroundColor: process.status_processos.cor || undefined,
                          color: process.status_processos.cor ? 'white' : undefined,
                        }}
                      >
                        {process.status_processos.nome}
                      </Badge>
                    )}
                  </div>

                  {/* Botão expandir/recolher */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleCardExpansion(process.id)}
                    className="w-full"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-2" />
                        Recolher detalhes
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-2" />
                        Ver detalhes
                      </>
                    )}
                  </Button>

                  {/* Conteúdo expandido */}
                  {isExpanded && (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          Detalhes do Processo
                        </h4>
                        <div className="text-sm space-y-1">
                          <p><strong>Objeto:</strong> {process.object}</p>
                          <p><strong>Valor Proponente:</strong> {formatCurrency(process.total_proponente_value)}</p>
                          {process.regional_nuclei?.name && (
                            <p><strong>Núcleo Regional:</strong> {process.regional_nuclei.name}</p>
                          )}
                        </div>
                      </div>

                      {/* Área de Observações */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          Observações da Área Técnica
                        </h4>
                        <Textarea
                          placeholder="Adicione suas observações técnicas aqui..."
                          value={currentNote}
                          onChange={(e) => handleNoteChange(process.id, e.target.value)}
                          className="min-h-[100px] resize-none"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSaveNote(process.id)}
                          disabled={saveTechnicalNote.isPending}
                          className="w-full"
                        >
                          {saveTechnicalNote.isPending ? "Salvando..." : "Salvar Observação"}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
} 