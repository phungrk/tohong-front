import test from 'node:test';
import assert from 'node:assert/strict';
import { sameSig, sigLabel } from '../src/budget/sigLabel.js';

test('nhãn đúng ba dạng số (T-179 H3)', () => {
  assert.equal(sigLabel({ d: 90, k: 200 }), 'Theo dự toán 90tr · 200 khách');
  assert.equal(sigLabel({ d: 39.5, k: 200 }), 'Theo dự toán 39,5tr · 200 khách');
  assert.equal(sigLabel({ d: 90, k: 0 }), 'Theo dự toán 90tr');
  assert.equal(sigLabel({ d: 0, k: 200 }), 'Chưa có dự toán cho hạng mục này');
  assert.equal(sigLabel(null), null);
});

test('so số thô: 90 và 90,04 là khác nhau dù cùng nhãn', () => {
  assert.equal(sameSig({ d: 90, k: 200 }, { d: 90, k: 200 }), true);
  assert.equal(sameSig({ d: 90, k: 200 }, { d: 90.04, k: 200 }), false);
  assert.equal(sigLabel({ d: 90.04, k: 200 }), sigLabel({ d: 90, k: 200 }));
  assert.equal(sameSig({ d: 90, k: 200 }, { d: 90, k: 300 }), false);
});
