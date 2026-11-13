import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { adminErrMsg } from './format.js';
import { absentNoteFields, notesFor } from './enrichNotes.js';

const LS = 'enrich-drawer-width';
const STEP = 24;
const REST = 640; // phần còn lại tối thiểu cho trang để đẩy; hẹp hơn thì phủ
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

export function EnrichDrawer({ id, name, trigger, onClose, onPad }) {
  const [state, setState] = useState({ id: null, data: null, err: '' });
  const [w, setW] = useState(() => { let v = null; try { v = Number(localStorage.getItem(LS)); } catch { /* */ } return v || null; });
  const [, setVw] = useState(() => window.innerWidth); // đổi khung nhìn thì tính lại bố cục như mở ở khung đó
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const b = bounds();
  const cur = b.narrow ? window.innerWidth : clamp(w ?? b.min);
  const push = !b.narrow && window.innerWidth - cur >= REST;
  useEffect(() => { onPad(push ? cur : 0); return () => onPad(0); }, [cur, push, onPad]);
  useEffect(() => {
    let live = true;
    api.adminEnrichDetail(id).then((data) => live && setState({ id, data, err: '' }))
      .catch((e) => live && setState({ id, data: null, err: e?.status === 403 ? 'Chỉ admin xem được chi tiết này' : e?.status === 404 ? 'Không có chi tiết cho vendor này' : adminErrMsg(e) }));
    return () => { live = false; };
  }, [id]);
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
          <h4>Thuộc tính nguồn dùng để tạo vendor pool</h4>
          {d.source.available === false && <p className="adm-muted">Báo cáo chưa có dữ liệu nguồn của vendor này</p>}
          {d.source.available !== false && d.catalog.map((f) => (
            <Line key={f.file + f.key} label={f.label}>
              <Val v={getPath(f.file === 'vendors.json' ? d.source.record : d.source.audit, f.key)} trunc={d.source.truncated[f.key]} />
            </Line>
          ))}
          <h4>Đầu vào ngoài vendors.json</h4>
          {(d.extra_inputs || []).map((x) => <Line key={x.id} label={x.label}><span>{x.note}</span></Line>)}
          <h4>Kết quả trong pool</h4>
          <div>{!d.pool.in_pool ? 'Ngoài pool' : d.pool.visible ? 'Trong pool' : 'Trong pool · đang ẩn'}</div>
          {d.pool.reasons.map((r) => <div key={r.code} className="adm-muted">{r.text}</div>)}
          {d.pool.vendor && Object.entries(d.pool.vendor).map(([k, v]) => (
            <div key={k}>
              <Line label={k}><Val v={v} /></Line>
              {notesFor(d.pool.field_notes, k).map((n) => <div key={n.code} className="adm-muted adm-drawer-note">{n.text}</div>)}
            </div>
          ))}
          {absentNoteFields(d.pool.vendor, d.pool.field_notes).map((k) => (
            <div key={`absent-${k}`}>
              <Line label={k}><Val v={undefined} /></Line>
              {notesFor(d.pool.field_notes, k).map((n) => <div key={n.code} className="adm-muted adm-drawer-note">{n.text}</div>)}
            </div>
          ))}
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
        </>
      )}
    </aside>
  );
}
