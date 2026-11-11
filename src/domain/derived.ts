// 표시용 파생값. 원천 숫자를 다시 계산하지 않고 비교·달성률·색만 만든다.

/** 0 이나 비정상 값은 "없음"으로 본다(목표 컬럼 공백, 실적 없는 달). */
export const nz = (v: number | null | undefined): number | null =>
  v === null || v === undefined || !Number.isFinite(v) || v === 0 ? null : v;

/** a 가 b 대비 몇 % 높은가. 기준이 없으면 null */
export function pctDelta(a: number | null | undefined, b: number | null | undefined): number | null {
  const x = nz(a);
  const y = nz(b);
  if (x === null || y === null) return null;
  return (x / y - 1) * 100;
}

/** 비율(0..1) 차이를 %p 로 */
export function ppDelta(a: number | null | undefined, b: number | null | undefined): number | null {
  if (a === null || a === undefined || b === null || b === undefined) return null;
  return (a - b) * 100;
}

/** 낮을수록 좋은 지표 — 상승 = 나쁨(빨강). 원가 상승 빨강, 생산량·생산성 상승 초록. */
const LOWER_IS_BETTER = new Set([
  "mfgUnit", "matUnit", "procUnit", "costRatio", "downtimeRate", "scrapRate", "defectRate", "overrunPct", "cost",
]);

export type Tone = "good" | "bad" | "flat";

export function deltaTone(metric: string, delta: number | null): Tone {
  if (delta === null || Math.abs(delta) < 0.05) return "flat";
  const improved = LOWER_IS_BETTER.has(metric) ? delta < 0 : delta > 0;
  return improved ? "good" : "bad";
}

/** 달성률(%) — 높을수록 좋은 지표는 실적/목표, 낮을수록 좋은 지표는 목표/실적 (벤치마크 게이지와 같은 정의) */
export function attainment(value: number | null, target: number | null, lowerIsBetter = false): number | null {
  if (value === null || target === null || target === 0) return null;
  if (lowerIsBetter) return value === 0 ? 200 : (target / value) * 100;
  return (value / target) * 100;
}

export const toneOfAttainment = (a: number | null): Tone =>
  a === null ? "flat" : a >= 100 ? "good" : a >= 95 ? "flat" : "bad";

// ── 포맷 ──
export function fmtNum(v: number | null | undefined, digits = 0): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "–";
  return v.toLocaleString("ko-KR", { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

export function fmtSigned(v: number | null | undefined, digits = 1, suffix = ""): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "–";
  const s = Math.abs(v).toLocaleString("ko-KR", { maximumFractionDigits: digits, minimumFractionDigits: digits });
  return `${v > 0 ? "+" : v < 0 ? "−" : "±"}${s}${suffix}`;
}

export const fmtPct = (rate01: number | null | undefined, digits = 1) =>
  rate01 === null || rate01 === undefined || !Number.isFinite(rate01) ? "–" : `${(rate01 * 100).toFixed(digits)}%`;

/** 원 → 억원/백만원 */
export function fmtWon(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "–";
  const abs = Math.abs(v);
  if (abs >= 1e8) return `${(v / 1e8).toLocaleString("ko-KR", { maximumFractionDigits: 1 })}억`;
  if (abs >= 1e6) return `${(v / 1e6).toLocaleString("ko-KR", { maximumFractionDigits: 0 })}백만`;
  return `${Math.round(v).toLocaleString("ko-KR")}원`;
}

export function fmtWonSigned(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "–";
  const sign = v > 0 ? "+" : v < 0 ? "−" : "±";
  return `${sign}${fmtWon(Math.abs(v))}`;
}

/** 큰 물량: 1만 이상은 '만' 단위 */
export function fmtQty(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "–";
  if (Math.abs(v) >= 1e4) return `${(v / 1e4).toLocaleString("ko-KR", { maximumFractionDigits: 1 })}만`;
  return Math.round(v).toLocaleString("ko-KR");
}
