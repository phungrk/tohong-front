// Điều hướng theo lịch sử trình duyệt (T-030, spec T-027).
//
// Mô hình:
//  - Trang (tab, trang con) có địa chỉ hash riêng; mỗi lần đổi trang là một bước lịch sử.
//  - Lớp (ngăn kéo, sheet, chat AI...) không có địa chỉ; mỗi lớp mở là một bước lịch sử cùng địa chỉ
//    với trang bên dưới. Back đóng lớp trên cùng.
//  - Mỗi bước mang history.state = { th: 1, layers, idx }:
//      layers = số lớp đang mở tại bước đó, idx = số bước trang của app đứng trước nó.
//  - Không chèn bước giả, không bắt popstate để đẩy lại bước: ở gốc, Back rời app.

import { useEffect, useRef, useSyncExternalStore } from 'react';

const TAB_HASH = { 0: 'trang-chu', 2: 'ke-hoach', 3: 'ngan-sach', 4: 'khach-moi' };
const HASH_TAB = { 'trang-chu': 0, 'ke-hoach': 2, 'ngan-sach': 3, 'khach-moi': 4 };
const BUDGET_TAB = 3;
const HASH_RE = /^#\/(trang-chu|ke-hoach|ngan-sach(\/[A-Za-z0-9_.~%-]+)?|khach-moi)$/;

export function parseHash(hash) {
  if (!HASH_RE.test(hash)) return null;
  const [name, rest] = hash.slice(2).split('/');
  const tab = HASH_TAB[name];
  let catId = null;
  if (tab === BUDGET_TAB && rest) {
    try { catId = decodeURIComponent(rest); } catch { return null; }
  }
  return { tab, catId };
}

export function buildHash(tab, catId = null) {
  const base = `#/${TAB_HASH[tab] || TAB_HASH[0]}`;
  return tab === BUDGET_TAB && catId ? `${base}/${encodeURIComponent(catId)}` : base;
}

const urlWith = (hash) => window.location.pathname + window.location.search + hash;

let started = false;
let route = { tab: 0, catId: null };
let curIdx = 0;        // số bước trang của app đứng trước bước hiện tại
let stack = [];        // lớp đang mở (thứ tự mở)
let depth = 0;         // số bước lớp trong lịch sử sau khi các lần lùi đang chờ xong
let pending = 0;       // số lần history.go đang chờ popstate
let queue = [];        // việc chờ lịch sử ổn định
let closingSub = false;
let seq = 0;
const listeners = new Set();

function emit() { listeners.forEach((l) => l()); }

function setRoute(next) {
  if (next.tab === route.tab && next.catId === route.catId) return;
  route = next;
  emit();
}

function syncRoute() {
  const parsed = parseHash(window.location.hash);
  if (parsed) setRoute(parsed);
}

function flush() {
  while (queue.length && pending === 0) queue.shift()();
}

function run(fn) {
  if (pending > 0) queue.push(fn);
  else fn();
}

function traverse(delta) {
  pending += 1;
  const mine = ++seq;
  window.history.go(delta);
  // Lưới an toàn: nếu popstate không bao giờ tới thì không kẹt hàng đợi.
  setTimeout(() => {
    if (pending > 0 && seq === mine) { pending = 0; depth = stack.length; closingSub = false; flush(); }
  }, 1500);
}

function onPop(e) {
  let st = e.state;
  if (!st || !st.th) {
    // Bước do trình duyệt tạo (người dùng gõ hash): coi là trang bình thường.
    st = { th: 1, layers: 0, idx: curIdx + 1 };
    window.history.replaceState(st, '', window.location.href);
  }
  const k = st.layers || 0;
  curIdx = st.idx || 0;
  while (stack.length > k) {
    const layer = stack.pop();
    if (!layer.dead) { layer.dead = true; layer.close(); }
  }
  emit();
  if (pending > 0) pending -= 1;
  if (pending === 0) { depth = stack.length; closingSub = false; }
  syncRoute();
  if (k > stack.length) {
    // Bước của một lớp không còn: Forward vào lớp cũ, hoặc Back về sau khi gõ hash. Lùi qua nó.
    depth = stack.length;
    traverse(-(k - stack.length));
    return;
  }
  flush();
}

function start() {
  if (started) return;
  started = true;
  const st = window.history.state;
  const mine = st && st.th ? st : null;
  curIdx = mine ? mine.idx || 0 : 0;
  const layers = mine ? mine.layers || 0 : 0;
  const parsed = parseHash(window.location.hash);
  if (parsed) {
    route = parsed;
    if (!mine) window.history.replaceState({ th: 1, layers: 0, idx: 0 }, '', window.location.href);
  } else {
    route = { tab: 0, catId: null };
    window.history.replaceState({ th: 1, layers: 0, idx: curIdx }, '', urlWith(buildHash(0)));
  }
  window.addEventListener('popstate', onPop);
  // Tải lại khi đang mở lớp: lớp không khôi phục, lùi qua các bước lớp để không còn bước chết.
  if (parsed && layers > 0) traverse(-layers);
}

function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function getRoute() {
  start();
  return route;
}

const getLayerCount = () => stack.length;

/** Số lớp đang mở (để ẩn khối gợi ý cài khi có lớp phủ). */
export function useLayerCount() {
  return useSyncExternalStore(subscribe, getLayerCount, () => 0);
}

/** Trang hiện tại theo địa chỉ: { tab, catId }. */
export function useRoute() {
  return useSyncExternalStore(subscribe, getRoute, getRoute);
}

function closeLayersThen(fn) {
  if (depth > 0) {
    const d = depth;
    depth = 0;
    traverse(-d);
  }
  run(fn);
}

/** Chạy fn sau khi mọi lớp đã đóng (lớp đóng qua lịch sử, không để bước chết). */
export function afterLayersClosed(fn) {
  start();
  closeLayersThen(fn);
}

/** Sang tab (và danh mục ngân sách nếu có). Cùng địa chỉ thì không thêm bước. */
export function goTab(tab, catId = null) {
  start();
  const hash = buildHash(tab, catId);
  closeLayersThen(() => {
    if (window.location.hash === hash) return;
    curIdx += 1;
    window.history.pushState({ th: 1, layers: 0, idx: curIdx }, '', urlWith(hash));
    syncRoute();
  });
}

export function openCategory(catId) { goTab(BUDGET_TAB, catId); }

/** "Quay lại" của trang con: như Back nếu còn bước của app phía trước, không thì thay địa chỉ. */
export function closeSubpage() {
  start();
  if (!route.catId || closingSub) return;
  closingSub = true;
  closeLayersThen(() => {
    if (!route.catId) { closingSub = false; return; }
    if (curIdx > 0) {
      traverse(-1);
    } else {
      window.history.replaceState({ th: 1, layers: 0, idx: curIdx }, '', urlWith(buildHash(BUDGET_TAB)));
      syncRoute();
      closingSub = false;
    }
  });
}

/** Danh mục trong địa chỉ không có (dữ liệu đã về): thay địa chỉ bằng danh sách, không thêm bước, không lùi. */
export function dropMissingCategory() {
  start();
  if (!route.catId || closingSub) return;
  window.history.replaceState({ th: 1, layers: 0, idx: curIdx }, '', urlWith(buildHash(BUDGET_TAB)));
  syncRoute();
}

function openLayer(close) {
  start();
  const layer = { close, dead: false };
  run(() => {
    if (layer.dead) return;
    window.history.pushState({ th: 1, layers: stack.length + 1, idx: curIdx }, '', window.location.href);
    stack.push(layer);
    depth = stack.length;
    emit();
  });
  return layer;
}

function closeLayer(layer) {
  layer.dead = true;
  const i = stack.indexOf(layer);
  if (i < 0 || i >= depth) return;
  const delta = i - depth;
  depth = i;
  traverse(delta);
}

/**
 * Lớp phủ: khi `open` là true, thêm một bước lịch sử; Back đóng lớp (gọi onClose).
 * Đóng bằng giao diện (open thành false) lùi bước của lớp để không còn bước chết.
 */
export function useHistoryLayer(open, onClose, { defer = false } = {}) {
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });
  useEffect(() => {
    if (!open) return undefined;
    let layer = null;
    // defer: lớp con xếp sau lớp cha mở cùng lượt (effect của con chạy trước effect của cha).
    const timer = defer ? setTimeout(() => { layer = openLayer(() => closeRef.current()); }, 0) : null;
    if (!defer) layer = openLayer(() => closeRef.current());
    return () => {
      if (timer) clearTimeout(timer);
      if (layer) closeLayer(layer);
    };
  }, [open, defer]);
}
