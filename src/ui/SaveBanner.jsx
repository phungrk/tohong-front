import { useState } from 'react';
import { Icon } from './Icon.jsx';

/**
 * Banner cố định dưới header, nhắc guest đăng ký để lưu dữ liệu.
 * Tự ẩn sau khi user bấm X (session-only, không lưu localStorage).
 */
export function SaveBanner({ onSignIn }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div style={{
      flexShrink: 0,
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 14px',
      background: 'linear-gradient(90deg, var(--son-50) 0%, #fdf4ef 100%)',
      borderBottom: '1px solid var(--son-100)',
    }}>
      <Icon name="cloud-off" size={15} color="var(--son-500)" />
      <span style={{ flex: 1, fontFamily: 'var(--font-ui)', fontSize: 12.5, color: 'var(--ink-700)', lineHeight: 1.4 }}>
        Dữ liệu chưa được lưu.{' '}
        <button
          onClick={onSignIn}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            fontFamily: 'var(--font-ui)', fontSize: 12.5, fontWeight: 700,
            color: 'var(--son-600)', textDecoration: 'underline', textUnderlineOffset: 2,
          }}
        >
          Đăng ký miễn phí
        </button>{' '}
        để không mất kế hoạch cưới.
      </span>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Ẩn thông báo"
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 2,
          color: 'var(--ink-400)', flexShrink: 0,
        }}
      >
        <Icon name="x" size={14} color="var(--ink-400)" />
      </button>
    </div>
  );
}
