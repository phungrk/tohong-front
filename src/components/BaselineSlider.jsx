import { useState, useEffect, useRef } from 'react';

const CSS = `
.bsl-input { -webkit-appearance: none; appearance: none; }
.bsl-input::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; opacity: 0; }
.bsl-input::-moz-range-thumb { width: 16px; height: 16px; opacity: 0; border: none; background: none; }
`;

export function BaselineSlider({ value, max = 300, base, step = 5, onChange }) {
  const [local, setLocal] = useState(value);
  const dragging = useRef(false);

  useEffect(() => {
    if (!dragging.current) setLocal(value);
  }, [value]);

  const pct  = max > 0 ? Math.round(local / max * 100) : 0;
  const diff = local - base;

  // % along the inset rail (8px each side)
  const rp = (v) => `${Math.min(Math.max(v / max * 100, 0), 100)}%`;

  // absolute left in the OUTER container, accounting for 8px thumb-inset
  // calc(8px + (100% - 16px) * fraction) maps [0..max] → [8px..(W-8px)]
  const thumbLeft = (v) => `calc(8px + (100% - 16px) * ${Math.min(Math.max(v / max, 0), 1)})`;

  const tooltipBg =
    diff > 0 ? 'var(--son-600)' :
    diff < 0 ? 'var(--sage-500)' : 'var(--ink-700)';
  const tooltipText =
    diff > 0 ? `+${diff}tr` :
    diff < 0 ? `−${Math.abs(diff)}tr` :
    'Ban đầu';

  const handleChange = (e) => {
    const v = parseInt(e.target.value, 10);
    setLocal(v);
    onChange(v);
  };

  return (
    <>
      <style>{CSS}</style>
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
            background: 'var(--son-500)',
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
          background: '#fff', border: '2px solid var(--son-500)',
          borderRadius: 999, boxShadow: '0 1px 4px rgba(0,0,0,.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none', zIndex: 19,
        }}>
          <span style={{
            fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 700,
            color: 'var(--son-600)', fontVariantNumeric: 'tabular-nums',
          }}>
            {pct}%
          </span>
        </div>

        {/* ── Native input — full width, transparent ────────────────── */}
        <input
          type="range"
          min={0}
          max={max}
          step={step}
          value={local}
          className="bsl-input"
          aria-label="Dự toán"
          aria-valuetext={`${local} triệu, ${pct}% ngân sách cưới, ${tooltipText}`}
          onMouseDown={() => { dragging.current = true; }}
          onTouchStart={() => { dragging.current = true; }}
          onMouseUp={() => { dragging.current = false; }}
          onTouchEnd={() => { dragging.current = false; }}
          onChange={handleChange}
          style={{
            position: 'absolute', left: 0, top: 22, width: '100%', height: 30,
            opacity: 0, cursor: 'pointer', margin: 0, zIndex: 10,
          }}
        />
      </div>
    </>
  );
}
