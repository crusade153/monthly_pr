'use client';
import { quantityScale, quantityUnit } from '@/domain/quantity';
import { useState, useTransition } from 'react';
import { CAPACITY_INPUT_SCOPES, type CapacitySetting } from '@/domain/capacity';
import { saveCapacity } from './actions';

function CapacityInput({ month, scope, initial }: { month: string; scope: typeof CAPACITY_INPUT_SCOPES[number]; initial?: CapacitySetting }) {
  const [value, setValue] = useState(initial == null ? '' : (initial.fullQty / quantityScale(scope.unit)).toString());
  const [version, setVersion] = useState(initial?.version ?? 0);
  const [message, setMessage] = useState('');
  const [pending, start] = useTransition();
  return <form className="card p-5" onSubmit={e => { e.preventDefault(); start(async () => {
    const result = await saveCapacity({ month, scope: scope.key, fullQty: Number(value) * quantityScale(scope.unit), version });
    if (result.ok && result.version) setVersion(result.version);
    setMessage(result.message);
  }); }}>
    <h2 className="text-lg font-semibold">{scope.plant} · {scope.label}</h2>
    <label className="field-label mt-4" htmlFor={scope.key}>월 {'day' in scope ? '주간 1교대' : '풀'} CAPA 생산량 ({quantityUnit(scope.unit)}/월)</label>
    <div className="flex gap-3"><input id={scope.key} className="field" type="number" required min={0.01 / quantityScale(scope.unit)} max={1e12 / quantityScale(scope.unit)} step="any" value={value} onChange={e => setValue(e.target.value)} disabled={pending} /><button className="btn btn-primary whitespace-nowrap" disabled={pending}>{pending ? '저장 중' : '저장'}</button></div>
    <p className="mt-2 text-sm text-[var(--ink-3)]">{initial ? `최근 저장: ${initial.updatedBy} · ${new Date(initial.updatedAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}` : '미입력 · 보고서에 가동률을 표시하지 않습니다.'}</p>
    <p role="status" className="mt-2 text-sm">{message}</p>
  </form>;
}
export function CapacityForm({ month, settings }: { month: string; settings: CapacitySetting[] }) {
  return <div className="grid gap-4 md:grid-cols-2">{CAPACITY_INPUT_SCOPES.map(scope => <CapacityInput key={`${month}/${scope.key}`} month={month} scope={scope} initial={settings.find(s => s.scope === scope.key)} />)}</div>;
}
