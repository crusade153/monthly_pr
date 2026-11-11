'use server';
import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';
import { db, schema } from '@/lib/db/client';
import { CAPACITY_INPUT_SCOPES } from '@/domain/capacity';
import { MONTH_RE } from '@/domain/month';

export async function saveCapacity(input: { month: string; scope: string; fullQty: number; version: number }): Promise<{ ok: boolean; message: string; version?: number }> {
  const session = await getSession();
  if (!session || session.role !== '전체관리자') return { ok: false, message: '전체관리자만 CAPA를 설정할 수 있습니다.' };
  if (!MONTH_RE.test(input.month) || !CAPACITY_INPUT_SCOPES.some(s => s.key === input.scope) || !Number.isFinite(input.fullQty) || input.fullQty <= 0 || input.fullQty > 1e12 || !Number.isInteger(input.version) || input.version < 0) return { ok: false, message: '월·대상·생산량을 확인해주세요. CAPA는 0보다 큰 값이어야 합니다.' };
  const t = schema.mrMonthlyCapacity;
  try {
    let changed;
    const values = { fullQty: input.fullQty, updatedBy: session.name, updatedAt: new Date(), version: input.version + 1 };
    if (input.version === 0) {
      changed = await db.insert(t).values({ month: input.month, scope: input.scope, ...values }).onConflictDoNothing().returning({ version: t.version });
    } else {
      changed = await db.update(t).set(values).where(and(eq(t.month, input.month), eq(t.scope, input.scope), eq(t.version, input.version))).returning({ version: t.version });
    }
    if (!changed.length) return { ok: false, message: '다른 관리자가 변경했습니다. 새로고침 후 다시 저장해주세요.' };
    revalidatePath('/', 'layout');
    return { ok: true, message: '저장했습니다.', version: changed[0].version };
  } catch { return { ok: false, message: '저장하지 못했습니다. 연결 상태를 확인해주세요.' }; }
}
