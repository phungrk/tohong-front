import { useState } from 'react';
import { Icon } from '../ui/Icon.jsx';

const VS = {
  confirmed:   { label: 'Đã chốt',  color: 'var(--sage-500)', bg: '#edf7ee', border: '#c3dfc7', icon: 'check-circle-2' },
  shortlisted: { label: 'Đang xem', color: '#b45309',          bg: '#fef9ed', border: '#fcd34d', icon: 'bookmark'       },
  none:        { label: 'Chưa có',  color: 'var(--ink-400)',   bg: 'var(--sand)', border: 'var(--line-200)', icon: 'circle-dashed' },
};

const COMPARE_VENDORS = [
  { id: 'hf',  name: 'Hỷ Films',    spec: 'Phóng sự + phim ngắn', price: 52, rating: 4.8, rv: 97,  why: 'Phù hợp nếu muốn thêm phim lưu niệm ngắn',        grad: 'linear-gradient(135deg,#c9a07a,#9a6b4a)' },
  { id: 'ts2', name: 'Tâm Studio',  spec: 'Phóng sự phim',        price: 40, rating: 4.9, rv: 212, why: 'Được đặt nhiều nhất cho ngày 12.10 ở Q.1',          grad: 'linear-gradient(135deg,#caa090,#a77060)' },
  { id: 'mw2', name: 'Mộc Wedding', spec: 'Phong cách tự nhiên',  price: 35, rating: 4.7, rv: 168, why: 'Ngân sách tốt · style hợp với áo dài truyền thống', grad: 'linear-gradient(135deg,#b9a080,#8b7060)' },
];

const VCATS_INIT = [
  { id: 'tiec',   name: 'Tiệc & nhà hàng', icon: 'utensils-crossed', budget: 220, color: 'var(--son-500)',
    vendors: [{ id: 'wh', name: 'White Palace', spec: 'Sảnh 25 bàn · 200 khách', price: 200, rating: 4.8, rv: 312, status: 'confirmed', note: 'Đặt cọc 30tr · 12.10' }],
    nudge: 'Chưa chốt menu — cần gửi cho bếp trước 4 tuần.' },
  { id: 'chup',   name: 'Chụp ảnh / quay', icon: 'camera', budget: 60, color: 'var(--dao-400)',
    vendors: [
      { id: 'ts', name: 'Tâm Studio',  spec: 'Phóng sự phim',      price: 40, rating: 4.9, rv: 212, status: 'shortlisted' },
      { id: 'mw', name: 'Mộc Wedding', spec: 'Phong cách tự nhiên', price: 35, rating: 4.7, rv: 168, status: 'shortlisted' },
    ], aiMore: true },
  { id: 'trang',  name: 'Trang trí & hoa', icon: 'flower-2', budget: 70, color: 'var(--son-300)',
    vendors: [{ id: 'hn', name: 'Hương Ngọc Decor', spec: 'Hoa tươi & backdrop', price: 45, rating: 4.8, rv: 89, status: 'confirmed' }] },
  { id: 'trangp', name: 'Trang phục', icon: 'shirt', budget: 50, color: 'var(--kim-300)',
    vendors: [{ id: 'dd', name: 'Duyên Dáng Bridal', spec: 'Áo dài + váy cưới', price: 30, rating: 4.6, rv: 145, status: 'shortlisted' }] },
  { id: 'nhac',   name: 'Âm nhạc / MC', icon: 'music-2', budget: 0, color: 'var(--ink-300)', vendors: [], empty: true },
];

function catStKey(cat) {
  if (cat.vendors.length === 0) return 'none';
  if (cat.vendors.some((v) => v.status === 'confirmed')) return 'confirmed';
  return 'shortlisted';
}

function VRow({ v, catIcon, catColor, onCycle }) {
  const s = VS[v.status];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--line-100)' }}>
      <div style={{ width: 34, height: 34, borderRadius: 'var(--r-sm)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: v.status === 'confirmed' ? '#edf7ee' : 'var(--sand)', border: `1px solid ${v.status === 'confirmed' ? '#c3dfc7' : 'var(--line-200)'}` }}>
        <Icon name={catIcon} size={16} color={v.status === 'confirmed' ? 'var(--sage-500)' : catColor} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: 'var(--ink-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11.5, color: 'var(--ink-400)' }}>{v.spec}</span>
          {v.rating && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 600, color: 'var(--kim-700)' }}>
              <Icon name="star" size={10} color="var(--kim-500)" /> {v.rating}
            </span>
          )}
        </div>
        {v.note && <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10.5, color: 'var(--son-600)', marginTop: 2 }}>{v.note}</div>}
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 700, color: 'var(--ink-900)', fontVariantNumeric: 'tabular-nums', marginBottom: 4 }}>{v.price}tr</div>
        <button onClick={onCycle} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontFamily: 'var(--font-ui)', fontSize: 10.5, fontWeight: 600,
          color: s.color, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 999, padding: '2px 8px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <Icon name={s.icon} size={10} color={s.color} /> {s.label}
        </button>
      </div>
    </div>
  );
}

function VNudge({ text }) {
  const [show, setShow] = useState(true);
  if (!show) return null;
  return (
    <div style={{ position: 'relative', margin: '6px 0 2px', borderRadius: 'var(--r-sm)', background: 'var(--kim-50)', border: '1px solid var(--kim-200)', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'linear-gradient(var(--kim-400),var(--son-400))' }} />
      <div style={{ padding: '8px 10px 8px 14px', display: 'flex', alignItems: 'flex-start', gap: 7 }}>
        <Icon name="sparkles" size={13} color="var(--kim-600)" />
        <span style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: 12.5, color: 'var(--ink-900)', lineHeight: 1.45 }}>{text}</span>
        <button onClick={() => setShow(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, opacity: .7 }}>
          <Icon name="x" size={14} color="var(--ink-400)" />
        </button>
      </div>
    </div>
  );
}

function VAiMore({ budgetLeft, onCompare }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  if (done) return (
    <div style={{ padding: '8px 14px 10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 12px', background: 'var(--sage-50)', border: '1px solid #c3dfc7', borderRadius: 'var(--r-md)' }}>
        <Icon name="check-circle-2" size={15} color="var(--sage-500)" />
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12.5, fontWeight: 600, color: 'var(--sage-500)' }}>Đã thêm Hỷ Films vào danh sách xem 💕</span>
      </div>
    </div>
  );
  return (
    <div style={{ padding: '6px 14px 12px', borderTop: '1px solid var(--line-100)' }}>
      {!open
        ? <button onClick={() => onCompare ? onCompare() : setOpen(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600, color: 'var(--kim-700)',
            background: 'var(--kim-50)', border: '1px solid var(--kim-200)', borderRadius: 'var(--r-md)', padding: '9px 0', cursor: 'pointer' }}>
            <Icon name="sparkles" size={14} color="var(--kim-600)" /> Tơ Hồng gợi ý thêm 1 studio
          </button>
        : <div style={{ background: 'var(--kim-50)', border: '1px solid var(--kim-200)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
            <div style={{ padding: '11px 13px 9px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <AIAvatar />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-900)', lineHeight: 1.5 }}>
                  <b>Hỷ Films</b> có phóng sự + phim ngắn · 52tr. Lịch 12.10 còn. Ngân sách còn dư {budgetLeft}tr sau khi chọn.
                </div>
              </div>
            </div>
            <div style={{ padding: '8px 13px 11px', borderTop: '1px solid var(--kim-100)', display: 'flex', gap: 7 }}>
              <button onClick={() => setOpen(false)} style={{ fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 600, color: 'var(--ink-500)',
                background: 'var(--card)', border: '1px solid var(--line-300)', borderRadius: 'var(--r-pill)', padding: '6px 13px', cursor: 'pointer' }}>Bỏ qua</button>
              <button onClick={() => setDone(true)} style={{ fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 600, color: '#fff',
                background: 'var(--son-500)', border: 'none', borderRadius: 'var(--r-pill)', padding: '6px 15px', cursor: 'pointer' }}>+ Lưu để xem</button>
            </div>
          </div>
      }
    </div>
  );
}

function VCatCard({ cat, onCycle, onCompare }) {
  const stk = catStKey(cat);
  const s = VS[stk];
  const spent = cat.vendors.reduce((n, v) => n + v.price, 0);
  const left = cat.budget - spent;
  return (
    <div style={{ background: 'var(--card)', border: `1px solid ${stk === 'confirmed' ? '#c3dfc7' : 'var(--line-100)'}`,
      borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', marginBottom: 12 }}>
      <div style={{ padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10,
        background: stk === 'confirmed' ? '#f4fbf4' : 'var(--sand)', borderBottom: '1px solid var(--line-100)' }}>
        <span style={{ width: 30, height: 30, borderRadius: 'var(--r-sm)', background: cat.color, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={cat.icon} size={15} color="#fff" sw={2} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13.5, fontWeight: 700, color: 'var(--ink-900)' }}>{cat.name}</div>
          {cat.budget > 0 && (
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: left < 0 ? 'var(--danger-500,#dc2626)' : 'var(--ink-400)' }}>
              Ngân sách {cat.budget}tr{spent > 0 ? ` · còn ${left}tr` : ''}
            </div>
          )}
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 700,
          color: s.color, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 999, padding: '3px 9px' }}>
          <Icon name={s.icon} size={10} color={s.color} /> {s.label}
        </span>
      </div>
      {cat.vendors.length > 0 && (
        <div style={{ padding: '0 14px' }}>
          {cat.vendors.map((v) => <VRow key={v.id} v={v} catIcon={cat.icon} catColor={cat.color} onCycle={() => onCycle(cat.id, v.id)} />)}
        </div>
      )}
      {cat.nudge && <div style={{ padding: '0 14px 8px' }}><VNudge text={cat.nudge} /></div>}
      {cat.empty && (
        <div style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 13px', background: 'var(--kim-50)', border: '1px solid var(--kim-200)', borderRadius: 'var(--r-md)' }}>
            <Icon name="sparkles" size={14} color="var(--kim-600)" />
            <span style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-900)', lineHeight: 1.4 }}>Tơ Hồng gợi ý MC/band nhạc — muốn xem không?</span>
            <button style={{ fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 600, color: 'var(--son-600)', background: 'var(--card)',
              border: '1px solid var(--son-200)', borderRadius: 'var(--r-pill)', padding: '5px 11px', cursor: 'pointer', flexShrink: 0 }}>Xem</button>
          </div>
        </div>
      )}
      {cat.aiMore && <VAiMore budgetLeft={cat.budget - spent} onCompare={onCompare} />}
    </div>
  );
}

function AIAvatar() {
  return (
    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--son-500)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="14" height="14" viewBox="0 0 80 80" fill="none">
        <path d="M40 28C40 20,33 14,25.5 14C17 14,11 20,11 28C11 41,27 52,40 62C53 52,69 41,69 28C69 20,63 14,54.5 14C47 14,40 20,40 28Z"
          stroke="#FFF7F0" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M40 62L40 70" stroke="#FFF7F0" strokeWidth="6" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/* ========================= TRACKER ========================= */
export function ScreenVendorTracker({ onMenuOpen }) {
  const [cats, setCats] = useState(VCATS_INIT.map((c) => ({ ...c, vendors: c.vendors.map((v) => ({ ...v })) })));
  const [compareView, setCompareView] = useState(false);

  if (compareView) return <ScreenVendorCompare onBack={() => setCompareView(false)} />;

  const cycleVendor = (catId, vId) => setCats((cs) => cs.map((c) => c.id !== catId ? c : {
    ...c, vendors: c.vendors.map((v) => v.id !== vId ? v : { ...v, status: v.status === 'confirmed' ? 'shortlisted' : 'confirmed' }),
  }));

  const totalVendors = cats.flatMap((c) => c.vendors).length;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--paper)' }}>
      <div style={{ flexShrink: 0, background: 'rgba(252,248,243,0.96)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--line-100)', padding: 'var(--header-pt) 16px 13px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={onMenuOpen} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
            <Icon name="menu" size={22} color="var(--ink-700)" />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--ink-900)', lineHeight: 1.1 }}>Vendors</div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11.5, color: 'var(--ink-500)', marginTop: 1 }}>{cats.length} danh mục · {totalVendors} vendor</div>
          </div>
          <button style={{ width: 34, height: 34, borderRadius: 'var(--r-sm)', background: 'var(--son-500)', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Icon name="plus" size={18} color="#fff" sw={2.2} />
          </button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 8px' }}>
        {cats.map((cat) => <VCatCard key={cat.id} cat={cat} onCycle={cycleVendor} onCompare={() => setCompareView(true)} />)}
      </div>
    </div>
  );
}

/* ========================= COMPARE ========================= */
function CompCard({ v, selected, onSelect, onConfirm }) {
  return (
    <div onClick={onSelect} style={{ borderRadius: 'var(--r-lg)', border: `1.5px solid ${selected ? 'var(--son-400)' : 'var(--line-100)'}`,
      background: selected ? 'var(--son-50)' : 'var(--card)', boxShadow: selected ? '0 0 0 3px rgba(168,50,70,.12)' : 'var(--shadow-xs)',
      overflow: 'hidden', cursor: 'pointer', transition: 'all .15s ease', marginBottom: 12 }}>
      <div style={{ height: 68, background: v.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <Icon name="camera" size={26} color="rgba(255,255,255,0.78)" />
        {selected && (
          <div style={{ position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderRadius: '50%', background: 'var(--son-500)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>
            <Icon name="check" size={12} color="#fff" sw={3} />
          </div>
        )}
      </div>
      <div style={{ padding: '11px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginBottom: 3 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--ink-900)' }}>{v.name}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontFamily: 'var(--font-ui)', fontSize: 11.5, fontWeight: 600, color: 'var(--kim-700)' }}>
            <Icon name="star" size={10} color="var(--kim-500)" /> {v.rating}
          </span>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--ink-400)' }}>({v.rv})</span>
          <span style={{ flex: 1 }} />
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 16, fontWeight: 700, color: 'var(--son-600)', fontVariantNumeric: 'tabular-nums' }}>{v.price}tr</span>
        </div>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--ink-500)', marginBottom: 8 }}>{v.spec}</div>
        <div style={{ display: 'flex', gap: 6, padding: '8px 10px', background: 'var(--kim-50)', borderRadius: 'var(--r-sm)', border: '1px solid var(--kim-100)' }}>
          <Icon name="sparkles" size={13} color="var(--kim-600)" />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, color: 'var(--ink-900)', lineHeight: 1.4 }}>{v.why}</span>
        </div>
      </div>
      {selected && (
        <div style={{ padding: '0 14px 13px', display: 'flex', gap: 8 }}>
          <button style={{ flex: 1, fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600, color: 'var(--ink-700)',
            background: 'var(--card)', border: '1px solid var(--line-300)', borderRadius: 'var(--r-pill)', padding: '9px 0', cursor: 'pointer' }}>Lưu để xem</button>
          <button onClick={(e) => { e.stopPropagation(); onConfirm(); }} style={{ flex: 1.2, fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600, color: '#fff',
            background: 'var(--son-500)', border: 'none', borderRadius: 'var(--r-pill)', padding: '9px 0', cursor: 'pointer' }}>Chốt luôn</button>
        </div>
      )}
    </div>
  );
}

export function ScreenVendorCompare({ onBack }) {
  const [sel, setSel] = useState(null);
  const [done, setDone] = useState(null);
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--paper)' }}>
      <div style={{ flexShrink: 0, background: 'rgba(252,248,243,0.96)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--line-100)', padding: 'var(--header-pt) 16px 13px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', display: 'flex' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="var(--ink-600)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--ink-900)', lineHeight: 1.1 }}>Chụp ảnh / quay</div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11.5, color: 'var(--ink-500)', marginTop: 1 }}>3 gợi ý từ Tơ Hồng</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--son-50)', border: '1px solid var(--son-200)', borderRadius: 'var(--r-pill)', padding: '5px 11px' }}>
            <Icon name="wallet" size={13} color="var(--son-500)" />
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12.5, fontWeight: 700, color: 'var(--son-600)' }}>60tr</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 9, background: 'var(--kim-50)', border: '1px solid var(--kim-200)', borderRadius: 'var(--r-md)', padding: '10px 12px' }}>
          <AIAvatar />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-900)', lineHeight: 1.5, flex: 1 }}>
            Mình lọc <b>3 studio</b> còn lịch 12.10, phù hợp ngân sách và style của bạn. Chạm để xem chi tiết:
          </span>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 12px' }}>
        {done
          ? <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 48, gap: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--sage-50)', border: '2.5px solid var(--sage-500)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="check-circle-2" size={32} color="var(--sage-500)" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--ink-900)', marginBottom: 6 }}>Đã chốt {done}!</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink-500)', lineHeight: 1.6, maxWidth: 260 }}>Mình đã thêm vào danh mục Chụp ảnh và ghi nhớ vào kế hoạch.</div>
              </div>
              <button onClick={() => { setSel(null); setDone(null); }} style={{ fontFamily: 'var(--font-ui)', fontSize: 13.5, fontWeight: 600, color: 'var(--son-700)',
                background: 'var(--card)', border: '1px solid var(--son-200)', borderRadius: 'var(--r-pill)', padding: '10px 22px', cursor: 'pointer' }}>
                Xem lại các studio khác
              </button>
            </div>
          : COMPARE_VENDORS.map((v) => (
              <CompCard key={v.id} v={v} selected={sel === v.id}
                onSelect={() => setSel(v.id === sel ? null : v.id)}
                onConfirm={() => setDone(v.name)} />
            ))
        }
      </div>
    </div>
  );
}
