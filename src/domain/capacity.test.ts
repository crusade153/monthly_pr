import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildCapacityReport, fixedCapacitySettings, type CapacitySetting } from './capacity';
import type { CostReport } from './types';
const setting = (month: string, scope: string, fullQty: number): CapacitySetting => ({month,scope,fullQty,version:1,updatedAt:'2026-11-11',updatedBy:'TEST'});
const cost = {prevMonth:'2026-09', prevYearMonth:'2025-10', segments:[
  {key:'K1-frozen',current:{qty:100},prevMonth:{qty:200},prevYear:{qty:50}},
  {key:'K1-season',current:{qty:300},prevMonth:{qty:300},prevYear:{qty:100}},
], capacityProduction:{'K2-1':{current:1000,prevMonth:200,prevYear:50},'K2-2':{current:500,prevMonth:null,prevYear:null}}, lines:[],summary:{current:{qty:1000},prevMonth:{qty:500},prevYear:{qty:250}}} as unknown as CostReport;
test('팀별 고정 CAPA를 당월·전월·전년에 동일 적용한다',()=>{
 const r=buildCapacityReport('K1','2026-10',cost,[setting('2026-10','K1-frozen',200),setting('2026-10','K1-season',600),setting('2026-09','K1-frozen',800)],null);
 assert.equal(r.rows[0].rate,0.5);assert.equal(r.rows[1].rate,0.5);assert.equal(r.rows[0].prevRate,1);assert.equal(r.rows[0].prevYearRate,0.25);
});
test('K2 라인별 실적, K3 공장 실적, 100% 초과 보존',()=>{
 const k2=buildCapacityReport('K2','2026-10',cost,[setting('2026-10','K2-1',500),setting('2026-10','K2-2',1000)],null);
 assert.equal(k2.rows[0].rate,2);assert.equal(k2.rows[1].rate,0.5);
 assert.equal(buildCapacityReport('K3','2026-10',cost,[setting('2026-10','K3',2000)],null).rows[0].rate,0.5);
});
test('CAPA 미입력·0·데이터 오류를 0%로 표시하지 않는다',()=>{
 assert.equal(buildCapacityReport('K1','2026-10',cost,[],null).rows[0].rate,null);
 assert.equal(buildCapacityReport('K1','2026-10',null,[setting('2026-10','K1-frozen',1)],null).rows[0].rate,null);
 assert.equal(buildCapacityReport('K1','2026-10',cost,[setting('2026-10','K1-frozen',0)],null).rows[0].rate,null);
 assert.equal(buildCapacityReport('K1','2026-10',cost,[setting('2026-10','K1-frozen',100)],'DB 오류').rows[0].rate,null);
});

test('주간 1교대 CAPA는 풀 CAPA와 별도 월 기준값을 사용한다', () => {
 const settings = [setting('2026-10','K1-frozen',400),setting('2026-10','K1-frozen-day',100)];
 const row = buildCapacityReport('K1','2026-10',cost,settings,null).rows[0];
 assert.equal(row.rate,0.25); assert.equal(row.dayRate,1); assert.equal(row.dayQty,100);
 assert.equal(buildCapacityReport('K1','2026-10',cost,settings.slice(0,1),null).rows[0].dayRate,null);
 assert.equal(buildCapacityReport('K1','2026-10',cost,settings,'DB 오류').rows[0].dayRate,null);
 for (const [plant,scope] of [['K2','K2-1'],['K3','K3']] as const) {
  const r=buildCapacityReport(plant,'2026-10',cost,[setting('2026-10',scope+'-day',500)],null).rows[0];
  assert.equal(r.rate,null); assert.equal(r.dayRate,2);
 }
});

test('월이 바뀌어도 풀/주간 고정 CAPA를 재입력하지 않는다', () => {
 const settings = [setting('2026-10','K1-frozen',400),setting('2026-10','K1-frozen-day',200)];
 for (const month of ['2026-10','2026-11','2025-10']) {
  const r=buildCapacityReport('K1',month,cost,settings,null).rows[0];
  assert.equal(r.rate,0.25); assert.equal(r.prevRate,0.5); assert.equal(r.prevYearRate,0.125);
  assert.equal(r.dayRate,0.5); assert.equal(r.prevDayRate,1); assert.equal(r.prevYearDayRate,0.25);
  assert.equal(r.prevFullQty,400); assert.equal(r.prevDayQty,200);
 }
 const error=buildCapacityReport('K1','2026-10',cost,settings,'DB 오류').rows[0];
 assert.equal(error.prevDayRate,null); assert.equal(error.prevYearDayRate,null);
});
test('기존 월별 설정은 가장 최근 저장한 scope별 값 하나로 통합해 읽는다', () => {
 const old=setting('2026-10','K1-frozen',400);
 const revised={...setting('2026-09','K1-frozen',800), updatedAt:'2026-11-12'};
 const rows=fixedCapacitySettings([old,revised,setting('2026-10','K1-frozen-day',200)]);
 assert.equal(rows.length,2);
 assert.equal(rows.find(s=>s.scope==='K1-frozen')?.fullQty,800);
 const r=buildCapacityReport('K1','2026-10',cost,[old,revised],null).rows[0];
 assert.equal(r.rate,0.125); assert.equal(r.prevRate,0.25);
 assert.equal(r.prevYearRate,0.0625);
});
