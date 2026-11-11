/**
 * mr_* 테이블 생성 (멱등). plog 와 같은 Neon DB 에 적용되므로 mr_* 외에는 절대 건드리지 않는다.
 * drizzle-kit push 는 쓰지 않는다 — plog 테이블을 "스키마에 없음"으로 보고 DROP 을 제안한다.
 * 사용: npm run migrate
 */
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });
config({ path: ".env" });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}
const sql = neon(url);

const statements = [
  `CREATE TABLE IF NOT EXISTS mr_monthly_capacity (
    id serial PRIMARY KEY, month text NOT NULL CHECK (month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
    scope text NOT NULL CHECK (scope IN ('K1-frozen','K1-season','K2-1','K2-2','K3','K1-frozen-day','K1-season-day','K2-1-day','K2-2-day','K3-day')),
    full_qty double precision NOT NULL CHECK (full_qty > 0 AND full_qty <= 1e12),
    version integer NOT NULL DEFAULT 1, updated_by text NOT NULL, updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  // 기존 설치의 CHECK 제약도 갱신한다. CREATE TABLE IF NOT EXISTS는 기존 제약을 바꾸지 않는다.
  `ALTER TABLE mr_monthly_capacity
     DROP CONSTRAINT IF EXISTS mr_monthly_capacity_scope_check,
     ADD CONSTRAINT mr_monthly_capacity_scope_check CHECK (scope IN (
       'K1-frozen','K1-season','K2-1','K2-2','K3',
       'K1-frozen-day','K1-season-day','K2-1-day','K2-2-day','K3-day'
     ))`,
  `CREATE UNIQUE INDEX IF NOT EXISTS uniq_mr_capacity_month_scope ON mr_monthly_capacity (month, scope)`,
  `DO $$ BEGIN
     CREATE TYPE mr_note_section AS ENUM ('improvement', 'plan');
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `CREATE TABLE IF NOT EXISTS mr_monthly_report_notes (
     id serial PRIMARY KEY,
     plant text NOT NULL,
     month text NOT NULL,
     section mr_note_section NOT NULL,
     body text NOT NULL DEFAULT '',
     version integer NOT NULL DEFAULT 0,
     updated_by text NOT NULL,
     updated_by_user_id integer,
     updated_at timestamptz NOT NULL DEFAULT now(),
     created_at timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS uniq_mr_notes_plant_month_section
     ON mr_monthly_report_notes (plant, month, section)`,
  `CREATE TABLE IF NOT EXISTS mr_monthly_report_note_history (
     id serial PRIMARY KEY,
     note_id integer NOT NULL REFERENCES mr_monthly_report_notes(id) ON DELETE CASCADE,
     version integer NOT NULL,
     body text NOT NULL,
     edited_by text NOT NULL,
     edited_by_user_id integer,
     edited_at timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS idx_mr_note_history_note
     ON mr_monthly_report_note_history (note_id, version)`,
];

for (const s of statements) {
  await sql(s);
  console.log("ok:", s.split("\n")[0].trim().slice(0, 70));
}
console.log("mr_* migration done.");
