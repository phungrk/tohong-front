import { useState } from 'react';
import { Icon } from './Icon.jsx';

export function ThreadMark({ size = 24, color = 'var(--son-500)', dot = 'var(--kim-400)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <path d="M40 30 C 40 22, 33 15.5, 25.5 15.5 C 17 15.5, 11 22, 11 30 C 11 43, 27 53, 40 63 C 53 53, 69 43, 69 30 C 69 22, 63 15.5, 54.5 15.5 C 47 15.5, 40 22, 40 30 Z"
        fill="none" stroke={color} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M40 63 L 40 73" stroke={color} strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="40" cy="73" r="3.4" fill={dot} />
    </svg>
  );
}

export function Avatar({ size = 30 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'var(--son-50)', border: '1px solid var(--son-100)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <ThreadMark size={size * 0.62} />
    </div>
  );
}

export function AgentTag({ name = 'wallet', label = 'budget-agent' }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontFamily: 'var(--font-ui)', fontSize: 10.5, fontWeight: 600,
      letterSpacing: '0.06em', textTransform: 'uppercase',
      color: 'var(--kim-700)', background: 'var(--kim-50)',
      border: '1px solid var(--kim-200)', borderRadius: 'var(--r-pill)',
      padding: '3px 9px', alignSelf: 'flex-start',
    }}>
      <Icon name={name} size={11} color="var(--kim-600)" /> {label}
    </span>
  );
}

export function Thread({ w = '100%', mt = 0, mb = 0 }) {
  return (
    <svg viewBox="0 0 300 12" preserveAspectRatio="none"
      style={{ width: w, height: 10, display: 'block', marginTop: mt, marginBottom: mb }}>
      <path d="M0 6 C 80 6, 90 2, 150 2 C 210 2, 220 10, 300 6"
        stroke="var(--son-300)" strokeWidth="1.2" fill="none" />
      <circle cx="150" cy="2" r="2.2" fill="var(--kim-400)" />
    </svg>
  );
}

export function EditAmount({ value, onChange, size = 15, color = 'var(--ink-900)', align = 'right' }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  const startEdit = () => { setDraft(String(value)); setEditing(true); };
  const commit = () => {
    const n = parseInt(draft, 10);
    onChange(isNaN(n) ? 0 : n);
    setEditing(false);
  };

  if (editing) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 1 }}>
        <input
          autoFocus
          value={draft}
          inputMode="numeric"
          autoComplete="off"
          onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ''))}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') { setDraft(String(value)); setEditing(false); }
          }}
          style={{
            width: Math.max(28, draft.length * (size * 0.62) + 6),
            fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: size,
            color: 'var(--son-600)', textAlign: align,
            border: 'none', borderBottom: '2px solid var(--son-400)', outline: 'none',
            background: 'var(--son-50)', borderRadius: '3px 3px 0 0',
            padding: '0 2px', fontVariantNumeric: 'tabular-nums',
          }}
        />
        <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: size, color: 'var(--son-600)' }}>tr</span>
      </span>
    );
  }

  return (
    <button
      onClick={startEdit}
      style={{
        fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: size, color,
        fontVariantNumeric: 'tabular-nums', background: 'transparent', border: 'none',
        borderBottom: '1px dashed transparent', padding: 0, cursor: 'text', lineHeight: 1.2,
        flexShrink: 0, whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderBottomColor = 'var(--line-300)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderBottomColor = 'transparent')}
    >
      {value}tr
    </button>
  );
}

export function EditName({ value, onChange, size = 15, weight = 600, focusNew = false }) {
  const [editing, setEditing] = useState(focusNew);
  const [draft, setDraft] = useState(value);

  const startEdit = () => { setDraft(value); setEditing(true); };
  const commit = () => { onChange(draft.trim() || value); setEditing(false); };

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onFocus={(e) => e.target.select()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') { setDraft(value); setEditing(false); }
        }}
        style={{
          fontFamily: 'var(--font-body)', fontWeight: weight, fontSize: size,
          color: 'var(--ink-900)', border: 'none',
          borderBottom: '2px solid var(--son-400)', outline: 'none',
          background: 'var(--son-50)', borderRadius: '3px 3px 0 0',
          padding: '0 3px', width: 'min(180px, 60vw)',
        }}
      />
    );
  }

  return (
    <span
      onClick={startEdit}
      style={{
        fontFamily: 'var(--font-body)', fontWeight: weight, fontSize: size,
        color: 'var(--ink-900)', cursor: 'text', borderBottom: '1px dashed transparent',
      }}
    >
      {value}
    </span>
  );
}

export function AllocSlider({ value, max = 300, color = 'var(--son-500)', disabled = false, onChange }) {
  return (
    <input
      type="range"
      className="bx-range"
      min={0}
      max={max}
      step={5}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(parseInt(e.target.value, 10))}
      style={{
        '--bx-fill': disabled ? 'var(--line-300)' : color,
        '--bx-pct': (value / max) * 100 + '%',
      }}
    />
  );
}
