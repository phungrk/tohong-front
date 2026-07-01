import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api.js';

// Cùng danh sách + thứ tự với BUDGET_TEMPLATE (edge/lib/budgetCategories.js), trừ "reserve"
// (dự phòng phát sinh — không có vendor tương ứng). icon/color đồng bộ với CAT_META (useBudget.js).
export const VENDOR_CATEGORIES = [
  { id: 'venue',         name: 'Tiệc & nhà hàng',        icon: 'utensils-crossed', color: 'var(--son-500)'  },
  { id: 'ceremony',      name: 'Ăn hỏi & sính lễ',        icon: 'heart',            color: 'var(--son-300)'  },
  { id: 'photography',   name: 'Chụp ảnh / quay',         icon: 'camera',           color: 'var(--dao-400)'  },
  { id: 'jewelry',       name: 'Nhẫn cưới & trang sức',   icon: 'gem',              color: 'var(--kim-400)'  },
  { id: 'attire',        name: 'Trang phục',              icon: 'shirt',            color: 'var(--kim-300)'  },
  { id: 'decor',         name: 'Trang trí & hoa',         icon: 'flower-2',         color: 'var(--son-300)'  },
  { id: 'makeup',        name: 'Trang điểm & làm tóc',    icon: 'sparkles',         color: 'var(--dao-300)'  },
  { id: 'transport',     name: 'Xe hoa & đưa đón',        icon: 'car',              color: 'var(--ink-400)'  },
  { id: 'stationery',    name: 'Thiệp & quà tặng',        icon: 'mail',             color: 'var(--kim-200)'  },
  { id: 'honeymoon',     name: 'Tuần trăng mật',          icon: 'palmtree',         color: 'var(--dao-400)'  },
];

const VendorCtx = createContext(null);

const storageKey = (id) => (id ? `th_vendors_${id}` : null);

function loadSaved(coupleId) {
  try {
    const k = storageKey(coupleId);
    if (!k) return {};
    const raw = localStorage.getItem(k);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export function VendorProvider({ coupleId, onBudgetSync, children }) {
  const [saved, setSaved] = useState({});
  const [budgetCats, setBudgetCats] = useState({}); // catId → allocated_tr, từ ngân sách thật

  // Load persisted state when coupleId becomes available
  useEffect(() => {
    if (!coupleId) return;
    setSaved(loadSaved(coupleId));
  }, [coupleId]);

  // Load real per-category budget (đồng bộ số tr hiển thị với màn Ngân sách)
  useEffect(() => {
    if (!coupleId) return;
    api.getBudget(coupleId).then((data) => {
      const map = {};
      (data?.categories || []).forEach((c) => { map[c.id] = Number(c.allocated_tr) || 0; });
      setBudgetCats(map);
    }).catch(() => {});
  }, [coupleId]);

  // Persist whenever saved or coupleId changes
  useEffect(() => {
    if (!coupleId) return;
    try { localStorage.setItem(storageKey(coupleId), JSON.stringify(saved)); } catch {}
  }, [saved, coupleId]);

  // GET budget → mutate items in one category → PUT back → trigger refresh
  const syncBudgetItem = async (budgetCatId, { add, remove }) => {
    if (!coupleId) return;
    try {
      const data = await api.getBudget(coupleId);
      if (!data) return;
      const categories = (data.categories || []).map((cat) => {
        if (cat.id !== budgetCatId) return cat;
        let items = cat.items || [];
        if (remove) items = items.filter((it) => it.id !== `vendor_${remove.id}`);
        if (add) {
          items = items.filter((it) => it.id !== `vendor_${add.id}`);
          items = [...items, {
            id: `vendor_${add.id}`,
            name: add.name,
            amt: add.priceTotal ?? add.price ?? 0,
            status: 'confirmed',
            vendor: true,
          }];
        }
        return { ...cat, items };
      });
      await api.putBudget(coupleId, { categories, total_tr: data.total_tr, guests: data.guests, mung_tr: data.mung_tr });
      onBudgetSync?.();
    } catch { /* silent — local state is source of truth for UI */ }
  };

  const saveVendor = (catId, vendor) => {
    setSaved((prev) => {
      const cat = prev[catId] || { shortlisted: [], confirmed: null };
      if (cat.shortlisted.some((v) => v.id === vendor.id)) return prev;
      return { ...prev, [catId]: { ...cat, shortlisted: [...cat.shortlisted, vendor] } };
    });
  };

  const unsaveVendor = (catId, vendorId) => {
    const cat = saved[catId];
    if (!cat) return;
    const wasConfirmed = cat.confirmed?.id === vendorId;
    setSaved((prev) => ({
      ...prev,
      [catId]: {
        shortlisted: cat.shortlisted.filter((v) => v.id !== vendorId),
        confirmed: wasConfirmed ? null : cat.confirmed,
      },
    }));
    if (wasConfirmed) syncBudgetItem(catId, { remove: cat.confirmed });
  };

  const confirmVendor = (catId, vendorId) => {
    const cat = saved[catId] || { shortlisted: [], confirmed: null };
    const vendor = cat.shortlisted.find((v) => v.id === vendorId);
    if (!vendor) return;
    setSaved((prev) => ({ ...prev, [catId]: { ...cat, confirmed: vendor } }));
    syncBudgetItem(catId, { add: vendor, remove: cat.confirmed ?? undefined });
  };

  const unconfirmVendor = (catId) => {
    const cat = saved[catId];
    if (!cat) return;
    setSaved((prev) => ({ ...prev, [catId]: { ...cat, confirmed: null } }));
    if (cat.confirmed) syncBudgetItem(catId, { remove: cat.confirmed });
  };

  const getCatStatus = (catId) => {
    const cat = saved[catId];
    if (!cat || cat.shortlisted.length === 0) return 'none';
    if (cat.confirmed) return 'confirmed';
    return 'shortlisted';
  };

  const getBudgetConfirmed = () =>
    VENDOR_CATEGORIES.reduce((sum, cat) => sum + (saved[cat.id]?.confirmed?.priceTotal || 0), 0);

  const getCatBudget = (catId) => budgetCats[catId] || 0;

  return (
    <VendorCtx.Provider value={{ coupleId, saved, saveVendor, unsaveVendor, confirmVendor, unconfirmVendor, getCatStatus, getBudgetConfirmed, getCatBudget }}>
      {children}
    </VendorCtx.Provider>
  );
}

export const useVendorCtx = () => useContext(VendorCtx);
