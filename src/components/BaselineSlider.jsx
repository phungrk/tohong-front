import { useId } from 'react';

const CSS = `
.bsl-thumb::-webkit-slider-thumb { width: 16px; height: 16px; opacity: 0; -webkit-appearance: none; }
.bsl-thumb::-moz-range-thumb     { width: 16px; height: 16px; opacity: 0; border: none; }
`;

export function BaselineSlider({ value, max = 300, base, pct, diff, step = 5, onChange }) {
  const id = useId();
  const budgetTarget = max;

  const p = (v) => `${Math.min(Math.max(v / max * 100, 0), 100)}%`;

  const tooltipBg = diff > 0 ? 'var(--son-600)' : diff < 0 ? 'var(--sage-600)' : 'var(--ink-700)';
  const tooltipText =
    diff > 0 ? `+${diff}tr` :
    diff < 0 ? `−${Math.abs(diff)}tr` :
    'Ban đầu';

  const ariaValueText = `${value} triệu, ${pct}% ngân sách cưới, ${tooltipText}`;

  return (
    <>
      <style>{CSS}</style>
      <div style={{ position: 'relative', height: 66 }}>
        {/* Rail inset 8px each side */}
        <div style={{ position: 'absolute', left: 8, right: 8, top: 0, bottom: 0 }}>

          {/* Track base */}
          <div style={{ position: 'absolute', top: 31, left: 0, right: 0, height: 6, borderRadius: 999, background: 'var(--line-200)', pointerEvents: 'none' }} />

          {/* Over-baseline zone tint */}
          <div style={{ position: 'absolute', top: 31, left: p(base), right: 0, height: 6, borderRadius: '0 999px 999px 0', background: 'var(--son-50)', pointerEvents: 'none' }} />

          {/* Fill: 0 → min(value, base) */}
          <div style={{ position: 'absolute', top: 31, left: 0, width: `min(${p(value)}, ${p(base)})`, height: 6, borderRadius: 999, background: 'var(--son-500)', pointerEvents: 'none' }} />

          {/* Over-baseline fill: base → value (when value > base) */}
          {value > base && (
            <div style={{ position: 'absolute', top: 31, left: p(base), width: `calc(${p(value)} - ${p(base)})`, height: 6, borderRadius: '0 999px 999px 0', background: 'var(--son-300)', pointerEvents: 'none' }} />
          )}

          {/* Baseline marker line */}
          <div style={{ position: 'absolute', top: 25, left: p(base), width: 2, height: 18, borderRadius: 1, background: 'var(--ink-700)', marginLeft: -1, pointerEvents: 'none' }} />

          {/* Baseline label */}
          <div style={{
            position: 'absolute', top: 47, left: p(base),
            transform: 'translateX(-50%)', whiteSpace: 'nowrap',
            fontFamily: 'var(--font-ui)', fontSize: 10.5, color: 'var(--ink-500)',
            pointerEvents: 'none',
          }}>
            Ban đầu <strong style={{ color: 'var(--ink-700)' }}>{base}tr</strong>
          </div>

          {/* Tooltip above thumb */}
          <div style={{
            position: 'absolute', top: -1, left: p(value),
            transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            pointerEvents: 'none', zIndex: 2,
          }}>
            <div style={{
              background: tooltipBg, color: '#fff',
              fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 700,
              padding: '2px 8px', borderRadius: 999,
              fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
            }}>
              {tooltipText}
            </div>
            {/* Arrow */}
            <div style={{ width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: `4px solid ${tooltipBg}` }} />
          </div>

          {/* Thumb pill */}
          <div style={{
            position: 'absolute', top: 23, left: p(value),
            transform: 'translateX(-50%)',
            minWidth: 34, height: 22, padding: '0 5px',
            background: '#fff', border: '2px solid var(--son-500)',
            borderRadius: 999, boxShadow: '0 1px 3px rgba(0,0,0,.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none', zIndex: 1,
          }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 700, color: 'var(--son-600)', fontVariantNumeric: 'tabular-nums' }}>
              {pct}%
            </span>
          </div>

          {/* Native range input — invisible, sits on top */}
          <input
            id={id}
            type="range"
            min={0}
            max={max}
            step={step}
            value={value}
            className="bsl-thumb"
            aria-label="Dự toán"
            aria-valuetext={ariaValueText}
            onChange={(e) => onChange(parseInt(e.target.value, 10))}
            style={{
              position: 'absolute', left: 0, top: 20, width: '100%', height: 28,
              opacity: 0, cursor: 'pointer', margin: 0,
              WebkitAppearance: 'none', appearance: 'none',
            }}
          />
        </div>
      </div>
    </>
  );
}
