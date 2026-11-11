// 노트 초안 생성 확장 지점. 1차는 수동 입력만 지원한다.
// 2차에서 PlantReport(그 달 KPI·브리지·위험품목)를 입력으로 받는 LLM provider 를 추가하면
// 편집기의 "초안 생성" 버튼이 자동으로 나타난다(supportsDraft = true).
import type { PlantReport } from "./report";
import type { NoteSection } from "./types";

export interface NoteDraftProvider {
  readonly supportsDraft: boolean;
  draft(ctx: { report: PlantReport; section: NoteSection }): Promise<string>;
}

export const ManualDraftProvider: NoteDraftProvider = {
  supportsDraft: false,
  async draft() {
    return "";
  },
};

export const draftProvider: NoteDraftProvider = ManualDraftProvider;
