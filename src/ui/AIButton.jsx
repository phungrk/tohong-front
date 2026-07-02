import { Icon } from './Icon.jsx';

/* ── AIButton — pill "AI" nút mở trợ lý Tơ Hồng, đặt trên header ──
   Thay cho FAB nổi trước đây. Dùng chung style với nút AI ở màn Vendor. */
export function AIButton({ onOpen }) {
  return (
    <button type="button" onClick={onOpen}
      style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 13px',
        background: 'var(--son-500)', color: '#fff', border: 'none', borderRadius: 'var(--r-pill)',
        cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 12.5, fontWeight: 700 }}>
      <Icon name="sparkles" size={14} color="#fff" sw={2} /> AI
    </button>
  );
}

export default AIButton;
