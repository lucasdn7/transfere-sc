
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, Download, Eye, Trash2 } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

interface DocumentCardProps {
  document: any;
  onPreview: (document: any) => void;
  onDownload: (document: any) => void;
  onEdit?: (document: any) => void;
  onDelete?: (document: any) => void;
}

export function DocumentCard({ document, onPreview, onDownload, onEdit, onDelete }: DocumentCardProps) {
  const isRecentDocument = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };
  const categoria = document.document_categories?.name || document.category_name || 'Sem categoria';
  const ultimaMod = document.updated_at || document.created_at;
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>{document.title}</span>
                  </TooltipTrigger>
                  <TooltipContent>{document.file_name || document.title}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {isRecentDocument(document.created_at) && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Novo
                </Badge>
              )}
            </CardTitle>
            <Badge variant="secondary">
              {categoria}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {document.description && (
          <p className="text-sm text-gray-600">{document.description}</p>
        )}
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            <span>Inserido em: {document.created_at ? new Date(document.created_at).toLocaleDateString('pt-BR') : '-'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            <span>Última modificação: {ultimaMod ? new Date(ultimaMod).toLocaleDateString('pt-BR') : '-'}</span>
          </div>
          {document.page_count && (
            <div>Páginas: {document.page_count}</div>
          )}
          {document.file_size && (
            <div>Tamanho: {(document.file_size / 1024).toFixed(1)} KB</div>
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => onPreview(document)}
            className="flex-1"
            variant="outline"
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <a
            href={`https://yonisrknsnsrigmgrcvk.supabase.co/storage/v1/object/public/documents/${document.file_path}`}
            download={document.file_name}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center px-4 py-2 font-bold bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Baixar
          </a>
          {onDelete && (
            <Button
              onClick={() => {
                if (window.confirm('Tem certeza que deseja excluir este documento? Esta ação não pode ser desfeita.')) onDelete(document);
              }}
              className="flex-1 font-bold"
              variant="outline"
              title="Excluir"
            >
              <Trash2 className="h-4 w-4 text-red-600 mr-2" />
              Excluir
            </Button>
          )}
          {onEdit && (
            <Button 
              onClick={() => onEdit(document)}
              className="flex-1 font-bold"
              variant="outline"
            >
              Editar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
