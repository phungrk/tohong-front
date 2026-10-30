// API client cho Workers backend (edge/). Dev: trỏ thẳng localhost:8787 (CORS đã bật).
// Token: dev bypass ("Bearer dev"). Khi gắn Clerk thật, thay getToken() bằng token Clerk.

const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8787';
const DEV_TOKEN = import.meta.env.VITE_DEV_TOKEN || 'dev';

// ── Guest token ──────────────────────────────────────────────────────────────
// Tạo/đọc token ngẫu nhiên lưu localStorage, dùng khi chưa đăng nhập.
// Backend chấp nhận token bắt đầu bằng "guest_" → userId = token.
const GUEST_TOKEN_KEY = 'th_guest_token';
export function getGuestToken() {
  try {
    let t = localStorage.getItem(GUEST_TOKEN_KEY);
    if (!t) {
      t = 'guest_' + crypto.randomUUID();
      localStorage.setItem(GUEST_TOKEN_KEY, t);
    }
    return t;
  } catch {
    return 'guest_fallback';
  }
}

export function clearGuestToken() {
  try { localStorage.removeItem(GUEST_TOKEN_KEY); } catch { /* noop */ }
}

// Mặc định: dùng guest token; khi Clerk đăng nhập, ghi đè bằng setTokenProvider
let tokenProvider = () => getGuestToken();
export function setTokenProvider(fn) {
  tokenProvider = fn;
}
export function resetTokenProvider() {
  tokenProvider = () => getGuestToken();
}

async function authHeaders(extra = {}) {
  let token = await tokenProvider();
  // Clerk sometimes returns null on first call — retry once after a short wait
  if (!token) {
    await new Promise((r) => setTimeout(r, 300));
    token = await tokenProvider();
  }
  if (!token) throw new Error('Phiên đăng nhập chưa sẵn sàng. Vui lòng tải lại trang.');
  return { Authorization: `Bearer ${token}`, ...extra };
}

// Lỗi API: giữ message cũ (data.error || "HTTP n"), thêm err.status và err.code (= data.error).
async function apiError(res) {
  const data = await res.json().catch(() => ({}));
  const err = new Error(data.error || `HTTP ${res.status}`);
  err.status = res.status;
  err.code = typeof data.error === 'string' ? data.error : null;
  return err;
}

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: await authHeaders(
      body ? { 'Content-Type': 'application/json' } : {},
    ),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw await apiError(res);
  return res.json();
}

// Returns null on 404 instead of throwing — for resources that may not yet exist.
async function reqOrNull(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: await authHeaders(body ? { 'Content-Type': 'application/json' } : {}),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 404) return null;
  if (!res.ok) throw await apiError(res);
  return res.json();
}

export const api = {
  getMe: () => req('GET', '/api/me'),

  createCouple: (input) => req('POST', '/api/couples', input),

  getProfile: (coupleId) => req('GET', `/api/couples/${coupleId}`),

  updateProfile: (coupleId, patch) =>
    req('PATCH', `/api/couples/${coupleId}`, patch),

  listConversations: (coupleId, limit = 20) =>
    req('GET', `/api/couples/${coupleId}/conversations?limit=${limit}`),

  async getMessages(coupleId, conversationId) {
    const messages = [];
    let after = null;
    let conversation;

    do {
      const query = after ? `?after=${encodeURIComponent(after)}&limit=50` : '?limit=50';
      const page = await req(
        'GET',
        `/api/couples/${coupleId}/conversations/${conversationId}/messages${query}`,
      );
      conversation = page.conversation;
      messages.push(...(page.messages || []));
      after = page.next_cursor || null;
    } while (after);

    return { conversation, messages, next_cursor: null };
  },

  // ── Thành viên / lời mời (API có sẵn, không đổi) ──────────────────────────
  // GET → { members, invites (pending) }; POST body { email, role: member|viewer|owner } → { ok: true }
  listMembers: (coupleId) => req('GET', `/api/couples/${coupleId}/members`),
  inviteMember: (coupleId, { email, role }) =>
    req('POST', `/api/couples/${coupleId}/members`, { email, role }),

  // ── Summary ────────────────────────────────────────────────────────────────
  getSummary: (coupleId) => req('GET', `/api/couples/${coupleId}/summary`),

  // ── Budget ─────────────────────────────────────────────────────────────────
  getBudget: (coupleId) => reqOrNull('GET', `/api/couples/${coupleId}/budget`),
  putBudget: (coupleId, body) => req('PUT', `/api/couples/${coupleId}/budget`, body),

  // ── Timeline ───────────────────────────────────────────────────────────────
  getTimeline: (coupleId) => reqOrNull('GET', `/api/couples/${coupleId}/timeline`),
  putTimeline: (coupleId, body) => req('PUT', `/api/couples/${coupleId}/timeline`, body),

  // ── Guests ─────────────────────────────────────────────────────────────────
  getGuests: (coupleId) => req('GET', `/api/couples/${coupleId}/guests`),
  addGuest: (coupleId, body) => req('POST', `/api/couples/${coupleId}/guests`, body),
  updateGuest: (coupleId, gid, patch) => req('PATCH', `/api/couples/${coupleId}/guests/${gid}`, patch),
  deleteGuest: (coupleId, gid) => req('DELETE', `/api/couples/${coupleId}/guests/${gid}`),

  // ── Guest claim ────────────────────────────────────────────────────────────
  // Gọi sau khi user đăng ký/đăng nhập Clerk để di trú dữ liệu guest → account
  claimGuest: (guestToken) => req('POST', '/api/claim', { guestToken }),

  // ── Subscription ───────────────────────────────────────────────────────────
  getSubscription: (coupleId) => req('GET', `/api/couples/${coupleId}/subscription`),
  extendTrial: (coupleId) => req('POST', `/api/couples/${coupleId}/subscription/trial`),

  // ── Nâng cấp gói: chỉ tạo yêu cầu, Tơ Hồng kích hoạt thủ công sau khi nhận chuyển khoản ──
  requestUpgrade: (coupleId, plan, contact) =>
    req('POST', `/api/couples/${coupleId}/upgrade-request`, { plan, ...(contact ? { contact } : {}) }),
  getUpgradeRequest: (coupleId) => req('GET', `/api/couples/${coupleId}/upgrade-request`),

  // ── Nhờ Tơ Hồng kết nối vendor ─────────────────────────────────────────────
  createConnectRequest: (coupleId, body) =>
    req('POST', `/api/couples/${coupleId}/connect-requests`, body),
  listConnectRequests: (coupleId) => req('GET', `/api/couples/${coupleId}/connect-requests`),
  // ids ≤ 50 → { vendors: { [id]: { hidden, price_source, priceMin, priceMax } | null } }
  getVendorStatuses: (ids) => req('POST', '/api/vendors/status', { ids }),

  // ── AI features ────────────────────────────────────────────────────────────
  getBriefing: (coupleId) => reqOrNull('GET', `/api/couples/${coupleId}/briefing`),
  getBudgetProposal: (coupleId) => reqOrNull('GET', `/api/couples/${coupleId}/budget/proposal`),
  getTimelineSuggestions: (coupleId) => reqOrNull('GET', `/api/couples/${coupleId}/timeline/suggestions`),

  // ── Vendor matching ────────────────────────────────────────────────────────
  matchVendors: (coupleId, { category, limit, offset, minScore } = {}) => {
    const params = new URLSearchParams({ coupleId: coupleId || '' });
    if (category) params.set('category', category);
    if (limit != null) params.set('limit', limit);
    if (offset != null) params.set('offset', offset);
    if (minScore != null) params.set('minScore', minScore);
    return req('GET', `/api/vendors/match?${params}`);
  },

  getVendorCategories: (coupleId) =>
    req('GET', `/api/vendors/categories?coupleId=${coupleId || ''}`),

  getVendorDetail: (vendorId, coupleId) =>
    req('GET', `/api/vendors/${vendorId}?coupleId=${coupleId || ''}`),

  addToShortlist: (coupleId, vendorId) =>
    req('POST', `/api/couples/${coupleId}/shortlist`, { vendorId }),

  removeFromShortlist: (coupleId, vendorId) =>
    req('DELETE', `/api/couples/${coupleId}/shortlist/${vendorId}`),

  dismissVendor: (coupleId, vendorId) =>
    req('POST', `/api/couples/${coupleId}/dismiss`, { vendorId }),

  getVendorPrefs: (coupleId) =>
    reqOrNull('GET', `/api/couples/${coupleId}/shortlist`),

  // ── Admin (chỉ ADMIN_USER_IDS; còn lại 403 forbidden) ─────────────────────
  adminMe: () => req('GET', '/api/admin/me'),
  adminMembersSummary: ({ refresh } = {}) =>
    req('GET', `/api/admin/members-summary${refresh ? '?refresh=1' : ''}`),
  adminAudit: ({ action, cursor, limit } = {}) => {
    const q = new URLSearchParams();
    if (action) q.set('action', action);
    if (cursor) q.set('cursor', cursor);
    if (limit) q.set('limit', limit);
    return req('GET', `/api/admin/audit?${q}`);
  },
  adminConnectList: (status = 'open') =>
    req('GET', `/api/admin/connect-requests?status=${encodeURIComponent(status)}`),
  adminConnectGet: (id) => req('GET', `/api/admin/connect-requests/${id}`),
  adminConnectPatch: (id, body) => req('PATCH', `/api/admin/connect-requests/${id}`, body),
  adminUpgradeList: (status = 'pending') =>
    req('GET', `/api/admin/upgrade-requests?status=${encodeURIComponent(status)}`),
  adminUpgradeActivate: (coupleId, note) =>
    req('POST', `/api/admin/upgrade-requests/${coupleId}/activate`, { note: note || '' }),
  adminUpgradeReject: (coupleId, note) =>
    req('POST', `/api/admin/upgrade-requests/${coupleId}/reject`, { note }),
  adminLegacyList: () => req('GET', '/api/admin/legacy-subscriptions'),
  adminLegacyRevoke: (coupleId) =>
    req('POST', `/api/admin/couples/${coupleId}/subscription/revoke`, { note: '' }),
  adminLegacyKeep: (coupleId) =>
    req('POST', `/api/admin/couples/${coupleId}/subscription/keep`, { note: '' }),
  adminVendors: ({ category, label, q, offset, limit } = {}) => {
    const p = new URLSearchParams();
    if (category) p.set('category', category);
    if (label) p.set('label', label);
    if (q) p.set('q', q);
    if (offset) p.set('offset', offset);
    if (limit) p.set('limit', limit);
    return req('GET', `/api/admin/vendors?${p}`);
  },
  adminVendorGet: (id) => req('GET', `/api/admin/vendors/${encodeURIComponent(id)}`),
  adminVendorPut: (id, body) =>
    req('PUT', `/api/admin/vendors/${encodeURIComponent(id)}/override`, body),
  adminVendorClear: (id, expectedVersion) =>
    req('DELETE', `/api/admin/vendors/${encodeURIComponent(id)}/override`, { expected_version: expectedVersion }),

  /**
   * Stream chat (SSE). handlers: { onConversation, onChunk, onMeta, onIntent, onAction, onDone, onError }
   * Trả về Promise resolve khi stream kết thúc.
   */
  async streamChat(coupleId, { conversationId, message, context }, handlers = {}) {
    const res = await fetch(`${BASE}/api/couples/${coupleId}/chat`, {
      method: 'POST',
      headers: await authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ conversationId, message, ...(context != null ? { context } : {}) }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const err = new Error(data.error || `HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    const dispatch = (eventName, dataStr) => {
      let data;
      try {
        data = JSON.parse(dataStr);
      } catch {
        return;
      }
      if (eventName === 'conversation') handlers.onConversation?.(data);
      else if (eventName === 'chunk') handlers.onChunk?.(data.text || '');
      else if (eventName === 'intent') handlers.onIntent?.(data);
      else if (eventName === 'meta') handlers.onMeta?.(data);
      else if (eventName === 'action') handlers.onAction?.(data);
      else if (eventName === 'done') handlers.onDone?.();
      else if (eventName === 'error')
        handlers.onError?.(data.message || 'Lỗi không xác định', data);
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE: các block ngăn bằng "\n\n"
      let sep;
      while ((sep = buffer.indexOf('\n\n')) !== -1) {
        const block = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);

        let eventName = 'message';
        let dataStr = '';
        for (const line of block.split('\n')) {
          if (line.startsWith('event: ')) eventName = line.slice(7).trim();
          else if (line.startsWith('data: ')) dataStr += line.slice(6);
        }
        if (dataStr) dispatch(eventName, dataStr);
      }
    }
  },
};
