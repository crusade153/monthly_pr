import type { NoteLine } from "@/domain/notes-format";

export function NoteLineView({ line, size }: { line: NoteLine; size: number }) {
  const date = "date" in line && line.date ? (
    <span className="num ml-2 inline-block max-w-full whitespace-normal [overflow-wrap:anywhere] rounded bg-[var(--navy-tint)] px-2 py-[1px] text-[0.8em] text-[var(--navy)]">{line.date}</span>
  ) : null;
  if (line.kind === "heading") return <div className="mt-1 [overflow-wrap:anywhere] font-semibold text-[var(--navy)]" style={{ fontSize: size }}>■ {line.text}</div>;
  if (line.kind === "bullet")
    return (
      <div className="flex gap-2 leading-snug" style={{ fontSize: size, paddingLeft: line.depth ? 22 : 0 }}>
        <span className="shrink-0 text-[var(--gold)]">–</span>
        <span className="min-w-0 [overflow-wrap:anywhere]">{line.text}{date}</span>
      </div>
    );
  if (line.kind === "number")
    return (
      <div className="flex gap-2 leading-snug" style={{ fontSize: size }}>
        <span className="num shrink-0 text-[var(--navy)]">{line.num}.</span>
        <span className="min-w-0 [overflow-wrap:anywhere]">{line.text}{date}</span>
      </div>
    );
  return <div className="leading-snug [overflow-wrap:anywhere]" style={{ fontSize: size }}>{line.text}{date}</div>;
}

