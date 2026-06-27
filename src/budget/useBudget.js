import { useState, useEffect, useRef } from 'react';
import { api } from '../api.js';

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

function withMeta(cat) {
  const m = CAT_META[cat.id] || { color: 'var(--dao-300)', icon: 'circle' };
  return { ...m, ...cat }; // API fields win over defaults, but color/icon filled in
}

export function fmtTr(n) { return n + 'tr'; }
export function fmtFull(n) { return (n * 1_000_000).toLocaleString('vi-VN') + ' ₫'; }

export function useBudget(coupleId = null, initial = []) {
  const [cats, setCats] = useState(initial.map((c) => ({ ...c })));
  const [meta, setMeta] = useState({
    totalTr: 0,
    guests: 0,
    mungTr: 0,
    totalEstimatedTr: 0,
    totalVarianceTr: 0,
    budgetUsedPct: 0,
  });
  const saveTimer = useRef(null);
  // Keep a ref to latest meta so scheduleSave closure always has current values
  const metaRef = useRef(meta);
  useEffect(() => { metaRef.current = meta; }, [meta]);

  useEffect(() => {
    if (!coupleId) return;
    api.getBudget(coupleId)
      .then((data) => {
        if (data?.categories) {
          setCats(data.categories.map(withMeta));
          setMeta({
            totalTr: Number(data.total_tr) || 0,
            guests: Number(data.guests) || 0,
            mungTr: Number(data.mung_tr) || 0,
            totalEstimatedTr: Number(data.total_estimated_tr) || 0,
            totalVarianceTr: Number(data.total_variance_tr) || 0,
            budgetUsedPct: Number(data.budget_used_pct) || 0,
          });
        }
      })
      .catch(() => {});
  }, [coupleId]);

  const scheduleSave = (newCats) => {
    if (!coupleId) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const m = metaRef.current;
      // estimated_tr, variance_tr, state are read-only — backend computes them
      const payload = newCats.map(({ id, name, allocated_tr, pct, priority, items }) => ({
        id, name, allocated_tr, pct, priority,
        items: (items || []).map(({ id: iid, name: iname, amt, status, vendor }) => ({
          id: iid, name: iname, amt, status, vendor,
        })),
      }));
      api.putBudget(coupleId, {
        categories: payload,
        total_tr: m.totalTr,
        guests: m.guests,
        mung_tr: m.mungTr,
      }).catch(() => {});
    }, 800);
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
    cats, setCats, total, over,
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
