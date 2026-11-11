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
  const result = await getCapacity([month]);
  return <main className="mx-auto max-w-[1000px] p-8">
    <Link href={`/?month=${month}`} className="btn">← 보고서</Link>
    <h1 className="mt-6 text-3xl font-semibold">풀 CAPA 관리</h1>
    <p className="mt-3 text-[var(--ink-2)]">가동률 = 해당 월 실적 생산량 ÷ 월 풀 CAPA 생산량. 하루 기준이 아닌 한 달 전체의 생산 가능량을 입력하세요. 전월·전년 비교는 각 월에 저장한 CAPA를 사용합니다.</p>
    <p className="mt-2 text-sm text-[var(--ink-3)]">K1 가동률은 냉동·조미팀별로 표시합니다. K2는 FD 제외, K3는 분말스프 제외. 수치가 100%를 넘으면 그대로 표시합니다.</p>
    <form className="my-6 flex items-end gap-3"><label>기준 월<input className="field mt-2" type="month" name="month" defaultValue={month} required /></label><button className="btn">조회</button></form>
    {result.error ? <p role="alert">{result.error}</p> : <CapacityForm key={month} month={month} settings={result.settings} />}
  </main>;
}
