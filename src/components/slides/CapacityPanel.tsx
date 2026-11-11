import { fmtNum, fmtPct, fmtSigned, ppDelta } from '@/domain/derived';
import type { PlantReport } from '@/domain/report';

export function CapacityPanel({ report, compact = false }: { report: PlantReport; compact?: boolean }) {
  const rows = report.capacity?.rows ?? [];
  return <div className={`panel min-w-0 ${compact ? '!p-3' : ''}`}>
    <div className="panel-title">풀 / 주간 CAPA 가동률</div>
    <div className="kicker mt-1">실적 생산량 ÷ 각 월 CAPA · 주간 = 1교대</div>
    {report.capacity?.error ? <p className="mt-3 text-[16px] text-[var(--bad)]">{report.capacity.error}</p> : rows.map(r => <div key={r.key} className="mt-3 border-t border-[var(--line)] pt-2">
      <div className="flex flex-wrap items-baseline justify-between gap-1"><span className="text-[17px]">{r.label}</span><strong className="num text-[20px]"><span className="text-[13px] font-normal">풀 </span>{fmtPct(r.rate)}<span className="ml-3 text-[13px] font-normal">주간 </span>{fmtPct(r.dayRate)}</strong></div>
      {!compact && <div className="num text-[16px] text-[var(--ink-2)]">실적 {fmtNum(r.qty)} / CAPA {fmtNum(r.fullQty)} {r.unit}</div>}
      <div className="text-[14px] text-[var(--ink-3)]">{r.dayQty === null && '주간 CAPA 미입력 · '}{r.fullQty === null ? '관리자 CAPA 미입력' : `전월 ${fmtSigned(ppDelta(r.rate, r.prevRate), 1, '%p')} · 전년 ${fmtSigned(ppDelta(r.rate, r.prevYearRate), 1, '%p')}`}</div>
    </div>)}
    {!rows.length && <div className="kicker mt-3">CAPA 데이터 없음</div>}
  </div>;
}
