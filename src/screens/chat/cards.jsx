import { useState, useEffect } from 'react';
import { Icon } from '../../ui/Icon.jsx';
import { EditAmount } from '../../ui/atoms.jsx';
import { api } from '../../api.js';

export function CardShell({ children, gold = false }) {
  return (
    <div style={{ background: 'var(--card)',
      border: `1px solid ${gold ? 'var(--kim-200)' : 'var(--line-100)'}`,
      borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
      {children}
    </div>
  );
}

export function GhostBtn({ icon, onClick, children, small = false }) {
  return (
    <button type="button" onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: small ? 4 : 6,
      fontFamily: 'var(--font-ui)', fontSize: small ? 11.5 : 12.5, fontWeight: 600,
      color: 'var(--ink-600)', background: 'transparent',
      border: '1.5px solid var(--line-200)', borderRadius: 'var(--r-pill)',
      padding: small ? '5px 11px' : '7px 14px', cursor: 'pointer', flexShrink: 0,
    }}>
      {icon && <Icon name={icon} size={small ? 12 : 14} color="var(--ink-500)" />}
      {children}
    </button>
  );
}

export function CardHead({ icon, kicker, title, right }) {
  return (
    <div style={{ padding: '13px 15px 12px', borderBottom: '1px solid var(--line-100)', display: 'flex', alignItems: 'center', gap: 11 }}>
      <span style={{ width: 34, height: 34, borderRadius: 'var(--r-sm)', background: 'var(--son-50)', border: '1px solid var(--son-100)',
        flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={17} color="var(--son-500)" />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="ds-label" style={{ color: 'var(--kim-600)' }}>{kicker}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, color: 'var(--ink-900)', lineHeight: 1.15, marginTop: 1 }}>{title}</div>
      </div>
      {right}
    </div>
  );
}

export function CardAction({ children }) {
  return (
    <div style={{ padding: '10px 13px', background: 'var(--sand)', borderTop: '1px solid var(--line-100)', display: 'flex', gap: 8 }}>
      {children}
    </div>
  );
}

/* ============================= GUEST CARD ============================= */
const ST = {
  yes:     { label: 'Sẽ tới', color: 'var(--sage-500)',   bg: 'var(--sage-50)',   icon: 'check' },
  pending: { label: 'Chờ',    color: 'var(--amber-600)',  bg: 'var(--amber-50)',  icon: 'clock' },
  no:      { label: 'Bận',    color: 'var(--ink-400)',    bg: 'var(--sand)',      icon: 'x'     },
};

export function GuestCard({ coupleId }) {
  const [guests, setGuests] = useState([]);
  const [capacity, setCapacity] = useState(0);
  const [loading, setLoading] = useState(!!coupleId);

  useEffect(() => {
    if (!coupleId) return;
    api.getGuests(coupleId)
      .then((data) => {
        setGuests(data?.guests || []);
        setCapacity(data?.capacity || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [coupleId]);

  const cycle = async (g) => {
    const next = g.status === 'yes' ? 'pending' : g.status === 'pending' ? 'no' : 'yes';
    setGuests((gs) => gs.map((x) => x.id === g.id ? { ...x, status: next } : x));
    if (coupleId) {
      try {
        await api.updateGuest(coupleId, g.id, { status: next });
      } catch {
        setGuests((gs) => gs.map((x) => x.id === g.id ? { ...x, status: g.status } : x));
      }
    }
  };

  const count = (s) => guests.filter((g) => g.status === s).reduce((n, g) => n + (g.count || 1), 0);
  const total = guests.reduce((n, g) => n + (g.count || 1), 0);
  const yes = count('yes'), pend = count('pending');

  return (
    <CardShell>
      <CardHead icon="users" kicker="Khách mời" title="Danh sách khách"
        right={<div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--ink-900)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {loading ? '…' : total}
          </div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10.5, color: 'var(--ink-400)' }}>lời mời</div>
        </div>} />
      {loading ? (
        <div style={{ padding: '20px 15px', textAlign: 'center', fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--ink-400)' }}>
          Đang tải danh sách…
        </div>
      ) : guests.length === 0 ? (
        <div style={{ padding: '20px 15px', textAlign: 'center', fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--ink-400)', lineHeight: 1.5 }}>
          Chưa có khách mời nào.<br />
          <span style={{ fontSize: 12 }}>Thêm khách từ tab Khách mời nhé!</span>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', padding: '12px 15px 10px', gap: 8 }}>
            {[['Sẽ tới', yes, 'var(--sage-500)'], ['Đang chờ', pend, 'var(--amber-600)'], ['Bận', total - yes - pend, 'var(--ink-400)']].map(([l, n, c]) => (
              <div key={l} style={{ flex: 1, background: 'var(--bg-1)', border: '1px solid var(--line-100)', borderRadius: 'var(--r-sm)', padding: '8px 10px' }}>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 19, fontWeight: 600, color: c, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{n}</div>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10.5, color: 'var(--ink-400)', marginTop: 3 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: '0 15px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--ink-400)', marginBottom: 5 }}>
              <span>Đã xác nhận {yes}/{total}</span><span>{capacity > 0 ? `Sức chứa ~${capacity} khách` : 'Chưa đặt sức chứa'}</span>
            </div>
            <div style={{ height: 6, borderRadius: 999, background: 'var(--line-100)', overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: (capacity > 0 ? Math.min((yes / capacity) * 100, 100) : 0) + '%', background: 'var(--sage-500)' }} />
              <div style={{ width: (capacity > 0 ? Math.min((pend / capacity) * 100, 100 - (yes / capacity) * 100) : 0) + '%', background: 'var(--amber-400)' }} />
            </div>
          </div>
          <div style={{ padding: '2px 8px 8px' }}>
            {guests.map((g) => {
              const s = ST[g.status] || ST.pending;
              return (
                <button key={g.id} onClick={() => cycle(g)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 7px',
                  background: 'transparent', border: 'none', borderRadius: 'var(--r-sm)', cursor: 'pointer', textAlign: 'left' }}>
                  <span style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: g.side === 'trai' ? 'var(--info-50)' : 'var(--son-50)',
                    fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 700,
                    color: g.side === 'trai' ? 'var(--info-500)' : 'var(--son-500)' }}>
                    {g.side === 'trai' ? 'T' : 'G'}
                  </span>
                  <span style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-body)', fontSize: 13.5, color: 'var(--ink-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {g.name}{g.count ? <span style={{ color: 'var(--ink-400)' }}> · {g.count} người</span> : null}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0, fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 600,
                    color: s.color, background: s.bg, borderRadius: 999, padding: '3px 9px' }}>
                    <Icon name={s.icon} size={11} color={s.color} /> {s.label}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
      <CardAction>
        <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--ink-400)' }}>
          <Icon name="hand-pointer" size={12} color="var(--ink-400)" /> Chạm một khách để đổi trạng thái
        </span>
      </CardAction>
    </CardShell>
  );
}

/* ============================= TIMELINE CARD ============================= */
export function TimelineCard({ coupleId }) {
  const [doc, setDoc] = useState({ phases: [], rundown: [] });
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(!!coupleId);
  const steps = doc.rundown;

  useEffect(() => {
    if (!coupleId) return;
    Promise.all([api.getTimeline(coupleId), api.getSummary(coupleId)])
      .then(([timeline, nextSummary]) => {
        setDoc({
          phases: timeline?.phases || [],
          rundown: timeline?.rundown || [],
        });
        setSummary(nextSummary);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [coupleId]);

  const toggle = (id) => {
    setDoc((current) => {
      const next = {
        ...current,
        rundown: current.rundown.map((step) => step.id === id ? { ...step, done: !step.done } : step),
      };
      if (coupleId) api.putTimeline(coupleId, next).catch(() => {});
      return next;
    });
  };
  const doneN = steps.filter((s) => s.done).length;
  const date = summary?.profile?.wedding_date
    ? String(summary.profile.wedding_date).split('T')[0].split('-').reverse().join('.')
    : null;
  return (
    <CardShell>
      <CardHead icon="calendar-clock" kicker="Timeline · ngày cưới" title={date ? `Lịch trình ${date}` : 'Lịch trình ngày cưới'}
        right={<div style={{ textAlign: 'right' }}>
          {summary?.days_left != null && <>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--ink-400)' }}>còn</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--son-600)', lineHeight: 1 }}>{summary.days_left} ngày</div>
          </>}
        </div>} />
      <div style={{ padding: '14px 16px 6px' }}>
        {!loading && steps.length === 0 && (
          <div style={{ padding: '10px 0 18px', textAlign: 'center', fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--ink-400)' }}>
            Chưa có mốc ngày cưới.
          </div>
        )}
        {steps.map((s, i) => (
          <div key={s.id} style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 16 }}>
              <button onClick={() => toggle(s.id)} style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0, cursor: 'pointer', padding: 0, marginTop: 3,
                background: s.done ? 'var(--son-500)' : 'var(--card)', border: `2px solid ${s.done ? 'var(--son-500)' : 'var(--line-300)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {s.done && <Icon name="check" size={9} color="#fff" sw={3} />}
              </button>
              {i < steps.length - 1 && <span style={{ flex: 1, width: 2, background: s.done ? 'var(--son-200)' : 'var(--line-200)', minHeight: 18 }} />}
            </div>
            <div style={{ flex: 1, paddingBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 700, color: 'var(--ink-900)', fontVariantNumeric: 'tabular-nums' }}>{s.time}</span>
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 9.5, fontWeight: 600,
                  color: s.tag === 'Lễ' ? 'var(--kim-700)' : 'var(--son-600)',
                  background: s.tag === 'Lễ' ? 'var(--kim-50)' : 'var(--son-50)',
                  borderRadius: 999, padding: '1px 7px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.tag}</span>
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 13.5,
                color: s.done ? 'var(--ink-400)' : 'var(--ink-900)', marginTop: 2,
                textDecoration: s.done ? 'line-through' : 'none' }}>{s.name}</div>
            </div>
          </div>
        ))}
      </div>
      <CardAction>
        <span style={{ flex: 1, fontFamily: 'var(--font-ui)', fontSize: 11.5, color: 'var(--ink-500)', alignSelf: 'center' }}>
          {loading ? 'Đang tải timeline…' : `${doneN}/${steps.length} mốc đã xong`}
        </span>
      </CardAction>
    </CardShell>
  );
}

/* ============================= CHECKLIST CARD ============================= */
export function ChecklistCard({ coupleId }) {
  const [doc, setDoc] = useState({ phases: [], rundown: [] });
  const [loading, setLoading] = useState(!!coupleId);
  const items = doc.phases.flatMap((phase) =>
    (phase.tasks || []).map((task) => ({ ...task, phaseId: phase.id, phaseLabel: phase.label }))
  );

  useEffect(() => {
    if (!coupleId) return;
    api.getTimeline(coupleId)
      .then((timeline) => setDoc({
        phases: timeline?.phases || [],
        rundown: timeline?.rundown || [],
      }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [coupleId]);

  const toggle = (phaseId, id) => {
    setDoc((current) => {
      const next = {
        ...current,
        phases: current.phases.map((phase) => phase.id === phaseId
          ? { ...phase, tasks: (phase.tasks || []).map((task) => task.id === id ? { ...task, done: !task.done } : task) }
          : phase),
      };
      if (coupleId) api.putTimeline(coupleId, next).catch(() => {});
      return next;
    });
  };
  const doneN = items.filter((x) => x.done).length;
  const pct = items.length ? Math.round((doneN / items.length) * 100) : 0;
  return (
    <CardShell>
      <CardHead icon="list-checks" kicker="Checklist" title="Việc cần làm"
        right={<div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--sage-500)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{pct}%</div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10.5, color: 'var(--ink-400)' }}>{doneN}/{items.length}</div>
        </div>} />
      <div style={{ padding: '12px 15px 4px' }}>
        <div style={{ height: 6, borderRadius: 999, background: 'var(--line-100)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: pct + '%', background: 'var(--sage-500)', borderRadius: 999, transition: 'width .25s ease' }} />
        </div>
      </div>
      {!loading && items.length === 0 && (
        <div style={{ padding: '18px 15px', textAlign: 'center', fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--ink-400)' }}>
          Chưa có việc nào trong checklist.
        </div>
      )}
      {doc.phases.filter((phase) => (phase.tasks || []).length > 0).map((phase) => (
        <div key={phase.id} style={{ padding: '8px 9px 2px' }}>
          <div className="ds-label" style={{ padding: '4px 6px', color: 'var(--ink-400)' }}>{phase.label}</div>
          {(phase.tasks || []).map((x) => (
            <button key={x.id} onClick={() => toggle(phase.id, x.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '9px 6px',
              background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <span style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: x.done ? 'var(--son-500)' : 'var(--card)',
                border: `2px solid ${x.done ? 'var(--son-500)' : 'var(--line-300)'}` }}>
                {x.done && <Icon name="check" size={12} color="#fff" sw={3} />}
              </span>
              <span style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: 13.5,
                color: x.done ? 'var(--ink-400)' : 'var(--ink-900)',
                textDecoration: x.done ? 'line-through' : 'none' }}>{x.text || x.name}</span>
            </button>
          ))}
        </div>
      ))}
      <CardAction>
        <span style={{ flex: 1, fontFamily: 'var(--font-ui)', fontSize: 11.5, color: 'var(--ink-500)', alignSelf: 'center' }}>
          {loading ? 'Đang tải checklist…' : `${doneN}/${items.length} việc đã xong`}
        </span>
      </CardAction>
    </CardShell>
  );
}

/* ============================= CHAT BUDGET MINI ============================= */
export function ChatBudgetMini({ budgetHook }) {
  const bud = budgetHook;
  return (
    <CardShell>
      <CardHead icon="wallet" kicker="Ngân sách" title={bud.totalTarget > 0 ? `Phân bổ ${bud.totalTarget}tr` : 'Phân bổ ngân sách'}
        right={bud.mung > 0 ? <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10.5, color: 'var(--ink-400)' }}>tiền mừng</div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 600, color: 'var(--sage-500)' }}>+{bud.mung}tr</div>
        </div> : null} />
      <div style={{ padding: '12px 15px' }}>
        {bud.cats.length === 0 && (
          <div style={{ padding: '8px 0', textAlign: 'center', fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--ink-400)' }}>
            Chưa có hạng mục ngân sách.
          </div>
        )}
        {bud.cats.map((c, i) => (
          <div key={c.id} style={{ marginBottom: i === bud.cats.length - 1 ? 0 : 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'var(--font-ui)', fontSize: 12.5, color: 'var(--ink-700)' }}>
                <span style={{ width: 9, height: 9, borderRadius: 3, background: c.color }} /> {c.name}
              </span>
              <EditAmount value={c.amt} onChange={(v) => bud.setAmt(c.id, v)} size={13} />
            </div>
            <div style={{ height: 5, borderRadius: 999, background: 'var(--line-100)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: (bud.total > 0 ? (c.amt / bud.total) * 100 : 0) + '%', background: c.color, borderRadius: 999, transition: 'width .25s ease' }} />
            </div>
          </div>
        ))}
      </div>
      <CardAction>
        <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--ink-400)' }}>
          <Icon name="pencil" size={12} color="var(--ink-400)" /> Chạm số để chỉnh nhanh
        </span>
      </CardAction>
    </CardShell>
  );
}
