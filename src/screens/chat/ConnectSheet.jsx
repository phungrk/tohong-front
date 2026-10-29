import { useEffect, useState } from 'react';
import { Icon } from '../../ui/Icon.jsx';
import { VENDOR_CATEGORIES } from '../VendorCtx.jsx';
import { loadSavedContact } from '../connectContext.js';

const NOTE_MAX = 300;

const ERROR_TEXT = {
  contact_required: 'Hai bạn cho mình xin số điện thoại hoặc Zalo để Tơ Hồng liên hệ lại nhé.',
  contact_invalid: 'Số điện thoại hoặc Zalo hơi dài, hai bạn kiểm tra lại giúp mình nhé.',
  note_too_long: `Ghi chú tối đa ${NOTE_MAX} ký tự thôi ạ.`,
  rate_limited: 'Hai bạn đã gửi khá nhiều yêu cầu trong một giờ qua. Mình xin hai bạn thử lại sau nhé.',
  open_limit_reached: 'Hai bạn đang có 10 yêu cầu chưa xong. Đợi Tơ Hồng xử lý bớt rồi gửi thêm nhé.',
  vendor_not_found: 'Vendor này không còn trong danh sách của Tơ Hồng nữa.',
  guest_not_allowed: 'Hai bạn đăng nhập để Tơ Hồng liên hệ lại được nhé.',
};

function errorText(err) {
  if (err?.code && ERROR_TEXT[err.code]) return ERROR_TEXT[err.code];
  if (err?.status === 403) return 'Tài khoản này chỉ được xem, chưa gửi được yêu cầu kết nối.';
  return 'Chưa gửi được, hai bạn kiểm tra mạng rồi bấm gửi lại nhé. Yêu cầu sẽ không bị tạo trùng.';
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box', fontFamily: 'var(--font-ui)', fontSize: 16, color: 'var(--ink-900)',
  background: 'var(--card)', border: '1px solid var(--line-200)', borderRadius: 'var(--r-md)', padding: '11px 14px', outline: 'none',
};
const labelStyle = { fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--kim-600)', marginBottom: 6, display: 'block' };

export function ConnectSheet({ vendor, catId, isGuest, onSignIn, onCancel, onClose, onSubmit }) {
  const [shown, setShown] = useState(false);
  const [phone, setPhone] = useState(() => loadSavedContact().phone);
  const [zalo, setZalo] = useState(() => loadSavedContact().zalo);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const cat = VENDOR_CATEGORIES.find((c) => c.id === catId);
  const dismiss = sent ? onClose : onCancel;

  const submit = async () => {
    const contact = {};
    if (phone.trim()) contact.phone = phone.trim();
    if (zalo.trim()) contact.zalo = zalo.trim();
    if (!contact.phone && !contact.zalo) {
      setError(ERROR_TEXT.contact_required);
      return;
    }
    if ([...note].length > NOTE_MAX) {
      setError(ERROR_TEXT.note_too_long);
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onSubmit({ contact, note: note.trim() });
      setSent(true);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div onClick={busy ? undefined : dismiss} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(43,36,32,0.38)',
        opacity: shown ? 1 : 0, transition: 'opacity .22s' }} />
      <div role="dialog" aria-modal="true" aria-label="Nhờ Tơ Hồng kết nối vendor"
        style={{ position: 'fixed', left: '50%', bottom: 0, zIndex: 1001, width: '100%', maxWidth: 440, maxHeight: '88vh', overflowY: 'auto',
          background: 'var(--paper)', borderRadius: '22px 22px 0 0', paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          transform: `translateX(-50%) translateY(${shown ? '0' : '105%'})`, transition: 'transform .3s cubic-bezier(.2,.7,.3,1)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--line-300)' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 18px 10px' }}>
          <span style={{ width: 40, height: 40, borderRadius: 'var(--r-sm)', background: 'var(--son-50)', border: '1px solid var(--son-100)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="heart-handshake" size={20} color="var(--son-500)" />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="ds-label" style={{ color: 'var(--kim-600)', margin: 0 }}>Nhờ Tơ Hồng kết nối</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--ink-900)', lineHeight: 1.2 }}>{vendor.name}</div>
            {cat && <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>{cat.name}</div>}
          </div>
          <button type="button" onClick={dismiss} aria-label="Đóng" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex' }}>
            <Icon name="x" size={20} color="var(--ink-500)" />
          </button>
        </div>

        {isGuest ? (
          <div style={{ padding: '4px 18px 22px' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--ink-700)', lineHeight: 1.6, margin: '0 0 16px' }}>
              Hai bạn đăng nhập để Tơ Hồng có thể liên hệ lại về yêu cầu này nhé.
            </p>
            <button type="button" onClick={() => { onSignIn?.(); onClose(); }} style={primaryBtn}>Đăng nhập</button>
            <button type="button" onClick={dismiss} style={ghostBtn}>Thôi</button>
          </div>
        ) : sent ? (
          <div style={{ padding: '4px 18px 22px', textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--sage-50)', margin: '8px auto 12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="check" size={26} color="var(--sage-600)" sw={2.5} />
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--ink-900)' }}>Tơ Hồng đã nhận yêu cầu</div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--ink-500)', lineHeight: 1.6, margin: '8px 0 18px' }}>
              Mình sẽ liên hệ vendor rồi báo lại hai bạn. Trạng thái hiện ngay trên thẻ vendor.
            </p>
            <button type="button" onClick={onClose} style={primaryBtn}>Xong</button>
          </div>
        ) : (
          <div style={{ padding: '4px 18px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label htmlFor="cs-phone" style={labelStyle}>Số điện thoại</label>
                <input id="cs-phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} maxLength={40}
                  onChange={(e) => setPhone(e.target.value)} style={inputStyle} placeholder="09xx xxx xxx" />
              </div>
              <div>
                <label htmlFor="cs-zalo" style={labelStyle}>Zalo</label>
                <input id="cs-zalo" type="tel" inputMode="tel" value={zalo} maxLength={40}
                  onChange={(e) => setZalo(e.target.value)} style={inputStyle} placeholder="Số Zalo" />
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--ink-500)', margin: '8px 0 14px', lineHeight: 1.45 }}>
              Cần ít nhất một trong hai. Tơ Hồng dùng số này để liên hệ lại về đúng yêu cầu này.
            </div>

            <label htmlFor="cs-note" style={labelStyle}>Ghi chú (không bắt buộc)</label>
            <textarea id="cs-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="Gợi ý: hai bạn cưới tháng mấy, khoảng bao nhiêu bàn?"
              style={{ ...inputStyle, resize: 'none', fontFamily: 'var(--font-body)' }} />
            <div style={{ textAlign: 'right', fontFamily: 'var(--font-ui)', fontSize: 12, color: [...note].length > NOTE_MAX ? 'var(--danger-500)' : 'var(--ink-400)', marginTop: 4 }}>
              {[...note].length}/{NOTE_MAX}
            </div>

            {error && <div role="alert" style={{ margin: '8px 0 0', fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--danger-500)', lineHeight: 1.45 }}>{error}</div>}

            <div style={{ marginTop: 16 }}>
              <button type="button" disabled={busy} onClick={submit} style={{ ...primaryBtn, opacity: busy ? 0.7 : 1, cursor: busy ? 'wait' : 'pointer' }}>
                {busy ? 'Đang gửi…' : 'Gửi yêu cầu'}
              </button>
              <button type="button" disabled={busy} onClick={dismiss} style={ghostBtn}>Thôi</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const primaryBtn = {
  width: '100%', fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 700, color: 'var(--fg-on-primary)', background: 'var(--son-500)',
  border: 'none', borderRadius: 'var(--r-pill)', padding: '14px 0', cursor: 'pointer', boxShadow: 'var(--shadow-rose)',
};
const ghostBtn = {
  width: '100%', marginTop: 8, fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 600, color: 'var(--ink-700)', background: 'transparent',
  border: 'none', borderRadius: 'var(--r-pill)', padding: '11px 0', cursor: 'pointer',
};
