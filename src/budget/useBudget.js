import { useState, useEffect, useRef } from 'react';
import { api } from '../api.js';
import { toPayload, docToPayload, mergeBudget, extendBase } from './mergeBudget.js';

export const DEFAULT_CATEGORY_PCT = {
  venue: 40, ceremony: 10, photography: 8, jewelry: 7, attire: 6,
  decor: 6, makeup: 3, transport: 2, stationery: 2, honeymoon: 6, reserve: 10,
};

export function getCategoryBaseline(catId, budgetTarget) {
  const basePct = DEFAULT_CATEGORY_PCT[catId] ?? 0;
  const base = budgetTarget > 0 ? Math.round(budgetTarget * basePct / 100) : 0;
  return { basePct, base };
}

// color + icon are UI-only — not stored in API schema
const CAT_META = {
  venue:         { color: 'var(--son-500)',  icon: 'utensils-crossed' },
  ceremony:      { color: 'var(--son-300)',  icon: 'heart'            },
  photography:   { color: 'var(--dao-400)',  icon: 'camera'           },
  jewelry:       { color: 'var(--kim-400)',  icon: 'gem'              },
  attire:        { color: 'var(--kim-300)',  icon: 'shirt'            },
  decor:         { color: 'var(--son-300)',  icon: 'flower-2'         },
  makeup:        { color: 'var(--dao-300)',  icon: 'sparkles'         },
  transport:     { color: 'var(--ink-400)',  icon: 'car'              },
  stationery:    { color: 'var(--kim-200)',  icon: 'mail'             },
  honeymoon:     { color: 'var(--dao-400)',  icon: 'palmtree'         },
  reserve:       { color: 'var(--sage-400)', icon: 'shield'           },
};

// Old server default → new label; user-renamed categories are left alone.
const RENAMED_DEFAULTS = [
  { id: 'venue', from: /^tiệc cưới\s*\(địa điểm/i, to: 'Nhà hàng tiệc cưới' },
];

function withMeta(cat) {
  const m = CAT_META[cat.id] || { color: 'var(--dao-300)', icon: 'circle' };
  const rename = RENAMED_DEFAULTS.find((r) => r.id === cat.id && r.from.test(cat.name || ''));
  return { ...m, ...cat, ...(rename ? { name: rename.to } : {}) };
}

export function fmtTr(n) { return n + 'tr'; }
export function fmtFull(n) { return (n * 1_000_000).toLocaleString('vi-VN') + ' ₫'; }

export function useBudget(coupleId = null, initial = [], refreshKey = 0) {
  const [cats, setCats] = useState(initial.map((c) => ({ ...c })));
  const [meta, setMeta] = useState({
    totalTr: 0,
    guests: 0,
    mungTr: 0,
    totalEstimatedTr: 0,
    totalVarianceTr: 0,
    budgetUsedPct: 0,
  });
  const [loaded, setLoaded] = useState(false); // đã nhận danh mục từ backend
  // Trạng thái tải (T-061): 'loading' → 'ready' (đã có phản hồi, kể cả 404 = chưa có dữ liệu) | 'error' (lỗi lần tải đầu, chưa có dữ liệu để giữ).
  const [phase, setPhase] = useState('loading');
  const [tries, setTries] = useState(0);
  const saveTimer = useRef(null);
  // T-174: lần tự lưu lỗi không được im lặng. saveError = có bản trên màn chưa lưu được; retrySave ghi lại bản mới nhất đang hiện.
  const [saveError, setSaveError] = useState(false);
  const errRef = useRef(false);   // = saveError, đọc được trong callback bất đồng bộ
  const baseRef = useRef(null);   // bản front biết là đã lưu (lần tải gần nhất khi không có thay đổi chưa lưu, hoặc lần ghi thành công gần nhất)
  const saveSeq = useRef(0); // chỉ kết quả của lần ghi bắt đầu sau cùng được quyết định câu báo (lần cũ về trễ không đè)
  const catsRef = useRef(cats);
  useEffect(() => { catsRef.current = cats; }, [cats]);
  // Keep a ref to latest meta so scheduleSave closure always has current values
  const metaRef = useRef(meta);
  useEffect(() => { metaRef.current = meta; }, [meta]);

  // Đặt màn theo một bản ghép (giữ trường chỉ có ở phía màn như locked, isNew).
  const applyDoc = (doc, extraMeta = {}) => {
    setCats((prev) => doc.categories.map((c) => {
      const old = prev.find((p) => p.id === c.id) || {};
      return withMeta({ ...old, ...c, items: (c.items || []).map((it) => ({ ...(old.items || []).find((x) => x.id === it.id), ...it })) });
    }));
    setMeta((m) => ({ ...m, ...extraMeta, totalTr: Number(doc.total_tr) || 0, guests: Number(doc.guests) || 0, mungTr: Number(doc.mung_tr) || 0 }));
  };

  useEffect(() => {
    if (!coupleId) return;
    api.getBudget(coupleId)
      .then((data) => {
        setPhase('ready');
        if (data?.categories) {
          setLoaded(true);
          const loadedMeta = {
            totalTr: Number(data.total_tr) || 0,
            guests: Number(data.guests) || 0,
            mungTr: Number(data.mung_tr) || 0,
            totalEstimatedTr: Number(data.total_estimated_tr) || 0,
            totalVarianceTr: Number(data.total_variance_tr) || 0,
            budgetUsedPct: Number(data.budget_used_pct) || 0,
          };
          if (errRef.current && baseRef.current) {
            // Đang có thay đổi chưa lưu được: ghép phần người dùng đã đổi lên bản server vừa tải (không để số/khoản đó biến mất im lặng);
            // câu báo còn tới khi ghi thành công; màn ghép rồi thì nền = bản server vừa tải.
            const server = docToPayload({ ...data, categories: data.categories.map(withMeta) });
            const mine = toPayload(catsRef.current, metaRef.current);
            applyDoc(mergeBudget(server, baseRef.current, mine), loadedMeta);
            baseRef.current = extendBase(baseRef.current, server); // màn đã ghép: nền mới = bản server vừa tải (xem mergeBudget.js)
          } else {
            baseRef.current = docToPayload({ ...data, categories: data.categories.map(withMeta) });
            setCats(data.categories.map(withMeta));
            setMeta(loadedMeta);
          }
        }
      })
      .catch(() => { setPhase((p) => (p === 'ready' ? p : 'error')); }); // đã có dữ liệu thì tải lại hỏng vẫn giữ bản cũ
  }, [coupleId, refreshKey, tries]);

  const retry = () => { setPhase('loading'); setTries((n) => n + 1); };

  // Kết quả của lần ghi bắt đầu sau cùng quyết định câu báo (lần cũ về trễ không đè).
  const settle = (seq, failed) => { if (seq === saveSeq.current) { errRef.current = failed; setSaveError(failed); } };

  // Ghi thường (không có câu báo): ghi bản đang hiện, như trước.
  const saveNow = (newCats) => {
    if (errRef.current) return saveMerged(); // đã có câu báo: mọi lần ghi lại đều lấy bản server rồi ghép
    const seq = ++saveSeq.current;
    const payload = toPayload(newCats, metaRef.current);
    return api.putBudget(coupleId, payload).then(() => { baseRef.current = payload; settle(seq, false); }, () => settle(seq, true)); // lỗi: giữ số người dùng vừa chỉnh, chỉ báo là chưa lưu
  };

  // Ghi lại sau lỗi: (1) lấy bản server; (2) chỉ đè phần người dùng đã đổi so với bản đã lưu; (3) ghi bản ghép. Lấy server lỗi thì không ghi mù.
  const saveMerged = () => {
    const seq = ++saveSeq.current;
    const sent = toPayload(catsRef.current, metaRef.current);
    return api.getBudget(coupleId, { track: false }).then((doc) => {
      const merged = doc?.categories ? mergeBudget(docToPayload(doc), baseRef.current, sent) : sent;
      return api.putBudget(coupleId, merged, { userView: sent }).then(() => {
        baseRef.current = merged;
        // Màn hiện bản ghép; chỉnh thêm trong lúc ghi được giữ (còn chưa lưu thì câu báo còn và lần tự lưu kế tiếp sẽ ghi tiếp).
        const now = toPayload(catsRef.current, metaRef.current);
        const final = mergeBudget(merged, sent, now);
        applyDoc(final);
        settle(seq, JSON.stringify(toPayloadShape(final)) !== JSON.stringify(toPayloadShape(merged)));
      });
    }).catch(() => settle(seq, true));
  };
  const toPayloadShape = (d) => toPayload(d.categories, { totalTr: d.total_tr, guests: d.guests, mungTr: d.mung_tr });

  const scheduleSave = (newCats) => {
    if (!coupleId) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { saveNow(newCats); }, 800);
  };

  const retrySave = () => {
    if (!coupleId) return;
    clearTimeout(saveTimer.current); // bản đang hiện trên màn thay cho lần tự lưu đang chờ
    saveMerged();
  };

  const mutate = (fn) =>
    setCats((prev) => {
      const next = fn(prev);
      scheduleSave(next);
      return next;
    });

  const total = cats.reduce((s, c) => s + (c.allocated_tr || 0), 0);
  const over = total - meta.totalTr;

  // honeymoon là mục thêm sau (init 0%). Khi user phân bổ honeymoon, rút tương ứng
  // từ reserve (dự phòng) — giữ tổng = budget, không đụng các mục khác. Nếu reserve
  // không đủ thì kẹp về 0 (UI sẽ cảnh báo vượt).
  const setAmt = (id, amt) =>
    mutate((cs) => {
      const val = Math.max(0, Math.round(amt));
      if (id === 'honeymoon') {
        const cur = cs.find((c) => c.id === 'honeymoon');
        const delta = val - (cur?.allocated_tr || 0);
        return cs.map((c) => {
          if (c.id === 'honeymoon') return { ...c, allocated_tr: val };
          if (c.id === 'reserve') return { ...c, allocated_tr: Math.max(0, (c.allocated_tr || 0) - delta) };
          return c;
        });
      }
      return cs.map((c) => (c.id === id ? { ...c, allocated_tr: val } : c));
    });
  const rename = (id, name) =>
    mutate((cs) => cs.map((c) => (c.id === id ? { ...c, name } : c)));
  const toggleLock = (id) =>
    mutate((cs) => cs.map((c) => (c.id === id ? { ...c, locked: !c.locked } : c)));
  const remove = (id) =>
    mutate((cs) => cs.filter((c) => c.id !== id));
  const add = () =>
    mutate((cs) => [...cs, {
      id: 'c' + Date.now(), name: 'Hạng mục mới',
      allocated_tr: 0, estimated_tr: 0, variance_tr: 0, state: 'chua_phan_bo',
      color: 'var(--dao-300)', icon: 'plus', items: [], isNew: true,
    }]);

  const setItemAmt = (cid, iid, amt) =>
    mutate((cs) => cs.map((c) => (c.id === cid
      ? { ...c, items: (c.items || []).map((it) => (it.id === iid ? { ...it, amt: Math.max(0, Math.round(amt)) } : it)) }
      : c)));
  const renameItem = (cid, iid, name) =>
    mutate((cs) => cs.map((c) => (c.id === cid
      ? { ...c, items: (c.items || []).map((it) => (it.id === iid ? { ...it, name } : it)) }
      : c)));
  const removeItem = (cid, iid) =>
    mutate((cs) => cs.map((c) => (c.id === cid
      ? { ...c, items: (c.items || []).filter((it) => it.id !== iid) }
      : c)));
  const addItem = (cid) =>
    mutate((cs) => cs.map((c) => (c.id === cid
      ? { ...c, items: [...(c.items || []), { id: 'i' + Date.now(), name: 'Hạng mục con', amt: 0, isNew: true }] }
      : c)));
  const itemsTotal = (c) => (c.items || []).reduce((s, it) => s + (it.amt || 0), 0);

  return {
    cats, setCats, loaded, phase, retry, saveError, retrySave, total, over,
    totalTarget: meta.totalTr,
    guests: meta.guests,
    mung: meta.mungTr,
    totalEstimated: meta.totalEstimatedTr,
    totalVariance: meta.totalVarianceTr,
    budgetUsedPct: meta.budgetUsedPct,
    setAmt, rename, toggleLock, remove, add,
    setItemAmt, renameItem, removeItem, addItem,
    itemsTotal,
  };
}
