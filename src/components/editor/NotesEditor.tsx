"use client";

import { NoteLineView } from '@/components/slides/NoteLineView';

import { useState, useTransition } from "react";
import { saveNoteAction, type SaveState } from "@/app/edit/[yyyymm]/[plant]/actions";
import { NOTE_HINT, parseNoteLines } from "@/domain/notes-format";
import type { NoteRecord } from "@/domain/types";

/** 한 섹션(개선활동 또는 추진계획) 편집기 — 왼쪽 입력, 오른쪽 슬라이드 미리보기 */
export function NotesEditor({ title, note, editable, placeholder }: { title: string; note: NoteRecord; editable: boolean; placeholder: string }) {
  const [body, setBody] = useState(note.body);
  const [version, setVersion] = useState(note.version);
  const [saved, setSaved] = useState(note.body);
  const [state, setState] = useState<SaveState>({ status: "idle" });
  const [pending, start] = useTransition();
  const dirty = body !== saved;

  const save = () =>
    start(async () => {
      const res = await saveNoteAction({ plant: note.plant, month: note.month, section: note.section, body, expectedVersion: version });
      setState(res);
      if (res.status === "saved") {
        setVersion(res.version);
        setSaved(body);
      }
    });

  const lines = parseNoteLines(body);

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-[var(--navy)]">▣ {title}</h2>
        <span className="text-xs text-[var(--ink-3)]">
          {note.updatedBy ? `최근 ${note.updatedBy} · ${note.updatedAt?.slice(0, 16).replace("T", " ")}` : "아직 작성 전"} · v{version}
        </span>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            readOnly={!editable}
            rows={10}
            placeholder={placeholder}
            aria-label={title}
            className="field num-free min-h-[240px] resize-y leading-relaxed"
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); if (editable && dirty) save(); }
            }}
          />
          <p className="mt-2 text-xs text-[var(--ink-3)]">{NOTE_HINT} · Ctrl+S 저장</p>
        </div>
        <div className="rounded-lg border border-[var(--line)] bg-[var(--base)] p-4" aria-label="미리보기">
          <div className="eyebrow mb-2">전체 내용 미리보기</div>
          {lines.length === 0 && <p className="text-sm text-[var(--ink-3)]">내용이 없습니다.</p>}
          <div className="flex flex-col gap-1.5 text-[15px]">
            {lines.map((line, i) => <NoteLineView key={i} line={line} size={15}/>)}
          </div>
        </div>
      </div>

      <p className="mt-3 text-sm text-[var(--ink-2)]">슬라이드는 작성량에 맞춰 공간을 배분합니다. 한 장에 담기 어려운 노트는 요약 뒤에 상세 페이지를 자동으로 추가하며, 인쇄에도 전체 내용이 포함됩니다.</p>
      {editable && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" className="btn btn-primary" onClick={save} disabled={pending || !dirty}>
            {pending ? "저장 중…" : dirty ? "저장" : "저장됨"}
          </button>
          {state.status === "saved" && !dirty && <span className="text-sm text-[var(--good)]">저장했습니다 (v{state.version})</span>}
          {state.status === "error" && <span className="text-sm text-[var(--bad)]">{state.message}</span>}
          {state.status === "conflict" && (
            <div className="w-full rounded-lg border border-[var(--warn)] bg-[var(--gold-tint)] p-3 text-sm">
              <p>
                다른 사람이 먼저 수정했습니다 ({state.current.updatedBy}, v{state.current.version}). 아래 최신 내용을 확인한 뒤 다시 저장하세요.
              </p>
              <pre className="mt-2 whitespace-pre-wrap rounded bg-white p-2 text-[13px]">{state.current.body || "(빈 내용)"}</pre>
              <div className="mt-2 flex gap-2">
                <button type="button" className="btn !py-1" onClick={() => { setBody(state.current.body); setSaved(state.current.body); setVersion(state.current.version); setState({ status: "idle" }); }}>
                  최신 내용 불러오기
                </button>
                <button type="button" className="btn !py-1" onClick={() => { setVersion(state.current.version); setState({ status: "idle" }); }}>
                  내 내용 유지하고 덮어쓰기 준비
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
