// plog 소유 테이블 — 읽기 전용 참조. drizzle-kit 대상이 아니다(drizzle.config 의 schema 에 넣지 않는다).
// role 은 plog 에서 pgEnum(user_role) 이지만 읽기만 하므로 text 로 받는다.
import { pgTable, serial, text } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  pin: text("pin").notNull(),
  plant: text("plant"),
  department: text("department"),
  role: text("role").notNull(),
});
