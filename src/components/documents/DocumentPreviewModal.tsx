
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";

interface DocumentPreviewModalProps {
  document: any;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (document: any) => void;
  previewType?: 'pdf' | 'image' | 'gdocs' | 'other';
}

export function DocumentPreviewModal({ document, isOpen, onClose, onDownload, previewType }: DocumentPreviewModalProps) {
  if (!document) return null;

  // Montar URL pública do arquivo
  // Supondo que o bucket seja 'documents' e o caminho está em document.file_path
  const supabaseUrl = "https://yonisrknsnsrigmgrcvk.supabase.co";
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/documents/${document.file_path}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{document.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            {document.description}
          </div>
          <div className="bg-gray-100 p-4 rounded-lg text-center min-h-[300px] flex flex-col items-center justify-center">
            {previewType === 'pdf' && (
              <iframe
                src={publicUrl}
                title="Preview PDF"
                className="w-full h-[60vh] border rounded"
                style={{ minHeight: 400 }}
              />
            )}
            {previewType === 'image' && (
              <img
                src={publicUrl}
                alt={document.title}
                className="max-h-[60vh] mx-auto rounded shadow"
                style={{ maxWidth: '100%' }}
              />
            )}
            {previewType === 'gdocs' && (
              <iframe
                src={`https://docs.google.com/gview?url=${encodeURIComponent(publicUrl)}&embedded=true`}
                title="Preview Google Docs"
                className="w-full h-[60vh] border rounded"
                style={{ minHeight: 400 }}
              />
            )}
            {(!previewType || previewType === 'other') && (
              <>
                <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">
                  Preview não disponível para este tipo de arquivo
                </p>
              </>
            )}
            <a
              href={publicUrl}
              download={document.file_name}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-4 py-2 mt-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar Documento
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
