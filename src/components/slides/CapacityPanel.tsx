import { fmtNum, fmtPct, fmtSigned, ppDelta } from '@/domain/derived';
import type { PlantReport } from '@/domain/report';

export function CapacityPanel({ report, compact = false }: { report: PlantReport; compact?: boolean }) {
  const rows = report.capacity?.rows ?? [];
  return <div className={`panel min-w-0 ${compact ? '!p-3' : ''}`}>
    <div className="panel-title">풀 CAPA 가동률</div>
    <div className="kicker mt-1">실적 생산량 ÷ 월 풀 CAPA</div>
    {report.capacity?.error ? <p className="mt-3 text-[16px] text-[var(--bad)]">{report.capacity.error}</p> : rows.map(r => <div key={r.key} className="mt-3 border-t border-[var(--line)] pt-2">
      <div className="flex items-baseline justify-between gap-2"><span className="text-[17px]">{r.label}</span><strong className="num text-[25px]">{fmtPct(r.rate)}</strong></div>
      {!compact && <div className="num text-[16px] text-[var(--ink-2)]">실적 {fmtNum(r.qty)} / CAPA {fmtNum(r.fullQty)} {r.unit}</div>}
      <div className="text-[14px] text-[var(--ink-3)]">{r.fullQty === null ? '관리자 CAPA 미입력' : `전월 ${fmtSigned(ppDelta(r.rate, r.prevRate), 1, '%p')} · 전년 ${fmtSigned(ppDelta(r.rate, r.prevYearRate), 1, '%p')}`}</div>
    </div>)}
    {!rows.length && <div className="kicker mt-3">CAPA 데이터 없음</div>}
  </div>;
}
