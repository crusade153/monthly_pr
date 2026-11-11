// 표지와 TOTAL. TOTAL 은 금액(원)·시간(분)만 — 공장 간 물량·단가는 단위가 달라 합치지 않는다.
import { CompareBars } from "@/components/charts/charts";
import { deltaTone, fmtNum, fmtSigned, fmtWon, fmtWonSigned, nz, pctDelta } from "@/domain/derived";
import { monthLabel } from "@/domain/month";
import { PLANT_DESC, UNITS } from "@/domain/plants";
import type { PlantReport, TotalReport } from "@/domain/report";
import { SlideFrame } from "./SlideFrame";

export function SlideCover({ month, reports, page, total }: { month: string; reports: PlantReport[]; page: number; total: number }) {
  const asOf = reports.map((r) => r.asOf).filter(Boolean).sort().at(-1) ?? null;
  return (
    <section className="slide" aria-label="표지">
      {/* 배경 모티프: 세 공장을 가는 선으로 — 장식은 숫자를 가리지 않는 선에서만 */}
      <svg className="absolute inset-0" width={1920} height={1080} aria-hidden>
        <defs>
          <linearGradient id="cv" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="var(--navy)" />
            <stop offset="1" stopColor="var(--navy-2)" />
          </linearGradient>
        </defs>
        <rect width={1920} height={1080} fill="url(#cv)" />
        {Array.from({ length: 14 }, (_, i) => (
          <line key={i} x1={1080 + i * 64} y1={0} x2={1080 + i * 64 - 420} y2={1080} stroke="#ffffff" strokeOpacity={0.05} strokeWidth={2} />
        ))}
        <rect x={0} y={1040} width={1920} height={40} fill="var(--gold)" />
      </svg>
      <div className="absolute left-[120px] top-[200px] text-white">
        <div className="num text-[20px] tracking-[0.3em] text-[var(--gold)]">MONTHLY MANAGEMENT REPORT</div>
        <h1 className="mt-6 text-[96px] font-bold leading-[1.05]">생산부문<br />월간 경영보고</h1>
        <div className="mt-8 flex items-center gap-5">
          <span data-morph="month-badge" className="inline-block rounded-full bg-white px-6 py-2 text-[30px] font-semibold text-[var(--navy)]">
            {monthLabel(month, true)}
          </span>
          {asOf && <span className="text-[22px] text-white/70">실적 기준일 {asOf}</span>}
        </div>
      </div>
      <div className="absolute bottom-[130px] left-[120px] right-[120px] grid grid-cols-3 gap-8">
        {reports.map((r) => {
          const s = r.cost?.summary.current;
          const d = s ? pctDelta(s.mfgUnit, s.targetMfgUnit) : null;
          return (
            <div key={r.plant} className="rounded-2xl border border-white/20 bg-white/[0.06] px-8 py-6 text-white">
              <div className="flex items-baseline justify-between">
                <span data-morph={r.plant === "K1" ? "plant-title" : undefined} className="inline-block text-[44px] font-bold">{r.plant}</span>
                <span className="text-[18px] text-white/60">{PLANT_DESC[r.plant]}</span>
              </div>
              <div className="mt-3 text-[18px] text-white/60">제조원가 {UNITS[r.plant].cost}</div>
              <div className="flex items-baseline gap-4">
                <span className="num text-[40px] font-semibold">{s?.mfgUnit ? fmtNum(s.mfgUnit, 1) : "–"}</span>
                {d !== null && (
                  <span className="num text-[22px]" style={{ color: deltaTone("cost", d) === "good" ? "#8fd6a8" : deltaTone("cost", d) === "bad" ? "#ff9aa8" : "#ffffffaa" }}>
                    목표 {fmtSigned(d, 1, "%")}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="absolute bottom-[52px] right-[72px] num text-[16px] text-white/60" data-morph="page-no">{page} / {total}</div>
    </section>
  );
}

export function SlideTotal({ month, totalReport, page, total }: { month: string; totalReport: TotalReport; page: number; total: number }) {
  const { rows, sum } = totalReport;
  const diff = sum.mfg - sum.targetMfg;
  const kpis = [
    { label: "총 제조원가", value: fmtWon(sum.mfg), sub: `목표 ${fmtWon(sum.targetMfg)}` },
    { label: "목표 대비", value: fmtWonSigned(diff), sub: `${fmtSigned(pctDelta(sum.mfg, sum.targetMfg), 1, "%")}`, tone: deltaTone("cost", diff) },
    { label: "전년동월 대비", value: sum.prevYearMfg === null ? "–" : fmtWonSigned(sum.mfg - sum.prevYearMfg), sub: `${fmtSigned(pctDelta(sum.mfg, sum.prevYearMfg), 1, "%")} (물량 변동 포함)` },
    { label: "원가율 (판매대상)", value: totalReport.costRatio === null ? "–" : `${totalReport.costRatio.toFixed(1)}%`, sub: totalReport.targetCostRatio === null ? "" : `목표 ${totalReport.targetCostRatio.toFixed(1)}%`, tone: deltaTone("cost", totalReport.costRatio !== null && totalReport.targetCostRatio !== null ? totalReport.costRatio - totalReport.targetCostRatio : null) },
    { label: "재료비 개선잠재", value: fmtWon(sum.improvement), sub: "목표 초과 품목 합 (상계 없음)" },
    { label: "비계획정지", value: sum.downtimeMinutes === null ? "–" : `${fmtNum(sum.downtimeMinutes)}분`, sub: "생산일보 기준" },
  ];
  return (
    <SlideFrame title="생산부문 종합" month={month} page={page} total={total} sources="금액(원)·시간(분)만 합산 — 공장별 물량 단위(kg·식)가 달라 물량·단가는 공장 장에서 봅니다">
      <div className="grid h-full gap-6" style={{ gridTemplateRows: "150px 360px 1fr" }}>
        <div className="grid grid-cols-6 gap-4">
          {kpis.map((k) => (
            <div key={k.label} className="panel flex flex-col justify-center !py-4">
              <div className="kicker">{k.label}</div>
              <div className={`num mt-1 text-[34px] font-bold ${k.tone ? `tone-${k.tone}` : ""}`}>{k.value}</div>
              <div className="num text-[15px] text-[var(--ink-3)]">{k.sub}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-6">
          {rows.map((r) => (
            <div key={r.plant} className="panel flex flex-col">
              <div className="panel-title">▣ {r.plant} 제조원가 <small>억원</small></div>
              <CompareBars width={500} height={290} format={(v) => (v / 1e8).toLocaleString("ko-KR", { maximumFractionDigits: 1 })} items={[
                { label: "전년동월", value: nz(r.prevYearMfg), color: "var(--s-prev)" },
                { label: "목표", value: nz(r.targetMfg), color: "var(--s-target)" },
                { label: "실적", value: nz(r.mfg), color: "var(--s-actual)", emphasis: true },
              ]} />
            </div>
          ))}
        </div>
        <div className="panel">
          <div className="panel-title mb-2">▣ 공장별 금액 차이 <small>실적 − 목표 · 빨강 = 초과</small></div>
          <table className="tbl !text-[19px]">
            <thead>
              <tr><th>공장</th><th>제조원가</th><th>목표</th><th>목표대비</th><th>재료비 차이</th><th>가공비 차이</th><th>재료비 개선잠재</th><th>원가율</th><th>비계획정지</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.plant}>
                  <td className="font-semibold">{r.plant}</td>
                  <td className="num">{r.hasCost ? fmtWon(r.mfg) : "–"}</td>
                  <td className="num text-[var(--ink-3)]">{fmtWon(nz(r.targetMfg))}</td>
                  <td className={`num tone-${deltaTone("cost", pctDelta(r.mfg, r.targetMfg))}`}>{fmtSigned(pctDelta(r.mfg, r.targetMfg), 1, "%")}</td>
                  <td className={`num tone-${deltaTone("cost", r.matDiff)}`}>{fmtWonSigned(r.matDiff)}</td>
                  <td className={`num tone-${deltaTone("cost", r.procDiff)}`}>{fmtWonSigned(r.procDiff)}</td>
                  <td className="num">{fmtWon(r.improvement)}</td>
                  <td className="num">{r.salesAmt > 0 ? `${((r.salesMfg / r.salesAmt) * 100).toFixed(1)}%` : "–"}</td>
                  <td className="num">{r.downtimeMinutes === null ? "–" : `${fmtNum(r.downtimeMinutes)}분`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SlideFrame>
  );
}
