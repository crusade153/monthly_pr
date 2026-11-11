import { monthLabel, nextMonth } from "@/domain/month";
import { parseNoteLines, type NoteLine } from "@/domain/notes-format";
import type { PlantNotes } from "@/domain/types";

function Line({ line, size }: { line: NoteLine; size: number }) {
  const date = "date" in line && line.date ? (
    <span className="num ml-2 whitespace-nowrap rounded bg-[var(--navy-tint)] px-2 py-[1px] text-[0.8em] text-[var(--navy)]">{line.date}</span>
  ) : null;
  if (line.kind === "heading") return <div className="mt-1 font-semibold text-[var(--navy)]" style={{ fontSize: size }}>■ {line.text}</div>;
  if (line.kind === "bullet")
    return (
      <div className="flex gap-2 leading-snug" style={{ fontSize: size, paddingLeft: line.depth ? 22 : 0 }}>
        <span className="text-[var(--gold)]">–</span>
        <span>{line.text}{date}</span>
      </div>
    );
  if (line.kind === "number")
    return (
      <div className="flex gap-2 leading-snug" style={{ fontSize: size }}>
        <span className="num text-[var(--navy)]">{line.num}.</span>
        <span>{line.text}{date}</span>
      </div>
    );
  return <div className="leading-snug" style={{ fontSize: size }}>{line.text}{date}</div>;
}

/** 슬라이드 우측 하단 — 당월 개선활동 / 익월 추진계획. 실무자가 /edit 에서 작성한다. */
export function NotesBlock({ notes, month, compact = false }: { notes: PlantNotes; month: string; compact?: boolean }) {
  const sections = [
    { key: "improvement" as const, title: `${monthLabel(month)} 주요 개선활동` },
    { key: "plan" as const, title: `${monthLabel(nextMonth(month))} 중점 추진계획` },
  ];
  const parsed = sections.map((s) => ({ ...s, lines: parseNoteLines(notes[s.key].body) }));
  const most = Math.max(...parsed.map((p) => p.lines.length), 1);
  // 칸이 고정이라 줄이 많으면 글자를 줄인다. 인쇄도 같은 칸이다.
  const size = compact ? (most > 7 ? 14 : most > 5 ? 15 : 17) : most > 8 ? 15 : most > 6 ? 16 : 18;
  return (
    <div className="panel h-full flex flex-col gap-3 overflow-hidden">
      {parsed.map((s) => (
        <div key={s.key} className="min-h-0 flex-1 overflow-hidden">
          <div className="panel-title mb-2">
            ▣ {s.title}
            {notes[s.key].updatedBy && <small>{notes[s.key].updatedBy}</small>}
          </div>
          {s.lines.length ? (
            <div className="flex flex-col gap-[5px] text-[var(--ink)]">
              {s.lines.map((l, i) => <Line key={i} line={l} size={size} />)}
            </div>
          ) : (
            <div className="text-[17px] text-[var(--ink-3)]">아직 작성되지 않았습니다.</div>
          )}
        </div>
      ))}
    </div>
  );
}
