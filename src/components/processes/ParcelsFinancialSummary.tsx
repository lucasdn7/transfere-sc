
interface Parcel {
  id?: number;
  parcel_number: number;
  value: number;
  payment_date: string | null;
  process_id: number;
}

interface ParcelsFinancialSummaryProps {
  parcels: Parcel[];
}

export function ParcelsFinancialSummary({ parcels }: ParcelsFinancialSummaryProps) {
  const totalValue = parcels.reduce((sum, parcel) => sum + parcel.value, 0);
  const paidValue = parcels
    .filter(parcel => parcel.payment_date)
    .reduce((sum, parcel) => sum + parcel.value, 0);
  const remainingValue = totalValue - paidValue;
  const paidCount = parcels.filter(p => p.payment_date).length;

  if (parcels.length === 0) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h3 className="font-medium text-blue-900 mb-3">Resumo Financeiro</h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-blue-700">Total de parcelas:</span>
          <span className="font-medium ml-2">{parcels.length}</span>
        </div>
        <div>
          <span className="text-blue-700">Parcelas pagas:</span>
          <span className="font-medium ml-2">{paidCount}/{parcels.length}</span>
        </div>
        <div>
          <span className="text-blue-700">Valor total:</span>
          <span className="font-medium ml-2">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
        <div>
          <span className="text-blue-700">Valor repassado:</span>
          <span className="font-medium ml-2 text-green-700">R$ {paidValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="col-span-2">
          <span className="text-blue-700">Saldo a repassar:</span>
          <span className="font-medium ml-2 text-orange-700">R$ {remainingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
      
      {/* Barra de progresso */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-blue-700 mb-1">
          <span>Progresso das parcelas</span>
          <span>{totalValue > 0 ? Math.round((paidValue / totalValue) * 100) : 0}%</span>
        </div>
        <div className="w-full bg-blue-200 rounded-full h-3">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
            style={{ width: totalValue > 0 ? `${(paidValue / totalValue) * 100}%` : '0%' }}
          ></div>
        </div>
      </div>
    </div>
  );
}
