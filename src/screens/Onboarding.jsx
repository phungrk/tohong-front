import { useState, useEffect } from 'react';
import { Icon } from '../ui/Icon.jsx';
import { ThreadMark } from '../ui/atoms.jsx';

const OB_REGIONS = ['Bắc', 'Trung', 'Nam'];
const OB_QUICK_CITIES = ['TP.HCM', 'Hà Nội', 'Đà Nẵng'];
const OB_OTHER_CITIES = [
  'Hải Phòng', 'Cần Thơ', 'Huế', 'Nha Trang', 'Đà Lạt', 'Vũng Tàu',
  'Biên Hòa', 'Quy Nhơn', 'Hạ Long', 'Bắc Ninh', 'Hải Dương', 'Vinh',
  'Buôn Ma Thuột', 'Thái Nguyên', 'Nam Định', 'Phan Thiết', 'Mỹ Tho', 'Rạch Giá',
];
const OB_GUESTS  = [80, 120, 150, 200, 300, 500];
const OB_BUDGETS = [
  { label: '200tr', val: 200 }, { label: '300tr', val: 300 },
  { label: '500tr', val: 500 }, { label: '700tr', val: 700 },
  { label: '1 tỷ+', val: 1000 },
];

function getUpcomingMonths() {
  const now = new Date();
  const S = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];
  return Array.from({ length: 10 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i + 2, 1);
    return { label: `${S[d.getMonth()]}·${d.getFullYear()}`, m: d.getMonth() + 1, y: d.getFullYear() };
  });
}

const OB_MONTHS = getUpcomingMonths();

const OB_DEFAULTS = {
  brideName: '', groomName: '',
  brideRegion: 'Nam', groomRegion: 'Bắc',
  weddingM: 12, weddingY: new Date().getFullYear() + 1,
  city: 'TP.HCM', guests: 200, budget: 500,
};

function obPill(on) {
  return {
    fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: on ? 700 : 500,
    color: on ? '#fff' : 'var(--ink-700)',
    background: on ? 'var(--son-500)' : 'var(--card)',
    border: `1.5px solid ${on ? 'var(--son-500)' : 'var(--line-200)'}`,
    borderRadius: 'var(--r-pill)', padding: '8px 16px',
    cursor: 'pointer', transition: 'all .13s ease',
    boxShadow: on ? '0 2px 8px rgba(168,50,70,.3)' : 'none', whiteSpace: 'nowrap',
  };
}

function OBPills({ opts, val, onPick, getVal = (o) => o, getLabel = (o) => String(o) }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
      {opts.map((o, i) => {
        const v = getVal(o);
        return <button key={i} onClick={() => onPick(v)} style={obPill(val === v)}>{getLabel(o)}</button>;
      })}
    </div>
  );
}

function OBMonthRow({ weddingM, weddingY, set }) {
  return (
    <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 4 }}>
      {OB_MONTHS.map((mo, i) => {
        const on = weddingM === mo.m && weddingY === mo.y;
        return (
          <button key={i} onClick={() => { set('weddingM', mo.m); set('weddingY', mo.y); }} style={{
            flexShrink: 0, fontFamily: 'var(--font-ui)', fontSize: 12.5, fontWeight: on ? 700 : 500,
            color: on ? '#fff' : 'var(--ink-700)',
            background: on ? 'var(--son-500)' : 'var(--card)',
            border: `1.5px solid ${on ? 'var(--son-500)' : 'var(--line-200)'}`,
            borderRadius: 'var(--r-md)', padding: '8px 13px',
            cursor: 'pointer', transition: 'all .13s ease',
            boxShadow: on ? '0 2px 8px rgba(168,50,70,.3)' : 'none',
          }}>
            {mo.label}
          </button>
        );
      })}
    </div>
  );
}

function OBCityPicker({ city, set }) {
  const isOther = !OB_QUICK_CITIES.includes(city);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, alignItems: 'center' }}>
      {OB_QUICK_CITIES.map((c, i) => (
        <button key={i} onClick={() => set('city', c)} style={obPill(city === c)}>{c}</button>
      ))}
      <div style={{ position: 'relative', display: 'inline-flex' }}>
        <select value={isOther ? city : ''} onChange={(e) => set('city', e.target.value)}
          style={{
            appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none',
            fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: isOther ? 700 : 500,
            color: isOther ? '#fff' : 'var(--ink-500)',
            background: isOther ? 'var(--son-500)' : 'var(--card)',
            border: `1.5px solid ${isOther ? 'var(--son-500)' : 'var(--line-200)'}`,
            borderRadius: 'var(--r-pill)', padding: '8px 34px 8px 16px',
            cursor: 'pointer', outline: 'none', transition: 'all .13s ease',
            boxShadow: isOther ? '0 2px 8px rgba(168,50,70,.3)' : 'none',
            minHeight: 'unset',
          }}>
          <option value="" disabled>Tỉnh / TP khác…</option>
          {OB_OTHER_CITIES.map((c, i) => <option key={i} value={c}>{c}</option>)}
        </select>
        <span style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)',
          pointerEvents: 'none', display: 'flex' }}>
          <Icon name="chevron-down" size={14} color={isOther ? '#fff' : 'var(--ink-400)'} sw={2.2} />
        </span>
      </div>
    </div>
  );
}

function OBSection({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10.5, fontWeight: 700,
        letterSpacing: '0.11em', textTransform: 'uppercase', color: 'var(--ink-400)' }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function OBPerson({ icon, label, name, onName, namePh, region, onRegion }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <span style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          background: 'var(--son-50)', border: '1px solid var(--son-100)',
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={14} color="var(--son-500)" sw={2} />
        </span>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13.5, fontWeight: 700, color: 'var(--ink-900)' }}>
          {label}
        </span>
      </div>
      <input value={name} onChange={(e) => onName(e.target.value)} placeholder={namePh}
        style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--ink-900)',
          background: 'var(--card)', border: '1.5px solid var(--line-200)',
          borderRadius: 'var(--r-md)', padding: '10px 14px', outline: 'none', boxSizing: 'border-box',
          minHeight: 'unset' }} />
      <OBSection label="Vùng quê">
        <OBPills opts={OB_REGIONS} val={region} onPick={onRegion} />
      </OBSection>
    </div>
  );
}

function OBProgress({ step }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center', padding: '2px 0 8px' }}>
      {[1, 2].map((s) => (
        <span key={s} style={{
          width: step === s ? 22 : 7, height: 7, borderRadius: 999,
          background: step >= s ? 'var(--son-500)' : 'var(--line-200)',
          transition: 'all .25s ease' }} />
      ))}
    </div>
  );
}

/* ════════ STEP 1 ════════ */
function OBStep1({ data, set, onNext }) {
  const ready = data.brideName.trim() && data.groomName.trim();
  return (
    <>
      <div style={{ flexShrink: 0, padding: '2px 20px 14px' }}>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 700,
          letterSpacing: '0.13em', textTransform: 'uppercase', color: 'var(--ink-400)', marginBottom: 4 }}>
          BƯỚC 1 / 2
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--ink-900)', lineHeight: 1.15 }}>
          Thông tin cặp đôi
        </div>
      </div>
      <div style={{ height: 1, background: 'var(--line-100)', flexShrink: 0 }} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <OBPerson icon="flower" label="Cô dâu"
          name={data.brideName} onName={(v) => set('brideName', v)} namePh="Tên cô dâu"
          region={data.brideRegion} onRegion={(v) => set('brideRegion', v)} />
        <div style={{ height: 1, background: 'var(--line-100)' }} />
        <OBPerson icon="user-round" label="Chú rể"
          name={data.groomName} onName={(v) => set('groomName', v)} namePh="Tên chú rể"
          region={data.groomRegion} onRegion={(v) => set('groomRegion', v)} />
      </div>

      <div style={{ flexShrink: 0, borderTop: '1px solid var(--line-100)', padding: '12px 20px 20px' }}>
        {!ready && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 9 }}>
            <Icon name="info" size={12} color="var(--ink-400)" />
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11.5, color: 'var(--ink-400)' }}>
              Điền tên cô dâu &amp; chú rể để tiếp tục
            </span>
          </div>
        )}
        <button onClick={() => ready && onNext()} disabled={!ready}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontFamily: 'var(--font-ui)', fontSize: 15.5, fontWeight: 700,
            color: ready ? '#fff' : 'var(--ink-400)',
            background: ready ? 'var(--son-500)' : 'var(--line-200)',
            border: 'none', borderRadius: 'var(--r-pill)', padding: '14px 0',
            cursor: ready ? 'pointer' : 'not-allowed',
            boxShadow: ready ? '0 4px 18px rgba(168,50,70,.35)' : 'none',
            transition: 'all .18s ease' }}>
          Tiếp theo
          <Icon name="arrow-right" size={17} color={ready ? '#fff' : 'var(--ink-400)'} sw={2.2} />
        </button>
      </div>
    </>
  );
}

/* ════════ STEP 2 ════════ */
function OBStep2({ data, set, onBack, onFinish }) {
  return (
    <>
      <div style={{ flexShrink: 0, padding: '0 20px 14px', display: 'flex', alignItems: 'flex-end', gap: 2 }}>
        <button onClick={onBack}
          style={{ background: 'transparent', border: 'none', padding: '0 4px 5px 0',
            cursor: 'pointer', display: 'flex', alignSelf: 'flex-end' }}>
          {/* inline SVG — does not depend on lucide load timing */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
            stroke="var(--ink-600)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 700,
            letterSpacing: '0.13em', textTransform: 'uppercase', color: 'var(--ink-400)', marginBottom: 4 }}>
            BƯỚC 2 / 2
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--ink-900)', lineHeight: 1.15 }}>
            Kế hoạch đám cưới
          </div>
        </div>
      </div>
      <div style={{ height: 1, background: 'var(--line-100)', flexShrink: 0 }} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <OBSection label="Ngày cưới dự kiến">
          <OBMonthRow weddingM={data.weddingM} weddingY={data.weddingY} set={set} />
        </OBSection>
        <OBSection label="Tổ chức tại">
          <OBCityPicker city={data.city} set={set} />
        </OBSection>
        <OBSection label="Số khách dự kiến">
          <OBPills opts={OB_GUESTS} val={data.guests} onPick={(v) => set('guests', v)}
            getLabel={(v) => v >= 500 ? '500+' : String(v)} />
        </OBSection>
        <OBSection label="Ngân sách">
          <OBPills opts={OB_BUDGETS} val={data.budget} onPick={(v) => set('budget', v)}
            getVal={(o) => o.val} getLabel={(o) => o.label} />
        </OBSection>
      </div>

      <div style={{ flexShrink: 0, borderTop: '1px solid var(--line-100)', padding: '12px 20px 20px',
        display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button onClick={onFinish}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            fontFamily: 'var(--font-ui)', fontSize: 15.5, fontWeight: 700,
            color: '#fff', background: 'var(--son-500)',
            border: 'none', borderRadius: 'var(--r-pill)', padding: '14px 0', cursor: 'pointer',
            boxShadow: '0 4px 18px rgba(168,50,70,.35)' }}>
          <ThreadMark size={19} color="#fff" dot="#fff" />
          Bắt đầu!
        </button>
        <button onClick={onBack}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600, color: 'var(--ink-400)',
            background: 'transparent', border: 'none', padding: '3px 0', cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="var(--ink-400)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Quay lại bước 1
        </button>
      </div>
    </>
  );
}

/* ════════ MAIN OVERLAY ════════ */
export function ScreenOnboarding({ open, onDone }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({ ...OB_DEFAULTS });
  const [shown, setShown] = useState(false);
  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));

  useEffect(() => {
    let t;
    if (open) { t = setTimeout(() => setShown(true), 40); }
    else { setShown(false); }
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (open) { setStep(1); setData({ ...OB_DEFAULTS }); }
  }, [open]);

  const finish = () => {
    try { localStorage.setItem('th_user', JSON.stringify(data)); } catch (_) {}
    onDone(data);
  };

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 900, pointerEvents: open ? 'all' : 'none' }}>
      {/* dim backdrop — no onClick dismiss; both steps required */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(43,36,32,0.52)',
        opacity: shown ? 1 : 0, transition: 'opacity .26s ease' }} />

      {/* bottom sheet */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 76,
        background: 'var(--paper)', borderRadius: '22px 22px 0 0', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        transform: shown ? 'translateY(0)' : 'translateY(106%)',
        transition: 'transform .32s cubic-bezier(.15,.75,.28,1)' }}>

        <div style={{ flexShrink: 0, paddingTop: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
            <div style={{ width: 38, height: 4, borderRadius: 999, background: 'var(--line-300)' }} />
          </div>
          <OBProgress step={step} />
        </div>

        {step === 1
          ? <OBStep1 data={data} set={set} onNext={() => setStep(2)} />
          : <OBStep2 data={data} set={set} onBack={() => setStep(1)} onFinish={finish} />}
      </div>
    </div>
  );
}

export { OB_DEFAULTS };
export default ScreenOnboarding;
