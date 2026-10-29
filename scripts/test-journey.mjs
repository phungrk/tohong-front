// Test hàm thuần của src/journey.js (spec 003, research R8). Chạy: npm run test:journey
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  monthsToWeddingBucket, budgetBucket, guestsBucket, buildCommonProps,
  GUESTS_PER_TABLE, scaleToCategoryTotal, confirmedAmount, priceBand,
  isProfileComplete, missingProfileFields, profileEventDecision,
  hasGfmTable, detectPlan, onceFlag, hasFlag, setFlag, profileFlagKey, planFlagKey,
  safeIntentLabel, safeDomains, isValidEmail, INVITE_ROLES,
} from '../src/journey.js';

const NOW = new Date('2026-10-29T12:00:00Z');
const inMonths = (m) => new Date(NOW.getTime() + m * 30.44 * 86400000);

/* ── nhóm ────────────────────────────────────────────────── */

test('monthsToWeddingBucket: ranh giới, cận dưới thuộc nhóm trên', () => {
  assert.equal(monthsToWeddingBucket(inMonths(2.99), NOW), 'lt3');
  assert.equal(monthsToWeddingBucket(inMonths(3), NOW), '3to6');
  assert.equal(monthsToWeddingBucket(inMonths(5.99), NOW), '3to6');
  assert.equal(monthsToWeddingBucket(inMonths(6), NOW), '6to12');
  assert.equal(monthsToWeddingBucket(inMonths(11.99), NOW), '6to12');
  assert.equal(monthsToWeddingBucket(inMonths(12), NOW), 'gt12');
  assert.equal(monthsToWeddingBucket(inMonths(30), NOW), 'gt12');
});

test('monthsToWeddingBucket: unknown / past / định dạng chuỗi', () => {
  for (const v of [undefined, null, '', 'khong-phai-ngay', NaN]) {
    assert.equal(monthsToWeddingBucket(v, NOW), 'unknown');
  }
  assert.equal(monthsToWeddingBucket('2026-01-01', NOW), 'past');
  assert.equal(monthsToWeddingBucket(new Date('2026-10-20'), NOW), 'past');
  assert.equal(monthsToWeddingBucket('2026-10-29', NOW), 'lt3'); // cưới hôm nay chưa phải past
  assert.equal(monthsToWeddingBucket('2027-03-14T00:00:00.000Z', NOW), '3to6');
});

test('budgetBucket: ranh giới và unknown', () => {
  const cases = [[99.9, 'lt100m'], [100, '100to200m'], [199, '100to200m'], [200, '200to400m'],
    [399, '200to400m'], [400, '400to700m'], [699, '400to700m'], [700, 'gt700m'], [5000, 'gt700m']];
  for (const [v, want] of cases) assert.equal(budgetBucket(v), want, String(v));
  for (const v of [0, -5, null, undefined, '', 'abc', NaN, Infinity]) assert.equal(budgetBucket(v), 'unknown', String(v));
  assert.equal(budgetBucket('250'), '200to400m');
});

test('guestsBucket: ranh giới và unknown', () => {
  const cases = [[1, 'lt100'], [99, 'lt100'], [100, '100to200'], [199, '100to200'], [200, '200to400'],
    [399, '200to400'], [400, 'gt400'], [1000, 'gt400']];
  for (const [v, want] of cases) assert.equal(guestsBucket(v), want, String(v));
  for (const v of [0, -1, null, undefined, '', 'x']) assert.equal(guestsBucket(v), 'unknown', String(v));
});

/* ── thuộc tính chung (SC-002) ───────────────────────────── */

test('buildCommonProps: chỉ có nhóm, không khoá thô, không giá trị thô', () => {
  const ctx = { coupleId: 'cpl_abc', weddingDate: '2027-03-14', budgetTr: 777, guestCount: 313 };
  const p = buildCommonProps(ctx, 'abc1234', NOW);
  assert.deepEqual(Object.keys(p).sort(),
    ['app_version', 'budget_bucket', 'couple_id', 'guests_bucket', 'months_to_wedding', 'platform']);
  assert.equal(p.platform, 'web');
  assert.equal(p.app_version, 'abc1234');
  assert.equal(p.budget_bucket, 'gt700m');
  assert.equal(p.guests_bucket, '200to400');
  assert.equal(p.months_to_wedding, '3to6');
  for (const forbidden of ['budget', 'guest_count', 'guests', 'wedding_date', 'email', 'name', 'phone']) {
    assert.ok(!(forbidden in p), forbidden);
  }
  const json = JSON.stringify(p);
  for (const raw of ['777', '313', '2027-03-14', '2027']) assert.ok(!json.includes(raw), raw);
});

test('buildCommonProps: thiếu context → unknown, không ném lỗi', () => {
  for (const ctx of [undefined, {}, { budgetTr: 'abc', weddingDate: {} }]) {
    const p = buildCommonProps(ctx, undefined, NOW);
    assert.equal(p.months_to_wedding, 'unknown');
    assert.equal(p.budget_bucket, 'unknown');
    assert.equal(p.guests_bucket, 'unknown');
    assert.equal(p.couple_id, null);
    assert.equal(p.app_version, 'dev');
  }
});

/* ── quy đổi giá + priceBand ─────────────────────────────── */

test('confirmedAmount: kết quả giống công thức cũ của VendorCtx', () => {
  const legacy = (catId, vendor, guests) => {
    const min = vendor.priceTotal ?? vendor.price ?? 0;
    const avg = vendor.priceMax != null ? (min + vendor.priceMax) / 2 : min;
    if (catId !== 'venue') return avg;
    const g = Number(guests) || 0;
    return g > 0 ? Math.round((avg / 10) * g) : avg;
  };
  const vendors = [
    { priceTotal: 6 }, { priceTotal: 6, priceMax: 9 }, { price: 12 }, { priceTotal: 0 }, {},
    { priceTotal: 7.3, priceMax: 8.1 }, { priceTotal: 5, priceMax: null },
  ];
  for (const catId of ['venue', 'photography', 'decor']) {
    for (const v of vendors) {
      for (const g of [0, undefined, null, '', 'x', 50, 123, '200']) {
        assert.equal(confirmedAmount(catId, v, g), legacy(catId, v, g), `${catId} ${JSON.stringify(v)} ${g}`);
      }
    }
  }
  assert.equal(GUESTS_PER_TABLE, 10);
  assert.equal(scaleToCategoryTotal('venue', 6, 200), 120);
  assert.equal(scaleToCategoryTotal('photography', 6, 200), 6);
});

test('priceBand: thiếu ngân sách hoặc giá → unknown', () => {
  const v = { priceTotal: 20 };
  for (const b of [0, undefined, null, '', -3, 'x']) {
    assert.equal(priceBand({ catId: 'photography', vendor: v, allocatedTr: b }), 'unknown', String(b));
  }
  for (const vendor of [{ priceTotal: 0 }, {}, { priceTotal: -1 }, null, undefined]) {
    assert.equal(priceBand({ catId: 'photography', vendor, allocatedTr: 20 }), 'unknown');
  }
  assert.equal(priceBand(), 'unknown');
});

test('priceBand: below / within / above với ngưỡng 0.9 và 1.1', () => {
  const band = (vendor, b) => priceBand({ catId: 'photography', vendor, allocatedTr: b });
  assert.equal(band({ priceTotal: 12 }, 10), 'above');          // 12 > 11
  assert.equal(band({ priceTotal: 11 }, 10), 'within');         // 11 không > 11
  assert.equal(band({ priceTotal: 8 }, 10), 'below');           // max = min = 8 < 9
  assert.equal(band({ priceTotal: 9 }, 10), 'within');          // 9 không < 9
  assert.equal(band({ priceTotal: 8, priceMax: 12 }, 10), 'within'); // khoảng giá chồng ngân sách
  assert.equal(band({ priceTotal: 5, priceMax: 8 }, 10), 'below');
  assert.equal(band({ priceTotal: 15, priceMax: 20 }, 10), 'above');
  assert.equal(band({ priceTotal: 10 }, 10), 'within');
  assert.equal(band({ price: 20 }, 10), 'above');               // fallback field price
});

test('priceBand: venue báo giá theo bàn × số bàn, thiếu số khách → unknown', () => {
  const venue = (vendor, b, g) => priceBand({ catId: 'venue', vendor, allocatedTr: b, guestCount: g });
  // 6tr/bàn × 20 bàn = 120tr
  assert.equal(venue({ priceTotal: 6 }, 100, 200), 'above');   // 120 > 110
  assert.equal(venue({ priceTotal: 6 }, 120, 200), 'within');
  assert.equal(venue({ priceTotal: 6 }, 200, 200), 'below');   // 120 < 180
  assert.equal(venue({ priceTotal: 6, priceMax: 9 }, 150, 200), 'within'); // 120–180
  // không quy đổi thì 6 << 120 → 'below': chứng minh có quy đổi
  assert.notEqual(venue({ priceTotal: 6 }, 120, 200), 'below');
  for (const g of [0, undefined, null, '', 'x']) assert.equal(venue({ priceTotal: 6 }, 120, g), 'unknown', String(g));
  // hạng mục khác không cần số khách
  assert.equal(priceBand({ catId: 'decor', vendor: { priceTotal: 6 }, allocatedTr: 6 }), 'within');
});

/* ── hồ sơ ───────────────────────────────────────────────── */

test('isProfileComplete / missingProfileFields', () => {
  const full = { wedding_date: '2027-03-14', budget: 300, guest_count: 200, city: 'Hà Nội' };
  assert.equal(isProfileComplete(full), true);
  assert.deepEqual(missingProfileFields(full), []);
  assert.equal(isProfileComplete({ ...full, budget: 0 }), false);
  assert.equal(isProfileComplete({ ...full, guest_count: 0 }), false);
  assert.equal(isProfileComplete({ ...full, wedding_date: null }), false);
  assert.equal(isProfileComplete({ ...full, city: '' }), false);
  assert.equal(isProfileComplete({ ...full, city: '', bride_region: 'Bắc' }), true);
  assert.equal(isProfileComplete(), false);
  assert.deepEqual(missingProfileFields({}), ['city', 'wedding_date', 'budget', 'guest_count', 'region']);
  assert.deepEqual(missingProfileFields({ ...full, budget: 0 }), ['budget']);
  assert.deepEqual(missingProfileFields({ ...full, style: [] }), ['style']);
  assert.deepEqual(missingProfileFields({ ...full, style: ['modern'] }), []);
});

test('missingProfileFields: chỉ trả tên khoá cố định, không giá trị', () => {
  const allowed = ['city', 'wedding_date', 'budget', 'guest_count', 'region', 'style'];
  for (const f of missingProfileFields({ style: '' })) assert.ok(allowed.includes(f));
});

test('profileEventDecision (R5): cặp đôi cũ đã đủ hồ sơ → im lặng, không bắn', () => {
  // lần kiểm đầu trên thiết bị, đã đủ, chưa có cờ
  assert.equal(profileEventDecision({ complete: true, flagSet: false, trigger: 'initial', prevComplete: null }), 'silent');
  // sau onboarding đủ 4 trường → bắn
  assert.equal(profileEventDecision({ complete: true, flagSet: false, trigger: 'onboarding', prevComplete: null }), 'fire');
  // thiếu → đủ qua chat / sửa hồ sơ → bắn
  assert.equal(profileEventDecision({ complete: true, flagSet: false, trigger: 'chat_action', prevComplete: false }), 'fire');
  assert.equal(profileEventDecision({ complete: true, flagSet: false, trigger: 'profile_edit', prevComplete: false }), 'fire');
  // chưa từng quan sát thấy thiếu → không bịa chuyển đổi
  assert.equal(profileEventDecision({ complete: true, flagSet: false, trigger: 'chat_action', prevComplete: null }), 'silent');
  assert.equal(profileEventDecision({ complete: true, flagSet: false, trigger: 'chat_action', prevComplete: true }), 'silent');
  // đã có cờ hoặc chưa đủ
  assert.equal(profileEventDecision({ complete: true, flagSet: true, trigger: 'onboarding', prevComplete: false }), 'none');
  assert.equal(profileEventDecision({ complete: false, flagSet: false, trigger: 'onboarding', prevComplete: false }), 'none');
});

/* ── plan_generated ──────────────────────────────────────── */

const TABLE = '| Hạng mục | Tiền |\n|---|---|\n| Tiệc | 100tr |';

test('hasGfmTable: bảng thật có, đường kẻ ngang/văn bản thường không', () => {
  assert.equal(hasGfmTable(TABLE), true);
  assert.equal(hasGfmTable('Hạng mục | Tiền\n:--- | ---:\nTiệc | 100'), true);
  assert.equal(hasGfmTable('|---|'), true);
  assert.equal(hasGfmTable('Đoạn một\n\n---\n\nĐoạn hai'), false);
  assert.equal(hasGfmTable('Không có bảng'), false);
  assert.equal(hasGfmTable(''), false);
  assert.equal(hasGfmTable(undefined), false);
  assert.equal(hasGfmTable(42), false);
});

test('detectPlan: action', () => {
  assert.deepEqual(detectPlan({ action: { type: 'add_budget_item', success: true } }), { plan_type: 'budget', source: 'action' });
  assert.deepEqual(detectPlan({ action: { type: 'add_checklist_task', success: true } }), { plan_type: 'timeline', source: 'action' });
  assert.equal(detectPlan({ action: { type: 'add_budget_item', success: false } }), null);
  assert.equal(detectPlan({ action: { type: 'add_guest', success: true } }), null);
  assert.equal(detectPlan({ action: null }), null);
});

test('detectPlan: reply cần bảng + domain', () => {
  assert.deepEqual(detectPlan({ replyText: TABLE, domains: ['budget'] }), { plan_type: 'budget', source: 'reply' });
  assert.equal(detectPlan({ replyText: TABLE, domains: ['venue'] }), null);
  assert.equal(detectPlan({ replyText: TABLE, domains: [] }), null);
  assert.equal(detectPlan({ replyText: TABLE }), null);            // backend cũ chưa gửi domains
  assert.equal(detectPlan({ replyText: 'không bảng', domains: ['budget'] }), null);
  const list = '1. a\n2. b\n3. c\n4. d\n5. e';
  assert.deepEqual(detectPlan({ replyText: list, domains: ['timeline'] }), { plan_type: 'timeline', source: 'reply' });
  assert.equal(detectPlan({ replyText: '1. a\n2. b', domains: ['timeline'] }), null);
  assert.deepEqual(detectPlan({ replyText: TABLE, domains: ['timeline'] }), { plan_type: 'timeline', source: 'reply' });
  assert.equal(detectPlan(), null);
});

/* ── cờ localStorage ─────────────────────────────────────── */

const fakeStorage = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, m };
};

test('onceFlag: lần đầu true, lần sau false', () => {
  const st = fakeStorage();
  assert.equal(onceFlag('k', st), true);
  assert.equal(onceFlag('k', st), false);
  assert.equal(st.m.get('k'), '1');
  assert.equal(hasFlag('k', st), true);
  assert.equal(hasFlag('other', st), false);
  assert.equal(setFlag('z', st), true);
  assert.equal(hasFlag('z', st), true);
});

test('onceFlag: storage lỗi hoặc không có → true, không ném', () => {
  const broken = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
  assert.equal(onceFlag('k', broken), true);
  assert.equal(onceFlag('k', broken), true); // chấp nhận bắn lại (data-model)
  assert.equal(hasFlag('k', broken), false);
  assert.equal(setFlag('k', broken), false);
  assert.equal(onceFlag('k', undefined), true);
});

test('khoá cờ theo data-model', () => {
  assert.equal(profileFlagKey('c1'), 'th_evt_profile_completed_c1');
  assert.equal(planFlagKey('c1', 'budget'), 'th_evt_plan_generated_c1_budget');
});

/* ── nhãn / mời ──────────────────────────────────────────── */

test('safeIntentLabel / safeDomains', () => {
  for (const l of ['price_fit', 'where_to_start', 'time_pressure', 'family_alignment', 'trust', 'customs', 'other']) {
    assert.equal(safeIntentLabel(l), l);
  }
  for (const l of ['hello', undefined, null, 5, 'Tôi muốn cưới 300 khách']) assert.equal(safeIntentLabel(l), 'other');
  assert.deepEqual(safeDomains(['budget', 'x', 'venue']), ['budget', 'venue']);
  assert.deepEqual(safeDomains('budget'), []);
  assert.deepEqual(safeDomains(undefined), []);
  assert.equal(safeDomains(['budget', 'venue', 'vendor', 'timeline']).length, 3);
});

test('INVITE_ROLES ánh xạ theo data-model, isValidEmail', () => {
  assert.deepEqual(INVITE_ROLES.partner, { label: 'Người ấy', role: 'member' });
  assert.equal(INVITE_ROLES.parent.role, 'viewer');
  assert.equal(INVITE_ROLES.other.role, 'viewer');
  assert.deepEqual(Object.keys(INVITE_ROLES), ['partner', 'parent', 'other']);
  assert.equal(isValidEmail('a@b.vn'), true);
  assert.equal(isValidEmail(' a@b.vn '), true);
  for (const e of ['', 'a', 'a@b', 'a b@c.vn', '@b.vn', null, undefined]) assert.equal(isValidEmail(e), false, String(e));
});
