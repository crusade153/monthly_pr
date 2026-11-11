import type { Config } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

// plog 와 같은 Neon DB 를 쓴다. mr_* 만 대상으로 한정해 plog 테이블을 절대 건드리지 않는다.
// 적용은 scripts/migrate.mjs (멱등 SQL). drizzle-kit push 금지.
export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
  tablesFilter: ["mr_*"],
  strict: true,
} satisfies Config;
