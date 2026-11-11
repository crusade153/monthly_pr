// 두 원천 + 노트를 플랜트 보고서 하나로 묶고, TOTAL(금액만)을 만든다.
import type { CostReport, Fetched, OpsReport, PlantCode, PlantNotes } from "./types";
import { UNITS } from "./plants";
import type { CapacityReport } from './capacity';

export interface PlantReport {
  capacity?: CapacityReport;
  plant: PlantCode;
  month: string;
  units: (typeof UNITS)[PlantCode];
  cost: CostReport | null;
  costError: string | null;
  ops: OpsReport | null;
  opsError: string | null;
  notes: PlantNotes;
  /** 원가 실적이 없는 달(휴지) — 슬라이드는 EmptyState 로 대체 */
  empty: boolean;
  asOf: string | null;
}

export function buildPlantReport(args: {
  plant: PlantCode;
  month: string;
  cost: Fetched<CostReport>;
  ops: Fetched<OpsReport>;
  notes: PlantNotes;
}): PlantReport {
  const cost = args.cost.ok ? args.cost.data : null;
  const ops = args.ops.ok ? args.ops.data : null;
  return {
    plant: args.plant,
    month: args.month,
    units: UNITS[args.plant],
    cost,
    costError: args.cost.ok ? null : args.cost.error,
    ops,
    opsError: args.ops.ok ? null : args.ops.error,
    notes: args.notes,
    empty: !!cost && !cost.hasData && (!ops || ops.plantTotal.reportCount === 0),
    asOf: cost?.asOf ?? null,
  };
}

// ── TOTAL: 금액(원)·시간(분)만. 물량·단가·수율은 공장 간 단위가 달라 여기 들어오지 않는다. ──
export interface TotalRow {
  plant: PlantCode;
  hasCost: boolean;
  mfg: number;
  targetMfg: number;
  prevYearMfg: number | null;
  prevMonthMfg: number | null;
  matDiff: number;
  procDiff: number;
  improvement: number;
  salesMfg: number;
  salesAmt: number;
  targetSalesMfg: number;
  downtimeMinutes: number | null;
}

export interface TotalReport {
  month: string;
  rows: TotalRow[];
  sum: Omit<TotalRow, "plant" | "hasCost">;
  costRatio: number | null;
  targetCostRatio: number | null;
}

export function buildTotalReport(month: string, reports: PlantReport[]): TotalReport {
  const rows: TotalRow[] = reports.map((r) => {
    const c = r.cost;
    return {
      plant: r.plant,
      hasCost: !!c?.hasData,
      mfg: c?.costDiff.mfg ?? 0,
      targetMfg: c?.costDiff.targetMfg ?? 0,
      prevYearMfg: c?.summary.prevYear?.money.mfg ?? null,
      prevMonthMfg: c?.summary.prevMonth?.money.mfg ?? null,
      matDiff: c?.costDiff.matDiff ?? 0,
      procDiff: c?.costDiff.procDiff ?? 0,
      improvement: c?.costDiff.improvement ?? 0,
      salesMfg: c?.summary.current.money.salesMfg ?? 0,
      salesAmt: c?.summary.current.money.salesAmt ?? 0,
      targetSalesMfg: c?.summary.current.money.targetSalesMfg ?? 0,
      downtimeMinutes: r.ops ? r.ops.plantTotal.downtimeMinutes : null,
    };
  });
  const sumOf = (k: keyof TotalRow) => rows.reduce((s, r) => s + ((r[k] as number | null) ?? 0), 0);
  const anyNull = (k: keyof TotalRow) => rows.every((r) => r[k] === null);
  const sum = {
    mfg: sumOf("mfg"),
    targetMfg: sumOf("targetMfg"),
    prevYearMfg: anyNull("prevYearMfg") ? null : sumOf("prevYearMfg"),
    prevMonthMfg: anyNull("prevMonthMfg") ? null : sumOf("prevMonthMfg"),
    matDiff: sumOf("matDiff"),
    procDiff: sumOf("procDiff"),
    improvement: sumOf("improvement"),
    salesMfg: sumOf("salesMfg"),
    salesAmt: sumOf("salesAmt"),
    targetSalesMfg: sumOf("targetSalesMfg"),
    downtimeMinutes: anyNull("downtimeMinutes") ? null : sumOf("downtimeMinutes"),
  };
  return {
    month,
    rows,
    sum,
    // product-cst calcMetrics 와 같은 원가율 공식(판매대상 제조원가 ÷ 매출액)
    costRatio: sum.salesAmt > 0 ? (sum.salesMfg / sum.salesAmt) * 100 : null,
    targetCostRatio: sum.salesAmt > 0 ? (sum.targetSalesMfg / sum.salesAmt) * 100 : null,
  };
}
