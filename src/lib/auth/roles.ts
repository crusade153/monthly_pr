// plog src/lib/roles.ts 와 같은 역할 체계.
import type { PlantCode } from "@/domain/types";

export const USER_ROLES = ["담당", "팀장", "공장장", "전체관리자", "CEO"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export function normalizeRole(role: string | null | undefined): UserRole {
  return (USER_ROLES as readonly string[]).includes(role ?? "") ? (role as UserRole) : "담당";
}

/** 월간 보고 노트 편집 — 담당~전체관리자. 공장 소속자는 자기 공장만, CEO 는 읽기 전용. */
export function canEditNotes(session: { role: string; plant: string | null } | null, plant: PlantCode): boolean {
  if (!session) return false;
  const role = normalizeRole(session.role);
  if (role === "CEO") return false;
  if (role === "전체관리자") return true;
  return session.plant === null || session.plant === plant;
}
