import { useEffect, useRef } from 'react';

// Khung app hẹp hơn viewport: lớp tối chỉ phủ trong khung (T-025), nên chạm vùng
// ngoài khung phải đóng sheet như chạm lớp tối. Mỗi cú chạm chỉ đóng đúng một lớp:
// lớp mở sau cùng (ngăn xếp), lớp bên dưới còn mở.
const layers = [];

function onDown(e) {
  if (!(e.target instanceof Element) || e.target.closest('.app-frame')) return;
  layers[layers.length - 1]?.current?.();
}

export function useOutsideFrameDismiss(onDismiss, enabled = true) {
  const ref = useRef(onDismiss);
  useEffect(() => { ref.current = onDismiss; });
  useEffect(() => {
    if (!enabled) return undefined;
    if (layers.length === 0) document.addEventListener('pointerdown', onDown);
    layers.push(ref);
    return () => {
      layers.splice(layers.indexOf(ref), 1);
      if (layers.length === 0) document.removeEventListener('pointerdown', onDown);
    };
  }, [enabled]);
}
