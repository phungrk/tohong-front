// T-164: chữ giá hiện ra: nhà hàng có nguồn giá ghi theo bàn, hạng mục khác ghi theo gói. node --test scripts/test-price-text.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { priceText } from '../src/ui/priceText.js';

test('giá một khoảng và một điểm', () => {
  assert.equal(priceText(4, 4.6), '4tr–4.6tr');
  assert.equal(priceText(4, 4), '4tr');
  assert.equal(priceText(4, null), '4tr');
});

test('nhà hàng theo bàn', () => {
  assert.equal(priceText(4, 4.6, true), '4tr–4.6tr/bàn');
  assert.equal(priceText(4, null, true), '4tr/bàn');
});
