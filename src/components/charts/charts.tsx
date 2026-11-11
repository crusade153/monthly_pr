// 슬라이드 캔버스(1920×1080)가 고정 크기라 차트도 고정 px SVG 로 그린다.
// 서버에서 렌더되므로 발표·인쇄·PDF 어디서나 같은 그림이 나오고, 클라이언트 차트 라이브러리가 필요 없다.
// 규칙: 막대 축은 0에서 시작(잘라서 차이를 과장하지 않는다), 워터폴은 0=기준인 차이 브리지.
import { fmtNum, fmtSigned } from "@/domain/derived";

const FONT = "var(--font-mono)";

// ── 1. 비교 막대 (전년 · 목표 · 실적) ──
export function CompareBars({
  items, width = 520, height = 300, digits = 0, format,
}: {
  items: Array<{ label: string; value: number | null; color: string; emphasis?: boolean }>;
  width?: number; height?: number; digits?: number; format?: (v: number) => string;
}) {
  const show = (v: number) => (format ? format(v) : fmtNum(v, digits));
  const top = 44, bottom = 44;
  const max = Math.max(1, ...items.map((i) => i.value ?? 0)) * 1.08;
  const padX = 32;
  const slot = (width - padX * 2) / items.length;
  const bw = Math.min(110, slot * 0.58);
  const h = height - top - bottom;
  return (
    <svg width={width} height={height} role="img" aria-label={items.map((i) => `${i.label} ${i.value === null ? "미등록" : show(i.value)}`).join(", ")}>
      <line x1={0} x2={width} y1={top + h} y2={top + h} stroke="var(--line-2)" />
      {items.map((it, i) => {
        const x = padX + slot * i + (slot - bw) / 2;
        const v = it.value ?? 0;
        const bh = (v / max) * h;
        return (
          <g key={it.label}>
            {it.value === null ? (
              <text x={x + bw / 2} y={top + h - 12} textAnchor="middle" fontSize={18} fill="var(--ink-3)">미등록</text>
            ) : (
              <>
                <rect x={x} y={top + h - bh} width={bw} height={bh} rx={4} fill={it.color} />
                <text x={x + bw / 2} y={top + h - bh - 12} textAnchor="middle" fontSize={Math.min(it.emphasis ? 26 : 22, slot / (show(v).length * 0.63))}
                  fontWeight={it.emphasis ? 700 : 500} fontFamily={FONT} fill="var(--ink)">{show(v)}</text>
              </>
            )}
            <text x={x + bw / 2} y={height - 14} textAnchor="middle" fontSize={18} fill="var(--ink-2)">{it.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ── 2. 반원 게이지 — 달성률(%) 0~150 을 호에, 100% 에 눈금 ──
export function HalfGauge({
  attainment, color, size = 250, center, sub,
}: {
  attainment: number | null; color: string; size?: number; center: string; sub?: string;
}) {
  const r = size / 2 - 18;
  const cx = size / 2, cy = size / 2 + 4;
  const sw = 26;
  const MAX = 150;
  const pt = (frac: number) => {
    const a = Math.PI * (1 - frac);
    return [cx + r * Math.cos(a), cy - r * Math.sin(a)];
  };
  const arc = (from: number, to: number) => {
    const [x1, y1] = pt(from);
    const [x2, y2] = pt(to);
    // 반원(최대 180°)이라 large-arc 는 항상 0, 왼쪽→오른쪽 시계방향
    return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
  };
  const frac = attainment === null ? 0 : Math.max(0, Math.min(attainment, MAX)) / MAX;
  const [tx1, ty1] = [cx + (r - sw / 2 - 6) * Math.cos(Math.PI / 3), cy - (r - sw / 2 - 6) * Math.sin(Math.PI / 3)];
  const [tx2, ty2] = [cx + (r + sw / 2 + 6) * Math.cos(Math.PI / 3), cy - (r + sw / 2 + 6) * Math.sin(Math.PI / 3)];
  return (
    <svg width={size} height={size / 2 + 34} role="img" aria-label={`${center} 달성률 ${attainment === null ? "없음" : attainment.toFixed(1) + "%"}`}>
      <path d={arc(0, 1)} stroke="var(--line)" strokeWidth={sw} fill="none" />
      {frac > 0 && <path d={arc(0, Math.max(frac, 0.002))} stroke={color} strokeWidth={sw} fill="none" />}
      {/* 100% 눈금 (150 중 100 = 2/3 지점 = 60°) */}
      <line x1={tx1} y1={ty1} x2={tx2} y2={ty2} stroke="var(--ink)" strokeWidth={2} />
      <text x={cx} y={cy - 26} textAnchor="middle" fontSize={28} fontWeight={700} fontFamily={FONT} fill="var(--ink)">{center}</text>
      {sub && <text x={cx} y={cy + 2} textAnchor="middle" fontSize={17} fill="var(--ink-2)">{sub}</text>}
    </svg>
  );
}

// ── 3. 12개월 추이 — 당해 vs 전년 (+선택 목표 점선) ──
export function TrendLine12({
  months, current, previous, target, width = 860, height = 250, digits = 0, labelEvery = 1, allowZero = false, format,
}: {
  months: string[]; current: Array<number | null>; previous?: Array<number | null>; target?: Array<number | null>;
  width?: number; height?: number; digits?: number; labelEvery?: number; allowZero?: boolean; format?: (v: number) => string;
}) {
  const padL = 18, padR = 18, top = 34, bottom = 34;
  const valid = (v: number | null): v is number => v !== null && Number.isFinite(v) && (allowZero ? v >= 0 : v > 0);
  const vals = [...current, ...(previous ?? []), ...(target ?? [])].filter(valid);
  if (!vals.length) {
    return <svg width={width} height={height}><text x={width / 2} y={height / 2} textAnchor="middle" fontSize={18} fill="var(--ink-3)">추이 데이터 없음</text></svg>;
  }
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const span = hi - lo || hi * 0.1 || 1;
  const min = lo - span * 0.25, max = hi + span * 0.25;
  const x = (i: number) => padL + ((width - padL - padR) * i) / (months.length - 1);
  const y = (v: number) => top + (height - top - bottom) * (1 - (v - min) / (max - min));
  const path = (arr: Array<number | null>) => {
    let d = "";
    let pen = false;
    arr.forEach((v, i) => {
      if (!valid(v)) { pen = false; return; }
      d += `${pen ? "L" : "M"} ${x(i).toFixed(1)} ${y(v).toFixed(1)} `;
      pen = true;
    });
    return d;
  };
  return (
    <svg width={width} height={height} role="img" aria-label="12개월 추이">
      {target && <path d={path(target)} stroke="var(--navy)" strokeDasharray="6 6" strokeWidth={2} fill="none" opacity={0.55} />}
      {previous && <path d={path(previous)} stroke="var(--s-prev)" strokeWidth={3} fill="none" />}
      <path d={path(current)} stroke="var(--bad)" strokeWidth={3.5} fill="none" />
      {current.map((v, i) =>
        !valid(v) ? null : (
          <g key={i}>
            <circle cx={x(i)} cy={y(v)} r={5} fill="#fff" stroke="var(--bad)" strokeWidth={2.5} />
            {(i % labelEvery === 0 || i === current.length - 1) && (
              <text x={x(i)} y={y(v) - 12} textAnchor={i === 0 ? 'start' : i === current.length - 1 ? 'end' : 'middle'} fontSize={i === current.length - 1 ? 19 : 15}
                fontWeight={i === current.length - 1 ? 700 : 400} fontFamily={FONT} fill="var(--ink)">{format ? format(v) : fmtNum(v, digits)}</text>
            )}
          </g>
        ),
      )}
      {months.map((m, i) => (
        <text key={m} x={x(i)} y={height - 8} textAnchor="middle" fontSize={15} fill="var(--ink-3)">{Number(m.slice(5))}</text>
      ))}
    </svg>
  );
}

// ── 4. 차이 브리지 (0 = 기준). 막대 = 요인별 단위원가 영향, 마지막 = 총차이 ──
export function BridgeWaterfall({
  steps, width = 760, height = 300, digits = 1,
}: {
  steps: Array<{ label: string; value: number; total?: boolean }>;
  width?: number; height?: number; digits?: number;
}) {
  const top = 32, bottom = 48;
  // 누적 위치: 앞선 요인 막대들의 합에서 시작 (총차이 막대는 0 에서)
  const bars = steps.map((s, i) => {
    const before = steps.slice(0, i).filter((x) => !x.total).reduce((acc, x) => acc + x.value, 0);
    return s.total ? { ...s, from: 0, to: s.value } : { ...s, from: before, to: before + s.value };
  });
  const ext = [0, ...bars.flatMap((b) => [b.from, b.to])];
  const lo = Math.min(...ext), hi = Math.max(...ext);
  const pad = (hi - lo || 1) * 0.28;
  const min = lo - pad, max = hi + pad;
  const y = (v: number) => top + (height - top - bottom) * (1 - (v - min) / (max - min));
  const slot = width / bars.length;
  const bw = Math.min(120, slot * 0.5);
  return (
    <svg width={width} height={height} role="img" aria-label={steps.map((s) => `${s.label} ${fmtSigned(s.value, digits)}`).join(", ")}>
      <line x1={0} x2={width} y1={y(0)} y2={y(0)} stroke="var(--ink-3)" strokeDasharray="4 4" />
      <text x={4} y={y(0) - 6} fontSize={14} fill="var(--ink-3)">기준 0</text>
      {bars.map((b, i) => {
        const x = slot * i + (slot - bw) / 2;
        const y1 = y(Math.max(b.from, b.to));
        const h = Math.max(2, Math.abs(y(b.from) - y(b.to)));
        const color = b.total ? "var(--navy)" : b.value > 0 ? "var(--bad)" : "var(--good)";
        return (
          <g key={b.label}>
            <rect x={x} y={y1} width={bw} height={h} rx={3} fill={color} />
            {i < bars.length - 1 && !bars[i + 1].total && (
              <line x1={x + bw} x2={x + slot} y1={y(b.to)} y2={y(b.to)} stroke="var(--ink-3)" strokeDasharray="3 3" />
            )}
            <text x={x + bw / 2} y={Math.max(20, Math.min(height - bottom + 15, b.to >= b.from ? y1 - 10 : y1 + h + 20))} textAnchor="middle" fontSize={20}
              fontWeight={b.total ? 700 : 500} fontFamily={FONT} fill="var(--ink)">{fmtSigned(b.value, digits)}</text>
            <text x={x + bw / 2} y={height - 10} textAnchor="middle" fontSize={17} fill="var(--ink-2)">{b.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ── 5. 가로 막대 Top N (HTML — 긴 한글 라벨이 잘리지 않게) ──
export function HBarTop({
  items, unit, color = "var(--navy)", empty = "기록 없음", max: maxItems = 5,
}: {
  items: Array<{ label: string; value: number; share?: number }>; unit: string; color?: string; empty?: string; max?: number;
}) {
  const list = items.slice(0, maxItems);
  if (!list.length) return <div className="kicker py-3">{empty}</div>;
  const max = Math.max(...list.map((i) => i.value), 1);
  return (
    <div className="flex flex-col gap-[9px]">
      {list.map((it) => (
        <div key={it.label} className="grid items-center gap-3" style={{ gridTemplateColumns: "190px 1fr 150px" }}>
          <span className="truncate text-[17px] text-[var(--ink-2)]" title={it.label}>{it.label}</span>
          <span className="h-[14px] rounded-full bg-[var(--navy-tint)] overflow-hidden">
            <span className="block h-full rounded-full" style={{ width: `${(it.value / max) * 100}%`, background: color }} />
          </span>
          <span className="num text-[17px] text-right">
            {fmtNum(it.value)}{unit}
            {it.share !== undefined && <span className="text-[var(--ink-3)]"> · {(it.share * 100).toFixed(0)}%</span>}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── 6. 스파크라인 ──
export function Spark({ values, width = 150, height = 34, color = "var(--navy)" }: { values: Array<number | null>; width?: number; height?: number; color?: string }) {
  const vs = values.filter((v): v is number => v !== null && v > 0);
  if (vs.length < 2) return <svg width={width} height={height} />;
  const lo = Math.min(...vs), hi = Math.max(...vs);
  const x = (i: number) => 3 + ((width - 6) * i) / (values.length - 1);
  const y = (v: number) => 4 + (height - 8) * (1 - (v - lo) / (hi - lo || 1));
  let d = "", pen = false;
  values.forEach((v, i) => {
    if (v === null || v <= 0) { pen = false; return; }
    d += `${pen ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)} `;
    pen = true;
  });
  const lastI = values.length - 1;
  const last = values[lastI];
  return (
    <svg width={width} height={height} aria-hidden>
      <path d={d} stroke={color} strokeWidth={2} fill="none" />
      {last !== null && last > 0 && <circle cx={x(lastI)} cy={y(last)} r={3} fill={color} />}
    </svg>
  );
}
