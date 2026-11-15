// T-174: luật "ghi nào làm đổi điểm vendor" (src/scoreEpoch.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import { profilePatchTouchesScore, budgetScoreSig } from '../src/scoreEpoch.js';

test('hồ sơ: trường ảnh hưởng điểm', () => {
  for (const patch of [
    { guest_count: 300 }, { couple: { guest_count: 300 } }, { preferences: { guest_count: 300 } }, { budget: 500 }, { budget_by_category: {} },
    { couple: { wedding_date: '2027-01-01' } }, { wedding_date: '2027-01-01' }, { couple: { city: 'Hà Nội' } }, { city: 'Hà Nội' },
    { preferences: { style_tags: ['modern'] } },
  ]) assert.equal(profilePatchTouchesScore(patch), true, JSON.stringify(patch));
});

test('hồ sơ: trường không ảnh hưởng điểm', () => {
  for (const patch of [{ couple: { bride_name: 'A', groom_name: 'B' } }, { families: { bride_region: 'bac' } }, {}, null, undefined]) {
    assert.equal(profilePatchTouchesScore(patch), false, JSON.stringify(patch));
  }
});

test('dự toán: chỉ allocated_tr, total_tr, guests, tập hạng mục là đổi', () => {
  const doc = { total_tr: 200, guests: 200, mung_tr: 0, categories: [{ id: 'venue', name: 'A', allocated_tr: 90, items: [] }, { id: 'reserve', allocated_tr: 110 }] };
  const sig = budgetScoreSig(doc);
  const same = { ...doc, mung_tr: 5, categories: [{ id: 'reserve', allocated_tr: 110, priority: 1 }, { id: 'venue', name: 'B', allocated_tr: 90, items: [{ id: 'i', amt: 3 }] }] };
  assert.equal(budgetScoreSig(same), sig, 'tên, khoản, mung_tr, thứ tự không đổi chữ ký');
  assert.notEqual(budgetScoreSig({ ...doc, categories: [{ id: 'venue', allocated_tr: 40 }, { id: 'reserve', allocated_tr: 110 }] }), sig);
  assert.notEqual(budgetScoreSig({ ...doc, guests: 300 }), sig);
  assert.notEqual(budgetScoreSig({ ...doc, total_tr: 250 }), sig);
  assert.notEqual(budgetScoreSig({ ...doc, categories: doc.categories.slice(0, 1) }), sig, 'bớt hạng mục là đổi');
});
