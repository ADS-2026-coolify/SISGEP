import { addCalendarDays, getCalendarDateKey, getInclusiveCalendarDays } from './date';

export interface DetranCostTable {
  id?: string | number;
  towingFee?: string | number;
  dailyRate?: string | number;
  effectiveDate?: string;
  guincho?: string | number;
  estadia?: string | number;
  ano_vigente?: string;
}

export interface DetranVehicleTableInfo {
  guincho?: string | number;
  estadia?: string | number;
  ano_vigente?: string;
}

export interface DetranCost {
  towingFee: number;
  dailyRate: number;
  daysStored: number;
  storageCost: number;
  totalCost: number;
  hasMultipleDailyRates: boolean;
}

function getTowingFee(table: DetranCostTable): number {
  return Number(table.towingFee ?? table.guincho) || 0;
}

function getDailyRate(table: DetranCostTable): number {
  return Number(table.dailyRate ?? table.estadia) || 0;
}

function getEffectiveDate(table: DetranCostTable): string | undefined {
  return table.effectiveDate ?? table.ano_vigente;
}

export function calculateDetranCost(
  entryDate: string | Date,
  endDate: string | Date,
  tables: DetranCostTable[],
  entryTableId?: string | number,
  entryTableInfo?: DetranVehicleTableInfo,
): DetranCost {
  const entryDateKey = getCalendarDateKey(entryDate);
  const endDateKey = getCalendarDateKey(endDate);
  const daysStored = getInclusiveCalendarDays(entryDate, endDate);
  const sortedTables = [...tables]
    .filter((table) => getEffectiveDate(table))
    .sort((first, second) => {
      const effectiveDateOrder = (
        getEffectiveDate(second) || ''
      ).localeCompare(getEffectiveDate(first) || '');
      if (effectiveDateOrder !== 0) {
        return effectiveDateOrder;
      }
      return Number(second.id || 0) - Number(first.id || 0);
    });
  const historicalEntryTable = entryTableInfo
    ? { ...entryTableInfo, effectiveDate: entryTableInfo.ano_vigente || entryDateKey }
    : undefined;
  const entryTable = sortedTables.find((table) => (
    entryTableId !== undefined && String(table.id) === String(entryTableId)
  )) || sortedTables.find((table) => (getEffectiveDate(table) || '') <= entryDateKey)
    || historicalEntryTable;

  let dailyTotalInCents = 0;
  let dailyRate = 0;
  const appliedDailyRates = new Set<number>();

  for (let day = 0; day < daysStored; day += 1) {
    const currentDate = addCalendarDays(entryDateKey, day);
    if (currentDate > endDateKey) {
      break;
    }

    const tableForDay = sortedTables.find((table) => (
      (getEffectiveDate(table) || '') <= currentDate
    )) || entryTable;
    dailyRate = tableForDay ? getDailyRate(tableForDay) : 0;
    const dailyRateInCents = Math.round(dailyRate * 100);
    appliedDailyRates.add(dailyRateInCents);
    dailyTotalInCents += dailyRateInCents;
  }

  const towingFee = entryTable ? getTowingFee(entryTable) : 0;
  const storageCost = dailyTotalInCents / 100;

  return {
    towingFee,
    dailyRate,
    daysStored,
    storageCost,
    totalCost: towingFee + storageCost,
    hasMultipleDailyRates: appliedDailyRates.size > 1,
  };
}
