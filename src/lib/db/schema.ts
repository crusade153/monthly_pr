// monthly_pr 소유 테이블 — plog 와 같은 Neon DB 에 있지만 이름을 mr_ 로 구분한다.
// plog 마이그레이션은 mr_* 를 다루지 않고, 여기(drizzle.config tablesFilter)도 mr_* 만 본다.
import { doublePrecision, index, integer, pgEnum, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const mrMonthlyCapacity = pgTable('mr_monthly_capacity', {
  id: serial('id').primaryKey(), month: text('month').notNull(), scope: text('scope').notNull(),
  fullQty: doublePrecision('full_qty').notNull(), version: integer('version').notNull().default(1),
  updatedBy: text('updated_by').notNull(), updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, t => ({ uniq: uniqueIndex('uniq_mr_capacity_month_scope').on(t.month, t.scope) }));

export const mrNoteSection = pgEnum("mr_note_section", ["improvement", "plan"]);

export const mrMonthlyReportNotes = pgTable(
  "mr_monthly_report_notes",
  {
    id: serial("id").primaryKey(),
    plant: text("plant").notNull(), // K1 | K2 | K3
    month: text("month").notNull(), // yyyy-MM
    section: mrNoteSection("section").notNull(),
    body: text("body").notNull().default(""),
    version: integer("version").notNull().default(0),
    updatedBy: text("updated_by").notNull(), // users.name (plog 관례: 작성자를 이름으로 남김)
    updatedByUserId: integer("updated_by_user_id"), // users.id — FK 없음(plog 테이블에 의존성 걸지 않음)
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uniq: uniqueIndex("uniq_mr_notes_plant_month_section").on(t.plant, t.month, t.section),
  }),
);

export const mrMonthlyReportNoteHistory = pgTable(
  "mr_monthly_report_note_history",
  {
    id: serial("id").primaryKey(),
    noteId: integer("note_id")
      .notNull()
      .references(() => mrMonthlyReportNotes.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    body: text("body").notNull(),
    editedBy: text("edited_by").notNull(),
    editedByUserId: integer("edited_by_user_id"),
    editedAt: timestamp("edited_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    idx: index("idx_mr_note_history_note").on(t.noteId, t.version),
  }),
);
