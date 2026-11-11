// 인쇄용 한 장 — 1920×1080 슬라이드를 A4 가로(281×194mm)에 맞춰 축소한다.
// 281mm ≈ 1062px(96dpi) → 1062/1920 ≈ 0.553. 세로는 194mm ≈ 733px, 1080×0.553 = 597px 이라 위아래 여백이 남는다.
const SCALE = 0.553;

export function PrintPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="print-page grid place-items-center">
      <div style={{ width: 1920 * SCALE, height: 1080 * SCALE, overflow: "hidden" }}>
        <div style={{ width: 1920, height: 1080, transform: `scale(${SCALE})`, transformOrigin: "top left" }}>{children}</div>
      </div>
    </div>
  );
}
