import { Fragment } from "react";
import { notFound } from "next/navigation";
import { Deck } from "@/components/presentation/Deck";
import { buildDeck } from "@/components/slides/deck";
import { parseYyyymm } from "@/domain/month";
import { isPlant } from "@/domain/plants";
import { loadMonth } from "@/lib/load-report";

export const dynamic = "force-dynamic";

export default async function PlantReportPage({ params }: { params: Promise<{ yyyymm: string; plant: string }> }) {
  const { yyyymm, plant } = await params;
  const month = parseYyyymm(yyyymm);
  const p = plant.toUpperCase();
  if (!month || !isPlant(p)) notFound();
  const slides = buildDeck(await loadMonth(month, [p]), { onlyPlant: p });
  return (
    <Deck
      items={slides.map(({ id, plant: pl, label }) => ({ id, plant: pl, label }))}
      slides={slides.map((s) => <Fragment key={s.id}>{s.node}</Fragment>)}
      editBase={`/edit/${yyyymm}`}
      printHref={`/print/${yyyymm}?plant=${p}`}
      homeHref={`/?month=${month}`}
    />
  );
}
