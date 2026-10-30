import { useCallback, useRef } from 'react';
import { api } from '../api.js';
import { Loading, ErrorNote } from './common.jsx';
import { useLoad } from './useLoad.js';

const REASON = {
  not_configured: 'Chưa cấu hình dịch vụ đăng nhập.',
  error: 'Dịch vụ đăng nhập đang không trả lời.',
};

function hhmm(iso) {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString('vi-VN', { hour12: false, hour: '2-digit', minute: '2-digit' });
}

function Stat({ label, value, sub }) {
  return (
    <div>
      <div style={{ fontSize: 13, color: 'var(--ink-500)' }}>{label}</div>
      <div className="adm-num" style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 600, lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ fontSize: 13, color: 'var(--ink-500)' }}>{sub}</div>}
    </div>
  );
}

const num = (n) => (typeof n === 'number' ? n.toLocaleString('vi-VN') : '—');

// Số thành viên (spec 004): chỉ số tổng hợp, không hiện id, email hay tên.
export function Members() {
  const refreshRef = useRef(false);
  const fetchSummary = useCallback(() => {
    const refresh = refreshRef.current;
    refreshRef.current = false;
    return api.adminMembersSummary({ refresh });
  }, []);
  const { data, error, status, reload } = useLoad(fetchSummary);
  const refresh = () => { refreshRef.current = true; reload(); };
  const errMsg = status === 404 ? 'Chưa lấy được số thành viên (máy chủ chưa hỗ trợ mục này).' : error;

  const a = data?.accounts;
  const c = data?.couples;
  const ok = a?.status === 'ok';
  const owner = c?.by_owner || {};
  const at = hhmm(data?.computed_at);

  return (
    <section>
      <h2 className="adm-h2">Thành viên</h2>
      <ErrorNote error={errMsg} onRetry={reload} />
      {!data ? (errMsg ? null : <Loading />) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            <div className="adm-card">
              <h3 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 600 }}>Tài khoản đã đăng nhập</h3>
              {ok ? (
                <div style={{ display: 'grid', gap: 12 }}>
                  <Stat label="Tổng" value={num(a.total)} />
                  <Stat
                    label="Mới trong 7 ngày"
                    value={a.new_7d == null ? '—' : a.new_7d_capped ? '500+' : num(a.new_7d)}
                  />
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 20, fontWeight: 600 }}>Chưa lấy được</div>
                  <div className="adm-note" style={{ padding: '4px 0' }}>{REASON[a?.status] || REASON.error}</div>
                </div>
              )}
            </div>
            <div className="adm-card">
              <h3 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 600 }}>Cặp đôi</h3>
              <div style={{ display: 'grid', gap: 12 }}>
                <Stat
                  label="Tổng"
                  value={num(c?.total)}
                  sub={[
                    `của tài khoản ${num(owner.account ?? 0)}`,
                    `khách dùng thử ${num(owner.guest ?? 0)}`,
                    owner.unknown > 0 ? `không rõ ${num(owner.unknown)}` : null,
                  ].filter(Boolean).join(' · ')}
                />
                <Stat label="Mới trong 7 ngày" value={num(c?.new_7d)} />
              </div>
            </div>
          </div>
          <div className="adm-actions">
            {at && <span className="adm-note" style={{ padding: 0 }}>Cập nhật lúc {at}</span>}
            <button type="button" className="adm-btn adm-btn-sm" onClick={refresh}>Làm mới</button>
          </div>
        </>
      )}
    </section>
  );
}
