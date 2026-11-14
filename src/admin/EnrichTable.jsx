import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { VENDOR_CATEGORIES } from '../screens/VendorCtx.jsx';
import { Loading, ErrorNote, Badge, Field } from './common.jsx';
import { adminErrMsg } from './format.js';
import { useLoad } from './useLoad.js';
import { EnrichDrawer } from './EnrichDrawer.jsx';

// Bảng enrich vendor (T-124): một vendor một nhóm. Approve / Sửa thủ công chỉ ghi một "quyết định chờ áp dụng"
// (không đổi dữ liệu vendor, không gọi Google); áp vào manual_overrides.json là bước riêng do Capu xác nhận.

const PAGE = 50;
const GROUP = {
  full: ['Enrich 100%', 'ok'],
  matched_no_photo: ['Khớp, chưa có ảnh Google', 'info'],
  addr_diff_accepted: ['Địa chỉ khác marry', 'progress'],
  unverified: ['Có ảnh Google, chưa kiểm khớp', 'neutral'],
  name_same_addr_diff: ['Tên trùng, địa chỉ lệch', 'new'],
  name_similar: ['Tên hơi giống', 'new'],
  not_found: ['Không thấy trên Maps', 'bad'],
  temp_closed: ['Tạm đóng cửa', 'bad'],
  not_enriched: ['Chưa enrich', 'neutral'],
};
const REJECT = {
  low_score: 'tên chưa đủ giống',
  address_conflict: 'địa chỉ Google khác địa chỉ marry',
  address_unconfirmed: 'không so được địa chỉ',
  out_of_province: 'nơi này ngoài TP.HCM',
};
const CHIPS = [
  ['all', 'Tất cả', (s) => s.total],
  ['full', 'Enrich 100%', (s) => s.chips.full],
  ['no_google_photo', 'Chưa có ảnh Google', (s) => s.chips.no_google_photo],
  ['name_similar', 'Tên hơi giống', (s) => s.chips.name_similar],
  ['addr_diff', 'Địa chỉ khác marry', (s) => s.chips.addr_diff],
];
const DECISIONS = [
  ['accept_place', 'Gắn đúng nơi trên Google Maps'],
  ['remove', 'Không có trên Maps → gỡ vendor'],
  ['temporarily_closed', 'Tạm đóng cửa → ẩn, kiểm lại sau'],
  ['reject_match', 'Giữ nguyên, không dùng Google'],
];

const priceText = (m) => {
  if (m.price_min_vnd == null && m.price_max_vnd == null) return '';
  const tr = (v) => `${Math.round(v / 1e5) / 10}tr`;
  const a = m.price_min_vnd, b = m.price_max_vnd;
  return b != null && b !== a ? `${tr(a ?? b)}–${tr(b)}` : tr(a ?? b);
};

// data_as_of là chuỗi ISO không múi giờ; chỉ hiện ngày, không qua Date (tránh lệch múi giờ).
const dateText = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '—';
};

export function EnrichTable() {
  const [filter, setFilter] = useState('all');
  const [category, setCategory] = useState('');
  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');
  const [offset, setOffset] = useState(0);
  const [local, setLocal] = useState({}); // id → review|null vừa ghi (đè review của dữ liệu đã tải)
  const [edit, setEdit] = useState(null); // dòng đang mở hộp thoại Sửa thủ công
  const [busyId, setBusyId] = useState('');
  const [rowError, setRowError] = useState('');
  const [open, setOpen] = useState(null);

  const fetchList = useCallback(
    () => api.adminEnrichList({ filter, category, q, offset, limit: PAGE }),
    [filter, category, q, offset],
  );
  const { data, error, reload } = useLoad(fetchList);

  const reviewOf = (r) => (r.override ? null : r.id in local ? local[r.id] : r.review);

  const approve = async (r) => {
    setBusyId(r.id);
    setRowError('');
    try {
      const res = await api.adminEnrichReview(r.id, { decision: 'approve' });
      setLocal((l) => ({ ...l, [r.id]: res.review }));
    } catch (err) {
      setRowError(adminErrMsg(err));
    } finally {
      setBusyId('');
    }
  };
  const withdraw = async (r) => {
    setBusyId(r.id);
    setRowError('');
    try {
      await api.adminEnrichWithdraw(r.id);
      setLocal((l) => ({ ...l, [r.id]: null }));
    } catch (err) {
      setRowError(adminErrMsg(err));
    } finally {
      setBusyId('');
    }
  };

  const total = data?.total ?? 0;
  const goFilter = (f) => { setFilter(f); setOffset(0); };

  return (
    <section>
      <h2 className="adm-h2">Enrich Google Maps</h2>
      {data && (
        <p className="adm-muted adm-enrich-asof">
          {data.summary.total} vendor · enrich lần cuối {dateText(data.data_as_of)}
        </p>
      )}
      <div className="adm-enrich-chips">
        {CHIPS.map(([key, label, count]) => (
          <button key={key} type="button" className={`adm-chip ${filter === key ? 'is-active' : ''}`} aria-pressed={filter === key}
            disabled={!data} onClick={() => goFilter(key)}>
            {label}{data ? ` · ${count(data.summary)}` : ''}
          </button>
        ))}
      </div>
      <form className="adm-toolbar" onSubmit={(e) => { e.preventDefault(); setOffset(0); setQ(qInput.trim()); }}>
        <input className="adm-input" type="search" aria-label="Tìm vendor" placeholder="Tìm vendor" value={qInput} onChange={(e) => setQInput(e.target.value)} />
        <select className="adm-select" aria-label="Hạng mục" value={category} onChange={(e) => { setOffset(0); setCategory(e.target.value); }}>
          <option value="">Mọi hạng mục</option>
          {VENDOR_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </form>
      <ErrorNote error={error} onRetry={reload} />
      <ErrorNote error={rowError} />
      {data === null ? (error ? null : <Loading />) : (
        <>
          <div className="adm-card adm-enrich-wrap">
            <table className="adm-table adm-enrich" aria-label="Bảng enrich vendor">
              <thead>
                <tr>
                  <th>#</th><th>Vendor</th><th>Thông tin trên marry.vn</th><th>Sau enrich Google Maps</th><th>Status</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.length === 0 && <tr><td colSpan={6} className="adm-muted">Không có vendor nào khớp bộ lọc.</td></tr>}
                {data.rows.map((r) => <EnrichRow key={r.id} r={r} review={reviewOf(r)} busy={busyId === r.id}
                  onApprove={() => approve(r)} onWithdraw={() => withdraw(r)} onEdit={() => setEdit(r)}
                  selected={open?.id === r.id} onOpen={(el) => setOpen({ id: r.id, name: r.name, trigger: el })} />)}
              </tbody>
            </table>
          </div>
          <div className="adm-pager">
            <button type="button" className="adm-btn adm-btn-sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))}>Trang trước</button>
            <span className="adm-num">Hiển thị {total === 0 ? 0 : offset + 1}–{Math.min(offset + PAGE, total)} / {total}</span>
            <button type="button" className="adm-btn adm-btn-sm" disabled={offset + PAGE >= total} onClick={() => setOffset(offset + PAGE)}>Trang sau</button>
          </div>
        </>
      )}
      {open && <EnrichDrawer id={open.id} name={open.name} trigger={open.trigger} onClose={() => setOpen(null)} />}
      {edit && <ManualDialog r={edit} onClose={() => setEdit(null)} onSaved={(review) => { setLocal((l) => ({ ...l, [edit.id]: review })); setEdit(null); }} />}
    </section>
  );
}

function EnrichRow({ r, review, busy, onApprove, onWithdraw, onEdit, selected, onOpen }) {
  const [label, tone] = GROUP[r.group] || [r.group, 'neutral'];
  const g = r.google;
  const price = priceText(r.marry);
  const rowRef = useRef(null);
  const click = (e) => { if (e.target.closest('button, a, input, select, textarea')) return; onOpen(rowRef.current); };
  return (
    <tr ref={rowRef} className="is-clickable" tabIndex={0} aria-current={selected ? 'true' : undefined} onClick={click}
      onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onOpen(rowRef.current); } }}>
      <td className="adm-num">{r.n}</td>
      <td>
        <div className="adm-enrich-name">{r.name}</div>
        <div className="adm-muted adm-enrich-sub">{r.catLabel}</div>
      </td>
      <td>
        <div>Địa chỉ: {r.marry.address || '—'}</div>
        {price && <div className="adm-muted adm-enrich-sub">Giá: {price}</div>}
      </td>
      <td>
        {g ? (
          <>
            {!g.matched && <div className="adm-enrich-sub"><Badge tone="progress">Ứng viên chưa nhận</Badge></div>}
            <div>Tên: {g.name || '—'}{g.similarity != null && <span className="adm-muted"> · giống {Math.round(g.similarity * 100)}%</span>}</div>
            <div>Địa chỉ: {g.address || '—'}</div>
            <div className="adm-enrich-tags">
              {g.address_match === true && <Badge tone="ok">khớp marry</Badge>}
              {g.address_match === false && <Badge tone="bad">khác marry</Badge>}
              {g.rating != null && <span className="adm-muted adm-enrich-sub">★ {g.rating}{g.review_count ? ` (${g.review_count})` : ''}</span>}
              <a href={g.maps_url} target="_blank" rel="noopener noreferrer" className="adm-enrich-link">Mở Maps ↗</a>
            </div>
            {!g.matched && <div className="adm-enrich-sub">Chưa nhận: {REJECT[g.reject_reason] || 'chưa rõ lý do'}</div>}
          </>
        ) : <span className="adm-muted">Không tìm thấy trên Google Maps</span>}
      </td>
      <td>
        {r.override ? (
          <div className="adm-enrich-tags"><Badge tone={tone}>{label}</Badge><Badge tone="ok">Đã duyệt tay</Badge></div>
        ) : review ? <Badge tone="progress">{review.by_capu === true ? 'Chờ áp dụng' : 'Chờ Capu'}</Badge> : <Badge tone={tone}>{label}</Badge>}
      </td>
      <td>
        {r.override ? <span className="adm-muted">Đã duyệt tay</span> : (
          <div className="adm-enrich-actions">
            {review ? <button type="button" className="adm-btn adm-btn-sm" disabled={busy} onClick={onWithdraw}>Rút lại</button>
              : r.approvable ? <button type="button" className="adm-btn adm-btn-sm adm-btn-primary" disabled={busy} onClick={onApprove}>Approve</button>
                : r.group === 'full' ? <span className="adm-muted">Đã khớp</span> : null}
            <button type="button" className="adm-btn adm-btn-sm" onClick={onEdit}>Sửa thủ công</button>
          </div>
        )}
      </td>
    </tr>
  );
}

function ManualDialog({ r, onClose, onSaved }) {
  const [action, setAction] = useState('accept_place');
  const [target, setTarget] = useState('');
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const firstRef = useRef(null);
  useEffect(() => { firstRef.current?.focus(); }, []);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const save = async () => {
    const n = note.trim();
    const t = target.trim();
    if (action === 'accept_place' && !t) { setErr('Cần link Google Maps hoặc place_id'); return; }
    if (action !== 'accept_place' && !n) { setErr('Cần ghi chú'); return; }
    const body = { decision: 'manual', action };
    if (action === 'accept_place') body[/^http/i.test(t) ? 'maps_link' : 'place_id'] = t;
    if (n) body.note = n;
    setBusy(true);
    setErr('');
    try {
      const res = await api.adminEnrichReview(r.id, body);
      onSaved(res.review);
    } catch (e) {
      setErr(adminErrMsg(e));
      setBusy(false);
    }
  };

  return (
    <div className="adm-modal-back" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="adm-card adm-modal" role="dialog" aria-modal="true" aria-label={`Sửa thủ công · #${r.n} ${r.name}`}>
        <h3 className="adm-h2" style={{ fontSize: 17 }}>Sửa thủ công · #{r.n} {r.name}</h3>
        <fieldset className="adm-enrich-radios">
          <legend className="adm-field-label">Quyết định</legend>
          {DECISIONS.map(([k, text], i) => (
            <label key={k} className="adm-check">
              <input ref={i === 0 ? firstRef : null} type="radio" name="enrich-decision" value={k} checked={action === k} onChange={() => { setAction(k); setErr(''); }} />
              {text}
            </label>
          ))}
        </fieldset>
        {action === 'accept_place' && (
          <Field label="Link Google Maps hoặc place_id">
            <input className="adm-input" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="https://share.google/… hoặc ChIJ…" />
          </Field>
        )}
        <Field label="Ghi chú">
          <textarea className="adm-textarea" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} />
        </Field>
        {err && <div className="adm-error" role="alert">{err}</div>}
        <div className="adm-actions">
          <button type="button" className="adm-btn adm-btn-primary" disabled={busy} onClick={save}>{busy ? 'Đang lưu…' : 'Lưu'}</button>
          <button type="button" className="adm-btn" onClick={onClose}>Huỷ</button>
        </div>
      </div>
    </div>
  );
}
