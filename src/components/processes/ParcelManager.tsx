import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/utils/processUtils";
import { Plus, Trash2 } from "lucide-react";

interface Parcel {
  id?: number;
  parcel_number: number;
  value: number;
  payment_date: string | null;
  process_id?: number;
}

interface ParcelManagerProps {
  processId?: number;
  onParcelChange?: (parcels: Parcel[]) => void;
  initialParcels?: Parcel[];
  isEdit?: boolean;
}

export function ParcelManager({ processId, onParcelChange, initialParcels = [], isEdit = false }: ParcelManagerProps) {
  const [parcels, setParcels] = useState<Parcel[]>(initialParcels);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (processId && isEdit) {
      loadParcels();
    } else if (!isEdit && parcels.length === 0) {
      // Se não está editando e não tem parcelas, criar uma parcela padrão
      const defaultParcel: Parcel = {
        parcel_number: 1,
        value: 0,
        payment_date: null,
      };
      setParcels([defaultParcel]);
    }
  }, [processId, isEdit]);

  useEffect(() => {
    if (onParcelChange) {
      onParcelChange(parcels);
    }
  }, [parcels, onParcelChange]);

  const loadParcels = async () => {
    if (!processId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('process_parcels')
        .select('*')
        .eq('process_id', processId)
        .order('parcel_number');

      if (error) throw error;
      
      const loadedParcels = data || [];
      
      // Se não há parcelas carregadas, criar uma parcela padrão
      if (loadedParcels.length === 0) {
        const defaultParcel: Parcel = {
          parcel_number: 1,
          value: 0,
          payment_date: null,
          process_id: processId,
        };
        setParcels([defaultParcel]);
      } else {
        setParcels(loadedParcels);
      }
    } catch (error) {
      console.error('Erro ao carregar parcelas:', error);
      toast({
        title: "Erro ao carregar parcelas",
        description: "Não foi possível carregar as parcelas do processo.",
        variant: "destructive",
      });
      // Em caso de erro, criar uma parcela padrão
      const defaultParcel: Parcel = {
        parcel_number: 1,
        value: 0,
        payment_date: null,
        process_id: processId,
      };
      setParcels([defaultParcel]);
    } finally {
      setLoading(false);
    }
  };

  const addParcel = async () => {
    const newParcel: Parcel = {
      parcel_number: parcels.length + 1,
      value: 0,
      payment_date: null,
    };

    // Se estamos editando um processo existente, salvar no banco imediatamente
    if (isEdit && processId) {
      try {
        const { data, error } = await supabase
          .from('process_parcels')
          .insert([{
            process_id: processId,
            parcel_number: newParcel.parcel_number,
            value: newParcel.value,
            payment_date: newParcel.payment_date,
          }])
          .select()
          .single();

        if (error) throw error;

        // Adicionar a parcela com o ID retornado do banco
        const savedParcel: Parcel = {
          id: data.id,
          parcel_number: data.parcel_number,
          value: data.value,
          payment_date: data.payment_date,
          process_id: data.process_id,
        };

        setParcels(prev => [...prev, savedParcel]);

        toast({
          title: "Parcela adicionada",
          description: `Parcela ${newParcel.parcel_number} foi adicionada com sucesso.`,
        });
      } catch (error) {
        console.error('Erro ao adicionar parcela:', error);
        toast({
          title: "Erro ao adicionar parcela",
          description: "Não foi possível adicionar a parcela ao banco de dados.",
          variant: "destructive",
        });
      }
    } else {
      // Se não está editando, apenas adiciona ao estado local
      setParcels(prev => [...prev, newParcel]);
    }
  };

  const removeParcel = async (index: number) => {
    setParcels(prev => {
      // Não permitir remoção se há apenas uma parcela
      if (prev.length <= 1) {
        toast({
          title: "Não é possível remover",
          description: "É necessário ter pelo menos uma parcela.",
          variant: "destructive",
        });
        return prev;
      }
      
      return prev;
    });

    // Se estamos editando um processo existente, deletar do banco também
    const parcelToRemove = parcels[index];
    if (isEdit && parcelToRemove.id && processId) {
      try {
        const { error } = await supabase
          .from('process_parcels')
          .delete()
          .eq('id', parcelToRemove.id);

        if (error) throw error;

        toast({
          title: "Parcela removida",
          description: `Parcela ${parcelToRemove.parcel_number} foi removida com sucesso.`,
        });
      } catch (error) {
        console.error('Erro ao remover parcela do banco:', error);
        toast({
          title: "Erro ao remover parcela",
          description: "Não foi possível remover a parcela do banco de dados.",
          variant: "destructive",
        });
        return; // Não remove do estado local se houve erro no banco
      }
    }

    // Remove do estado local e reajusta números
    setParcels(prev => {
      const newParcels = prev.filter((_, i) => i !== index);
      // Reajustar números das parcelas
      return newParcels.map((parcel, i) => ({
        ...parcel,
        parcel_number: i + 1
      }));
    });
  };

  const updateParcel = (index: number, field: keyof Parcel, value: any) => {
    setParcels(prev => prev.map((parcel, i) => 
      i === index ? { ...parcel, [field]: value } : parcel
    ));
  };

  const updatePaymentStatus = async (index: number, paid: boolean) => {
    const parcel = parcels[index];
    const newPaymentDate = paid ? new Date().toISOString().split('T')[0] : null;
    
    updateParcel(index, 'payment_date', newPaymentDate);

    // Se estamos editando um processo existente, atualizar no banco
    if (isEdit && parcel.id && processId) {
      try {
        const { error } = await supabase
          .from('process_parcels')
          .update({ payment_date: newPaymentDate })
          .eq('id', parcel.id);

        if (error) throw error;

        toast({
          title: paid ? "Parcela marcada como paga" : "Pagamento desmarcado",
          description: paid 
            ? `Parcela ${parcel.parcel_number} foi marcada como paga.`
            : `Pagamento da parcela ${parcel.parcel_number} foi desmarcado.`,
        });
      } catch (error) {
        console.error('Erro ao atualizar status de pagamento:', error);
        toast({
          title: "Erro ao atualizar pagamento",
          description: "Não foi possível atualizar o status de pagamento.",
          variant: "destructive",
        });
        // Reverter mudança em caso de erro
        updateParcel(index, 'payment_date', parcel.payment_date);
      }
    }
  };

  const updateParcelValue = async (index: number, value: number) => {
    const parcel = parcels[index];
    const previousValue = parcel.value;
    updateParcel(index, 'value', value);

    // Se estamos editando um processo existente E a parcela tem ID (já existe no banco), atualizar no banco
    if (isEdit && parcel.id && processId) {
      try {
        const { error } = await supabase
          .from('process_parcels')
          .update({ value })
          .eq('id', parcel.id);

        if (error) throw error;
      } catch (error) {
        console.error('Erro ao atualizar valor da parcela:', error);
        toast({
          title: "Erro ao atualizar valor",
          description: "Não foi possível atualizar o valor da parcela.",
          variant: "destructive",
        });
        // Reverter mudança em caso de erro
        updateParcel(index, 'value', previousValue);
      }
    }
  };

  // Calcular estatísticas
  const totalParcels = parcels.length;
  const paidParcels = parcels.filter(p => p.payment_date).length;
  const totalValue = parcels.reduce((sum, p) => sum + p.value, 0);
  const paidValue = parcels.filter(p => p.payment_date).reduce((sum, p) => sum + p.value, 0);
  const remainingValue = totalValue - paidValue;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando parcelas...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Gestão de Parcelas</span>
          <Button 
            type="button"
            onClick={addParcel} 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Adicionar Parcela
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Resumo das Parcelas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-sm text-gray-500">Progresso</div>
            <div className="font-medium">{paidParcels}/{totalParcels}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500">Valor Total</div>
            <div className="font-medium">{formatCurrency(totalValue)}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500">Valor Repassado</div>
            <div className="font-medium text-green-600">{formatCurrency(paidValue)}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500">Saldo a Repassar</div>
            <div className="font-medium text-orange-600">{formatCurrency(remainingValue)}</div>
          </div>
        </div>

        {/* Lista de Parcelas - SEM altura fixa para permitir scroll completo */}
        <div className="space-y-3">
          {parcels.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhuma parcela cadastrada</p>
              <Button 
                type="button"
                onClick={addParcel} 
                variant="outline" 
                className="mt-2"
              >
                Adicionar primeira parcela
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {parcels.map((parcel, index) => (
                <div 
                  key={`parcel-${parcel.id || index}`} 
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Linha 1: Checkbox e Label */}
                  <div className="flex items-center min-w-[140px] w-full sm:w-auto">
                    <Checkbox
                      checked={!!parcel.payment_date}
                      onCheckedChange={(checked) => updatePaymentStatus(index, !!checked)}
                      className="mr-3"
                    />
                    <Label className="text-sm font-medium cursor-pointer">
                      Parcela {parcel.parcel_number}
                    </Label>
                  </div>

                  {/* Linha 2: Valor da parcela */}
                  <div className="flex-1 w-full sm:min-w-[200px]">
                    <Label htmlFor={`value-${index}`} className="text-xs text-gray-500 block sm:sr-only mb-1">
                      Valor da parcela {parcel.parcel_number}
                    </Label>
                    <Input
                      id={`value-${index}`}
                      type="number"
                      step="0.01"
                      min="0"
                      value={parcel.value || ''}
                      onChange={(e) => updateParcelValue(index, Number(e.target.value) || 0)}
                      placeholder="Valor da parcela"
                      className="text-center font-medium w-full"
                    />
                  </div>

                  {/* Linha 3: Campo de data (SEMPRE visível quando marcado como pago) */}
                  {parcel.payment_date && (
                    <div className="w-full sm:w-40 flex-shrink-0">
                      <Label htmlFor={`date-${index}`} className="text-xs text-gray-500 block sm:sr-only mb-1">
                        Data de pagamento da parcela {parcel.parcel_number}
                      </Label>
                      <Input
                        id={`date-${index}`}
                        type="date"
                        value={parcel.payment_date}
                        onChange={(e) => updateParcel(index, 'payment_date', e.target.value)}
                        className="text-sm w-full"
                      />
                    </div>
                  )}

                  {/* Linha 4: Botão de remover - sempre visível, mas desabilitado se só há uma parcela */}
                  <div className="w-full sm:w-auto flex justify-end">
                    <Button
                      type="button"
                      onClick={() => removeParcel(index)}
                      variant="outline"
                      size="sm"
                      disabled={parcels.length <= 1}
                      className="text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={parcels.length <= 1 ? "Não é possível remover a única parcela" : "Remover parcela"}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}