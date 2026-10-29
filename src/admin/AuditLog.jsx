import { useCallback, useState } from 'react';
import { api } from '../api.js';
import { Loading, ErrorNote } from './common.jsx';
import { adminErrMsg, fmtTime } from './format.js';
import { useLoad } from './useLoad.js';

const ACTIONS = [
  ['', 'Tất cả thao tác'],
  ['connect.status', 'Đổi trạng thái kết nối'],
  ['upgrade.activate', 'Kích hoạt gói'],
  ['upgrade.reject', 'Từ chối nâng cấp'],
  ['subscription.revoke', 'Thu hồi gói'],
  ['subscription.keep_legacy', 'Giữ gói tự kích hoạt'],
  ['vendor.override', 'Ghi đè vendor'],
  ['vendor.override_clear', 'Bỏ ghi đè vendor'],
];
const ACTION_LABEL = Object.fromEntries(ACTIONS.filter(([k]) => k));

// Nhật ký chỉ-thêm: màn này chỉ đọc (không có nút sửa/xoá).
export function AuditLog() {
  const [action, setAction] = useState('');
  return (
    <section>
      <h2 className="adm-h2">Nhật ký thao tác</h2>
      <div className="adm-toolbar">
        <select className="adm-select" value={action} aria-label="Lọc theo thao tác" onChange={(e) => setAction(e.target.value)}>
          {ACTIONS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
        </select>
        <span className="adm-muted" style={{ fontSize: 13 }}>Mới nhất trước · chỉ xem, không sửa hay xoá được.</span>
      </div>
      <AuditList key={action} action={action} />
    </section>
  );
}

function AuditList({ action }) {
  const fetchFirst = useCallback(() => api.adminAudit({ action, limit: 50 }), [action]);
  const { data, error, reload } = useLoad(fetchFirst);
  const [extra, setExtra] = useState([]);
  const [cursor, setCursor] = useState(undefined); // undefined = theo trang đầu
  const [moreError, setMoreError] = useState('');
  const [more, setMore] = useState(false);
  const [open, setOpen] = useState(null);

  const entries = data ? [...(data.entries || []), ...extra] : null;
  const next = cursor === undefined ? data?.next_cursor || null : cursor;

  const loadMore = async () => {
    setMore(true);
    setMoreError('');
    try {
      const res = await api.adminAudit({ action, cursor: next, limit: 50 });
      setExtra((cur) => [...cur, ...(res.entries || [])]);
      setCursor(res.next_cursor || null);
    } catch (err) {
      setMoreError(adminErrMsg(err));
    } finally {
      setMore(false);
    }
  };

  return (
    <>
      <ErrorNote error={error || moreError} onRetry={reload} />
      {entries === null ? (error ? null : <Loading />) : entries.length === 0 ? (
        <div className="adm-note">Chưa có dòng nhật ký nào.</div>
      ) : (
        <div className="adm-card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="adm-table">
            <thead>
              <tr><th>Thời gian</th><th>Thao tác</th><th>Đối tượng</th><th>Người làm</th><th /></tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <AuditRow key={e.id} e={e} open={open === e.id} onToggle={() => setOpen(open === e.id ? null : e.id)} />
              ))}
            </tbody>
          </table>
        </div>
      )}
      {next && (
        <div className="adm-pager">
          <button type="button" className="adm-btn adm-btn-sm" onClick={loadMore} disabled={more}>
            {more ? 'Đang tải…' : 'Tải thêm'}
          </button>
        </div>
      )}
    </>
  );
}

function AuditRow({ e, open, onToggle }) {
  return (
    <>
      <tr>
        <td className="adm-num">{fmtTime(e.at)}</td>
        <td>{ACTION_LABEL[e.action] || e.action}</td>
        <td><span className="adm-muted">{e.target_type}</span> {e.target_id}</td>
        <td className="adm-muted">{e.admin_id}</td>
        <td>
          <button type="button" className="adm-btn adm-btn-sm" onClick={onToggle}>
            {open ? 'Ẩn chi tiết' : 'Xem trước/sau'}
          </button>
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={5}>
            <div className="adm-grid2">
              <div><strong>Trước</strong><pre className="adm-pre">{JSON.stringify(e.before, null, 2)}</pre></div>
              <div><strong>Sau</strong><pre className="adm-pre">{JSON.stringify(e.after, null, 2)}</pre></div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
