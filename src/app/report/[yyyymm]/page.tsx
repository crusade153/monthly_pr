import { Fragment } from "react";
import { notFound } from "next/navigation";
import { Deck } from "@/components/presentation/Deck";
import { buildDeck } from "@/components/slides/deck";
import { parseYyyymm } from "@/domain/month";
import { loadMonth } from "@/lib/load-report";

export const dynamic = "force-dynamic";

export default async function ReportPage({ params, searchParams }: { params: Promise<{ yyyymm: string }>; searchParams: Promise<{ fresh?: string }> }) {
  const { yyyymm } = await params;
  const month = parseYyyymm(yyyymm);
  if (!month) notFound();
  const fresh = (await searchParams).fresh === "1";
  const slides = buildDeck(await loadMonth(month, undefined, fresh));
  return (
    <Deck
      items={slides.map(({ id, plant, label }) => ({ id, plant, label }))}
      slides={slides.map((s) => <Fragment key={s.id}>{s.node}</Fragment>)}
      editBase={`/edit/${yyyymm}`}
      printHref={`/print/${yyyymm}`}
      homeHref={`/?month=${month}`}
    />
  );
}
