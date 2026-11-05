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

/* URL ảnh đã nằm trong đối tượng vendor đã map (gallery, hoặc grad nếu thiếu gallery). */
export function photoUrlsOf(vendor) {
  const list = vendor?.gallery?.length ? vendor.gallery : [vendor?.grad];
  return list.map(urlFromCss).filter(Boolean);
}

/* Trạng thái một ô ảnh (spec T-066 M1): 'good' có ảnh dùng được; 'checking' còn URL chưa biết kết quả;
   'bad' không có URL nào hoặc mọi URL đều hỏng. Chỉ 'bad' mới được hiện minh hoạ. */
export function photoStateOf(urls, isGood, isBad) {
  if (!urls || !urls.length) return 'bad';
  if (urls.some(isGood)) return 'good';
  return urls.every(isBad) ? 'bad' : 'checking';
}
