import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, MapPin, Phone, Mail, Users, ChevronLeft, ChevronRight } from "lucide-react";

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

export function MunicipalityList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const debouncedSearchTerm = useDebouncedValue(searchTerm, 400);

  const { data: municipalities, isLoading, error } = useQuery({
    queryKey: ['municipalities', debouncedSearchTerm, page],
    queryFn: async () => {
      let query = supabase
        .from('municipalities')
        .select(`
          *,
          regional_nuclei (name, acronym),
          regioes (nome)
        `, { count: 'exact' })
        .order('name', { ascending: true })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (debouncedSearchTerm) {
        query = query.ilike('name', `%${debouncedSearchTerm}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { data, count: count || 0 };
    },
  });

  const total = municipalities?.count || 0;
  const totalPages = Math.ceil(total / pageSize);

  const formatPopulation = (population: number) => {
    return new Intl.NumberFormat('pt-BR').format(population);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Erro ao carregar municípios: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Municípios</h1>
          <p className="text-gray-600">Gerenciar municípios de Santa Catarina</p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Buscar município..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Municipalities Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Municípios ({municipalities?.count || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Município</TableHead>
                  <TableHead>Região</TableHead>
                  <TableHead>Núcleo Regional</TableHead>
                  <TableHead>População</TableHead>
                  <TableHead>Prefeito</TableHead>
                  <TableHead>Contato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {municipalities?.data?.map((municipality) => (
                  <TableRow key={municipality.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{municipality.name}</div>
                        <div className="text-xs text-gray-500">
                          CNPJ: {municipality.cnpj}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{municipality.regioes?.nome || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {municipality.regional_nuclei ? (
                        <Badge variant="outline">
                          {municipality.regional_nuclei.acronym}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>
                          {municipality.population ? 
                            formatPopulation(municipality.population) : 
                            'N/A'
                          }
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {municipality.mayor_name && (
                          <div className="font-medium">{municipality.mayor_name}</div>
                        )}
                        {municipality.secretary_name && (
                          <div className="text-xs text-gray-500">
                            Sec.: {municipality.secretary_name}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {municipality.phone && (
                          <div className="flex items-center space-x-1 text-xs">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span>{municipality.phone}</span>
                          </div>
                        )}
                        {municipality.email && (
                          <div className="flex items-center space-x-1 text-xs">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <span>{municipality.email}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {municipalities?.data?.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhum município encontrado
            </div>
          )}
          <div className="flex justify-between items-center py-4">
            <span className="text-sm text-gray-600">
              Página {page} de {totalPages} ({total} municípios)
            </span>
            <div className="flex gap-2">
              <button
                className="p-2 rounded disabled:opacity-50 border"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                className="p-2 rounded disabled:opacity-50 border"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                aria-label="Próxima página"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
