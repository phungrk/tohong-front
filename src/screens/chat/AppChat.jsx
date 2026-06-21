import { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Icon } from '../../ui/Icon.jsx';
import { ThreadMark, Avatar, AgentTag } from '../../ui/atoms.jsx';
import { useBudget } from '../../budget/useBudget.js';
import { GuestCard, TimelineCard, ChecklistCard, ChatBudgetMini } from './cards.jsx';
import { api } from '../../api.js';
import { track } from '../../analytics.js';

function AUserBubble({ children }) {
  return (
    <div style={{ alignSelf: 'flex-end', maxWidth: '82%', background: 'var(--son-500)', color: 'var(--fg-on-primary)',
      fontFamily: 'var(--font-body)', fontSize: 14.5, lineHeight: 1.45, padding: '10px 14px',
      borderRadius: 'var(--r-lg) var(--r-lg) 4px var(--r-lg)', boxShadow: 'var(--shadow-rose)' }}>
      {children}
    </div>
  );
}

function AAssistant({ tag, children }) {
  return (
    <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
      <Avatar size={30} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
        {tag && <AgentTag name={tag[0]} label={tag[1]} />}
        {children}
      </div>
    </div>
  );
}

function ASay({ children }) {
  return <div style={{ fontFamily: 'var(--font-body)', fontSize: 14.5, lineHeight: 1.55, color: 'var(--ink-900)' }}>{children}</div>;
}

function QuickReplies({ items, onSelect, disabled }) {
  if (!items?.length) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
      {items.map((item) => (
        <button
          key={item}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(item)}
          style={{
            fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 600,
            color: 'var(--son-700)', background: 'var(--son-50)',
            border: '1px solid var(--son-200)', borderRadius: 'var(--r-pill)',
            padding: '7px 11px', cursor: disabled ? 'default' : 'pointer',
            opacity: disabled ? 0.55 : 1,
          }}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function RetryReply({ onRetry, disabled }) {
  if (!onRetry) return null;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onRetry}
      style={{
        alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6,
        fontFamily: 'var(--font-ui)', fontSize: 12.5, fontWeight: 600,
        color: 'var(--son-700)', background: 'var(--card)',
        border: '1px solid var(--son-200)', borderRadius: 'var(--r-pill)',
        padding: '8px 12px', cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <Icon name="refresh-cw" size={13} color="var(--son-600)" />
      Thử lại nhận định
    </button>
  );
}

// Renders raw markdown text from LLM streaming — wraps react-markdown + remark-gfm.
// IMPORTANT: Do not remove — used by AppChat for all string `intro` (SSE AI responses).
// Styled by .md CSS class in index.css.
function BotMarkdown({ text }) {
  return (
    <div className="md" style={{ fontFamily: 'var(--font-body)', fontSize: 14.5, lineHeight: 1.55, color: 'var(--ink-900)' }}>
      <Markdown remarkPlugins={[remarkGfm]} components={{ a: (p) => <a {...p} target="_blank" rel="noopener noreferrer" /> }}>
        {text}
      </Markdown>
    </div>
  );
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
      <Avatar size={30} />
      <div style={{ display: 'flex', gap: 5, padding: '4px 0' }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--son-300)',
            animation: `thbounce 1.1s ${i * 0.16}s infinite ease-in-out` }} />
        ))}
      </div>
    </div>
  );
}

const WELCOME_MESSAGE = {
  who: 'ai',
  tag: null,
  intro: <>Chào hai bạn 💕 Mình là <b>Tơ Hồng</b> — trợ lý cưới của bạn. Mình giúp lo <i>khách mời, timeline, checklist, ngân sách, vendor…</i> Bạn muốn xem gì trước?</>,
  card: null,
};

function toUiMessage(message) {
  if (message.role === 'user') {
    return { who: 'me', text: message.content, _id: message.id };
  }
  return {
    who: 'ai',
    tag: null,
    intro: message.content || '',
    card: null,
    _id: message.id,
    _error: message.role !== 'assistant',
  };
}

function initialMessages(chatSession) {
  if (!chatSession) return [WELCOME_MESSAGE];
  if (chatSession.loading) return [];
  if (chatSession.error) {
    return [{
      who: 'ai',
      tag: null,
      intro: chatSession.error,
      card: null,
      _error: true,
    }];
  }
  if (chatSession.conversationId) {
    return (chatSession.messages || []).map(toUiMessage);
  }
  return [WELCOME_MESSAGE];
}

function makeTopics(budgetHook, coupleId) {
  return [
    { id: 'khach',    chip: 'Khách mời',  icon: 'users',          ask: 'Cho mình xem danh sách khách mời',
      tag: ['users', 'guest-agent'],
      card: () => <GuestCard coupleId={coupleId} />,
      suggestions: ['Ai cần được nhắc RSVP trước?', 'Ước tính số bàn cần đặt', 'Gợi ý cách chia nhóm khách'] },
    { id: 'timeline', chip: 'Timeline',   icon: 'calendar-clock', ask: 'Timeline ngày cưới như thế nào?',
      tag: ['calendar-clock', 'timeline-agent'],
      card: () => <TimelineCard coupleId={coupleId} />,
      suggestions: ['Rundown đang thiếu mốc nào?', 'Kiểm tra khoảng đệm di chuyển', 'Việc nào cần chốt trước?'] },
    { id: 'checklist', chip: 'Checklist', icon: 'list-checks',    ask: 'Mình còn việc gì cần làm?',
      tag: ['list-checks', 'planner-agent'],
      card: () => <ChecklistCard coupleId={coupleId} />,
      suggestions: ['Chọn 3 việc ưu tiên tuần này', 'Việc nào đang có nguy cơ trễ?', 'Lập kế hoạch cho 7 ngày tới'] },
    { id: 'ngansach', chip: 'Ngân sách',  icon: 'wallet',         ask: 'Ngân sách đang phân bổ ra sao?',
      tag: ['wallet', 'budget-agent'],
      card: () => <ChatBudgetMini budgetHook={budgetHook} />,
      suggestions: ['Khoản nào đang chiếm tỷ lệ cao?', 'Có thể tiết kiệm ở đâu?', 'Dự phòng hiện tại đã đủ chưa?'] },
    { id: 'vendor',   chip: 'Vendor',     icon: 'store',          ask: 'Tư vấn cách chọn studio chụp ảnh phù hợp giúp mình',
      tag: ['store', 'vendor-agent'],
      card: null,
      suggestions: ['Nên ưu tiên chốt vendor nào?', 'Cần so sánh vendor theo tiêu chí gì?', 'Cần hỏi vendor những gì?'] },
  ];
}

async function loadTopicContext(coupleId, topic) {
  if (!coupleId || !topic) return null;

  if (topic.id === 'khach') {
    const guests = await api.getGuests(coupleId);
    const list = guests?.guests || [];
    return {
      module: 'guests',
      data_status: list.length ? 'available' : 'empty',
      capacity: guests?.capacity || null,
      summary: guests?.summary || {},
      pending_guests: list
        .filter((guest) => guest.status === 'pending')
        .slice(0, 20)
        .map(({ name, side, role, count }) => ({ name, side, role, count })),
    };
  }
  if (topic.id === 'timeline' || topic.id === 'checklist') {
    const timeline = await api.getTimeline(coupleId);
    const phases = timeline?.phases || [];
    const rundown = timeline?.rundown || [];
    return {
      module: topic.id,
      data_status: phases.some((phase) => (phase.tasks || []).length) || rundown.length ? 'available' : 'empty',
      phases: phases.map((phase) => ({
        label: phase.label,
        status: phase.status,
        tasks: (phase.tasks || []).map(({ text, label, done }) => ({ text: text || label, done })),
      })),
      rundown: rundown.slice(0, 30).map(({ time, name, label, tag, done }) => ({
        time,
        name: name || label,
        tag,
        done,
      })),
    };
  }
  if (topic.id === 'ngansach') {
    const budget = await api.getBudget(coupleId);
    const categories = budget?.categories || [];
    return {
      module: 'budget',
      data_status: categories.length ? 'available' : 'empty',
      total_tr: budget?.total_tr,
      guests: budget?.guests,
      mung_tr: budget?.mung_tr,
      categories: categories.map(({ name, amt, locked, items }) => ({
        name,
        amt,
        locked,
        committed_items: (items || [])
          .filter((item) => item.vendor || item.vendor_status)
          .map(({ name: itemName, amt: itemAmount, vendor_status }) => ({
            name: itemName,
            amt: itemAmount,
            vendor_status,
          })),
      })),
    };
  }
  if (topic.id === 'vendor') {
    const [summary, budget] = await Promise.all([
      api.getSummary(coupleId),
      api.getBudget(coupleId),
    ]);
    const budgetCategories = budget?.categories || [];
    const vendorItems = budgetCategories.flatMap((category) =>
      (category.items || []).filter((item) => item.vendor || item.vendor_status)
    );
    return {
      module: 'vendors',
      data_status: vendorItems.length ? 'available' : 'empty',
      vendors: summary?.vendors || {},
      wedding: summary?.profile || {},
      budget_categories: budgetCategories.map(({ name, amt, items }) => ({
        name,
        amt,
        vendor_items: (items || [])
          .filter((item) => item.vendor || item.vendor_status)
          .map(({ name: itemName, amt: itemAmount, vendor_status }) => ({
            name: itemName,
            amt: itemAmount,
            vendor_status,
          })),
      })),
    };
  }
  return null;
}

const CTX_TO_TOPIC_ID = { plan: 'timeline', budget: 'ngansach', guests: 'khach', vendor: 'vendor' };

export function AppChat({
  coupleId = null,
  ctxId = 'home',
  chatSession,
  onMenuOpen,
  onPaywall,
  onReply,
  onAction,
  onConversationChange,
  onConversationUpdated,
  trialInfo = null,
  hideHeader = false,
}) {
  const budgetHook = useBudget(coupleId);
  const TOPICS = makeTopics(budgetHook, coupleId);
  const ctxTopic = TOPICS.find((t) => t.id === CTX_TO_TOPIC_ID[ctxId]) ?? null;

  const [msgs, setMsgs] = useState(() => initialMessages(chatSession));
  const [draft, setDraft] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [used, setUsed] = useState([]);
  const scrollRef = useRef(null);
  const convIdRef = useRef(chatSession?.conversationId ?? null);
  const msgIdRef  = useRef(0);

  useEffect(() => { const el = scrollRef.current; if (el) el.scrollTop = el.scrollHeight; }, [msgs, streaming]);

  const send = async (topic, freeText, { showCard = false, includeContext = showCard } = {}) => {
    if (streaming) return;
    const text = freeText || topic?.ask || '';
    if (!text.trim()) return;

    const journey = topic?.id === 'vendor' ? 'vendor' : 'chat';
    track('chat_message_sent', {
      journey,
      topic_id: topic?.id ?? null,
      is_topic_chip: showCard,
      has_context: includeContext,
      message_len: text.length,
    });
    setMsgs((m) => [...m, { who: 'me', text }]);
    setDraft('');
    if (topic && showCard) setUsed((u) => u.includes(topic.id) ? u : [...u, topic.id]);

    if (!coupleId) {
      setMsgs((m) => [...m, {
        who: 'ai',
        tag: null,
        intro: 'Hãy hoàn tất hồ sơ cặp đôi để Tơ Hồng có thể gọi AI với dữ liệu của bạn.',
        card: null,
        _error: true,
      }]);
      return;
    }

    // Badge turns show the requested module first, then the planner assessment.
    const pendingCard = showCard ? topic?.card ?? null : null;
    const pendingTag  = topic?.tag  ?? null;
    const followUps = includeContext ? topic?.suggestions ?? [] : [];

    if (pendingCard) {
      msgIdRef.current += 1;
      setMsgs((m) => [...m, {
        who: 'ai',
        tag: pendingTag,
        intro: '',
        card: pendingCard,
        _id: `card-${msgIdRef.current}`,
      }]);
    }

    setStreaming(true);
    msgIdRef.current += 1;
    const msgId = msgIdRef.current;
    setMsgs((m) => [...m, { who: 'ai', tag: pendingTag, intro: '', card: null, _id: msgId, _streaming: true }]);

    // Load context: explicit topic takes priority; otherwise use the current screen context
    const contextTopic = topic ?? ctxTopic;
    let context = null;
    if (contextTopic) {
      try {
        context = await loadTopicContext(coupleId, contextTopic);
      } catch {
        context = { module: contextTopic.id, data_status: 'unavailable' };
      }
    }

    let replyFailed = false;
    api.streamChat(
      coupleId,
      { conversationId: convIdRef.current, message: text, context },
      {
        onConversation: (conv) => {
          convIdRef.current = conv.id;
          onConversationChange?.(conv.id);
        },
        onChunk: (chunk) => {
          setMsgs((m) => m.map((msg) =>
            msg._id === msgId ? { ...msg, intro: msg.intro + chunk } : msg
          ));
        },
        onAction: (actionResult) => {
          onAction?.(actionResult);
        },
        onDone: () => {
          setStreaming(false);
          track('chat_reply_received', { journey, topic_id: topic?.id ?? null });
          setMsgs((m) => m.map((msg) =>
            msg._id === msgId
              ? { ...msg, suggestions: replyFailed ? [] : followUps, _streaming: false }
              : msg
          ));
          onReply?.();
          onConversationUpdated?.();
        },
        onError: (errMsg) => {
          replyFailed = true;
          setStreaming(false);
          track('chat_error', { journey, topic_id: topic?.id ?? null, error: errMsg, source: 'sse' });
          setMsgs((m) => m.map((msg) =>
            msg._id === msgId ? {
              ...msg,
              intro: errMsg || 'Lỗi kết nối — thử lại nhé 🙏',
              retryTopic: includeContext ? topic : null,
              _streaming: false,
              _error: true,
            } : msg
          ));
        },
      },
    ).catch((err) => {
      setStreaming(false);
      if (err.status === 402) {
        // Remove the placeholder, trigger paywall
        setMsgs((m) => m.filter((msg) => msg._id !== msgId));
        track('chat_trial_exhausted', { journey, topic_id: topic?.id ?? null });
        onPaywall?.();
      } else {
        track('chat_error', { journey, topic_id: topic?.id ?? null, error: err.message, source: 'fetch', status: err.status });
        setMsgs((m) => m.map((msg) =>
          msg._id === msgId ? {
            ...msg,
            intro: 'Lỗi kết nối — thử lại nhé 🙏',
            retryTopic: includeContext ? topic : null,
            _streaming: false,
            _error: true,
          } : msg
        ));
      }
    });
  };

  const remaining = TOPICS.filter((t) => !used.includes(t.id));
  const chips = remaining.length ? remaining : TOPICS;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--paper)' }}>
      {/* header — hidden when used inside AIChatModal */}
      {!hideHeader && <div style={{ flexShrink: 0, background: 'rgba(252,248,243,0.92)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--line-100)', display: 'flex', alignItems: 'center', gap: 11, padding: 'var(--header-pt) 16px 11px' }}>
        <button onClick={onMenuOpen} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
          <Icon name="menu" size={22} color="var(--ink-700)" />
        </button>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 9 }}>
          <ThreadMark size={24} />
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, color: 'var(--ink-900)', lineHeight: 1.1 }}>Tơ Hồng</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: streaming ? 'var(--amber-500)' : 'var(--sage-500)', transition: 'background .3s' }} />
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--ink-500)' }}>{streaming ? 'đang trả lời…' : 'trợ lý cưới · đang trực'}</span>
              {trialInfo && (
                <span style={{ display: 'flex', gap: 3, marginLeft: 2 }}>
                  {Array.from({ length: trialInfo.total }).map((_, i) => (
                    <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', transition: 'background .3s',
                      background: i < trialInfo.remaining ? 'var(--son-400)' : 'var(--line-300)' }} />
                  ))}
                </span>
              )}
            </div>
          </div>
        </div>
        <Icon name="search" size={20} color="var(--ink-400)" />
      </div>}

      {/* thread */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {chatSession?.loading && <TypingDots />}
        {msgs.map((m, i) => m.who === 'me'
          ? <AUserBubble key={m._id ?? i}>{m.text}</AUserBubble>
          : m._streaming && !m.intro ? null
          : <AAssistant key={m._id ?? i} tag={m.tag}>
              {m.intro !== '' && (
                m._error || typeof m.intro !== 'string'
                  ? <ASay>{m.intro}</ASay>
                  : <BotMarkdown text={m.intro} />
              )}
              {m.card && m.card()}
              <QuickReplies
                items={m.suggestions}
                disabled={streaming}
                onSelect={(suggestion) => send(null, suggestion)}
              />
              <RetryReply
                disabled={streaming}
                onRetry={m.retryTopic
                  ? () => send(m.retryTopic, m.retryTopic.ask, { includeContext: true })
                  : null}
              />
            </AAssistant>
        )}
        {streaming && !msgs[msgs.length - 1]?.intro && <TypingDots />}
      </div>

      {/* composer */}
      <div style={{ flexShrink: 0, borderTop: '1px solid var(--line-100)', background: 'var(--paper)', padding: '10px 14px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'var(--card)', border: '1px solid var(--line-200)',
          borderRadius: 'var(--r-xl)', padding: '6px 6px 6px 16px', boxShadow: 'var(--shadow-xs)' }}>
          <Icon name="plus" size={20} color="var(--ink-400)" />
          <input value={draft} onChange={(e) => setDraft(e.target.value)} disabled={streaming}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && draft.trim() && !streaming) {
                const hit = TOPICS.find((t) => draft.toLowerCase().includes(t.id) || draft.toLowerCase().includes(t.chip.toLowerCase()));
                send(hit || null, draft.trim());
              }
            }}
            placeholder={streaming ? 'Đang trả lời…' : 'Nhắn cho Tơ Hồng…'}
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font-body)', fontSize: 14.5, color: 'var(--ink-900)' }} />
          <button
            onClick={() => {
              if (draft.trim() && !streaming) {
                const hit = TOPICS.find((t) => draft.toLowerCase().includes(t.id) || draft.toLowerCase().includes(t.chip.toLowerCase()));
                send(hit || null, draft.trim());
              }
            }}
            style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', flexShrink: 0,
              background: (draft.trim() && !streaming) ? 'var(--son-500)' : 'var(--line-200)',
              cursor: (draft.trim() && !streaming) ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="arrow-up" size={18} color="#fff" sw={2.2} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default AppChat;
