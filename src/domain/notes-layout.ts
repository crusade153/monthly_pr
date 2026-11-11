import { parseNoteLines, type NoteLine } from './notes-format';
import type { PlantNotes, NoteSection } from './types';

export const NOTE_PREVIEW_ROWS = 11;

// 고정 슬라이드에서 긴 문장도 안전하게 줄바꿈한다. 원문 문자열은 삭제하지 않는다.
export function wrapNoteLines(lines: NoteLine[], width: number): NoteLine[] {
  return lines.flatMap(line => {
    const chars = Array.from(line.text);
    const chunks: NoteLine[] = [];
    for (let i = 0; i < Math.max(chars.length, 1); i += width) {
      const text = chars.slice(i, i + width).join('');
      const last = i + width >= chars.length;
      if (i === 0) chunks.push({ ...line, text, ...('date' in line ? { date: last ? line.date : null } : {}) });
      else chunks.push({ kind: 'text', text, date: last && 'date' in line ? line.date : null });
    }
    return chunks;
  });
}

export function noteNeedsDetail(notes: PlantNotes): boolean {
  return (['improvement', 'plan'] as const).reduce((sum,key) =>
    sum + Math.max(1, wrapNoteLines(parseNoteLines(notes[key].body), 38).length), 0) > NOTE_PREVIEW_ROWS;
}

export interface NoteDetailPage { section: NoteSection; lines: NoteLine[]; index: number; count: number }
export function noteDetailPages(notes: PlantNotes): NoteDetailPage[] {
  if (!noteNeedsDetail(notes)) return [];
  return (['improvement', 'plan'] as const).flatMap(section => {
    const lines = wrapNoteLines(parseNoteLines(notes[section].body), 58);
    const count = Math.ceil(lines.length / 20);
    return Array.from({ length: count }, (_,index) => ({ section, lines: lines.slice(index*20,(index+1)*20), index, count }));
  });
}
