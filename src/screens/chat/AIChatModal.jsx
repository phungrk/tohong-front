import { useEffect, useRef, useState } from 'react';
import { Icon } from '../../ui/Icon.jsx';
import { ThreadMark } from '../../ui/atoms.jsx';
import { ChatTabWrapper } from './index.jsx';
import { ChatActionsCtx, VPickerChatCard, VMatchChatCard } from './VendorChatCards.jsx';

const CTX_INFO = {
  home:   { icon: 'house',          label: 'Toàn bộ đám cưới' },
  plan:   { icon: 'calendar-clock', label: 'Kế hoạch & timeline' },
  budget: { icon: 'wallet',         label: 'Ngân sách' },
  guests: { icon: 'users',          label: 'Khách mời' },
  vendor: { icon: 'store',          label: 'Vendors' },
};

/* ── Vendor thread message rendering ─────────────────────────── */
function UserBubble({ text }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
      <div style={{ maxWidth: '78%', background: 'var(--son-500)', color: '#fff',
        borderRadius: '18px 18px 4px 18px', padding: '9px 13px',
        fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.45 }}>
        {text}
      </div>
    </div>
  );
}

function BotBubble({ children }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'flex-start' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--son-500)',
        flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
        <ThreadMark size={17} color="#fff7f0" dot="#fff" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {children}
      </div>
    </div>
  );
}

/* ── Vendor thread container ─────────────────────────────────── */
function VendorThread({ vendorSeed }) {
  const [messages, setMessages] = useState([]);
  const scrollRef = useRef(null);

  const pushUser = (text) => {
    setMessages((prev) => [...prev, { id: prev.length, type: 'user', text }]);
  };

  const pushAI = (Card, props = {}) => {
    setMessages((prev) => [...prev, { id: prev.length, type: 'card', Card, props }]);
  };

  useEffect(() => {
    const InitCard = vendorSeed?.catId ? VMatchChatCard : VPickerChatCard;
    const initProps = vendorSeed?.catId ? { catId: vendorSeed.catId } : {};
    setMessages([{ id: vendorSeed?.catId ?? 'picker', type: 'card', Card: InitCard, props: initProps }]);
  }, [vendorSeed?.catId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <ChatActionsCtx.Provider value={{ pushUser, pushAI }}>
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '14px 12px 20px' }}>
        {messages.map((msg) => {
          if (msg.type === 'user') {
            return <UserBubble key={msg.id} text={msg.text} />;
          }
          const { Card, props } = msg;
          return (
            <BotBubble key={msg.id}>
              <Card {...props} />
            </BotBubble>
          );
        })}
      </div>
    </ChatActionsCtx.Provider>
  );
}

/* ── AIChatModal ─────────────────────────────────────────────── */
export function AIChatModal({
  open,
  onClose,
  ctxId = 'home',
  coupleId,
  chatSession,
  onAction,
  onConversationChange,
  onConversationUpdated,
  vendorSeed,
}) {
  const ctx = CTX_INFO[ctxId] || CTX_INFO.home;
  const isVendorMode = !!vendorSeed;

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
              {isVendorMode ? 'Tìm vendor · Tơ Hồng gợi ý' : `Đang xem: ${ctx.label}`}
            </span>
          </div>
        </div>
        <div style={{ height: 1, background: 'var(--line-100)', flexShrink: 0 }} />

        {/* content */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
          {isVendorMode ? (
            <VendorThread vendorSeed={vendorSeed} />
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}
