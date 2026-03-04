
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ExternalLink, MapPin, Calendar, DollarSign, X, Save, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/utils/processUtils";
import { useNavigate } from "react-router-dom";
import { useProcessParcels } from "@/hooks/useProcessParcels";
import { formatCurrencyBR } from "@/utils/parcelUtils";
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ProcessDetailModalProps {
  process: any;
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  objeto: string;
  valor_licitado: string;
  data_vigencia: string;
  status: string;
  observacoes: string;
}

export function ProcessDetailModal({ process, isOpen, onClose }: ProcessDetailModalProps) {
  const navigate = useNavigate();
  const processId = process?.id ?? 0;
  const { summary } = useProcessParcels(processId);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    objeto: process?.object || '',
    valor_licitado: process?.licitado_value?.toString() || '',
    data_vigencia: process?.vigencia_date || '',
    status: process?.status || '',
    observacoes: process?.observations || ''
  });
  const [isSaving, setIsSaving] = useState(false);

  if (!process) return null;

  // Função segura para acessar campos do processo
  const safe = (fn: () => any, fallback: any = 'N/A') => {
    try {
      const v = fn();
      return v !== undefined && v !== null && v !== '' ? v : fallback;
    } catch {
      return fallback;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'finalizado':
        return 'bg-green-500';
      case 'em andamento':
      case 'aprovado':
        return 'bg-yellow-500';
      case 'em análise':
        return 'bg-blue-500';
      case 'cancelado':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const addToGoogleCalendar = () => {
    const startDate = new Date(process.vigencia_date);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 1);
    
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(process.process_number)}&dates=${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=${encodeURIComponent(process.object)}&location=${encodeURIComponent(process.municipalities?.name || '')}`;
    
    window.open(googleUrl, '_blank');
  };

  const openSGPE = () => {
    if (process?.link_sgpe) {
      window.open(process.link_sgpe, '_blank', 'noopener,noreferrer');
    } else {
      toast.error('Link do SGPE não cadastrado para este processo');
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const errors: string[] = [];
    
    if (!formData.objeto.trim()) {
      errors.push('Objeto é obrigatório');
    }
    
    if (!formData.valor_licitado || parseFloat(formData.valor_licitado) <= 0) {
      errors.push('Valor licitado deve ser maior que 0');
    }
    
    if (!formData.data_vigencia) {
      errors.push('Data de vigência é obrigatória');
    } else {
      const vigDate = new Date(formData.data_vigencia);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (process?.status !== 'Finalizado' && vigDate < today) {
        errors.push('Data de vigência não pode ser anterior à data atual para processos não finalizados');
      }
    }
    
    if (!formData.status) {
      errors.push('Status é obrigatório');
    }
    
    return errors;
  };

  const handleSave = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('processes')
        .update({
          object: formData.objeto,
          licitado_value: parseFloat(formData.valor_licitado),
          vigencia_date: formData.data_vigencia,
          status: formData.status,
          observations: formData.observacoes,
          updated_at: new Date().toISOString()
        })
        .eq('id', processId);

      if (error) {
        throw error;
      }

      toast.success('Alterações salvas com sucesso');
      setIsEditing(false);
      // Recarregar dados do processo
      window.location.reload();
    } catch (error) {
      console.error('Erro ao salvar processo:', error);
      toast.error('Erro ao salvar alterações');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Restaurar valores originais
    setFormData({
      objeto: process?.object || '',
      valor_licitado: process?.licitado_value?.toString() || '',
      data_vigencia: process?.vigencia_date || '',
      status: process?.status || '',
      observacoes: process?.observations || ''
    });
    setIsEditing(false);
  };

  const handleViewProcess = () => {
    navigate('/processes');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="flex items-center gap-3">
            <Calendar className="h-5 w-5" />
            <div>
              <div>Detalhes do Processo</div>
              <div className="text-sm font-normal text-gray-500">
                {safe(() => process.process_number)}
              </div>
            </div>
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={`${getStatusColor(safe(() => process.status_processos?.nome, ''))} text-white border-0`}
            >
              {safe(() => process.status_processos?.nome, 'Não definido')}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={openSGPE}
              className="flex items-center gap-2"
              disabled={!process?.link_sgpe}
            >
              <ExternalLink className="h-4 w-4" />
              SGPE
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Campos Editáveis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Número do Processo (readonly) */}
            <div className="space-y-2">
              <Label htmlFor="process_number">Número do Processo</Label>
              <Input
                id="process_number"
                value={safe(() => process.process_number)}
                disabled
                className="bg-gray-50"
              />
            </div>

            {/* Município (readonly) */}
            <div className="space-y-2">
              <Label htmlFor="municipio">Município</Label>
              <Input
                id="municipio"
                value={safe(() => process.municipalities?.name)}
                disabled
                className="bg-gray-50"
              />
            </div>

            {/* Objeto (editável) */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="objeto">
                Objeto {isEditing && <span className="text-red-500">*</span>}
              </Label>
              {isEditing ? (
                <Textarea
                  id="objeto"
                  value={formData.objeto}
                  onChange={(e) => handleInputChange('objeto', e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              ) : (
                <div className="p-3 border rounded-md bg-gray-50 min-h-[80px]">
                  {safe(() => process.object)}
                </div>
              )}
            </div>

            {/* Valor Licitado (editável) */}
            <div className="space-y-2">
              <Label htmlFor="valor_licitado">
                Valor Licitado {isEditing && <span className="text-red-500">*</span>}
              </Label>
              {isEditing ? (
                <Input
                  id="valor_licitado"
                  type="number"
                  step="0.01"
                  value={formData.valor_licitado}
                  onChange={(e) => handleInputChange('valor_licitado', e.target.value)}
                />
              ) : (
                <Input
                  value={formatCurrency(safe(() => process.licitado_value, 0))}
                  disabled
                  className="bg-gray-50"
                />
              )}
            </div>

            {/* Data de Vigência (editável) */}
            <div className="space-y-2">
              <Label htmlFor="data_vigencia">
                Data de Vigência {isEditing && <span className="text-red-500">*</span>}
              </Label>
              {isEditing ? (
                <Input
                  id="data_vigencia"
                  type="date"
                  value={formData.data_vigencia}
                  onChange={(e) => handleInputChange('data_vigencia', e.target.value)}
                />
              ) : (
                <Input
                  value={new Date(safe(() => process.vigencia_date, new Date())).toLocaleDateString('pt-BR')}
                  disabled
                  className="bg-gray-50"
                />
              )}
            </div>

            {/* Status (editável) */}
            <div className="space-y-2">
              <Label htmlFor="status">
                Status {isEditing && <span className="text-red-500">*</span>}
              </Label>
              {isEditing ? (
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Em análise">Em análise</SelectItem>
                    <SelectItem value="Aprovado">Aprovado</SelectItem>
                    <SelectItem value="Em andamento">Em andamento</SelectItem>
                    <SelectItem value="Contrato Assinado">Contrato Assinado</SelectItem>
                    <SelectItem value="Em pagamento">Em pagamento</SelectItem>
                    <SelectItem value="Termo de Aditivo">Termo de Aditivo</SelectItem>
                    <SelectItem value="Em prestação de contas">Em prestação de contas</SelectItem>
                    <SelectItem value="Finalizado">Finalizado</SelectItem>
                    <SelectItem value="Cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={safe(() => process.status_processos?.nome, 'Não definido')}
                  disabled
                  className="bg-gray-50"
                />
              )}
            </div>

            {/* Observações (editável) */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="observacoes">Observações</Label>
              {isEditing ? (
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              ) : (
                <div className="p-3 border rounded-md bg-gray-50 min-h-[100px]">
                  {safe(() => process.observations) || 'Nenhuma observação'}
                </div>
              )}
            </div>
          </div>

          {/* Informações Adicionais (readonly) */}
          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4">Informações Adicionais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <span className="font-medium">Núcleo Regional:</span>
                  <p className="text-sm text-gray-600">{safe(() => process.regional_nuclei?.name)}</p>
                </div>
                <div>
                  <span className="font-medium">Endereço:</span>
                  <p className="text-sm text-gray-600">{safe(() => process.address) || 'Não informado'}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <span className="font-medium">Valores:</span>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Valor Total:</span>
                      <span className="font-bold text-green-600">{formatCurrency(safe(() => process.total_portaria_value, 0))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Valor Concedente:</span>
                      <span>{formatCurrency(safe(() => process.total_concedente_value, 0))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Valor Proponente:</span>
                      <span>{formatCurrency(safe(() => process.total_proponente_value, 0))}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Resumo das Parcelas */}
          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4">Resumo das Parcelas</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-700 font-medium">Parcelas Pagas</div>
                <div className="text-2xl font-bold text-blue-600">{summary.progressText}</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-green-700 font-medium">Valor Repassado</div>
                <div className="text-2xl font-bold text-green-600">{formatCurrencyBR(summary.paidValue)}</div>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="text-sm text-orange-700 font-medium">Saldo a Repassar</div>
                <div className="text-2xl font-bold text-orange-600">{formatCurrencyBR(summary.remainingValue)}</div>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex justify-between items-center border-t pt-6">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleViewProcess}
              >
                Ver Processo Completo
              </Button>
              <Button 
                variant="outline" 
                onClick={addToGoogleCalendar}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Google Calendar
              </Button>
            </div>
            
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  Editar Processo
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
