import Link from "next/link";
import { logoutAction } from "@/app/login/actions";
import { deltaTone, fmtNum, fmtPct, fmtSigned, pctDelta } from "@/domain/derived";
import { currentMonthSeoul, monthLabel, MONTH_RE, prevMonth, recentMonths, toSeg } from "@/domain/month";
import { PLANT_DESC, UNITS } from "@/domain/plants";
import { canEditNotes } from "@/lib/auth/roles";
import { getSession } from "@/lib/auth/session";
import { loadMonth } from "@/lib/load-report";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const sp = await searchParams;
  // 기본: 마감된 직전 달 (당월은 실적이 쌓이는 중)
  const month = sp.month && MONTH_RE.test(sp.month) ? sp.month : prevMonth(currentMonthSeoul());
  const [bundle, session] = await Promise.all([loadMonth(month), getSession()]);
  const seg = toSeg(month);

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-10 sm:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">MONTHLY MANAGEMENT REPORT · 생산부문</div>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{monthLabel(month, true)} 생산부문 보고</h1>
          <p className="mt-2 text-[var(--ink-2)]">원가·생산일보 숫자는 자동으로 채워지고, 공장별 개선활동·추진계획만 작성하면 보고가 완성됩니다.</p>
        </div>
        <div className="flex items-center gap-3 text-sm text-[var(--ink-2)]">
          {session && <span>{session.name} · {session.role}</span>}
          <form action={logoutAction}><button className="btn" type="submit">로그아웃</button></form>
        </div>
      </header>

      <nav className="mt-8 flex gap-2 overflow-x-auto pb-2" aria-label="보고 월">
        {recentMonths(13).map((m) => (
          <Link key={m} href={`/?month=${m}`}
            className={`btn whitespace-nowrap !py-1.5 ${m === month ? "btn-primary" : ""}`}>
            {m.slice(2).replace("-", ".")}
          </Link>
        ))}
      </nav>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={`/report/${seg}`} className="btn btn-gold">▶ 발표 모드 (전체 {2 + bundle.reports.length * 4 + (bundle.reports.some(r => r.plant === 'K1') ? 1 : 0)}장)</Link>
        <Link href={`/print/${seg}`} className="btn">인쇄 · PDF</Link>
        {session?.role === '전체관리자' && <Link href={`/admin/capacity?month=${month}`} className="btn">풀 CAPA 관리</Link>}
      </div>

      {bundle.notesError && <p className="mt-4 text-sm text-[var(--bad)]">{bundle.notesError}</p>}

      <section className="mt-8 grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))" }}>
        {bundle.reports.map((r) => {
          const s = r.cost?.summary.current;
          const d = s ? pctDelta(s.mfgUnit, s.targetMfgUnit) : null;
          const pt = r.ops?.plantTotal;
          const editable = canEditNotes(session, r.plant);
          return (
            <article key={r.plant} className="card card-hover flex flex-col p-6">
              <div className="flex items-baseline justify-between">
                <h2 className="text-2xl font-bold text-[var(--navy)]">{r.plant}</h2>
                <span className="text-sm text-[var(--ink-3)]">{PLANT_DESC[r.plant]}</span>
              </div>

              {r.costError ? (
                <p className="mt-4 text-sm text-[var(--bad)]">{r.costError}</p>
              ) : (
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <div>
                    <dt className="text-[var(--ink-3)]">제조원가 ({UNITS[r.plant].cost})</dt>
                    <dd className="num text-xl font-semibold">{s?.mfgUnit ? fmtNum(s.mfgUnit, 1) : "–"}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--ink-3)]">목표대비</dt>
                    <dd className={`num text-xl font-semibold tone-${deltaTone("cost", d)}`}>{fmtSigned(d, 1, "%")}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--ink-3)]">풀 CAPA 가동률</dt>
                    <dd className="text-sm">{r.capacity?.rows.map(c => <div key={c.key}>{c.label} <span className="num">{fmtPct(c.rate)}</span></div>)}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--ink-3)]">계획달성률</dt>
                    <dd className="num text-lg">{r.opsError ? "–" : fmtPct(pt?.achievementRate)}</dd>
                  </div>
                </dl>
              )}
              {r.opsError && <p className="mt-2 text-sm text-[var(--bad)]">{r.opsError}</p>}

              <div className="mt-5 border-t border-[var(--line)] pt-4 text-sm">
                {(["improvement", "plan"] as const).map((k) => {
                  const n = r.notes[k];
                  return (
                    <div key={k} className="flex items-center justify-between py-1">
                      <span>{k === "improvement" ? `${monthLabel(month)} 개선활동` : "익월 추진계획"}</span>
                      {n.body.trim() ? (
                        <span className="badge bg-[var(--good-tint)] text-[var(--good)]">
                          작성됨{n.updatedBy ? ` · ${n.updatedBy}` : ""}{n.updatedAt ? ` · ${n.updatedAt.slice(5, 10).replace("-", "/")}` : ""}
                        </span>
                      ) : (
                        <span className="badge bg-[var(--gold-tint)] text-[var(--ink-2)]">미작성</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Link href={`/report/${seg}/${r.plant}`} className="btn !py-1.5">발표 {r.plant === 'K1' ? 5 : 4}장</Link>
                <Link href={`/edit/${seg}/${r.plant}`} className={`btn !py-1.5 ${editable ? "btn-primary" : ""}`}>
                  {editable ? "노트 작성" : "노트 보기"}
                </Link>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
