import { formatQuantity, quantityUnit, quantityScale, quantityValue } from '@/domain/quantity';
import { TrendLine12 } from '@/components/charts/charts';
import { fmtNum, fmtPct, fmtSigned } from '@/domain/derived';
import { laborChange, laborInterpretation, laborReadout, laborTone } from '@/domain/labor-comparison';
import type { PlantReport } from '@/domain/report';
import { EmptySlideBody, SlideFrame } from './SlideFrame';

type MetricKey = 'unitLaborCost' | 'overtimeDependency' | 'headcount' | 'qtyPerPerson' | 'laborCost' | 'extraHours';
function Comparison({ label, metric, value, base, unit, compact = false }: {
  label: string; metric: MetricKey; value: number | null | undefined; base: number | null | undefined; unit: string; compact?: boolean;
}) {
  const change = laborChange(value, base);
  const isRate = metric === 'overtimeDependency';
  const delta = isRate ? change.amount === null ? null : change.amount * 100 : change.percent;
  return <div className={`flex items-baseline justify-between gap-2 ${compact ? 'text-[14px]' : 'text-[17px]'}`}>
    <span className="shrink-0 text-[var(--ink-3)]">{label}</span>
    <span className={`num whitespace-nowrap tone-${laborTone(metric, delta)}`}>
      {fmtSigned(delta, 1, isRate ? '%p' : '%')}{!isRate && <span className="ml-2 text-[13px] text-[var(--ink-2)]">({fmtSigned(change.amount, metric === 'unitLaborCost' ? 2 : 1)}{unit})</span>}
    </span>
  </div>;
}

export function SlidePlantLabor({ report, page, total }: { report: PlantReport; page: number; total: number }) {
  const labor = report.cost?.labor;
  const s = labor?.current;
  const units = report.units;
  const metrics: Array<{ key: MetricKey; label: string; unit: string; format: (v: number | null | undefined) => string }> = [
    { key: 'unitLaborCost', label: '단위당 노무비', unit: `원/${units.qty}`, format: v => fmtNum(v, 1) },
    { key: 'overtimeDependency', label: '연장근무 의존도', unit: '', format: v => fmtPct(v) },
    { key: 'headcount', label: '생산직 인원', unit: '명', format: v => fmtNum(v, 1) },
    { key: 'qtyPerPerson', label: '인당 생산량', unit: `${quantityUnit(units.qty)}/인`, format: v => fmtNum(quantityValue(v, units.qty), 1) },
  ];
  const teamMetrics: Array<{key: MetricKey; label: string; unit: string}> = [
    {key:'headcount',label:'인원 (명)',unit:'명'}, {key:'laborCost',label:'노무비 (백만원)',unit:'백만'},
    {key:'unitLaborCost',label:`단위당 노무비 (원/${units.qty})`,unit:`원/${units.qty}`},
    {key:'extraHours',label:'연장근로시간 (h)',unit:'h'}, {key:'qtyPerPerson',label:`인당 생산량 (${quantityUnit(units.qty)}/인)`,unit:`${quantityUnit(units.qty)}/인`},
  ];
  return <SlideFrame plant={report.plant} title="인력 · 노무비" month={report.month} page={page} total={total}
    sources="인원·노무비·근로시간: 임금시간생산성 · 생산량: product-cst · 전년 대비 = 전년동월 대비 · %p = 비율 차이">
    {!labor || labor.status === 'error' ? <EmptySlideBody title="인력·노무비 데이터를 불러오지 못했습니다" detail={labor?.error ?? report.costError ?? '원가 API에 인력·노무비 연동이 필요합니다.'} /> :
      <div className="flex h-full flex-col gap-2">
        <div className="flex items-center justify-between text-[18px] text-[var(--ink-2)]">
          <span>집계 범위: {labor.scope}{report.plant !== 'K1' ? ' · FD·분말스프 제외' : ''}</span>
          <span>당월 노무비 {fmtNum(s?.laborCost)}원 · 생산량 {formatQuantity(s?.qty, units.qty)}{quantityUnit(units.qty)}</span>
        </div>
        <div className="rounded-xl border border-[var(--line)] bg-[var(--navy-tint)] px-5 py-3">
          {[{label:'전월 대비',base:labor.prevMonth},{label:'전년 대비',base:labor.prevYear}].map(p=>{
            const readout=laborReadout(s,p.base);
            return <div key={p.label} className="flex items-baseline gap-5 text-[18px] leading-[1.7]">
              <strong className="w-[90px] shrink-0 text-[var(--navy)]">{p.label}</strong><span>{readout.inputs}</span><span className="text-[var(--ink-3)]">→</span><strong>{readout.outcomes}</strong>
            </div>;
          })}
          <p className="mt-1 text-[17px] font-medium text-[var(--navy)]">전월 해석: {laborInterpretation(s,labor.prevMonth)}</p>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {metrics.map(m => <div className="panel !p-4" key={m.key}>
            <div className="panel-title">{m.label}</div>
            <div className="num my-1 text-[34px] font-semibold">{m.format(s?.[m.key])}<span className="ml-2 text-[16px] font-normal">{m.unit}</span></div>
            <div className="mb-2 text-[14px] text-[var(--ink-3)]">전월 {m.format(labor.prevMonth?.[m.key])} · 전년 {m.format(labor.prevYear?.[m.key])}</div>
            <Comparison label="전월 대비" metric={m.key} value={m.key === 'qtyPerPerson' ? quantityValue(s?.[m.key], units.qty) : s?.[m.key]} base={m.key === 'qtyPerPerson' ? quantityValue(labor.prevMonth?.[m.key], units.qty) : labor.prevMonth?.[m.key]} unit={m.unit}/>
            <Comparison label="전년 대비" metric={m.key} value={m.key === 'qtyPerPerson' ? quantityValue(s?.[m.key], units.qty) : s?.[m.key]} base={m.key === 'qtyPerPerson' ? quantityValue(labor.prevYear?.[m.key], units.qty) : labor.prevYear?.[m.key]} unit={m.unit}/>
          </div>)}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="panel !px-5 !py-3">
            <div className="panel-title">단위당 노무비 <small>실적(적색) · 전년동월(회색) / 원/{units.qty}</small></div>
            <TrendLine12 allowZero labelEvery={2} months={labor.series.months} current={labor.series.current.map(p => p.unitLaborCost)} previous={labor.series.prevYear.map(p => p.unitLaborCost)} width={800} height={145} digits={1} />
          </div>
          <div className="panel !px-5 !py-3">
            <div className="panel-title">연장근무 의존도 <small>실적(적색) · 전년동월(회색) / %</small></div>
            <TrendLine12 allowZero labelEvery={2} months={labor.series.months} current={labor.series.current.map(p => p.overtimeDependency === null ? null : p.overtimeDependency * 100)} previous={labor.series.prevYear.map(p => p.overtimeDependency === null ? null : p.overtimeDependency * 100)} width={800} height={145} digits={1} />
          </div>
        </div>
        <div className="panel !px-5 !py-3">
          <div className="panel-title mb-2">팀별 증감 <small>당월 실적 · 전월/전년 대비 · 인원·노무비 총액의 증감은 중립 표시</small></div>
          <table className="tbl tbl-compact" style={{tableLayout:'fixed'}}><thead><tr><th className="w-[100px]">팀</th>{teamMetrics.map(m=><th key={m.key}>{m.label}</th>)}</tr></thead>
            <tbody>{labor.teams.map(t => <tr key={t.team}><td className="font-semibold">{t.team}</td>{teamMetrics.map(m=>{
              const scale=m.key==='laborCost'?1e6:m.key==='qtyPerPerson'?quantityScale(units.qty):1;
              const value=t[m.key] == null ? null : t[m.key]!/scale;
              const prev=t.prevMonth?.[m.key], year=t.prevYear?.[m.key];
              return <td key={m.key}><div className="num flex flex-wrap items-baseline justify-end gap-x-3">
                <strong>{fmtNum(value,1)}</strong>
                {m.key === 'unitLaborCost' && <span className="text-[12px] font-normal text-[var(--ink-3)]">전월 {fmtNum(prev,1)} · 전년 {fmtNum(year,1)}</span>}
              </div>
                <Comparison compact label="전월" metric={m.key} value={value} base={prev==null?null:prev/scale} unit={m.unit}/>
                <Comparison compact label="전년" metric={m.key} value={value} base={year==null?null:year/scale} unit={m.unit}/>
              </td>;
            })}</tr>)}</tbody>
          </table>
        </div>
        <div className="text-[14px] text-[var(--ink-3)]">{labor.warnings.join(' · ')} · 단위당 노무비 = 노무비 ÷ 동일 팀 생산량 (낮을수록 개선) · 기준값 0이면 증감률은 –로 표시합니다.</div>
      </div>}
  </SlideFrame>;
}
