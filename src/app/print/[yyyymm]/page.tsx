import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/print/PrintButton";
import { PrintPage } from "@/components/print/PrintPage";
import { buildDeck } from "@/components/slides/deck";
import { monthLabel, parseYyyymm } from "@/domain/month";
import { isPlant } from "@/domain/plants";
import { loadMonth } from "@/lib/load-report";

export const dynamic = "force-dynamic";

export default async function PrintRoute({ params, searchParams }: { params: Promise<{ yyyymm: string }>; searchParams: Promise<{ plant?: string }> }) {
  const { yyyymm } = await params;
  const month = parseYyyymm(yyyymm);
  if (!month) notFound();
  const sp = await searchParams;
  const only = sp.plant && isPlant(sp.plant.toUpperCase()) ? (sp.plant.toUpperCase() as "K1" | "K2" | "K3") : undefined;
  const slides = buildDeck(await loadMonth(month, only ? [only] : undefined), { onlyPlant: only });

  return (
    <main className="py-8">
      <div className="no-print mx-auto mb-6 flex max-w-[1062px] flex-wrap items-center justify-between gap-3 px-4">
        <div>
          <div className="eyebrow">PRINT · A4 LANDSCAPE</div>
          <h1 className="text-xl font-semibold">{monthLabel(month, true)} 생산부문 보고 · {slides.length}쪽</h1>
          <p className="text-sm text-[var(--ink-3)]">Chrome 인쇄 창에서 대상을 &lsquo;PDF로 저장&rsquo;, 옵션의 &lsquo;배경 그래픽&rsquo;을 켜면 색이 그대로 나옵니다.</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/?month=${month}`} className="btn">홈</Link>
          <PrintButton />
        </div>
      </div>
      {slides.map((s) => <PrintPage key={s.id}>{s.node}</PrintPage>)}
    </main>
  );
}
