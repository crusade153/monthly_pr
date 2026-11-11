// 실무자가 쓰는 텍스트를 슬라이드용 줄로 바꾼다 (마크다운 대신 회의자료 관례).
//   "-. 원료육 단체급식 판매 (10월 초~)"  → 글머리 + 날짜 배지
//   "1. 생산량 : 9,790톤"                → 번호 줄
//   "[설비]" 또는 "■ 설비"              → 소제목
export type NoteLine =
  | { kind: "heading"; text: string }
  | { kind: "bullet"; text: string; date: string | null; depth: number }
  | { kind: "number"; num: string; text: string; date: string | null }
  | { kind: "text"; text: string; date: string | null };

const BULLET = /^(\s*)(-\.|-|•|·|\*)\s*/;
const NUMBER = /^\s*(\d{1,2})[.)]\s+/;
const HEADING = /^\s*(?:\[(.+)\]|■\s*(.+))\s*$/;
// 줄 끝 괄호 안의 날짜 표기: (10/15), (11월 10일), (10월 초~), (11/03~11/05), (11월 중순)
const DATE_TAIL = /\s*\(([^()]*(?:\d{1,2}\s*[/.월]\s*\d{0,2}\s*일?|초|중순|말|중)[^()]*)\)\s*$/;

function splitDate(text: string): { text: string; date: string | null } {
  const m = DATE_TAIL.exec(text);
  if (!m) return { text: text.trim(), date: null };
  return { text: text.slice(0, m.index).trim(), date: m[1].trim() };
}

export function parseNoteLines(body: string): NoteLine[] {
  return body
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0)
    .map((raw): NoteLine => {
      const h = HEADING.exec(raw);
      if (h) return { kind: "heading", text: (h[1] ?? h[2]).trim() };
      const b = BULLET.exec(raw);
      if (b) {
        const { text, date } = splitDate(raw.slice(b[0].length));
        return { kind: "bullet", text, date, depth: b[1].length >= 2 ? 1 : 0 };
      }
      const n = NUMBER.exec(raw);
      if (n) {
        const { text, date } = splitDate(raw.slice(n[0].length));
        return { kind: "number", num: n[1], text, date };
      }
      const { text, date } = splitDate(raw);
      return { kind: "text", text, date };
    });
}

export const NOTE_HINT = [
  "-. 로 시작하면 글머리, 1. 로 시작하면 번호",
  "줄 끝 괄호 날짜는 배지로 표시: (11/10), (10월 초~)",
  "[소제목] 또는 ■ 소제목",
].join(" · ");
