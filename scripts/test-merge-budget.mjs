// T-174 (spec T-171 H5, ADR-104 A): ghép lần ghi lại dự toán sau lỗi. node --test scripts/test-merge-budget.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeBudget, toPayload } from '../src/budget/mergeBudget.js';

const cat = (id, allocated_tr, items = []) => ({ id, name: id, allocated_tr, items });
const doc = (cats, extra = {}) => ({ categories: cats, total_tr: 200, guests: 200, mung_tr: 0, ...extra });
const item = (id, amt, name = id) => ({ id, name, amt });

test('chỉ đè trường người dùng đổi; khoản vendor do ghi khác giữ nguyên', () => {
  const base = doc([cat('venue', 90)]);
  const mine = doc([cat('venue', 40)]);
  const server = doc([cat('venue', 90, [{ id: 'vendor_a', name: 'A', amt: 78, status: 'confirmed', vendor: true }])]);
  const out = mergeBudget(server, base, mine);
  assert.equal(out.categories[0].allocated_tr, 40);
  assert.deepEqual(out.categories[0].items.map((x) => x.id), ['vendor_a']);
});

test('khoản người dùng thêm, sửa, xoá ghép theo id; khoản khác của server giữ', () => {
  const base = doc([cat('venue', 90, [item('i_old', 5), item('i_giu', 3)])]);
  const mine = doc([cat('venue', 90, [item('i_giu', 9), item('i_new', 1)])]);
  const server = doc([cat('venue', 90, [item('i_old', 5), item('i_giu', 3), item('vendor_a', 78)])]);
  const ids = mergeBudget(server, base, mine).categories[0].items;
  assert.deepEqual(ids.map((x) => x.id).sort(), ['i_giu', 'i_new', 'vendor_a']);
  assert.equal(ids.find((x) => x.id === 'i_giu').amt, 9);
});

test('mung_tr, total_tr, guests: người dùng không đổi thì theo server', () => {
  const base = doc([cat('venue', 90)]);
  const mine = doc([cat('venue', 40)]);
  const server = doc([cat('venue', 90)], { mung_tr: 7, guests: 250 });
  const out = mergeBudget(server, base, mine);
  assert.equal(out.mung_tr, 7); assert.equal(out.guests, 250);
  assert.equal(mergeBudget(server, base, { ...mine, guests: 300 }).guests, 300);
});

test('hạng mục: người dùng xoá thì bỏ, người dùng thêm thì thêm, hạng mục chỉ có ở server giữ', () => {
  const base = doc([cat('a', 1), cat('b', 2)]);
  const mine = doc([cat('a', 1), cat('n', 5)]);
  const server = doc([cat('a', 1), cat('b', 2), cat('c', 3)]);
  assert.deepEqual(mergeBudget(server, base, mine).categories.map((c) => c.id), ['a', 'c', 'n']);
});

test('không có nền (chưa từng tải): bản trên màn thắng', () => {
  const out = mergeBudget(doc([cat('venue', 90)]), null, doc([cat('venue', 40)]));
  assert.equal(out.categories[0].allocated_tr, 40);
});

test('toPayload lọc trường chỉ đọc', () => {
  const p = toPayload([{ id: 'v', name: 'V', allocated_tr: 1, estimated_tr: 9, state: 'x', color: 'c', items: [{ id: 'i', name: 'I', amt: 2, isNew: true }] }], { totalTr: 1, guests: 2, mungTr: 3 });
  assert.deepEqual(p, { categories: [{ id: 'v', name: 'V', allocated_tr: 1, items: [{ id: 'i', name: 'I', amt: 2 }] }], total_tr: 1, guests: 2, mung_tr: 3 });
});

test('extendBase: màn đã ghép, nền = server; server đổi nhiều lần không bị coi là người dùng sửa; xoá của người dùng vẫn nhận ra', async () => {
  const { extendBase } = await import('../src/budget/mergeBudget.js');
  const it2 = (amt) => ({ id: 'vendor_a', name: 'A', amt });
  let base = doc([cat('venue', 90, [item('u', 2)])]);
  let shown = doc([cat('venue', 40, [item('u', 8)])]); // người dùng: 90->40, sửa u
  for (const amt of [78, 117]) {
    const server = doc([cat('venue', 90, [item('u', 2), it2(amt)])]);
    shown = mergeBudget(server, base, shown); base = extendBase(base, server);
  }
  const server3 = doc([cat('venue', 90, [item('u', 2), it2(150)])]);
  const out = mergeBudget(server3, base, shown);
  assert.equal(out.categories[0].allocated_tr, 40);
  assert.equal(out.categories[0].items.find((x) => x.id === 'u').amt, 8);
  assert.equal(out.categories[0].items.find((x) => x.id === 'vendor_a').amt, 150);
  shown = doc([cat('venue', 40, [item('u', 8)])]); // người dùng xoá vendor_a
  assert.equal(mergeBudget(server3, base, shown).categories[0].items.some((x) => x.id === 'vendor_a'), false);
});
