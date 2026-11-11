// 공장별 3장: P1 요약(벤치마크 구조) / P2 원가 / P3 생산운영.
// 숫자는 원천 API 값을 그대로 쓰고, 여기서는 비교·색·배치만 정한다.
import { BridgeWaterfall, CompareBars, HalfGauge, HBarTop, Spark, TrendLine12 } from "@/components/charts/charts";
import { Delta, RiskBadge, SourceError, toneColor } from "@/components/ui/bits";
import {
  attainment, deltaTone, fmtNum, fmtPct, fmtQty, fmtSigned, fmtWon, nz, pctDelta, toneOfAttainment,
} from "@/domain/derived";
import { monthLabel } from "@/domain/month";
import type { PlantReport } from "@/domain/report";
import type { CostReport, OpsReport } from "@/domain/types";
import { NotesBlock } from "./NotesBlock";
import { EmptySlideBody, SlideFrame } from "./SlideFrame";
import { CapacityPanel } from './CapacityPanel';

type Common = { report: PlantReport; page: number; total: number };

/** P2·P3 머리에 붙는 제조원가 칩 — P1 의 큰 숫자가 발표 모드에서 여기로 모핑된다 */
function HeadlineChip({ cost, unit }: { cost: CostReport | null; unit: string }) {
  if (!cost?.hasData) return null;
  const s = cost.summary.current;
  const d = pctDelta(s.mfgUnit, s.targetMfgUnit);
  return (
    <span data-morph="headline-kpi" className="inline-flex items-baseline gap-2 rounded-full border border-[var(--line-2)] px-4 py-[6px]">
      <span className="text-[16px] text-[var(--ink-3)]">제조원가</span>
      <span className="num text-[22px] font-semibold">{fmtNum(s.mfgUnit, 1)}</span>
      <span className="text-[15px] text-[var(--ink-3)]">{unit}</span>
      {d !== null && <span className={`num text-[17px] tone-${deltaTone("cost", d)}`}>목표 {fmtSigned(d, 1, "%")}</span>}
    </span>
  );
}

// ═════════════════════ P1 요약 ═════════════════════
function GaugePanel({
  title, value, target, prev, lowerIsBetter = false, fmt, detail,
}: {
  title: string; value: number | null; target: number | null; prev: number | null; lowerIsBetter?: boolean; fmt: (v: number | null) => string; detail?: string;
}) {
  const att = attainment(value, target, lowerIsBetter);
  const tone = toneOfAttainment(att);
  const color = tone === "good" ? "var(--good)" : tone === "bad" ? "var(--bad)" : "var(--gold)";
  return (
    <div className="panel flex flex-col items-center !px-3 !py-3">
      <div className="self-start text-[18px] font-semibold text-[var(--navy)]">{title}</div>
      <HalfGauge attainment={att} color={color} size={196} center={fmt(value)} sub={att === null ? "목표 없음" : `달성 ${att.toFixed(1)}%`} />
      <div className="num text-[14px] text-[var(--ink-2)]">목표 {fmt(target)} · 전년 {fmt(prev)}</div>
      {detail && <div className="num mt-1 text-center text-[13px] text-[var(--ink-2)]">{detail}</div>}
    </div>
  );
}

export function SlidePlantSummary({ report, page, total }: Common) {
  const { cost, ops, units, plant, month } = report;
  const frame = { plant, title: "생산부문 요약", month, page, total, asOf: report.asOf };
  if (report.empty) {
    // 휴지 달에도 실무자가 쓴 이슈·계획은 보고돼야 하므로 노트 칸은 남긴다
    return (
      <SlideFrame {...frame}>
        <div className="grid h-full gap-6" style={{ gridTemplateColumns: "1060px 1fr" }}>
          <EmptySlideBody title={`${monthLabel(month)} 생산 실적이 없습니다`} detail="원가·생산일보 모두 기록 없음" />
          <NotesBlock notes={report.notes} month={month} />
        </div>
      </SlideFrame>
    );
  }

  const s = cost?.summary.current ?? null;
  const py = cost?.summary.prevYear ?? null;
  const pm = cost?.summary.prevMonth ?? null;
  const pt = ops?.plantTotal ?? null;
  const tgt = ops?.teams.find((t) => pt?.primaryTeams.includes(t.team))?.targets ?? null;
  const qtyUnit = plant === "K1" ? "ton" : units.qty;
  const displayQty = (v: number | null | undefined) => fmtNum(v == null ? null : v / (plant === "K1" ? 1000 : 1), 1);
  const primary = ops?.teams.filter(t => pt?.primaryTeams.includes(t.team)) ?? [];
  const planQty = primary.reduce((a,t) => a + t.totals.planQty, 0);
  const actualQty = primary.reduce((a,t) => a + t.totals.actualQty, 0);
  const planHr = ops?.teams.reduce((a,t) => a + t.totals.planHr, 0) ?? 0;
  const k2Line1 = plant === "K2" ? cost?.lines.find((l) => l.line === "즉석밥1" && l.hasData) : undefined;

  return (
    <SlideFrame {...frame}>
      <div className="grid h-full gap-6" style={{ gridTemplateColumns: "1060px 1fr" }}>
        {/* ── 왼쪽: 원가·생산량 / 생산성 ── */}
        <div className="grid gap-6" style={{ gridTemplateRows: "380px 1fr" }}>
          {cost && s ? (
            <div className="grid grid-cols-2 gap-6">
              <div className="panel flex flex-col">
                <div className="panel-title">▣ 제조원가 <small>{units.cost}</small></div>
                <div className="flex items-end justify-between">
                  <CompareBars width={290} height={250} digits={1} items={[
                    { label: "전년", value: nz(py?.mfgUnit), color: "var(--s-prev)" },
                    { label: "전월", value: nz(pm?.mfgUnit), color: "var(--s-target)" },
                    { label: "실적", value: nz(s.mfgUnit), color: "var(--s-actual)", emphasis: true },
                  ]} />
                  <div className="flex flex-col gap-4 pb-6">
                    <span data-morph="headline-kpi" className="num inline-block text-[30px] font-bold leading-none">{fmtNum(s.mfgUnit, 1)}</span>
                    <Delta label="목표대비" metric="cost" value={pctDelta(s.mfgUnit, s.targetMfgUnit)} />
                    <Delta label="전년대비" metric="cost" value={pctDelta(s.mfgUnit, py?.mfgUnit)} />
                    <Delta label="전월대비" metric="cost" value={pctDelta(s.mfgUnit, pm?.mfgUnit)} size={18} />
                  </div>
                </div>
                {k2Line1 && <div className="kicker">즉석밥2 저가동 영향 제외 시 즉석밥1 {fmtNum(k2Line1.mfgUnit, 1)}{units.cost}</div>}
              </div>
              <div className="panel flex flex-col">
                <div className="panel-title">▣ 생산량 <small>{qtyUnit} · 가동 {s.opDays}일</small></div>
                <div className="flex items-end justify-between">
                  <CompareBars width={290} height={250} format={displayQty} items={[
                    { label: "전년", value: nz(py?.qty), color: "var(--s-prev)" },
                    { label: "전월", value: nz(pm?.qty), color: "var(--s-target)" },
                    { label: "실적", value: nz(s.qty), color: "var(--s-actual)", emphasis: true },
                  ]} />
                  <div className="flex flex-col gap-4 pb-6">
                    <Delta label="전년대비" metric="qty" value={pctDelta(s.qty, py?.qty)} />
                    <Delta label="전월대비" metric="qty" value={pctDelta(s.qty, pm?.qty)} />
                    <Delta label="계획대비" metric="qty" value={pt ? (pt.achievementRate - 1) * 100 : null} size={18} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <SourceError message={report.costError ?? "원가 데이터 없음"} />
          )}

          <div className="panel flex flex-col">
            <div className="panel-title">▣ 생산성 <small>{units.prod} · 12개월 추이 (빨강 실선 당해 · 회색 실선 전년 · 남색 점선 목표)</small></div>
            {cost && s ? (
              <div className="flex flex-1 items-center gap-6">
                <div className="flex w-[200px] flex-col gap-4">
                  <div>
                    <div className="kicker">실적</div>
                    <div className="num text-[44px] font-bold leading-none">{fmtNum(s.productivity, 1)}</div>
                  </div>
                  <div className="flex gap-6">
                    <Delta label="목표대비" metric="prod" value={pctDelta(s.productivity, s.targetProductivity)} />
                    <Delta label="전년대비" metric="prod" value={pctDelta(s.productivity, py?.productivity)} />
                  </div>
                  {cost.segments.map((g) => (
                    <div key={g.key} className="flex items-baseline justify-between border-t border-[var(--line)] pt-2 text-[16px]">
                      <span className="text-[var(--ink-2)]">{g.group}</span>
                      <span className={`num tone-${deltaTone("prod", pctDelta(g.current.productivity, g.current.targetProductivity))}`}>
                        {fmtNum(g.current.productivity, 1)}
                      </span>
                    </div>
                  ))}
                </div>
                <TrendLine12 width={740} height={300} digits={1}
                  months={cost.series.months}
                  current={cost.series.current.map((p) => (p.hasData ? p.prod : null))}
                  previous={cost.series.prevYear.map((p) => (p.hasData ? p.prod : null))}
                  target={cost.series.current.map((p) => (p.hasData ? nz(p.targetProd) : null))}
                />
              </div>
            ) : null}
          </div>
        </div>

        {/* ── 오른쪽: 게이지 4 / 노트 ── */}
        <div className="grid gap-6" style={{ gridTemplateRows: "auto 1fr" }}>
          <div className="grid grid-cols-2 gap-4">
            <GaugePanel title="수율" value={s?.yield ?? null} target={nz(s?.targetYield)} prev={nz(py?.yield)}
              fmt={(v) => (v === null ? "–" : `${v.toFixed(1)}%`)} />
            {ops && pt ? (
              <>
                <GaugePanel title="물량 계획달성률" detail={`계획 ${displayQty(planQty)} / 실적 ${displayQty(actualQty)} ${qtyUnit} · 생산일보`} value={pt.achievementRate} target={tgt?.achievementTarget ?? 0.98} prev={pt.prevYear?.achievementRate ?? null} fmt={(v) => fmtPct(v)} />
                <CapacityPanel report={report} compact />
                <GaugePanel title="비계획정지율" detail={`계획 ${fmtNum(planHr, 1)}h / 비계획 ${fmtNum(pt.downtimeMinutes / 60, 1)}h`} value={pt.downtimeRate} target={tgt?.downtimeTarget ?? 0.1} prev={pt.prevYear?.downtimeRate ?? null} lowerIsBetter fmt={(v) => fmtPct(v)} />
              </>
            ) : (
              <div className="col-span-1 row-span-2"><SourceError message={report.opsError ?? "생산일보 데이터 없음"} /></div>
            )}
          </div>
          <NotesBlock notes={report.notes} month={month} compact />
        </div>
      </div>
    </SlideFrame>
  );
}

// ═════════════════════ P2 원가 ═════════════════════
function BridgePanel({ title, bridge, unit, baseLabel }: { title: string; bridge: CostReport["bridge"]["mom"]; unit: string; baseLabel: string }) {
  if (!bridge) {
    return <div className="panel"><div className="panel-title">▣ {title}</div><div className="kicker mt-6">{baseLabel} 실적이 없어 비교하지 않습니다.</div></div>;
  }
  const top = bridge.details.slice(0, 3);
  return (
    <div className="panel flex flex-col overflow-hidden">
      <div className="panel-title flex-col !items-start !gap-1">
        <span>▣ {title}</span>
        <small className="num">{baseLabel} {fmtNum(bridge.baseUnit, 1)} → 당월 {fmtNum(bridge.currUnit, 1)} {unit}</small>
      </div>
      <BridgeWaterfall width={800} height={160} steps={[
        { label: "생산구성 영향", value: bridge.mixEffect },
        { label: "품목원가 영향", value: bridge.perfEffect },
        { label: "총 차이", value: bridge.diff, total: true },
      ]} />
      <div className="mt-2 flex flex-col gap-1">
        <div className="kicker">주요 품목 {top.length}개 · 녹색 − 하락 / 적색 + 상승 · 기여도 ({unit})</div>
        {top.map((d) => (
          <div key={d.productCode} className="flex min-w-0 justify-between gap-4 text-[15px] leading-tight">
            <span className="min-w-0 truncate" title={d.productName}>{d.productName}{d.isNew && <span className="ml-2 badge bg-[var(--gold-tint)] text-[var(--ink)] !text-[12px]">신규</span>}</span>
            <span className={`num whitespace-nowrap tone-${deltaTone("cost", d.totalImpact)}`}>{fmtSigned(d.totalImpact, 1)}<span className="ml-2 text-[12px] text-[var(--ink-3)]">{baseLabel} 단가 {fmtNum(d.baseUnitCost, 1)}→{fmtNum(d.unitCost, 1)}</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SlidePlantCost({ report, page, total }: Common) {
  const { cost, units, plant, month } = report;
  const frame = { plant, title: "원가 분석", month, page, total, asOf: report.asOf, headline: <HeadlineChip cost={cost} unit={units.cost} /> };
  if (!cost) return <SlideFrame {...frame}><SourceError message={report.costError ?? "원가 데이터 없음"} /></SlideFrame>;
  if (!cost.hasData) return <SlideFrame {...frame}><EmptySlideBody title={`${monthLabel(month)} 원가 실적이 없습니다`} /></SlideFrame>;

  const lines = cost.lines.filter((l) => l.hasData);
  const notes = cost.lines.filter((l) => l.note && l.hasData);
  return (
    <SlideFrame {...frame}>
      <div className="grid h-full gap-6" style={{ gridTemplateRows: "372px minmax(0, 1fr)" }}>
        <div className="grid grid-cols-2 gap-6">
          <BridgePanel title="전월 대비 단위원가 변동" bridge={cost.bridge.mom} unit={units.cost} baseLabel={`${monthLabel(cost.prevMonth)}`} />
          <BridgePanel title="목표 대비 단위원가 차이" bridge={cost.bridge.target} unit={units.cost} baseLabel="목표" />
        </div>
        <div className="grid min-h-0 gap-6" style={{ gridTemplateColumns: "1fr 700px" }}>
          <div className="panel overflow-hidden">
            <div className="panel-title mb-2">▣ 라인별 단위원가 <small>{units.cost} · 등급 = 재료비 목표 대비 차이율</small></div>
            <table className={`tbl tbl-compact ${lines.length > 9 ? "tbl-dense" : ""}`}>
              <thead>
                <tr><th>라인</th><th>생산량 ({plant === "K1" ? "TON" : units.qty})</th><th>제조원가</th><th>목표</th><th>목표대비</th><th>전월대비</th><th>재료비 관리</th><th>등급</th></tr>
              </thead>
              <tbody>
                {lines.map((l) => {
                  const vsT = pctDelta(l.mfgUnit, l.targetUnit);
                  const vsM = pctDelta(l.mfgUnit, l.prevMonth?.mfgUnit);
                  return (
                    <tr key={l.id}>
                      <td>{l.label}{l.note && " *"}</td>
                      <td className="num">{l.hasData ? (plant === "K1" ? fmtNum(l.qty / 1000, 1) : fmtQty(l.qty)) : "–"}</td>
                      <td className="num font-semibold">{l.hasData ? fmtNum(l.mfgUnit, 1) : "–"}</td>
                      <td className="num text-[var(--ink-3)]">{fmtNum(nz(l.targetUnit), 1)}</td>
                      <td className={`num tone-${deltaTone("cost", vsT)}`}>{fmtSigned(vsT, 1, "%")}</td>
                      <td className={`num tone-${deltaTone("cost", vsM)}`}>{fmtSigned(vsM, 1, "%")}</td>
                      <td className="num">{fmtSigned(l.overrunPct, 1, "%")}</td>
                      <td><RiskBadge level={l.level} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {notes.map((l) => <p key={l.id} className="mt-3 text-[14px] leading-snug text-[var(--ink-3)]">* {l.label}: {l.note}</p>)}
          </div>
          <div className="panel overflow-hidden">
            <div className="panel-title mb-2">
              ▣ 재료비 관리 · 목표 초과 Top 5
              <small>전체 {cost.risk.totalCount}건 · 개선잠재 {fmtWon(cost.risk.totalImprovement)}</small>
            </div>
            <table className="tbl">
              <thead><tr><th>품목</th><th>초과율</th><th>잠재액</th><th>등급</th></tr></thead>
              <tbody>
                {cost.risk.items.slice(0, 5).map((r) => (
                  <tr key={r.productCode}>
                    <td className="max-w-[330px] truncate" title={r.productName}>{r.productName}</td>
                    <td className="num tone-bad">{fmtSigned(r.overrunPct, 1, "%")}</td>
                    <td className="num">{fmtWon(r.improvement)}</td>
                    <td><RiskBadge level={r.level} /></td>
                  </tr>
                ))}
                {!cost.risk.items.length && <tr><td colSpan={4} className="!text-center text-[var(--ink-3)]">목표 초과 품목 없음</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SlideFrame>
  );
}

// ═════════════════════ P3 생산운영 ═════════════════════
function rateCell(value: number, target: number | null, lowerIsBetter = false) {
  const att = attainment(value, target, lowerIsBetter);
  const tone = att === null ? "flat" : toneOfAttainment(att);
  return <span className="num" style={{ color: toneColor(tone) }}>{fmtPct(value)}</span>;
}

export function SlidePlantOps({ report, page, total }: Common) {
  const { ops, plant, month, units, cost } = report;
  const frame = {
    plant, title: "생산 운영", month, page, total, asOf: report.asOf,
    sources: "운영: plog 생산일보(팀 대시보드와 같은 집계, 기본단위)",
    headline: <HeadlineChip cost={cost} unit={units.cost} />,
  };
  if (!ops) return <SlideFrame {...frame}><SourceError message={report.opsError ?? "생산일보 데이터 없음"} /></SlideFrame>;
  if (ops.plantTotal.reportCount === 0) return <SlideFrame {...frame}><EmptySlideBody title={`${monthLabel(month)} 작성된 생산일보가 없습니다`} /></SlideFrame>;

  const teams = ops.teams.filter((t) => t.reportCount > 0);
  const lines = teams.flatMap((t) => t.lines.filter((l) => l.planHr > 0 || l.actualQty > 0).map((l) => ({ ...l, team: t.displayName })));
  const merge = (pick: (t: OpsReport["teams"][number]) => OpsReport["teams"][number]["downtimeTop"]) => {
    const m = new Map<string, number>();
    teams.forEach((t) => pick(t).forEach((i) => m.set(i.type, (m.get(i.type) ?? 0) + i.qty)));
    const sum = [...m.values()].reduce((a, b) => a + b, 0);
    return [...m.entries()].map(([label, value]) => ({ label, value, share: sum ? value / sum : 0 })).sort((a, b) => b.value - a.value);
  };
  const series = ops.plantTotal.series;

  return (
    <SlideFrame {...frame}>
      <div className="grid h-full gap-6" style={{ gridTemplateRows: "auto minmax(0, 1fr)" }}>
        <div className="grid gap-6" style={{ gridTemplateColumns: '420px minmax(0, 1fr)' }}>
          <CapacityPanel report={report} compact />
          <div className="panel">
          <div className="panel-title mb-1">▣ 팀별 운영 지표 <small>생산일보 기준 · 인원·생산성은 별도 실적 장 참조</small></div>
          <table className="tbl">
            <thead>
              <tr><th>팀</th><th>일보</th><th>계획달성률</th><th>비계획정지율</th><th>불량률</th><th>스크랩률</th></tr>
            </thead>
            <tbody>
              {teams.map((t) => {
                return (
                  <tr key={t.team}>
                    <td className="font-medium">{t.displayName}</td>
                    <td className="num">{t.reportCount}</td>
                    <td>{rateCell(t.rates.achievementRate, t.targets.achievementTarget)}</td>
                    <td>{rateCell(t.rates.downtimeRate, t.targets.downtimeTarget, true)}</td>
                    <td className="num">{fmtPct(t.rates.defectRate, 2)}</td>
                    <td className="num">{fmtPct(t.rates.scrapRate, 2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>

        <div className="grid min-h-0 gap-6" style={{ gridTemplateColumns: "1fr 720px" }}>
          <div className="panel min-h-0 overflow-hidden">
            <div className="panel-title mb-1">▣ 라인별 계획 대비 실적 <small>시간 h · 수량은 기본단위</small></div>
            <table className={`tbl tbl-compact ${lines.length > 12 ? "tbl-dense" : ""}`}>
              <thead>
                <tr><th>라인</th><th>계획h</th><th>작업h</th><th>계획시간 대비</th><th>계획수량</th><th>실적수량</th><th>달성률</th><th>정지(분)</th></tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={`${l.team}-${l.line}`}>
                    <td><span className="text-[var(--ink-3)]">{l.team} · </span>{l.line}</td>
                    <td className="num">{fmtNum(l.planHr)}</td>
                    <td className="num">{fmtNum(l.actualHr)}</td>
                    <td className="num">{l.planHr ? fmtPct(l.actualHr / l.planHr) : '–'}</td>
                    <td className="num">{fmtQty(l.planQty)}</td>
                    <td className="num">{fmtQty(l.actualQty)}</td>
                    <td>{rateCell(l.planQty ? l.actualQty / l.planQty : 0, 0.98)}</td>
                    <td className="num">{fmtNum(l.downtimeMinutes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid min-h-0 gap-6" style={{ gridTemplateRows: "auto auto 1fr" }}>
            <div className="panel">
              <div className="panel-title mb-3">▣ 비계획정지 Top 5 <small>총 {fmtNum(ops.plantTotal.downtimeMinutes)}분</small></div>
              <HBarTop items={merge((t) => t.downtimeTop)} unit="분" color="var(--bad)" empty="비계획정지 기록 없음" />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="panel">
                <div className="panel-title mb-2">▣ 스크랩 Top 3</div>
                <MiniTop items={merge((t) => t.scrapTop)} />
              </div>
              <div className="panel">
                <div className="panel-title mb-2">▣ 불량 Top 3</div>
                <MiniTop items={merge((t) => t.defectTop)} />
              </div>
            </div>
            <div className="panel flex items-center justify-between">
              <div>
                <div className="panel-title">▣ 12개월 추이</div>
                <div className="kicker mt-1">계획달성률 · 생산일보 기준</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-3"><span className="num text-[18px]">{fmtPct(ops.plantTotal.achievementRate)}</span><Spark values={series.map((x) => (x.reportCount ? x.achievementRate : null))} width={240} color="var(--gold)" /></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SlideFrame>
  );
}

function MiniTop({ items }: { items: Array<{ label: string; value: number; share: number }> }) {
  if (!items.length) return <div className="kicker">기록 없음</div>;
  return (
    <div className="flex flex-col gap-1">
      {/* 스크랩·불량은 유형마다 단위(KG·EA)가 섞여 있어 수량·비중 대신 순위만 보인다 */}
      {items.slice(0, 3).map((i, n) => (
        <div key={i.label} className="flex gap-3 text-[16px]">
          <span className="num text-[var(--gold)]">{n + 1}</span>
          <span className="truncate">{i.label}</span>
        </div>
      ))}
    </div>
  );
}
