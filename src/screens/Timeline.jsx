import { useState, useEffect, useRef } from 'react';
import { Icon } from '../ui/Icon.jsx';
import { Avatar } from '../ui/atoms.jsx';
import { api } from '../api.js';
import { track } from '../analytics.js';
import { buildTemplate } from './checklistTemplates.js';

const EMPTY_PHASES = [
  { id: 'ph_current', label: 'Việc cần làm', status: 'current', tasks: [] },
];

const TAG_S = {
  'Lễ':        { color: 'var(--kim-700)', bg: 'var(--kim-50)', border: 'var(--kim-200)' },
  'Tiệc':      { color: 'var(--son-700)', bg: 'var(--son-50)', border: 'var(--son-200)' },
  'Di chuyển': { color: 'var(--ink-600)', bg: 'var(--sand)',   border: 'var(--line-200)' },
};

function TlTag({ tag }) {
  const s = TAG_S[tag] || TAG_S['Di chuyển'];
  return (
    <span style={{ fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
      color: s.color, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 999, padding: '2px 8px' }}>{tag}</span>
  );
}

const PH_ST = {
  done:     { dot: 'var(--sage-500)', text: 'var(--ink-400)', line: 'var(--sage-200)' },
  current:  { dot: 'var(--son-500)',  text: 'var(--son-700)', line: 'var(--son-200)'  },
  upcoming: { dot: 'var(--line-300)', text: 'var(--ink-600)', line: 'var(--line-200)' },
};

/* ── Bottom sheet: add milestone to day-of rundown ─────────── */
function TlAddSheet({ open, onClose, onAdd, suggestTime }) {
  const [name, setName] = useState('');
  const [time, setTime] = useState(suggestTime || '14:00');
  const [tag, setTag] = useState('Tiệc');
  const [err, setErr] = useState(false);

  const bump = (mins) => {
    const [h, m] = time.split(':').map(Number);
    let t = h * 60 + m + mins;
    t = Math.max(0, Math.min(23 * 60 + 55, t));
    setTime(String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'));
  };

  const submit = () => {
    if (!name.trim()) { setErr(true); return; }
    onAdd({ name: name.trim(), time, tag });
    onClose();
  };

  const lbl = { fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
    textTransform: 'uppercase', color: 'var(--ink-500)', display: 'block', marginBottom: 7 };

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 300, pointerEvents: open ? 'all' : 'none' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(43,36,32,0.38)',
        opacity: open ? 1 : 0, transition: 'opacity .22s ease' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: 'var(--paper)',
        borderRadius: '22px 22px 0 0', boxShadow: '0 -12px 40px rgba(80,50,40,0.18)',
        transform: open ? 'translateY(0)' : 'translateY(104%)', opacity: open ? 1 : 0,
        transition: 'transform .28s cubic-bezier(.2,.7,.3,1), opacity .28s ease',
        padding: '10px 18px 30px' }}>
        <div style={{ width: 36, height: 4, borderRadius: 999, background: 'var(--line-300)', margin: '0 auto 14px' }} />
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 600, color: 'var(--ink-900)', flex: 1 }}>Thêm mốc</div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--line-100)',
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="x" size={15} color="var(--ink-500)" sw={2.2} />
          </button>
        </div>
        <label style={lbl}>Tên mốc</label>
        <input value={name}
          onChange={(e) => { setName(e.target.value); if (err) setErr(false); }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="VD: Cắt bánh cưới"
          style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--ink-900)',
            background: 'var(--card)', borderRadius: 'var(--r-md)', padding: '11px 14px', outline: 'none', boxSizing: 'border-box',
            border: `1px solid ${err ? 'var(--danger-500)' : 'var(--line-200)'}` }} />
        {err && <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11.5, color: 'var(--danger-500)', marginTop: 5 }}>Nhập tên mốc trước nhé</div>}
        {!name && !err && (
          <button onClick={() => { setName('Cắt bánh & rót rượu'); setTag('Tiệc'); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, cursor: 'pointer',
              fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 600, color: 'var(--kim-700)',
              background: 'var(--kim-50)', border: '1px solid var(--kim-200)', borderRadius: 'var(--r-pill)', padding: '6px 12px' }}>
            Mẫu nhanh: Cắt bánh & rót rượu
          </button>
        )}
        <label style={{ ...lbl, marginTop: 18 }}>Giờ</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => bump(-15)} style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--card)',
            border: '1px solid var(--line-200)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="minus" size={16} color="var(--ink-700)" sw={2.2} />
          </button>
          <div style={{ flex: 1, textAlign: 'center', fontFamily: 'var(--font-ui)', fontSize: 26, fontWeight: 700,
            fontVariantNumeric: 'tabular-nums', color: 'var(--ink-900)', background: 'var(--card)',
            border: '1px solid var(--line-200)', borderRadius: 'var(--r-md)', padding: '8px 0' }}>{time}</div>
          <button onClick={() => bump(15)} style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--card)',
            border: '1px solid var(--line-200)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="plus" size={16} color="var(--ink-700)" sw={2.2} />
          </button>
        </div>
        <label style={{ ...lbl, marginTop: 18 }}>Loại</label>
        <div style={{ display: 'flex', gap: 7 }}>
          {['Lễ', 'Tiệc', 'Di chuyển'].map((t) => {
            const on = tag === t;
            return (
              <button key={t} onClick={() => setTag(t)} style={{ flex: 1, fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600,
                color: on ? 'var(--fg-on-primary)' : 'var(--ink-700)', background: on ? 'var(--son-500)' : 'var(--card)',
                border: `1px solid ${on ? 'var(--son-500)' : 'var(--line-200)'}`, borderRadius: 'var(--r-pill)',
                padding: '9px 0', cursor: 'pointer', transition: 'all .15s ease' }}>{t}</button>
            );
          })}
        </div>
        <button onClick={submit} style={{ width: '100%', marginTop: 22, fontFamily: 'var(--font-ui)', fontSize: 14.5, fontWeight: 700,
          color: 'var(--fg-on-primary)', background: 'var(--son-500)', border: 'none', borderRadius: 'var(--r-pill)',
          padding: '13px 0', cursor: 'pointer', boxShadow: 'var(--shadow-rose)' }}>Thêm vào timeline</button>
      </div>
    </div>
  );
}

/* ── Bottom sheet: add task to prep tab ─────────────────────── */
function TlAddTaskSheet({ open, onClose, onAdd, phases }) {
  const selectable = phases.filter((p) => p.status !== 'done');
  const defaultPhase = (selectable.find((p) => p.status === 'current') || selectable[0] || {}).id;
  const [text, setText] = useState('');
  const [phaseId, setPhaseId] = useState(defaultPhase);
  const [err, setErr] = useState(false);

  const submit = () => {
    if (!text.trim()) { setErr(true); return; }
    onAdd({ text: text.trim(), phaseId });
    onClose();
  };

  const lbl = { fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
    textTransform: 'uppercase', color: 'var(--ink-500)', display: 'block', marginBottom: 7 };

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 300, pointerEvents: open ? 'all' : 'none' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(43,36,32,0.38)',
        opacity: open ? 1 : 0, transition: 'opacity .22s ease' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: 'var(--paper)',
        borderRadius: '22px 22px 0 0', boxShadow: '0 -12px 40px rgba(80,50,40,0.18)',
        transform: open ? 'translateY(0)' : 'translateY(104%)', opacity: open ? 1 : 0,
        transition: 'transform .28s cubic-bezier(.2,.7,.3,1), opacity .28s ease',
        padding: '10px 18px 30px' }}>
        <div style={{ width: 36, height: 4, borderRadius: 999, background: 'var(--line-300)', margin: '0 auto 14px' }} />
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 600, color: 'var(--ink-900)', flex: 1 }}>Thêm việc</div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--line-100)',
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="x" size={15} color="var(--ink-500)" sw={2.2} />
          </button>
        </div>
        <label style={lbl}>Tên việc</label>
        <input value={text}
          onChange={(e) => { setText(e.target.value); if (err) setErr(false); }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="VD: Chốt số bàn với nhà hàng"
          style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--ink-900)',
            background: 'var(--card)', borderRadius: 'var(--r-md)', padding: '11px 14px', outline: 'none', boxSizing: 'border-box',
            border: `1px solid ${err ? 'var(--danger-500)' : 'var(--line-200)'}` }} />
        {err && <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11.5, color: 'var(--danger-500)', marginTop: 5 }}>Nhập tên việc trước nhé</div>}
        {!text && !err && (
          <button onClick={() => setText('Chốt số bàn với nhà hàng')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, cursor: 'pointer',
              fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 600, color: 'var(--kim-700)',
              background: 'var(--kim-50)', border: '1px solid var(--kim-200)', borderRadius: 'var(--r-pill)', padding: '6px 12px' }}>
            Mẫu nhanh: Chốt số bàn với nhà hàng
          </button>
        )}
        <label style={{ ...lbl, marginTop: 18 }}>Giai đoạn</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {selectable.map((p) => {
            const on = phaseId === p.id;
            const isCurrent = p.status === 'current';
            return (
              <button key={p.id} onClick={() => setPhaseId(p.id)} style={{ display: 'flex', alignItems: 'center', gap: 10,
                padding: '11px 14px', textAlign: 'left', cursor: 'pointer', transition: 'all .15s ease',
                background: on ? 'var(--son-50)' : 'var(--card)',
                border: `1.5px solid ${on ? 'var(--son-400)' : 'var(--line-200)'}`, borderRadius: 'var(--r-md)' }}>
                <span style={{ width: 14, height: 14, borderRadius: '50%', flexShrink: 0, boxSizing: 'border-box',
                  background: on ? 'var(--son-500)' : 'var(--card)',
                  border: `2px solid ${on ? 'var(--son-500)' : 'var(--line-300)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {on && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }} />}
                </span>
                <span style={{ flex: 1, fontFamily: 'var(--font-ui)', fontSize: 13.5, fontWeight: on ? 700 : 500,
                  color: on ? 'var(--son-700)' : 'var(--ink-700)' }}>{p.label}</span>
                {isCurrent && (
                  <span style={{ fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 700, color: 'var(--son-600)',
                    background: 'var(--son-50)', border: '1px solid var(--son-200)', borderRadius: 999, padding: '2px 8px' }}>Đang làm</span>
                )}
              </button>
            );
          })}
        </div>
        <button onClick={submit} style={{ width: '100%', marginTop: 22, fontFamily: 'var(--font-ui)', fontSize: 14.5, fontWeight: 700,
          color: 'var(--fg-on-primary)', background: 'var(--son-500)', border: 'none', borderRadius: 'var(--r-pill)',
          padding: '13px 0', cursor: 'pointer', boxShadow: 'var(--shadow-rose)' }}>Thêm vào kế hoạch</button>
      </div>
    </div>
  );
}

function TlPrepTab({ phases, onToggle, onAdd }) {
  const currentPhase = phases.find((p) => p.status === 'current');
  const pendingCount = currentPhase ? currentPhase.tasks.filter((t) => !t.done).length : 0;
  return (
    <div style={{ padding: '8px 0 24px' }}>
      {pendingCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 13px', background: 'var(--son-50)',
          border: '1px solid var(--son-200)', borderRadius: 'var(--r-md)', margin: '0 0 16px' }}>
          <Avatar size={26} />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13.5, color: 'var(--son-700)', flex: 1, lineHeight: 1.45 }}>
            <b>{pendingCount} việc</b> trong giai đoạn hiện tại.
          </span>
        </div>
      )}
      {phases.map((ph, pi) => {
        const s = PH_ST[ph.status] || PH_ST.upcoming;
        const doneN = ph.tasks.filter((t) => t.done).length;
        const isCurrent = ph.status === 'current';
        return (
          <div key={ph.id} style={{ display: 'flex', gap: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 28, flexShrink: 0 }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', marginTop: 2, flexShrink: 0,
                background: ph.status === 'done' ? s.dot : 'var(--card)',
                border: `2.5px solid ${s.dot}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {ph.status === 'done' && <Icon name="check" size={8} color="#fff" sw={3} />}
                {ph.status === 'current' && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--son-500)' }} />}
              </div>
              {pi < phases.length - 1 && <div style={{ flex: 1, width: 2, background: s.line, minHeight: 20, marginBottom: -2 }} />}
            </div>
            <div style={{ flex: 1, paddingLeft: 12, paddingBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 700, color: s.text, letterSpacing: '0.02em' }}>{ph.label}</span>
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 10.5, color: 'var(--ink-400)' }}>{doneN}/{ph.tasks.length}</span>
                {isCurrent && (
                  <span style={{ fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 700, color: 'var(--son-600)', background: 'var(--son-50)', borderRadius: 999, padding: '2px 8px' }}>Đang làm</span>
                )}
              </div>
              <div style={{ background: isCurrent ? 'var(--son-50)' : 'transparent', border: isCurrent ? '1px solid var(--son-100)' : 'none',
                borderRadius: 'var(--r-md)', padding: isCurrent ? '6px 12px' : 0 }}>
                {ph.tasks.map((t, ti) => (
                  <button key={t.id} onClick={() => onToggle(ph.id, t.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 0', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
                    borderBottom: ti < ph.tasks.length - 1 ? '1px solid var(--line-100)' : 'none' }}>
                    <span style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: t.done ? 'var(--sage-500)' : 'var(--card)',
                      border: `2px solid ${t.done ? 'var(--sage-500)' : 'var(--line-300)'}` }}>
                      {t.done && <Icon name="check" size={11} color="#fff" sw={3} />}
                    </span>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 13.5,
                      color: t.done ? 'var(--ink-400)' : 'var(--ink-900)',
                      textDecoration: t.done ? 'line-through' : 'none' }}>{t.text}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      })}
      <button onClick={onAdd} style={{ width: '100%', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        fontFamily: 'var(--font-ui)', fontSize: 13.5, fontWeight: 600, color: 'var(--son-600)',
        background: 'transparent', border: '1.5px dashed var(--son-200)', borderRadius: 'var(--r-md)', padding: '11px 0', cursor: 'pointer' }}>
        <Icon name="plus" size={16} color="var(--son-600)" /> Thêm việc
      </button>
    </div>
  );
}

function TlAiSuggestions({ suggestions, onAccept, onDismiss }) {
  if (!suggestions.length) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
      {suggestions.map((suggestion) => (
        <div key={suggestion.id} style={{ position: 'relative', borderRadius: 'var(--r-md)', background: 'var(--kim-50)',
          border: '1px solid var(--kim-200)', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'linear-gradient(var(--kim-400),var(--son-400))' }} />
          <div style={{ padding: '10px 12px 11px 14px' }}>
            <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
              <Icon name="sparkles" size={14} color="var(--kim-600)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--kim-700)', marginBottom: 3 }}>Tơ Hồng AI gợi ý</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13.5, fontWeight: 600, color: 'var(--ink-900)' }}>
                  {suggestion.time} · {suggestion.label}
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-900)', lineHeight: 1.45 }}>
                  {suggestion.reason}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 7, marginTop: 9, marginLeft: 21 }}>
              <button onClick={() => onDismiss(suggestion.id)} style={{ fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 600, color: 'var(--ink-500)',
                background: 'var(--card)', border: '1px solid var(--line-300)', borderRadius: 'var(--r-pill)', padding: '6px 12px', cursor: 'pointer' }}>Bỏ qua</button>
              <button onClick={() => onAccept(suggestion)} style={{ fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 600, color: 'var(--fg-on-primary)',
                background: 'var(--son-500)', border: 'none', borderRadius: 'var(--r-pill)', padding: '6px 14px', cursor: 'pointer' }}>Thêm vào lịch</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TlDayTab({ rundown, suggestions, onToggle, onAdd, onAcceptSuggestion, onDismissSuggestion }) {
  const doneN = rundown.filter((r) => r.done).length;
  return (
    <div style={{ padding: '12px 0 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, height: 5, borderRadius: 999, background: 'var(--line-100)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: (rundown.length ? (doneN / rundown.length) * 100 : 0) + '%', background: 'var(--son-500)', transition: 'width .25s ease' }} />
        </div>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--ink-400)', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{doneN}/{rundown.length} mốc</span>
      </div>
      {rundown.map((r, i) => (
        <div key={r.id}>
          <div style={{ display: 'flex', alignItems: 'stretch' }}>
            <div style={{ width: 46, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingRight: 10, paddingTop: 2 }}>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1,
                color: r.done ? 'var(--ink-400)' : 'var(--ink-900)' }}>{r.time}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20, flexShrink: 0 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                background: r.done ? 'var(--son-500)' : 'var(--card)',
                border: `2.5px solid ${r.done ? 'var(--son-500)' : i === doneN ? 'var(--son-400)' : 'var(--line-300)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {r.done && <Icon name="check" size={8} color="#fff" sw={3} />}
                {i === doneN && !r.done && <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--son-400)' }} />}
              </div>
              {i < rundown.length - 1 && <div style={{ flex: 1, width: 2, minHeight: 20, background: r.done ? 'var(--son-200)' : 'var(--line-200)' }} />}
            </div>
            <div style={{ flex: 1, paddingLeft: 10, paddingBottom: 14 }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, marginBottom: 5,
                color: r.done ? 'var(--ink-400)' : 'var(--ink-900)', textDecoration: r.done ? 'line-through' : 'none' }}>{r.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TlTag tag={r.tag} />
                <span style={{ flex: 1 }} />
                <button onClick={() => onToggle(r.id)} style={{ width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', padding: 0,
                  background: r.done ? 'var(--son-500)' : 'var(--card)',
                  border: `2px solid ${r.done ? 'var(--son-500)' : 'var(--line-300)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {r.done && <Icon name="check" size={13} color="#fff" sw={2.5} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
      {rundown.length === 0 && (
        <div style={{ padding: '24px 16px', textAlign: 'center', border: '1px dashed var(--line-200)', borderRadius: 'var(--r-md)',
          fontFamily: 'var(--font-body)', fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink-500)' }}>
          Chưa có mốc ngày cưới. Thêm mốc đầu tiên để Tơ Hồng có dữ liệu phân tích.
        </div>
      )}
      <TlAiSuggestions suggestions={suggestions} onAccept={onAcceptSuggestion} onDismiss={onDismissSuggestion} />
      <button onClick={onAdd} style={{ width: '100%', marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        fontFamily: 'var(--font-ui)', fontSize: 13.5, fontWeight: 600, color: 'var(--son-600)',
        background: 'transparent', border: '1.5px dashed var(--son-200)', borderRadius: 'var(--r-md)', padding: '11px 0', cursor: 'pointer' }}>
        <Icon name="plus" size={16} color="var(--son-600)" /> Thêm mốc
      </button>
    </div>
  );
}

export function ScreenTimeline({ coupleId = null, onMenuOpen = () => {} }) {
  const [tab, setTab] = useState('prep');
  const [phases, setPhases] = useState(EMPTY_PHASES);
  const [rundown, setRundown] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [wedding, setWedding] = useState({ date: null, daysLeft: null });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [taskSheetOpen, setTaskSheetOpen] = useState(false);
  const saveTimer = useRef(null);

  const lastTime = rundown.length ? (rundown[rundown.length - 1].time ?? '13:30') : '13:30';
  const suggestTime = (() => {
    const [h, m] = lastTime.split(':').map(Number);
    const t = Math.min(23 * 60 + 55, h * 60 + m + 30);
    return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
  })();

  // Load timeline data + AI suggestions on mount.
  // If the timeline has never been saved (updated_at === null) and we know the wedding date,
  // auto-generate the appropriate checklist template and save it.
  useEffect(() => {
    if (!coupleId) return;
    let cancelled = false;
    Promise.all([api.getTimeline(coupleId), api.getSummary(coupleId)])
      .then(async ([data, summary]) => {
        if (cancelled) return;
        const daysLeft = summary?.days_left ?? null;
        setWedding({
          date: summary?.profile?.wedding_date || null,
          daysLeft,
        });

        if (!data?.updated_at && daysLeft != null) {
          // First load after onboarding — generate template from wedding date
          const { phases: initPhases, rundown: initRundown } = buildTemplate(daysLeft);
          setPhases(initPhases);
          setRundown(initRundown);
          api.putTimeline(coupleId, { phases: initPhases, rundown: initRundown }).catch(() => {});
        } else {
          if (data?.phases) setPhases(data.phases);
          if (data?.rundown) setRundown(data.rundown);
          if (data?.rundown?.length) {
            try {
              const result = await api.getTimelineSuggestions(coupleId);
              if (!cancelled && result?.source === 'ai') setSuggestions(result.suggestions || []);
            } catch {
              if (!cancelled) setSuggestions([]);
            }
          }
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [coupleId]);

  const scheduleSave = (nextPhases, nextRundown) => {
    if (!coupleId) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      api.putTimeline(coupleId, { phases: nextPhases, rundown: nextRundown })
        .catch(() => {});
    }, 800);
  };

  const addTask = ({ text, phaseId }) => {
    setPhases((ps) => {
      const next = ps.map((p) =>
        p.id === phaseId ? { ...p, tasks: [...p.tasks, { id: 'pt' + Date.now(), text, done: false }] } : p
      );
      scheduleSave(next, rundown);
      return next;
    });
  };

  const addMilestone = ({ name, time, tag }) => {
    setRundown((rs) => {
      const next = [...rs, { id: 'r' + Date.now(), time, name, tag, done: false }];
      next.sort((a, b) => a.time.localeCompare(b.time));
      scheduleSave(phases, next);
      return next;
    });
  };

  const acceptSuggestion = (suggestion) => {
    addMilestone({ name: suggestion.label, time: suggestion.time, tag: suggestion.tag || 'Tiệc' });
    setSuggestions((items) => items.filter((item) => item.id !== suggestion.id));
  };

  const togglePrep = (phId, tId) => {
    setPhases((ps) => {
      const phase = ps.find((p) => p.id === phId);
      const task = phase?.tasks.find((t) => t.id === tId);
      const next = ps.map((p) =>
        p.id === phId ? { ...p, tasks: p.tasks.map((t) => t.id === tId ? { ...t, done: !t.done } : t) } : p
      );
      track('checklist_task_toggled', { journey: 'checklist', phase_id: phId, task_id: tId, done: !task?.done, phase_status: phase?.status });
      scheduleSave(next, rundown);
      return next;
    });
  };

  const toggleRun = (id) => {
    setRundown((rs) => {
      const item = rs.find((r) => r.id === id);
      const next = rs.map((r) => r.id === id ? { ...r, done: !r.done } : r);
      track('rundown_item_toggled', { journey: 'checklist', item_id: id, done: !item?.done, tag: item?.tag });
      scheduleSave(phases, next);
      return next;
    });
  };

  const allTasks = phases.flatMap((p) => p.tasks);
  const donePrep = allTasks.filter((t) => t.done).length;
  const weddingLabel = wedding.date
    ? String(wedding.date).split('T')[0].split('-').slice(1).reverse().join('.')
    : null;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--paper)', position: 'relative', overflow: 'hidden' }}>
      {/* header */}
      <div style={{ flexShrink: 0, background: 'rgba(252,248,243,0.96)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--line-100)', padding: 'var(--header-pt) 16px 13px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <button onClick={onMenuOpen} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexShrink: 0 }}>
            <Icon name="chevron-left" size={24} color="var(--ink-700)" />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--ink-900)', lineHeight: 1.1 }}>Timeline</div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11.5, color: 'var(--ink-500)', marginTop: 1 }}>
              {donePrep}/{allTasks.length} việc xong{wedding.daysLeft != null ? ` · còn ${wedding.daysLeft} ngày` : ''}
            </div>
          </div>
          {weddingLabel && <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--son-50)', border: '1px solid var(--son-200)', borderRadius: 'var(--r-pill)', padding: '5px 11px' }}>
            <Icon name="calendar-heart" size={14} color="var(--son-500)" />
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 700, color: 'var(--son-600)' }}>{weddingLabel}</span>
          </div>}
        </div>
        <div style={{ display: 'flex', background: 'var(--line-100)', borderRadius: 11, padding: 3, gap: 2 }}>
          {[['prep', 'Chuẩn bị'], ['day', weddingLabel ? `Ngày cưới ${weddingLabel}` : 'Ngày cưới']].map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)} style={{ flex: 1, fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600,
              color: tab === v ? 'var(--ink-900)' : 'var(--ink-500)', background: tab === v ? 'var(--card)' : 'transparent',
              border: 'none', borderRadius: 8, padding: '7px 0', cursor: 'pointer',
              boxShadow: tab === v ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all .15s ease' }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
        {tab === 'prep'
          ? <TlPrepTab phases={phases} onToggle={togglePrep} onAdd={() => setTaskSheetOpen(true)} />
          : <TlDayTab
              rundown={rundown}
              suggestions={suggestions}
              onToggle={toggleRun}
              onAdd={() => setSheetOpen(true)}
              onAcceptSuggestion={acceptSuggestion}
              onDismissSuggestion={(id) => setSuggestions((items) => items.filter((item) => item.id !== id))}
            />}
      </div>

      <TlAddSheet key={`milestone-${sheetOpen}-${suggestTime}`} open={sheetOpen} onClose={() => setSheetOpen(false)} onAdd={addMilestone} suggestTime={suggestTime} />
      <TlAddTaskSheet key={`task-${taskSheetOpen}`} open={taskSheetOpen} onClose={() => setTaskSheetOpen(false)} onAdd={addTask} phases={phases} />
    </div>
  );
}

export default ScreenTimeline;
