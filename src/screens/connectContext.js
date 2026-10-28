import { createContext, useContext } from 'react';

// Context "Nhờ Tơ Hồng kết nối vendor" (spec 002). Tách khỏi ConnectCtx.jsx để file component
// chỉ export component (react-refresh).
export const ConnectContext = createContext(null);

const NOOP_VALUE = {
  role: null,
  canAct: false,          // false = viewer hoặc chưa biết: không hiện nút kết nối/nâng cấp
  statusFor: () => null,  // vendorId → { id, display_status, display_code } | null
  openConnect: () => {},
  vendorInfoFor: () => undefined, // vendorId → { hidden, price_source, priceMin, priceMax } | null | undefined
  ensureVendorInfo: () => {},
};

export function useConnect() {
  return useContext(ConnectContext) || NOOP_VALUE;
}

const CONTACT_KEY = 'th_connect_contact';

// Liên hệ điền sẵn từ lần gửi trước, chỉ lưu trên thiết bị này (research R13).
export function loadSavedContact() {
  try {
    const raw = JSON.parse(localStorage.getItem(CONTACT_KEY) || 'null');
    return { phone: raw?.phone || '', zalo: raw?.zalo || '' };
  } catch {
    return { phone: '', zalo: '' };
  }
}

export function saveContact(contact) {
  try { localStorage.setItem(CONTACT_KEY, JSON.stringify(contact)); } catch { /* ignore */ }
}
