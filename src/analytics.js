// Analytics — thin wrapper over PostHog Capture API (no npm package needed).
// Set VITE_POSTHOG_KEY to enable. Falls back to console.debug in dev when unset.
// All calls are fire-and-forget; nothing throws or blocks the UI.

import { buildCommonProps } from './journey.js';

const KEY     = import.meta.env.VITE_POSTHOG_KEY;
const HOST    = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';
const VARIANT = import.meta.env.VITE_EXPERIMENT_VARIANT ?? null;

const STORAGE_KEY = 'th_anon_id';

function getAnonId() {
  try {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

function getDeviceType() {
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

let _distinctId = getAnonId();
let _anonId     = _distinctId;

// Journey timer — tracks start times per journey name for duration_ms
const _journeyStart = new Map();

export function startJourney(journey) {
  _journeyStart.set(journey, Date.now());
}

export function journeyDuration(journey) {
  const t = _journeyStart.get(journey);
  return t != null ? Date.now() - t : undefined;
}

export function endJourney(journey) {
  const d = journeyDuration(journey);
  _journeyStart.delete(journey);
  return d;
}

// ── Journey context (spec 003) ─────────────────────────────────────────────
// Giá trị thô chỉ nằm trong bộ nhớ để tính NHÓM; payload chỉ nhận nhóm (buildCommonProps).
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';
let _journeyCtx = {};

// Gộp từng phần: khoá nào undefined thì giữ giá trị cũ.
export function setJourneyContext(partial = {}) {
  const next = { ..._journeyCtx };
  for (const k of ['coupleId', 'weddingDate', 'budgetTr', 'guestCount']) {
    if (partial[k] !== undefined) next[k] = partial[k];
  }
  _journeyCtx = next;
}

function commonProps() {
  try {
    return buildCommonProps(_journeyCtx, APP_VERSION);
  } catch {
    return {}; // lỗi tính nhóm không được chặn sự kiện
  }
}

function post(event, props = {}) {
  if (!KEY) {
    if (import.meta.env.DEV) console.debug('[analytics]', event, { ...commonProps(), ...props });
    return;
  }
  const payload = {
    api_key: KEY,
    event,
    distinct_id: _distinctId,
    properties: {
      ...commonProps(),
      ...props,
      device_type: getDeviceType(),
      ...(VARIANT != null ? { variant: VARIANT } : {}),
      $lib: 'tohong-web',
      $current_url: location.href,
    },
    timestamp: new Date().toISOString(),
  };
  fetch(`${HOST}/capture/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {});
}

// Call once after auth — links anonymous session to real userId.
export function identify(userId, traits = {}) {
  if (!userId) return;
  const wasAnon = _distinctId === _anonId;
  _distinctId = userId;

  if (wasAnon && KEY) {
    post('$identify', {
      $set: traits,
      $anon_distinct_id: _anonId,
    });
  }
}

// Log out — reset to a fresh anonymous ID.
export function reset() {
  _anonId = crypto.randomUUID();
  _distinctId = _anonId;
  try { localStorage.setItem(STORAGE_KEY, _anonId); } catch { /* ignore */ }
}

// Generic event tracker.
export function track(event, props = {}) {
  post(event, props);
}
