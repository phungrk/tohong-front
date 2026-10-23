import { useState, useEffect, useCallback } from 'react';
import { Icon } from '../ui/Icon.jsx';
import { AIButton } from '../ui/AIButton.jsx';
import { ThreadMark } from '../ui/atoms.jsx';
import { ListRow, SectionHeader, Amount } from '../ui/ListRow.jsx';
import { OBCalendar } from './Onboarding.jsx';
import { api } from '../api.js';
import { track } from '../analytics.js';

const pad2 = (n) => String(n).padStart(2, '0');

const EMPTY = {
  bride: 'Cô dâu', groom: 'Chú rể', date: null, dateRaw: null,
  daysLeft: null, totalDays: 0, doneDays: 0,
  budget: { total_tr: 0, spent_tr: 0, over: false },
  guests: { yes: 0, pending: 0, no: 0, total: 0, capacity: 0 },
  timeline: { done: 0, total: 0 },
  vendors: { confirmed: 0, shortlisted: 0, empty: 0 },
  upcoming: [],
};

function fmtDate(iso) {
  if (!iso) return null;
  // Take only the date part to avoid timezone shifts (ISO: "YYYY-MM-DD...")
  const datePart = String(iso).split('T')[0];
  const [y, m, d] = datePart.split('-');
  if (!y || !m || !d || isNaN(+y) || isNaN(+m) || isNaN(+d)) return null;
  return `${d.padStart(2, '0')}.${m.padStart(2, '0')}.${y}`;
}

function DBCountdown({ data, onDateSave }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const pct = data.totalDays > 0 ? Math.round((data.doneDays / data.totalDays) * 100) : 0;
  const canEdit = !!onDateSave;

  const [initY, initM, initD] = (() => {
    if (data.dateRaw) {
      const [y, m, d] = data.dateRaw.split('-').map(Number);
      return [y, m, d];
    }
    const today = new Date();
    return [today.getFullYear(), today.getMonth() + 1, today.getDate()];
  })();

  const handleConfirm = async (d, m, y) => {
    setEditing(false);
    setSaving(true);
    try { await onDateSave(`${y}-${pad2(m)}-${pad2(d)}`); } finally { setSaving(false); }
  };

  return (
    <>
    <div style={{ paddingBottom: 16, borderBottom: '1px solid var(--line-100)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="ds-label" style={{ color: 'var(--kim-600)', marginBottom: 4 }}>Còn</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 52, fontWeight: 600, color: 'var(--son-600)',
            lineHeight: 1, fontVariantNumeric: 'lining-nums tabular-nums' }}>
            {data.daysLeft ?? '—'}<span style={{ fontSize: 17, fontWeight: 500, color: 'var(--ink-500)' }}> ngày</span>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, maxWidth: '55%' }}>
          <div className="ds-label" style={{ marginBottom: 4 }}>Đám cưới</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--ink-900)', lineHeight: 1.2, textWrap: 'pretty' }}>
            {data.bride} &amp; {data.groom}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end', marginTop: 4, position: 'relative' }}>
            <Icon name={saving ? 'loader' : 'calendar-heart'} size={13} color="var(--son-500)" />
            <button
              onClick={canEdit ? () => setEditing(true) : undefined}
              title={canEdit ? 'Chỉnh sửa ngày cưới' : undefined}
              style={{ fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 700, color: 'var(--son-600)',
                background: 'none', border: 'none', padding: '4px 0', fontVariantNumeric: 'lining-nums tabular-nums',
                cursor: canEdit ? 'pointer' : 'default',
                textDecoration: canEdit ? 'underline dotted' : 'none',
                textUnderlineOffset: 3 }}>
              {data.date || 'Chọn ngày'}
            </button>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        <div style={{ height: 6, borderRadius: 999, background: 'var(--line-100)', overflow: 'hidden', marginBottom: 6 }}>
          <div style={{ height: '100%', width: pct + '%', background: 'var(--son-500)', borderRadius: 999, transition: 'width .4s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 500, color: 'var(--ink-400)' }}>
          <span>Bắt đầu lên kế hoạch</span>
          <span style={{ fontVariantNumeric: 'lining-nums tabular-nums' }}>{pct}% hành trình</span>
        </div>
      </div>
    </div>
    {editing && (
      <div onClick={() => setEditing(false)} style={{ position: 'absolute', inset: 0, zIndex: 80,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 18px',
        background: 'rgba(43,36,32,.4)' }}>
        <OBCalendar
          initD={initD} initM={initM} initY={initY}
          onCancel={() => setEditing(false)}
          onConfirm={handleConfirm}
        />
      </div>
    )}
    </>
  );
}

function DBSkeleton() {
  return (
    <div style={{ flex: 1, overflow: 'hidden', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 14 }}
      aria-live="polite" aria-busy="true" aria-label="Đang tải bảng điều khiển">
      <div className="db-skel" style={{ height: 110, borderRadius: 'var(--r-md)' }} />
      <div className="db-skel" style={{ height: 12, width: 90, marginTop: 6 }} />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="db-skel" style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }} />
          <div className="db-skel" style={{ flex: 1, height: 36, borderRadius: 'var(--r-sm)' }} />
        </div>
      ))}
    </div>
  );
}

export function ScreenDashboard({ coupleId = null, navigate = () => {}, onMenuOpen, onOpenAI = () => {} }) {
  const [data, setData] = useState(EMPTY);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!coupleId) return;
    setLoaded(false);
    const loadStart = Date.now();
    // Load summary (profile + budget + timeline + guests)
    api.getSummary(coupleId)
      .then((s) => {
        setData((prev) => ({
          ...prev,
          bride:    s.profile?.bride_name || prev.bride,
          groom:    s.profile?.groom_name || prev.groom,
          date:     fmtDate(s.profile?.wedding_date) || prev.date,
          dateRaw:  s.profile?.wedding_date ? String(s.profile.wedding_date).split('T')[0] : prev.dateRaw,
          daysLeft: s.days_left ?? prev.daysLeft,
          totalDays: s.total_days ?? prev.totalDays,
          doneDays:  s.done_days ?? prev.doneDays,
          budget:   s.budget   || prev.budget,
          guests:   s.guests   || prev.guests,
          timeline: s.timeline || prev.timeline,
          vendors:  s.vendors  || prev.vendors,
        }));
        track('dashboard_loaded', {
          journey: 'dashboard',
          duration_ms: Date.now() - loadStart,
          days_left: s.days_left,
          guests_pending: s.guests?.pending,
          timeline_pct: s.timeline?.total > 0 ? Math.round((s.timeline.done / s.timeline.total) * 100) : null,
          budget_pct: s.budget?.total_tr > 0 ? Math.round((s.budget.spent_tr / s.budget.total_tr) * 100) : null,
        });
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [coupleId]);

  const handleDateSave = useCallback(async (iso) => {
    // Optimistic update
    const [y, m, d] = iso.split('-').map(Number);
    const wd = new Date(y, m - 1, d);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const daysLeft = Math.max(0, Math.ceil((wd - today) / 86400000));
    setData((prev) => ({
      ...prev,
      date: fmtDate(iso),
      dateRaw: iso,
      daysLeft,
      doneDays: Math.max(0, (prev.totalDays || 365) - daysLeft),
    }));
    await api.updateProfile(coupleId, { couple: { wedding_date: iso } });
  }, [coupleId]);

  const bPct = data.budget.total_tr > 0
    ? Math.round((data.budget.spent_tr / data.budget.total_tr) * 100)
    : 0;
  const tlPct = data.timeline.total > 0
    ? Math.round((data.timeline.done / data.timeline.total) * 100)
    : 0;
  const totalVendors = (data.vendors.confirmed || 0) + (data.vendors.shortlisted || 0) + (data.vendors.empty || 0);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--paper)' }}>
      {/* top bar */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 9, padding: 'var(--header-pt) 16px 11px',
        background: 'rgba(252,248,243,0.96)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--line-100)' }}>
        <button onClick={onMenuOpen} aria-label="Mở menu" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
          <Icon name="menu" size={22} color="var(--ink-700)" />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1 }}>
          <ThreadMark size={22} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--ink-900)' }}>Tơ Hồng</span>
        </div>
        <AIButton onOpen={onOpenAI} />
      </div>

      {coupleId && !loaded ? <DBSkeleton /> : (
      /* scrollable content */
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 24px' }}>
        <DBCountdown data={data} onDateSave={coupleId ? handleDateSave : null} />

        <SectionHeader label="Tổng quan" />
        <ListRow icon="wallet" title="Ngân sách" onClick={() => navigate(3)}
          value={<Amount value={data.budget.total_tr} unit="tr" />}
          sub={data.budget.over
            ? `Vượt ${data.budget.spent_tr - data.budget.total_tr}tr so với ngân sách`
            : `Đã dùng ${bPct}% ngân sách`}
          subColor={data.budget.over ? 'var(--danger-500)' : 'var(--ink-400)'} />
        <ListRow icon="users" title="Khách mời" onClick={() => navigate(4)}
          done={data.guests.total > 0 && data.guests.pending === 0}
          value={<Amount value={data.guests.total} />}
          sub={`${data.guests.yes} sẽ tới · ${data.guests.pending} chờ${data.guests.capacity ? ` · sức chứa ${data.guests.capacity}` : ''}`}
          subColor={data.guests.pending > 0 ? 'var(--kim-700)' : 'var(--ink-400)'} />
        <ListRow icon="list-checks" title="Kế hoạch" onClick={() => navigate(2)}
          done={data.timeline.total > 0 && data.timeline.done === data.timeline.total}
          value={<Amount value={`${data.timeline.done}/${data.timeline.total}`} />}
          sub={`${tlPct}% việc đã xong`} />
        <ListRow icon="store" title="Nhà cung cấp" onClick={() => navigate(3)} isLast={data.upcoming.length === 0}
          done={totalVendors > 0 && data.vendors.empty === 0}
          value={<Amount value={totalVendors} unit=" hạng mục" unitSize={13} />}
          sub={data.vendors.empty > 0
            ? `${data.vendors.confirmed} đã chốt · ${data.vendors.empty} chưa có vendor`
            : `${data.vendors.confirmed} đã chốt · ${data.vendors.shortlisted} đang xem`}
          subColor={data.vendors.empty > 0 ? 'var(--ink-400)' : 'var(--sage-600)'} />

        {data.upcoming.length > 0 && <>
          <SectionHeader label="Sắp tới" />
          {data.upcoming.map((item, i) => (
            <ListRow key={item.id} icon={item.catIcon} title={item.task} sub={item.cat}
              isLast={i === data.upcoming.length - 1}
              value={<Amount value={item.weeks} unit=" tuần" unitSize={13}
                color={item.weeks <= 3 ? 'var(--kim-700)' : 'var(--ink-900)'} />}
              onClick={() => navigate(item.tab)} />
          ))}
        </>}
      </div>
      )}

    </div>
  );
}

export default ScreenDashboard;
