import React, { useState, Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { DocumentUploadForm } from '@/components/forms/DocumentUploadForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { DocumentCard } from '@/components/documents/DocumentCard';
import { DocumentPreviewModal } from '@/components/documents/DocumentPreviewModal';
import { useDocuments, useDocumentCategories } from '@/hooks/useDocuments';
import { supabase } from '@/integrations/supabase/client';
import { FileText } from 'lucide-react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { List, LayoutGrid, Eye, Download, Trash2 } from 'lucide-react';

class ErrorBoundary extends Component<{ children: ReactNode, fallback: (error: Error) => ReactNode }, { error: Error | null }> {
  constructor(props: any) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return this.props.fallback(this.state.error);
    }
    return this.props.children;
  }
}

function ErrorFallback(error: Error) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Documentação</h1>
        <p className="text-red-600">Erro inesperado: {error.message}</p>
        <p className="text-muted-foreground">Tente recarregar a página ou entre em contato com o suporte.</p>
      </div>
    </div>
  );
}

export default function Documents() {
  const { isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewDocument, setPreviewDocument] = useState<any>(null);
  const [editDocument, setEditDocument] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');

  const debouncedSearchTerm = useDebouncedValue(searchTerm, 400);
  const { data: documents, isLoading, error, refetch } = useDocuments(debouncedSearchTerm, selectedCategory);
  const { data: categories } = useDocumentCategories();

  const handleDownload = (document: any) => {
    const supabaseUrl = "https://yonisrknsnsrigmgrcvk.supabase.co";
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/documents/${document.file_path}`;
    const a = window.document.createElement('a');
    a.href = publicUrl;
    a.download = document.file_name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePreview = (document: any) => {
    setPreviewDocument(document);
  };

  const handleDelete = async (document: any) => {
    if (!window.confirm('Tem certeza que deseja excluir este documento? Esta ação não pode ser desfeita.')) return;
    const { error } = await supabase.from('documents').delete().eq('id', document.id);
    if (error) {
      alert('Erro ao excluir documento: ' + error.message);
    } else {
      refetch();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documentação</h1>
          <p className="text-muted-foreground">Carregando documentos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documentação</h1>
          <p className="text-red-600">Erro ao carregar documentos: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <React.Suspense fallback={<div>Carregando...</div>}>
      <ErrorBoundary fallback={ErrorFallback}>
        <div className="space-y-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Início</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Documentação</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex justify-between items-center mb-2">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Documentação</h1>
              <p className="text-muted-foreground">
                Central de documentos e recursos do sistema
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Última atualização: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
              </p>
            </div>
            <div className="flex gap-2 items-center">
              <Button variant={viewMode === 'list' ? 'default' : 'outline'} onClick={() => setViewMode('list')}><List className="h-4 w-4 mr-1" /> Lista</Button>
              <Button variant={viewMode === 'cards' ? 'default' : 'outline'} onClick={() => setViewMode('cards')}><LayoutGrid className="h-4 w-4 mr-1" /> Cards</Button>
              {isAuthenticated && (
                <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Upload Documento
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Upload de Documento</DialogTitle>
                    </DialogHeader>
                    <DocumentUploadForm 
                      onSuccess={() => {
                        setIsUploadOpen(false);
                        refetch();
                      }}
                      onCancel={() => setIsUploadOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {/* Barra de busca textual */}
          <div className="flex gap-4 mb-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Buscar documentos..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded w-full"
              />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/></svg>
              </span>
            </div>
          </div>

          {/* Abas de categoria */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <TabsList>
              <TabsTrigger value="all">Todos</TabsTrigger>
              {categories && categories.length > 0 && categories.map((cat: any) => (
                <TabsTrigger key={cat.id} value={cat.id.toString()}>{cat.name}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Listagem de documentos */}
          {viewMode === 'list' ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border px-2 py-1 bg-gray-100">Nome</th>
                    <th className="border px-2 py-1 bg-gray-100">Categoria</th>
                    <th className="border px-2 py-1 bg-gray-100">Descrição</th>
                    <th className="border px-2 py-1 bg-gray-100">Inserido em</th>
                    <th className="border px-2 py-1 bg-gray-100">Tipo</th>
                    <th className="border px-2 py-1 bg-gray-100">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {documents && documents.length > 0 ? (
                    documents.map((document) => (
                      <tr key={document.id}>
                        <td className="flex items-center gap-2 border px-2 py-1">
                          {document.title}
                          {!document.is_public && <span title="Restrito" className="ml-1 text-blue-400"><svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l2.09 6.26L20 9.27l-5 3.64L16.18 21 12 17.27 7.82 21 9 12.91l-5-3.64 5.91-.01z"/></svg></span>}
                        </td>
                        <td className="border px-2 py-1">{document.document_categories?.name || document.category_name || 'Sem categoria'}</td>
                        <td className="border px-2 py-1">{document.description}</td>
                        <td className="border px-2 py-1">{document.created_at ? new Date(document.created_at).toLocaleDateString('pt-BR') : '-'}</td>
                        <td className="border px-2 py-1"><FileTypeTag fileName={document.file_name} /></td>
                        <td className="flex gap-2 border px-2 py-1">
                          <Button size="sm" variant="outline" onClick={() => handlePreview(document)}><Eye className="h-4 w-4" /></Button>
                          <a
                            href={`https://yonisrknsnsrigmgrcvk.supabase.co/storage/v1/object/public/documents/${document.file_path}`}
                            download={document.file_name}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
                            style={{ minWidth: 32 }}
                          >
                            <Download className="h-4 w-4" />
                          </a>
                          <Button size="sm" variant="outline" onClick={() => handleDelete(document)} title="Excluir">
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                          {isAuthenticated && <Button size="sm" variant="outline" onClick={() => setEditDocument(document)}>Editar</Button>}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-8 border px-2 py-1">Nenhum documento disponível ainda</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {documents && documents.length > 0 ? (
                documents.map((document) => (
                  <DocumentCard
                    key={document.id}
                    document={document}
                    onPreview={handlePreview}
                    onDownload={handleDownload}
                    onEdit={setEditDocument}
                    onDelete={handleDelete}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12 flex flex-col items-center justify-center">
                  <FileText className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhum documento disponível ainda
                  </h3>
                  <p className="text-gray-600 max-w-md">
                    Quando houver documentos cadastrados pela área técnica, eles aparecerão aqui para leitura e download público. Utilize o botão acima para inserir um novo documento (apenas área técnica).
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Preview Modal funcional */}
          <DocumentPreviewModal
            document={previewDocument}
            isOpen={!!previewDocument}
            onClose={() => setPreviewDocument(null)}
            onDownload={handleDownload}
            previewType={previewDocument ? getPreviewType(previewDocument.file_name) : undefined}
          />

          {/* Modal de edição de documento */}
          <Dialog open={!!editDocument} onOpenChange={v => { if (!v) setEditDocument(null); }}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Editar Documento</DialogTitle>
              </DialogHeader>
              {editDocument && (
                <DocumentUploadForm
                  onSuccess={() => {
                    setEditDocument(null);
                    refetch();
                  }}
                  onCancel={() => setEditDocument(null)}
                  document={editDocument}
                  isEditMode={true}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </ErrorBoundary>
    </React.Suspense>
  );
}

// Função utilitária para tag de tipo de arquivo
function FileTypeTag({ fileName }: { fileName: string }) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  let color = 'bg-gray-300 text-gray-800';
  let label = ext;
  if (['pdf'].includes(ext)) { color = 'bg-red-500 text-white'; label = 'PDF'; }
  if (['xls', 'xlsx'].includes(ext)) { color = 'bg-green-600 text-white'; label = 'Excel'; }
  if (['doc', 'docx'].includes(ext)) { color = 'bg-blue-600 text-white'; label = 'Word'; }
  if (['ppt', 'pptx'].includes(ext)) { color = 'bg-orange-500 text-white'; label = 'PPT'; }
  if (['jpg', 'jpeg', 'png'].includes(ext)) { color = 'bg-purple-500 text-white'; label = ext.toUpperCase(); }
  return <span className={`px-2 py-1 rounded text-xs font-bold ${color}`}>{label}</span>;
}

// Função utilitária para preview
function getPreviewType(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (['pdf'].includes(ext)) return 'pdf';
  if (['jpg', 'jpeg', 'png'].includes(ext)) return 'image';
  if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) return 'gdocs';
  return 'other';
}
