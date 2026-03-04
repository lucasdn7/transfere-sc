import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Plus, Users, ChevronLeft, ChevronRight, List, LayoutGrid, Edit, Mail, Phone } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RegionalNucleusForm } from "@/components/forms/RegionalNucleusForm";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { RegionalNucleusCard } from "@/components/regional-nuclei/RegionalNucleusCard";
import { useRegionalNuclei, useNucleiStats } from "@/hooks/useRegionalNuclei";
import { Link } from "react-router-dom";
import { toast } from 'sonner';

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

export default function RegionalNuclei() {
  const { isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNucleus, setEditingNucleus] = useState<any>(null);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');

  const debouncedSearchTerm = useDebouncedValue(searchTerm, 400);

  const { data: regionalNuclei, isLoading, error, refetch } = useRegionalNuclei(debouncedSearchTerm, page, pageSize);
  const { data: nucleiStats } = useNucleiStats();

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingNucleus(null);
    refetch();
    toast.success('Núcleo Regional salvo com sucesso!');
  };
  
  const handleEdit = (nucleus: any) => {
    setEditingNucleus(nucleus);
    setIsFormOpen(true);
  };

  const handleContactClick = (email: string, phone: string) => {
    if (email) {
      window.location.href = `mailto:${email}`;
    } else if (phone) {
      window.location.href = `tel:${phone}`;
    } else {
      toast.info('Contato não disponível');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const total = regionalNuclei?.count || 0;
  const totalPages = Math.ceil(total / pageSize);

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
        <p className="text-red-600">Erro ao carregar núcleos regionais: {error.message}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="page-section space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Início</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Núcleos Regionais</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Núcleos Regionais</h1>
          <p className="text-gray-600">
            Gerenciar núcleos regionais de Santa Catarina ({regionalNuclei?.count || 0} encontrados)
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Última atualização: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
          </p>
        </div>
        {isAuthenticated && (
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingNucleus(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Núcleo Regional
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>
                  {editingNucleus ? 'Editar Núcleo Regional' : 'Novo Núcleo Regional'}
                </DialogTitle>
              </DialogHeader>
              <RegionalNucleusForm
                onSuccess={handleFormSuccess}
                onCancel={() => {
                  setIsFormOpen(false);
                  setEditingNucleus(null);
                }}
                initialData={editingNucleus}
                isEdit={!!editingNucleus}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="bg-white border-gray-200 shadow-sm">
        <CardContent className="p-6 bg-white">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Buscar núcleo regional..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 mb-2">
        <Button variant={viewMode === 'cards' ? 'default' : 'outline'} onClick={() => setViewMode('cards')}><LayoutGrid className="h-4 w-4 mr-1" /> Cards</Button>
        <Button variant={viewMode === 'list' ? 'default' : 'outline'} onClick={() => setViewMode('list')}><List className="h-4 w-4 mr-1" /> Lista</Button>
      </div>
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {regionalNuclei?.data?.map((nucleus) => (
            <RegionalNucleusCard
              key={nucleus.id}
              nucleus={nucleus}
              stats={nucleiStats?.[nucleus.id]}
              isAuthenticated={isAuthenticated}
              onEdit={handleEdit}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white border-gray-200">
            <thead>
              <tr>
                <th className="border px-2 py-1 bg-gray-50">Nome</th>
                <th className="border px-2 py-1 bg-gray-50">Sigla</th>
                <th className="border px-2 py-1 bg-gray-50">Região</th>
                <th className="border px-2 py-1 bg-gray-50">Responsável Técnico</th>
                <th className="border px-2 py-1 bg-gray-50">Telefone</th>
                <th className="border px-2 py-1 bg-gray-50">E-mail</th>
                <th className="border px-2 py-1 bg-gray-50">Contato Alternativo</th>
                <th className="border px-2 py-1 bg-gray-50">Ações</th>
              </tr>
            </thead>
            <tbody>
              {regionalNuclei?.data && regionalNuclei.data.length > 0 ? (
                regionalNuclei.data.map((n: any) => (
                  <tr key={n.id}>
                    <td className="border px-2 py-1">{n.name}</td>
                    <td className="border px-2 py-1">{n.acronym}</td>
                    <td className="border px-2 py-1">{n.region_id}</td>
                    <td className="border px-2 py-1">{n.technical_responsible_name}</td>
                    <td className="border px-2 py-1">
                      {n.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span 
                            onClick={() => handleContactClick(n.email, n.phone)}
                            className="text-blue-600 hover:text-blue-800 cursor-pointer"
                          >
                            {n.phone}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="border px-2 py-1">
                      {n.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <span 
                            onClick={() => handleContactClick(n.email, n.phone)}
                            className="text-blue-600 hover:text-blue-800 cursor-pointer"
                          >
                            {n.email}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="border px-2 py-1">
                      {n.contato_alternativo && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <span 
                            onClick={() => handleContactClick(n.contato_alternativo, n.phone)}
                            className="text-blue-600 hover:text-blue-800 cursor-pointer"
                          >
                            {n.contato_alternativo}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="border px-2 py-1">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/municipalities?nucleus=${n.id}`} title="Ver Municípios">
                            Ver Municípios
                          </Link>
                        </Button>
                        {isAuthenticated && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingNucleus(n)}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-8 border px-2 py-1">Nenhum núcleo regional disponível</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {regionalNuclei?.data?.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'Nenhum núcleo regional encontrado' : 'Nenhum núcleo regional cadastrado'}
          </h3>
          <p className="text-gray-600">
            {searchTerm 
              ? 'Tente alterar os termos de busca.' 
              : 'Não há núcleos regionais cadastrados no sistema.'
            }
          </p>
          {isAuthenticated && !searchTerm && (
            <Button className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Primeiro Núcleo Regional
            </Button>
          )}
        </div>
      )}

      {/* Informações Adicionais */}
      <Card className="bg-blue-50 border-l-4 border-blue-500">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="text-blue-500 mt-0.5">
              <Mail className="h-5 w-5" />
            </div>
            <div className="text-sm text-blue-800">
              <strong>Contato Alternativo:</strong> Para adicionar um contato alternativo, edite o campo "contato_alternativo" na tabela de núcleos regionais. Este campo será exibido no card do núcleo e nos detalhes do processo. Os emails e telefones são clicáveis para facilitar o contato.
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center py-4">
        <span className="text-sm text-gray-600">
          Página {page} de {totalPages} ({total} núcleos)
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
    </div>
  );
}
