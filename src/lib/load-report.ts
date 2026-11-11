import "server-only";
import { buildPlantReport, buildTotalReport, type PlantReport, type TotalReport } from "@/domain/report";
import { PLANT_ORDER } from "@/domain/plants";
import type { PlantCode } from "@/domain/types";
import { fetchCostReport, fetchOpsReport } from "@/lib/api-clients/sources";
import { getNotes } from "@/lib/notes/repo";
import { getCapacity } from '@/lib/capacity/repo';
import { buildCapacityReport } from '@/domain/capacity';
import { shiftMonth } from '@/domain/month';

export interface MonthBundle {
  month: string;
  reports: PlantReport[];
  total: TotalReport;
  notesError: string | null;
}

/** 공장 × (원가 API, 일보 API) + 노트를 병렬로 받아 보고서 모델을 만든다. 원천 하나가 실패해도 나머지로 그린다. */
export async function loadMonth(month: string, plants: PlantCode[] = PLANT_ORDER, fresh = false): Promise<MonthBundle> {
  const [costs, opses, notes, capacity] = await Promise.all([
    Promise.all(plants.map((p) => fetchCostReport(p, month, fresh))),
    Promise.all(plants.map((p) => fetchOpsReport(p, month, fresh))),
    getNotes(month, plants),
    getCapacity([month, shiftMonth(month, -1), shiftMonth(month, -12)]),
  ]);
  const reports = plants.map((plant, i) => {
    const report = buildPlantReport({ plant, month, cost: costs[i], ops: opses[i], notes: notes.notes[plant] });
    report.capacity = buildCapacityReport(plant, month, report.cost, capacity.settings, capacity.error);
    return report;
  });
  return { month, reports, total: buildTotalReport(month, reports), notesError: notes.error };
}
