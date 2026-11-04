import { useEffect, useState } from 'react';
import { VV_DEBUG, measureVV } from './vvBottom.js';

/** Dòng chẩn đoán, một phần tử chữ duy nhất; chỉ hiện khi địa chỉ có ?vvdebug=1. */
export function VVDebug({ gap }) {
  const [text, setText] = useState('');
  useEffect(() => {
    if (!VV_DEBUG) return undefined;
    const run = () => setText(measureVV(gap));
    let raf = requestAnimationFrame(run);
    const again = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(run); };
    window.addEventListener('scroll', again, { passive: true });
    window.addEventListener('resize', again);
    window.visualViewport?.addEventListener('resize', again);
    window.visualViewport?.addEventListener('scroll', again);
    document.addEventListener('focusin', again);
    document.addEventListener('focusout', again);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', again);
      window.removeEventListener('resize', again);
      window.visualViewport?.removeEventListener('resize', again);
      window.visualViewport?.removeEventListener('scroll', again);
      document.removeEventListener('focusin', again);
      document.removeEventListener('focusout', again);
    };
  }, [gap]);
  if (!VV_DEBUG) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999, background: '#000', color: '#fff',
      font: '10px/1.25 monospace', padding: '2px 4px', pointerEvents: 'none', wordBreak: 'break-all' }}>{text}</div>
  );
}
