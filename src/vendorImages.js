// Ảnh vendor ở trình duyệt (spec T-051, mục H). CSS `background` không báo lỗi tải ảnh, nên ảnh hỏng
// (HTTP lỗi, trả HTML) từng thành ô trống. Ở đây thử tải từng URL một lần bằng đối tượng Image,
// chỉ ảnh tải được mới được dùng; không còn ảnh nào thì dùng ảnh mặc định của bề mặt đó.
// Không viết cứng host ảnh nào: URL luôn lấy từ dữ liệu vendor (API hoặc nơi lưu).
import { useEffect, useState } from 'react';
import { api } from './api.js';
import { cssBg, fallbackGradFor, photoUrlsOf } from './vendorImageUrls.js';

export { CAT_FALLBACK_GRAD, GENERIC_FALLBACK_GRAD, fallbackGradFor, cssBg, urlFromCss, photoUrlsOf } from './vendorImageUrls.js';


/* ── Thử tải ảnh: mỗi URL tối đa một lần mỗi lần mở trang ───────────────── */
const results = new Map();   // url → true | false (đã xong)
const inflight = new Map();  // url → Promise<boolean>

function probe(url) {
  if (results.has(url)) return Promise.resolve(results.get(url));
  if (inflight.has(url)) return inflight.get(url);
  const p = new Promise((resolve) => {
    if (typeof Image === 'undefined') { resolve(false); return; }
    const im = new Image();
    im.onload = () => resolve(im.naturalWidth > 0);
    im.onerror = () => resolve(false);
    im.src = url;
  }).then((ok) => { results.set(url, ok); inflight.delete(url); return ok; });
  inflight.set(url, p);
  return p;
}

/* Trả về isGood(url): true chỉ khi ảnh đã tải được. Đang thử hoặc hỏng đều là false
   (hiện ảnh mặc định, không bao giờ hiện khung vỡ). */
export function useImageStatus(urls) {
  const [, bump] = useState(0);
  const key = urls.join('\n');
  useEffect(() => {
    let alive = true;
    for (const u of new Set(key ? key.split('\n') : [])) {
      if (results.has(u)) continue;
      probe(u).then(() => { if (alive) bump((n) => n + 1); });
    }
    return () => { alive = false; };
  }, [key]);
  return (url) => results.get(url) === true;
}

/* Bề mặt 1-4: vendor vừa lấy từ API. Trả bgOf(v) (nền một ô) và galleryOf(v) (mảng nền cho gallery, luôn ≥ 1). */
export function useVendorBackgrounds(vendors, catId) {
  const list = (vendors || []).filter(Boolean);
  const isGood = useImageStatus(list.flatMap(photoUrlsOf));
  const fallback = fallbackGradFor(catId);
  const galleryOf = (v) => {
    const good = v ? photoUrlsOf(v).filter(isGood) : [];
    return good.length ? good.map(cssBg) : [fallback];
  };
  return { galleryOf, bgOf: (v) => galleryOf(v)[0] };
}

/* ── Bề mặt 5-6: vendor đã lưu ──────────────────────────────────────────
   Dữ liệu đã lưu (localStorage) không bị sửa. Lúc hiển thị, tra vendor theo id trong pool hiện tại
   (GET /api/vendors/<id>, KHÔNG kèm coupleId vì có coupleId là tính ghép lại và gọi LLM trả phí).
   Mỗi id tra tối đa một lần mỗi lần mở trang. */
const lookups = new Map();  // id → { done, ok, urls, promise }

function lookupPool(id) {
  let e = lookups.get(id);
  if (e) return e.promise;
  e = { done: false, ok: false, urls: [] };
  e.promise = api.getVendorPhotos(id)
    .then((res) => { e.ok = true; e.urls = (res?.vendor?.photos || []).map((p) => p?.url).filter(Boolean); })
    .catch(() => { e.ok = false; })
    .then(() => { e.done = true; });
  lookups.set(id, e);
  return e.promise;
}

/* Nền ảnh (CSS) của vendor đã lưu, hoặc null khi phải dùng ảnh mặc định của bề mặt.
   Từ lúc mở đến khi tra xong: null và không yêu cầu nào tới URL ảnh đã lưu. */
export function useSavedVendorPhotoBg(vendor) {
  const [, bump] = useState(0);
  const id = vendor?.id;
  useEffect(() => {
    if (!id) return undefined;
    let alive = true;
    lookupPool(id).then(() => { if (alive) bump((n) => n + 1); });
    return () => { alive = false; };
  }, [id]);
  const e = id ? lookups.get(id) : null;
  let urls = [];
  if (!id) urls = photoUrlsOf(vendor);
  else if (e?.done) urls = e.ok ? e.urls : photoUrlsOf(vendor);
  const isGood = useImageStatus(urls);
  const first = urls.find(isGood);
  return first ? cssBg(first) : null;
}
