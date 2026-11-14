// Hàm thuần của ảnh vendor (không import gì, test được bằng node --test). Xem vendorImages.js.

/* Gradient mặc định theo danh mục khi vendor không có ảnh dùng được. */
export const CAT_FALLBACK_GRAD = {
  venue: 'linear-gradient(135deg,#c9907a,#9a5b4a)',
  photography: 'linear-gradient(135deg,#7a9ab5,#4a6a85)',
  decor: 'linear-gradient(135deg,#e0b0a0,#c08070)',
  attire: 'linear-gradient(135deg,#e0c0b0,#c09070)',
};
export const GENERIC_FALLBACK_GRAD = 'linear-gradient(135deg,#d4a0a0,#a06060)';
export const fallbackGradFor = (catId) => CAT_FALLBACK_GRAD[catId] || GENERIC_FALLBACK_GRAD;

export const cssBg = (url) => `center/cover no-repeat url("${url}")`;

/* "center/cover no-repeat url("https://…")" → "https://…" (chuỗi gradient → null). */
export function urlFromCss(css) {
  const m = typeof css === 'string' ? css.match(/url\("(.*)"\)\s*$/) : null;
  return m ? m[1] : null;
}

/* ── Ghi công ảnh Google (T-156, ADR-041 điểm 4) ────────────────────────────
   Ảnh Google: `source` là "google" (không phân biệt hoa thường) HOẶC URL ở googleusercontent.com / tên miền con.
   Tên tác giả: `attribution` của CHÍNH ảnh đó, đã trim; rỗng hoặc không phải chuỗi là thiếu. Ảnh Google thiếu tên không được hiện. */
export const GOOGLE_PHOTO_HOST = 'googleusercontent.com';
export function isGoogleHostUrl(url) {
  try { const h = new URL(String(url).trim()).hostname.toLowerCase(); return h === GOOGLE_PHOTO_HOST || h.endsWith('.' + GOOGLE_PHOTO_HOST); } catch { return false; }
}
export const isGooglePhoto = (p) => !!p && ((typeof p.source === 'string' && p.source.trim().toLowerCase() === 'google') || isGoogleHostUrl(p.url));
export const authorOf = (p) => (p && typeof p.attribution === 'string' && p.attribution.trim() ? p.attribution.trim() : null);

/* Ảnh từ API (`photos[]`) → [{ url, credit }] chỉ gồm ảnh được phép hiện: ảnh không phải Google (credit null, kể cả khi bản ghi có
   `attribution`) và ảnh Google có tên tác giả (credit = tên). Ảnh Google thiếu tên bị bỏ. Thứ tự giữ nguyên. */
export function usablePhotos(photos) {
  const out = [];
  for (const p of Array.isArray(photos) ? photos : []) {
    if (!p || typeof p.url !== 'string' || !p.url) continue;
    if (!isGooglePhoto(p)) { out.push({ url: p.url, credit: null }); continue; }
    const credit = authorOf(p);
    if (credit) out.push({ url: p.url, credit });
  }
  return out;
}

/* Ảnh trong đối tượng vendor đã map (gallery, hoặc grad nếu thiếu gallery) → [{ url, credit }].
   `photoCredits` (cùng chỉ số với gallery) do adaptVendor gắn, không lưu vào máy. Dữ liệu đã lưu không có nó:
   URL Google không biết tên tác giả thì bị bỏ (không hiện). */
export function photoEntriesOf(vendor) {
  const list = vendor?.gallery?.length ? vendor.gallery : [vendor?.grad];
  const credits = vendor?.gallery?.length ? vendor.photoCredits : null;
  const out = [];
  list.forEach((css, i) => {
    const url = urlFromCss(css);
    if (!url) return;
    const credit = credits?.[i] || null;
    if (!credit && isGoogleHostUrl(url)) return;
    out.push({ url, credit });
  });
  return out;
}
export const photoUrlsOf = (vendor) => photoEntriesOf(vendor).map((e) => e.url);

/* Trạng thái một ô ảnh (spec T-066 M1): 'good' có ảnh dùng được; 'checking' còn URL chưa biết kết quả;
   'bad' không có URL nào hoặc mọi URL đều hỏng. Chỉ 'bad' mới được hiện minh hoạ. */
export function photoStateOf(urls, isGood, isBad) {
  if (!urls || !urls.length) return 'bad';
  if (urls.some(isGood)) return 'good';
  return urls.every(isBad) ? 'bad' : 'checking';
}
