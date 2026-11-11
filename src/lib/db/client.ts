import "server-only";
import { neon, neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { drizzle as drizzleServerless } from "drizzle-orm/neon-serverless";
import * as owned from "./schema";
import * as external from "./external-schema";

// plog 의 client.ts 와 같은 구성: 조회는 neon-http, 트랜잭션은 모듈 스코프 Pool 1개 재사용.
const schema = { ...owned, ...external };
const url = process.env.DATABASE_URL;

export const hasDatabase = !!url;
export const db = drizzle(neon(url ?? "postgresql://placeholder"), { schema });

if (typeof WebSocket !== "undefined") {
  neonConfig.webSocketConstructor = WebSocket;
}

let txDb: ReturnType<typeof drizzleServerless<typeof schema>> | null = null;

function getTxDb() {
  if (!url) throw new Error("DATABASE_URL is not set");
  if (!txDb) txDb = drizzleServerless(new Pool({ connectionString: url }), { schema });
  return txDb;
}

export async function withTransaction<T>(fn: (tx: Parameters<Parameters<ReturnType<typeof getTxDb>["transaction"]>[0]>[0]) => Promise<T>) {
  return getTxDb().transaction(fn);
}

export { schema };
