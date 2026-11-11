import { formatQuantity, quantityUnit } from '@/domain/quantity';
import { fmtPct } from '@/domain/derived';
import type { PlantReport } from '@/domain/report';

function capacityRate(rate: number | null, capacity: number | null) {
  return rate !== null ? fmtPct(rate) : capacity === null ? 'CAPA 미입력' : '실적 없음';
}

export function CapacityPanel({ report, compact = false }: { report: PlantReport; compact?: boolean }) {
  const rows = report.capacity?.rows ?? [];
  return <div className={`panel min-w-0 ${compact ? '!p-3' : ''}`}>
    <div className={`panel-title ${compact ? '!text-[18px]' : ''}`}>풀 / 주간 CAPA 가동률</div>
    <div className={`kicker mt-1 ${compact ? '!text-[12px]' : ''}`}>월별 실적 ÷ 고정 CAPA · 주간 = 1교대</div>
    {report.capacity?.error ? <p className="mt-3 text-[16px] text-[var(--bad)]">{report.capacity.error}</p> : rows.map(r => <div key={r.key} className="mt-1 border-t border-[var(--line)] pt-1">
      <div className={compact ? 'text-[15px] leading-tight' : 'text-[17px]'}>{r.label}</div>
      <table className="mt-1 w-full text-right text-[13px] leading-tight">
        <thead className="font-normal text-[var(--ink-3)]"><tr><th className="text-left font-normal">기준</th><th className="font-normal">당월</th><th className="font-normal">전월</th><th className="font-normal">전년동월</th></tr></thead>
        <tbody className="num text-[var(--ink-2)]">
          <tr><th className="text-left font-normal">풀</th><td className="font-semibold text-[var(--ink)]">{capacityRate(r.rate, r.fullQty)}</td><td>{capacityRate(r.prevRate, r.prevFullQty)}</td><td>{capacityRate(r.prevYearRate, r.prevYearFullQty)}</td></tr>
          <tr><th className="text-left font-normal">주간</th><td className="font-semibold text-[var(--ink)]">{capacityRate(r.dayRate, r.dayQty)}</td><td>{capacityRate(r.prevDayRate, r.prevDayQty)}</td><td>{capacityRate(r.prevYearDayRate, r.prevYearDayQty)}</td></tr>
        </tbody>
      </table>
      {!compact && <div className="num text-[16px] text-[var(--ink-2)]">실적 {formatQuantity(r.qty, r.unit)} / 풀 CAPA {formatQuantity(r.fullQty, r.unit)} / 주간 CAPA {formatQuantity(r.dayQty, r.unit)} {quantityUnit(r.unit)}</div>}
    </div>)}
    {!rows.length && <div className="kicker mt-3">CAPA 데이터 없음</div>}
  </div>;
}
