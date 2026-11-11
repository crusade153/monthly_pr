// 표지 → 종합 → K1(요약·팀별·원가·운영·인력/노무비) → K2 → K3. 전체 15장, K1 5장, K2/K3 4장.
import type { MonthBundle } from "@/lib/load-report";
import type { PlantCode } from "@/domain/types";
import { SlidePlantCost, SlidePlantOps, SlidePlantSummary } from "./PlantSlides";
import { SlideCover, SlideTotal } from "./SummarySlides";
import { SlidePlantLabor } from "./LaborSlide";
import { SlideK1Teams } from './TeamSlide';

export interface DeckSlide {
  id: string;
  plant: PlantCode | null;
  label: string;
  node: React.ReactNode;
}

export function buildDeck(bundle: MonthBundle, opts: { onlyPlant?: PlantCode } = {}): DeckSlide[] {
  const reports = opts.onlyPlant ? bundle.reports.filter((r) => r.plant === opts.onlyPlant) : bundle.reports;
  const specs: Array<{ id: string; plant: PlantCode | null; label: string; render: (page: number, total: number) => React.ReactNode }> = [];

  if (!opts.onlyPlant) {
    specs.push({ id: "cover", plant: null, label: "표지", render: (p, t) => <SlideCover month={bundle.month} reports={bundle.reports} page={p} total={t} /> });
    specs.push({ id: "total", plant: null, label: "종합", render: (p, t) => <SlideTotal month={bundle.month} totalReport={bundle.total} page={p} total={t} /> });
  }
  reports.forEach((r) => {
    specs.push({ id: `${r.plant}-summary`, plant: r.plant, label: `${r.plant} 요약`, render: (p, t) => <SlidePlantSummary report={r} page={p} total={t} /> });
    if (r.plant === 'K1') specs.push({ id: 'K1-teams', plant: r.plant, label: 'K1 팀별 실적', render: (p,t) => <SlideK1Teams report={r} page={p} total={t} /> });
    specs.push({ id: `${r.plant}-cost`, plant: r.plant, label: `${r.plant} 원가`, render: (p, t) => <SlidePlantCost report={r} page={p} total={t} /> });
    specs.push({ id: `${r.plant}-ops`, plant: r.plant, label: `${r.plant} 운영`, render: (p, t) => <SlidePlantOps report={r} page={p} total={t} /> });
    specs.push({ id: `${r.plant}-labor`, plant: r.plant, label: `${r.plant} 인력·노무비`, render: (p, t) => <SlidePlantLabor report={r} page={p} total={t} /> });
  });

  return specs.map((s, i) => ({ id: s.id, plant: s.plant, label: s.label, node: s.render(i + 1, specs.length) }));
}
