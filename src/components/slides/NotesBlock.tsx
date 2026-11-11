import { noteNeedsDetail, wrapNoteLines, type NoteDetailPage } from '@/domain/notes-layout';
import { NoteLineView } from './NoteLineView';
import { SlideFrame } from './SlideFrame';
import type { PlantReport } from '@/domain/report';
import { monthLabel, nextMonth } from "@/domain/month";
import { parseNoteLines } from "@/domain/notes-format";
import type { PlantNotes } from "@/domain/types";

/** 슬라이드 우측 하단 — 당월 개선활동 / 익월 추진계획. 실무자가 /edit 에서 작성한다. */
export function NotesBlock({ notes, month, compact = false }: { notes: PlantNotes; month: string; compact?: boolean }) {
  const sections = [
    { key: "improvement" as const, title: `${monthLabel(month)} 주요 개선활동` },
    { key: "plan" as const, title: `${monthLabel(nextMonth(month))} 중점 추진계획` },
  ];
  const parsed = sections.map((s) => ({ ...s, lines: wrapNoteLines(parseNoteLines(notes[s.key].body), 38) }));
  const details = noteNeedsDetail(notes);
  const visible = parsed.map(s => ({ ...s, lines: details ? s.lines.slice(0, 4) : s.lines }));
  const totalRows = visible.reduce((n,s) => n + s.lines.length, 0);
  const size = compact ? (totalRows > 8 ? 14 : 16) : 18;
  return (
    <div className={`panel h-full min-h-0 flex flex-col gap-3 ${compact ? '!p-4' : ''}`}>
      {visible.map((s) => (
        <div key={s.key} className="min-h-0" style={{ flex: s.lines.length ? `${s.lines.length + 2} 1 0` : '0 0 auto' }}>
          <div className="panel-title mb-2">
            ▣ {s.title}
            {notes[s.key].updatedBy && <small>{notes[s.key].updatedBy}</small>}
          </div>
          {s.lines.length ? (
            <div className="flex flex-col gap-[3px] text-[var(--ink)]">
              {s.lines.map((l, i) => <NoteLineView key={i} line={l} size={size} />)}
            </div>
          ) : (
            <div className="text-[17px] text-[var(--ink-3)]">아직 작성되지 않았습니다.</div>
          )}
        </div>
      ))}
      {details && <div className="shrink-0 border-t border-[var(--line)] pt-1 text-[13px] text-[var(--navy)]">노트 요약 · 전체 내용은 다음 노트 상세 페이지에서 이어집니다.</div>}
    </div>
  );
}


export function SlidePlantNotes({ report, detail, page, total }: { report: PlantReport; detail: NoteDetailPage; page: number; total: number }) {
  const title = detail.section === 'improvement' ? `${monthLabel(report.month)} 주요 개선활동` : `${monthLabel(nextMonth(report.month))} 중점 추진계획`;
  return <SlideFrame plant={report.plant} title={`${title} · 노트 상세${detail.count > 1 ? ` (${detail.index+1}/${detail.count})` : ''}`} month={report.month} page={page} total={total}>
    <div className="panel h-full">
      <div className="panel-title mb-4">{report.notes[detail.section].updatedBy ?? '작성 노트'} <small>전체 내용 · 긴 노트는 다음 장으로 이어집니다.</small></div>
      <div className="flex flex-col gap-[5px]">{detail.lines.map((line,i) => <NoteLineView key={i} line={line} size={22}/>)}</div>
    </div>
  </SlideFrame>;
}
