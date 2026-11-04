// Bù đáy cho khối dính (InstallHint + BottomTabBar) theo visualViewport (T-056).
//
// Trên Chrome iOS, cửa sổ bố cục (innerHeight, nơi `bottom: 0` neo vào) có thể kéo dài tới sau thanh
// công cụ dưới của trình duyệt, còn visualViewport chỉ gồm phần nhìn thấy. Phần chênh đó được đặt thành
// biến CSS --vv-bottom trên <html>; khối dính dùng làm `bottom`. Không nhận diện UA.
//
//   chênh = max(0, innerHeight - vv.height - vv.offsetTop)
//   = 0 khi: chênh < 1px, đang zoom (scale != 1), hoặc đang focus ô nhập chữ (bàn phím ảo).
//
// Cờ ?vvdebug=1: <VVDebug /> in các số đo ở mép trên màn hình để chọn bước sau khi thử trên máy thật.

import { useEffect, useState } from 'react';

const NON_TEXT_INPUT = new Set(['checkbox', 'radio', 'button', 'submit', 'reset', 'range', 'file', 'color', 'image']);

function isTyping() {
  const el = document.activeElement;
  if (!el) return false;
  if (el.isContentEditable) return true;
  if (el.tagName === 'TEXTAREA') return true;
  if (el.tagName === 'INPUT') return !NON_TEXT_INPUT.has((el.type || 'text').toLowerCase());
  return false;
}

function readGap() {
  const vv = window.visualViewport;
  if (!vv || vv.scale !== 1 || isTyping()) return 0;
  const gap = window.innerHeight - vv.height - vv.offsetTop;
  return gap < 1 ? 0 : gap;
}

/** Cài --vv-bottom trên <html> theo từng sự kiện; trả về số px đang áp (để ?vvdebug=1 in ra). */
export function useVVBottom() {
  const [gap, setGap] = useState(0);
  useEffect(() => {
    const root = document.documentElement;
    const update = () => {
      const g = readGap();
      root.style.setProperty('--vv-bottom', `${g}px`);
      setGap(g);
    };
    // focusout: activeElement còn là ô cũ trong lúc sự kiện chạy, nên tính lại sau một nhịp.
    const onFocusOut = () => setTimeout(update, 0);
    const vv = window.visualViewport;
    update();
    vv?.addEventListener('resize', update);
    vv?.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    document.addEventListener('focusin', update);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      vv?.removeEventListener('resize', update);
      vv?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      document.removeEventListener('focusin', update);
      document.removeEventListener('focusout', onFocusOut);
      root.style.removeProperty('--vv-bottom');
    };
  }, []);
  return gap;
}

export const VV_DEBUG = typeof window !== 'undefined' && /[?&]vvdebug=1(&|$)/.test(window.location.search);

// Đo chiều dài CSS (svh, lvh, dvh, env()) bằng một phần tử tạm.
function probe(len) {
  const d = document.createElement('div');
  d.style.cssText = `position:fixed;top:0;left:0;width:0;height:${len};visibility:hidden;pointer-events:none`;
  document.body.appendChild(d);
  const h = d.getBoundingClientRect().height;
  d.remove();
  return Math.round(h * 100) / 100;
}

export function measureVV(gap) {
  const vv = window.visualViewport;
  const cur = document.querySelector('button[aria-current="page"]');
  const rects = cur ? [...cur.parentElement.children].map((b) => b.getBoundingClientRect()) : [];
  const ua = (/CriOS\/[\d.]+|Version\/[\d.]+/.exec(navigator.userAgent) || ['?'])[0];
  const r = (n) => Math.round(n * 100) / 100;
  return [
    ['innerHeight', window.innerHeight], ['vv.height', vv ? r(vv.height) : 'n/a'],
    ['vv.offsetTop', vv ? r(vv.offsetTop) : 'n/a'], ['vv.scale', vv ? r(vv.scale) : 'n/a'],
    ['100svh', probe('100svh')], ['100lvh', probe('100lvh')], ['100dvh', probe('100dvh')],
    ['safe-bottom', probe('env(safe-area-inset-bottom,0px)')], ['bù', r(gap)], ['dpr', window.devicePixelRatio],
    ['scrollY', Math.round(window.scrollY)],
    ['maxScroll', Math.max(0, document.scrollingElement.scrollHeight - window.innerHeight)],
    ['tab.top', rects.length ? r(Math.min(...rects.map((x) => x.top))) : -1],
    ['tab.bottom', rects.length ? r(Math.max(...rects.map((x) => x.bottom))) : -1],
    ['ua', ua],
  ].map(([k, v]) => `${k}=${v}`).join(' ');
}
