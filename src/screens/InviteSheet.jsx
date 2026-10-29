import { useEffect, useRef, useState } from 'react';
import { Icon } from '../ui/Icon.jsx';
import { api } from '../api.js';
import { track } from '../analytics.js';
import { INVITE_ROLES, isValidEmail } from '../journey.js';

// Màn "Mời người ấy / gia đình cùng xem" (spec 003, US4). Chỉ owner mở được (Dashboard kiểm).
// Dùng nguyên API mời thành viên có sẵn. LƯU Ý (INVITE-001): người được mời CHƯA vào xem được —
// copy không được hứa điều đó. Sự kiện plan_shared chỉ mang vai trò, không có email.

const API_ROLE_LABEL = { member: 'Cùng chỉnh sửa', viewer: 'Chỉ xem', owner: 'Quản trị' };

function errorText(err) {
  if (err?.status === 403) return 'Chỉ chủ hồ sơ mới gửi được lời mời.';
  if (err?.status === 400) return 'Email hoặc vai trò chưa hợp lệ, hai bạn kiểm tra lại giúp mình nhé.';
  return 'Chưa gửi được lời mời, hai bạn kiểm tra mạng rồi bấm gửi lại nhé.';
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box', fontFamily: 'var(--font-ui)', fontSize: 16, color: 'var(--ink-900)',
  background: 'var(--card)', border: '1px solid var(--line-200)', borderRadius: 'var(--r-md)', padding: '11px 14px', outline: 'none',
};
const labelStyle = { fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--kim-600)', marginBottom: 6, display: 'block' };
const primaryBtn = {
  width: '100%', fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 700, color: 'var(--fg-on-primary)', background: 'var(--son-500)',
  border: 'none', borderRadius: 'var(--r-pill)', padding: '14px 0', cursor: 'pointer', boxShadow: 'var(--shadow-rose)',
};
const ghostBtn = {
  width: '100%', marginTop: 8, fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 600, color: 'var(--ink-700)', background: 'transparent',
  border: 'none', borderRadius: 'var(--r-pill)', padding: '11px 0', cursor: 'pointer',
};

export function InviteSheet({ coupleId, onClose }) {
  const [shown, setShown] = useState(false);
  const [roleKey, setRoleKey] = useState('partner');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState('');   // email vừa mời (chỉ hiển thị trên màn, không đi vào sự kiện)
  const [invites, setInvites] = useState([]); // lời mời đang chờ từ GET /members
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    const id = requestAnimationFrame(() => setShown(true));
    return () => { aliveRef.current = false; cancelAnimationFrame(id); };
  }, []);

  const loadInvites = () =>
    api.listMembers(coupleId)
      .then((r) => { if (aliveRef.current) setInvites(Array.isArray(r?.invites) ? r.invites : []); })
      .catch(() => {});

  useEffect(() => {
    if (!coupleId) return undefined;
    let alive = true;
    api.listMembers(coupleId)
      .then((r) => { if (alive) setInvites(Array.isArray(r?.invites) ? r.invites : []); })
      .catch(() => {});
    return () => { alive = false; };
  }, [coupleId]);

  const valid = isValidEmail(email);

  const submit = async () => {
    if (busy) return;
    if (!valid) { setError('Hai bạn nhập email hợp lệ giúp mình nhé.'); return; }
    const address = email.trim();
    setBusy(true);
    setError('');
    try {
      await api.inviteMember(coupleId, { email: address, role: INVITE_ROLES[roleKey].role });
      // Chỉ sau khi hệ thống nhận lời mời. Payload chỉ có vai trò, không có email.
      track('plan_shared', { journey: 'sharing', invitee_role: roleKey });
      if (aliveRef.current) { setSentTo(address); setEmail(''); }
      loadInvites();
    } catch (err) {
      if (aliveRef.current) setError(errorText(err));
    } finally {
      if (aliveRef.current) setBusy(false);
    }
  };

  const dismiss = () => { if (!busy) onClose(); }; // "Thôi": không gọi API, không sự kiện

  return (
    <>
      <div onClick={dismiss} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(43,36,32,0.38)',
        opacity: shown ? 1 : 0, transition: 'opacity .22s' }} />
      <div role="dialog" aria-modal="true" aria-label="Mời người ấy hoặc gia đình cùng xem"
        style={{ position: 'fixed', left: '50%', bottom: 0, zIndex: 1001, width: '100%', maxWidth: 440, maxHeight: '88vh', overflowY: 'auto',
          background: 'var(--paper)', borderRadius: '22px 22px 0 0', paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          transform: `translateX(-50%) translateY(${shown ? '0' : '105%'})`, transition: 'transform .3s cubic-bezier(.2,.7,.3,1)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--line-300)' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 18px 10px' }}>
          <span style={{ width: 40, height: 40, borderRadius: 'var(--r-sm)', background: 'var(--son-50)', border: '1px solid var(--son-100)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="user-plus" size={20} color="var(--son-500)" />
          </span>
          <div style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--ink-900)', lineHeight: 1.2 }}>
            Mời người ấy / gia đình cùng xem
          </div>
          <button type="button" onClick={dismiss} aria-label="Đóng" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex' }}>
            <Icon name="x" size={20} color="var(--ink-500)" />
          </button>
        </div>

        <div style={{ padding: '4px 18px 20px' }}>
          {sentTo && (
            <div role="status" style={{ background: 'var(--sage-50)', borderRadius: 'var(--r-md)', padding: '12px 14px', marginBottom: 14,
              fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--ink-700)', lineHeight: 1.55 }}>
              Tơ Hồng đã ghi lời mời cho {sentTo}. Tính năng cùng xem kế hoạch đang hoàn thiện — Tơ Hồng sẽ báo hai bạn khi người được mời vào xem được.
            </div>
          )}

          <span style={labelStyle}>Người được mời là</span>
          <div role="radiogroup" aria-label="Người được mời là" style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {Object.entries(INVITE_ROLES).map(([key, { label }]) => {
              const on = roleKey === key;
              return (
                <button key={key} type="button" role="radio" aria-checked={on} disabled={busy} onClick={() => setRoleKey(key)}
                  style={{ flex: 1, fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 600, padding: '10px 0', borderRadius: 'var(--r-pill)',
                    cursor: busy ? 'default' : 'pointer', color: on ? 'var(--son-700)' : 'var(--ink-700)',
                    background: on ? 'var(--son-50)' : 'var(--card)', border: `1px solid ${on ? 'var(--son-300)' : 'var(--line-200)'}` }}>
                  {label}
                </button>
              );
            })}
          </div>

          <label htmlFor="inv-email" style={labelStyle}>Email</label>
          <input id="inv-email" type="email" inputMode="email" autoComplete="off" value={email} maxLength={254} disabled={busy}
            onChange={(e) => setEmail(e.target.value)} style={inputStyle} placeholder="ten@email.com" />
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--ink-500)', margin: '8px 0 0', lineHeight: 1.45 }}>
            Tơ Hồng ghi lời mời lại; tính năng cùng xem kế hoạch đang hoàn thiện nên người được mời chưa vào xem được ngay.
          </div>

          {error && <div role="alert" style={{ margin: '8px 0 0', fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--danger-500)', lineHeight: 1.45 }}>{error}</div>}

          <div style={{ marginTop: 16 }}>
            <button type="button" disabled={!valid || busy} onClick={submit}
              style={{ ...primaryBtn, opacity: !valid || busy ? 0.55 : 1, cursor: busy ? 'wait' : valid ? 'pointer' : 'default' }}>
              {busy ? 'Đang gửi…' : 'Gửi lời mời'}
            </button>
            <button type="button" disabled={busy} onClick={dismiss} style={ghostBtn}>Thôi</button>
          </div>

          {invites.length > 0 && (
            <div style={{ marginTop: 18, borderTop: '1px solid var(--line-100)', paddingTop: 12 }}>
              <span style={labelStyle}>Lời mời đang chờ</span>
              {invites.map((inv) => (
                <div key={inv.invite_id || `${inv.email}-${inv.created_at}`}
                  style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '6px 0',
                    fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--ink-700)' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.email}</span>
                  <span style={{ color: 'var(--ink-500)', flexShrink: 0 }}>{API_ROLE_LABEL[inv.role] || inv.role}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
