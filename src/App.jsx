import { useCallback, useEffect, useState } from 'react';
import {
  ChevronRight,
  MessageCircle,
  PanelLeftClose,
  Plus,
} from 'lucide-react';
import { api } from './api.js';
import { track, endJourney } from './analytics.js';
import { Icon } from './ui/Icon.jsx';
import { ThreadMark } from './ui/atoms.jsx';
import { ScreenDashboard } from './screens/Dashboard.jsx';
import { AIChatModal } from './screens/chat/AIChatModal.jsx';
import { ScreenTimeline } from './screens/Timeline.jsx';
import { ScreenBudget } from './screens/Budget.jsx';
import { ScreenGuests } from './screens/Guests.jsx';
import { Onboarding } from './screens/Onboarding.jsx';
import { ScreenVendorShortlist } from './screens/Vendors.jsx';
import { VendorProvider } from './screens/VendorCtx.jsx';
import { SaveBanner } from './ui/SaveBanner.jsx';

/* ── shared micro-components ─────────────────────────────── */
function IconButton({ label, children, onClick }) {
  return (
    <button className="icon-button" type="button" aria-label={label} title={label} onClick={onClick}>
      {children}
    </button>
  );
}

function Brand() {
  return (
    <div className="brand">
      <ThreadMark size={22} />
      <span>Tơ H<span>ồ</span>ng</span>
    </div>
  );
}

/* ── bottom tab bar (4 tabs — chat is now the AI modal) ─────── */
const TAB_CONF = [
  { id: 'home',    idx: 0, icon: 'house',          label: 'Trang chủ' },
  { id: 'plan',    idx: 2, icon: 'calendar-clock', label: 'Kế hoạch'  },
  { id: 'budget',  idx: 3, icon: 'wallet',         label: 'Ngân sách' },
  { id: 'guests',  idx: 4, icon: 'users',          label: 'Khách mời' },
  { id: 'vendors', idx: 5, icon: 'store',          label: 'Vendors'   },
];

const CTX_BY_TAB = { 0: 'home', 2: 'plan', 3: 'budget', 4: 'guests', 5: 'vendor' };

function BottomTabBar({ active, onSelect }) {
  return (
    <div style={{ display: 'flex', flexShrink: 0, background: 'rgba(252,248,243,0.97)',
      backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      borderTop: '1px solid var(--line-100)', padding: '6px 0 env(safe-area-inset-bottom,8px)' }}>
      {TAB_CONF.map((t) => {
        const on = active === t.idx;
        return (
          <button key={t.id} onClick={() => onSelect(t.idx)} style={{ flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 2, padding: '9px 2px 5px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <Icon name={t.icon} size={23} color={on ? 'var(--son-500)' : 'var(--ink-400)'} sw={on ? 2.2 : 1.7} />
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 9.5, fontWeight: on ? 700 : 500,
              letterSpacing: '0.01em', color: on ? 'var(--son-600)' : 'var(--ink-400)' }}>{t.label}</span>
            <span style={{ width: on ? 16 : 0, height: 2.5, borderRadius: 999,
              background: 'var(--son-500)', transition: 'width .18s ease' }} />
          </button>
        );
      })}
    </div>
  );
}

/* ── slim drawer ─────────────────────────────────────────── */
function Drawer({ open, onClose, onNav, onNewChat, conversations, onOpenConversation }) {
  return (
    <>
      <button className={`drawer-scrim ${open ? 'is-open' : ''}`} type="button" aria-label="Đóng menu" onClick={onClose} />
      <aside className={`drawer ${open ? 'is-open' : ''}`}>
        <div className="drawer-head">
          <Brand />
          <IconButton label="Đóng menu" onClick={onClose}>
            <PanelLeftClose size={20} />
          </IconButton>
        </div>
        <div className="drawer-new">
          <button type="button" onClick={onNewChat}>
            <Plus size={17} /> Cuộc trò chuyện mới
          </button>
        </div>
        <div className="drawer-scroll">
          <p className="ds-label">Kế hoạch cưới</p>
          {/* drawer nav → tab indices */}
          {[['house', 'Trang chủ', 0], ['calendar-clock', 'Kế hoạch', 2], ['wallet', 'Ngân sách', 3], ['users', 'Khách mời', 4], ['store', 'Vendors', 5]].map(([ico, label, idx]) => (
            <button className="drawer-link" key={label} type="button" onClick={() => { onNav(idx); onClose(); }}>
              <Icon name={ico} size={20} color="var(--son-500)" />
              <span>{label}</span>
              <ChevronRight size={17} />
            </button>
          ))}
          {conversations.length > 0 && (
            <>
              <p className="ds-label recent-label">Gần đây</p>
              {conversations.map((conv) => (
                <button className="drawer-recent" key={conv.id} type="button" onClick={() => { onOpenConversation(conv.id); onClose(); }}>
                  <MessageCircle size={16} />
                  <span>{conv.title}</span>
                </button>
              ))}
            </>
          )}
        </div>
        <div className="drawer-profile">
          <div className="avatar">M&amp;B</div>
          <div>
            <strong>Minh Anh &amp; Quốc Bảo</strong>
            <span>Cưới · 12·12·2026</span>
          </div>
        </div>
      </aside>
    </>
  );
}

/* ── root app ────────────────────────────────────────────── */
export default function App({ isGuest = false, onShowSignIn } = {}) {
  const [tab, setTab] = useState(0);
  const [drawer, setDrawer] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiCtx, setAiCtx] = useState('home');

  const hasLocalProfile = (() => { try { return !!localStorage.getItem('th_user'); } catch { return false; } })();
  const [obOpen, setObOpen] = useState(!hasLocalProfile);

  const [coupleId, setCoupleId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [refreshKeys, setRefreshKeys] = useState({ budget: 0, guests: 0, timeline: 0 });
  const [vendorKey, setVendorKey] = useState(0);
  const [vendorSeed, setVendorSeed] = useState(null);
  const [chatSession, setChatSession] = useState({
    conversationId: null,
    messages: null,
    loading: false,
    error: '',
    version: 0,
  });

  const openAI = useCallback((ctx) => {
    setAiCtx(ctx || CTX_BY_TAB[tab] || 'home');
    setVendorSeed(null);
    setAiOpen(true);
  }, [tab]);

  const openAIVendor = (catId) => {
    setAiCtx('vendor');
    setVendorSeed(catId ? { catId } : { catId: null });
    setAiOpen(true);
  };

  const loadConversations = (cid) =>
    api.listConversations(cid).then((r) => setConversations(r.conversations || [])).catch(() => {});

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('ob') === '1') {
      setObOpen(true);
    }
  }, []);

  useEffect(() => {
    track('app_loaded');
    api.getMe()
      .then((data) => {
        if (data.couples?.length) {
          const cid = data.couples[0].couple_id;
          setCoupleId(cid);
          track('session_resumed', { couple_id: cid });
          return loadConversations(cid);
        }
      })
      .catch(() => {});
  }, []);

  const handleObDone = async (data, styleProfile) => {
    setObOpen(false);
    track('onboarding_completed', { journey: 'onboarding', duration_ms: endJourney('onboarding'), city: data.city });

    // Derive vùng miền từ thành phố tổ chức cưới
    const CITY_REGION = {
      'TP.HCM': 'Nam', 'Cần Thơ': 'Nam', 'Vũng Tàu': 'Nam', 'Biên Hòa': 'Nam', 'Mỹ Tho': 'Nam', 'Rạch Giá': 'Nam',
      'Hà Nội': 'Bắc', 'Hải Phòng': 'Bắc', 'Hạ Long': 'Bắc', 'Bắc Ninh': 'Bắc', 'Hải Dương': 'Bắc', 'Thái Nguyên': 'Bắc', 'Nam Định': 'Bắc',
      'Đà Nẵng': 'Trung', 'Huế': 'Trung', 'Nha Trang': 'Trung', 'Đà Lạt': 'Trung', 'Quy Nhơn': 'Trung', 'Vinh': 'Trung', 'Buôn Ma Thuột': 'Trung', 'Phan Thiết': 'Trung',
    };
    const region = CITY_REGION[data.city] || 'Nam';

    // Map phong cách từ key onboarding → style tag backend matcher dùng
    const STYLE_TAG_MAP = { han: 'korean', luxury: 'luxury', rustic: 'rustic', natural: 'natural', modern: 'modern', traditional: 'traditional' };
    const styleTags = (styleProfile || []).filter(s => s.pct > 0).slice(0, 3).map(s => STYLE_TAG_MAP[s.key] || s.key);

    // Chuyển tháng/năm cưới → ISO date (ngày 1 đầu tháng)
    const weddingDate = `${data.weddingY}-${String(data.weddingM).padStart(2, '0')}-${String(data.weddingD || 1).padStart(2, '0')}`;

    try {
      // Tái dùng couple đang hiển thị (getMe luôn load couples[0]). Nếu tạo couple
      // mới mỗi lần onboarding, couple mới bị append vào cuối user.couples nhưng
      // reload app lại lấy couples[0] (couple cũ nhất) → lựa chọn onboarding (vd
      // ngân sách 200tr) bị mồ côi, app hiển thị couple cũ. Chỉ tạo khi chưa có.
      let cid = coupleId;
      if (!cid) {
        const { couple } = await api.createCouple({
          bride_name: data.brideName,
          groom_name: data.groomName,
          wedding_date: weddingDate,
          wedding_role: data.userRole,   // 'bride' | 'groom' — stored in member record
        });
        cid = couple.couple_id;
      }
      await api.updateProfile(cid, {
        couple: { bride_name: data.brideName, groom_name: data.groomName, wedding_date: weddingDate, city: data.city },
        families: { bride_region: region, groom_region: region },
        preferences: { style_tags: styleTags, guest_count: data.guests },
        // top-level fields đọc trực tiếp bởi buildMatchProfile
        guest_count: data.guests,
        budget: data.budget,  // đơn vị triệu
      });
      setCoupleId(cid);
      loadConversations(cid);
    } catch {
      // API unavailable — local profile in localStorage đủ để vào app
    }
  };

  const openConversation = async (convId) => {
    setAiOpen(true);
    setChatSession((current) => ({
      conversationId: convId,
      messages: null,
      loading: true,
      error: '',
      version: current.version + 1,
    }));
    try {
      const data = await api.getMessages(coupleId, convId);
      setChatSession((current) => (
        current.conversationId === convId
          ? {
              ...current,
              messages: data.messages || [],
              loading: false,
              version: current.version + 1,
            }
          : current
      ));
    } catch (err) {
      setChatSession((current) => (
        current.conversationId === convId
          ? {
              ...current,
              loading: false,
              error: err.message || 'Không tải được cuộc trò chuyện',
              version: current.version + 1,
            }
          : current
      ));
    }
  };

  const startNewConversation = () => {
    setChatSession((current) => ({
      conversationId: null,
      messages: null,
      loading: false,
      error: '',
      version: current.version + 1,
    }));
    setDrawer(false);
    openAI(CTX_BY_TAB[tab] || 'home');
  };

  const navigate = (i) => {
    if (i === 1) { openAI(CTX_BY_TAB[tab] || 'home'); return; }
    if (i === 5 && tab === 5) { setVendorKey((k) => k + 1); return; }
    track('tab_selected', { tab_index: i });
    setTab(i);
  };

  const ACTION_REFRESH_MAP = {
    add_guest: 'guests',
    update_guest_status: 'guests',
    add_budget_item: 'budget',
    add_checklist_task: 'timeline',
  };

  const handleAction = (actionResult) => {
    const key = ACTION_REFRESH_MAP[actionResult?.type];
    if (key) setRefreshKeys((prev) => ({ ...prev, [key]: prev[key] + 1 }));
  };

  const screens = [
    <ScreenDashboard coupleId={coupleId} navigate={navigate} onMenuOpen={() => setDrawer(true)} onOpenAI={() => openAI()} />,
    null, // chat is now the AI modal — not a screen
    <ScreenTimeline key={`timeline-${refreshKeys.timeline}`} coupleId={coupleId} navigate={navigate} onMenuOpen={() => setDrawer(true)} onOpenAI={() => openAI()} />,
    <ScreenBudget key={`budget-${refreshKeys.budget}`} coupleId={coupleId} onMenuOpen={() => setDrawer(true)} onOpenAI={() => openAI()} />,
    <ScreenGuests key={`guests-${refreshKeys.guests}`} coupleId={coupleId} navigate={navigate} onMenuOpen={() => setDrawer(true)} onOpenAI={() => openAI()} />,
    <ScreenVendorShortlist key={`vendor-${vendorKey}`} onMenuOpen={() => setDrawer(true)} onOpenVendorChat={openAIVendor} />,
  ];

  return (
    <VendorProvider coupleId={coupleId} onBudgetSync={() => setRefreshKeys((prev) => ({ ...prev, budget: prev.budget + 1 }))}>
    <div className="app-page">
      <div className="app-frame">
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {isGuest && <SaveBanner onSignIn={onShowSignIn} />}
          {/* screen stack — all mounted, shown/hidden via opacity */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            {screens.map((screen, i) => screen && (
              <div key={i} style={{ position: 'absolute', inset: 0, transition: 'opacity .2s ease',
                opacity: tab === i ? 1 : 0, pointerEvents: tab === i ? 'auto' : 'none' }}>
                {screen}
              </div>
            ))}
          </div>
          <BottomTabBar active={tab} onSelect={navigate} />
          <AIChatModal
            open={aiOpen}
            onClose={() => setAiOpen(false)}
            ctxId={aiCtx}
            coupleId={coupleId}
            chatSession={chatSession}
            onAction={handleAction}
            onConversationChange={() => loadConversations(coupleId)}
            onConversationUpdated={() => loadConversations(coupleId)}
            vendorSeed={vendorSeed}
          />
        </div>

        <Drawer
          open={drawer}
          onClose={() => setDrawer(false)}
          onNav={navigate}
          onNewChat={startNewConversation}
          conversations={conversations}
          onOpenConversation={openConversation}
        />

        <Onboarding open={obOpen} onDone={handleObDone} />
      </div>
    </div>
    </VendorProvider>
  );
}
