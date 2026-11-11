// 두 원천 API의 응답 계약과 보고서 내부 모델.
// CostReport = product-cst /api/report/monthly, OpsReport = plog /api/report/monthly.

export type PlantCode = "K1" | "K2" | "K3";
export type RiskLevel = "red" | "yellow" | "green" | "gray";

// ── product-cst ──
export interface Money {
  mfg: number; mat: number; proc: number;
  targetMfg: number; targetMat: number; targetProc: number;
  salesMfg: number; salesAmt: number; targetSalesMfg: number;
}
export interface CostSummary {
  qty: number; opDays: number; avgDailyQty: number;
  yield: number; targetYield: number;
  productivity: number; targetProductivity: number;
  mfgUnit: number; targetMfgUnit: number;
  matUnit: number; targetMatUnit: number;
  procUnit: number; targetProcUnit: number;
  costRatio: number; targetCostRatio: number;
  qtyUnit: string; costUnit: string; productivityUnit: string;
  money: Money;
}
export interface CostMonthPoint {
  month: string; hasData: boolean; qty: number; opDays: number;
  yield: number; targetYield: number; prod: number; targetProd: number;
  mfgUnit: number; targetUnit: number; matUnit: number; procUnit: number;
}
export interface BridgeDetail {
  productCode: string; productName: string; qty: number;
  unitCost: number; baseUnitCost: number;
  mixImpact: number; perfImpact: number; totalImpact: number; isNew: boolean;
}
export interface CostBridge {
  currUnit: number; baseUnit: number; diff: number;
  mixEffect: number; perfEffect: number; baseMonth: string | null;
  details: BridgeDetail[];
}
export interface CostLine {
  id: string; line: string; label: string; team: string; hasData: boolean;
  qty: number; opDays: number; yield: number; targetYield: number; prod: number; targetProd: number;
  mfgUnit: number; targetUnit: number; matUnit: number; targetMatUnit: number;
  procUnit: number; targetProcUnit: number;
  overrunPct: number | null; level: RiskLevel | null; improvement: number;
  prevMonth: { mfgUnit: number; overrunPct: number | null } | null;
  note: string | null;
}
export interface RiskItem {
  productCode: string; productName: string; plant: string;
  overrunPct: number; improvement: number; qty: number;
  actualMatUnit: number; targetMatUnit: number; level: RiskLevel;
}
export interface CostDiff {
  plant: PlantCode; mfg: number; targetMfg: number; targetMat: number; targetProc: number;
  matDiff: number; procDiff: number; improvement: number;
}
export interface CostReport {
  capacityProduction?: Record<string, { current: number | null; prevMonth: number | null; prevYear: number | null }>;
  labor?: LaborReport;
  plant: PlantCode; month: string; period: { start: string; end: string };
  prevMonth: string; prevYearMonth: string; asOf: string | null; generatedAt: string; hasData: boolean;
  units: { qty: string; cost: string; productivity: string };
  summary: { current: CostSummary; prevMonth: CostSummary | null; prevYear: CostSummary | null };
  segments: Array<{ key: string; group: string; current: CostSummary; prevMonth: CostSummary | null; prevYear: CostSummary | null;
    series?: { months: string[]; current: CostMonthPoint[]; prevYear: CostMonthPoint[] } }>;
  series: { months: string[]; current: CostMonthPoint[]; prevYear: CostMonthPoint[] };
  bridge: { mom: CostBridge | null; yoy: CostBridge | null; target: CostBridge };
  lines: CostLine[];
  risk: { items: RiskItem[]; totalCount: number; totalImprovement: number };
  costDiff: CostDiff;
}

// ── plog ──
export interface LaborPoint {
  month: string; headcount: number | null; laborCost: number | null;
  nominalHours: number | null; actualHours: number | null; extraHours: number | null;
  overtimeDependency: number | null; qty: number | null; unitLaborCost: number | null;
  qtyPerPerson: number | null; productivity: number | null;
}
export interface LaborReport {
  status: "ok" | "error"; error: string | null; scope: string;
  current: LaborPoint | null; prevMonth: LaborPoint | null; prevYear: LaborPoint | null;
  teams: Array<LaborPoint & { team: string; prevMonth?: LaborPoint; prevYear?: LaborPoint }>;
  series: { months: string[]; current: LaborPoint[]; prevYear: LaborPoint[] };
  warnings: string[];
}

export interface OpsRates {
  achievementRate: number; operationRate: number; downtimeRate: number;
  productivity: number; mhProductivity: number;
  scrapRate: number; defectRate: number; firstPassYield: number;
}
export interface TopItem { type: string; qty: number; share: number }
export interface OpsMonthPoint {
  month: string; reportCount: number;
  achievementRate: number; operationRate: number; downtimeRate: number;
  productivity: number; defectRate: number; scrapRate: number;
}
export interface PlantOpsRates {
  reportCount: number; operationRate: number; downtimeRate: number; downtimeMinutes: number;
  achievementRate: number; scrapRate: number; defectRate: number;
}
export interface OpsLine {
  line: string; planHr: number; actualHr: number; downtimeMinutes: number;
  planQty: number; actualQty: number; inputQty: number; scrapQty: number; defectQty: number;
  manpower: number; regular: number; temp: number; overtimeHr: number;
}
export interface OpsTeam {
  team: string; displayName: string; qtyUnit: string;
  reportCount: number; firstDate: string | null; lastDate: string | null;
  totals: Record<string, number>;
  rates: OpsRates;
  targets: {
    achievementTarget: number; operationTarget: number; downtimeTarget: number;
    hourlyProductivityTarget: number | null; manHourProductivityTarget: number | null;
  };
  prevMonth: { reportCount: number; rates: OpsRates } | null;
  prevYear: { reportCount: number; rates: OpsRates } | null;
  lines: OpsLine[];
  downtimeTop: TopItem[]; scrapTop: TopItem[]; defectTop: TopItem[];
  manpower: { avgDailyRegular: number; avgDailyTemp: number; overtimeHr: number };
  series: OpsMonthPoint[];
}
export interface OpsReport {
  plant: PlantCode; month: string; period: { from: string; to: string };
  prevMonth: string; prevYearMonth: string; generatedAt: string;
  teams: OpsTeam[];
  plantTotal: PlantOpsRates & {
    primaryTeams: string[];
    prevMonth: PlantOpsRates | null;
    prevYear: PlantOpsRates | null;
    series: Array<PlantOpsRates & { month: string }>;
  };
}

// ── 노트 ──
export type NoteSection = "improvement" | "plan";
export interface NoteRecord {
  plant: PlantCode; month: string; section: NoteSection;
  body: string; version: number; updatedBy: string | null; updatedAt: string | null;
}
export type PlantNotes = Record<NoteSection, NoteRecord>;

// ── 원천 호출 결과 (하나가 실패해도 보고서는 나머지로 그린다) ──
export type Fetched<T> = { ok: true; data: T } | { ok: false; error: string };
