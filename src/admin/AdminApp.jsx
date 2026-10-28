import { useCallback, useState } from 'react';
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  useAuth,
  useClerk,
} from '@clerk/clerk-react';
import { api, setTokenProvider } from '../api.js';
import { ThreadMark } from '../ui/atoms.jsx';
import './admin.css';
import { Loading, ErrorNote } from './common.jsx';
import { useLoad } from './useLoad.js';
import { ConnectInbox } from './ConnectInbox.jsx';
import { UpgradeQueue } from './UpgradeQueue.jsx';
import { LegacyPlans } from './LegacyPlans.jsx';
import { VendorData } from './VendorData.jsx';
import { AuditLog } from './AuditLog.jsx';

// Trang admin đợt 1 (spec 002). Mở bằng /?admin.
// Không có guest, không gọi `track` ở bất kỳ file nào trong src/admin/ (research R8).

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
// Chỉ dùng khi chạy local không có Clerk: backend chỉ nhận token "dev:…" khi DEV_AUTH_BYPASS bật.
const DEV_ADMIN_TOKEN = import.meta.env.VITE_ADMIN_DEV_TOKEN;

const TABS = [
  { id: 'connect', label: 'Hộp kết nối', count: 'connect_new' },
  { id: 'upgrade', label: 'Nâng cấp gói', count: 'upgrade_pending' },
  { id: 'legacy', label: 'Gói tự kích hoạt', count: 'legacy_active' },
  { id: 'vendors', label: 'Dữ liệu vendor' },
  { id: 'audit', label: 'Nhật ký' },
];

export default function AdminApp() {
  if (PUBLISHABLE_KEY) {
    return (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/?admin">
        <SignedOut>
          <Frame>
            <div className="adm-center">
              <ThreadMark size={40} />
              <h1 className="adm-title">Tơ Hồng · Admin</h1>
              <p className="adm-lead">Đăng nhập bằng tài khoản quản trị để tiếp tục.</p>
              <SignInButton mode="modal">
                <button type="button" className="adm-btn adm-btn-primary">Đăng nhập</button>
              </SignInButton>
            </div>
          </Frame>
        </SignedOut>
        <SignedIn>
          <ClerkAuthed />
        </SignedIn>
      </ClerkProvider>
    );
  }
  if (DEV_ADMIN_TOKEN) return <DevAuthed />;
  return (
    <Frame>
      <div className="adm-center">
        <h1 className="adm-title">Tơ Hồng · Admin</h1>
        <p className="adm-lead">Chưa cấu hình đăng nhập (thiếu VITE_CLERK_PUBLISHABLE_KEY).</p>
      </div>
    </Frame>
  );
}

function ClerkAuthed() {
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  // Phải gắn token Clerk TRƯỚC mọi lời gọi API của các màn con (api.js mặc định dùng token guest
  // và sẽ luôn bị 403). useState khởi tạo chạy trong lần render đầu, trước effect của con.
  useState(() => {
    setTokenProvider(() => getToken());
    return true;
  });
  return <AdminShell onSignOut={() => signOut()} />;
}

function DevAuthed() {
  useState(() => {
    setTokenProvider(() => DEV_ADMIN_TOKEN);
    return true;
  });
  return <AdminShell />;
}

function Frame({ children, right }) {
  return (
    <div className="adm-page">
      <header className="adm-header">
        <div className="adm-brand">
          <ThreadMark size={22} />
          <span>Tơ Hồng · Admin</span>
        </div>
        <div>{right}</div>
      </header>
      <main className="adm-main">{children}</main>
    </div>
  );
}

function AdminShell({ onSignOut }) {
  const [tab, setTab] = useState('connect');
  // Mở "Dữ liệu vendor" thẳng vào một vendor (nút "Sửa vendor này" ở hộp kết nối)
  const [focusVendor, setFocusVendor] = useState(null);
  const fetchMe = useCallback(() => api.adminMe(), []);
  const { data: me, error, status, reload: loadMe } = useLoad(fetchMe);
  const state = status === 403 ? 'denied' : me ? 'ok' : error ? 'error' : 'loading';

  const right = onSignOut ? (
    <button type="button" className="adm-btn adm-btn-sm" onClick={onSignOut}>Đăng xuất</button>
  ) : null;

  if (state === 'loading') return <Frame right={right}><Loading /></Frame>;
  if (state === 'denied') {
    return (
      <Frame right={right}>
        <div className="adm-center">
          <h1 className="adm-title">Bạn không có quyền xem trang này</h1>
          <p className="adm-lead">Trang này chỉ dành cho quản trị viên của Tơ Hồng.</p>
        </div>
      </Frame>
    );
  }
  if (state === 'error') {
    return <Frame right={right}><ErrorNote error={error} onRetry={loadMe} /></Frame>;
  }

  const counts = me?.counts || {};
  const openVendor = (id) => { setFocusVendor(id); setTab('vendors'); };

  return (
    <Frame right={right}>
      <nav className="adm-tabs" aria-label="Các mục admin">
        {TABS.map((t) => {
          const n = t.count ? counts[t.count] : 0;
          return (
            <button
              key={t.id}
              type="button"
              className={`adm-tab ${tab === t.id ? 'is-active' : ''}`}
              onClick={() => { if (t.id !== 'vendors') setFocusVendor(null); setTab(t.id); }}
            >
              {t.label}
              {n > 0 && <span className="adm-count" aria-label={`${n} mục`}>{n}</span>}
            </button>
          );
        })}
      </nav>
      {tab === 'connect' && <ConnectInbox onChanged={loadMe} onEditVendor={openVendor} />}
      {tab === 'upgrade' && <UpgradeQueue onChanged={loadMe} />}
      {tab === 'legacy' && <LegacyPlans onChanged={loadMe} />}
      {tab === 'vendors' && <VendorData key={focusVendor || 'all'} focusId={focusVendor} />}
      {tab === 'audit' && <AuditLog />}
    </Frame>
  );
}
