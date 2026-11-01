import { useEffect, useRef } from 'react';

// Khung app hẹp hơn viewport: lớp tối chỉ phủ trong khung (T-025), nên chạm vùng
// ngoài khung (.app-page, hai bên) phải đóng sheet như chạm lớp tối.
export function useOutsideFrameDismiss(onDismiss, enabled = true) {
  const ref = useRef(onDismiss);
  useEffect(() => { ref.current = onDismiss; });
  useEffect(() => {
    if (!enabled) return undefined;
    const onDown = (e) => {
      if (e.target instanceof Element && !e.target.closest('.app-frame')) ref.current?.();
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [enabled]);
}
