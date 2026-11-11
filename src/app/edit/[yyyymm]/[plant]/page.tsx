import Link from "next/link";
import { notFound } from "next/navigation";
import { NotesEditor } from "@/components/editor/NotesEditor";
import { monthLabel, nextMonth, parseYyyymm } from "@/domain/month";
import { isPlant, PLANT_LABEL } from "@/domain/plants";
import { canEditNotes } from "@/lib/auth/roles";
import { getSession } from "@/lib/auth/session";
import { getHistory, getNotes } from "@/lib/notes/repo";

export const dynamic = "force-dynamic";

export default async function EditPage({ params }: { params: Promise<{ yyyymm: string; plant: string }> }) {
  const { yyyymm, plant } = await params;
  const month = parseYyyymm(yyyymm);
  const p = plant.toUpperCase();
  if (!month || !isPlant(p)) notFound();

  const [session, { notes, error }, history] = await Promise.all([getSession(), getNotes(month, [p]), getHistory(p, month)]);
  const editable = canEditNotes(session, p);

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-10 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">ISSUE NOTES · {monthLabel(month, true)}</div>
          <h1 className="mt-2 text-3xl font-semibold">{PLANT_LABEL[p]} 이슈 · 계획 작성</h1>
          <p className="mt-2 text-[var(--ink-2)]">여기 쓴 내용이 보고서 요약 장의 오른쪽 아래에 그대로 들어갑니다.</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/?month=${month}`} className="btn">홈</Link>
          <Link href={`/report/${yyyymm}/${p}`} className="btn btn-gold">발표로 보기</Link>
        </div>
      </div>

      {!editable && (
        <p className="mt-6 rounded-lg bg-[var(--navy-tint)] px-4 py-3 text-sm text-[var(--navy)]">
          읽기 전용입니다. {session?.role === "CEO" ? "CEO 계정은 열람만 가능합니다." : "다른 공장 소속 계정은 이 공장 노트를 수정할 수 없습니다."}
        </p>
      )}
      {error && <p className="mt-6 text-sm text-[var(--bad)]">{error}</p>}

      <div className="mt-8 flex flex-col gap-6">
        <NotesEditor
          key={`imp-${notes[p].improvement.version}`}
          title={`${monthLabel(month)} 주요 개선활동`}
          note={notes[p].improvement}
          editable={editable && !error}
          placeholder={"-. 원료육 단체급식 절단 제품 판매 (10월 초~)\n-. 10각 몰드 세절기 → 15각 몰드 변경 후 적용 (10/15)"}
        />
        <NotesEditor
          key={`plan-${notes[p].plan.version}`}
          title={`${monthLabel(nextMonth(month))} 중점 추진계획`}
          note={notes[p].plan}
          editable={editable && !error}
          placeholder={"1. 생산량 : 9,790톤 (전년대비 4.0% 증가)\n2. 개선 계획\n  -. 부산물 간 생산 프로세스 개선 진행 (11/10)"}
        />
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">수정 이력</h2>
        {history.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--ink-3)]">이력이 없습니다.</p>
        ) : (
          <ul className="mt-3 divide-y divide-[var(--line)] rounded-lg border border-[var(--line)] bg-white">
            {history.map((h, i) => (
              <li key={i} className="px-4 py-3 text-sm">
                <div className="flex flex-wrap justify-between gap-2 text-[var(--ink-2)]">
                  <span>{h.section === "improvement" ? "개선활동" : "추진계획"} · v{h.version} · {h.editedBy}</span>
                  <span className="num text-[var(--ink-3)]">{h.editedAt.toISOString().slice(0, 16).replace("T", " ")} UTC</span>
                </div>
                <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-[var(--ink-3)]">{h.body || "(빈 내용)"}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
