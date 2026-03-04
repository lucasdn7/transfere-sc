import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, BarChart3, Download, Eye } from 'lucide-react';

interface ReportCardProps {
  title: string;
  description: string;
  type: 'dashboard' | 'financial' | 'process' | 'municipality';
  status: 'available' | 'processing' | 'scheduled';
  lastGenerated?: string;
  onGenerate: () => void;
  onView?: () => void;
  onDownloadPDF?: () => void;
  onDownloadExcel?: () => void;
  onDownloadCSV?: () => void;
}

export function ReportCard({ 
  title, 
  description, 
  type, 
  status, 
  lastGenerated, 
  onGenerate, 
  onView, 
  onDownloadPDF, 
  onDownloadExcel, 
  onDownloadCSV
}: ReportCardProps) {
  const getTypeIcon = () => {
    switch (type) {
      case 'dashboard':
        return <BarChart3 className="h-5 w-5" />;
      case 'financial':
        return <FileText className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'available':
        return <Badge variant="default" className="bg-green-100 text-green-800">Disponível</Badge>;
      case 'processing':
        return <Badge variant="secondary">Processando</Badge>;
      case 'scheduled':
        return <Badge variant="outline">Agendado</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <CardTitle className="text-lg flex items-center gap-2">
              {getTypeIcon()}
              {title}
            </CardTitle>
            {getStatusBadge()}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">{description}</p>
        
        {lastGenerated && (
          <div className="text-xs text-gray-500">
            Última geração: {new Date(lastGenerated).toLocaleString('pt-BR')}
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          {onView && status === 'available' && (
            <Button 
              onClick={onView}
              className="flex-1"
              variant="outline"
            >
              <Eye className="h-4 w-4 mr-2" />
              Visualizar
            </Button>
          )}
          <Button 
            onClick={onGenerate}
            className="flex-1"
            disabled={status === 'processing'}
          >
            <Download className="h-4 w-4 mr-2" />
            {status === 'processing' ? 'Processando...' : 'Gerar'}
          </Button>
          {status === 'available' && (
            <>
              {onDownloadPDF && (
                <Button onClick={onDownloadPDF} variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />PDF
                </Button>
              )}
              {onDownloadExcel && (
                <Button onClick={onDownloadExcel} variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />Excel
                </Button>
              )}
              {onDownloadCSV && (
                <Button onClick={onDownloadCSV} variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />CSV
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
