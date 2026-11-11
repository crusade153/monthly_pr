import assert from 'node:assert/strict';
import { test } from 'node:test';
import { noteDetailPages, noteNeedsDetail, wrapNoteLines } from './notes-layout';
import { parseNoteLines } from './notes-format';
import type { PlantNotes } from './types';
const notes = (improvement: string, plan = ''): PlantNotes => Object.fromEntries(
 ['improvement','plan'].map(section => [section, {plant:'K2', month:'2026-10', section, body:section==='improvement'?improvement:plan,version:1,updatedBy:'작성자',updatedAt:null}])
) as PlantNotes;

test('짧은 노트는 별도 장 없이 요약에서 표시한다', () => {
 assert.equal(noteNeedsDetail(notes('1. 개선활동\n-. 상세내용')),false);
 assert.deepEqual(noteDetailPages(notes('')),[]);
});
test('긴 노트는 모든 항목을 순서대로 여러 장에 보존한다', () => {
 const body=Array.from({length:55},(_,i)=>`항목 ${i+1} 개선활동`).join('\n');
 const pages=noteDetailPages(notes(body,'다음달 계획'));
 assert.equal(pages.length,4);
 assert.ok(pages.every(p=>p.lines.length<=20));
 assert.deepEqual(pages.filter(p=>p.section==='improvement').flatMap(p=>p.lines.map(l=>l.text)),parseNoteLines(body).map(l=>l.text));
 assert.equal(pages.at(-1)?.lines[0].text,'다음달 계획');
});
test('긴 한 줄·이모지·날짜도 손실 없이 나누어 표시한다', () => {
 const text='생산 인력 안정화🙂'.repeat(80);
 const lines=wrapNoteLines([{kind:'number',num:'1',text,date:'11/10'}],38);
 assert.equal(lines.map(l=>l.text).join(''),text);
 assert.equal(lines[0].kind,'number');
 assert.equal(lines.filter(l=>'date' in l&&l.date).length,1);
 const last=lines.at(-1)!;
 assert.equal('date' in last && last.date,'11/10');
 assert.ok(lines.every(l=>Array.from(l.text).length<=38));
});
