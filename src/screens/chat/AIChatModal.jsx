import { Icon } from '../../ui/Icon.jsx';
import { ThreadMark } from '../../ui/atoms.jsx';
import { ChatTabWrapper } from './index.jsx';

const CTX_INFO = {
  home:   { icon: 'house',          label: 'Toàn bộ đám cưới' },
  plan:   { icon: 'calendar-clock', label: 'Kế hoạch & timeline' },
  budget: { icon: 'wallet',         label: 'Ngân sách' },
  guests: { icon: 'users',          label: 'Khách mời' },
  vendor: { icon: 'store',          label: 'Vendors' },
};

export function AIChatModal({
  open,
  onClose,
  ctxId = 'home',
  coupleId,
  chatSession,
  onAction,
  onConversationChange,
  onConversationUpdated,
}) {
  const ctx = CTX_INFO[ctxId] || CTX_INFO.home;

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 500, pointerEvents: open ? 'all' : 'none' }}>
      {/* backdrop */}
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(43,36,32,0.38)',
        opacity: open ? 1 : 0, transition: 'opacity .22s ease' }} />

      {/* sheet */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 64,
        background: 'var(--paper)', borderRadius: '22px 22px 0 0',
        boxShadow: '0 -12px 40px rgba(80,50,40,0.22)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        transform: open ? 'translateY(0)' : 'translateY(105%)',
        transition: 'transform .3s cubic-bezier(.2,.7,.3,1)' }}>

        {/* grabber + title row */}
        <div style={{ flexShrink: 0, padding: '9px 16px 0' }}>
          <div style={{ width: 36, height: 4, borderRadius: 999, background: 'var(--line-300)', margin: '0 auto 11px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <ThreadMark size={24} />
            <div style={{ flex: 1, fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600,
              color: 'var(--ink-900)', lineHeight: 1.1 }}>Tơ Hồng AI</div>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%',
              background: 'var(--line-100)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="chevron-down" size={17} color="var(--ink-500)" sw={2.2} />
            </button>
          </div>
          {/* context chip */}
          <div style={{ margin: '10px 0 11px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
              fontFamily: 'var(--font-ui)', fontSize: 11.5, fontWeight: 600,
              color: 'var(--kim-700)', background: 'var(--kim-50)',
              border: '1px solid var(--kim-200)', borderRadius: 'var(--r-pill)', padding: '5px 11px' }}>
              <Icon name={ctx.icon} size={13} color="var(--kim-600)" />
              Đang xem: {ctx.label}
            </span>
          </div>
        </div>
        <div style={{ height: 1, background: 'var(--line-100)', flexShrink: 0 }} />

        {/* chat content */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <ChatTabWrapper
            coupleId={coupleId}
            ctxId={ctxId}
            chatSession={chatSession}
            onMenuOpen={onClose}
            onAction={onAction}
            onConversationChange={onConversationChange}
            onConversationUpdated={onConversationUpdated}
            hideHeader
          />
        </div>
      </div>
    </div>
  );
}
