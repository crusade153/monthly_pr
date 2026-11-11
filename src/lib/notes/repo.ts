import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db, hasDatabase, schema, withTransaction } from "@/lib/db/client";
import type { NoteRecord, NoteSection, PlantCode, PlantNotes } from "@/domain/types";

const SECTIONS: NoteSection[] = ["improvement", "plan"];

const empty = (plant: PlantCode, month: string, section: NoteSection): NoteRecord => ({
  plant, month, section, body: "", version: 0, updatedBy: null, updatedAt: null,
});

/** 한 달 · 여러 공장의 노트. DB 미구성/조회 실패면 빈 노트(보고서는 숫자만으로라도 그린다). */
export async function getNotes(month: string, plants: PlantCode[]): Promise<{ notes: Record<PlantCode, PlantNotes>; error: string | null }> {
  const notes = Object.fromEntries(
    plants.map((p) => [p, { improvement: empty(p, month, "improvement"), plan: empty(p, month, "plan") }]),
  ) as Record<PlantCode, PlantNotes>;
  if (!hasDatabase) return { notes, error: "DATABASE_URL 미설정 — 노트를 불러오지 못했습니다." };
  try {
    const rows = await db
      .select()
      .from(schema.mrMonthlyReportNotes)
      .where(and(eq(schema.mrMonthlyReportNotes.month, month), inArray(schema.mrMonthlyReportNotes.plant, plants)));
    rows.forEach((r) => {
      const p = r.plant as PlantCode;
      if (!notes[p]) return;
      notes[p][r.section] = {
        plant: p, month, section: r.section, body: r.body, version: r.version,
        updatedBy: r.updatedBy, updatedAt: r.updatedAt.toISOString(),
      };
    });
    return { notes, error: null };
  } catch (err) {
    return { notes, error: `노트 조회 실패: ${(err as Error).message.slice(0, 120)}` };
  }
}

export type SaveResult =
  | { ok: true; version: number }
  | { ok: false; conflict: true; current: NoteRecord }
  | { ok: false; conflict: false; error: string };

/** 낙관적 잠금: 화면이 받은 version 과 DB version 이 다르면 덮어쓰지 않고 현재 본문을 돌려준다. */
export async function saveNote(input: {
  plant: PlantCode; month: string; section: NoteSection; body: string; expectedVersion: number;
  editor: { name: string; userId: number | null };
}): Promise<SaveResult> {
  const T = schema.mrMonthlyReportNotes;
  const H = schema.mrMonthlyReportNoteHistory;
  return withTransaction(async (tx) => {
    const found = await tx
      .select()
      .from(T)
      .where(and(eq(T.plant, input.plant), eq(T.month, input.month), eq(T.section, input.section)))
      .for("update");
    const row = found[0];
    const currentVersion = row?.version ?? 0;
    if (currentVersion !== input.expectedVersion) {
      return {
        ok: false as const,
        conflict: true as const,
        current: {
          plant: input.plant, month: input.month, section: input.section,
          body: row?.body ?? "", version: currentVersion,
          updatedBy: row?.updatedBy ?? null, updatedAt: row?.updatedAt.toISOString() ?? null,
        },
      };
    }
    const version = currentVersion + 1;
    let noteId: number;
    if (row) {
      await tx
        .update(T)
        .set({ body: input.body, version, updatedBy: input.editor.name, updatedByUserId: input.editor.userId, updatedAt: new Date() })
        .where(eq(T.id, row.id));
      noteId = row.id;
    } else {
      const ins = await tx
        .insert(T)
        .values({
          plant: input.plant, month: input.month, section: input.section, body: input.body, version,
          updatedBy: input.editor.name, updatedByUserId: input.editor.userId,
        })
        .returning({ id: T.id });
      noteId = ins[0].id;
    }
    await tx.insert(H).values({ noteId, version, body: input.body, editedBy: input.editor.name, editedByUserId: input.editor.userId });
    return { ok: true as const, version };
  });
}

export async function getHistory(plant: PlantCode, month: string, limit = 20) {
  if (!hasDatabase) return [];
  const T = schema.mrMonthlyReportNotes;
  const H = schema.mrMonthlyReportNoteHistory;
  try {
    return await db
      .select({ section: T.section, version: H.version, body: H.body, editedBy: H.editedBy, editedAt: H.editedAt })
      .from(H)
      .innerJoin(T, eq(H.noteId, T.id))
      .where(and(eq(T.plant, plant), eq(T.month, month)))
      .orderBy(desc(H.editedAt))
      .limit(limit);
  } catch {
    return [];
  }
}

export { SECTIONS };
