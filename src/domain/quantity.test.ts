import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatQuantity, quantityScale, quantityUnit, quantityValue } from './quantity';

test('kg 수량은 보고서 전체에서 TON으로 표시하며 식은 유지한다', () => {
 assert.equal(quantityUnit('kg'), 'TON'); assert.equal(quantityUnit('KG'), 'TON');
 assert.equal(formatQuantity(451199, 'kg'), '451.2');
 assert.equal(formatQuantity(1003, 'KG'), '1.0');
 assert.equal(quantityUnit('식'), '식'); assert.equal(formatQuantity(1003, '식'), '1,003');
 assert.equal(quantityValue(null, 'kg'), null); assert.equal(formatQuantity(null, 'kg'), '–');
 assert.equal(quantityValue(0, 'kg'), 0);
});
test('CAPA 표시값을 다시 저장해도 DB kg 값은 보존한다', () => {
 const original=1365000;
 assert.equal(quantityValue(original,'kg')! * quantityScale('kg'), original);
 assert.equal(quantityValue(1003557,'kg')! * quantityScale('kg'),1003557);
 assert.equal(quantityValue(2925000,'식')! * quantityScale('식'),2925000);
});
