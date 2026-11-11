# monthly_pr 진행 현황 · 다음 세션 인계

최종 갱신: 2026-11-11

## 이번 세션 추가 완료 (2026-11-11 · 최신 상태)

### 운영 배포 폴더 주의
- **운영 연결 최종 확인 완료**: product-cost `9ac7f3f`, plog(Vercel 프로젝트명 `product-report`) `5268dd0`가 Production READY이며 각각 dailycost.zettai.co.kr / plog.zettai.co.kr에 연결됨. 아래의 404·307은 최신 배포 반영 전 조회 이력이다.
- 2026-10 K1/K2/K3 × 두 운영 API **6건 모두 HTTP 200**. monthly_pr과 동일한 `schema=4`(원가), `schema=2`(일보) URL로 확인. 세 공장 모두 `labor.status=ok`, 당월 노무비 있음. K1 팀별 전월·전년 비교 있음. 운영 팀 K1=냉동/조미, K2=즉석밥, K3=면생산 확인. 두 API 모두 토큰 누락 시 **401**. 토큰 값은 출력·기록하지 않음.
- 사용자는 `C:/Users/USER/Desktop/project/sap_link/dailycost`에서 배포 작업 중이다. 이 폴더와 기존 구현 폴더 `product-cst`는 같은 GitHub 저장소 `crusade153/product-cost`의 별도 복사본이었다(확인 시 두 HEAD 모두 `da261d7`).
- `dailycost`에는 새 보고 API가 없어 `git commit` 시 nothing to commit이 나왔음. `product-cst`의 보고 관련 코드 7개(CLAUDE.md, kpi route, monthly report route, report 모듈 4개)를 **dailycost에도 복사 완료**. 환경변수·.claude 파일은 복사하지 않음.
- 운영 확인 시 dailycost 보고 API 404, plog 보고 API 307 `/login` 이동. 원천 두 앱 모두 새 코드 커밋/푸시·배포가 필요하다. 현재 프로젝트 `.env.local`에는 운영 주소 두 개와 토큰이 들어 있음(토큰 값은 출력·기록하지 않음).
- 이후 배포용 product-cst 변경은 사용자의 `dailycost` 폴더를 기준으로 확인할 것. 기존 `product-cst` 개발 서버와 작업본이 따로 남아 있으므로 혼동 주의.

### 인력·노무비 비교 강화 (추가 요청 반영)
- 공장 전체 4개 KPI에 전월·전년동월 대비 증감률과 증감량을 추가. 연장근무 의존도는 %p로 표시한다.
- 상단 전월/전년 비교 요약: 생산량·인원·노무비 변화 → 단위당 노무비·인당 생산량 변화를 나란히 표시. 전월 해석 문구는 검증된 비율 관계만 설명하며 원인·대책을 추측하지 않는다.
- 2026-10 K1: 전월 생산량 −9.8%, 인원 +2.5%(+4명), 노무비 −6.6% → 단위당 노무비 +3.6%, 인당 생산량 −12.1%. 생산량 감소폭이 노무비 감소폭보다 커 단위당 부담이 증가한 상황이다.
- 팀별 표도 인원·노무비·단위당 노무비·추가시간·인당 생산량의 전월/전년 대비를 표시. 노무비 표는 백만원 단위, 인원·노무비 총액의 증감에는 좋고 나쁨 색을 부여하지 않는다.
- product-cst `labor.teams[]`에 `prevMonth`/`prevYear` 추가. 보고 API 캐시 v4, monthly_pr 조회 키 schema=4. 원천 전체 비용·물량 집계는 변경하지 않았다.
- `domain/labor-comparison.ts`: 실제 0은 유효한 값, 기준 0이면 증감량만 표시하고 증감률은 null. 비교·해석 테스트 2개 및 원천 테스트 4개 통과. 타입·린트 통과, 세 공장 인력 장의 DOM/패널·SVG 넘침 검사 통과.
- 최종 `next build` 통과. 브라우저 캡처는 시간 초과로 최종 스크린샷 검토 미완료(이전 스크린샷을 최종 화면으로 간주하지 말 것). 실제 페이지 텍스트와 레이아웃 범위는 DOM으로 확인했다.

- **인건비 시트 공유 해결**: `only-dashboard@kdyu-dashboard.iam.gserviceaccount.com` 공유 후 실제 읽기 성공. K1/K2/K3 2026-10 월간 원가 API 모두 HTTP 200, `labor.status=ok`, 당월 노무비 있음. 아래의 권한 미해결 기록은 이전 상태다.
- **K1 종합 + 냉동/조미 별도 장**: 종합 요약은 유지하고 팀별 생산량·제조원가·생산성·수율·풀 CAPA 가동률, 생산량/생산성 12개월 추이를 추가. 전체 **15장 / K1 5장 / K2·K3 4장**.
- **풀 CAPA 관리자 화면**: `/admin/capacity?month=2026-10` (홈 버튼). 전체관리자만 조회·저장 가능. 월별 `K1-frozen`, `K1-season` kg, `K2-1`, `K2-2`, `K3` 식 단위로 **월 전체 풀 CAPA 생산량** 입력. 가동률은 product-cst 해당 범위 생산량 ÷ CAPA. 전월·전년은 각각 해당 월 CAPA 사용. 미입력은 `–`, 100% 초과는 보존, 다른 관리자 저장 시 버전 충돌 감지.
- DB: `mr_monthly_capacity` 추가, `npm run migrate` 적용 완료. 기존 plog 테이블 변경 없음. **실제 CAPA 값은 아직 미입력**. 2099-12 테스트 값 저장·재조회 후 테스트 행 삭제 확인.
- plog 월간 보고 범위에서 FD·분말스프 제외. 작업시간/계획시간은 풀 CAPA 가동률과 구분해 `계획시간 대비`로 표기. 공식 인원·생산성은 plog 운영 표에서 빼고 별도 실적 장을 사용.
- 가독성: 원가 브리지 제목/기준값 분리, 막대·라벨 간격 조정, 차트 끝 수치 잘림 수정, 긴 생산량은 축약 및 격월 라벨. `기여 품목` → `제조원가 변동 주요 품목(+상승/−하락)`, 재료비 표는 `재료비 목표 초과 품목`.
- 검증: CAPA 3개 + 노동비 4개 테스트 통과. 세 앱 타입 검사, monthly_pr·product-cst 변경 파일 린트 통과. 실제 15장 브라우저 검사에서 패널 넘침·SVG 수치 잘림 없음. 관리자 저장/재조회 확인. 스크린샷은 `.qa/` (일부 중간 캡처는 레이아웃 수정 전).
- 로컬 개발 서버 실행 중: monthly_pr 3100, product-cst 3101, plog 3102. **배포하지 않음**. 실제 계정 로그인/역할별 브라우저 검증 및 배포 점검은 남아 있음.

## 1. 목표

월간 경영보고에서 생산부문을 K1·K2·K3 공장별로 1~3장씩 자동 완성해 바로 발표·인쇄할 수 있는 대시보드.
사장님이 공유한 벤치마크 화면(제조원가·생산량 바 3개, 생산성 12개월 추이, 반원 게이지 4개, 우측 하단 개선활동/추진계획)의 **정보 구조**를 따른다.
숫자는 기존 앱에서 API로 받고, 실무자는 월별 이슈 텍스트만 작성한다.

## 2. 구조

| 원천 | 내용 | 연결 방식 |
|---|---|---|
| product-cst (Google Sheets 원가·실적) | 제조원가, 생산량, 생산성, 수율, 원가 브리지, 라인별 원가, 재료비 초과 품목 | `GET /api/report/monthly?plant&month`, Bearer `MCP_TOKEN` |
| plog (Neon 생산일보) | 계획달성률, 가동률, 비계획정지, 스크랩·불량, 인원 | `GET /api/report/monthly?plant&month`, Bearer `REPORT_API_TOKEN` |
| plog Neon DB | 월별 노트 저장, 로그인 사용자 | `mr_monthly_report_notes`, `mr_monthly_report_note_history`, `users` 읽기 |
| **(예정) 인원·노무비 앱스스크립트** | 단위당 노무비, 연장근무 의존도, 생산직 인원, 인당 생산량 | 미정 — 4장 참고 |

원칙
- 계산은 원천 앱의 기존 함수를 재사용한다. monthly_pr은 비교·색·배치만 한다.
- 공장 간 물량·단가는 합산하지 않는다(K1=kg, K2·K3=식). TOTAL 장은 금액(원)·시간(분)만.
- 월 연산은 `yyyy-MM` 문자열, 당월 판정은 서울 시간.

자세한 아키텍처는 [CLAUDE.md](CLAUDE.md).

## 3. 완료된 작업

### product-cst (`C:\Users\USER\Desktop\project\sap_link\product-cst`)
- `src/lib/report/summarize.ts` 신규 — `/api/kpi`의 요약 함수를 추출해 공유. `/api/kpi` 동작은 그대로.
- `src/lib/report/monthly.ts` 신규 — `buildMonthlyReport()`: 당월·전월·전년동월 요약, 12개월·전년 12개월 시리즈, Mix/Perf 브리지(MOM·YOY·TARGET), 라인별 원가, 위험 품목 Top10, 금액 차이.
- `src/app/api/report/monthly/route.ts` 신규 — 마감월 6시간, 당월 5분 캐시, `fresh=1` 우회.
- `CLAUDE.md`에 엔드포인트 설명 추가.

### plog (`C:\Users\USER\Desktop\project\sap_link\plog`)
- `src/lib/report-auth.ts` 신규 — `REPORT_API_TOKEN` Bearer 검증.
- `src/lib/report/monthly-ops.ts` 신규 — 팀 대시보드와 같은 `getTeamDashboardAggregate` 로 팀별·공장별 운영 지표와 12개월 추이. 마감월 24시간, 당월 10분 캐시.
- `src/app/api/report/monthly/route.ts` 신규.
- `src/middleware.ts` — `/api/report` 를 세션 예외 경로에 추가.
- `README.md` — 환경변수와 `mr_*` 테이블 소유 안내 추가.

### monthly_pr (이 폴더, 신규)
- 화면: `/` 월 선택·공장 카드·노트 작성 상태, `/report/yyyyMM` 발표 11장, `/report/yyyyMM/K1` 공장 3장, `/print/yyyyMM` A4 가로 인쇄, `/edit/yyyyMM/K1` 노트 편집, `/login`.
- 장 구성: 표지 → 종합(금액) → 공장별 요약·원가·운영.
- 발표 모드: 방향키·숫자키·F 전체화면, 공장명·월 배지·제조원가·쪽번호만 FLIP 전환, 동작 줄이기 설정 대응.
- 차트: 서버 렌더 SVG(`src/components/charts/charts.tsx`). 화면과 인쇄가 같은 그림.
- 노트: plog 계정(이름+PIN)으로 로그인, 낙관적 잠금으로 동시 편집 충돌 감지, 수정 이력 보관. CEO는 읽기 전용, 공장 소속자는 자기 공장만 편집.
- AI 초안 확장 지점: `src/domain/notes-draft.ts` (현재 수동 입력만).
- `npm run migrate` 로 plog Neon에 `mr_*` 테이블 2개 생성 완료(현재 비어 있음).

### 검증한 것 (2026-10 실데이터, 로컬)
- product-cst 새 API의 K2 단위원가 754.12 = 기존 `/api/kpi` 값.
- 두 API 모두 토큰 없으면 401.
- 11장 모두 슬라이드 영역 밖으로 넘치는 요소 없음(인쇄 페이지 기준 측정).
- 노트 저장 → 슬라이드 반영, 다른 사람이 먼저 저장했을 때 충돌 안내 확인. 테스트 행은 삭제함.
- monthly_pr `tsc`·`eslint`·`next build` 통과. product-cst·plog 새 파일 `tsc` 통과.

## 4. 다음 작업 ① 인원·노무비 연동 (앱스스크립트 대시보드)

대상: `https://script.google.com/a/macros/harim-foods.com/s/AKfycbzfPgCJKcCbp2wF0DolkxFZLVNteiZkNFh71PXJWtNEYvuFPcj5hZgdSJgicuNU-Gpepw/exec`

현재 상태: **API·슬라이드 구현 완료, 실데이터 대조는 시트 권한 해결 대기.** 앱스스크립트 프로젝트 "임금시간생산성"의 코드를 확인했다.
원천 시트·열·계산식·팀↔공장 매핑·확인할 점은 [labor-data-notes.md](labor-data-notes.md) 에 정리했다.
아래 4-1~4-4는 파악 전에 세운 초안이며, 확정 사항은 labor-data-notes.md 가 우선한다.

2026-11-11 추가 결정: **인원·노무비 지표의 생산실적에서 FD·분말스프 제외**. K1=냉동+조미, K2=즉석밥, K3=라면. 단위당 노무비·인당 생산량의 product-cst 생산량과 모든 비교 기간·추이에 같은 범위를 적용했다.

생산성의 공식 출처는 **product-cst** (2026-11-11 사용자 결정). 앱스스크립트의 MH생산성·실질MH생산성·생산성차이는 사용하지 않고, 인원·노무비·근로시간만 연동한다.

### 2026-11-11 구현 결과
- product-cst `src/lib/report/labor.ts`: 읽기 전용 Sheets API, 헤더 기반 파싱, 월·팀 중복/셀 검증, 생산량 범위 매칭, 시간 합계 기반 의존도, 당월·전월·전년·12개월 데이터. `LABOR_SHEET_ID`로 시트 변경 가능(미설정 시 메모의 원천 ID).
- product-cst 월간 API `labor` 블록 추가, 캐시 키 v2로 변경. 시트 실패는 `labor.status=error`로 분리해 원가 응답을 유지한다. 권한 변경 후 `fresh=1`로 재조회해야 기존 오류 캐시를 우회할 수 있다.
- monthly_pr `LaborSlide.tsx` 추가: KPI 4개, 추이 2개, 팀별 표. 전체 **14장 / 공장별 4장**. 목표 데이터가 없어 목표 비교는 미설정 표시.
- 실제 product-cst 생산팀 확인: K1 조리냉동/조미HMI, K2 즉석밥1/2와 FD, K3 건면/요리면/유탕면. K3 요리면은 라면 범위에 포함. K1 조미의 분말 라인은 K3 분말스프와 별개이므로 유지.
- 테스트 4개 통과: 제외 범위, 합산/비교, 누락·0 구분, 헤더·중복·날짜. monthly_pr 타입·린트·빌드 통과. 정상/오류 슬라이드를 검증용 데이터로 브라우저 확인, 슬라이드 밖 넘침 없음(`.qa/labor-preview.png`).
- 서비스 계정 실제 재조회 결과는 여전히 **The caller does not have permission**. 실데이터 노무비·시간 정의 대조, 실제 로그인/배포 검증은 미완료. 이 세션에서는 배포하지 않았다.

### 4-1. 먼저 확인할 것
1. 원천이 무엇인가. 앱스스크립트가 읽는 **구글 시트 ID·탭·컬럼**을 받는 것이 가장 좋다. 스크립트 코드(`Code.gs`)를 보여주면 바로 파악된다.
2. 단위: 공장 × 월(또는 일) × 팀/라인 중 어디까지 나뉘는가. K2는 즉석밥/FD, K1은 냉동/조미로 나뉘어야 다른 지표와 붙는다.
3. 정의 확정 (아래 4-2 기본안을 사용자에게 확인).
4. 노무비 금액이 들어 있는가, 시간·인원만 있는가.

### 4-2. 지표 기본안 (확인 필요)
| 지표 | 기본 정의 | 단위 | 공장 간 합산 |
|---|---|---|---|
| 단위당 노무비 | 노무비(원) ÷ 생산량 | 원/kg, 원/식 | 불가 (공장별만) |
| 연장근무 의존도 | 연장근무시간 ÷ 총근무시간 | % | 시간 합으로 재계산하면 가능 |
| 생산직 인원 | 월평균 재적(정규+도급/임시 구분) | 명 | 가능 |
| 인당 생산량 | 생산량 ÷ 생산직 인원 | kg/인, 식/인 | 불가 |
| (선택) 노무비 비중 | 노무비 ÷ 제조원가 | % | 금액 합으로 재계산하면 가능 |

생산량은 product-cst 실적과 같은 값을 써야 단위원가와 맞는다. 노무비 출처의 생산량을 쓰면 원가 장과 숫자가 어긋난다.

### 4-3. 연결 방식 후보
- **권장: 원천 시트를 서비스 계정으로 직접 읽기.** product-cst가 이미 같은 방식(`googleapis`, `spreadsheets.readonly`)이다. product-cst에 `/api/report/monthly`의 `labor` 블록으로 추가하면 생산량과 같은 곳에서 나눠 계산할 수 있다. 시트를 서비스 계정 이메일에 공유하기만 하면 된다.
- 대안: 앱스스크립트 `doGet` 에 JSON 응답 + 토큰 파라미터 추가. 단 웹앱이 하림 도메인 로그인으로 막혀 있어 Vercel 서버에서 호출하려면 배포 권한을 "모든 사용자"로 바꿔야 해 보안 검토가 필요하다.
- plog에도 인원(`manpower_logs`: 정규·임시·잔업시간)이 있다. 앱스스크립트 인원과 정의가 다르면 어느 쪽을 공식으로 쓸지 정해야 한다.

### 4-4. 보고서 배치안
- 공장별 4번째 장 **"인력 · 노무비"** 추가 (또는 운영 장 하단 교체).
  - KPI 4개: 단위당 노무비(전년·전월·목표 대비), 연장근무 의존도, 생산직 인원, 인당 생산량.
  - 12개월 추이: 단위당 노무비 당해 vs 전년, 연장근무 의존도.
  - 팀·라인별 표: 인원, 연장시간, 인당 생산량.
- 요약 장 게이지 4개 중 하나를 "연장근무 의존도"로 바꾸는 안도 검토.
- 종합 장: 노무비 총액, 공장별 연장시간, 총 인원 (금액·시간·인원만).
- 작업 위치: product-cst `src/lib/report/monthly.ts`(또는 새 `labor.ts`) → monthly_pr `src/domain/types.ts` 의 `CostReport` 확장 → `src/components/slides/` 새 장 → `deck.tsx` 장 순서.

## 5. 다음 작업 ② 마무리·배포

- [ ] 커밋: product-cst, plog 변경 커밋. monthly_pr는 아직 git 저장소가 아니다(`git init` + GitHub 저장소 생성 필요).
- [ ] 배포 환경변수
  - plog: `REPORT_API_TOKEN` 신규 등록.
  - product-cst: `MCP_TOKEN` 이 운영에 있는지 확인.
  - monthly_pr: `PRODUCT_CST_BASE_URL/TOKEN`, `PLOG_BASE_URL/TOKEN`, `DATABASE_URL`(plog와 동일), `SESSION_SECRET`(plog와 동일). `DEV_BYPASS_AUTH` 는 넣지 않는다.
- [ ] 실제 plog 계정 PIN으로 로그인 테스트 (지금까지는 로컬 `DEV_BYPASS_AUTH=1`로만 확인).
- [ ] 역할별 권한 확인: 담당 저장 가능, 다른 공장 계정·CEO 읽기 전용.
- [ ] Chrome 인쇄 미리보기에서 실제 PDF 저장 확인(배경 그래픽 켜기).

## 6. 데이터 확인 필요 (원천 쪽)

- **plog K3 분말스프팀 2026-10 비계획정지율 147.6%**, 가동률 30.3%. 입력 오류로 보인다. K3 공장 가동률·정지율 게이지가 이 값에 끌려 내려간다.
- **K1 제조원가 목표 대비 +45.8%** (실적 8,886 vs 목표 6,097 원/kg). product-cst 원가 시트의 목표 컬럼 값 확인 필요.
- K1 생산량 전년동월 대비 −50.7%: 실제 감산인지 시트 누락인지 확인.
- plog 앱 도입(2026-04) 이전 달은 운영 지표 전년 비교가 비어 "–"로 표시된다. 정상.

## 7. 추가 개선 아이디어 (우선순위 순)

1. **인원·노무비 장** (4장).
2. **공장 게이지 기준 팀 정리**: 공장 합산 가동률·정지율에 분말스프팀처럼 성격이 다른 팀이 섞인다. 공장별 대표 팀만 쓸지, 팀별 게이지로 바꿀지 결정.
3. **노트 작성 마감 알림**: 매월 초 미작성 공장을 홈에 강조, 필요하면 카카오톡·메일 알림.
4. **AI 초안**: `NoteDraftProvider` 구현. 그달 브리지·위험 품목·정지 Top을 넣어 개선활동 초안을 만들고 실무자가 고친다.
5. **노트 확정(잠금) 단계**: 보고 전 공장장 확정 → 이후 수정 이력에 표시.
6. **발표 중 클릭 드릴다운**: 원가 장 라인 행 → product-cst 대시보드 해당 라인으로 이동.
7. **"최신값으로 새로고침" 버튼**: 관리자가 `fresh=1` 로 캐시 우회.
8. **표지 three.js 블록**: product-cst `factory-scene.tsx` 의 공장 배치를 재사용해 표지에 공장 상태 미니 맵.
9. 운영 장 오른쪽 아래 빈 공간 활용(예: 인원 추이), K2 생산량 라벨 겹침 정리.
10. plog ESLint 설정 오류(기존 문제, 설정 파일을 못 읽음) 정리.

## 8. 로컬에서 다시 띄우기

세 앱을 각자 다른 포트로 띄운다. 토큰은 로컬 테스트용 아무 값이나 양쪽에 같게 준다.

```bash
cd C:/Users/USER/Desktop/project/sap_link/product-cst && MCP_TOKEN=local-report-test npx next dev -p 3101
```

```bash
cd C:/Users/USER/Desktop/project/sap_link/plog && REPORT_API_TOKEN=local-report-test npx next dev -p 3102
```

```bash
cd C:/Users/USER/Desktop/project/sap_link/monthly_pr && npm run dev
```

monthly_pr `.env.local` 은 위 두 주소(`http://localhost:3101`, `:3102`)와 토큰 `local-report-test`, plog의 `DATABASE_URL`·`SESSION_SECRET`, `DEV_BYPASS_AUTH=1` 로 이미 만들어져 있다. 확인 주소: http://localhost:3100/report/202610


## 2026-11-11 보고서 개선 요청 반영
- K1 1장 제조원가 비교 막대: 전년/전월/실적. K2·K3 공통 적용.
- K1 요약·팀별 생산량: kg → ton (÷1,000), 만 단위 축약 제거. 원가/kg·생산성 kg/MH는 기존 단위 유지.
- 물량 계획달성률: 생산일보 primaryTeams의 계획/실적물량 표시. 원가 API 생산량과 출처가 다름을 명시. 비계획정지율: 모든 운영팀의 계획시간(h)과 비계획정지시간(h) 표시.
- 풀/주간 1교대 CAPA 병기. 기존 mr_monthly_capacity의 별도 scope `<기존 scope>-day`로 주간 월 CAPA를 저장하므로 스키마 변경 없음. 관리자 입력 UI·서버 검증 포함. 미입력은 추정하지 않음.
- 생산성 추이: 적색 실선=실적, 회색 실선=전년동월, 남색 점선=목표 명시.
- 원가 품목 기여도: 녹색 음수=원가하락, 적색 양수=원가상승 표시. 비교기준별 품목 기준단가→당월단가 병기. 재료비 초과 → 재료비 관리.
- 2026-10 API fresh 재조회 검증: 냉동팀 2025-10 노무비 362,786,581원 / 338,496kg = 1,071.7603원/kg, 2026-10 215,368,425원 / 220,386kg = 977.2328원/kg (약 8.8% 개선). K1 전체는 776.1561→896.6064원/kg (약 15.5% 상승). 더미식 육즙고기교자 품목은 당월 7,542.98원/kg, 전월 8,740.22원/kg, 목표 4,329.42원/kg으로 전월/목표 비교 부호가 다른 것이 정상.
- 인력·노무비 API 93개 당월/비교월/추이 포인트의 단위당 노무비·인당 생산량·연장 의존도 산식, K1/K2/K3 물량달성률·비계획정지율 분모 일치 검증. 팀별 노무비 비교 기준값 및 계산식 표시 보강.
- 검증: production build, TypeScript, ESLint, capacity/labor 비교 테스트 6개 통과. 실제 API 데이터로 세 공장 13장 정적 렌더 후 브라우저 확인, 본문/패널 넘침 0. 브라우저에서 발견한 팀별 장 높이 초과 및 원가 숫자 겹침 수정.
- 주간 CAPA 실값은 관리자 입력 필요. 배포·원천 데이터 변경 없음.


## 2026-11-11 주간 CAPA 저장 오류 수정
- 기존 DB의 mr_monthly_capacity_scope_check가 풀 CAPA 5개만 허용해 주간 -day scope 저장이 거절되는 원인 확인.
- scripts/migrate.mjs의 신규 테이블 정의와 기존 CHECK 갱신을 함께 수정하고 연결 DB에 적용. 기존 데이터 보존.
- 풀/주간 10개 scope의 DB 쓰기를 롤백 검증하여 모두 통과.


## 2026-11-11 가동률 비교 및 생산수량 단위 전체 통일
- 풀/주간 CAPA 카드에 당월·전월·전년동월 가동률을 각각 표시. 주간 비교도 각 비교 월 CAPA로 계산하고 K1 팀별 표에 연결.
- DB 조회 결과 2026-10 기준값만 입력되어 있음. 전월 2026-09·전년동월 2025-10은 CAPA 미입력을 명시하며 당월 CAPA로 임의 대체하지 않음.
- 공통 수량 표시 함수 추가. K1 전체 생산량·계획/실적수량·인당 생산량·CAPA 화면 입력/출력은 TON(인당 TON/인)으로 통일. K2/K3 식 유지. 원가/kg·노무비/kg·생산성 kg/MH는 해당 지표 원래 단위 유지.
- CAPA 입력은 TON, DB 저장은 기존 kg를 유지하여 기존 기준값·가동률 보존.
- 검증: 타입/린트/빌드 통과, 산식·단위 환산·저장 역환산 테스트 9개 통과. 세 공장 13장 브라우저 검토 후 CAPA 카드 간격 축소로 운영 장 높이 보정.
