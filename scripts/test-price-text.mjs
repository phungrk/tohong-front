// T-164: chữ giá hiện ra: nhà hàng có nguồn giá ghi theo bàn, hạng mục khác ghi theo gói. node --test scripts/test-price-text.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { priceText, fmtTr, rangeTr } from '../src/ui/priceText.js';

test('giá một khoảng và một điểm', () => {
  assert.equal(priceText(4, 4.6), '4tr–4,6tr');
  assert.equal(priceText(4, 4), '4tr');
  assert.equal(priceText(4, null), '4tr');
});

test('nhà hàng theo bàn', () => {
  assert.equal(priceText(4, 4.6, true), '4tr–4,6tr/bàn');
  assert.equal(priceText(4, null, true), '4tr/bàn');
});

test('hai đầu cùng chữ thì một số; chuỗi từ API', () => {
  assert.equal(priceText(3.5, 3.5), '3,5tr');
  assert.equal(priceText(4.2, 4.24, true), '4,2tr/bàn');
  assert.equal(priceText('12.34', '14.0'), '12,3tr–14tr');
  assert.equal(rangeTr('4.3', '4.8'), '4,3–4,8tr');
  assert.equal(rangeTr(25, 27), '25–27tr');
  assert.equal(rangeTr(4.2, 4.24), '4,2tr');
});

test('fmtTr: |x| làm tròn rồi đặt dấu, 0 không dấu', () => {
  assert.equal(fmtTr(-3.75), '-3,8');
  assert.equal(fmtTr(-0.04), '0');
  assert.equal(fmtTr(0.04, { plus: true }), '0');
  assert.equal(fmtTr(1.15, { plus: true }), '+1,2');
  assert.equal(fmtTr(-7.74, { minus: '−' }), '−7,7');
  assert.equal(fmtTr(105.74000000000001), '105,7');
  assert.equal(fmtTr(1440), '1440');
  assert.equal(fmtTr(undefined), '');
});

test('T-193: giá rỗng và khoảng một đầu rỗng', () => {
  assert.equal(priceText('', null), 'Chưa có giá');
  assert.equal(priceText(0, null), '0tr');
  assert.equal(priceText('', 5, false, true), 'Đến 5tr');
  assert.equal(priceText(null, 6, true, true), 'Đến 6tr/bàn');
  assert.equal(priceText(4, '', false, true), 'Từ 4tr');
  assert.equal(priceText(undefined, undefined, false, true), 'Chưa có giá');
  assert.equal(priceText(4, 5, false, true), '4tr–5tr');
  assert.equal(priceText(0, 5, false, true), '0tr–5tr');
});
