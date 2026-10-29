import { useCallback, useState } from 'react';
import { api } from '../api.js';
import { Loading, ErrorNote } from './common.jsx';
import { adminErrMsg, fmtTime } from './format.js';
import { useLoad } from './useLoad.js';

const PLAN_LABEL = { m1: '1 tháng', m3: '3 tháng', m6: '6 tháng', m12: '12 tháng' };

// Gói đang "active" nhưng không có dấu kích hoạt bởi admin (do lỗ hổng cũ cho tự kích hoạt): Giữ hoặc Thu hồi.
export function LegacyPlans({ onChanged }) {
  const fetchRows = useCallback(() => api.adminLegacyList(), []);
  const { data, error: loadError, reload } = useLoad(fetchRows);
  const [actError, setActError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [confirmId, setConfirmId] = useState(null); // 'revoke:<id>'
  const [done, setDone] = useState('');
  const rows = data ? data.subscriptions || [] : null;
  const error = actError || loadError;

  const act = async (kind, r) => {
    setBusyId(r.couple_id);
    setActError('');
    try {
      if (kind === 'keep') await api.adminLegacyKeep(r.couple_id);
      else await api.adminLegacyRevoke(r.couple_id);
      setDone(kind === 'keep' ? `Đã giữ gói của ${r.couple_name || r.couple_id}.` : `Đã thu hồi gói của ${r.couple_name || r.couple_id}.`);
      setConfirmId(null);
      reload();
      onChanged?.();
    } catch (err) {
      setActError(adminErrMsg(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section>
      <h2 className="adm-h2">Gói tự kích hoạt</h2>
      <p className="adm-lead" style={{ fontSize: 14, marginBottom: 12 }}>
        Các gói đang hoạt động nhưng chưa từng được admin kích hoạt (trước khi khoá đường tự kích hoạt). Chọn Giữ để xác nhận, hoặc Thu hồi để đưa về dùng thử.
      </p>
      {done && <div className="adm-ok" role="status">{done}</div>}
      <ErrorNote error={error} onRetry={reload} />
      {rows === null ? (error ? null : <Loading />) : rows.length === 0 ? (
        <div className="adm-note">Không còn gói tự kích hoạt nào cần xử lý.</div>
      ) : (
        <div className="adm-card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="adm-table">
            <thead>
              <tr><th>Cặp đôi</th><th>Email</th><th>Gói</th><th>Bắt đầu</th><th>Hết hạn</th><th /></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.couple_id}>
                  <td>{r.couple_name || r.couple_id}</td>
                  <td>{r.email || '—'}</td>
                  <td>{PLAN_LABEL[r.plan] || r.plan}</td>
                  <td className="adm-num">{fmtTime(r.started_at)}</td>
                  <td className="adm-num">{fmtTime(r.expires_at)}</td>
                  <td>
                    <div className="adm-actions" style={{ marginTop: 0 }}>
                      <button type="button" className="adm-btn adm-btn-sm adm-btn-primary" disabled={busyId === r.couple_id} onClick={() => act('keep', r)}>Giữ</button>
                      {confirmId === `revoke:${r.couple_id}` ? (
                        <>
                          <button type="button" className="adm-btn adm-btn-sm adm-btn-danger" disabled={busyId === r.couple_id} onClick={() => act('revoke', r)}>Xác nhận thu hồi</button>
                          <button type="button" className="adm-btn adm-btn-sm" onClick={() => setConfirmId(null)}>Thôi</button>
                        </>
                      ) : (
                        <button type="button" className="adm-btn adm-btn-sm adm-btn-danger" onClick={() => setConfirmId(`revoke:${r.couple_id}`)}>Thu hồi</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
