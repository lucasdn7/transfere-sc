
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AddParcelFormProps {
  processId: number;
  existingParcelsCount: number;
  onParcelAdded: () => void;
}

export function AddParcelForm({ processId, existingParcelsCount, onParcelAdded }: AddParcelFormProps) {
  const [newParcels, setNewParcels] = useState<{ count: number; value: number }>({ count: 1, value: 0 });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function addParcels() {
    if (newParcels.value <= 0) {
      toast({
        title: "Valor inválido",
        description: "O valor da parcela deve ser maior que zero.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const inserts = Array.from({ length: newParcels.count }).map((_, i) => ({
        parcel_number: existingParcelsCount + i + 1,
        value: newParcels.value,
        process_id: processId,
        payment_date: null,
      }));
      
      const { error } = await supabase.from('process_parcels').insert(inserts);
      if (error) throw error;
      
      setNewParcels({ count: 1, value: 0 });
      onParcelAdded();
      
      toast({
        title: "Parcelas adicionadas",
        description: `${newParcels.count} parcela(s) adicionada(s) com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao adicionar parcelas:', error);
      toast({
        title: "Erro ao adicionar parcelas",
        description: "Não foi possível adicionar as parcelas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="font-medium text-gray-900 mb-3">Adicionar Parcelas</h3>
      <div className="flex gap-3 items-end">
        <div className="space-y-2">
          <Label htmlFor="parcel-count">Quantidade</Label>
          <Input
            id="parcel-count"
            type="number"
            min={1}
            value={newParcels.count}
            onChange={e => setNewParcels(p => ({ ...p, count: Number(e.target.value) }))}
            className="w-24"
          />
        </div>
        <div className="space-y-2 flex-1">
          <Label htmlFor="parcel-value">Valor por Parcela (R$)</Label>
          <Input
            id="parcel-value"
            type="number"
            min={0}
            step="0.01"
            value={newParcels.value}
            onChange={e => setNewParcels(p => ({ ...p, value: Number(e.target.value) }))}
            placeholder="0,00"
          />
        </div>
        <Button 
          type="button"
          onClick={addParcels} 
          disabled={loading || newParcels.value <= 0}
          className="mb-0"
        >
          Adicionar
        </Button>
      </div>
    </div>
  );
}
