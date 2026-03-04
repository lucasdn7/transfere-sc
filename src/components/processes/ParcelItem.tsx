
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";

interface Parcel {
  id?: number;
  parcel_number: number;
  value: number;
  payment_date: string | null;
  process_id: number;
}

interface ParcelItemProps {
  parcel: Parcel;
  onParcelUpdated: () => void;
}

export function ParcelItem({ parcel, onParcelUpdated }: ParcelItemProps) {
  const [editingValue, setEditingValue] = useState(false);
  const { toast } = useToast();

  async function updateParcelPayment(paid: boolean, date?: string) {
    try {
      const paymentDate = paid ? (date || format(new Date(), 'yyyy-MM-dd')) : null;
      const { error } = await supabase
        .from('process_parcels')
        .update({ payment_date: paymentDate })
        .eq('id', parcel.id);
      
      if (error) throw error;
      onParcelUpdated();
      
      toast({
        title: paid ? "Parcela marcada como paga" : "Pagamento removido",
        description: `Parcela ${parcel.parcel_number} atualizada com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao atualizar pagamento:', error);
      toast({
        title: "Erro ao atualizar pagamento",
        description: "Não foi possível atualizar o status de pagamento.",
        variant: "destructive",
      });
    }
  }

  async function updateParcelValue(newValue: number) {
    if (newValue <= 0) {
      toast({
        title: "Valor inválido",
        description: "O valor da parcela deve ser maior que zero.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('process_parcels')
        .update({ value: newValue })
        .eq('id', parcel.id);
      
      if (error) throw error;
      onParcelUpdated();
      
      toast({
        title: "Valor atualizado",
        description: "Valor da parcela atualizado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao atualizar valor:', error);
      toast({
        title: "Erro ao atualizar valor",
        description: "Não foi possível atualizar o valor da parcela.",
        variant: "destructive",
      });
    }
  }

  async function deleteParcel() {
    try {
      const { error } = await supabase
        .from('process_parcels')
        .delete()
        .eq('id', parcel.id);
      
      if (error) throw error;
      onParcelUpdated();
      
      toast({
        title: "Parcela removida",
        description: "Parcela removida com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao remover parcela:', error);
      toast({
        title: "Erro ao remover parcela",
        description: "Não foi possível remover a parcela.",
        variant: "destructive",
      });
    }
  }

  return (
    <div 
      className={`flex items-center gap-4 border rounded-lg p-4 transition-all ${
        parcel.payment_date 
          ? 'bg-green-50 border-green-200' 
          : 'bg-white border-gray-200'
      }`}
    >
      {/* Checkbox para marcar como pago */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id={`paid-${parcel.id}`}
          checked={!!parcel.payment_date}
          onCheckedChange={(checked) => updateParcelPayment(!!checked)}
        />
        <Label htmlFor={`paid-${parcel.id}`} className="text-sm cursor-pointer whitespace-nowrap">
          Parcela {parcel.parcel_number}
        </Label>
      </div>
      
      {/* Valor da parcela (editável) */}
      <div className="flex-1">
        {editingValue ? (
          <Input
            type="number"
            step="0.01"
            min={0.01}
            defaultValue={parcel.value}
            className="w-40"
            onBlur={(e) => {
              const newValue = Number(e.target.value);
              if (newValue !== parcel.value && newValue > 0) {
                updateParcelValue(newValue);
              }
              setEditingValue(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              }
            }}
            autoFocus
          />
        ) : (
          <div 
            className="font-mono cursor-pointer hover:bg-gray-100 px-3 py-2 rounded border text-center w-40"
            onClick={() => setEditingValue(true)}
            title="Clique para editar o valor"
          >
            R$ {parcel.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        )}
      </div>
      
      {/* Campo de data (só aparece quando pago) */}
      {parcel.payment_date && (
        <div className="space-y-1">
          <Label htmlFor={`date-${parcel.id}`} className="text-xs text-gray-600">
            Data do Pagamento
          </Label>
          <Input
            id={`date-${parcel.id}`}
            type="date"
            value={parcel.payment_date}
            onChange={e => updateParcelPayment(true, e.target.value)}
            className="w-40"
          />
        </div>
      )}
      
      {/* Status visual */}
      <div className="flex items-center">
        {parcel.payment_date ? (
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
            Pago
          </span>
        ) : (
          <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
            Pendente
          </span>
        )}
      </div>
      
      {/* Botão de remover */}
      <Button
        variant="ghost"
        size="sm"
        onClick={deleteParcel}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
