import type { CostReport, PlantCode } from './types';
export const CAPACITY_SCOPES = [
  { key: 'K1-frozen', plant: 'K1', label: '냉동팀', unit: 'kg' },
  { key: 'K1-season', plant: 'K1', label: '조미팀', unit: 'kg' },
  { key: 'K2-1', plant: 'K2', label: '즉석밥 1라인', unit: '식' },
  { key: 'K2-2', plant: 'K2', label: '즉석밥 2라인', unit: '식' },
  { key: 'K3', plant: 'K3', label: 'K3 공장', unit: '식' },
] as const;
export type CapacityKey = typeof CAPACITY_SCOPES[number]['key'];
export type CapacitySetting = { month: string; scope: string; fullQty: number; version: number; updatedBy: string; updatedAt: string };
export interface CapacityRow {
  key: CapacityKey; label: string; unit: string; qty: number | null; fullQty: number | null;
  rate: number | null; prevRate: number | null; prevYearRate: number | null;
}
export interface CapacityReport { rows: CapacityRow[]; error: string | null }

export function buildCapacityReport(plant: PlantCode, month: string, cost: CostReport | null, settings: CapacitySetting[], error: string | null): CapacityReport {
  return { error, rows: CAPACITY_SCOPES.filter(s => s.plant === plant).map(scope => {
    const quantity = (period: 'current' | 'prevMonth' | 'prevYear'): number | null => {
      if (!cost) return null;
      if (plant === 'K1') return cost.segments.find(g => g.key === scope.key)?.[period]?.qty ?? null;
      if (plant === 'K2') {
        const name = scope.key === 'K2-1' ? '즉석밥1' : '즉석밥2';
        const points = cost.capacityProduction?.[scope.key];
        // 이전 API에는 과거 라인 생산량이 없으므로 현재만 폴백한다.
        return points?.[period] ?? (period === 'current' ? cost.lines.find(l => l.line === name && l.hasData)?.qty ?? null : null);
      }
      return cost.summary[period]?.qty ?? null;
    };
    const capacity = (m: string) => error ? null : settings.find(s => s.month === m && s.scope === scope.key)?.fullQty ?? null;
    const rate = (q: number | null, c: number | null) => q !== null && c !== null && c > 0 ? q / c : null;
    const qty = quantity('current'), fullQty = capacity(month);
    return { ...scope, qty, fullQty, rate: rate(qty, fullQty),
      prevRate: cost ? rate(quantity('prevMonth'), capacity(cost.prevMonth)) : null,
      prevYearRate: cost ? rate(quantity('prevYear'), capacity(cost.prevYearMonth)) : null };
  }) };
}
