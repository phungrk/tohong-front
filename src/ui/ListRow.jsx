import { Icon } from './Icon.jsx';

// Shared list pattern from the Budget screen: flat rows on the page background,
// separated by hairlines, 16px page margins.

export function SectionHeader({ label, count, color = 'var(--ink-400)', style }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '18px 0 2px', ...style }}>
      <span className="ds-label" style={{ margin: 0, color }}>{label}</span>
      <span style={{ flex: 1, height: 1, background: 'var(--line-100)' }} />
      {count != null && (
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 500, color: 'var(--ink-400)', fontVariantNumeric: 'lining-nums tabular-nums' }}>
          {count}
        </span>
      )}
    </div>
  );
}

// 32px circle: outlined by default, filled sage when `done`.
export function RowIcon({ icon, letter, done = false }) {
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%', flexShrink: 0, boxSizing: 'border-box', alignSelf: 'center',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: done ? 'var(--sage-600)' : 'transparent',
      border: `1px solid ${done ? 'var(--sage-600)' : 'var(--line-200)'}`,
    }}>
      {letter != null
        ? <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: done ? '#fff' : 'var(--ink-500)', lineHeight: 1 }}>{letter}</span>
        : <Icon name={icon || 'circle-dashed'} size={15} sw={1.6} color={done ? '#fff' : 'var(--ink-500)'} />}
    </div>
  );
}

export function Amount({ value, unit, size = 21, weight = 600, color = 'var(--ink-900)', unitSize }) {
  return (
    <span style={{ fontFamily: 'var(--font-display)', fontSize: size, fontWeight: weight, color, fontVariantNumeric: 'lining-nums tabular-nums', flexShrink: 0, whiteSpace: 'nowrap' }}>
      {value}{unit && <span style={{ fontSize: unitSize ?? Math.max(12, Math.round(size * 0.62)), fontWeight: 500, color: color === 'var(--ink-900)' ? 'var(--ink-500)' : color }}>{unit}</span>}
    </span>
  );
}

/**
 * icon/letter/done → left circle. title (node) + value (node, right of title).
 * sub (node) italic second line, subColor; subRight (node) under value.
 * onClick → whole row is a button with a chevron; `right` replaces the chevron.
 */
export function ListRow({
  icon, letter, done, leading, title, titleStyle, value, sub, subColor = 'var(--ink-400)', subRight,
  right, onClick, isLast = false, muted = false,
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      {...(onClick ? { type: 'button', onClick } : {})}
      style={{
        width: '100%', display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 0',
        background: 'transparent', border: 'none', borderBottom: isLast ? 'none' : '1px solid var(--line-100)',
        cursor: onClick ? 'pointer' : 'default', textAlign: 'left', font: 'inherit', color: 'inherit',
      }}>
      {leading ?? ((icon || letter != null) && <RowIcon icon={icon} letter={letter} done={done} />)}

      <div style={{ flex: 1, minWidth: 0, alignSelf: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 400, lineHeight: 1.4, textWrap: 'pretty',
            color: muted ? 'var(--ink-400)' : 'var(--ink-900)', minWidth: 0, ...titleStyle }}>{title}</span>
          {value}
        </div>
        {(sub || subRight) && (
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginTop: 2 }}>
            <span style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 12.5, fontWeight: 400, lineHeight: 1.4,
              textWrap: 'pretty', color: subColor, minWidth: 0 }}>{sub}</span>
            {subRight}
          </div>
        )}
      </div>

      {right !== undefined
        ? <div style={{ alignSelf: 'center', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>{right}</div>
        : onClick && (
          <div style={{ alignSelf: 'center', display: 'flex', flexShrink: 0 }}>
            <Icon name="chevron-right" size={16} color="var(--ink-300)" />
          </div>
        )}
    </Tag>
  );
}
