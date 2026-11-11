import { deltaTone, fmtSigned, type Tone } from "@/domain/derived";
import type { RiskLevel } from "@/domain/types";

/** 증감 표시 — 색은 지표 성격(낮을수록 좋은가)으로 정한다 */
export function Delta({
  label, value, metric, suffix = "%", digits = 1, size = 22,
}: { label: string; value: number | null; metric: string; suffix?: string; digits?: number; size?: number }) {
  const tone = deltaTone(metric, value);
  return (
    <div className="flex flex-col">
      <span className="text-[15px] text-[var(--ink-3)]">{label}</span>
      <span className={`num font-semibold tone-${tone}`} style={{ fontSize: size }}>
        {value === null ? "–" : fmtSigned(value, digits, suffix)}
      </span>
    </div>
  );
}

export const toneColor = (t: Tone) => (t === "good" ? "var(--good)" : t === "bad" ? "var(--bad)" : "var(--ink-3)");

const RISK: Record<RiskLevel, { label: string; fg: string; bg: string }> = {
  red: { label: "위험", fg: "var(--risk-red)", bg: "var(--bad-tint)" },
  yellow: { label: "주의", fg: "var(--risk-yellow)", bg: "var(--gold-tint)" },
  green: { label: "양호", fg: "var(--risk-green)", bg: "var(--good-tint)" },
  gray: { label: "목표이하", fg: "var(--ink-2)", bg: "var(--navy-tint)" },
};

export function RiskBadge({ level }: { level: RiskLevel | null }) {
  if (!level) return <span className="text-[var(--ink-3)]">–</span>;
  const r = RISK[level];
  return <span className="badge" style={{ color: r.fg, background: r.bg }}>{r.label}</span>;
}

export function SourceError({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--bad)] bg-[var(--bad-tint)] px-5 py-4 text-[17px] text-[var(--bad)]">
      {message}
    </div>
  );
}
