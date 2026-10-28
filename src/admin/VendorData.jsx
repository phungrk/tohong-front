import { useCallback, useState } from 'react';
import { api } from '../api.js';
import { VENDOR_CATEGORIES } from '../screens/VendorCtx.jsx';
import { Loading, ErrorNote, Badge, Field } from './common.jsx';
import { adminErrMsg } from './format.js';
import { useLoad } from './useLoad.js';

const LABELS = [
  ['', 'Mọi nhãn'],
  ['estimated', 'Giá ước tính'],
  ['verified', 'Giá đã xác minh'],
  ['missing_contact', 'Thiếu liên hệ'],
  ['has_contact', 'Có liên hệ'],
  ['hidden', 'Đang ẩn'],
  ['overridden', 'Đã ghi đè'],
  ['orphan', 'Mồ côi (không còn trong pool)'],
];
const PAGE = 50;

const priceText = (min, max) => {
  if (min == null && max == null) return '—';
  return max != null && max !== min ? `${min}–${max}tr` : `${min}tr`;
};

export function VendorData({ focusId }) {
  const [category, setCategory] = useState('');
  const [label, setLabel] = useState('');
  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');
  const [offset, setOffset] = useState(0);
  const [selId, setSelId] = useState(focusId || null);

  const fetchList = useCallback(
    () => api.adminVendors({ category, label, q, offset, limit: PAGE }),
    [category, label, q, offset],
  );
  const { data, error, reload: load } = useLoad(fetchList);

  const reset = (fn) => (e) => { setOffset(0); fn(e.target.value); };
  const total = data?.total ?? 0;

  return (
    <section>
      <h2 className="adm-h2">Dữ liệu vendor</h2>
      <form className="adm-toolbar" onSubmit={(e) => { e.preventDefault(); setOffset(0); setQ(qInput.trim()); }}>
        <select className="adm-select" aria-label="Hạng mục" value={category} onChange={reset(setCategory)}>
          <option value="">Mọi hạng mục</option>
          {VENDOR_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="adm-select" aria-label="Nhãn" value={label} onChange={reset(setLabel)}>
          {LABELS.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
        </select>
        <input className="adm-input" aria-label="Tìm theo tên" placeholder="Tìm theo tên vendor" value={qInput} onChange={(e) => setQInput(e.target.value)} />
        <button type="submit" className="adm-btn">Tìm</button>
        <span className="adm-muted" style={{ fontSize: 13 }} aria-live="polite">{data ? `${total} vendor` : ''}</span>
      </form>
      <ErrorNote error={error} onRetry={load} />
      <div className="adm-split">
        <div>
          {data === null ? (error ? null : <Loading />) : data.vendors.length === 0 ? (
            <div className="adm-note">Không có vendor nào khớp bộ lọc.</div>
          ) : (
            <>
              <div className="adm-card" style={{ padding: 0, overflowX: 'auto' }}>
                <table className="adm-table">
                  <thead><tr><th>Vendor</th><th>Giá hiệu lực</th><th>Nhãn</th></tr></thead>
                  <tbody>
                    {data.vendors.map((v) => (
                      <tr key={v.id} className={`is-clickable ${selId === v.id ? 'is-selected' : ''}`}
                        onClick={() => setSelId(v.id)} tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') setSelId(v.id); }}>
                        <td>
                          <div>{v.name || <span className="adm-muted">(không còn trong pool)</span>}</div>
                          <div className="adm-muted" style={{ fontSize: 12 }}>{v.catLabel || v.category || ''} · {v.id}</div>
                        </td>
                        <td className="adm-num">{priceText(v.priceMin, v.priceMax)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            <Badge tone={v.price_source === 'verified' ? 'ok' : 'neutral'}>{v.price_source === 'verified' ? 'Giá đã xác minh' : 'Giá ước tính'}</Badge>
                            {v.has_contact ? <Badge tone="info">Có liên hệ</Badge> : <Badge tone="neutral">Thiếu liên hệ</Badge>}
                            {v.hidden && <Badge tone="bad">Đang ẩn</Badge>}
                            {v.orphan && <Badge tone="progress">Mồ côi</Badge>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="adm-pager">
                <button type="button" className="adm-btn adm-btn-sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))}>← Trước</button>
                <span className="adm-num">{total === 0 ? 0 : offset + 1}–{Math.min(offset + PAGE, total)} / {total}</span>
                <button type="button" className="adm-btn adm-btn-sm" disabled={offset + PAGE >= total} onClick={() => setOffset(offset + PAGE)}>Sau →</button>
              </div>
            </>
          )}
        </div>
        <div>
          {selId ? <VendorEditor key={selId} id={selId} onSaved={load} /> : <div className="adm-note">Chọn một vendor để sửa.</div>}
        </div>
      </div>
    </section>
  );
}

const numStr = (n) => (n == null ? '' : String(n));
const toNum = (s) => (s.trim() === '' ? null : Number(s));

function VendorEditor({ id, onSaved }) {
  const fetchOne = useCallback(() => api.adminVendorGet(id), [id]);
  const { data: detail, error, reload, loadedAt } = useLoad(fetchOne);
  const [saved, setSaved] = useState(''); // ở đây để còn sau khi form khởi tạo lại
  if (!detail) return error ? <ErrorNote error={error} onRetry={reload} /> : <Loading />;
  // key = loadedAt: tải lại (sau lưu hoặc khi xung đột phiên bản) khởi tạo lại form từ dữ liệu mới.
  return <VendorForm key={loadedAt} id={id} detail={detail} reload={reload} onSaved={onSaved} saved={saved} setSaved={setSaved} />;
}

function VendorForm({ id, detail, reload, onSaved, saved, setSaved }) {
  const o = detail.override || {};
  const [form, setForm] = useState({
    priceMin: numStr(o.priceMin),
    priceMax: numStr(o.priceMax),
    price_verified: o.price_verified === true,
    phone: o.contact?.phone || '',
    zalo: o.contact?.zalo || '',
    website: o.contact?.website || '',
    hidden: o.hidden === true,
    hidden_reason: o.hidden_reason || '',
  });
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(false);
  const [fieldErr, setFieldErr] = useState({});
  const [busy, setBusy] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const set = (k) => (e) => {
    setSaved('');
    setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  };

  const validate = () => {
    const errs = {};
    const min = toNum(form.priceMin);
    const max = toNum(form.priceMax);
    if (min != null && (!Number.isFinite(min) || min < 0)) errs.priceMin = 'Giá thấp nhất phải là số không âm.';
    if (max != null && (!Number.isFinite(max) || max < 0)) errs.priceMax = 'Giá cao nhất phải là số không âm.';
    if (!errs.priceMin && !errs.priceMax && min != null && max != null && min > max) {
      errs.priceMin = 'Giá thấp nhất không được lớn hơn giá cao nhất.';
    }
    if (form.hidden && !form.hidden_reason.trim()) errs.hidden_reason = 'Hãy nhập lý do khi ẩn vendor.';
    return errs;
  };

  const save = async () => {
    const errs = validate();
    setFieldErr(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    setError('');
    setSaved('');
    const contact = {};
    if (form.phone.trim()) contact.phone = form.phone.trim();
    if (form.zalo.trim()) contact.zalo = form.zalo.trim();
    if (form.website.trim()) contact.website = form.website.trim();
    try {
      await api.adminVendorPut(id, {
        expected_version: detail.version || 0,
        priceMin: toNum(form.priceMin),
        priceMax: toNum(form.priceMax),
        price_verified: form.price_verified,
        contact: Object.keys(contact).length ? contact : null,
        hidden: form.hidden,
        hidden_reason: form.hidden ? form.hidden_reason.trim() : '',
      });
      setSaved('Đã lưu. Phía cặp đôi thấy thay đổi trong tối đa 5 phút.');
      onSaved();
      reload();
    } catch (err) {
      if (err.code === 'version_conflict') setConflict(true);
      else if (err.code === 'invalid_price') setFieldErr({ priceMin: adminErrMsg(err) });
      else if (err.code === 'hidden_reason_required') setFieldErr({ hidden_reason: adminErrMsg(err) });
      else setError(adminErrMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const clear = async () => {
    setBusy(true);
    setError('');
    try {
      await api.adminVendorClear(id, detail.version || 0);
      setSaved('Đã bỏ ghi đè, vendor về dữ liệu gốc.');
      setConfirmClear(false);
      onSaved();
      reload();
    } catch (err) {
      if (err.code === 'version_conflict') setConflict(true);
      else setError(adminErrMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const base = detail.vendor;
  const hasOverride = !!detail.override;

  return (
    <div className="adm-card">
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600 }}>{base?.name || '(không còn trong pool)'}</div>
      <div className="adm-muted" style={{ fontSize: 12, marginBottom: 10 }}>
        {base?.catLabel || base?.category || ''} · {id} · phiên bản ghi đè {detail.version || 0}
      </div>
      {detail.orphan && <div className="adm-error">Ghi đè này trỏ tới vendor không còn trong pool; phía cặp đôi bị bỏ qua.</div>}
      {conflict && (
        <div className="adm-error" role="alert">
          {adminErrMsg({ code: 'version_conflict' })}
          <button type="button" className="adm-btn adm-btn-sm" style={{ marginLeft: 10 }} onClick={reload}>Tải lại</button>
        </div>
      )}
      {base && <div className="adm-muted" style={{ fontSize: 13, marginBottom: 10 }}>Giá gốc: {priceText(base.priceMin, base.priceMax)}</div>}

      <div className="adm-grid2">
        <Field label="Giá thấp nhất (triệu)" hint={fieldErr.priceMin}>
          <input className={`adm-input ${fieldErr.priceMin ? 'is-invalid' : ''}`} inputMode="decimal" value={form.priceMin} onChange={set('priceMin')} aria-invalid={!!fieldErr.priceMin} />
        </Field>
        <Field label="Giá cao nhất (triệu)" hint={fieldErr.priceMax}>
          <input className={`adm-input ${fieldErr.priceMax ? 'is-invalid' : ''}`} inputMode="decimal" value={form.priceMax} onChange={set('priceMax')} aria-invalid={!!fieldErr.priceMax} />
        </Field>
      </div>
      {(fieldErr.priceMin || fieldErr.priceMax) && (
        <div className="adm-hint is-error" role="alert">{fieldErr.priceMin || fieldErr.priceMax}</div>
      )}
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '12px 0', fontSize: 14 }}>
        <input type="checkbox" checked={form.price_verified} onChange={set('price_verified')} />
        Giá đã xác minh với vendor
      </label>

      <div className="adm-field-label" style={{ marginBottom: 6 }}>Liên hệ vendor (chỉ admin thấy)</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input className="adm-input" placeholder="Số điện thoại" aria-label="Số điện thoại" value={form.phone} onChange={set('phone')} />
        <input className="adm-input" placeholder="Zalo" aria-label="Zalo" value={form.zalo} onChange={set('zalo')} />
        <input className="adm-input" placeholder="Fanpage / website" aria-label="Fanpage hoặc website" value={form.website} onChange={set('website')} />
      </div>

      <label style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '14px 0 6px', fontSize: 14 }}>
        <input type="checkbox" checked={form.hidden} onChange={set('hidden')} />
        Ẩn vendor này khỏi cặp đôi và gợi ý AI
      </label>
      {form.hidden && (
        <Field label="Lý do ẩn" hint={fieldErr.hidden_reason}>
          <input className={`adm-input ${fieldErr.hidden_reason ? 'is-invalid' : ''}`} value={form.hidden_reason} onChange={set('hidden_reason')} maxLength={300} />
        </Field>
      )}

      <div className="adm-actions">
        <button type="button" className="adm-btn adm-btn-primary" disabled={busy} onClick={save}>{busy ? 'Đang lưu…' : 'Lưu ghi đè'}</button>
        {hasOverride && (confirmClear ? (
          <>
            <button type="button" className="adm-btn adm-btn-danger" disabled={busy} onClick={clear}>Xác nhận bỏ ghi đè</button>
            <button type="button" className="adm-btn" onClick={() => setConfirmClear(false)}>Thôi</button>
          </>
        ) : (
          <button type="button" className="adm-btn adm-btn-danger" disabled={busy} onClick={() => setConfirmClear(true)}>Bỏ ghi đè</button>
        ))}
      </div>
      {saved && <div className="adm-ok" role="status">{saved}</div>}
      <ErrorNote error={error} />
    </div>
  );
}
