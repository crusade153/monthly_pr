import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getCapacity } from '@/lib/capacity/repo';
import { currentMonthSeoul, MONTH_RE, prevMonth } from '@/domain/month';
import { CapacityForm } from './CapacityForm';
export const dynamic = 'force-dynamic';
export default async function CapacityPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== '전체관리자') return <main className="p-10"><h1>관리자 권한이 필요합니다.</h1><Link href="/">보고서로 돌아가기</Link></main>;
  const params = await searchParams;
  const month = params.month && MONTH_RE.test(params.month) ? params.month : prevMonth(currentMonthSeoul());
  const result = await getCapacity();
  return <main className="mx-auto max-w-[1000px] p-8">
    <Link href={`/?month=${month}`} className="btn">← 보고서</Link>
    <h1 className="mt-6 text-3xl font-semibold">풀 / 주간 1교대 CAPA 관리</h1>
    <p className="mt-3 text-[var(--ink-2)]">CAPA는 월마다 입력하지 않는 고정 기준값입니다. 한 달 전체의 풀 / 주간 1교대 생산 가능량을 입력하면 당월·전월·전년동월 생산량을 모두 동일한 CAPA로 나누어 가동률을 계산합니다. CAPA가 변경될 때만 수정하세요.</p>
    <p className="mt-2 text-sm text-[var(--ink-3)]">K1 가동률은 냉동·조미팀별로 표시합니다. K2는 FD 제외, K3는 분말스프 제외. 수치가 100%를 넘으면 그대로 표시합니다.</p>
    <div className="my-6" />
    {result.error ? <p role="alert">{result.error}</p> : <CapacityForm key={month} month={month} settings={result.settings} />}
  </main>;
}
