/* Tơ Hồng — Onboarding
   Step 0 · Welcome
   Step 1 · Thông tin cặp đôi
   Step 2 · Kế hoạch đám cưới  (ngày + địa điểm + khách + ngân sách)
   Step 3a · Khám phá phong cách (grid)
   Step 3b · Kết quả */

import { useState, useEffect, useMemo } from 'react';
import { Icon } from '../ui/Icon.jsx';
import { ThreadMark } from '../ui/atoms.jsx';

/* ── constants ── */
const OB_QUICK_CITIES = ['TP.HCM', 'Hà Nội', 'Đà Nẵng'];
const OB_OTHER_CITIES = [
  'Hải Phòng','Cần Thơ','Huế','Nha Trang','Đà Lạt','Vũng Tàu',
  'Biên Hòa','Quy Nhơn','Hạ Long','Bắc Ninh','Hải Dương','Vinh',
  'Buôn Ma Thuột','Thái Nguyên','Nam Định','Phan Thiết','Mỹ Tho','Rạch Giá',
];
const OB_GUESTS  = [80, 120, 150, 200, 300, 500];
const OB_BUDGETS = [
  { label:'200 tr', val:200 }, { label:'300 tr', val:300 },
  { label:'500 tr', val:500 }, { label:'700 tr', val:700 },
  { label:'1 tỷ+', val:1000 },
];
const _OB_WED = (() => {
  const d = new Date(); d.setMonth(d.getMonth() + 9);
  return { d:d.getDate(), m:d.getMonth()+1, y:d.getFullYear() };
})();
export const OB_DEFAULTS = {
  userRole:'bride',
  brideName:'', groomName:'',
  weddingD:_OB_WED.d, weddingM:_OB_WED.m, weddingY:_OB_WED.y,
  city:'TP.HCM', guests:200, budget:500,
};

/* ── style quiz constants ── */
const PC_STYLES = {
  han:         { vi:'Phong cách Hàn',   desc:'Tone nhẹ, pastel, mơ màng' },
  luxury:      { vi:'Sang trọng',        desc:'Ballroom, đèn chùm, formal' },
  rustic:      { vi:'Mộc mạc',           desc:'Vintage, ngoại cảnh, lãng mạn' },
  natural:     { vi:'Tự nhiên',          desc:'Ánh sáng tự nhiên, sân vườn' },
  modern:      { vi:'Hiện đại tối giản', desc:'Clean, ít decor, tinh tế' },
  traditional: { vi:'Truyền thống',      desc:'Áo dài, nghi lễ, phong tục' },
};
const _U = (id, w=600, h=400) => `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&auto=format&q=78`;
const PC_GRID = [
  { id:'g1', img:_U('1583939003579-730e3918a45a'), label:'Lễ gia tiên · áo dài đỏ',      tags:{ traditional:3, luxury:1 } },
  { id:'g2', img:_U('1522673607200-164d1b6ce486'), label:'Backdrop pastel tông Hàn',       tags:{ han:3, modern:1 } },
  { id:'g3', img:_U('1519741497674-611481863552'), label:'Tiệc ballroom đèn chùm',         tags:{ luxury:3 } },
  { id:'g4', img:_U('1465495976277-4387d4b0e4a6'), label:'Đám cưới sân vườn ban ngày',     tags:{ natural:3, rustic:1 } },
  { id:'g5', img:_U('1511285560929-80b456fea0bc'), label:'Phóng sự ánh sáng tự nhiên',     tags:{ natural:2, modern:1 } },
  { id:'g6', img:_U('1530103862676-de8c9debad1d'), label:'Tiệc tối giản, ít hoa',          tags:{ modern:3 } },
  { id:'g7', img:_U('1520853504280-249b72dc947c'), label:'Ngoại cảnh vintage, hoa cỏ',     tags:{ rustic:3, natural:1 } },
  { id:'g8', img:_U('1606800052052-a08af7148866'), label:'Cổng hoa & tráp ăn hỏi',         tags:{ traditional:2, luxury:1 } },
  { id:'g9', img:_U('1519225421980-715cb0215aed'), label:'Concept tạp chí, high-fashion',  tags:{ modern:2, luxury:2 } },
];
const PC_GRAD = {
  han:'linear-gradient(135deg,#F0C7C7,#F8E1DF)',
  luxury:'linear-gradient(135deg,#E6CF93,#F3E7C7)',
  rustic:'linear-gradient(135deg,#E5C9A8,#F1E2CD)',
  natural:'linear-gradient(135deg,#D5DEC2,#ECEFDF)',
  modern:'linear-gradient(135deg,#E7DECE,#FBF6EE)',
  traditional:'linear-gradient(135deg,#DC8593,#EBB0BA)',
};
function pcDominant(tags) { return Object.keys(tags).sort((a,b) => tags[b]-tags[a])[0]; }

/* ══════════════════════════════════════════
   ATOMS
═══════════════════════════════════════════ */
function obPill(on) {
  return {
    fontFamily:'var(--font-ui)', fontSize:13, fontWeight:on ? 700 : 500,
    color:on ? '#fff' : 'var(--ink-700)',
    background:on ? 'var(--son-500)' : 'var(--card)',
    border:`1.5px solid ${on ? 'var(--son-500)' : 'var(--line-200)'}`,
    borderRadius:'var(--r-pill)', padding:'8px 16px',
    cursor:'pointer', transition:'all .13s ease',
    boxShadow:on ? '0 2px 8px rgba(168,50,70,.3)' : 'none', whiteSpace:'nowrap',
  };
}

function OBPills({ opts, val, onPick, getVal=(o)=>o, getLabel=(o)=>String(o) }) {
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
      {opts.map((o,i) => {
        const v = getVal(o);
        return <button key={i} onClick={() => onPick(v)} style={obPill(val===v)}>{getLabel(o)}</button>;
      })}
    </div>
  );
}

(function() {
  if (document.getElementById('ob-kf')) return;
  const s = document.createElement('style'); s.id = 'ob-kf';
  s.textContent = '@keyframes obDrift{from{opacity:0}to{opacity:1}}';
  document.head.appendChild(s);
}());
const OB_WEEKDAYS = ['CN','T2','T3','T4','T5','T6','T7'];
const OB_MONTH_SHORT = ['Th1','Th2','Th3','Th4','Th5','Th6','Th7','Th8','Th9','Th10','Th11','Th12'];
const pad2 = n => String(n).padStart(2, '0');

function buildCalendar(vy, vm) {
  const startDow = new Date(vy, vm-1, 1).getDay();
  const daysCur = new Date(vy, vm, 0).getDate();
  const daysPrev = new Date(vy, vm-1, 0).getDate();
  const cells = [];
  for (let i = startDow - 1; i >= 0; i--) cells.push({ day: daysPrev - i, cur: false });
  for (let d = 1; d <= daysCur; d++) cells.push({ day: d, cur: true });
  let next = 1;
  while (cells.length % 7 !== 0) cells.push({ day: next++, cur: false });
  while (cells.length < 42) cells.push({ day: next++, cur: false });
  return cells;
}

function OBCalendar({ initD, initM, initY, onCancel, onConfirm }) {
  const today = new Date();
  const [vm, setVm] = useState(initM);
  const [vy, setVy] = useState(initY);
  const [selD, setSelD] = useState(initD);
  const [selM, setSelM] = useState(initM);
  const [selY, setSelY] = useState(initY);

  const years = Array.from({ length: 6 }, (_, i) => today.getFullYear() + i);
  const stepMonth = dir => {
    let m = vm + dir, y = vy;
    if (m < 1) { m = 12; y--; } if (m > 12) { m = 1; y++; }
    setVm(m); setVy(y);
  };
  const cells = buildCalendar(vy, vm);
  const isToday = d => d===today.getDate() && vm===today.getMonth()+1 && vy===today.getFullYear();
  const isSel = d => d===selD && vm===selM && vy===selY;

  const chev = dir => (
    <button onClick={() => stepMonth(dir)} style={{ width:30, height:30, display:'flex', alignItems:'center',
      justifyContent:'center', background:'transparent', border:'none', cursor:'pointer', borderRadius:8, flexShrink:0 }}>
      <Icon name={dir<0?'chevron-left':'chevron-right'} size={18} color="var(--ink-500)" sw={2.2}/>
    </button>
  );
  const drumSel = (value, onChange, opts) => (
    <div style={{ position:'relative', display:'inline-flex' }}>
      <select value={value} onChange={e => onChange(Number(e.target.value))} style={{
        appearance:'none', WebkitAppearance:'none', MozAppearance:'none',
        fontFamily:'var(--font-ui)', fontSize:14.5, fontWeight:700, color:'var(--ink-900)',
        background:'var(--card)', border:'1.5px solid var(--line-200)', borderRadius:'var(--r-md)',
        padding:'7px 30px 7px 13px', cursor:'pointer', outline:'none',
        backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='%23A08070' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
        backgroundRepeat:'no-repeat', backgroundPosition:'right 9px center' }}>
        {opts.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
      </select>
    </div>
  );

  return (
    <div onClick={e => e.stopPropagation()} style={{ width:'100%', maxWidth:340, background:'var(--paper)',
      borderRadius:'var(--r-xl, 20px)', overflow:'hidden', boxShadow:'0 18px 50px rgba(80,40,30,.28)',
      border:'1px solid var(--line-100)' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:6, padding:'14px 12px 10px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:2 }}>
          {chev(-1)}
          {drumSel(vm, m => setVm(m), OB_MONTH_SHORT.map((l,i) => ({ v:i+1, label:l })))}
          {chev(1)}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:2 }}>
          <button onClick={() => setVy(y => y-1)} style={{ width:30, height:30, display:'flex', alignItems:'center',
            justifyContent:'center', background:'transparent', border:'none', cursor:'pointer' }}>
            <Icon name="chevron-left" size={18} color="var(--ink-500)" sw={2.2}/>
          </button>
          {drumSel(vy, y => setVy(y), years.map(y => ({ v:y, label:String(y) })))}
          <button onClick={() => setVy(y => y+1)} style={{ width:30, height:30, display:'flex', alignItems:'center',
            justifyContent:'center', background:'transparent', border:'none', cursor:'pointer' }}>
            <Icon name="chevron-right" size={18} color="var(--ink-500)" sw={2.2}/>
          </button>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', padding:'0 10px 4px' }}>
        {OB_WEEKDAYS.map((w,i) => (
          <div key={i} style={{ textAlign:'center', fontFamily:'var(--font-ui)', fontSize:11.5, fontWeight:700,
            color: i===0?'var(--son-500)':'var(--ink-400)', padding:'4px 0' }}>{w}</div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, padding:'0 10px 8px' }}>
        {cells.map((c,i) => {
          const sel = c.cur && isSel(c.day);
          const tdy = c.cur && isToday(c.day);
          return (
            <button key={i} disabled={!c.cur}
              onClick={() => c.cur && (setSelD(c.day), setSelM(vm), setSelY(vy))}
              style={{ height:38, display:'flex', alignItems:'center', justifyContent:'center',
                background:'transparent', border:'none', cursor:c.cur?'pointer':'default', padding:0 }}>
              <span style={{ width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center',
                borderRadius:'50%', fontFamily:'var(--font-ui)', fontSize:14,
                fontWeight: sel?700:(tdy?700:500),
                color: sel ? '#fff' : (!c.cur ? 'var(--ink-200)' : (tdy ? 'var(--son-600)' : 'var(--ink-800)')),
                background: sel ? 'var(--son-500)' : 'transparent',
                border: (tdy && !sel) ? '1.5px solid var(--son-400)' : '1.5px solid transparent',
                boxShadow: sel ? '0 2px 8px rgba(168,50,70,.3)' : 'none', transition:'all .1s ease' }}>
                {c.day}
              </span>
            </button>
          );
        })}
      </div>
      <div style={{ display:'flex', justifyContent:'flex-end', gap:6, padding:'8px 14px 14px',
        borderTop:'1px solid var(--line-100)' }}>
        <button onClick={onCancel} style={{ fontFamily:'var(--font-ui)', fontSize:13.5, fontWeight:600,
          color:'var(--ink-500)', background:'transparent', border:'none', cursor:'pointer', padding:'9px 16px', borderRadius:'var(--r-pill)' }}>
          Huỷ
        </button>
        <button onClick={() => onConfirm(selD, selM, selY)} style={{ fontFamily:'var(--font-ui)', fontSize:13.5, fontWeight:700,
          color:'#fff', background:'var(--son-500)', border:'none', cursor:'pointer', padding:'9px 20px',
          borderRadius:'var(--r-pill)', boxShadow:'0 2px 10px rgba(168,50,70,.3)' }}>
          Chọn
        </button>
      </div>
    </div>
  );
}

function OBDatePicker({ weddingD, weddingM, weddingY, set }) {
  const [open, setOpen] = useState(false);
  const hasVal = weddingD && weddingM && weddingY;
  const label = hasVal ? `${pad2(weddingD)}/${pad2(weddingM)}/${weddingY}` : 'dd/mm/yyyy';
  return (
    <>
      <button onClick={() => setOpen(true)} style={{ width:'100%', display:'flex', alignItems:'center',
        justifyContent:'space-between', gap:10, fontFamily:'var(--font-body)', fontSize:15,
        color: hasVal ? 'var(--ink-900)' : 'var(--ink-400)', background:'var(--card)',
        border:'1.5px solid var(--line-200)', borderRadius:'var(--r-md)', padding:'12px 14px',
        cursor:'pointer', outline:'none', boxSizing:'border-box', textAlign:'left' }}>
        <span style={{ fontVariantNumeric:'tabular-nums', letterSpacing:'.02em', fontWeight:hasVal?600:400 }}>{label}</span>
        <span style={{ width:30, height:30, borderRadius:'50%', flexShrink:0, background:'var(--son-50)',
          display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon name="calendar" size={16} color="var(--son-500)" sw={2}/>
        </span>
      </button>
      {open && (
        <div onClick={() => setOpen(false)} style={{ position:'absolute', inset:0, zIndex:80,
          display:'flex', alignItems:'center', justifyContent:'center', padding:'0 18px',
          background:'rgba(43,36,32,.4)', animation:'obDrift .18s ease both' }}>
          <OBCalendar
            initD={weddingD || _OB_WED.d} initM={weddingM || _OB_WED.m} initY={weddingY || _OB_WED.y}
            onCancel={() => setOpen(false)}
            onConfirm={(d,m,y) => { set('weddingD',d); set('weddingM',m); set('weddingY',y); setOpen(false); }}/>
        </div>
      )}
    </>
  );
}

function OBCityPicker({ city, set }) {
  const isOther = !OB_QUICK_CITIES.includes(city);
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:7, alignItems:'center' }}>
      {OB_QUICK_CITIES.map((c,i) => (
        <button key={i} onClick={() => set('city',c)} style={obPill(city===c)}>{c}</button>
      ))}
      <div style={{ position:'relative', display:'inline-flex' }}>
        <select value={isOther?city:''} onChange={e => set('city',e.target.value)}
          style={{
            appearance:'none', WebkitAppearance:'none', MozAppearance:'none',
            fontFamily:'var(--font-ui)', fontSize:13, fontWeight:isOther?700:500,
            color:isOther?'#fff':'var(--ink-500)',
            background:isOther?'var(--son-500)':'var(--card)',
            border:`1.5px solid ${isOther?'var(--son-500)':'var(--line-200)'}`,
            borderRadius:'var(--r-pill)', padding:'8px 34px 8px 16px',
            cursor:'pointer', outline:'none', transition:'all .13s ease',
            boxShadow:isOther?'0 2px 8px rgba(168,50,70,.3)':'none',
          }}>
          <option value="" disabled>Tỉnh / TP khác…</option>
          {OB_OTHER_CITIES.map((c,i) => <option key={i} value={c}>{c}</option>)}
        </select>
        <span style={{ position:'absolute', right:11, top:'50%', transform:'translateY(-50%)',
          pointerEvents:'none', display:'flex' }}>
          <Icon name="chevron-down" size={14} color={isOther?'#fff':'var(--ink-400)'} sw={2.2}/>
        </span>
      </div>
    </div>
  );
}

function OBSection({ label, icon, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, fontFamily:'var(--font-ui)', fontSize:10.5, fontWeight:700,
        letterSpacing:'0.11em', textTransform:'uppercase', color:'var(--ink-400)' }}>
        {icon && <Icon name={icon} size={13} color="var(--son-500)" sw={2}/>}
        {label}
      </div>
      {children}
    </div>
  );
}

function OBPerson({ icon, label, name, onName, namePh }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:11 }}>
      <div style={{ display:'flex', alignItems:'center', gap:9 }}>
        <span style={{ width:28, height:28, borderRadius:'50%', flexShrink:0,
          background:'var(--son-50)', border:'1px solid var(--son-100)',
          display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon name={icon} size={14} color="var(--son-500)" sw={2}/>
        </span>
        <span style={{ fontFamily:'var(--font-ui)', fontSize:13.5, fontWeight:700, color:'var(--ink-900)' }}>
          {label}
        </span>
      </div>
      <input value={name} onChange={e => onName(e.target.value)} placeholder={namePh} autoComplete="off"
        style={{ width:'100%', fontFamily:'var(--font-body)', fontSize:15, color:'var(--ink-900)',
          background:'var(--card)', border:'1.5px solid var(--line-200)',
          borderRadius:'var(--r-md)', padding:'10px 14px', outline:'none', boxSizing:'border-box' }}/>
    </div>
  );
}

function OBRoleSelector({ role, onPick }) {
  const opts = [
    { val:'bride', icon:'flower',     label:'Cô dâu' },
    { val:'groom', icon:'user-round', label:'Chú rể' },
  ];
  return (
    <OBSection label="Bạn là...">
      <div style={{ display:'flex', gap:10 }}>
        {opts.map(o => {
          const on = role===o.val;
          return (
            <button key={o.val} onClick={() => onPick(o.val)} style={{
              flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              fontFamily:'var(--font-ui)', fontSize:14, fontWeight:on?700:500,
              color:on?'#fff':'var(--ink-700)',
              background:on?'var(--son-500)':'var(--card)',
              border:`1.5px solid ${on?'var(--son-500)':'var(--line-200)'}`,
              borderRadius:'var(--r-md)', padding:'11px 0',
              cursor:'pointer', transition:'all .13s ease',
              boxShadow:on?'0 2px 10px rgba(168,50,70,.28)':'none',
            }}>
              <Icon name={o.icon} size={15} color={on?'#fff':'var(--ink-500)'} sw={2}/>{o.label}
            </button>
          );
        })}
      </div>
    </OBSection>
  );
}

function OBProgress({ step }) {
  const active = step==='grid'||step==='result' ? 3 : step;
  return (
    <div style={{ display:'flex', gap:6, alignItems:'center', justifyContent:'center', padding:'2px 0 8px' }}>
      {[1,2,3].map(s => (
        <span key={s} style={{
          width:active===s ? 22 : 7, height:7, borderRadius:999,
          background:active>=s ? 'var(--son-500)' : 'var(--line-200)',
          transition:'all .25s ease' }}/>
      ))}
    </div>
  );
}

const BackChevron = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="var(--ink-600)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

/* ══════════════════════════════════════════
   STEP 0 · Welcome
═══════════════════════════════════════════ */
function OBWelcome({ onStart }) {
  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'var(--paper)',
      padding:'0 26px', justifyContent:'center', textAlign:'center' }}>
      <div>
        <div style={{ width:64, height:64, borderRadius:'50%', margin:'0 auto 20px',
          background:'var(--son-50)', border:'1px solid var(--son-100)',
          display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon name="heart-handshake" size={28} color="var(--son-500)" sw={1.7}/>
        </div>
        <div style={{ fontFamily:'var(--font-ui)', fontSize:10.5, fontWeight:700, letterSpacing:'.14em',
          textTransform:'uppercase', color:'var(--kim-500)' }}>Chào mừng đến với Tơ Hồng</div>
        <div style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:600, color:'var(--ink-900)',
          lineHeight:1.18, margin:'10px 0 12px' }}>
          Cùng bắt đầu<br/>kế hoạch đám cưới
        </div>
        <div style={{ fontFamily:'var(--font-body)', fontSize:14.5, lineHeight:1.6, color:'var(--ink-500)' }}>
          Mình hỏi vài câu ngắn để hiểu đám cưới của hai bạn — rồi gợi ý vendor thật sự hợp. Chỉ khoảng 2 phút.
        </div>
        <div style={{ margin:'26px 0 0' }}>
          <button onClick={onStart} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:9,
            fontFamily:'var(--font-ui)', fontSize:15.5, fontWeight:700, color:'#fff', background:'var(--son-500)',
            border:'none', borderRadius:'var(--r-pill)', padding:'14px 0', cursor:'pointer',
            boxShadow:'0 4px 18px rgba(168,50,70,.35)' }}>
            Bắt đầu
            <Icon name="arrow-right" size={17} color="#fff" sw={2.2}/>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   STEP 1 · Couple info
═══════════════════════════════════════════ */
function OBStep1({ data, set, onNext }) {
  const ready = data.brideName.trim() && data.groomName.trim();
  return (
    <>
      <div style={{ flexShrink:0, padding:'2px 20px 14px' }}>
        <div style={{ fontFamily:'var(--font-ui)', fontSize:10, fontWeight:700,
          letterSpacing:'0.13em', textTransform:'uppercase', color:'var(--ink-400)', marginBottom:4 }}>
          BƯỚC 1 / 3
        </div>
        <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:600, color:'var(--ink-900)', lineHeight:1.15,
          display:'flex', alignItems:'center', gap:9 }}>
          <Icon name="heart-handshake" size={22} color="var(--son-500)" sw={1.9}/>
          Thông tin cặp đôi
        </div>
      </div>
      <div style={{ height:1, background:'var(--line-100)', flexShrink:0 }}/>

      <div style={{ flex:1, overflowY:'auto', padding:'18px 20px', display:'flex', flexDirection:'column', gap:18 }}>
        <OBRoleSelector role={data.userRole} onPick={v => set('userRole',v)}/>
        <div style={{ height:1, background:'var(--line-100)' }}/>
        <OBPerson icon="flower" label="Cô dâu"
          name={data.brideName} onName={v => set('brideName',v)} namePh="Tên cô dâu"/>
        <div style={{ height:1, background:'var(--line-100)' }}/>
        <OBPerson icon="user-round" label="Chú rể"
          name={data.groomName} onName={v => set('groomName',v)} namePh="Tên chú rể"/>
      </div>

      <div style={{ flexShrink:0, borderTop:'1px solid var(--line-100)', padding:'12px 20px 20px' }}>
        {!ready && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginBottom:9 }}>
            <Icon name="info" size={12} color="var(--ink-400)"/>
            <span style={{ fontFamily:'var(--font-ui)', fontSize:11.5, color:'var(--ink-400)' }}>
              Điền tên cô dâu &amp; chú rể để tiếp tục
            </span>
          </div>
        )}
        <button onClick={() => ready && onNext()} disabled={!ready}
          style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            fontFamily:'var(--font-ui)', fontSize:15.5, fontWeight:700,
            color:ready?'#fff':'var(--ink-400)',
            background:ready?'var(--son-500)':'var(--line-200)',
            border:'none', borderRadius:'var(--r-pill)', padding:'14px 0',
            cursor:ready?'pointer':'not-allowed',
            boxShadow:ready?'0 4px 18px rgba(168,50,70,.35)':'none',
            transition:'all .18s ease' }}>
          Tiếp theo
          <Icon name="arrow-right" size={17} color={ready?'#fff':'var(--ink-400)'} sw={2.2}/>
        </button>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════
   STEP 2 · Wedding plan
═══════════════════════════════════════════ */
function OBStep2({ data, set, onBack, onNext }) {
  return (
    <>
      <div style={{ flexShrink:0, padding:'0 20px 14px', display:'flex', alignItems:'flex-end', gap:2 }}>
        <button onClick={onBack}
          style={{ background:'transparent', border:'none', padding:'0 4px 5px 0',
            cursor:'pointer', display:'flex', alignSelf:'flex-end' }}>
          <BackChevron/>
        </button>
        <div>
          <div style={{ fontFamily:'var(--font-ui)', fontSize:10, fontWeight:700,
            letterSpacing:'0.13em', textTransform:'uppercase', color:'var(--ink-400)', marginBottom:4 }}>
            BƯỚC 2 / 3
          </div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:600, color:'var(--ink-900)', lineHeight:1.15,
            display:'flex', alignItems:'center', gap:9 }}>
            <Icon name="calendar-heart" size={22} color="var(--son-500)" sw={1.9}/>
            Kế hoạch đám cưới
          </div>
        </div>
      </div>
      <div style={{ height:1, background:'var(--line-100)', flexShrink:0 }}/>

      <div style={{ flex:1, overflowY:'auto', padding:'16px 20px', display:'flex', flexDirection:'column', gap:18 }}>
        <OBSection label="Ngày cưới dự kiến" icon="calendar-heart">
          <OBDatePicker weddingD={data.weddingD} weddingM={data.weddingM} weddingY={data.weddingY} set={set}/>
        </OBSection>
        <OBSection label="Tổ chức tại" icon="map-pin">
          <OBCityPicker city={data.city} set={set}/>
        </OBSection>
        <OBSection label="Ngân sách" icon="wallet">
          <OBPills opts={OB_BUDGETS} val={data.budget} onPick={v => set('budget',v)}
            getVal={o => o.val} getLabel={o => o.label}/>
        </OBSection>
        <OBSection label="Số khách dự kiến" icon="users-round">
          <OBPills opts={OB_GUESTS} val={data.guests} onPick={v => set('guests',v)}
            getLabel={v => v>=500?'500+':String(v)}/>
        </OBSection>
      </div>

      <div style={{ flexShrink:0, borderTop:'1px solid var(--line-100)', padding:'12px 20px 20px',
        display:'flex', flexDirection:'column', gap:8 }}>
        <button onClick={onNext}
          style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            fontFamily:'var(--font-ui)', fontSize:15.5, fontWeight:700,
            color:'#fff', background:'var(--son-500)',
            border:'none', borderRadius:'var(--r-pill)', padding:'14px 0', cursor:'pointer',
            boxShadow:'0 4px 18px rgba(168,50,70,.35)' }}>
          Tiếp theo
          <Icon name="arrow-right" size={17} color="#fff" sw={2.2}/>
        </button>
        <button onClick={onBack}
          style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:5,
            fontFamily:'var(--font-ui)', fontSize:13, fontWeight:600, color:'var(--ink-400)',
            background:'transparent', border:'none', padding:'3px 0', cursor:'pointer' }}>
          <BackChevron/>
          Quay lại bước 1
        </button>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════
   STEP 3a · Photo grid
═══════════════════════════════════════════ */
function PCPhoto({ item, selected, onClick }) {
  return (
    <button onClick={onClick} style={{
      position:'relative', width:'100%', height:110, borderRadius:12,
      border:selected?'2.5px solid var(--son-500)':'1px solid var(--line-200)',
      background:PC_GRAD[pcDominant(item.tags)], padding:0, cursor:'pointer',
      overflow:'hidden', boxShadow:selected?'0 2px 10px rgba(168,50,70,.28)':'none',
      transition:'all .15s ease', transform:selected?'translateY(-1px)':'none',
      display:'flex', flexDirection:'column', justifyContent:'flex-end', textAlign:'left' }}>
      <img src={item.img} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', borderRadius:'inherit' }}
        onError={e => { e.currentTarget.style.display='none'; }}/>
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,rgba(43,36,32,0) 40%,rgba(43,36,32,.45) 100%)' }}/>
      <div style={{ position:'relative', padding:'0 9px 8px' }}>
        <div style={{ fontFamily:'var(--font-display)', fontStyle:'italic', fontWeight:500, fontSize:11.5,
          lineHeight:1.2, color:'#FFF7F0', textShadow:'0 1px 4px rgba(43,36,32,.4)' }}>{item.label}</div>
      </div>
      <div style={{ position:'absolute', top:7, right:7, width:26, height:26, borderRadius:'50%',
        background:selected?'var(--son-500)':'rgba(255,253,251,.85)', backdropFilter:'blur(4px)',
        display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow:'0 1px 5px rgba(80,50,40,.18)' }}>
        <Icon name="heart" size={13} color={selected?'#fff':'var(--son-500)'} sw={2}/>
      </div>
    </button>
  );
}

function OBStep3Grid({ likes, toggle, onBack, onNext, onSkip }) {
  const n = likes.size, ready = n>=4;
  return (
    <>
      <div style={{ flexShrink:0, padding:'0 20px 12px', display:'flex', alignItems:'flex-end', gap:2 }}>
        <button onClick={onBack}
          style={{ background:'transparent', border:'none', padding:'0 4px 5px 0',
            cursor:'pointer', display:'flex', alignSelf:'flex-end' }}>
          <BackChevron/>
        </button>
        <div>
          <div style={{ fontFamily:'var(--font-ui)', fontSize:10, fontWeight:700,
            letterSpacing:'0.13em', textTransform:'uppercase', color:'var(--kim-500)', marginBottom:4 }}>
            BƯỚC 3 / 3 · Phong cách
          </div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:21, fontWeight:600, color:'var(--ink-900)', lineHeight:1.15,
            display:'flex', alignItems:'center', gap:9 }}>
            <Icon name="sparkles" size={20} color="var(--kim-500)" sw={1.9} style={{ flexShrink:0 }}/>
            Chọn những ảnh khiến bạn 'wow'
          </div>
        </div>
      </div>
      <div style={{ height:1, background:'var(--line-100)', flexShrink:0 }}/>

      <div style={{ flex:1, overflowY:'auto', padding:'14px 20px 8px' }}>
        <div style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--ink-500)', marginBottom:12, lineHeight:1.45 }}>
          Không cần gọi tên phong cách — Tơ Hồng tự đọc được gu của hai bạn.
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9 }}>
          {PC_GRID.map(g => <PCPhoto key={g.id} item={g} selected={likes.has(g.id)} onClick={() => toggle(g.id)}/>)}
        </div>
      </div>

      <div style={{ flexShrink:0, borderTop:'1px solid var(--line-100)', padding:'12px 20px 20px' }}>
        {!ready && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginBottom:9 }}>
            <Icon name="heart" size={12} color="var(--ink-400)"/>
            <span style={{ fontFamily:'var(--font-ui)', fontSize:11.5, color:'var(--ink-400)' }}>
              Chọn ít nhất 4 ảnh · đã chọn {n}
            </span>
          </div>
        )}
        <button onClick={() => ready && onNext()} disabled={!ready} style={{
          width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          fontFamily:'var(--font-ui)', fontSize:15, fontWeight:700,
          color:ready?'#fff':'var(--ink-400)',
          background:ready?'var(--son-500)':'var(--line-200)',
          border:'none', borderRadius:'var(--r-pill)', padding:'13px 0',
          cursor:ready?'pointer':'not-allowed',
          boxShadow:ready?'0 4px 16px rgba(168,50,70,.32)':'none', transition:'all .18s ease' }}>
          Xem Gu của tôi
          <Icon name="arrow-right" size={16} color={ready?'#fff':'var(--ink-400)'} sw={2.2}/>
        </button>
        <button onClick={onSkip} style={{ width:'100%', marginTop:8, background:'transparent', border:'none',
          cursor:'pointer', fontFamily:'var(--font-ui)', fontSize:12.5, fontWeight:500, color:'var(--ink-300)',
          padding:'4px', textDecoration:'underline', textUnderlineOffset:3, textDecorationColor:'var(--line-300)' }}>
          Bỏ qua
        </button>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════
   STEP 3b · Style result
═══════════════════════════════════════════ */
function OBStep3Result({ profile, data, onRestart, onFinish }) {
  const top = profile.slice(0,3);
  const city = data?.city || 'TP.HCM';
  const budget = data?.budget ? (data.budget>=1000?'1 tỷ+':`${data.budget}tr`) : '500tr';
  return (
    <>
      <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'space-between', padding:'20px 20px 16px' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontFamily:'var(--font-ui)', fontSize:10, fontWeight:700, letterSpacing:'.14em',
            textTransform:'uppercase', color:'var(--kim-500)', marginBottom:6 }}>Phong cách của bạn</div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:600, color:'var(--ink-900)', lineHeight:1.2 }}>
            Gu của bạn nghiêng về<br/>
            <span style={{ fontStyle:'italic', color:'var(--son-600)' }}>{PC_STYLES[top[0]?.key]?.vi}</span>
          </div>
        </div>

        <div style={{ background:'var(--card)', border:'1px solid var(--kim-100)', borderRadius:'var(--r-lg)', padding:'14px 15px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:9 }}>
            <Icon name="wand-sparkles" size={14} color="var(--kim-500)" sw={2}/>
            <span style={{ fontFamily:'var(--font-ui)', fontSize:10, fontWeight:700, letterSpacing:'.12em',
              textTransform:'uppercase', color:'var(--kim-500)' }}>Tơ Hồng sẽ ưu tiên</span>
          </div>
          {[
            ['camera',     `Photographer phong cách ${PC_STYLES[top[0]?.key]?.vi?.toLowerCase()||''} tại ${city}`],
            ['building-2', `Venue hợp tông ${PC_STYLES[top[1]?.key||top[0]?.key]?.vi?.toLowerCase()||''}, trong tầm ${budget}`],
          ].map(([ic,txt],i) => (
            <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:8, padding:'4px 0' }}>
              <Icon name={ic} size={14} color="var(--son-500)" sw={1.9} style={{ marginTop:2, flexShrink:0 }}/>
              <span style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--ink-700)', lineHeight:1.45 }}>{txt}</span>
            </div>
          ))}
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {top.map((s,i) => (
            <div key={s.key}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:5 }}>
                <span style={{ fontFamily:'var(--font-ui)', fontSize:13, fontWeight:700, color:'var(--ink-900)' }}>{PC_STYLES[s.key]?.vi}</span>
                <span style={{ fontFamily:'var(--font-ui)', fontSize:11.5, fontWeight:600, color:'var(--ink-400)', fontVariantNumeric:'tabular-nums' }}>{s.pct}%</span>
              </div>
              <div style={{ height:7, borderRadius:999, background:'var(--line-100)', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${s.pct}%`, borderRadius:999,
                  background:i===0?'linear-gradient(90deg,var(--son-500),var(--son-600))':'var(--son-300)',
                  transition:'width .7s cubic-bezier(.3,.7,.3,1)' }}/>
              </div>
              <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:'var(--ink-400)', marginTop:3 }}>{PC_STYLES[s.key]?.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flexShrink:0, borderTop:'1px solid var(--line-100)', padding:'12px 20px 20px',
        display:'flex', flexDirection:'column', gap:8 }}>
        <button onClick={onFinish} style={{
          width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          fontFamily:'var(--font-ui)', fontSize:15, fontWeight:700, color:'#fff',
          background:'var(--son-500)', border:'none', borderRadius:'var(--r-pill)', padding:'13px 0',
          cursor:'pointer', boxShadow:'0 4px 16px rgba(168,50,70,.32)' }}>
          <ThreadMark size={17} color="#fff" dot="#fff"/>
          Vào Tơ Hồng
        </button>
        <button onClick={onRestart} style={{ background:'transparent', border:'none', cursor:'pointer', padding:'4px',
          fontFamily:'var(--font-ui)', fontSize:12.5, fontWeight:500, color:'var(--ink-400)',
          display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
          <Icon name="rotate-ccw" size={13} color="var(--ink-400)"/>
          Chọn lại ảnh
        </button>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════
   MAIN OVERLAY
═══════════════════════════════════════════ */
export function Onboarding({ open, onDone }) {
  const [step, setStep] = useState('welcome');
  const [data, setData] = useState({ ...OB_DEFAULTS });
  const [likes, setLikes] = useState(new Set());
  const [shown, setShown] = useState(false);

  const set = (k, v) => setData(d => ({ ...d, [k]:v }));
  const toggle = id => setLikes(s => { const n = new Set(s); n.has(id)?n.delete(id):n.add(id); return n; });

  useEffect(() => {
    let t;
    if (open) { t = setTimeout(() => setShown(true), 40); }
    else { setShown(false); }
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (open) { setStep('welcome'); setData({ ...OB_DEFAULTS }); setLikes(new Set()); }
  }, [open]);

  const goToStyle = () => {
    try { localStorage.setItem('th_user', JSON.stringify(data)); } catch(_) {}
    setLikes(new Set());
    setStep('grid');
  };

  const profile = useMemo(() => {
    const acc = {}; Object.keys(PC_STYLES).forEach(k => { acc[k]=0; });
    PC_GRID.forEach(g => { if (likes.has(g.id)) Object.entries(g.tags).forEach(([k,v]) => { acc[k]+=v; }); });
    const total = Object.values(acc).reduce((a,b)=>a+b,0)||1;
    return Object.keys(acc).map(k => ({ key:k, pct:Math.round((acc[k]/total)*100) })).sort((a,b)=>b.pct-a.pct);
  }, [likes]);

  const finish = p => {
    try { localStorage.setItem('th_style', JSON.stringify(p)); } catch(_) {}
    onDone(data, p);
  };

  return (
    <div style={{ position:'absolute', inset:0, zIndex:900, pointerEvents:open?'all':'none' }}>
      <div style={{ position:'absolute', inset:0, background:'rgba(43,36,32,0.52)',
        opacity:shown?1:0, transition:'opacity .26s ease' }}/>

      <div style={{ position:'absolute', left:0, right:0, bottom:0, top:76,
        background:'var(--paper)', borderRadius:'22px 22px 0 0', overflow:'hidden',
        display:'flex', flexDirection:'column',
        transform:shown?'translateY(0)':'translateY(106%)',
        transition:'transform .32s cubic-bezier(.15,.75,.28,1)' }}>

        <div style={{ flexShrink:0, paddingTop:10 }}>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:8 }}>
            <div style={{ width:38, height:4, borderRadius:999, background:'var(--line-300)' }}/>
          </div>
          {step!=='welcome' && <OBProgress step={step}/>}
        </div>

        {step==='welcome' && <OBWelcome onStart={() => setStep(1)}/>}
        {step===1 && <OBStep1 data={data} set={set} onNext={() => setStep(2)}/>}
        {step===2 && <OBStep2 data={data} set={set} onBack={() => setStep(1)} onNext={goToStyle}/>}
        {step==='grid' && (
          <OBStep3Grid
            likes={likes} toggle={toggle}
            onBack={() => setStep(2)}
            onNext={() => setStep('result')}
            onSkip={() => finish([])}/>
        )}
        {step==='result' && (
          <OBStep3Result
            profile={profile} data={data}
            onRestart={() => { setLikes(new Set()); setStep('grid'); }}
            onFinish={() => finish(profile)}/>
        )}
      </div>
    </div>
  );
}
