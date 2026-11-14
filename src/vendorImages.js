// Ảnh vendor ở trình duyệt (spec T-051, mục H). CSS `background` không báo lỗi tải ảnh, nên ảnh hỏng
// (HTTP lỗi, trả HTML) từng thành ô trống. Ở đây thử tải từng URL một lần bằng đối tượng Image,
// chỉ ảnh tải được mới được dùng; không còn ảnh nào thì dùng ảnh mặc định của bề mặt đó.
// URL luôn lấy từ dữ liệu vendor (API hoặc nơi lưu). Ngoại lệ duy nhất: hằng googleusercontent.com (vendorImageUrls.js) để nhận ra ảnh Google
// khi dữ liệu thiếu `source`, vì ảnh Google phải kèm tên tác giả (T-156).
import { useEffect, useState } from 'react';
import { api } from './api.js';
import { cssBg, fallbackGradFor, photoUrlsOf, photoEntriesOf, photoStateOf, usablePhotos } from './vendorImageUrls.js';

export { CAT_FALLBACK_GRAD, GENERIC_FALLBACK_GRAD, fallbackGradFor, cssBg, urlFromCss, photoUrlsOf, photoEntriesOf, photoStateOf, usablePhotos, isGooglePhoto, isGoogleHostUrl, authorOf } from './vendorImageUrls.js';


/* ── Thử tải ảnh: mỗi URL tối đa một lần mỗi lần mở trang ───────────────── */
const results = new Map();   // url → true | false (đã xong)
const inflight = new Map();  // url → Promise<boolean>
const HANG_MS = 8000;        // ảnh không trả lời sau 8 giây thì coi là hỏng (spec T-066 M1)

function probe(url) {
  if (results.has(url)) return Promise.resolve(results.get(url));
  if (inflight.has(url)) return inflight.get(url);
  const p = new Promise((resolve) => {
    if (typeof Image === 'undefined') { resolve(false); return; }
    const im = new Image();
    const timer = setTimeout(() => { im.onload = null; im.onerror = null; resolve(false); }, HANG_MS);
    im.onload = () => { clearTimeout(timer); resolve(im.naturalWidth > 0); };
    im.onerror = () => { clearTimeout(timer); resolve(false); };
    im.src = url;
  }).then((ok) => { results.set(url, ok); inflight.delete(url); return ok; });
  inflight.set(url, p);
  return p;
}

/* Trả về { isGood, isBad }: isGood(url) true chỉ khi ảnh đã tải được; isBad(url) true chỉ khi đã biết chắc là hỏng
   (lỗi, trả HTML, hoặc treo quá 8 giây). Đang thử là cả hai đều false ("đang kiểm"). */
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
  return { isGood: (url) => results.get(url) === true, isBad: (url) => results.get(url) === false };
}

/* Bề mặt 1-4: vendor vừa lấy từ API. Trả bgOf(v) (nền một ô), galleryOf(v) (mảng nền cho gallery, luôn ≥ 1)
   và stateOf(v) ('good' | 'checking' | 'bad'; chỉ 'bad' mới hiện minh hoạ). */
export function useVendorBackgrounds(vendors, catId) {
  const list = (vendors || []).filter(Boolean);
  const { isGood, isBad } = useImageStatus(list.flatMap(photoUrlsOf));
  const fallback = fallbackGradFor(catId);
  const goodOf = (v) => (v ? photoEntriesOf(v).filter((e) => isGood(e.url)) : []);
  const galleryOf = (v) => {
    const good = goodOf(v);
    return good.length ? good.map((e) => cssBg(e.url)) : [fallback];
  };
  return {
    galleryOf,
    bgOf: (v) => galleryOf(v)[0],
    stateOf: (v) => photoStateOf(v ? photoUrlsOf(v) : [], isGood, isBad),
    // tên tác giả của từng ảnh trong galleryOf(v) (cùng chỉ số; null = không ghi công); creditOf = của ảnh đang hiện đầu tiên
    creditsOf: (v) => { const good = goodOf(v); return good.length ? good.map((e) => e.credit) : [null]; },
    creditOf: (v) => goodOf(v)[0]?.credit || null,
  };
}

/* ── Bề mặt 5-6: vendor đã lưu ──────────────────────────────────────────
   Dữ liệu đã lưu (localStorage) không bị sửa. Lúc hiển thị, tra vendor theo id trong pool hiện tại
   (GET /api/vendors/<id>, KHÔNG kèm coupleId vì có coupleId là tính ghép lại và gọi LLM trả phí).
   Mỗi id tra tối đa một lần mỗi lần mở trang. */
const lookups = new Map();  // id → { done, ok, urls, promise }

function lookupPool(id) {
  let e = lookups.get(id);
  if (e) return e.promise;
  e = { done: false, ok: false, entries: [] };
  e.promise = api.getVendorPhotos(id)
    .then((res) => { e.ok = true; e.entries = usablePhotos(res?.vendor?.photos); })
    .catch(() => { e.ok = false; })
    .then(() => { e.done = true; });
  lookups.set(id, e);
  return e.promise;
}

/* Ảnh của vendor đã lưu: { bg, state, credit }. credit = tên tác giả của ảnh đang hiện (null nếu không phải ảnh Google). bg là nền ảnh (CSS) hoặc null khi phải dùng ảnh mặc định của bề mặt;
   state là 'good' | 'checking' | 'bad' (chỉ 'bad' mới hiện minh hoạ).
   Từ lúc mở đến khi tra xong: bg null, state 'checking', không yêu cầu nào tới URL ảnh đã lưu. */
export function useSavedVendorPhoto(vendor) {
  const [, bump] = useState(0);
  const id = vendor?.id;
  useEffect(() => {
    if (!id) return undefined;
    let alive = true;
    lookupPool(id).then(() => { if (alive) bump((n) => n + 1); });
    return () => { alive = false; };
  }, [id]);
  const e = id ? lookups.get(id) : null;
  let entries = [];
  if (!id) entries = photoEntriesOf(vendor);
  else if (e?.done) entries = e.ok ? e.entries : photoEntriesOf(vendor);
  const urls = entries.map((x) => x.url);
  const { isGood, isBad } = useImageStatus(urls);
  const firstE = entries.find((x) => isGood(x.url));
  const first = firstE?.url;
  const pending = !!id && !e?.done;
  return { bg: first ? cssBg(first) : null, state: pending ? 'checking' : photoStateOf(urls, isGood, isBad), credit: firstE?.credit || null };
}

/* Chỉ nền ảnh (CSS) của vendor đã lưu, hoặc null. */
export const useSavedVendorPhotoBg = (vendor) => useSavedVendorPhoto(vendor).bg;
