import { useEffect, useState } from 'react';
import { Icon } from '../ui/Icon.jsx';

/* ── Steps config ─────────────────────────────────────────────
   Lưu → Chốt → Vào ngân sách */
const FLOW_STEPS = [
  {
    n: 1, icon: 'heart', color: 'var(--kim-500)', bg: 'var(--kim-50)',
    label: 'Tìm & Lưu',
    title: 'Lưu vendor bạn thích',
    desc: 'Hỏi Tơ Hồng gợi ý rồi lưu những vendor ưng ý vào từng hạng mục. Vendor đã lưu hiển thị chip',
    chip: { text: 'Đang xem xét', color: 'var(--kim-700)', bg: 'var(--kim-50)', border: 'var(--kim-200)', icon: 'bookmark' },
  },
  {
    n: 2, icon: 'check-circle-2', color: 'var(--sage-500)', bg: 'var(--sage-50,#edf7ee)',
    label: 'Chốt',
    title: 'Chốt vendor chính thức',
    desc: 'Khi đã quyết định, bấm "Chốt" trên vendor đó. Mỗi hạng mục chỉ chốt một vendor. Vendor đã chốt chuyển sang chip',
    chip: { text: 'Đã chốt', color: 'var(--sage-700,#2d6b3a)', bg: 'var(--sage-50,#edf7ee)', border: 'var(--sage-200,#b8d9be)', dot: true },
  },
  {
    n: 3, icon: 'wallet', color: 'var(--son-500)', bg: 'var(--son-50)',
    label: 'Vào ngân sách',
    title: 'Tự động vào ngân sách',
    desc: 'Vendor vừa chốt được cộng vào tổng chi phí đã chốt và cập nhật thanh ngân sách bên dưới.',
    chip: null,
  },
];

/* ── VFlowOverview — compact 1-row card at top of vendor list ── */
export function VFlowOverview({ onOpen }) {
  return (
    <button type="button" onClick={onOpen}
      style={{ width: '100%', textAlign: 'left', cursor: 'pointer',
        background: 'var(--card)', border: '1px solid var(--line-100)',
        borderRadius: 'var(--r-lg)', padding: '13px 14px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <Icon name="info" size={14} color="var(--son-400)" sw={1.8} />
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 700, color: 'var(--ink-600)' }}>
          Cách hoạt động
        </span>
        <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 2,
          fontFamily: 'var(--font-ui)', fontSize: 11.5, fontWeight: 600, color: 'var(--son-500)' }}>
          Chi tiết <Icon name="chevron-right" size={13} color="var(--son-500)" sw={2} />
        </span>
      </div>
      {/* 3 steps: icon tròn trên, text xuống hàng dưới; nối bằng thread nét đứt */}
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        {FLOW_STEPS.map((s, i) => (
          <div key={s.n} style={{ display: 'contents' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0, width: 72 }}>
              <span style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={s.icon} size={15} color="#fff" sw={2} />
              </span>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 600,
                color: 'var(--ink-700)', textAlign: 'center', lineHeight: 1.25 }}>
                {s.label}
              </span>
            </div>
            {i < FLOW_STEPS.length - 1 && (
              <span style={{ flex: 1, height: 0, margin: '14px 4px 0',
                borderTop: '1.5px dashed var(--son-300)' }} />
            )}
          </div>
        ))}
      </div>
    </button>
  );
}

/* ── Chip preview (bám đúng token trạng thái ở VVendorRow) ───── */
function FlowChip({ chip }) {
  if (!chip) return null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4,
      fontFamily: 'var(--font-ui)', fontSize: 10.5, fontWeight: 700,
      color: chip.color, background: chip.bg,
      border: `1px solid ${chip.border}`, borderRadius: 999, padding: '3px 8px' }}>
      {chip.dot && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--sage-500)', display: 'inline-block' }} />}
      {chip.icon && <Icon name={chip.icon} size={11} color={chip.color} sw={2} />}
      {chip.text}
    </span>
  );
}

/* ── VendorFlowSheet — bottom-sheet chi tiết ──────────────────── */
export function VendorFlowSheet({ open, onClose }) {
  // animate budget bar khi open (chỉ minh hoạ)
  const [anim, setAnim] = useState(false);
  useEffect(() => {
    if (open) { const t = setTimeout(() => setAnim(true), 120); return () => clearTimeout(t); }
    setAnim(false);
  }, [open]);

  const confirmedTr = 235, totalTr = 500;
  const pct = anim ? (confirmedTr / totalTr) * 100 : 0;

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 320, pointerEvents: open ? 'all' : 'none' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(43,36,32,0.42)',
        opacity: open ? 1 : 0, transition: 'opacity .22s ease' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: 'var(--paper)',
        borderRadius: '22px 22px 0 0', boxShadow: '0 -12px 40px rgba(80,50,40,0.18)',
        transform: open ? 'translateY(0)' : 'translateY(104%)', opacity: open ? 1 : 0,
        transition: 'transform .28s cubic-bezier(.2,.7,.3,1), opacity .28s ease',
        maxHeight: '90%', display: 'flex', flexDirection: 'column' }}>
        {/* grabber + header */}
        <div style={{ flexShrink: 0, padding: '10px 20px 4px' }}>
          <div style={{ width: 38, height: 4, borderRadius: 999, background: 'var(--line-200)', margin: '0 auto 14px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: 'var(--son-50)',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="sparkles" size={17} color="var(--son-500)" sw={1.8} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--ink-900)', lineHeight: 1.15 }}>
                Cách hoạt động
              </div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--ink-400)', marginTop: 1 }}>
                Lưu → Chốt → Vào ngân sách
              </div>
            </div>
            <button type="button" onClick={onClose} style={{ flexShrink: 0, padding: 6, background: 'transparent',
              border: 'none', cursor: 'pointer', color: 'var(--ink-300)' }}>
              <Icon name="x" size={20} color="var(--ink-400)" sw={2} />
            </button>
          </div>
        </div>

        {/* steps — cuộn được */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px 6px' }}>
          {FLOW_STEPS.map((s, i) => (
            <div key={s.n} style={{ display: 'flex', gap: 12, marginBottom: i < FLOW_STEPS.length - 1 ? 4 : 0 }}>
              {/* rail: dot + thread nối */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <span style={{ width: 30, height: 30, borderRadius: '50%', background: s.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={s.icon} size={15} color={s.color} sw={1.8} />
                </span>
                {i < FLOW_STEPS.length - 1 && (
                  <span style={{ flex: 1, width: 0, minHeight: 20, margin: '4px 0',
                    borderLeft: '1.5px dashed var(--son-300)' }} />
                )}
              </div>
              {/* content */}
              <div style={{ flex: 1, minWidth: 0, paddingBottom: 16 }}>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 700, color: 'var(--ink-900)' }}>
                  {s.title}
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-500)', lineHeight: 1.5, marginTop: 3 }}>
                  {s.desc}{s.chip && ' '}
                  {s.chip && <FlowChip chip={s.chip} />}
                  {s.chip && '.'}
                </div>
                {/* budget bar minh hoạ ở bước cuối */}
                {s.n === 3 && (
                  <div style={{ marginTop: 10, background: 'var(--card)', border: '1px solid var(--line-100)',
                    borderRadius: 'var(--r-md,10px)', padding: '11px 13px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600,
                        color: 'var(--sage-600)', fontVariantNumeric: 'tabular-nums' }}>{confirmedTr}tr</span>
                      <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--ink-400)' }}>
                        / {totalTr}tr đã chốt
                      </span>
                    </div>
                    <div style={{ height: 7, borderRadius: 999, background: 'var(--line-100)', overflow: 'hidden' }}>
                      <div style={{ width: pct + '%', height: '100%', background: 'var(--sage-500)',
                        borderRadius: 999, transition: 'width .6s cubic-bezier(.2,.7,.3,1)' }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* footer CTA */}
        <div style={{ flexShrink: 0, padding: '8px 20px calc(20px + env(safe-area-inset-bottom,0px))' }}>
          <button type="button" onClick={onClose}
            style={{ width: '100%', padding: '13px', borderRadius: 'var(--r-pill)', border: 'none',
              background: 'var(--son-500)', color: '#fff', cursor: 'pointer',
              fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 700 }}>
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
}

export default VendorFlowSheet;
