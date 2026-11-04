import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { ErrorNote } from './common.jsx';
import { useShowAfter, SkelRegion, Bar } from '../ui/Skel.jsx';
import { useLoad } from './useLoad.js';

// Danh sách thành viên kèm tên cô dâu, chú rể (T-043, ADR-018). Chỉ đọc, chỉ admin.
// Riêng tư: từ khoá chỉ đi trong thân POST; không lưu storage, không đổi URL/tiêu đề, không analytics, không console.

const PAGE_SIZE = 20;
const DEBOUNCE_MS = 300;
const ROLE = { owner: 'Chủ cặp đôi', member: 'Thành viên', viewer: 'Chỉ xem' };

// 'YYYY-MM-DD' -> 'dd/MM/yyyy' (không qua Date để khỏi lệch múi giờ); không hợp lệ -> '—'
function fmtDay(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(typeof s === 'string' ? s : '');
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '—';
}

function headline(item) {
  if (item.kind === 'guest') return 'khách';
  if (item.kind === 'unknown') return 'không rõ chủ sở hữu';
  return item.email_status === 'ok' && item.email ? item.email : 'chưa lấy được email';
}

function Row({ item }) {
  const couples = Array.isArray(item.couples) ? item.couples : [];
  return (
    <li className="adm-member">
      <div className="adm-member-head">{headline(item)}</div>
      {couples.map((c, i) => (
        <div className="adm-member-couple" key={i}>
          <div>
            Cô dâu: {c.bride_name || 'chưa điền'} · Chú rể: {c.groom_name || 'chưa điền'}
          </div>
          <div className="adm-muted">
            {ROLE[c.role] || 'Không rõ vai trò'} · {fmtDay(c.created_at)}
          </div>
        </div>
      ))}
    </li>
  );
}

export function MemberList() {
  const [input, setInput] = useState('');
  const [query, setQuery] = useState({ page: 1, q: '' });

  // Gõ xong 300 ms mới gửi; đổi từ khoá luôn về trang 1.
  useEffect(() => {
    const q = input.trim();
    const t = setTimeout(() => {
      setQuery((cur) => (cur.q === q ? cur : { page: 1, q }));
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [input]);

  const { page, q } = query;
  const fetchList = useCallback(() => api.adminMembersList({ page, size: PAGE_SIZE, q }), [page, q]);
  const { data, error, loading, reload } = useLoad(fetchList);

  const items = Array.isArray(data?.items) ? data.items : [];
  const totalPages = Math.max(1, data?.total_pages || 0);
  const counts = data?.counts || {};
  const showSk = useShowAfter(loading && !error);
  const go = (p) => setQuery((cur) => ({ ...cur, page: p }));

  return (
    <section aria-label="Danh sách thành viên" style={{ marginTop: 28 }}>
      <h3 className="adm-h2">Danh sách thành viên</h3>
      <input
        type="search"
        className="adm-input adm-member-search"
        aria-label="Tìm theo email hoặc tên"
        placeholder="Tìm theo email hoặc tên"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      {data && data.email_complete === false && (
        <div className="adm-note" role="note">
          {q
            ? 'Một số email chưa lấy được nên tìm theo email có thể thiếu kết quả.'
            : 'Một số email chưa lấy được.'}
        </div>
      )}
      <ErrorNote error={error} onRetry={reload} />
      {loading && !error && showSk && (
        <SkelRegion>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="adm-member"><Bar h={18} w="60%" /><Bar h={14} w="85%" mt={8} /><Bar h={13} w="45%" mt={6} /></div>
          ))}
        </SkelRegion>
      )}
      {data && (
        <>
          {items.length === 0 ? (
            <div className="adm-note">{q ? 'Không tìm thấy thành viên nào khớp' : 'Chưa có thành viên nào'}</div>
          ) : (
            <ul role="list" aria-label="Danh sách thành viên" className="adm-member-list">
              {items.map((it, i) => <Row key={i} item={it} />)}
            </ul>
          )}
          <div className="adm-pager" style={{ flexWrap: "wrap" }}>
            <button type="button" className="adm-btn adm-btn-sm adm-member-btn" disabled={page <= 1} onClick={() => go(page - 1)}>
              Trang trước
            </button>
            <button type="button" className="adm-btn adm-btn-sm adm-member-btn" disabled={page >= totalPages} onClick={() => go(page + 1)}>
              Trang sau
            </button>
            <span className="adm-num">Trang {data.page}/{totalPages}</span>
            <span className="adm-num">{data.total} dòng</span>
          </div>
          <div className="adm-note" style={{ padding: '6px 0' }}>
            {counts.account ?? 0} tài khoản · {counts.guest ?? 0} khách dùng thử · {counts.unknown ?? 0} không rõ chủ.
            {' '}Tài khoản chưa vào cặp đôi nào không hiện ở đây.
          </div>
        </>
      )}
    </section>
  );
}
