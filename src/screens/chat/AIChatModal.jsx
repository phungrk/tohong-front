import { useEffect, useRef, useState } from 'react';
import { Icon } from '../../ui/Icon.jsx';
import { ThreadMark } from '../../ui/atoms.jsx';
import { ChatTabWrapper } from './index.jsx';
import { ChatActionsCtx, VPickerChatCard, VMatchChatCard } from './VendorChatCards.jsx';
import { useVendorCtx } from '../VendorCtx.jsx';
import { readSavedSig, sameSig } from '../../budget/savedBudgetSig.js';

const CTX_INFO = {
  home:   { icon: 'house',          label: 'Toàn bộ đám cưới' },
  plan:   { icon: 'calendar-clock', label: 'Kế hoạch & timeline' },
  budget: { icon: 'wallet',         label: 'Ngân sách' },
  guests: { icon: 'users',          label: 'Khách mời' },
  vendor: { icon: 'store',          label: 'Nhà cung cấp' },
};

/* ── Vendor thread message rendering ─────────────────────────── */
function UserBubble({ text }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
      <div style={{ maxWidth: '78%', background: 'var(--son-500)', color: '#fff',
        borderRadius: '18px 18px 4px 18px', padding: '9px 13px',
        fontFamily: 'var(--font-body)', fontSize: 16, lineHeight: 1.45 }}>
        {text}
      </div>
    </div>
  );
}

function BotBubble({ children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--son-500)',
          flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ThreadMark size={15} color="#fff7f0" dot="#fff" />
        </div>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12.5, fontWeight: 700, color: 'var(--son-500)' }}>Mai</span>
      </div>
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
        {children}
      </div>
    </div>
  );
}

function VendorNote({ children }) {
  return <div style={{ padding: '6px 2px', fontFamily: 'var(--font-ui)', fontSize: 12.5, color: 'var(--ink-500)' }}>{children}</div>;
}

/* ── Vendor thread container ─────────────────────────────────── */
function VendorThread({ vendorSeed }) {
  const { coupleId } = useVendorCtx();
  const [messages, setMessages] = useState([]);
  const [note, setNote] = useState(null);  // null | 'loading' (Đang lấy dự toán…) | { retry } (đọc dự toán lỗi)
  const scrollRef = useRef(null);
  // T-182 (spec T-179): số đã lưu mà danh sách gần nhất của từng hạng mục đã dùng, trong cuộc trò chuyện vendor hiện tại.
  const sigsRef = useRef({});
  const catRef = useRef(undefined);   // hạng mục của luồng hiện tại (null = thẻ chọn); đổi thì bắt đầu lại
  const seqRef = useRef(0);           // chỉ lần bấm sau cùng được quyết định kết quả
  const mountedRef = useRef(true);
  const seedRef = useRef(null);       // seed đã xử lý (StrictMode chạy effect hai lần: chỉ một lần đọc dự toán)

  const pushUser = (text) => {
    setMessages((prev) => [...prev, { id: prev.length, type: 'user', text }]);
  };

  const pushAI = (Card, props = {}) => {
    setMessages((prev) => [...prev, { id: prev.length, type: 'card', Card, props }]);
  };

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  /* Mỗi lần bấm "Tìm <hạng mục>" (mode 'seed') hoặc chọn hạng mục trên thẻ chọn (mode 'pick'): đợi lần lưu đang chờ, đọc số đã lưu (một GET),
     rồi in danh sách đầu / in danh sách mới khi số khác danh sách gần nhất / không in khi số bằng. Đọc lỗi: không in, báo + Thử lại. */
  const findList = async (catId, mode) => {
    const seq = ++seqRef.current;
    setNote('loading');
    const sig = await readSavedSig(coupleId, catId);
    if (seq !== seqRef.current || !mountedRef.current) return;
    const restart = mode === 'seed' && catRef.current !== catId;   // đổi hạng mục (hoặc đang ở thẻ chọn): bắt đầu lại như trước
    if (restart) { catRef.current = catId; sigsRef.current = {}; }
    if (sig === null) {
      if (restart) setMessages([]);
      setNote({ retry: () => findList(catId, mode) });
      return;
    }
    setNote(null);
    const last = sigsRef.current[catId];
    if (restart) {
      sigsRef.current[catId] = sig;
      setMessages([{ id: catId, type: 'card', Card: VMatchChatCard, props: { catId, sig } }]);
      return;
    }
    if (last !== undefined && sameSig(sig, last)) return;   // số không đổi so với danh sách gần nhất: không in, không gọi match
    sigsRef.current[catId] = sig;
    setMessages((prev) => [...prev, { id: prev.length, type: 'card', Card: VMatchChatCard, props: { catId, sig } }]);
  };
  const findRef = useRef(findList);
  useEffect(() => { findRef.current = findList; });

  useEffect(() => {
    if (seedRef.current === vendorSeed) return;
    seedRef.current = vendorSeed;
    const catId = vendorSeed?.catId;
    if (!catId) {
      if (catRef.current === null) return;   // đã ở thẻ chọn: mở lại không bắt đầu lại (như trước)
      seqRef.current += 1; setNote(null);
      catRef.current = null; sigsRef.current = {};
      setMessages([{ id: 'picker', type: 'card', Card: VPickerChatCard, props: {} }]);
      return;
    }
    findRef.current(catId, 'seed');
  }, [vendorSeed]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <ChatActionsCtx.Provider value={{ pushUser, pushAI, findList: (catId) => findRef.current(catId, 'pick') }}>
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 20px' }}>
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
        {note === 'loading' && <VendorNote>Đang lấy dự toán…</VendorNote>}
        {note && note !== 'loading' && (
          <VendorNote>
            Chưa đọc được dự toán.{' '}
            <button type="button" onClick={note.retry}
              style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', font: 'inherit', fontWeight: 700, color: 'var(--son-600)' }}>Thử lại</button>
          </VendorNote>
        )}
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
    <div className="ov-fixed" style={{ position: 'absolute', inset: 0, zIndex: 500, pointerEvents: open ? 'all' : 'none' }}>
      {/* backdrop */}
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: open ? 'rgba(43,36,32,0.38)' : 'transparent',
        opacity: open ? 1 : 0, transition: 'opacity .22s ease, background-color .22s ease' }} />

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
            <div style={{ flex: 1, fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600,
              color: 'var(--ink-900)', lineHeight: 1.1 }}>Tơ Hồng AI</div>
            <button onClick={onClose} aria-label="Đóng" style={{ width: 44, height: 44, borderRadius: '50%',
              background: 'var(--line-100)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="chevron-down" size={17} color="var(--ink-500)" sw={2.2} />
            </button>
          </div>
          {/* context chip */}
          <div style={{ margin: '10px 0 11px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
              fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 600,
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
              chatOpen={open}
            />
          )}
        </div>
      </div>
    </div>
  );
}
