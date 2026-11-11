import "server-only";
import { z } from "zod";
import { sourceEnv } from "@/lib/env";
import { isClosed } from "@/domain/month";
import type { CostReport, Fetched, OpsReport, PlantCode } from "@/domain/types";

// 응답 모양의 핵심만 검증한다(나머지는 passthrough). 원천이 계약을 깨면 화면 대신 여기서 바로 드러난다.
const costShape = z
  .object({
    plant: z.string(),
    month: z.string(),
    hasData: z.boolean(),
    summary: z.object({ current: z.object({ mfgUnit: z.number(), qty: z.number() }).passthrough() }).passthrough(),
    series: z.object({ months: z.array(z.string()) }).passthrough(),
    lines: z.array(z.unknown()),
    risk: z.object({ items: z.array(z.unknown()) }).passthrough(),
    costDiff: z.object({ mfg: z.number() }).passthrough(),
  })
  .passthrough();

const opsShape = z
  .object({
    plant: z.string(),
    month: z.string(),
    teams: z.array(z.object({ team: z.string(), rates: z.object({ operationRate: z.number() }).passthrough() }).passthrough()),
    plantTotal: z.object({ operationRate: z.number(), series: z.array(z.unknown()) }).passthrough(),
  })
  .passthrough();

async function bearerFetch(base: string, token: string, path: string, month: string, fresh: boolean) {
  const url = `${base.replace(/\/$/, "")}${path}${fresh ? "&fresh=1" : ""}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    // 마감월은 1시간, 당월은 2분. 원천 쪽 캐시가 따로 있어 여기선 짧게 둔다.
    ...(fresh ? { cache: "no-store" as const } : { next: { revalidate: isClosed(month) ? 3600 : 120, tags: ["report", month] } }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${body.slice(0, 160)}`);
  }
  return res.json();
}

export async function fetchCostReport(plant: PlantCode, month: string, fresh = false): Promise<Fetched<CostReport>> {
  const e = sourceEnv();
  if (!e.ok) return { ok: false, error: `환경변수 누락: ${e.missing.join(", ")}` };
  try {
    const json = await bearerFetch(e.env.PRODUCT_CST_BASE_URL, e.env.PRODUCT_CST_TOKEN, `/api/report/monthly?plant=${plant}&month=${month}&schema=4`, month, fresh);
    const parsed = costShape.safeParse(json);
    if (!parsed.success) return { ok: false, error: `원가 API 응답 형식 불일치: ${parsed.error.issues[0]?.path.join(".")}` };
    return { ok: true, data: json as CostReport };
  } catch (err) {
    return { ok: false, error: `원가 API 호출 실패: ${(err as Error).message}` };
  }
}

export async function fetchOpsReport(plant: PlantCode, month: string, fresh = false): Promise<Fetched<OpsReport>> {
  const e = sourceEnv();
  if (!e.ok) return { ok: false, error: `환경변수 누락: ${e.missing.join(", ")}` };
  try {
    const json = await bearerFetch(e.env.PLOG_BASE_URL, e.env.PLOG_TOKEN, `/api/report/monthly?plant=${plant}&month=${month}&schema=2`, month, fresh);
    const parsed = opsShape.safeParse(json);
    if (!parsed.success) return { ok: false, error: `생산일보 API 응답 형식 불일치: ${parsed.error.issues[0]?.path.join(".")}` };
    return { ok: true, data: json as OpsReport };
  } catch (err) {
    return { ok: false, error: `생산일보 API 호출 실패: ${(err as Error).message}` };
  }
}
