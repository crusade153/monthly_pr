# monthly_pr — 월간 경영보고 생산부문

K1·K2·K3 생산부문 월간 보고서를 자동으로 만드는 Next.js 16 앱. 숫자는 직접 계산하지 않고 두 앱의 보고용 API에서 받는다. 실무자가 쓰는 "당월 개선활동 / 익월 추진계획"만 이 앱이 저장한다.

## 데이터 흐름
- `product-cst` `GET /api/report/monthly?plant&month` (Bearer = product-cst `MCP_TOKEN`) → 원가·생산량·생산성·수율·브리지·라인·위험품목. 계산은 product-cst `src/lib/report/monthly.ts`.
- `plog` `GET /api/report/monthly?plant&month` (Bearer = plog `REPORT_API_TOKEN`) → 팀별 달성률·가동률·비계획정지·스크랩·불량·인원. 계산은 plog `src/lib/report/monthly-ops.ts` (팀 대시보드와 같은 `getTeamDashboardAggregate`).
- 노트: plog 와 같은 Neon DB 의 `mr_monthly_report_notes` / `mr_monthly_report_note_history`. 생성은 `npm run migrate` (멱등 SQL). **drizzle-kit push 금지** — plog 테이블 DROP 을 제안한다.
- `src/lib/load-report.ts` `loadMonth()` 가 공장 × 2 API + 노트를 병렬로 받고, 원천 하나가 실패해도 나머지로 그린다(슬라이드에 오류 문구 표시).

## 규칙
- 공장 간 물량·단가 합산 금지(K1=kg, K2·K3=식). TOTAL 장(`domain/report.ts` `buildTotalReport`)은 금액(원)·시간(분)만.
- 월 연산은 `'yyyy-MM'` 문자열(`domain/month.ts`). 당월 판정은 Asia/Seoul.
- 색: `deltaTone()` — 원가·정지·불량은 낮을수록 좋음. 게이지 달성률은 낮을수록 좋은 지표면 목표/실적.
- 슬라이드는 1920×1080 고정 캔버스, 차트는 서버 렌더 SVG(`components/charts/charts.tsx`) — 발표·인쇄가 같은 그림.
- 발표 모드 FLIP 대상은 `data-morph` 4종(plant-title, month-badge, headline-kpi, page-no)만.

## 라우트
`/` 월 선택·공장 카드·노트 상태 · `/report/yyyyMM` 전체 15장 · `/report/yyyyMM/K1` K1 5장(종합 요약·팀별 실적·원가·운영·인력/노무비), K2/K3 각 4장 · `/print/yyyyMM` A4 가로 · `/edit/yyyyMM/K1` 노트 편집(낙관적 잠금, 이력) · `/admin/capacity?month=yyyy-MM` 전체관리자 풀 CAPA 설정 · `/login` plog 계정 PIN.

풀 CAPA: `mr_monthly_capacity`는 monthly_pr 소유. 고정 기준 K1 냉동·조미 kg, K2 1·2라인 식, K3 공장 식 생산 가능량을 저장한다. 가동률 = product-cst 해당 범위 월 생산량 / 입력한 월 CAPA. 미입력은 null, 당월·전월·전년은 동일한 고정 CAPA 사용. 기존 월별 저장값은 scope별 가장 최근 저장값을 공통 기준으로 읽으며 월마다 입력하지 않는다. 작업시간/계획시간을 이 가동률에 사용하지 않는다. `domain/capacity.ts`에서 월간 보고 고유 설정과 실적을 결합한다.

인력·노무비는 product-cst 월간 API의 `labor` 블록을 사용한다. 인원·노무비·근로시간은 임금시간생산성 시트, 생산량·생산성은 product-cst 기준이다. 인력 지표용 생산량에서 FD·K3 분말스프를 제외한다. 원천 읽기 실패·월별 누락을 0으로 보정하지 않는다.

## 권한
plog `users` 의 이름+PIN, `session` 쿠키 포맷 동일(`SESSION_SECRET` 같게). 노트 편집은 담당·팀장·공장장·전체관리자, 공장 소속자는 자기 공장만, CEO 는 읽기 전용(`lib/auth/roles.ts`).

## 로컬 실행
`.env.local.example` 참고. 두 원천을 로컬로 띄울 때는 각 앱에 토큰 환경변수를 주고 다른 포트로 실행한다. `npm run dev` → http://localhost:3100.

## 확장 지점
AI 초안: `domain/notes-draft.ts` 의 `NoteDraftProvider` 를 구현해 `draftProvider` 로 바꾸면 된다(입력 = `PlantReport`).
