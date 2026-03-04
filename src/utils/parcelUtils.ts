
interface ParcelData {
  value: number;
  payment_date: string | null;
}

export function calculateParcelsSummary(parcels: ParcelData[]) {
  if (!parcels || parcels.length === 0) {
    return null;
  }

  const totalValue = parcels.reduce((sum, parcel) => sum + parcel.value, 0);
  const paidParcels = parcels.filter(parcel => parcel.payment_date);
  const paidValue = paidParcels.reduce((sum, parcel) => sum + parcel.value, 0);
  const remainingValue = totalValue - paidValue;
  const progressPercentage = totalValue > 0 ? (paidValue / totalValue) * 100 : 0;

  return {
    totalValue,
    paidValue,
    remainingValue,
    totalParcels: parcels.length,
    paidParcels: paidParcels.length,
    progressText: `${paidParcels.length}/${parcels.length}`,
    progressPercentage
  };
}

export function formatCurrencyBR(value: number): string {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}
