"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { MONTH_RE } from "@/domain/month";
import { isPlant } from "@/domain/plants";
import type { NoteRecord, NoteSection } from "@/domain/types";
import { canEditNotes } from "@/lib/auth/roles";
import { getSession } from "@/lib/auth/session";
import { db, schema } from "@/lib/db/client";
import { saveNote } from "@/lib/notes/repo";

export type SaveState =
  | { status: "idle" }
  | { status: "saved"; version: number; at: string }
  | { status: "conflict"; current: NoteRecord }
  | { status: "error"; message: string };

const MAX_LEN = 4000;

export async function saveNoteAction(input: {
  plant: string; month: string; section: NoteSection; body: string; expectedVersion: number;
}): Promise<SaveState> {
  const session = await getSession();
  if (!session) return { status: "error", message: "로그인이 필요합니다." };
  if (!isPlant(input.plant) || !MONTH_RE.test(input.month) || !["improvement", "plan"].includes(input.section)) {
    return { status: "error", message: "잘못된 요청입니다." };
  }
  if (!canEditNotes(session, input.plant)) return { status: "error", message: "이 공장의 노트를 수정할 권한이 없습니다." };
  if (input.body.length > MAX_LEN) return { status: "error", message: `최대 ${MAX_LEN}자까지 작성할 수 있습니다.` };

  let userId: number | null = null;
  try {
    const u = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.name, session.name)).limit(1);
    userId = u[0]?.id ?? null;
  } catch {
    userId = null;
  }

  try {
    const res = await saveNote({
      plant: input.plant, month: input.month, section: input.section,
      body: input.body.replace(/\r\n/g, "\n").trimEnd(), expectedVersion: input.expectedVersion,
      editor: { name: session.name, userId },
    });
    if (!res.ok) return res.conflict ? { status: "conflict", current: res.current } : { status: "error", message: res.error };
    const seg = input.month.replace("-", "");
    revalidatePath("/");
    revalidatePath(`/report/${seg}`);
    revalidatePath(`/print/${seg}`);
    return { status: "saved", version: res.version, at: new Date().toISOString() };
  } catch (err) {
    return { status: "error", message: `저장 실패: ${(err as Error).message.slice(0, 160)}` };
  }
}
