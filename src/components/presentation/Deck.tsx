"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";

// 발표 모드. 1920×1080 슬라이드를 화면에 맞게 축소하고 ←/→ 로 넘긴다.
// 장 전환: data-morph 가 같은 요소(공장 제목·월 배지·헤드라인 KPI·쪽번호)만 FLIP 으로 이어 움직이고,
// 나머지 본문은 짧게 페이드업. 전환 중 키 입력은 busy 로 막는다(측정값이 섞이면 요소가 튄다).

export interface DeckItem { id: string; plant: string | null; label: string }

const DURATION = 750;

// 창 크기 → 슬라이드 축소 배율 (외부 상태라 useSyncExternalStore 로 구독)
const subscribeResize = (cb: () => void) => {
  window.addEventListener("resize", cb);
  return () => window.removeEventListener("resize", cb);
};
const readScale = () => Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
const EASE = "cubic-bezier(.5,0,.15,1)";

export function Deck({ items, slides, editBase, printHref, homeHref }: {
  items: DeckItem[]; slides: React.ReactNode[]; editBase: string; printHref: string; homeHref: string;
}) {
  const [index, setIndex] = useState(0);
  const scale = useSyncExternalStore(subscribeResize, readScale, () => 0.5);
  const busy = useRef(false);
  const first = useRef<Map<string, DOMRect> | null>(null);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);
  const reduced = useRef(false);
  const ready = useRef(false); // 첫 렌더에서 URL #n 을 읽기 전에 #1 로 덮어쓰지 않도록

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const n = Number(window.location.hash.slice(1));
    // 주소의 #n 은 브라우저에만 있어 서버 렌더와 맞추려면 마운트 뒤 한 번 읽을 수밖에 없다
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (n >= 1 && n <= items.length) setIndex(n - 1);
    ready.current = true;
  }, [items.length]);

  const go = useCallback((next: number) => {
    if (busy.current) return;
    const target = Math.max(0, Math.min(items.length - 1, next));
    if (target === index) return;
    // 1. First — 현재 장의 morph 요소 위치를 교체 전에 잰다
    const map = new Map<string, DOMRect>();
    slideRefs.current[index]?.querySelectorAll<HTMLElement>("[data-morph]").forEach((el) => map.set(el.dataset.morph!, el.getBoundingClientRect()));
    first.current = map;
    busy.current = true;
    setIndex(target);
  }, [index, items.length]);

  // 2~4. Last → Invert → Play (새 장이 커밋된 직후, 그리기 전에)
  useLayoutEffect(() => {
    if (ready.current) history.replaceState(null, "", `#${index + 1}`);
    const root = slideRefs.current[index];
    const prev = first.current;
    first.current = null;
    if (!root || !prev) { busy.current = false; return; }

    const anims: Animation[] = [];
    if (reduced.current) {
      anims.push(root.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150 }));
    } else {
      let morphed = 0;
      root.querySelectorAll<HTMLElement>("[data-morph]").forEach((el) => {
        const f = prev.get(el.dataset.morph!);
        if (!f || morphed >= 4) return;
        const t = el.getBoundingClientRect();
        if (!t.width || !t.height) return;
        morphed++;
        // 화면 좌표 차이를 슬라이드 내부(축소 전) 좌표로 환산
        const dx = (f.left - t.left) / scale;
        const dy = (f.top - t.top) / scale;
        el.style.transformOrigin = "top left";
        anims.push(el.animate(
          [{ transform: `translate(${dx}px, ${dy}px) scale(${f.width / t.width}, ${f.height / t.height})` }, { transform: "none" }],
          { duration: DURATION, easing: EASE },
        ));
      });
      const body = root.querySelector<HTMLElement>(".slide-body");
      const blocks = body ? Array.from(body.children[0]?.children ?? body.children).slice(0, 8) : [];
      blocks.forEach((b, i) =>
        anims.push((b as HTMLElement).animate(
          [{ opacity: 0, transform: "translateY(16px)" }, { opacity: 1, transform: "none" }],
          { duration: 320, delay: 120 + i * 50, easing: "cubic-bezier(.2,.7,.2,1)", fill: "backwards" },
        )),
      );
    }
    Promise.all(anims.map((a) => a.finished.catch(() => undefined))).then(() => { busy.current = false; });
  }, [index, scale]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
      if (["ArrowRight", "PageDown", " ", "Enter"].includes(e.key)) { e.preventDefault(); go(index + 1); }
      else if (["ArrowLeft", "PageUp", "Backspace"].includes(e.key)) { e.preventDefault(); go(index - 1); }
      else if (e.key === "Home") go(0);
      else if (e.key === "End") go(items.length - 1);
      else if (/^[1-9]$/.test(e.key)) go(Number(e.key) - 1);
      else if (e.key === "f" || e.key === "F") {
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen().catch(() => undefined);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index, items.length]);

  const cur = items[index];
  return (
    <div className="deck" onClick={(e) => {
      if ((e.target as HTMLElement).closest("a,button")) return;
      go(e.clientX > window.innerWidth / 2 ? index + 1 : index - 1);
    }}>
      <div className="deck-stage" style={{ width: 1920, height: 1080, marginLeft: -960, marginTop: -540, transform: `scale(${scale})` }}>
        {slides.map((node, i) => (
          <div key={items[i].id} ref={(el) => { slideRefs.current[i] = el; }} style={{ display: i === index ? "block" : "none" }}
            aria-hidden={i !== index}>
            {node}
          </div>
        ))}
      </div>

      <nav className="deck-ui no-print" aria-label="슬라이드 이동">
        <div className="flex items-center gap-2 rounded-full bg-black/70 px-3 py-2 text-[13px] text-white backdrop-blur">
          <Link href={homeHref} className="rounded-full px-3 py-1 hover:bg-white/15">홈</Link>
          <button type="button" onClick={() => go(index - 1)} className="rounded-full px-3 py-1 hover:bg-white/15" aria-label="이전">←</button>
          {items.map((it, i) => (
            <button key={it.id} type="button" onClick={() => go(i)} title={it.label} aria-label={it.label}
              className={`h-2.5 rounded-full transition-all ${i === index ? "w-7 bg-[var(--gold)]" : "w-2.5 bg-white/40 hover:bg-white/70"}`} />
          ))}
          <button type="button" onClick={() => go(index + 1)} className="rounded-full px-3 py-1 hover:bg-white/15" aria-label="다음">→</button>
          <span className="num px-2 text-white/70">{index + 1}/{items.length} · {cur.label}</span>
          {cur.plant && <Link href={`${editBase}/${cur.plant}`} className="rounded-full px-3 py-1 hover:bg-white/15">노트 편집</Link>}
          <Link href={printHref} className="rounded-full px-3 py-1 hover:bg-white/15">인쇄·PDF</Link>
          <span className="hidden px-2 text-white/50 md:inline">F 전체화면</span>
        </div>
      </nav>
    </div>
  );
}
