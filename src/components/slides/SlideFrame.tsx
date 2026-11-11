import { monthLabel } from "@/domain/month";
import type { PlantCode } from "@/domain/types";
import { PLANT_LABEL } from "@/domain/plants";

// 모든 슬라이드의 공통 틀 — 1920×1080 고정 캔버스.
// data-morph 가 붙은 요소(공장 제목·월 배지·헤드라인 KPI·쪽번호)만 발표 모드에서 장 사이를 이어 움직인다.
export function SlideFrame({
  plant, title, month, page, total, asOf, sources, headline, children,
}: {
  plant?: PlantCode;
  title: string;
  month: string;
  page: number;
  total: number;
  asOf?: string | null;
  sources?: string;
  headline?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="slide" aria-label={`${plant ? PLANT_LABEL[plant] + " " : ""}${title}`}>
      <header className="slide-head">
        <div className="flex items-baseline gap-6">
          {plant && (
            <span data-morph="plant-title" className="inline-block text-[44px] font-bold text-[var(--navy)] leading-none">
              {plant}
            </span>
          )}
          <h2 className="text-[40px] font-semibold leading-none text-[var(--ink)]">{title}</h2>
        </div>
        <div className="flex items-center gap-5">
          {headline}
          <span data-morph="month-badge" className="inline-block rounded-full bg-[var(--navy)] px-5 py-2 text-[22px] font-medium text-white">
            {monthLabel(month, true)}
          </span>
        </div>
      </header>
      <div className="slide-body">{children}</div>
      <footer className="slide-foot">
        <span>{sources ?? "원가: product-cst(SAP 생산실적·원가) · 운영: plog 생산일보"}{asOf ? ` · 실적 기준일 ${asOf}` : ""}</span>
        <span className="num" data-morph="page-no">{page} / {total}</span>
      </footer>
    </section>
  );
}

export function EmptySlideBody({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="h-full grid place-items-center">
      <div className="text-center">
        <div className="text-[40px] font-semibold text-[var(--ink-2)]">{title}</div>
        {detail && <div className="mt-3 text-[22px] text-[var(--ink-3)]">{detail}</div>}
      </div>
    </div>
  );
}
