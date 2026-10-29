import { useCallback, useState } from 'react';
import { api } from '../api.js';
import { Loading, ErrorNote, Badge } from './common.jsx';
import { adminErrMsg, fmtContact, fmtPriceK, fmtTime, fmtWait } from './format.js';
import { useLoad } from './useLoad.js';

const PLAN_LABEL = { m1: '1 tháng', m3: '3 tháng', m6: '6 tháng', m12: '12 tháng' };

function subText(s) {
  if (!s || !s.plan) return 'Chưa có gói (dùng thử)';
  const exp = s.expires_at ? ` · hạn ${fmtTime(s.expires_at)}` : '';
  return `${PLAN_LABEL[s.plan] || s.plan} (${s.status})${exp}`;
}

export function UpgradeQueue({ onChanged }) {
  const fetchRows = useCallback(() => api.adminUpgradeList('pending'), []);
  const { data, error, reload } = useLoad(fetchRows);
  const [done, setDone] = useState('');
  const rows = data ? data.upgrades || [] : null;

  const afterDecision = async (msg) => {
    setDone(msg);
    reload();
    onChanged?.();
  };

  return (
    <section>
      <h2 className="adm-h2">Yêu cầu nâng cấp đang chờ</h2>
      <p className="adm-lead" style={{ fontSize: 14, marginBottom: 12 }}>
        Cặp đôi chọn gói rồi chuyển khoản thủ công. Sau khi nhận tiền, bấm Kích hoạt; gói mới được cộng nối vào hạn còn lại.
      </p>
      {done && <div className="adm-ok" role="status">{done}</div>}
      <ErrorNote error={error} onRetry={reload} />
      {rows === null ? (error ? null : <Loading />) : rows.length === 0 ? (
        <div className="adm-note">Không có yêu cầu nâng cấp nào đang chờ.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rows.map((u) => <UpgradeCard key={u.couple_id} u={u} onDecided={afterDecision} />)}
        </div>
      )}
    </section>
  );
}

function UpgradeCard({ u, onDecided }) {
  const [note, setNote] = useState('');
  const [mode, setMode] = useState(null); // null | 'activate' | 'reject'
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (mode === 'reject' && !note.trim()) {
      setError('Hãy nhập ghi chú trước khi từ chối.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      if (mode === 'activate') {
        await api.adminUpgradeActivate(u.couple_id, note.trim());
        await onDecided(`Đã kích hoạt gói ${PLAN_LABEL[u.plan] || u.plan} cho ${u.couple_name || u.couple_id}.`);
      } else {
        await api.adminUpgradeReject(u.couple_id, note.trim());
        await onDecided(`Đã từ chối yêu cầu của ${u.couple_name || u.couple_id}.`);
      }
    } catch (err) {
      setError(adminErrMsg(err));
      setBusy(false);
    }
  };

  return (
    <div className="adm-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600 }}>{u.couple_name || u.couple_id}</div>
          <div className="adm-muted" style={{ fontSize: 13 }}>Chờ {fmtWait(u.waiting_hours)} · gửi lúc {fmtTime(u.created_at)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <Badge tone="progress">Gói {PLAN_LABEL[u.plan] || u.plan}</Badge>
          <div className="adm-num" style={{ fontWeight: 700, marginTop: 4 }}>{fmtPriceK(u.price_k)}</div>
        </div>
      </div>
      <dl className="adm-dl" style={{ marginTop: 12 }}>
        <dt>Email</dt><dd>{u.email || '—'}</dd>
        <dt>Liên hệ</dt><dd>{fmtContact(u.contact)}</dd>
        <dt>Gói hiện tại</dt><dd>{subText(u.current_subscription)}</dd>
      </dl>
      {mode ? (
        <div>
          <textarea className="adm-textarea" value={note} onChange={(e) => setNote(e.target.value)}
            placeholder={mode === 'reject' ? 'Lý do từ chối (bắt buộc)' : 'Ghi chú (không bắt buộc), ví dụ mã giao dịch'}
            aria-label="Ghi chú" />
          <div className="adm-actions">
            <button type="button" className={`adm-btn ${mode === 'activate' ? 'adm-btn-primary' : 'adm-btn-danger'}`} disabled={busy} onClick={submit}>
              {busy ? 'Đang lưu…' : mode === 'activate' ? 'Xác nhận kích hoạt' : 'Xác nhận từ chối'}
            </button>
            <button type="button" className="adm-btn" disabled={busy} onClick={() => { setMode(null); setError(''); }}>Quay lại</button>
          </div>
        </div>
      ) : (
        <div className="adm-actions">
          <button type="button" className="adm-btn adm-btn-primary" onClick={() => setMode('activate')}>Kích hoạt</button>
          <button type="button" className="adm-btn adm-btn-danger" onClick={() => setMode('reject')}>Từ chối</button>
        </div>
      )}
      <ErrorNote error={error} />
    </div>
  );
}
