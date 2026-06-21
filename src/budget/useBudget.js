import { useState, useEffect, useRef } from 'react';
import { api } from '../api.js';

export function fmtTr(n) { return n + 'tr'; }
export function fmtFull(n) { return (n * 1_000_000).toLocaleString('vi-VN') + ' ₫'; }

export function useBudget(coupleId = null, initial = []) {
  const [cats, setCats] = useState(initial.map((c) => ({ ...c })));
  const [meta, setMeta] = useState({ totalTr: 0, guests: 0, mungTr: 0 });
  const saveTimer = useRef(null);

  // Load from server on mount / when coupleId available
  useEffect(() => {
    if (!coupleId) return;
    api.getBudget(coupleId)
      .then((data) => {
        if (data?.categories) {
          setCats(data.categories);
          setMeta({
            totalTr: Number(data.total_tr) || 0,
            guests: Number(data.guests) || 0,
            mungTr: Number(data.mung_tr) || 0,
          });
        }
      })
      .catch(() => {});
  }, [coupleId]);

  // Debounced remote save
  const scheduleSave = (newCats) => {
    if (!coupleId) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      api.putBudget(coupleId, {
        categories: newCats,
        total_tr: meta.totalTr,
        guests: meta.guests,
        mung_tr: meta.mungTr,
      })
        .catch(() => {}); // silent — user can retry manually
    }, 800);
  };

  const mutate = (fn) =>
    setCats((prev) => {
      const next = fn(prev);
      scheduleSave(next);
      return next;
    });

  const total = cats.reduce((s, c) => s + c.amt, 0);
  const over = total - meta.totalTr;

  const setAmt = (id, amt) =>
    mutate((cs) => cs.map((c) => (c.id === id ? { ...c, amt: Math.max(0, Math.round(amt)) } : c)));
  const rename = (id, name) =>
    mutate((cs) => cs.map((c) => (c.id === id ? { ...c, name } : c)));
  const toggleLock = (id) =>
    mutate((cs) => cs.map((c) => (c.id === id ? { ...c, locked: !c.locked } : c)));
  const remove = (id) =>
    mutate((cs) => cs.filter((c) => c.id !== id));
  const add = () =>
    mutate((cs) => [...cs, {
      id: 'c' + Date.now(), name: 'Hạng mục mới', amt: 0,
      color: 'var(--dao-300)', icon: 'plus', locked: false, items: [], isNew: true,
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
  const itemsTotal = (c) => (c.items || []).reduce((s, it) => s + it.amt, 0);

  return {
    cats, setCats, total, over,
    totalTarget: meta.totalTr,
    guests: meta.guests,
    mung: meta.mungTr,
    setAmt, rename, toggleLock, remove, add,
    setItemAmt, renameItem, removeItem, addItem,
    itemsTotal,
  };
}
