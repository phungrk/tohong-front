// Cuộn ở cấp document (T-054/T-055, ADR-022).
//
// Safari iPhone chỉ thu gọn thanh địa chỉ và ẩn thanh dưới khi document cuộn, nên app không còn
// khung con cuộn. File này giữ ba việc đi kèm:
//  - nhớ và khôi phục vị trí cuộn theo từng trang (địa chỉ hash), trước khi vẽ khung hình đầu tiên;
//  - khoá cuộn nền khi có lớp mở;
//  - quyết định khối gợi ý cài ẩn khi kéo nội dung lên, hiện khi kéo xuống (ngưỡng 8px).
// Không đụng tới history.state hay bước lịch sử của nav.js.

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const HINT_THRESHOLD = 8;
const LOCK_CLASS = 'doc-locked';

const maxScroll = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
const clampedY = () => Math.min(maxScroll(), Math.max(0, window.scrollY));
const isLocked = () => document.documentElement.classList.contains(LOCK_CLASS);

/**
 * @param {string} pageKey  địa chỉ hash của trang đang xem (thay đổi = đổi trang)
 * @param {boolean} locked  có lớp mở: khoá cuộn nền
 * @returns {{ hintHidden: boolean, remember: () => void, startFresh: (hash: string) => void }}
 *   remember(): gọi ngay trước goTab/openCategory/closeSubpage để nhớ vị trí lúc rời.
 *   startFresh(hash): lần tới vào trang `hash` bắt đầu ở 0 (mở trang con bằng cách chạm hạng mục).
 */
export function useDocScroll(pageKey, locked) {
  const [hintHidden, setHintHidden] = useState(false);
  const posRef = useRef({});          // hash -> scrollY lúc rời trang
  const keyRef = useRef(null);
  const freshRef = useRef(null);
  const dirRef = useRef({ last: 0, anchor: 0, dir: 0 });

  // Tự quản lý vị trí: trình duyệt không được khôi phục giữa các bước lịch sử.
  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
  }, []);

  useLayoutEffect(() => {
    document.documentElement.classList.toggle(LOCK_CLASS, locked);
    return () => document.documentElement.classList.remove(LOCK_CLASS);
  }, [locked]);

  // Đổi trang: đặt vị trí đã nhớ trước khi vẽ, và đưa khối gợi ý về trạng thái hiện.
  useLayoutEffect(() => {
    if (keyRef.current === pageKey) return;
    keyRef.current = pageKey;
    const fresh = freshRef.current === pageKey;
    freshRef.current = null;
    const y = fresh ? 0 : (posRef.current[pageKey] || 0);
    window.scrollTo(0, y);
    const at = window.scrollY;
    dirRef.current = { last: at, anchor: at, dir: 0 };
    setHintHidden(false);
  }, [pageKey]);

  // Vị trí LÚC RỜI (spec 4.1): đọc scrollY ngay trước khi DOM đổi, không đợi sự kiện scroll (có thể chưa bắn
  // trong cùng khung hình) và không đọc trong useLayoutEffect (màn mới ngắn hơn đã kẹp scrollY).
  const remember = useCallback(() => { if (keyRef.current) posRef.current[keyRef.current] = window.scrollY; }, []);
  const startFresh = useCallback((hash) => { freshRef.current = hash; }, []);
  useEffect(() => {
    // Back/Forward: listener capture chạy trước listener của nav.js, trước khi React vẽ trang mới.
    window.addEventListener('popstate', remember, true);
    return () => window.removeEventListener('popstate', remember, true);
  }, [remember]);

  useEffect(() => {
    const onScroll = () => {
      if (isLocked()) return;
      // Nhớ vị trí của trang đang xem (ghi đè liên tục; lần cuối là lúc rời).
      if (keyRef.current) posRef.current[keyRef.current] = window.scrollY;
      // Hướng và ngưỡng tính trên scrollY đã kẹp: kéo quá đà ở đầu/cuối trang không tính.
      const y = clampedY();
      const d = dirRef.current;
      if (y === d.last) return;
      const dir = y > d.last ? 1 : -1;
      if (dir !== d.dir) { d.anchor = d.last; d.dir = dir; }
      d.last = y;
      if (y <= 0) { setHintHidden(false); return; }
      if (dir > 0 && y - d.anchor >= HINT_THRESHOLD) setHintHidden(true);
      else if (dir < 0 && d.anchor - y >= HINT_THRESHOLD) setHintHidden(false);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return { hintHidden, remember, startFresh };
}
