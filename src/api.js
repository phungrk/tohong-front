// API client cho Workers backend (edge/). Dev: trỏ thẳng localhost:8787 (CORS đã bật).
// Token: dev bypass ("Bearer dev"). Khi gắn Clerk thật, thay getToken() bằng token Clerk.

const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8787';
const DEV_TOKEN = import.meta.env.VITE_DEV_TOKEN || 'dev';

let tokenProvider = () => DEV_TOKEN;
export function setTokenProvider(fn) {
  tokenProvider = fn;
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

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: await authHeaders(
      body ? { 'Content-Type': 'application/json' } : {},
    ),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `HTTP ${res.status}`);
  }
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
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `HTTP ${res.status}`);
  }
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

  // ── Subscription ───────────────────────────────────────────────────────────
  getSubscription: (coupleId) => req('GET', `/api/couples/${coupleId}/subscription`),
  subscribe: (coupleId, plan) => req('POST', `/api/couples/${coupleId}/subscription`, { plan }),
  extendTrial: (coupleId) => req('POST', `/api/couples/${coupleId}/subscription/trial`),

  // ── AI features ────────────────────────────────────────────────────────────
  getBriefing: (coupleId) => reqOrNull('GET', `/api/couples/${coupleId}/briefing`),
  getBudgetProposal: (coupleId) => reqOrNull('GET', `/api/couples/${coupleId}/budget/proposal`),
  getTimelineSuggestions: (coupleId) => reqOrNull('GET', `/api/couples/${coupleId}/timeline/suggestions`),

  /**
   * Stream chat (SSE). handlers: { onConversation, onChunk, onMeta, onDone, onError }
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
