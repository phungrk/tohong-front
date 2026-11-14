import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { adminErrMsg } from './format.js';
import { absentNoteFields, notesFor } from './enrichNotes.js';

const LS = 'enrich-drawer-width';
const STEP = 24;
const bounds = () => { const vw = window.innerWidth; const min = Math.min(560, vw); return { min, max: Math.max(min, Math.round(vw * 0.9)), narrow: vw <= 480 }; };
const clamp = (w) => { const b = bounds(); return Math.max(b.min, Math.min(b.max, w)); };
const getPath = (rec, key) => {
  if (!rec) return undefined;
  const [, k, sep, sub] = /^([^.[]+)(\[\]\.|\.)?(.*)$/.exec(key);
  if (!(k in rec)) return undefined;
  if (!sep) return rec[k];
  if (sep === '.') return rec[k] && typeof rec[k] === 'object' ? rec[k][sub] : undefined;
  return Array.isArray(rec[k]) ? rec[k].map((e) => e && e[sub]).filter((x) => x !== undefined) : undefined;
};
const show = (v) => (v === null ? 'null' : typeof v === 'object' ? JSON.stringify(v) : String(v));
function Val({ v, trunc }) {
  if (v === undefined || (Array.isArray(v) && v.length === 0)) return <span>—</span>;
  const note = trunc ? <span className="adm-muted"> (rút gọn, gốc {trunc} ký tự)</span> : null;
  if (Array.isArray(v)) return <span>{v.map((x, i) => <div key={i}>{show(x)}</div>)}{note}</span>;
  return <span>{show(v)}{note}</span>;
}
const Line = ({ label, children }) => <div className="adm-drawer-line"><span className="adm-drawer-k">{label}</span> {children}</div>;


const EFF_KEYS = ['name', 'description', 'styles', 'tags', 'photos', 'capacity', 'priceMin', 'priceMax'];
const pickEff = (eff) => (eff ? Object.fromEntries(EFF_KEYS.filter((k) => k in eff).map((k) => [k, eff[k]])) : {});
const fmtItem = (x) => (x && typeof x === 'object' ? (x.url ? x.url : 'min' in x ? `${x.min}–${x.max}` : JSON.stringify(x)) : String(x));
const fmtVal = (v) => (v === null || v === undefined || (Array.isArray(v) && !v.length) ? '—' : Array.isArray(v) ? v.map(fmtItem).join(', ') : fmtItem(v));

function PhotoList({ photos }) {
  const [broken, setBroken] = useState({});
  const list = Array.isArray(photos) ? photos : [];
  return (
    <div className="adm-drawer-line">
      <span className="adm-drawer-k">photos</span>
      {!list.length && <span>Chưa có ảnh</span>}
      <div className="adm-drawer-photos">
        {list.map((p, i) => (
          <div key={`${i}-${p.url}`} className="adm-drawer-photo">
            {broken[p.url] && <span className="adm-muted">Ảnh không tải được</span>}
            <img src={p.url} alt={`Ảnh vendor ${i + 1}`} loading="lazy" referrerPolicy="no-referrer" className="adm-drawer-thumb"
              style={broken[p.url] ? { display: 'none' } : undefined} onError={() => setBroken((b) => ({ ...b, [p.url]: true }))} />
            <div><a href={p.url} target="_blank" rel="noopener noreferrer">Mở ảnh gốc</a></div>
            {p.attribution && <div className="adm-muted">{`Ảnh: ${p.attribution}`}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

const formFrom = (e) => ({
  name: e?.name ?? '', description: e?.description ?? '', styles: [...(e?.styles || [])],
  photos: (e?.photos || []).map((p) => p.url).join('\n'),
  capMin: e?.capacity ? String(e.capacity.min) : '', capMax: e?.capacity ? String(e.capacity.max) : '',
});
// Chỉ gửi các trường đã đổi so với giá trị hiệu lực; ảnh Google gửi lại nguyên url/source/attribution.
function diffForm(f, e, editable) {
  const out = {};
  if (f.name !== (e?.name ?? '')) out.name = f.name;
  if (f.description !== (e?.description ?? '')) out.description = f.description;
  const cur = e?.styles || [];
  if (f.styles.length !== cur.length || f.styles.some((x) => !cur.includes(x))) out.styles = (editable?.styles || f.styles).filter((x) => f.styles.includes(x));
  const urls = f.photos.split('\n').map((x) => x.trim()).filter(Boolean);
  const curPh = e?.photos || [];
  if (urls.join('\n') !== curPh.map((p) => p.url).join('\n')) {
    out.photos = urls.map((u) => { const g = curPh.find((p) => p.url === u && p.attribution); return g ? { url: g.url, source: g.source, attribution: g.attribution } : { url: u }; });
  }
  const c = e?.capacity;
  if (f.capMin !== (c ? String(c.min) : '') || f.capMax !== (c ? String(c.max) : '')) out.capacity = { min: Number(f.capMin), max: Number(f.capMax) };
  return out;
}

function PoolForm({ form, setForm, editable, venue, busy, onSave, onCancel }) {
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggle = (s) => setForm((f) => ({ ...f, styles: f.styles.includes(s) ? f.styles.filter((x) => x !== s) : [...f.styles, s] }));
  return (
    <form className="adm-drawer-form" onSubmit={(e) => { e.preventDefault(); onSave(); }}>
      <label className="adm-drawer-flabel">Tên<input className="adm-input" aria-label="Tên" value={form.name} onChange={(e) => set('name', e.target.value)} /></label>
      <label className="adm-drawer-flabel">Mô tả<textarea className="adm-input" aria-label="Mô tả" rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} /></label>
      <fieldset className="adm-enrich-radios"><legend>Gu</legend>
        {(editable?.styles || []).map((s) => (
          <label key={s}><input type="checkbox" checked={form.styles.includes(s)} onChange={() => toggle(s)} /> {s}</label>
        ))}
      </fieldset>
      <label className="adm-drawer-flabel">Ảnh (mỗi dòng một URL)<textarea className="adm-input" aria-label="Ảnh (mỗi dòng một URL)" rows={4} value={form.photos} onChange={(e) => set('photos', e.target.value)} /></label>
      {venue && (
        <>
          <label className="adm-drawer-flabel">Sức chứa tối thiểu<input className="adm-input" type="number" aria-label="Sức chứa tối thiểu" value={form.capMin} onChange={(e) => set('capMin', e.target.value)} /></label>
          <label className="adm-drawer-flabel">Sức chứa tối đa<input className="adm-input" type="number" aria-label="Sức chứa tối đa" value={form.capMax} onChange={(e) => set('capMax', e.target.value)} /></label>
        </>
      )}
      <div>
        <button type="submit" className="adm-btn adm-btn-sm" disabled={busy}>Lưu</button>{' '}
        <button type="button" className="adm-btn adm-btn-sm" onClick={onCancel}>Hủy</button>
      </div>
    </form>
  );
}

export function EnrichDrawer({ id, name, trigger, onClose }) {
  const [state, setState] = useState({ id: null, data: null, err: '', info: null, infoErr: false });
  const [formS, setForm] = useState(null); // { id, ...ô nhập }: gắn với vendor đang mở
  const [errS, setErrS] = useState(null);
  const [busy, setBusy] = useState(false);
  const form = formS && formS.id === id ? formS : null;
  const saveErr = errS && errS.id === id ? errS.msg : '';
  const setSaveErr = (msg) => setErrS({ id, msg });
  const [w, setW] = useState(() => { let v = null; try { v = Number(localStorage.getItem(LS)); } catch { /* */ } return v || null; });
  const [, setVw] = useState(() => window.innerWidth); // đổi khung nhìn thì tính lại bố cục như mở ở khung đó
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const b = bounds();
  const cur = b.narrow ? window.innerWidth : clamp(w ?? b.min);
  // Drawer luôn PHỦ (T-152): không chừa lề cho trang, không đổi bố cục bảng.
  useEffect(() => {
    let live = true;
    const detail = api.adminEnrichDetail(id).then((data) => ({ data, err: '' }))
      .catch((e) => ({ data: null, err: e?.status === 403 ? 'Chỉ admin xem được chi tiết này' : e?.status === 404 ? 'Không có chi tiết cho vendor này' : adminErrMsg(e) }));
    const layer = api.adminVendorGet(id).then((info) => ({ info, infoErr: false })).catch(() => ({ info: null, infoErr: true }));
    Promise.all([detail, layer]).then(([a, c]) => live && setState({ id, ...a, ...c }));
    return () => { live = false; };
  }, [id]);
  const reloadInfo = () => api.adminVendorGet(id)
    .then((info) => setState((st) => (st.id === id ? { ...st, info, infoErr: false } : st)))
    .catch(() => setState((st) => (st.id === id ? { ...st, info: null, infoErr: true } : st)));
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !document.querySelector('[role=dialog][aria-label^="Sửa thủ công"]')) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  // Đóng xong tiêu điểm về dòng đã mở (dòng của lần mở gần nhất); đổi sang vendor khác không cướp tiêu điểm.
  const trig = useRef(trigger);
  useEffect(() => { trig.current = trigger; }, [trigger]);
  useEffect(() => () => { setTimeout(() => trig.current?.isConnected && trig.current.focus(), 0); }, []);
  const setWidth = (x) => { const v = Math.round(clamp(x)); setW(v); try { localStorage.setItem(LS, String(v)); } catch { /* */ } };
  const startDrag = (e) => {
    e.preventDefault();
    const x0 = e.clientX; const w0 = cur;
    const mv = (ev) => setWidth(w0 + (x0 - ev.clientX));
    const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  };
  const onSepKey = (e) => {
    const k = { ArrowLeft: () => setWidth(cur + STEP), ArrowRight: () => setWidth(cur - STEP), Home: () => setWidth(b.min), End: () => setWidth(b.max) }[e.key];
    if (k) { e.preventDefault(); k(); }
  };
  const loading = state.id !== id || (!state.data && !state.err);
  const d = state.data;
  const info = state.info;
  const eff = info?.effective || null;
  const edited = info?.edited_fields || [];
  const vendor = d?.pool?.vendor ? { ...d.pool.vendor, ...pickEff(eff) } : d?.pool?.vendor;
  const put = async (body) => {
    setBusy(true); setSaveErr('');
    try { await api.adminVendorPut(id, { expected_version: info?.version || 0, ...body }); await reloadInfo(); return true; } catch (e) {
      if (e?.status === 409 || e?.code === 'version_conflict') { setSaveErr('Dữ liệu đã đổi, hãy tải lại'); reloadInfo(); } else setSaveErr(`Không lưu được: ${e?.code || adminErrMsg(e)}`);
      return false;
    } finally { setBusy(false); }
  };
  const clearField = (f) => put({ [f]: null });
  const openForm = () => { setSaveErr(''); setForm({ id, ...formFrom(eff || d.pool.vendor) }); };
  const save = async () => {
    const body = diffForm(form, eff || d.pool.vendor, info.editable);
    if (!Object.keys(body).length) { setForm(null); return; }
    if (await put(body)) setForm(null);
  };
  return (
    <aside className="adm-drawer" role="dialog" aria-modal="false" aria-label={`Chi tiết vendor · ${name}`} style={b.narrow ? { width: '100%' } : { width: cur }}>
      {!b.narrow && b.max > b.min && <div className="adm-drawer-sep" role="separator" aria-orientation="vertical" aria-label="Kéo để đổi bề rộng ngăn kéo" tabIndex={0}
        aria-valuemin={b.min} aria-valuemax={b.max} aria-valuenow={cur} onPointerDown={startDrag} onKeyDown={onSepKey} />}
      <button type="button" className="adm-btn adm-drawer-close" onClick={onClose}>Đóng</button>
      <h3 className="adm-h2" style={{ fontSize: 17 }}>{name}</h3>
      {loading && <div className="adm-muted">Đang tải…</div>}
      {!loading && state.err && <div className="adm-error" role="alert">{state.err}</div>}
      {!loading && d && (
        <>
          <h4>Kết quả trong pool</h4>
          <div>{!d.pool.in_pool ? 'Ngoài pool' : d.pool.visible ? 'Trong pool' : 'Trong pool · đang ẩn'}</div>
          {d.pool.reasons.map((r) => <div key={r.code} className="adm-muted">{r.text}</div>)}
          {state.infoErr && <div className="adm-muted" role="status">Không tải được lớp sửa</div>}
          {info && (info.source_changed || []).map((c) => (
            <div key={`sc-${c.field}`} className="adm-drawer-warn" role="status">
              {c.field === 'photos' && c.dropped
                ? 'Ảnh Google đã đổi — xem lại bản sửa ảnh'
                : `Pool nguồn đã đổi sau lần sửa: ${c.field} — lúc sửa: ${fmtVal(c.base)}, hiện: ${fmtVal(c.now)}`}
            </div>
          ))}
          {vendor && Object.entries(vendor).map(([k, v]) => (
            <div key={k}>
              {k === 'photos' ? <PhotoList photos={v} /> : <Line label={k}><Val v={v} /></Line>}
              {edited.includes(k) && (
                <div className="adm-drawer-note">
                  <span className="adm-badge">admin sửa</span>{' '}
                  <button type="button" className="adm-btn adm-btn-sm" disabled={busy} onClick={() => clearField(k)}>{`Bỏ sửa ${k}`}</button>
                </div>
              )}
              {notesFor(d.pool.field_notes, k).map((n) => <div key={n.code} className="adm-muted adm-drawer-note">{n.text}</div>)}
            </div>
          ))}
          {absentNoteFields(d.pool.vendor, d.pool.field_notes).map((k) => (
            <div key={`absent-${k}`}>
              <Line label={k}><Val v={undefined} /></Line>
              {notesFor(d.pool.field_notes, k).map((n) => <div key={n.code} className="adm-muted adm-drawer-note">{n.text}</div>)}
            </div>
          ))}
          {saveErr && <div className="adm-error" role="alert">{saveErr}</div>}
          {info && !form && <button type="button" className="adm-btn adm-btn-sm" onClick={openForm}>Sửa dữ liệu pool</button>}
          {info && form && (
            <PoolForm form={form} setForm={(fn) => setForm((f) => ({ id, ...fn(f) }))} editable={info.editable} venue={d.pool.vendor?.category === 'venue'}
              busy={busy} onSave={save} onCancel={() => { setForm(null); setSaveErr(''); }} />
          )}
          <h4>Lớp admin (R2)</h4>
          {!d.overlay ? <div>Không có ghi đè</div> : (
            <>
              {'hidden' in d.overlay && <Line label="Ẩn:">{d.overlay.hidden ? 'có' : 'không'}</Line>}
              {d.overlay.hidden_reason && <Line label="Lý do ẩn:">{d.overlay.hidden_reason}</Line>}
              {'priceMin' in d.overlay && <Line label="Giá tối thiểu ghi đè:">{d.overlay.priceMin}</Line>}
              {'priceMax' in d.overlay && <Line label="Giá tối đa ghi đè:">{d.overlay.priceMax}</Line>}
              {'price_verified' in d.overlay && <Line label="Giá đã xác minh:">{d.overlay.price_verified ? 'có' : 'không'}</Line>}
            </>
          )}
          <h4>Lịch sử sửa</h4>
          {!info || !(info.history || []).length ? <div className="adm-muted">Chưa có sửa</div> : (
            <ul className="adm-history">
              {info.history.flatMap((h) => {
                const rows = Object.entries(h.changes || {});
                if (!rows.length) return [<li key={h.seq}>{`${h.by} · ${h.at} · ${h.action === 'clear' ? 'bỏ ghi đè' : 'sửa'}`}</li>];
                return rows.map(([f, c]) => (
                  <li key={`${h.seq}-${f}`}>{`${h.by} · ${h.at} · ${f}: ${c && c.changed ? 'đã đổi' : `${fmtVal(c?.before)} → ${fmtVal(c?.after)}`}`}</li>
                ));
              })}
            </ul>
          )}
          <h4>Thuộc tính nguồn dùng để tạo vendor pool</h4>
          {d.source.available === false && <p className="adm-muted">Báo cáo chưa có dữ liệu nguồn của vendor này</p>}
          {d.source.available !== false && d.catalog.map((f) => (
            <Line key={f.file + f.key} label={f.label}>
              <Val v={getPath(f.file === 'vendors.json' ? d.source.record : d.source.audit, f.key)} trunc={d.source.truncated[f.key]} />
            </Line>
          ))}
          <h4>Đầu vào ngoài vendors.json</h4>
          {(d.extra_inputs || []).map((x) => <Line key={x.id} label={x.label}><span>{x.note}</span></Line>)}
        </>
      )}
    </aside>
  );
}
