// Runtime config — reads VITE_ env vars set at build time (or Cloudflare Pages env).
// Operators can override these without touching source code.
// Defaults reflect current production values so nothing breaks if vars are absent.

function num(key, fallback) {
  const v = import.meta.env[key];
  const n = v !== undefined ? Number(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

function str(key, fallback) {
  return import.meta.env[key] || fallback;
}

function bool(key, fallback) {
  const v = import.meta.env[key];
  if (v === undefined) return fallback;
  return v === 'true' || v === '1';
}

// ── Subscription / Trial ──────────────────────────────────────────────────────
export const TRIAL_MESSAGES_TOTAL = num('VITE_TRIAL_MESSAGES_TOTAL', 6);

// Plan definitions. To change prices without a rebuild, update VITE_PLAN_PRICES
// as a JSON string: '[{"id":"m1","months":1,"price":99}, ...]'
const _rawPlans = import.meta.env.VITE_PLAN_PRICES;
export const PLANS = _rawPlans
  ? (() => { try { return JSON.parse(_rawPlans); } catch { return null; } })()
  : null; // null → paywall.jsx uses its own hardcoded PLANS (backward compat)

// ── Feature flags ─────────────────────────────────────────────────────────────
export const FEATURE_FLAGS = {
  // Show trial message counter banner in chat header
  trialBanner: bool('VITE_FF_TRIAL_BANNER', true),
  // Allow trial extension (1x free +3 messages)
  trialExtension: bool('VITE_FF_TRIAL_EXTENSION', true),
  // Enable Clerk auth (mirrored from existing check — for one place to look)
  clerkAuth: bool('VITE_CLERK_PUBLISHABLE_KEY', false),
};

// ── App metadata ──────────────────────────────────────────────────────────────
export const APP_NAME = str('VITE_APP_NAME', 'Tơ Hồng');
export const SUPPORT_EMAIL = str('VITE_SUPPORT_EMAIL', '');
