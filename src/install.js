// Gợi ý cài app ra màn hình chính (T-030, spec T-027 mục 9).
// Trạng thái ở module để bắt được beforeinstallprompt dù nó đến trước khi app dựng xong.
import { useSyncExternalStore } from 'react';

const OFF_KEY = 'th_install_hint_off';

let deferred = null;      // sự kiện beforeinstallprompt đang giữ
let hiddenNow = false;    // đã ẩn trong phiên này (bấm Cài ứng dụng, hoặc đã cài)
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());

function readOff() {
  try { return localStorage.getItem(OFF_KEY) === '1'; } catch { return false; }
}

export function isStandalone() {
  try {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  } catch { return false; }
}

const isIos = () => /iPhone|iPad|iPod/.test(window.navigator.userAgent || '');

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // Chrome không hiện thanh gợi ý riêng
    deferred = e;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    hiddenNow = true;
    emit();
  });
}

/** '' (không hiện) | 'prompt' (có sự kiện cài) | 'ios' (hướng dẫn thủ công). */
function getMode() {
  if (hiddenNow || isStandalone() || readOff()) return '';
  if (deferred) return 'prompt';
  if (isIos()) return 'ios';
  return '';
}

function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useInstallMode() {
  return useSyncExternalStore(subscribe, getMode, () => '');
}

export function installPlatform() {
  const ua = window.navigator.userAgent || '';
  if (/Android/.test(ua)) return 'android';
  if (isIos()) return 'ios';
  return 'other';
}

/** Bấm "Không nhắc lại": nhớ ở thiết bị này (localStorage), không gửi đi đâu. */
export function turnOffInstallHint() {
  try { localStorage.setItem(OFF_KEY, '1'); } catch { /* bỏ qua */ }
  emit();
}

/** Bấm "Cài ứng dụng": gọi prompt() đúng một lần, ẩn gợi ý; trả về kết quả của trình duyệt. */
export async function promptInstall() {
  const ev = deferred;
  if (!ev) return null;
  deferred = null;
  hiddenNow = true;
  emit();
  try {
    await ev.prompt();
    const choice = await ev.userChoice;
    return choice && choice.outcome === 'accepted' ? 'accepted' : 'dismissed';
  } catch {
    return 'dismissed';
  }
}
