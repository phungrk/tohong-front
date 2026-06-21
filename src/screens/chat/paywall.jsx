import { useState } from 'react';
import { Icon } from '../../ui/Icon.jsx';
import { ThreadMark, Avatar } from '../../ui/atoms.jsx';

const DAYS_LEFT = 48;

const PLANS = [
  { id: 'm1',  months: 1,  price: 99,  perMo: 99, frame: 'Cận ngày, cần gấp',          tag: null,             save: null },
  { id: 'm3',  months: 3,  price: 249, perMo: 83, frame: 'Đủ đồng hành tới ngày cưới', tag: 'Hợp với bạn',    save: '-16%', rec: true },
  { id: 'm6',  months: 6,  price: 399, perMo: 67, frame: 'Lên kế hoạch trọn vẹn',      tag: null,             save: '-33%' },
  { id: 'm12', months: 12, price: 599, perMo: 50, frame: 'Từ dạm ngõ đến ngày cưới',   tag: 'Tiết kiệm nhất', save: '-50%' },
];
export { PLANS };

function fmtVnd(thousands) { return (thousands * 1000).toLocaleString('vi-VN') + 'đ'; }

const VALUE_PROPS = [
  { icon: 'messages-square', title: 'Trò chuyện không giới hạn', sub: 'Hỏi bất cứ điều gì về đám cưới, bất cứ lúc nào' },
  { icon: 'sparkles',        title: 'Gợi ý thông minh',          sub: 'Tối ưu ngân sách, gợi ý vendor hợp lịch & gu của bạn' },
  { icon: 'bell-ring',       title: 'Nhắc việc tự động',          sub: 'Tơ Hồng theo dõi deadline và nhắc đúng lúc' },
  { icon: 'heart-handshake', title: 'Đồng hành tận tâm',          sub: 'Như một wedding planner riêng, trong túi bạn' },
];

function PlanRow({ p, selected, onSelect }) {
  return (
    <button onClick={onSelect} style={{ position: 'relative', width: '100%', textAlign: 'left', cursor: 'pointer',
      background: selected ? 'var(--son-50)' : 'var(--card)',
      border: `1.5px solid ${selected ? 'var(--son-400)' : 'var(--line-200)'}`,
      borderRadius: 'var(--r-lg)', padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: selected ? 'var(--shadow-rose)' : 'none', transition: 'all .15s ease' }}>
      <span style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: selected ? 'var(--son-500)' : 'var(--card)',
        border: `2px solid ${selected ? 'var(--son-500)' : 'var(--line-300)'}` }}>
        {selected && <Icon name="check" size={12} color="#fff" sw={3} />}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, color: 'var(--ink-900)' }}>{p.months} tháng</span>
          {p.tag && (
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 700, letterSpacing: '0.03em',
              color: p.rec ? 'var(--son-700)' : 'var(--kim-700)',
              background: p.rec ? 'var(--son-100)' : 'var(--kim-50)',
              border: `1px solid ${p.rec ? 'var(--son-200)' : 'var(--kim-200)'}`,
              borderRadius: 999, padding: '2px 8px' }}>{p.tag}</span>
          )}
        </div>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11.5, color: 'var(--ink-400)', marginTop: 2 }}>{p.frame}</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 16, fontWeight: 700, color: 'var(--ink-900)', fontVariantNumeric: 'tabular-nums' }}>{fmtVnd(p.price)}</div>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--ink-400)', marginTop: 1 }}>
          ~{fmtVnd(p.perMo)}/th{p.save ? ` · ${p.save}` : ''}
        </div>
      </div>
    </button>
  );
}

export function ScreenPaywall({ onConfirm, onTrial, trialUsed, unlocking = false, error = '' }) {
  const [sel, setSel] = useState('m3');
  const plan = PLANS.find((p) => p.id === sel);
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--paper)' }}>
      {/* hero */}
      <div style={{ flexShrink: 0, position: 'relative', padding: '46px 18px 18px', overflow: 'hidden',
        background: 'linear-gradient(160deg, var(--son-50) 0%, #fdf2ec 55%, var(--kim-50) 100%)', borderBottom: '1px solid var(--son-100)' }}>
        <div style={{ position: 'absolute', top: 14, right: 14, cursor: 'pointer' }}>
          <Icon name="x" size={22} color="var(--ink-400)" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
          <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'var(--card)', border: '1px solid var(--son-100)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-gold)' }}>
            <ThreadMark size={32} />
          </div>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--ink-900)', textAlign: 'center', lineHeight: 1.15 }}>Mở khóa Tơ Hồng AI</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13.5, color: 'var(--ink-500)', textAlign: 'center', marginTop: 6, lineHeight: 1.5, maxWidth: 300, marginLeft: 'auto', marginRight: 'auto' }}>
          Mọi tính năng khác <b style={{ color: 'var(--sage-500)' }}>miễn phí trọn đời</b>. Chỉ trợ lý trò chuyện AI cần mở khóa — trả một lần theo thời gian, không tự động gia hạn.
        </div>
      </div>

      {/* scroll body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 18 }}>
          {VALUE_PROPS.map((v) => (
            <div key={v.icon} style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
              <span style={{ width: 34, height: 34, borderRadius: 'var(--r-sm)', flexShrink: 0, background: 'var(--son-50)', border: '1px solid var(--son-100)',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={v.icon} size={17} color="var(--son-500)" />
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 600, color: 'var(--ink-900)' }}>{v.title}</div>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--ink-400)', marginTop: 1, lineHeight: 1.4 }}>{v.sub}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 9, alignItems: 'center', padding: '11px 13px', background: 'var(--kim-50)',
          border: '1px solid var(--kim-200)', borderRadius: 'var(--r-md)', marginBottom: 14 }}>
          <Icon name="calendar-heart" size={18} color="var(--kim-600)" />
          <span style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: 12.5, color: 'var(--ink-900)', lineHeight: 1.45 }}>
            Đám cưới còn <b>{DAYS_LEFT} ngày</b> — gói <b>3 tháng</b> là đủ để Tơ Hồng đồng hành tới tận ngày cưới.
          </span>
        </div>

        <div className="ds-label" style={{ marginBottom: 9 }}>Chọn thời gian sử dụng</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {PLANS.map((p) => <PlanRow key={p.id} p={p} selected={sel === p.id} onSelect={() => setSel(p.id)} />)}
        </div>
        <div style={{ height: 8 }} />
      </div>

      {/* sticky CTA */}
      <div style={{ flexShrink: 0, borderTop: '1px solid var(--line-100)', background: 'var(--paper)', padding: '12px 16px 20px' }}>
        {!trialUsed && (
          <div onClick={onTrial} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 14px', marginBottom: 10, cursor: 'pointer',
            background: 'var(--sage-50)', border: '1.5px dashed rgba(94,140,106,0.4)', borderRadius: 'var(--r-lg)', transition: 'all .14s ease' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(94,140,106,0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--sage-50)')}>
            <span style={{ width: 34, height: 34, borderRadius: 'var(--r-sm)', flexShrink: 0, background: 'rgba(94,140,106,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="refresh-cw" size={16} color="var(--sage-500)" />
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13.5, fontWeight: 700, color: 'var(--sage-500)' }}>Thử thêm 3 lượt · miễn phí</div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--ink-400)', marginTop: 1 }}>1 lần duy nhất · không cần thanh toán</div>
            </div>
            <Icon name="chevron-right" size={15} color="var(--sage-500)" />
          </div>
        )}

        {error && (
          <div role="alert" style={{ marginBottom: 9, fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--son-700)', textAlign: 'center' }}>
            {error}
          </div>
        )}
        <button disabled={unlocking} onClick={() => onConfirm(plan)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
          fontFamily: 'var(--font-ui)', fontSize: 15.5, fontWeight: 700, color: 'var(--fg-on-primary)', background: 'var(--son-500)',
          border: 'none', borderRadius: 'var(--r-pill)', padding: '15px 0', cursor: unlocking ? 'wait' : 'pointer',
          opacity: unlocking ? 0.7 : 1, boxShadow: 'var(--shadow-rose)' }}>
          {unlocking ? 'Đang mở khóa…' : `Mở khóa ${plan.months} tháng · ${fmtVnd(plan.price)}`}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10 }}>
          <Icon name="shield-check" size={13} color="var(--sage-500)" />
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--ink-400)' }}>Thanh toán an toàn · không tự gia hạn</span>
        </div>
      </div>
    </div>
  );
}

export function ScreenUnlocked({ plan, onStart }) {
  const p = plan || PLANS[1];
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--paper)' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 28px', textAlign: 'center' }}>
        <div style={{ position: 'relative', marginBottom: 24 }}>
          <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'var(--son-50)', border: '2px solid var(--son-200)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-gold)' }}>
            <ThreadMark size={54} />
          </div>
          <div style={{ position: 'absolute', bottom: -2, right: -2, width: 34, height: 34, borderRadius: '50%', background: 'var(--sage-500)',
            border: '3px solid var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={17} color="#fff" sw={3} />
          </div>
        </div>

        <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, color: 'var(--ink-900)', lineHeight: 1.2 }}>Đã mở khóa! 💕</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--ink-500)', lineHeight: 1.6, marginTop: 10, maxWidth: 280 }}>
          Tơ Hồng sẽ đồng hành cùng bạn trong <b style={{ color: 'var(--son-600)' }}>{p.months} tháng</b> tới.
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18, padding: '9px 15px', background: 'var(--card)',
          border: '1px solid var(--line-200)', borderRadius: 'var(--r-pill)', boxShadow: 'var(--shadow-xs)' }}>
          <Icon name="receipt-text" size={15} color="var(--ink-400)" />
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12.5, color: 'var(--ink-600)' }}>
            Gói {p.months} tháng · {fmtVnd(p.price)} · hết hạn {p.months >= 6 ? '2026' : '08.2025'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', marginTop: 26, textAlign: 'left', background: 'var(--son-50)',
          border: '1px solid var(--son-100)', borderRadius: 'var(--r-lg)', padding: '12px 14px', maxWidth: 320 }}>
          <Avatar size={30} />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13.5, color: 'var(--ink-900)', lineHeight: 1.5 }}>
            Chào bạn! Mình đã xem qua kế hoạch — bắt đầu từ <b>chốt menu tuần này</b> nhé?
          </span>
        </div>
      </div>

      <div style={{ flexShrink: 0, padding: '12px 16px 24px' }}>
        <button onClick={onStart} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          fontFamily: 'var(--font-ui)', fontSize: 15.5, fontWeight: 700, color: 'var(--fg-on-primary)', background: 'var(--son-500)',
          border: 'none', borderRadius: 'var(--r-pill)', padding: '15px 0', cursor: 'pointer', boxShadow: 'var(--shadow-rose)' }}>
          <Icon name="message-circle" size={18} color="#fff" sw={2.2} /> Bắt đầu trò chuyện
        </button>
      </div>
    </div>
  );
}
