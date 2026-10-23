import { useState, useEffect, useCallback } from 'react';
import { Icon } from '../ui/Icon.jsx';
import { AIButton } from '../ui/AIButton.jsx';
import { ThreadMark, Thread } from '../ui/atoms.jsx';
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
    <div style={{ background: 'linear-gradient(135deg,var(--son-50) 0%,#fdf2ed 100%)', border: '1px solid var(--son-100)',
      borderRadius: 'var(--r-lg)', padding: '16px 18px 14px', overflow: 'hidden' }}>
      <Thread w="100%" mb={12} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 52, fontWeight: 600, color: 'var(--son-600)',
            lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{data.daysLeft ?? '—'}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--son-400)', marginTop: 3 }}>ngày nữa</div>
        </div>
        <div style={{ textAlign: 'right', paddingTop: 4 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--ink-900)', lineHeight: 1.1 }}>
            {data.bride} &amp; {data.groom}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end', marginTop: 5, position: 'relative' }}>
            <Icon name={saving ? 'loader' : 'calendar-heart'} size={13} color="var(--son-400)" />
            <button
              onClick={canEdit ? () => setEditing(true) : undefined}
              title={canEdit ? 'Chỉnh sửa ngày cưới' : undefined}
              style={{ fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 700, color: 'var(--son-500)',
                background: 'none', border: 'none', padding: '4px 0',
                cursor: canEdit ? 'pointer' : 'default',
                textDecoration: canEdit ? 'underline dotted' : 'none',
                textUnderlineOffset: 3 }}>
              {data.date || 'Chọn ngày'}
            </button>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        <div style={{ height: 5, borderRadius: 999, background: 'var(--son-100)', overflow: 'hidden', marginBottom: 5 }}>
          <div style={{ height: '100%', width: pct + '%', background: 'var(--son-400)', borderRadius: 999, transition: 'width .4s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--son-400)' }}>
          <span>Bắt đầu lên kế hoạch</span>
          <span>{pct}% hành trình 💕</span>
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

function DBMiniBar({ pct, color }) {
  return (
    <div style={{ height: 4, borderRadius: 999, background: 'var(--line-100)', overflow: 'hidden', margin: '7px 0 2px' }}>
      <div style={{ height: '100%', width: pct + '%', background: color, borderRadius: 999 }} />
    </div>
  );
}

function DBDots({ dots }) {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', margin: '7px 0 2px' }}>
      {dots.map((d, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 700, color: d.color }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: d.color, display: 'inline-block' }} />{d.n}
        </span>
      ))}
    </div>
  );
}

function DBTile({ icon, color, label, main, sub, children, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{ background: 'var(--card)', border: '1px solid var(--line-100)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-xs)',
      padding: '12px 13px 10px', cursor: 'pointer', minWidth: 0, display: 'block', width: '100%', textAlign: 'left', font: 'inherit' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
        <span style={{ width: 24, height: 24, borderRadius: 'var(--r-xs)', background: color + '22', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={13} color={color} />
        </span>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 600, color: 'var(--ink-900)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{main}</div>
      {children}
      <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--ink-400)', marginTop: 3 }}>{sub}</div>
    </button>
  );
}

function DBUpcoming({ item, onClick }) {
  const urgColor = item.weeks <= 3 ? '#b45309' : 'var(--ink-400)';
  return (
    <button type="button" onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
      borderBottom: '1px solid var(--line-100)', cursor: onClick ? 'pointer' : 'default',
      width: '100%', background: 'none', border: 'none', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--line-100)',
      textAlign: 'left', font: 'inherit' }}>
      <span style={{ width: 28, height: 28, borderRadius: 'var(--r-sm)', flexShrink: 0, background: item.catColor + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={item.catIcon} size={14} color={item.catColor} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 600, color: 'var(--ink-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.task}</div>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--ink-400)', marginTop: 1 }}>{item.cat}</div>
      </div>
      <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 700, color: urgColor, flexShrink: 0 }}>còn {item.weeks} tuần</span>
      <Icon name="chevron-right" size={14} color="var(--ink-300)" />
    </button>
  );
}

function DBSkeleton() {
  return (
    <div style={{ flex: 1, overflow: 'hidden', padding: '14px 16px 8px', display: 'flex', flexDirection: 'column', gap: 14 }}
      aria-live="polite" aria-busy="true" aria-label="Đang tải bảng điều khiển">
      <div className="db-skel" style={{ height: 132, borderRadius: 'var(--r-lg)' }} />
      <div>
        <div className="db-skel" style={{ height: 12, width: 90, marginBottom: 10 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="db-skel" style={{ height: 92, borderRadius: 'var(--r-lg)' }} />
          ))}
        </div>
      </div>
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
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 8px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <DBCountdown data={data} onDateSave={coupleId ? handleDateSave : null} />

        {/* summary grid */}
        <div>
          <div className="ds-label" style={{ marginBottom: 10 }}>Tổng quan</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <DBTile icon="wallet" color="var(--son-500)" label="Ngân sách"
              main={`${data.budget.total_tr}tr`}
              sub={data.budget.over ? `Vượt ${data.budget.spent_tr - data.budget.total_tr}tr` : 'Cân đối 👌'}
              onClick={() => navigate(3)}>
              <DBMiniBar pct={bPct} color={data.budget.over ? 'var(--danger-500)' : 'var(--sage-500)'} />
            </DBTile>
            <DBTile icon="users" color="var(--son-400)" label="Khách mời"
              main={String(data.guests.total)}
              sub={`${data.guests.capacity} sức chứa`}
              onClick={() => navigate(4)}>
              <DBDots dots={[
                { n: data.guests.yes,     color: 'var(--sage-500)' },
                { n: data.guests.pending, color: '#fbbf24'         },
                { n: data.guests.no,      color: 'var(--ink-300)'  },
              ]} />
            </DBTile>
            <DBTile icon="list-checks" color="var(--dao-400)" label="Timeline"
              main={`${data.timeline.done}/${data.timeline.total}`}
              sub="việc hoàn thành"
              onClick={() => navigate(2)}>
              <DBMiniBar pct={tlPct} color="var(--son-400)" />
            </DBTile>
            <DBTile icon="store" color="var(--kim-500)" label="Nhà cung cấp"
              main={`${totalVendors} hạng mục`}
              sub={data.vendors.empty > 0 ? `${data.vendors.empty} chưa có vendor` : 'Đã đủ vendor 👌'}
              onClick={() => navigate(3)}>
              <DBDots dots={[
                { n: data.vendors.confirmed,  color: 'var(--sage-500)' },
                { n: data.vendors.shortlisted, color: '#fbbf24'        },
                { n: data.vendors.empty,      color: 'var(--ink-300)'  },
              ]} />
            </DBTile>
          </div>
        </div>

        {/* upcoming */}
        {data.upcoming.length > 0 && <div>
          <div className="ds-label" style={{ marginBottom: 6 }}>Sắp tới</div>
          <div style={{ background: 'var(--card)', border: '1px solid var(--line-100)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-xs)', padding: '0 14px' }}>
            {data.upcoming.map((item) => (
              <DBUpcoming key={item.id} item={item} onClick={() => navigate(item.tab)} />
            ))}
          </div>
        </div>}
        <div style={{ height: 4 }} />
      </div>
      )}

    </div>
  );
}

export default ScreenDashboard;
