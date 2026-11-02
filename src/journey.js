// Hàm thuần cho đo hành trình (spec 003). KHÔNG import React/Vite để chạy được bằng `node --test`.
// Mọi hàm ở đây chỉ trả về nhóm / nhãn; giá trị thô (ngân sách, số khách, ngày cưới) không bao giờ ra khỏi file này.

const DAY_MS = 86400000;
const MONTH_MS = 30.44 * DAY_MS;

/* ── Nhóm (bucket) ─────────────────────────────────────────── */

// Ranh giới: cận dưới thuộc nhóm trên (3 tháng → '3to6').
export function monthsToWeddingBucket(date, now = new Date()) {
  if (date == null || date === '') return 'unknown';
  const d = date instanceof Date ? date : new Date(date);
  const t = d.getTime();
  const n = now instanceof Date ? now.getTime() : Number(now);
  if (!Number.isFinite(t) || !Number.isFinite(n)) return 'unknown';
  // Ngày cưới tính hết ngày: cưới hôm nay chưa phải "past".
  if (t + DAY_MS <= n) return 'past';
  const months = (t - n) / MONTH_MS;
  if (months < 3) return 'lt3';
  if (months < 6) return '3to6';
  if (months < 12) return '6to12';
  return 'gt12';
}

export function budgetBucket(tr) {
  const n = Number(tr);
  if (!Number.isFinite(n) || n <= 0) return 'unknown';
  if (n < 100) return 'lt100m';
  if (n < 200) return '100to200m';
  if (n < 400) return '200to400m';
  if (n < 700) return '400to700m';
  return 'gt700m';
}

export function guestsBucket(n) {
  const g = Number(n);
  if (!Number.isFinite(g) || g <= 0) return 'unknown';
  if (g < 100) return 'lt100';
  if (g < 200) return '100to200';
  if (g < 400) return '200to400';
  return 'gt400';
}

// Thuộc tính chung của mọi sự kiện. Chỉ trả nhóm, không bao giờ trả giá trị thô.
export function buildCommonProps(ctx = {}, appVersion = 'dev', now = new Date()) {
  return {
    couple_id: ctx.coupleId || null,
    months_to_wedding: monthsToWeddingBucket(ctx.weddingDate, now),
    budget_bucket: budgetBucket(ctx.budgetTr),
    guests_bucket: guestsBucket(ctx.guestCount),
    platform: 'web',
    app_version: appVersion || 'dev',
  };
}

/* ── Quy đổi giá vendor (dùng chung với VendorCtx) ─────────── */

// Venue báo giá theo bàn (thường 10 khách/bàn) — quy đổi ra tổng chi phí thật theo số khách.
export const GUESTS_PER_TABLE = 10;

// Quy đổi một mức giá của vendor về tổng chi phí của hạng mục.
// Venue có số khách → nhân số bàn; còn lại giữ nguyên.
export function scaleToCategoryTotal(catId, amount, guests) {
  if (catId !== 'venue') return amount;
  const g = Number(guests) || 0;
  return g > 0 ? Math.round((amount / GUESTS_PER_TABLE) * g) : amount;
}

// Nhà hàng tiệc cưới (hạng mục `venue`): tiền chi = số bàn x giá một bàn.
// Số bàn = làm tròn LÊN (số khách / 10). Giá là khoảng thì lấy điểm giữa. Chỉ làm tròn MỘT lần ở bước cuối.
// Thiếu số khách (không phải số nguyên dương) hoặc thiếu giá: không đoán, amt = 0 và có lý do.
export const VENUE_NO_GUESTS = 'Chưa tính được: thiếu số khách';
export const VENUE_NO_PRICE = 'Chưa tính được: vendor chưa có giá';

// Làm tròn 0,5 lên trên SỐ NGUYÊN (giá quy ra phần nghìn triệu) để tránh sai số dấu phẩy động (150 x 4.1 = 61,5 không được ra 61).
function roundTrFromMilli(tables, price) {
  return Math.floor((tables * Math.round(price * 1000) + 500) / 1000);
}

export function venueCost(vendor, guests) {
  const g = Number(guests);
  if (!(Number.isInteger(g) && g > 0)) {
    return { status: 'no-guests', tables: null, amt: 0, reason: VENUE_NO_GUESTS, tablesNote: 'Số bàn: chưa có số khách' };
  }
  const tables = Math.ceil(g / GUESTS_PER_TABLE);
  const tablesNote = `Số bàn: ${tables}`;
  const min = Number(vendor?.priceTotal ?? vendor?.price ?? 0);
  const hasMax = vendor?.priceMax != null;
  const price = hasMax ? (min + Number(vendor.priceMax)) / 2 : min;
  if (!Number.isFinite(price) || price <= 0) {
    return { status: 'no-price', tables, amt: 0, reason: VENUE_NO_PRICE, tablesNote };
  }
  return { status: 'ok', tables, amt: roundTrFromMilli(tables, price), reason: null, tablesNote };
}

// Tiền chi lúc chốt vendor: venue theo số bàn (venueCost); hạng mục khác giữ nguyên (trung bình min/max).
export function confirmedAmount(catId, vendor, guests) {
  if (catId === 'venue') return venueCost(vendor, guests).amt;
  const min = vendor.priceTotal ?? vendor.price ?? 0;
  return vendor.priceMax != null ? (min + vendor.priceMax) / 2 : min;
}

// Nhóm giá vendor so với ngân sách hạng mục (R9). allocatedTr là MỘT SỐ (triệu); 0/thiếu → unknown.
export function priceBand({ catId, vendor, allocatedTr, guestCount } = {}) {
  const budget = Number(allocatedTr);
  if (!Number.isFinite(budget) || budget <= 0 || !vendor) return 'unknown';
  const min = Number(vendor.priceTotal ?? vendor.price ?? 0);
  if (!Number.isFinite(min) || min <= 0) return 'unknown';
  const rawMax = vendor.priceMax != null ? Number(vendor.priceMax) : min;
  const max = Number.isFinite(rawMax) ? Math.max(rawMax, min) : min;
  if (catId === 'venue' && !(Number(guestCount) > 0)) return 'unknown';
  const lo = scaleToCategoryTotal(catId, min, guestCount);
  const hi = scaleToCategoryTotal(catId, max, guestCount);
  if (lo > 1.1 * budget) return 'above';
  if (hi < 0.9 * budget) return 'below';
  return 'within';
}

/* ── Hồ sơ cặp đôi ─────────────────────────────────────────── */

const hasText = (v) => typeof v === 'string' ? v.trim() !== '' : v != null && v !== '';

// p: { wedding_date, budget (triệu), guest_count, city, region?, bride_region?, groom_region?, style? }
export function isProfileComplete(p = {}) {
  return hasText(p.wedding_date)
    && Number(p.budget) > 0
    && Number(p.guest_count) > 0
    && (hasText(p.region) || hasText(p.bride_region) || hasText(p.groom_region) || hasText(p.city));
}

// Danh sách cố định: city, wedding_date, budget, guest_count, region, style.
// `style` chỉ được tính khi người gọi có cung cấp khoá đó (summary không có phong cách).
export function missingProfileFields(p = {}) {
  const missing = [];
  if (!hasText(p.city)) missing.push('city');
  if (!hasText(p.wedding_date)) missing.push('wedding_date');
  if (!(Number(p.budget) > 0)) missing.push('budget');
  if (!(Number(p.guest_count) > 0)) missing.push('guest_count');
  if (!(hasText(p.region) || hasText(p.bride_region) || hasText(p.groom_region) || hasText(p.city))) missing.push('region');
  if ('style' in p && !(Array.isArray(p.style) ? p.style.length > 0 : hasText(p.style))) missing.push('style');
  return missing;
}

// R5: quyết định có bắn profile_completed không.
//  - 'fire'   : bắn
//  - 'silent' : đặt cờ im lặng (cặp đôi cũ đã đủ hồ sơ trước khi có sự kiện này)
//  - 'none'   : không làm gì
// prevComplete: true | false | null (null = chưa từng quan sát trong phiên).
export function profileEventDecision({ complete, flagSet, trigger, prevComplete }) {
  if (!complete || flagSet) return 'none';
  if (trigger === 'onboarding') return 'fire';
  if (prevComplete === false) return 'fire';
  return 'silent';
}

/* ── Nhận biết plan_generated (R7) ─────────────────────────── */

// Dòng phân cách bảng GFM: cần ít nhất một dấu `|` để không nhầm với đường kẻ ngang `---`.
const GFM_SEP = /^\s*\|?\s*:?-{3,}:?\s*\|(?:\s*:?-{3,}:?\s*\|?)*\s*$/m;
const LIST_ITEM = /^\s*(?:[-*•]|\d+[.)])\s+\S/gm;

export function hasGfmTable(text) {
  return typeof text === 'string' && GFM_SEP.test(text);
}

function listItemCount(text) {
  return typeof text === 'string' ? (text.match(LIST_ITEM) || []).length : 0;
}

// → null | { plan_type: 'budget'|'timeline', source: 'action'|'reply' }. Văn bản chỉ được đọc cục bộ.
export function detectPlan({ action, replyText, domains } = {}) {
  if (action && action.success === true) {
    if (action.type === 'add_budget_item') return { plan_type: 'budget', source: 'action' };
    if (action.type === 'add_checklist_task') return { plan_type: 'timeline', source: 'action' };
  }
  if (typeof replyText === 'string' && replyText && Array.isArray(domains)) {
    if (domains.includes('budget') && hasGfmTable(replyText)) return { plan_type: 'budget', source: 'reply' };
    if (domains.includes('timeline') && (hasGfmTable(replyText) || listItemCount(replyText) >= 5)) {
      return { plan_type: 'timeline', source: 'reply' };
    }
  }
  return null;
}

/* ── Cờ "đã gửi" (localStorage, có thể thay storage giả khi test) ─ */

export const profileFlagKey = (coupleId) => `th_evt_profile_completed_${coupleId}`;
export const planFlagKey = (coupleId, type) => `th_evt_plan_generated_${coupleId}_${type}`;

function defaultStorage() {
  try { return globalThis.localStorage; } catch { return undefined; }
}

export function hasFlag(key, storage = defaultStorage()) {
  try { return storage?.getItem(key) === '1'; } catch { return false; }
}

export function setFlag(key, storage = defaultStorage()) {
  try { storage?.setItem(key, '1'); return true; } catch { return false; }
}

// true nếu đây là lần đầu (và đặt cờ); false nếu cờ đã có. Storage lỗi → true, không ghi (chấp nhận bắn lại).
export function onceFlag(key, storage = defaultStorage()) {
  if (hasFlag(key, storage)) return false;
  setFlag(key, storage);
  return true;
}

/* ── Nhãn ý định / vai trò mời ─────────────────────────────── */

export const PAIN_LABELS = ['price_fit', 'where_to_start', 'time_pressure', 'family_alignment', 'trust', 'customs', 'other'];

// Nhãn lạ hoặc thiếu → 'other' (không tin hoàn toàn dữ liệu từ mạng).
export function safeIntentLabel(label) {
  return PAIN_LABELS.includes(label) ? label : 'other';
}

const DOMAINS = ['budget', 'venue', 'vendor', 'timeline', 'guest', 'theme', 'customs'];
export function safeDomains(domains) {
  return Array.isArray(domains) ? domains.filter((d) => DOMAINS.includes(d)).slice(0, 3) : [];
}

// UI → { invitee_role (sự kiện), role (gửi API) }
export const INVITE_ROLES = {
  partner: { label: 'Người ấy', role: 'member' },
  parent:  { label: 'Bố mẹ',    role: 'viewer' },
  other:   { label: 'Khác',     role: 'viewer' },
};

export function isValidEmail(s) {
  return typeof s === 'string' && s.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());
}
