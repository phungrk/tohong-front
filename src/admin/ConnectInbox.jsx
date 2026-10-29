import { useCallback, useState } from 'react';
import { api } from '../api.js';
import { Loading, ErrorNote, Badge, Field } from './common.jsx';
import { adminErrMsg, fmtContact, fmtTime, fmtWait } from './format.js';
import { useLoad } from './useLoad.js';

const STATUS = {
  new: { label: 'Mới', tone: 'new' },
  contacted_vendor: { label: 'Đã liên hệ vendor', tone: 'progress' },
  informed_couple: { label: 'Đã báo cặp đôi', tone: 'info' },
  won: { label: 'Thành', tone: 'ok' },
  lost: { label: 'Không thành', tone: 'bad' },
};
const ORDER = ['new', 'contacted_vendor', 'informed_couple'];
const CLOSE_REASONS = {
  won: [['booked', 'Đã đặt'], ['negotiating', 'Đang thương lượng']],
  lost: [
    ['vendor_unavailable', 'Vendor kín lịch'],
    ['over_budget', 'Vượt ngân sách'],
    ['vendor_unreachable', 'Không liên lạc được vendor'],
    ['couple_changed_mind', 'Cặp đôi đổi ý'],
    ['other', 'Lý do khác'],
  ],
};
const REASON_LABEL = Object.fromEntries([...CLOSE_REASONS.won, ...CLOSE_REASONS.lost]);

const FILTERS = [
  ['open', 'Chưa đóng'],
  ['new', 'Mới'],
  ['contacted_vendor', 'Đã liên hệ vendor'],
  ['informed_couple', 'Đã báo cặp đôi'],
  ['closed', 'Đã đóng'],
];

// Bước hợp lệ từ một trạng thái: tiến/lùi đúng một bước (khớp luật backend).
function stepsFrom(status) {
  const i = ORDER.indexOf(status);
  if (i < 0) return { back: 'informed_couple', forward: [] };
  return {
    back: i > 0 ? ORDER[i - 1] : null,
    forward: i < 2 ? [ORDER[i + 1]] : ['won', 'lost'],
  };
}

export function ConnectInbox({ onChanged, onEditVendor }) {
  const [filter, setFilter] = useState('open');
  const [selId, setSelId] = useState(null);
  const fetchRows = useCallback(() => api.adminConnectList(filter), [filter]);
  const { data, error, reload } = useLoad(fetchRows);
  const rows = data ? data.requests || [] : null;

  const changed = () => {
    reload();
    onChanged?.();
  };

  return (
    <section>
      <h2 className="adm-h2">Hộp kết nối vendor</h2>
      <div className="adm-toolbar" role="tablist" aria-label="Lọc theo trạng thái">
        {FILTERS.map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={filter === k}
            className={`adm-chip ${filter === k ? 'is-active' : ''}`}
            onClick={() => { setSelId(null); setFilter(k); }}>{label}</button>
        ))}
      </div>
      <ErrorNote error={error} onRetry={reload} />
      <div className="adm-split">
        <div>
          {rows === null ? (error ? null : <Loading />) : rows.length === 0 ? (
            <div className="adm-note">Không có yêu cầu nào ở mục này.</div>
          ) : (
            <div className="adm-card" style={{ padding: 0, overflowX: 'auto' }}>
              <table className="adm-table">
                <thead>
                  <tr><th>Cặp đôi</th><th>Vendor</th><th>Trạng thái</th><th>Chờ</th></tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className={`is-clickable ${selId === r.id ? 'is-selected' : ''}`}
                      onClick={() => setSelId(r.id)} tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter') setSelId(r.id); }}>
                      <td>
                        <div>{r.couple?.name || r.couple?.id}</div>
                        <div className="adm-muted" style={{ fontSize: 12 }}>{r.couple?.email || '—'}</div>
                      </td>
                      <td>
                        <div>{r.vendor?.name || r.vendor?.id}</div>
                        <div className="adm-muted" style={{ fontSize: 12 }}>
                          {r.vendor?.catLabel || r.vendor?.category || ''}
                          {r.vendor_hidden && ' · đang ẩn'}
                        </div>
                      </td>
                      <td><Badge tone={STATUS[r.status]?.tone}>{STATUS[r.status]?.label || r.status}</Badge></td>
                      <td className="adm-num">{fmtWait(r.waiting_hours)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div>
          {selId ? (
            <ConnectDetail key={selId} id={selId} onChanged={changed} onEditVendor={onEditVendor} />
          ) : (
            <div className="adm-note">Chọn một yêu cầu để xem chi tiết.</div>
          )}
        </div>
      </div>
    </section>
  );
}

function ConnectDetail({ id, onChanged, onEditVendor }) {
  const fetchOne = useCallback(() => api.adminConnectGet(id), [id]);
  const { data, error: loadError, reload } = useLoad(fetchOne);
  const req = data?.request || null;
  const [actError, setActError] = useState('');
  const [note, setNote] = useState('');
  const [closing, setClosing] = useState(null); // 'won' | 'lost'
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const error = actError || loadError;

  const move = async (to) => {
    const isClose = to === 'won' || to === 'lost';
    if (isClose && !reason) {
      setActError('Hãy chọn lý do khi đóng yêu cầu.');
      return;
    }
    setBusy(true);
    setActError('');
    try {
      await api.adminConnectPatch(id, {
        to,
        ...(note.trim() ? { note: note.trim() } : {}),
        ...(isClose ? { close_reason: reason } : {}),
      });
      setNote('');
      setClosing(null);
      setReason('');
      reload();
      onChanged();
    } catch (err) {
      setActError(adminErrMsg(err));
    } finally {
      setBusy(false);
    }
  };

  if (!req) return error ? <ErrorNote error={error} onRetry={reload} /> : <Loading />;

  const { back, forward } = stepsFrom(req.status);
  const closedStatus = req.status === 'won' || req.status === 'lost';

  return (
    <div className="adm-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600 }}>{req.vendor?.name || req.vendor?.id}</div>
        <Badge tone={STATUS[req.status]?.tone}>{STATUS[req.status]?.label}</Badge>
      </div>
      {req.vendor_hidden && <div className="adm-error" style={{ marginTop: 8 }}>Vendor này đang bị ẩn khỏi cặp đôi.</div>}
      <dl className="adm-dl" style={{ marginTop: 12 }}>
        <dt>Cặp đôi</dt><dd>{req.couple?.name || req.couple?.id}</dd>
        <dt>Email</dt><dd>{req.couple?.email || '—'}</dd>
        <dt>Liên hệ đã gửi</dt>
        <dd>{req.contact ? fmtContact(req.contact) : req.contact_purged_at ? `Đã xoá sau 90 ngày (${fmtTime(req.contact_purged_at)})` : '—'}</dd>
        <dt>Ghi chú của họ</dt><dd>{req.note || '—'}</dd>
        <dt>Nguồn</dt><dd>{req.source === 'chat' ? 'Thẻ trong chat' : 'Vendor đã lưu'}</dd>
        <dt>Hạng mục</dt><dd>{req.vendor?.catLabel || req.vendor?.category || '—'}</dd>
        <dt>Liên hệ vendor</dt><dd>{fmtContact(req.vendor?.contact)}</dd>
        <dt>Nguồn vendor</dt><dd>{req.vendor?.source_link ? <a href={req.vendor.source_link} target="_blank" rel="noreferrer">Mở link</a> : '—'}</dd>
        <dt>Gửi lúc</dt><dd>{fmtTime(req.created_at)} · chờ {fmtWait(req.waiting_hours)}</dd>
        {closedStatus && (<><dt>Lý do đóng</dt><dd>{REASON_LABEL[req.close_reason] || req.close_reason || '—'}</dd></>)}
      </dl>
      {req.vendor?.photo && (
        <img src={req.vendor.photo} alt="" style={{ width: '100%', maxHeight: 140, objectFit: 'cover', borderRadius: 'var(--r-md)', marginBottom: 12 }} />
      )}
      <button type="button" className="adm-btn adm-btn-sm" onClick={() => onEditVendor(req.vendor?.id)}>Sửa vendor này</button>

      <hr style={{ border: 0, borderTop: '1px solid var(--line-100)', margin: '16px 0' }} />
      <Field label="Ghi chú cho lần đổi trạng thái">
        <textarea className="adm-textarea" value={note} maxLength={500} onChange={(e) => setNote(e.target.value)}
          placeholder="Ví dụ: đã gọi vendor, hẹn xem lịch thứ 6" />
      </Field>
      {closing ? (
        <div style={{ marginTop: 10 }}>
          <Field label={closing === 'won' ? 'Lý do chốt thành' : 'Lý do không thành'}>
            <select className="adm-select" value={reason} onChange={(e) => setReason(e.target.value)}>
              <option value="">— Chọn lý do —</option>
              {CLOSE_REASONS[closing].map(([k, label]) => <option key={k} value={k}>{label}</option>)}
            </select>
          </Field>
          <div className="adm-actions">
            <button type="button" className="adm-btn adm-btn-primary" disabled={busy} onClick={() => move(closing)}>
              {busy ? 'Đang lưu…' : `Đóng: ${STATUS[closing].label}`}
            </button>
            <button type="button" className="adm-btn" disabled={busy} onClick={() => { setClosing(null); setReason(''); setActError(''); }}>Quay lại</button>
          </div>
        </div>
      ) : (
        <div className="adm-actions">
          {back && (
            <button type="button" className="adm-btn" disabled={busy} onClick={() => move(back)}>
              ← Lùi về “{STATUS[back].label}”
            </button>
          )}
          {forward.map((to) => (
            to === 'won' || to === 'lost' ? (
              <button key={to} type="button" className={`adm-btn ${to === 'won' ? 'adm-btn-primary' : 'adm-btn-danger'}`} disabled={busy}
                onClick={() => { setClosing(to); setReason(''); setActError(''); }}>
                Đóng: {STATUS[to].label}
              </button>
            ) : (
              <button key={to} type="button" className="adm-btn adm-btn-primary" disabled={busy} onClick={() => move(to)}>
                Sang “{STATUS[to].label}” →
              </button>
            )
          ))}
        </div>
      )}
      <ErrorNote error={error} />

      <h3 style={{ fontSize: 14, margin: '18px 0 0' }}>Lịch sử</h3>
      <ul className="adm-history">
        {(req.history || []).length === 0 && <li className="adm-muted">Chưa có thay đổi nào.</li>}
        {(req.history || []).map((h, i) => (
          <li key={i}>
            <span className="adm-num">{fmtTime(h.at)}</span> · {STATUS[h.from]?.label || h.from} → <strong>{STATUS[h.to]?.label || h.to}</strong>
            {h.note ? <> · {h.note}</> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
