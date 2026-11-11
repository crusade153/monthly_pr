import assert from 'node:assert/strict';
import { test } from 'node:test';
import { laborChange, laborInterpretation, laborReadout, laborTone } from './labor-comparison';
import type { LaborPoint } from './types';

test('0 실적은 -100%, 기준 0은 증감량만 표시, 누락은 비교하지 않는다',()=>{
  assert.deepEqual(laborChange(0,10),{amount:-10,percent:-100});
  assert.deepEqual(laborChange(10,0),{amount:10,percent:null});
  assert.deepEqual(laborChange(null,10),{amount:null,percent:null});
  assert.deepEqual(laborChange(10,Infinity),{amount:null,percent:null});
});
test('생산 감소보다 인원 감소가 작으면 인당 생산량이 내려가고 단위당 노무비가 올라간다',()=>{
  const prev={qty:100,headcount:10,laborCost:1000,unitLaborCost:10,qtyPerPerson:10} as LaborPoint;
  const now={qty:80,headcount:9,laborCost:900,unitLaborCost:11.25,qtyPerPerson:80/9} as LaborPoint;
  const result=laborReadout(now,prev);
  assert.match(result.inputs,/생산량 −20.0% · 인원 −10.0% · 노무비 −10.0%/);
  assert.match(result.outcomes,/단위당 노무비 \+12.5% · 인당 생산량 −11.1%/);
  assert.match(laborInterpretation(now,prev),/생산량 감소폭이 노무비 감소폭보다 커/);
  assert.equal(laborTone('headcount',-10),'flat');
  assert.equal(laborTone('laborCost',-10),'flat');
  assert.equal(laborTone('unitLaborCost',12.5),'bad');
  assert.equal(laborTone('qtyPerPerson',-11.1),'bad');
  assert.equal(laborTone('overtimeDependency',-0.8),'good');
});
