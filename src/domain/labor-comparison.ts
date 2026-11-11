import { fmtSigned, type Tone } from './derived';
import type { LaborPoint } from './types';

// 실제 0과 누락을 구분한다. 기준 0에서는 증감량만 유효하며 증감률은 정의하지 않는다.
export function laborChange(current: number | null | undefined, base: number | null | undefined) {
  if (current == null || base == null || !Number.isFinite(current) || !Number.isFinite(base)) return { amount: null, percent: null };
  return { amount: current - base, percent: base > 0 ? (current / base - 1) * 100 : null };
}
export function laborTone(key: keyof LaborPoint, change: number | null): Tone {
  if (change === null || Math.abs(change) < 0.05) return 'flat';
  if (key === 'unitLaborCost' || key === 'overtimeDependency') return change > 0 ? 'bad' : 'good';
  if (key === 'qtyPerPerson') return change > 0 ? 'good' : 'bad';
  return 'flat';
}
export function laborReadout(current: LaborPoint | null | undefined, base: LaborPoint | null | undefined) {
  const delta = (key: keyof Pick<LaborPoint, 'qty' | 'headcount' | 'laborCost' | 'unitLaborCost' | 'qtyPerPerson'>) => fmtSigned(laborChange(current?.[key], base?.[key]).percent, 1, '%');
  return { inputs: `생산량 ${delta('qty')} · 인원 ${delta('headcount')} · 노무비 ${delta('laborCost')}`,
    outcomes: `단위당 노무비 ${delta('unitLaborCost')} · 인당 생산량 ${delta('qtyPerPerson')}` };
}

export function laborInterpretation(current: LaborPoint | null | undefined, base: LaborPoint | null | undefined): string {
  const qty = laborChange(current?.qty, base?.qty).percent;
  const cost = laborChange(current?.laborCost, base?.laborCost).percent;
  const unit = laborChange(current?.unitLaborCost, base?.unitLaborCost).percent;
  if (qty === null || cost === null || unit === null) return '전월 비교에 필요한 실적이 없어 단위당 노무비 변화를 해석하지 않습니다.';
  if (Math.abs(unit) < 0.05) return '생산량과 노무비가 비슷한 비율로 변해 단위당 노무비는 전월 수준입니다.';
  if (unit > 0) {
    if (qty < 0 && cost < 0) return '생산량 감소폭이 노무비 감소폭보다 커, 노무비 총액 감소에도 단위당 부담은 증가했습니다.';
    if (qty < 0) return '생산량이 감소한 가운데 노무비가 줄지 않아 단위당 부담이 증가했습니다.';
    return '노무비 증가율이 생산량 증가율보다 높아 단위당 부담이 증가했습니다.';
  }
  if (qty > 0 && cost < 0) return '생산량 증가와 노무비 감소가 함께 나타나 단위당 부담이 줄었습니다.';
  if (qty > 0) return '생산량 증가율이 노무비 증가율보다 높아 단위당 부담이 줄었습니다.';
  return '노무비 감소폭이 생산량 감소폭보다 커 단위당 부담이 줄었습니다.';
}
