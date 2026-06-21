import { useState, useEffect, useCallback } from 'react';
import { Icon } from '../ui/Icon.jsx';
import { EditName } from '../ui/atoms.jsx';
import { api } from '../api.js';
import { track } from '../analytics.js';

const GKST = {
  yes:     { label: 'Sẽ tới',  color: 'var(--sage-500)', bg: '#edf7ee', border: '#c3dfc7',        icon: 'check' },
  pending: { label: 'Chờ',     color: '#b45309',          bg: '#fef9ed', border: '#fcd34d',        icon: 'clock-4' },
  no:      { label: 'Từ chối', color: 'var(--ink-400)',   bg: 'var(--sand)', border: 'var(--line-200)', icon: 'x' },
};

function calcSums(gs) {
  const yes     = gs.filter((g) => g.status === 'yes').reduce((n, g) => n + g.count, 0);
  const pending = gs.filter((g) => g.status === 'pending').reduce((n, g) => n + g.count, 0);
  const no      = gs.filter((g) => g.status === 'no').reduce((n, g) => n + g.count, 0);
  return { yes, pending, no, total: yes + pending + no };
}

function GkAvatar({ name, side }) {
  return (
    <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: side === 'trai' ? '#dbeafe' : 'var(--son-50)',
      fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600,
      color: side === 'trai' ? '#1d4ed8' : 'var(--son-600)',
      border: `1.5px solid ${side === 'trai' ? '#bfdbfe' : 'var(--son-100)'}` }}>
      {name.charAt(0)}
    </div>
  );
}

function GkBadge({ status, onClick }) {
  const s = GKST[status] || GKST.pending;
  return (
    <button onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 600,
      color: s.color, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 999,
      padding: '4px 9px', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>
      <Icon name={s.icon} size={11} color={s.color} sw={2.5} /> {s.label}
    </button>
  );
}

function GkRow({ g, onCycle, onRename }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 0', borderBottom: '1px solid var(--line-100)' }}>
      <GkAvatar name={g.name} side={g.side} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <EditName value={g.name} onChange={onRename} size={14} weight={600} focusNew={g.isNew} />
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11.5, color: 'var(--ink-400)', marginTop: 2 }}>
          {g.role}{g.count > 1 ? ` · ${g.count} người` : ''}
        </div>
      </div>
      <GkBadge status={g.status} onClick={onCycle} />
    </div>
  );
}

function GkSeg({ value, onChange }) {
  return (
    <div style={{ display: 'flex', background: 'var(--line-100)', borderRadius: 11, padding: 3, gap: 2 }}>
      {[['all', 'Tất cả'], ['trai', 'Nhà trai'], ['gai', 'Nhà gái']].map(([v, l]) => (
        <button key={v} onClick={() => onChange(v)} style={{ flex: 1, fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600,
          color: value === v ? 'var(--ink-900)' : 'var(--ink-500)', background: value === v ? 'var(--card)' : 'transparent',
          border: 'none', borderRadius: 8, padding: '7px 0', cursor: 'pointer',
          boxShadow: value === v ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all .15s ease' }}>{l}</button>
      ))}
    </div>
  );
}

export function ScreenGuests({ coupleId = null, onMenuOpen = () => {} }) {
  const [gs, setGs]       = useState([]);
  const [capacity, setCap] = useState(0);
  const [filter, setFilter] = useState('all');

  // Load from server on mount
  useEffect(() => {
    if (!coupleId) return;
    api.getGuests(coupleId)
      .then((data) => {
        if (data?.guests !== undefined) {
          setGs(data.guests);
          if (data.capacity) setCap(data.capacity);
        }
      })
      .catch(() => {});
  }, [coupleId]);

  // Optimistic cycle — update locally, then PATCH server
  const cycle = useCallback((id) => {
    setGs((prev) => {
      const current = prev.find((g) => g.id === id);
      const nextStatus = current?.status === 'yes' ? 'pending' : current?.status === 'pending' ? 'no' : 'yes';
      const next = prev.map((g) => g.id === id ? { ...g, status: nextStatus } : g);
      track('guest_status_changed', {
        journey: 'guest_management',
        from_status: current?.status,
        to_status: nextStatus,
        side: current?.side,
      });
      if (coupleId) {
        api.updateGuest(coupleId, id, { status: nextStatus }).catch(() => {});
      }
      return next;
    });
  }, [coupleId]);

  // Optimistic rename
  const rename = useCallback((id, name) => {
    setGs((prev) => {
      const next = prev.map((g) => g.id === id ? { ...g, name } : g);
      if (coupleId) {
        api.updateGuest(coupleId, id, { name }).catch(() => {});
      }
      return next;
    });
  }, [coupleId]);

  // Add new guest — optimistic local then sync id from server
  const add = useCallback(() => {
    const side = filter === 'gai' ? 'gai' : 'trai';
    if (coupleId) {
      const body = { name: 'Khách mới', side, status: 'pending', count: 1, role: 'Bạn bè' };
      api.addGuest(coupleId, body)
        .then((res) => {
          if (res?.guest) setGs((prev) => [...prev, { ...res.guest, isNew: true }]);
        })
        .catch(() => {});
    } else {
      // Local draft before a profile exists; it is never presented as AI data.
      setGs((prev) => [...prev, { id: 'n' + Date.now(), name: 'Khách mới', side, status: 'pending', count: 1, role: 'Bạn bè', isNew: true }]);
    }
  }, [coupleId, filter]);

  const sums = calcSums(gs);
  const list = gs.filter((x) => filter === 'all' || x.side === filter);
  const sections = filter === 'all'
    ? [{ key: 'trai', label: 'Nhà trai', items: list.filter((x) => x.side === 'trai') },
       { key: 'gai',  label: 'Nhà gái',  items: list.filter((x) => x.side === 'gai') }]
    : [{ key: filter, label: filter === 'trai' ? 'Nhà trai' : 'Nhà gái', items: list }];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--paper)' }}>
      {/* sticky header */}
      <div style={{ flexShrink: 0, background: 'rgba(252,248,243,0.96)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--line-100)', padding: 'var(--header-pt) 16px 13px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 13 }}>
          <button onClick={onMenuOpen} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexShrink: 0 }}>
            <Icon name="chevron-left" size={24} color="var(--ink-700)" />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--ink-900)', lineHeight: 1.1 }}>Khách mời</div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11.5, color: 'var(--ink-500)', marginTop: 1 }}>{sums.total} người</div>
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ height: 5, borderRadius: 999, background: 'var(--line-100)', overflow: 'hidden', display: 'flex', marginBottom: 4 }}>
            <div style={{ width: (capacity > 0 ? (sums.yes / capacity) * 100 : 0) + '%', background: 'var(--sage-500)', transition: 'width .25s ease' }} />
            <div style={{ width: (capacity > 0 ? (sums.pending / capacity) * 100 : 0) + '%', background: '#fbbf24' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-ui)', fontSize: 10.5, color: 'var(--ink-400)' }}>
            <span><b style={{ color: 'var(--sage-500)' }}>{sums.yes}</b> xác nhận · <b style={{ color: '#b45309' }}>{sums.pending}</b> chờ</span>
            <span>{capacity > 0 ? `Sức chứa ${capacity} khách` : 'Chưa đặt sức chứa'}</span>
          </div>
        </div>

        <GkSeg value={filter} onChange={setFilter} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 8px' }}>
        {gs.length === 0 && (
          <div style={{ marginTop: 18, padding: '24px 16px', textAlign: 'center', border: '1px dashed var(--line-200)', borderRadius: 'var(--r-md)',
            fontFamily: 'var(--font-body)', fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink-500)' }}>
            Chưa có khách mời. Thêm khách đầu tiên để bắt đầu theo dõi RSVP.
          </div>
        )}
        {sections.map((sec) => (
          <div key={sec.key}>
            {filter === 'all' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '14px 0 4px' }}>
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: sec.key === 'trai' ? '#1d4ed8' : 'var(--son-600)' }}>{sec.label}</span>
                <span style={{ flex: 1, height: 1, background: 'var(--line-100)' }} />
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--ink-400)' }}>
                  {sec.items.reduce((n, x) => n + x.count, 0)} người
                </span>
              </div>
            )}
            {sec.items.map((x) => (
              <GkRow key={x.id} g={x} onCycle={() => cycle(x.id)} onRename={(n) => rename(x.id, n)} />
            ))}
          </div>
        ))}
        <button onClick={add} style={{ width: '100%', marginTop: 14, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          fontFamily: 'var(--font-ui)', fontSize: 13.5, fontWeight: 600, color: 'var(--son-600)',
          background: 'transparent', border: '1.5px dashed var(--son-200)', borderRadius: 'var(--r-md)', padding: '11px 0', cursor: 'pointer' }}>
          <Icon name="user-plus" size={16} color="var(--son-600)" /> Thêm khách mời
        </button>
      </div>

    </div>
  );
}

export default ScreenGuests;
