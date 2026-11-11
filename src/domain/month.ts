// 월 연산은 전부 'yyyy-MM' 문자열로 한다. Date 로컬 변환을 거치면 서버(UTC)와 서울 경계가 어긋난다.

export const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

/** URL 세그먼트 'yyyyMM' → 'yyyy-MM'. 형식이 틀리면 null */
export function parseYyyymm(seg: string): string | null {
  if (!/^\d{6}$/.test(seg)) return null;
  const m = `${seg.slice(0, 4)}-${seg.slice(4)}`;
  return MONTH_RE.test(m) ? m : null;
}

export const toSeg = (month: string) => month.replace("-", "");

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const idx = y * 12 + (m - 1) + delta;
  return `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, "0")}`;
}

export const prevMonth = (m: string) => shiftMonth(m, -1);
export const nextMonth = (m: string) => shiftMonth(m, 1);
export const prevYearMonth = (m: string) => shiftMonth(m, -12);

export function currentMonthSeoul(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit" }).format(new Date());
}

/** 마감된 달인가 (당월은 아직 실적이 쌓이는 중) */
export const isClosed = (m: string) => m < currentMonthSeoul();

/** 'yyyy-MM' → '10월', 연도가 다르면 '2025년 10월' */
export function monthLabel(m: string, withYear = false): string {
  const [y, mm] = m.split("-").map(Number);
  return withYear ? `${y}년 ${mm}월` : `${mm}월`;
}

/** 최근 n개월(당월 포함) 내림차순 */
export function recentMonths(n: number, from = currentMonthSeoul()): string[] {
  return Array.from({ length: n }, (_, i) => shiftMonth(from, -i));
}
