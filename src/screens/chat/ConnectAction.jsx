import { Icon } from '../../ui/Icon.jsx';
import { useConnect } from '../connectContext.js';

// Nút "Nhờ Tơ Hồng kết nối" hoặc trạng thái yêu cầu đã gửi (display_status từ backend).
// vendor: { id, name, hidden?, priceSource? }, catId: id hạng mục, source: 'chat' | 'vendor_tab'.
// Viewer không thấy nút (vẫn thấy trạng thái nếu đã có); vendor bị ẩn thì chỉ báo "không còn nhận đặt".
export function ConnectAction({ vendor, catId, source }) {
  const { canAct, statusFor, openConnect, vendorInfoFor } = useConnect();
  if (!vendor?.id) return null;

  const hidden = vendor.hidden === true || vendorInfoFor(vendor.id)?.hidden === true;
  const req = statusFor(vendor.id);

  if (req) {
    const done = req.display_code === 'done';
    return (
      <div data-testid="connect-status" style={statusStyle(done)}>
        <Icon name={done ? 'check' : 'clock'} size={14} color={done ? 'var(--sage-600)' : 'var(--kim-600)'} sw={2.2} />
        {req.display_status}
      </div>
    );
  }
  if (hidden) {
    return <div data-testid="vendor-unavailable" style={{ ...statusStyle(false), color: 'var(--ink-500)' }}>Không còn nhận đặt</div>;
  }
  if (!canAct) return null;

  return (
    <button type="button" data-testid="connect-btn" onClick={() => openConnect(vendor, catId, source)}
      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: 'var(--font-ui)',
        fontSize: 13.5, fontWeight: 700, color: 'var(--son-600)', background: 'var(--son-50)', border: '1px solid var(--son-100)',
        borderRadius: 'var(--r-pill)', padding: '10px 0', cursor: 'pointer' }}>
      <Icon name="heart-handshake" size={16} color="var(--son-600)" sw={2} /> Nhờ Tơ Hồng kết nối
    </button>
  );
}

function statusStyle(done) {
  return {
    width: '100%', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600, borderRadius: 'var(--r-pill)', padding: '9px 12px',
    color: done ? 'var(--sage-600)' : 'var(--kim-700)',
    background: done ? 'var(--sage-50)' : 'var(--kim-50)',
    border: `1px solid ${done ? 'var(--sage-200)' : 'var(--kim-200)'}`,
  };
}
