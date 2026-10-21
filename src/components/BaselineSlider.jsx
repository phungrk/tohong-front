import { useState, useEffect, useRef } from 'react';

// Baseline marker never sits closer than this to the left end of the track
const MIN_BASE_POS = 0.2;

export function BaselineSlider({ value, max = 300, base, step = 5, onChange }) {
  const [local, setLocal] = useState(value);
  const dragging = useRef(false);
  const boxRef = useRef(null);
  const lastSent = useRef(value);

  useEffect(() => {
    if (!dragging.current) { setLocal(value); lastSent.current = value; }
  }, [value]);

  const commit = (v) => {
    const clamped = Math.min(Math.max(Math.round(v / step) * step, 0), max);
    setLocal(clamped);
    if (clamped !== lastSent.current) { lastSent.current = clamped; onChange(clamped); }
  };

  // Piecewise scale: 0→base fills [0, basePos], base→max fills [basePos, 1].
  // When base/max ≥ MIN_BASE_POS this collapses to the plain linear scale.
  const basePos = base > 0 && base < max ? Math.max(base / max, MIN_BASE_POS) : null;
  const toFrac = (v) => {
    const c = Math.min(Math.max(v, 0), max);
    if (basePos === null) return max > 0 ? c / max : 0;
    return c <= base ? c / base * basePos : basePos + (c - base) / (max - base) * (1 - basePos);
  };
  const fromFrac = (f) => {
    const c = Math.min(Math.max(f, 0), 1);
    if (basePos === null) return c * max;
    return c <= basePos ? c / basePos * base : base + (c - basePos) / (1 - basePos) * (max - base);
  };

  const valueFromX = (clientX) => {
    const r = boxRef.current.getBoundingClientRect();
    const w = r.width - 16;
    return w > 0 ? fromFrac((clientX - r.left - 8) / w) : 0;
  };

  const onPointerDown = (e) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.focus({ preventScroll: true });
    commit(valueFromX(e.clientX));
  };
  const onPointerMove = (e) => { if (dragging.current) commit(valueFromX(e.clientX)); };
  const endDrag = () => { dragging.current = false; };

  const onKeyDown = (e) => {
    const big = step * 4;
    const map = { ArrowLeft: -step, ArrowDown: -step, ArrowRight: step, ArrowUp: step, PageDown: -big, PageUp: big };
    if (e.key in map) { e.preventDefault(); commit(local + map[e.key]); }
    else if (e.key === 'Home') { e.preventDefault(); commit(0); }
    else if (e.key === 'End') { e.preventDefault(); commit(max); }
  };

  const pct  = max > 0 ? Math.round(local / max * 100) : 0;
  const diff = local - base;

  // % along the inset rail (8px each side)
  const rp = (v) => `${toFrac(v) * 100}%`;

  // Same position in the outer container: maps fraction → [8px .. W-8px]
  const thumbLeft = (v) => `calc(8px + (100% - 16px) * ${toFrac(v)})`;

  const tooltipBg =
    diff > 0 ? 'var(--son-600)' :
    diff < 0 ? 'var(--sage-500)' : 'var(--ink-700)';
  const tooltipText =
    diff > 0 ? `+${diff}tr` :
    diff < 0 ? `−${Math.abs(diff)}tr` :
    'Ban đầu';

  return (
    <>
      {/*
        Outer: 80px, overflow visible.
        Layout (px from top):
          2–18  : tooltip
          18–22 : gap
          27–49 : thumb pill (center 38)
          36–42 : track (center 39)
          52–66 : baseline label
      */}
      <div style={{ position: 'relative', height: 80, overflow: 'visible' }}>

        {/* ── Track layers (inset 8px each side) ─────────────────── */}
        <div style={{ position: 'absolute', left: 8, right: 8, top: 0, bottom: 0, pointerEvents: 'none' }}>

          {/* Track base */}
          <div style={{
            position: 'absolute', top: 36, left: 0, right: 0,
            height: 6, borderRadius: 999, background: 'var(--line-200)',
          }} />

          {/* Over-baseline zone tint */}
          <div style={{
            position: 'absolute', top: 36, left: rp(base), right: 0,
            height: 6, borderRadius: '0 999px 999px 0', background: 'var(--son-50)',
          }} />

          {/* Fill: 0 → min(local, base) */}
          <div style={{
            position: 'absolute', top: 36, left: 0,
            width: local <= base ? rp(local) : rp(base),
            height: 6,
            borderRadius: local <= base ? 999 : '999px 0 0 999px',
            background: diff < 0 ? 'var(--sage-500)' : 'var(--son-500)',
          }} />

          {/* Over-baseline fill: base → local */}
          {local > base && (
            <div style={{
              position: 'absolute', top: 36, left: rp(base),
              width: `calc(${rp(local)} - ${rp(base)})`,
              height: 6, borderRadius: '0 999px 999px 0', background: 'var(--son-300)',
            }} />
          )}

          {/* Baseline marker line */}
          <div style={{
            position: 'absolute', top: 30, left: rp(base),
            width: 2, height: 18, borderRadius: 1,
            background: 'var(--ink-700)', marginLeft: -1,
          }} />

          {/* Baseline label — below track */}
          <div style={{
            position: 'absolute', top: 52, left: rp(base),
            transform: 'translateX(-50%)', whiteSpace: 'nowrap',
            fontFamily: 'var(--font-ui)', fontSize: 10.5, color: 'var(--ink-500)',
          }}>
            Ban đầu <strong style={{ color: 'var(--ink-700)' }}>{base}tr</strong>
          </div>
        </div>

        {/* ── Tooltip — directly in outer container, highest z-index ── */}
        <div style={{
          position: 'absolute', top: 2, left: thumbLeft(local),
          transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          pointerEvents: 'none', zIndex: 20,
        }}>
          <div style={{
            background: tooltipBg, color: '#fff',
            fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 700,
            padding: '2px 8px', borderRadius: 999,
            fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
          }}>
            {tooltipText}
          </div>
          <div style={{
            width: 0, height: 0,
            borderLeft: '4px solid transparent',
            borderRight: '4px solid transparent',
            borderTop: `4px solid ${tooltipBg}`,
          }} />
        </div>

        {/* ── Thumb pill — directly in outer container ─────────────── */}
        <div style={{
          position: 'absolute', top: 27, left: thumbLeft(local),
          transform: 'translateX(-50%)',
          minWidth: 34, height: 22, padding: '0 6px',
          background: '#fff', border: `2px solid ${tooltipBg}`,
          borderRadius: 999, boxShadow: '0 1px 4px rgba(0,0,0,.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none', zIndex: 19,
        }}>
          <span style={{
            fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 700,
            color: tooltipBg, fontVariantNumeric: 'tabular-nums',
          }}>
            {pct}%
          </span>
        </div>

        {/* Hit area: whole track band, captures the pointer so drags never drop */}
        <div
          ref={boxRef}
          role="slider"
          tabIndex={0}
          aria-label="Dự toán"
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={local}
          aria-valuetext={`${local} triệu, ${pct}% ngân sách cưới, ${tooltipText}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onLostPointerCapture={endDrag}
          onKeyDown={onKeyDown}
          style={{
            position: 'absolute', left: 0, right: 0, top: 10, height: 50,
            cursor: 'pointer', zIndex: 30, outline: 'none',
            touchAction: 'none', WebkitTapHighlightColor: 'transparent', userSelect: 'none',
          }}
        />
      </div>
    </>
  );
}
