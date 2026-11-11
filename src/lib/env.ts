import "server-only";
import { z } from "zod";

const schema = z.object({
  PRODUCT_CST_BASE_URL: z.string().url(),
  PRODUCT_CST_TOKEN: z.string().min(1),
  PLOG_BASE_URL: z.string().url(),
  PLOG_TOKEN: z.string().min(1),
});

export type SourceEnv = z.infer<typeof schema>;

/** 원천 API 설정. 빠진 값이 있으면 어떤 키인지 알려준다(보고서 화면에 그대로 표시). */
export function sourceEnv(): { ok: true; env: SourceEnv } | { ok: false; missing: string[] } {
  const parsed = schema.safeParse(process.env);
  if (parsed.success) return { ok: true, env: parsed.data };
  return { ok: false, missing: parsed.error.issues.map((i) => String(i.path[0])) };
}
