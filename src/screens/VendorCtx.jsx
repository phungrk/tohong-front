import { createContext, useContext, useState } from 'react';
import { api } from '../api.js';

export const VENDOR_CATEGORIES = [
  { id: 'tiec',   name: 'Tiệc & nhà hàng', icon: 'utensils-crossed', color: 'var(--son-500)',      budget: 220 },
  { id: 'chup',   name: 'Chụp ảnh / quay', icon: 'camera',           color: 'var(--dao-400,#6b8fa5)', budget: 60 },
  { id: 'trang',  name: 'Trang trí & hoa', icon: 'flower-2',          color: 'var(--son-300)',      budget: 70 },
  { id: 'trangp', name: 'Trang phục',       icon: 'shirt',             color: 'var(--kim-300)',      budget: 50 },
  { id: 'nhac',   name: 'Âm nhạc / MC',    icon: 'music-2',           color: 'var(--ink-300)',      budget: 30 },
];

export const VENDOR_POOL = {
  tiec: [
    { id: 'nikko', name: 'Nikko Saigon', price: 9, priceUnit: 'tr/bàn', priceTotal: 180,
      rating: 4.8, rv: 312, match: 94, spec: '200 khách · Q.1, TP.HCM',
      grad: 'linear-gradient(135deg,#c9907a,#9a5b4a)',
      reasons: ['Phù hợp 200 khách', 'Tiết kiệm 40tr', 'Rating 4.8★'],
      includes: ['Hoa bàn tiệc', 'Âm thanh ánh sáng', 'MC khai tiệc', 'Bánh cưới 3 tầng'],
      breakdown: { budget: 94, style: 85, avail: 100 },
      reviews: [{ name: 'Anh Tuấn & Chị Mai', text: 'Phục vụ chuyên nghiệp, đồ ăn ngon, không gian đẹp.' }] },
    { id: 'white', name: 'White Palace', price: 10, priceUnit: 'tr/bàn', priceTotal: 200,
      rating: 4.9, rv: 287, match: 88, spec: '250 khách · Phú Nhuận, TP.HCM',
      grad: 'linear-gradient(135deg,#d4a0a0,#a06060)',
      reasons: ['Review 4.9★ xuất sắc', 'Sức chứa lớn nhất', 'Bãi xe miễn phí'],
      includes: ['Decor hoa theo chủ đề', 'Âm thanh chuyên nghiệp', 'Bãi xe miễn phí', 'Phòng VIP cô dâu'],
      breakdown: { budget: 88, style: 92, avail: 90 },
      reviews: [{ name: 'Chị Lan & Anh Nam', text: 'Không gian sang trọng, nhân viên chu đáo.' }] },
    { id: 'caravelle', name: 'Caravelle Saigon', price: 13, priceUnit: 'tr/bàn', priceTotal: 240,
      rating: 4.7, rv: 198, match: 76, spec: '180 khách · Q.1, TP.HCM',
      grad: 'linear-gradient(135deg,#c4a080,#8a6040)',
      reasons: ['Phong cách luxury 5★', 'Vị trí trung tâm Q.1'],
      includes: ['Decor luxury', 'Champagne khai tiệc', 'Concierge riêng'],
      breakdown: { budget: 70, style: 95, avail: 80 },
      reviews: [{ name: 'Chị Ngọc & Anh Minh', text: 'Đẳng cấp thực sự, khách nước ngoài rất ấn tượng.' }] },
  ],
  chup: [
    { id: 'mphoto', name: 'M Photo Studio', price: 25, priceUnit: 'tr/gói', priceTotal: 25,
      rating: 4.9, rv: 156, match: 96, spec: 'Album + phóng sự · Q.3, TP.HCM',
      grad: 'linear-gradient(135deg,#7a9ab5,#4a6a85)',
      reasons: ['Chuyên ảnh phóng sự', 'Màu phim tự nhiên', 'Giao album 4 tuần'],
      includes: ['Chụp 10 tiếng', 'Album 100 trang', 'USB 500 ảnh', 'Ngoại cảnh'],
      breakdown: { budget: 96, style: 90, avail: 95 },
      reviews: [{ name: 'Bảo & Linh', text: 'Ảnh rất đẹp và tự nhiên, chụp cực kỳ tâm lý.' }] },
    { id: 'kstudio', name: 'K Studio', price: 35, priceUnit: 'tr/gói', priceTotal: 35,
      rating: 4.8, rv: 203, match: 82, spec: 'Phim cưới + ảnh · Bình Thạnh, TP.HCM',
      grad: 'linear-gradient(135deg,#8090b0,#5060a0)',
      reasons: ['Phim cưới cinematic', 'Drone aerial', 'Highlight 10 phút'],
      includes: ['Ảnh + phim cưới', 'Drone flycam', 'Highlight video', 'Teaser 2 phút'],
      breakdown: { budget: 82, style: 95, avail: 88 },
      reviews: [{ name: 'Huy & Thảo', text: 'Phim cưới đẹp như điện ảnh, cả nhà khóc khi xem.' }] },
    { id: 'toivideo', name: 'Tôi & Video', price: 18, priceUnit: 'tr/gói', priceTotal: 18,
      rating: 4.7, rv: 89, match: 78, spec: 'Phim phóng sự · Gò Vấp, TP.HCM',
      grad: 'linear-gradient(135deg,#90a0b0,#6080a0)',
      reasons: ['Giá tốt nhất', 'Phóng sự tự nhiên', 'Giao hàng nhanh'],
      includes: ['Phim phóng sự 30 phút', 'USB bản gốc', 'Ảnh từ phim'],
      breakdown: { budget: 98, style: 75, avail: 92 },
      reviews: [{ name: 'Nam & Hương', text: 'Giá hợp lý, chất lượng ổn, giao phim đúng hẹn.' }] },
  ],
  trang: [
    { id: 'flowerholic', name: 'Flowerholic Studio', price: 45, priceUnit: 'tr/gói', priceTotal: 45,
      rating: 4.9, rv: 211, match: 93, spec: 'Decor full · Q.10, TP.HCM',
      grad: 'linear-gradient(135deg,#e0b0a0,#c08070)',
      reasons: ['Hoa tươi 100%', 'Tặng hoa cầm tay', 'Setup ngay trong đêm'],
      includes: ['Sân khấu chính', 'Hoa bàn 20 bàn', 'Cổng hoa', 'Hoa cầm tay cô dâu'],
      breakdown: { budget: 93, style: 95, avail: 90 },
      reviews: [{ name: 'Mai & Duy', text: 'Hoa tươi đẹp, đúng màu, setup nhanh gọn.' }] },
    { id: 'tocdung', name: 'Tóc Dung Decor', price: 35, priceUnit: 'tr/gói', priceTotal: 35,
      rating: 4.7, rv: 98, match: 81, spec: 'Decor + lụa · Bình Thạnh, TP.HCM',
      grad: 'linear-gradient(135deg,#d0a0b0,#b06080)',
      reasons: ['Kết hợp lụa & hoa', 'Phong cách cổ điển VN', 'Giá tốt hơn 10tr'],
      includes: ['Sân khấu chính', 'Backdrop chụp hình', 'Lụa bàn', 'Đèn fairy lights'],
      breakdown: { budget: 81, style: 88, avail: 95 },
      reviews: [{ name: 'Lan & Việt', text: 'Đẹp lung linh, style cổ điển đúng yêu cầu.' }] },
  ],
  trangp: [
    { id: 'moibridal', name: 'Mơi Bridal', price: 25, priceUnit: 'tr/gói', priceTotal: 25,
      rating: 4.9, rv: 344, match: 95, spec: 'Áo dài + váy cưới · Q.3, TP.HCM',
      grad: 'linear-gradient(135deg,#e0c0b0,#c09070)',
      reasons: ['200+ mẫu váy', 'Chỉnh váy miễn phí', 'Giao tận nơi'],
      includes: ['Váy cưới chính', 'Áo dài ăn hỏi', 'Vest chú rể', 'Chỉnh sửa vừa người'],
      breakdown: { budget: 95, style: 92, avail: 98 },
      reviews: [{ name: 'Thu & Khải', text: 'Váy đẹp, nhiều mẫu lựa, nhân viên nhiệt tình.' }] },
    { id: 'sophybridal', name: 'Sophy Bridal', price: 35, priceUnit: 'tr/gói', priceTotal: 35,
      rating: 4.8, rv: 178, match: 84, spec: 'Váy thiết kế riêng · Q.1, TP.HCM',
      grad: 'linear-gradient(135deg,#d8c0d0,#b090b0)',
      reasons: ['Thiết kế riêng theo số', 'Ren nhập Pháp', 'Vừa 100% vóc dáng'],
      includes: ['Váy cưới thiết kế riêng', 'Phụ kiện đầy đủ', '3 buổi thử đồ', 'Áo dài dự phòng'],
      breakdown: { budget: 84, style: 98, avail: 88 },
      reviews: [{ name: 'Ngân & Phúc', text: 'Váy đẹp đúng ý, thiết kế riêng rất xứng đáng.' }] },
  ],
  nhac: [
    { id: 'soundsaigon', name: 'Sound Saigon Band', price: 15, priceUnit: 'tr/buổi', priceTotal: 15,
      rating: 4.8, rv: 127, match: 91, spec: 'Ban nhạc 6 người · TP.HCM',
      grad: 'linear-gradient(135deg,#a0b0c0,#708090)',
      reasons: ['Acoustic live', 'Hát Việt + Anh', 'Có MC kết hợp'],
      includes: ['Ban nhạc 4 tiếng', 'MC dẫn chương trình', 'Thiết bị âm thanh', 'Bài theo yêu cầu'],
      breakdown: { budget: 91, style: 88, avail: 95 },
      reviews: [{ name: 'Hải & Phương', text: 'Ban nhạc chuyên nghiệp, khách mời rất thích.' }] },
    { id: 'djtony', name: 'DJ Tony Events', price: 12, priceUnit: 'tr/buổi', priceTotal: 12,
      rating: 4.6, rv: 89, match: 78, spec: 'DJ + MC · TP.HCM',
      grad: 'linear-gradient(135deg,#b0a0c0,#907090)',
      reasons: ['Giá tốt nhất', 'Set list linh hoạt', 'Ánh sáng sân khấu'],
      includes: ['DJ set 4 tiếng', 'MC bilingual', 'Đèn sân khấu', 'Laser & LED'],
      breakdown: { budget: 98, style: 72, avail: 90 },
      reviews: [{ name: 'Kiên & Ngọc', text: 'Giá hợp lý, không khí sôi động, tiệc vui.' }] },
  ],
};

// Map vendor category → budget category ID
const VENDOR_TO_BUDGET_CAT = {
  tiec:   'venue',
  chup:   'photography',
  trang:  'decor',
  trangp: 'attire',
  nhac:   'entertainment',
};

const VendorCtx = createContext(null);

export function VendorProvider({ coupleId, children }) {
  const [saved, setSaved] = useState({});

  // GET budget → mutate items in one category → PUT back
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
          items = [...items, { id: `vendor_${add.id}`, name: add.name, amt: add.priceTotal, status: 'confirmed', vendor: true }];
        }
        return { ...cat, items };
      });
      await api.putBudget(coupleId, { categories, total_tr: data.total_tr, guests: data.guests, mung_tr: data.mung_tr });
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
    if (wasConfirmed) {
      const budgetCatId = VENDOR_TO_BUDGET_CAT[catId];
      if (budgetCatId) syncBudgetItem(budgetCatId, { remove: cat.confirmed });
    }
  };

  const confirmVendor = (catId, vendorId) => {
    const cat = saved[catId] || { shortlisted: [], confirmed: null };
    const vendor = cat.shortlisted.find((v) => v.id === vendorId);
    if (!vendor) return;
    setSaved((prev) => ({ ...prev, [catId]: { ...cat, confirmed: vendor } }));
    const budgetCatId = VENDOR_TO_BUDGET_CAT[catId];
    if (budgetCatId) syncBudgetItem(budgetCatId, { add: vendor, remove: cat.confirmed ?? undefined });
  };

  const unconfirmVendor = (catId) => {
    const cat = saved[catId];
    if (!cat) return;
    setSaved((prev) => ({ ...prev, [catId]: { ...cat, confirmed: null } }));
    const budgetCatId = VENDOR_TO_BUDGET_CAT[catId];
    if (budgetCatId && cat.confirmed) syncBudgetItem(budgetCatId, { remove: cat.confirmed });
  };

  const getCatStatus = (catId) => {
    const cat = saved[catId];
    if (!cat || cat.shortlisted.length === 0) return 'none';
    if (cat.confirmed) return 'confirmed';
    return 'shortlisted';
  };

  const getBudgetConfirmed = () =>
    VENDOR_CATEGORIES.reduce((sum, cat) => sum + (saved[cat.id]?.confirmed?.priceTotal || 0), 0);

  return (
    <VendorCtx.Provider value={{ saved, saveVendor, unsaveVendor, confirmVendor, unconfirmVendor, getCatStatus, getBudgetConfirmed }}>
      {children}
    </VendorCtx.Provider>
  );
}

export const useVendorCtx = () => useContext(VendorCtx);
