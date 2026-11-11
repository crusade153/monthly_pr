import 'server-only';
import { db, hasDatabase, schema } from '@/lib/db/client';
import { fixedCapacitySettings, type CapacitySetting } from '@/domain/capacity';

export async function getCapacity(): Promise<{ settings: CapacitySetting[]; error: string | null }> {
  if (!hasDatabase) return { settings: [], error: 'CAPA 저장용 데이터베이스가 설정되지 않았습니다.' };
  try {
    const rows = await db.select().from(schema.mrMonthlyCapacity);
    return { settings: fixedCapacitySettings(rows.map(r => ({ ...r, updatedAt: r.updatedAt.toISOString() }))), error: null };
  } catch { return { settings: [], error: '풀 CAPA 설정을 불러오지 못했습니다.' }; }
}
