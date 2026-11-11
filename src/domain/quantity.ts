import { fmtNum } from './derived';

// 원천·DB의 kg 값은 유지하고 화면의 생산수량만 TON으로 환산한다.
export function quantityUnit(unit: string): string {
  return unit.toLowerCase() === 'kg' ? 'TON' : unit;
}
export function quantityScale(unit: string): number {
  return unit.toLowerCase() === 'kg' ? 1000 : 1;
}
export function quantityValue(value: number | null | undefined, unit: string): number | null {
  return value == null ? null : value / quantityScale(unit);
}
export function formatQuantity(value: number | null | undefined, unit: string): string {
  return fmtNum(quantityValue(value, unit), quantityScale(unit) === 1000 ? 1 : 0);
}
