import { TrendLine12 } from '@/components/charts/charts';
import { fmtNum, fmtSigned, pctDelta } from '@/domain/derived';
import type { PlantReport } from '@/domain/report';
import { SlideFrame } from './SlideFrame';

export function SlideK1Teams({ report, page, total }: { report: PlantReport; page: number; total: number }) {
  return <SlideFrame plant="K1" title="냉동팀 · 조미팀 실적" month={report.month} page={page} total={total} sources="생산량·원가·생산성: product-cst · 가동률: 실적 생산량 ÷ 관리자 입력 월 풀/주간 1교대 CAPA">
    <div className="grid h-full grid-cols-2 gap-6">
      {(report.cost?.segments ?? []).map(g => {
        const label = g.key === 'K1-frozen' ? '냉동팀' : '조미팀';
        const capacity = report.capacity?.rows.find(r => r.key === g.key);
        return <div key={g.key} className="panel flex min-w-0 flex-col gap-3">
          <h3 className="text-[30px] font-semibold text-[var(--navy)]">{label}</h3>
          <table className="tbl"><thead><tr><th>지표</th><th>당월</th><th>전월</th><th>전년동월</th></tr></thead><tbody>
            {([{key:'qty', label:'생산량 (ton)'}, {key:'mfgUnit',label:'제조원가 (원/kg)'}, {key:'productivity', label:'생산성 (kg/MH)'}, {key:'yield',label:'수율 (%)'}] as const).map(m => <tr key={m.key}><td>{m.label}</td><td className="num font-semibold">{fmtNum(g.current[m.key] / (m.key === 'qty' ? 1000 : 1),1)}</td><td className="num">{fmtNum(g.prevMonth == null ? null : g.prevMonth[m.key] / (m.key === 'qty' ? 1000 : 1),1)}</td><td className="num">{fmtNum(g.prevYear == null ? null : g.prevYear[m.key] / (m.key === 'qty' ? 1000 : 1),1)}</td></tr>)}
            <tr><td>풀 CAPA 가동률</td><td className="num">{capacity?.rate == null ? '미입력' : `${fmtNum(capacity.rate*100,1)}%`}</td><td className="num">{capacity?.prevRate == null ? '–' : `${fmtNum(capacity.prevRate*100,1)}%`}</td><td className="num">{capacity?.prevYearRate == null ? '–' : `${fmtNum(capacity.prevYearRate*100,1)}%`}</td></tr>
          <tr><td>주간 1교대 CAPA 가동률</td><td className="num">{capacity?.dayRate == null ? '미입력' : `${fmtNum(capacity.dayRate*100,1)}%`}</td><td colSpan={2} className="text-[13px] text-[var(--ink-3)]">실적 ÷ 월 주간 1교대 CAPA</td></tr>
          </tbody></table>
          <p className="text-[18px]">제조원가 목표 대비 {fmtSigned(pctDelta(g.current.mfgUnit,g.current.targetMfgUnit),1,'%')} · 생산성 목표 대비 {fmtSigned(pctDelta(g.current.productivity,g.current.targetProductivity),1,'%')}</p>
          <div className="panel-title">생산량 추이 <small>ton · 실적(적색 실선) / 전년동월(회색 실선)</small></div>
          {g.series ? <TrendLine12 width={790} height={160} labelEvery={2} format={v => fmtNum(v / 1000, 1)} months={g.series.months} current={g.series.current.map(p=>p.hasData?p.qty:null)} previous={g.series.prevYear.map(p=>p.hasData?p.qty:null)} /> : <p>추이 데이터 없음</p>}
          <div className="panel-title">생산성 추이 <small>kg/MH · 실적(적색 실선) / 전년동월(회색 실선) / 목표(남색 점선)</small></div>
          {g.series && <TrendLine12 width={790} height={160} digits={1} months={g.series.months} current={g.series.current.map(p=>p.hasData?p.prod:null)} previous={g.series.prevYear.map(p=>p.hasData?p.prod:null)} target={g.series.current.map(p=>p.hasData?p.targetProd:null)} />}
        </div>;
      })}
    </div>
  </SlideFrame>;
}
