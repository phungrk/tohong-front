import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Icon } from '../../ui/Icon.jsx';
import { Avatar } from '../../ui/atoms.jsx';
import { VENDOR_CATEGORIES, useVendorCtx } from '../VendorCtx.jsx';
import { api } from '../../api.js';
import { CardShell, CardHead, CardAction, GhostBtn } from './cards.jsx';

const VCMP_MAX = 5; // anchor + tối đa 4 vendor khác trong bảng so sánh

export const ChatActionsCtx = createContext({ pushUser: () => {}, pushAI: () => {} });
export const useChatActions = () => useContext(ChatActionsCtx);

/* Gradient fallback theo danh mục khi vendor không có ảnh. */
const CAT_FALLBACK_GRAD = {
  venue: 'linear-gradient(135deg,#c9907a,#9a5b4a)',
  photography: 'linear-gradient(135deg,#7a9ab5,#4a6a85)',
  decor: 'linear-gradient(135deg,#e0b0a0,#c08070)',
  attire: 'linear-gradient(135deg,#e0c0b0,#c09070)',
};

/* Map vendor từ API (/api/vendors/match) → shape mà các card + luồng save/budget dùng. */
function adaptVendor(bv, catId) {
  const bk = bv.match?.scoreBreakdown || {};
  const photoUrls = (bv.photos || []).map((p) => p.url).filter(Boolean);
  const fallbackGrad = CAT_FALLBACK_GRAD[catId] || 'linear-gradient(135deg,#d4a0a0,#a06060)';
  const gallery = photoUrls.length
    ? photoUrls.map((url) => `center/cover no-repeat url("${url}")`)
    : [fallbackGrad];
  const spec = bv.spec || (bv.tags || []).slice(0, 2).join(' · ');
  return {
    id: bv.id,
    name: bv.name,
    priceTotal: bv.priceMin ?? bv.price ?? 0,   // dùng giá "từ" làm ước lượng cho budget
    priceMax: bv.priceMax ?? null,
    priceUnit: spec,
    rating: bv.rating ?? 0,
    rv: bv.reviewCount ?? 0,
    match: bv.match?.totalScore ?? 0,           // 0–100
    spec,
    location: bv.city || '',
    capacity: bv.capacity?.max ?? bv.capacity?.min ?? null,
    gallery,                                    // ≥1 background-shorthand strings (real photo(s) or gradient fallback)
    grad: gallery[0],
    reasons: (bv.match?.reasons || []).map((r) => (typeof r === 'string' ? r : r.label)),
    why: bv.match?.whyThisVendor || '',
    includes: bv.tags || [],
    breakdown: {
      budget: Math.round((bk.budget ?? 0.5) * 100),
      style:  Math.round((bk.style ?? 0.5) * 100),
      avail:  Math.round((bk.availability ?? 0.5) * 100),
    },
    // Google Maps text reviews — real, but only scraped for a minority of vendors
    // (see tools/generate-vendor-pool.js). A handful of quotes, not a full sample.
    reviews: (bv.reviews || [])
      .filter((r) => r.text)
      .map((r) => ({ name: r.author || 'Khách trên Google Maps', rating: r.rating || Math.round(bv.rating || 5), text: r.text })),
    description: bv.description || '',
  };
}

/* ── SaveFlash ─────────────────────────────────────────────── */
function SaveFlash({ visible, name }) {
  if (!visible) return null;
  return (
    <div style={{ position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, pointerEvents: 'none',
      background: 'var(--sage-500)', color: '#fff', borderRadius: 'var(--r-pill)',
      padding: '9px 18px', display: 'flex', alignItems: 'center', gap: 8,
      fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600,
      boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}>
      <Icon name="heart" size={15} color="#fff" sw={2.5} />
      Đã lưu {name} vào Vendors
    </div>
  );
}

/* ── Match badge ─────────────────────────────────────────────── */
function MatchBadge({ pct }) {
  const color = pct >= 90 ? 'var(--son-500)' : pct >= 80 ? 'var(--kim-500,#c69b2a)' : 'var(--ink-400)';
  return (
    <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 700,
      color, background: 'var(--card)', border: `1.5px solid ${color}`,
      borderRadius: 999, padding: '2px 8px', flexShrink: 0 }}>
      {pct}%
    </span>
  );
}

/* ── Trạng thái nhỏ trong card (loading / error / empty) ───────── */
function CardNote({ icon, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 14px',
      fontFamily: 'var(--font-ui)', fontSize: 12.5, color: 'var(--ink-500)' }}>
      <Icon name={icon} size={15} color="var(--ink-400)" sw={1.8} />
      {children}
    </div>
  );
}

/* ── VPickerChatCard ─────────────────────────────────────────── */
export function VPickerChatCard() {
  const { getCatStatus, getCatBudget } = useVendorCtx();
  const { pushUser, pushAI } = useChatActions();

  const pick = (cat) => {
    pushUser(`Tôi muốn xem ${cat.name}`);
    pushAI(VMatchChatCard, { catId: cat.id });
  };

  return (
    <CardShell gold>
      <CardHead icon="store" kicker="Tơ Hồng gợi ý" title="Chọn danh mục vendor" />
      <div style={{ padding: '6px 0 2px' }}>
        {VENDOR_CATEGORIES.map((cat) => {
          const status = getCatStatus(cat.id);
          return (
            <button key={cat.id} type="button" onClick={() => pick(cat)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 14px', background: 'transparent', border: 'none', cursor: 'pointer',
                borderBottom: '1px solid var(--line-100)', textAlign: 'left' }}>
              <span style={{ width: 36, height: 36, borderRadius: 'var(--r-sm)', flexShrink: 0,
                background: 'var(--son-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={cat.icon} size={18} color={cat.color} sw={1.8} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13.5, fontWeight: 600, color: 'var(--ink-900)' }}>{cat.name}</div>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11.5, color: 'var(--ink-400)', marginTop: 1 }}>Budget ~{getCatBudget(cat.id)}tr</div>
              </span>
              {status === 'confirmed' && (
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--sage-500)', flexShrink: 0 }} />
              )}
              {status === 'shortlisted' && (
                <Icon name="bookmark" size={14} color="var(--kim-500,#c69b2a)" sw={2} />
              )}
              <Icon name="chevron-right" size={16} color="var(--ink-300)" sw={1.8} />
            </button>
          );
        })}
      </div>
    </CardShell>
  );
}

/* ── Typewriter ─────────────────────────────────────────────────
   Gõ intro từng chữ kiểu chat. Bấm để hiện ngay (skip). text ổn định
   trong vòng đời card nên effect chỉ chạy 1 lần khi mount. */
function Typewriter({ text, speed = 12, onDone, borderBottom, style: styleProp }) {
  const [len, setLen] = useState(0);
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; });

  const markDone = () => {
    if (!doneRef.current) { doneRef.current = true; onDoneRef.current?.(); }
  };

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setLen(i);
      if (i >= text.length) { clearInterval(id); markDone(); }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  const typing = len < text.length;
  const finish = () => { setLen(text.length); markDone(); };

  return (
    <div onClick={typing ? finish : undefined}
      style={{ padding: '11px 14px 12px', fontFamily: 'var(--font-body)', fontSize: 12.5,
        lineHeight: 1.6, color: 'var(--ink-700)', cursor: typing ? 'pointer' : 'default',
        borderBottom: borderBottom ? '1px solid var(--line-100)' : 'none',
        ...styleProp }}>
      {text.slice(0, len)}
      {typing && <span className="vm-caret">▌</span>}
    </div>
  );
}

/* ── VMatchChatCard ─────────────────────────────────────────── */
export function VMatchChatCard({ catId }) {
  const { coupleId, saved, saveVendor } = useVendorCtx();
  const { pushUser, pushAI } = useChatActions();
  const [flash, setFlash] = useState(null);
  const [vendors, setVendors] = useState(null);  // null = đang tải
  const [total, setTotal] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [whyThoseVendors, setWhyThoseVendors] = useState('');
  const [phase, setPhase] = useState('loading');  // loading → cards

  const cat = VENDOR_CATEGORIES.find((c) => c.id === catId);

  useEffect(() => {
    let alive = true;
    api.matchVendors(coupleId, { category: catId, limit: 5 })
      .then((res) => {
        if (!alive) return;
        const list = (res?.vendors || []).map((v) => adaptVendor(v, catId));
        setVendors(list);
        setTotal(res?.total ?? list.length);
        setWhyThoseVendors(res?.whyThoseVendors || '');
        setPhase('cards');
      })
      .catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, [catId, coupleId]);

  const loadMore = () => {
    if (loadingMore || !vendors) return;
    // Already have extra vendors cached — just expand
    if (vendors.length > 5) { setExpanded(true); return; }
    setLoadingMore(true);
    api.matchVendors(coupleId, { category: catId, limit: 5, offset: vendors.length })
      .then((res) => {
        const more = (res?.vendors || []).map((v) => adaptVendor(v, catId));
        setVendors((prev) => [...prev, ...more]);
        setTotal(res?.total ?? total);
        setExpanded(true);
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  };

  if (!cat) return null;

  const showCards = phase === 'cards';
  const hasMore = vendors !== null && vendors.length < total;
  const visibleVendors = vendors ? (expanded ? vendors : vendors.slice(0, 5)) : [];
  const showExpandBtn = showCards && vendors !== null && !expanded && (hasMore || vendors.length > 5);
  const showCollapseBtn = showCards && expanded;

  const savedIds = (saved[catId]?.shortlisted || []).map((v) => v.id);

  const onSave = (v) => {
    saveVendor(catId, v);
    setFlash(v.name);
    setTimeout(() => setFlash(null), 1900);
  };

  const onDetail = (v) => {
    pushUser(`Xem chi tiết ${v.name}`);
    pushAI(VDetailChatCard, { catId, vendor: v });
  };

  return (
    <>
      <SaveFlash visible={!!flash} name={flash} />
      <CardShell gold>
        <CardHead icon={cat.icon}
          kicker={vendors ? 'Gợi ý phù hợp' : 'Tơ Hồng đang tìm…'}
          title={cat.name} />

        {vendors === null && !error && (
          <CardNote icon="loader">Đang tìm vendor phù hợp với hồ sơ của bạn…</CardNote>
        )}
        {error && (
          <CardNote icon="triangle-alert">Không tải được gợi ý. Thử lại sau giúp Tơ Hồng nhé.</CardNote>
        )}
        {vendors !== null && !error && vendors.length === 0 && (
          <CardNote icon="search-x">Chưa tìm thấy vendor phù hợp cho danh mục này.</CardNote>
        )}

        {/* whyThoseVendors is shown below the list now (moved out of the list) */}

        {visibleVendors.length > 0 && showCards && (
          <div style={{ padding: '4px 0 2px' }}>
            {visibleVendors.map((v, i) => {
              const isBest = i === 0;
              const isSaved = savedIds.includes(v.id);
              return (
                <div key={v.id} className="vm-card-in"
                  style={{ padding: '10px 14px', animationDelay: `${i * 80}ms`,
                  borderBottom: i < visibleVendors.length - 1 ? '1px solid var(--line-100)' : 'none' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    {/* swatch */}
                    <div style={{ width: 108, height: 108, borderRadius: 'var(--r-sm)', flexShrink: 0,
                      background: v.grad, position: 'relative' }}>
                      {isBest && (
                        <span style={{ position: 'absolute', top: -5, left: -5,
                          background: 'var(--son-500)', color: '#fff',
                          fontSize: 9, fontWeight: 700, letterSpacing: '0.05em',
                          borderRadius: 999, padding: '2px 6px', fontFamily: 'var(--font-ui)' }}>
                          BEST
                        </span>
                      )}
                    </div>
                    {/* info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13.5, fontWeight: 600,
                          color: 'var(--ink-900)', flex: 1, minWidth: 0,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.name}</span>
                        <MatchBadge pct={v.match} />
                      </div>
                      <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11.5, color: 'var(--ink-500)', marginBottom: 5 }}>
                        {v.priceTotal}tr{v.priceMax && v.priceMax !== v.priceTotal ? `–${v.priceMax}tr` : ''} · {v.spec}
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {v.reasons.slice(0, 2).map((r) => (
                          <span key={r} style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--sage-600,#4d7a59)',
                            background: 'var(--sage-50,#edf7ee)', border: '1px solid var(--sage-200,#b8d9be)',
                            borderRadius: 999, padding: '2px 7px' }}>{r}</span>
                        ))}
                      </div>
                      {v.description && (
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: 11.5, lineHeight: 1.45,
                          color: 'var(--ink-500)', marginTop: 6,
                          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {v.description}
                        </div>
                      )}
                    </div>
                    {/* save button */}
                    <button type="button" onClick={() => onSave(v)} style={{ flexShrink: 0, padding: 6,
                      background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '50%',
                      color: isSaved ? 'var(--son-500)' : 'var(--ink-300)' }}>
                      <Icon name="heart" size={18} color={isSaved ? 'var(--son-500)' : 'var(--ink-300)'}
                        fill={isSaved ? 'var(--son-500)' : 'none'}
                        sw={isSaved ? 2.5 : 1.8} />
                    </button>
                  </div>
                  {/* view detail */}
                  <button type="button" onClick={() => onDetail(v)}
                    style={{ marginTop: 8, fontSize: 11.5, fontWeight: 600, color: 'var(--son-600)',
                      background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
                      display: 'flex', alignItems: 'center', gap: 3 }}>
                    Xem chi tiết <Icon name="chevron-right" size={13} color="var(--son-500)" sw={2} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* moved intro: show whyThoseVendors under the vendor list */}
        {whyThoseVendors && vendors?.length > 0 && (
          <Typewriter text={whyThoseVendors} borderBottom={false}
            onDone={() => { /* no-op: already showing cards */ }} />
        )}

        {(showExpandBtn || showCollapseBtn) && (
          <div style={{ padding: '10px 14px 4px', borderTop: '1px solid var(--line-100)' }}>
            {showExpandBtn && (
              <button type="button" onClick={loadMore} disabled={loadingMore}
                style={{ width: '100%', padding: '9px 0', borderRadius: 'var(--r-pill)',
                  border: '1.5px solid var(--son-300)', background: 'transparent',
                  cursor: loadingMore ? 'default' : 'pointer', opacity: loadingMore ? 0.6 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  fontFamily: 'var(--font-ui)', fontSize: 12.5, fontWeight: 600, color: 'var(--son-600)' }}>
                {loadingMore
                  ? <><Icon name="loader" size={14} color="var(--son-500)" sw={2} /> Đang tải…</>
                  : <><Icon name="chevron-down" size={14} color="var(--son-500)" sw={2} /> Xem thêm {Math.min(5, total - vendors.length)} vendor</>
                }
              </button>
            )}
            {showCollapseBtn && (
              <button type="button" onClick={() => setExpanded(false)}
                style={{ width: '100%', padding: '9px 0', borderRadius: 'var(--r-pill)',
                  border: '1.5px solid var(--line-200)', background: 'transparent',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  fontFamily: 'var(--font-ui)', fontSize: 12.5, fontWeight: 600, color: 'var(--ink-500)' }}>
                <Icon name="chevron-up" size={14} color="var(--ink-400)" sw={2} /> Thu gọn
              </button>
            )}
          </div>
        )}
      </CardShell>
    </>
  );
}

/* ── VReviewsBlock ─────────────────────────────────────────────
   Vài trích đoạn đánh giá thật (Google Maps) khi có — chỉ ~1 phần nhỏ vendor
   có dữ liệu này (xem adaptVendor). Không claim "đủ N đánh giá": chỉ nói
   "nổi bật" vì đây là mẫu, không phải toàn bộ rv lượt đánh giá. */
function VReviewsBlock({ vendor }) {
  const [open, setOpen] = useState(false);
  const reviews = vendor.reviews || [];
  if (reviews.length === 0) return null;
  const preview = reviews[0];
  return (
    <div style={{ padding: '2px 15px 12px' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--ink-900)', marginBottom: 8 }}>
        Đánh giá nổi bật
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {(open ? reviews : [preview]).map((r, i) => (
          <div key={i} style={{ padding: '9px 11px', background: 'var(--sand)', border: '1px solid var(--line-100)', borderRadius: 'var(--r-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--dao-100)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 700,
                color: 'var(--son-600)', flexShrink: 0 }}>{r.name.charAt(0)}</span>
              <span style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-ui)', fontSize: 11.5, fontWeight: 600, color: 'var(--ink-900)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, flexShrink: 0, fontFamily: 'var(--font-ui)', fontSize: 10.5, fontWeight: 600, color: 'var(--kim-700)' }}>
                <Icon name="star" size={10} color="var(--kim-500,#c69b2a)" sw={2} /> {r.rating}
              </span>
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--ink-700)', lineHeight: 1.5 }}>{r.text}</div>
          </div>
        ))}
      </div>
      {reviews.length > 1 && (
        <button type="button" onClick={() => setOpen((o) => !o)} style={{ width: '100%', marginTop: 8, background: 'none',
          border: '1px solid var(--line-200)', borderRadius: 999, padding: '7px 0', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          fontFamily: 'var(--font-ui)', fontSize: 11.5, fontWeight: 600, color: 'var(--ink-700)' }}>
          {open ? 'Thu gọn' : `Xem ${reviews.length} đánh giá nổi bật`}
          <Icon name={open ? 'chevron-up' : 'chevron-down'} size={12} color="var(--ink-500)" />
        </button>
      )}
    </div>
  );
}

/* ── VDetailChatCard ─────────────────────────────────────────── */
export function VDetailChatCard({ catId, vendor }) {
  const { coupleId, saved, saveVendor } = useVendorCtx();
  const { pushUser, pushAI } = useChatActions();
  const [flash, setFlash] = useState(false);
  const [galIdx, setGalIdx] = useState(0);
  const [descOpen, setDescOpen] = useState(false);
  // why: câu template từ list; swap → bản AI khi về.
  const [why, setWhy] = useState(vendor?.why || '');
  // typing=true khi AI text về và khác template → chạy Typewriter animation.
  const [typing, setTyping] = useState(false);
  // whyLoading: dimm template + caret trong lúc chờ AI.
  const [whyLoading, setWhyLoading] = useState(!!(vendor?.id && coupleId));

  const cat = VENDOR_CATEGORIES.find((c) => c.id === catId);
  const isSaved = (saved[catId]?.shortlisted || []).some((v) => v.id === vendor?.id);

  // Lazy: bấm xem chi tiết mới gọi AI (backend cache theo profile-hash).
  useEffect(() => {
    if (!vendor?.id || !coupleId) return;
    let alive = true;
    api.getVendorDetail(vendor.id, coupleId)
      .then((res) => {
        if (!alive) return;
        const aiText = res?.match?.whyThisVendor;
        if (aiText) {
          setWhy(aiText);
          // Chỉ chạy Typewriter khi AI sinh câu khác template.
          if (aiText !== (vendor?.why || '')) setTyping(true);
        }
      })
      .catch(() => {})
      .finally(() => { if (alive) setWhyLoading(false); });
    return () => { alive = false; };
  }, [vendor?.id, coupleId]);

  if (!cat || !vendor) return null;

  const gallery = vendor.gallery?.length ? vendor.gallery : [vendor.grad];

  const onSave = () => {
    saveVendor(catId, vendor);
    setFlash(true);
    setTimeout(() => setFlash(false), 1900);
  };

  const onCompare = () => {
    pushUser(`So sánh ${vendor.name} với vendor khác`);
    pushAI(VPickerMultiChatCard, { catId, anchor: vendor });
  };

  return (
    <>
      <SaveFlash visible={flash} name={vendor.name} />
      <CardShell gold>
        <CardHead icon={cat.icon} kicker="Chi tiết vendor" title={vendor.name} />

        {/* 1. Gallery — ảnh thật (1–4 ảnh tuỳ vendor) hoặc gradient fallback */}
        <div style={{ height: 150, position: 'relative', flexShrink: 0, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: gallery[galIdx], transition: 'background .25s ease' }} />
          <button type="button" onClick={onSave} disabled={isSaved} style={{ position: 'absolute', top: 9, right: 9,
            width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: isSaved ? 'default' : 'pointer',
            background: isSaved ? 'var(--son-500)' : 'rgba(0,0,0,0.32)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="heart" size={15} color="#fff" sw={isSaved ? 2.4 : 1.8} fill={isSaved ? '#fff' : 'none'} />
          </button>
          {gallery.length > 1 && (
            <div style={{ position: 'absolute', bottom: 9, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 5 }}>
              {gallery.map((_, i) => (
                <button key={i} type="button" onClick={() => setGalIdx(i)} style={{ height: 6, borderRadius: 999, border: 'none',
                  cursor: 'pointer', padding: 0, width: i === galIdx ? 20 : 6,
                  background: i === galIdx ? '#fff' : 'rgba(255,255,255,0.5)', transition: 'width .2s ease' }} />
              ))}
            </div>
          )}
        </div>

        {/* 2. Định danh — tên, sao, địa điểm, giá */}
        <div style={{ padding: '12px 15px', borderBottom: '1px solid var(--line-100)', display: 'flex',
          alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, color: 'var(--ink-900)', lineHeight: 1.2 }}>{vendor.name}</div>
            {vendor.rating > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                <Icon name="star" size={12} color="var(--kim-500,#c69b2a)" sw={2} />
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11.5, fontWeight: 700, color: 'var(--kim-700)' }}>{vendor.rating}</span>
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--ink-400)' }}>({vendor.rv})</span>
              </div>
            )}
            {(vendor.location || vendor.spec) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <Icon name="map-pin" size={11} color="var(--ink-400)" />
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11.5, color: 'var(--ink-500)' }}>
                  {[vendor.location, vendor.spec].filter(Boolean).join(' · ')}
                </span>
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 19, fontWeight: 700, color: 'var(--son-600)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              {vendor.priceTotal}tr{vendor.priceMax && vendor.priceMax !== vendor.priceTotal ? `–${vendor.priceMax}tr` : ''}
            </div>
            {vendor.priceUnit && <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10.5, color: 'var(--ink-400)', marginTop: 2 }}>{vendor.priceUnit}</div>}
          </div>
        </div>

        {/* 3. Phân tích AI — bars + lý do, gộp trong khối kim-50 */}
        <div style={{ padding: '11px 14px', background: 'var(--kim-50)', borderBottom: '1px solid var(--kim-100)' }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--kim-700)', textTransform: 'uppercase',
            letterSpacing: '0.07em', marginBottom: 9, fontFamily: 'var(--font-ui)' }}>
            Phân tích AI · {vendor.match}% phù hợp
          </div>
          {[['Ngân sách', vendor.breakdown.budget, 'var(--sage-500)'],
            ['Phong cách', vendor.breakdown.style, 'var(--kim-400)'],
            ['Lịch trống', vendor.breakdown.avail, 'var(--son-500)']].map(([label, pct, color]) => (
            <div key={label} style={{ marginBottom: 7 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3,
                fontFamily: 'var(--font-ui)', fontSize: 11.5, fontWeight: 600, color: 'var(--ink-600)' }}>
                <span>{label}</span>
                <span style={{ color }}>{pct}%</span>
              </div>
              <div style={{ height: 5, borderRadius: 999, background: 'var(--line-100)', overflow: 'hidden' }}>
                <div style={{ width: pct + '%', height: '100%', background: color, borderRadius: 999 }} />
              </div>
            </div>
          ))}
          {/* why sentence: template dimmed khi đang chờ AI → Typewriter khi AI về khác template */}
          {why && (
            <div style={{ display: 'flex', gap: 8, marginTop: 9, padding: '8px 10px', background: 'var(--card)',
              border: '1px solid var(--kim-100)', borderRadius: 'var(--r-md)' }}>
              <Avatar size={20} />
              {typing ? (
                <Typewriter text={why} speed={14} onDone={() => setTyping(false)} style={{ padding: 0, flex: 1, fontSize: 12.5 }} />
              ) : (
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, color: 'var(--ink-900)', lineHeight: 1.45, flex: 1,
                  opacity: whyLoading ? 0.6 : 1, transition: 'opacity .2s ease' }}>
                  {why}{whyLoading && <span className="vm-caret">▌</span>}
                </span>
              )}
            </div>
          )}
        </div>

        {/* 4. Giới thiệu — mô tả vendor thật, thu gọn 3 dòng + mở rộng inline */}
        {vendor.description && (
          <div style={{ padding: '11px 14px 4px' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--kim-700)', textTransform: 'uppercase',
              letterSpacing: '0.07em', marginBottom: 7, fontFamily: 'var(--font-ui)' }}>Giới thiệu</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, color: 'var(--ink-700)', lineHeight: 1.55,
              ...(descOpen ? {} : { display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }) }}>
              {vendor.description}
            </div>
            <button type="button" onClick={() => setDescOpen((o) => !o)} style={{ marginTop: 5, display: 'flex',
              alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              fontFamily: 'var(--font-ui)', fontSize: 11.5, fontWeight: 600, color: 'var(--son-600)' }}>
              {descOpen ? 'Thu gọn' : 'Xem thêm'}
              <Icon name={descOpen ? 'chevron-up' : 'chevron-down'} size={12} color="var(--son-500)" />
            </button>
          </div>
        )}

        {/* 5. Dịch vụ bao gồm */}
        {vendor.includes?.length > 0 && (
          <div style={{ padding: '10px 14px 12px' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--kim-700)', textTransform: 'uppercase',
              letterSpacing: '0.07em', marginBottom: 7, fontFamily: 'var(--font-ui)' }}>Đặc điểm</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 10px' }}>
              {vendor.includes.map((item) => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 5,
                  fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--ink-700)' }}>
                  <Icon name="check" size={12} color="var(--sage-500)" sw={2.5} /> {item}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. Đánh giá — chỉ hiện khi có dữ liệu thật */}
        <VReviewsBlock vendor={vendor} />

        {/* 7. CTA */}
        <CardAction>
          <GhostBtn icon="columns-2" onClick={onCompare}>So sánh</GhostBtn>
          {isSaved ? (
            <span style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              fontFamily: 'var(--font-ui)', fontSize: 12.5, color: 'var(--sage-600)', fontWeight: 600 }}>
              <Icon name="check" size={15} color="var(--sage-500)" sw={2.5} /> Đã lưu
            </span>
          ) : (
            <button type="button" onClick={onSave} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 6, fontFamily: 'var(--font-ui)', fontSize: 12.5, fontWeight: 700, color: '#fff', background: 'var(--son-500)',
              border: 'none', borderRadius: 'var(--r-pill)', padding: '9px 0', cursor: 'pointer', boxShadow: 'var(--shadow-rose)' }}>
              <Icon name="heart" size={13} color="#fff" sw={2} /> Lưu
            </button>
          )}
        </CardAction>
      </CardShell>
    </>
  );
}

/* ── VPickerMultiChatCard ─────────────────────────────────────────
   Chọn tối đa VCMP_MAX vendor để so sánh. Vendor đang xem (anchor) được ghim
   sẵn dòng đầu, không thể bỏ chọn — phần còn lại tải từ cùng danh mục. */
export function VPickerMultiChatCard({ catId, anchor }) {
  const { coupleId } = useVendorCtx();
  const { pushUser, pushAI } = useChatActions();
  const cat = VENDOR_CATEGORIES.find((c) => c.id === catId);
  const [others, setOthers] = useState(null); // null = đang tải
  const [error, setError] = useState(false);
  const [sel, setSel] = useState([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let alive = true;
    api.matchVendors(coupleId, { category: catId, limit: 20 })
      .then((res) => {
        if (!alive) return;
        const list = (res?.vendors || [])
          .map((v) => adaptVendor(v, catId))
          .filter((v) => v.id !== anchor.id);
        setOthers(list);
      })
      .catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, [catId, coupleId, anchor.id]);

  if (!cat) return null;

  const full = sel.length >= VCMP_MAX - 1;
  const toggle = (id) => {
    if (done) return;
    setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : (s.length < VCMP_MAX - 1 ? [...s, id] : s)));
  };
  const go = () => {
    if (done || sel.length === 0 || !others) return;
    const chosen = others.filter((v) => sel.includes(v.id));
    setDone(true);
    pushUser(`So sánh ${anchor.name} với ${chosen.map((v) => v.name).join(', ')}`);
    pushAI(VCompareTableChatCard, { catId, vendors: [anchor, ...chosen] });
  };

  return (
    <CardShell gold>
      <CardHead icon="columns-2" kicker={`So sánh · ${cat.name}`} title={`Chọn tối đa ${VCMP_MAX} vendor`} />
      <div style={{ padding: '10px 12px 0', display: 'flex', flexDirection: 'column', gap: 7 }}>
        {/* anchor ghim sẵn */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', background: 'var(--son-50)',
          border: '1px solid var(--son-200)', borderRadius: 'var(--r-md)' }}>
          <span style={{ width: 40, height: 40, borderRadius: 'var(--r-sm)', background: anchor.grad, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--ink-900)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{anchor.name}</div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10.5, color: 'var(--son-600)', marginTop: 2, fontWeight: 600 }}>
              Đang xem — luôn trong bảng so sánh
            </div>
          </div>
          <span style={{ width: 20, height: 20, borderRadius: 6, background: 'var(--son-500)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="check" size={12} color="#fff" sw={3} />
          </span>
        </div>

        {others === null && !error && <CardNote icon="loader">Đang tải các vendor khác…</CardNote>}
        {error && <CardNote icon="triangle-alert">Không tải được danh sách. Thử lại sau giúp Tơ Hồng nhé.</CardNote>}
        {others?.length === 0 && <CardNote icon="search-x">Chưa có vendor khác trong danh mục này để so sánh.</CardNote>}

        {others?.map((v) => {
          const on = sel.includes(v.id);
          const disabled = done || (!on && full);
          return (
            <button key={v.id} type="button" onClick={() => toggle(v.id)} disabled={disabled}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', textAlign: 'left',
                background: on ? 'var(--son-50)' : 'var(--bg-1)',
                border: `1px solid ${on ? 'var(--son-200)' : 'var(--line-100)'}`,
                borderRadius: 'var(--r-md)', cursor: disabled ? 'default' : 'pointer',
                opacity: disabled && !on ? 0.45 : 1, transition: 'all .18s ease' }}>
              <span style={{ width: 40, height: 40, borderRadius: 'var(--r-sm)', background: v.grad, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--ink-900)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                  <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 700, color: 'var(--son-600)', fontVariantNumeric: 'tabular-nums' }}>{v.priceTotal}tr</span>
                  <span style={{ fontFamily: 'var(--font-ui)', fontSize: 10.5, color: 'var(--ink-400)' }}>· {v.spec}</span>
                </div>
              </div>
              <MatchBadge pct={v.match} />
              <span style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: on ? 'var(--son-500)' : 'var(--card)', border: on ? 'none' : '1.5px solid var(--line-300,#D8CFC4)' }}>
                {on && <Icon name="check" size={12} color="#fff" sw={3} />}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px 12px' }}>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 600, flexShrink: 0,
          color: full ? 'var(--son-600)' : 'var(--ink-400)' }}>
          {sel.length + 1}/{VCMP_MAX}{full ? ' — tối đa' : ''}
        </span>
        <button type="button" onClick={go} disabled={done || sel.length === 0}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0',
            borderRadius: 'var(--r-pill)', border: 'none', cursor: done || sel.length === 0 ? 'default' : 'pointer',
            fontFamily: 'var(--font-ui)', fontSize: 12.5, fontWeight: 700,
            color: done ? 'var(--sage-600)' : sel.length === 0 ? 'var(--ink-300)' : '#fff',
            background: done ? 'var(--sage-50)' : sel.length === 0 ? 'var(--bg-1)' : 'var(--son-500)',
            boxShadow: done || sel.length === 0 ? 'none' : 'var(--shadow-rose)' }}>
          <Icon name={done ? 'check' : 'columns-2'} size={13} color={done ? 'var(--sage-600)' : sel.length === 0 ? 'var(--ink-300)' : '#fff'} sw={2} />
          {done ? 'Đã tạo bảng so sánh' : `So sánh ${sel.length + 1} vendor`}
        </button>
      </div>
    </CardShell>
  );
}

/* ── VCompareTableChatCard ─────────────────────────────────────────
   Bảng N cột (2–5) cuộn ngang, cột tiêu chí ghim trái. Mỗi cột có nút Lưu
   độc lập — lưu thẳng vào Shortlist, không tự "chốt". */
export function VCompareTableChatCard({ catId, vendors = [] }) {
  const { saved, saveVendor } = useVendorCtx();
  const [flash, setFlash] = useState(null);
  const cat = VENDOR_CATEGORIES.find((c) => c.id === catId);
  if (!cat || vendors.length < 2) return null;

  const savedIds = (saved[catId]?.shortlisted || []).map((v) => v.id);
  const onSave = (v) => {
    if (savedIds.includes(v.id)) return;
    saveVendor(catId, v);
    setFlash(v.name);
    setTimeout(() => setFlash(null), 1900);
  };

  const bestMask = (fn, dir = 'max') => {
    const vals = vendors.map(fn);
    const target = dir === 'min' ? Math.min(...vals) : Math.max(...vals);
    return vendors.map((_, i) => vals[i] === target);
  };
  const noWin = vendors.map(() => false);
  const rows = [
    { label: 'Giá', val: (v) => `${v.priceTotal}tr`, win: bestMask((v) => v.priceTotal, 'min') },
    { label: 'Phù hợp', val: (v) => `${v.match}%`, win: bestMask((v) => v.match, 'max') },
    { label: 'Đánh giá', val: (v) => (v.rating > 0 ? `★${v.rating}` : '—'), win: bestMask((v) => v.rating || 0, 'max') },
    ...(vendors.every((v) => v.capacity) ? [{ label: 'Sức chứa', val: (v) => `${v.capacity} khách`, win: bestMask((v) => v.capacity, 'max') }] : []),
    { label: 'Đặc trưng', val: (v) => v.spec || '—', win: noWin, wrap: true },
  ];

  const LABEL_W = 70, COL_W = 86;
  const ranked = [...vendors].sort((a, b) => b.match - a.match);
  const cheapest = vendors.reduce((m, v) => (v.priceTotal < m.priceTotal ? v : m), vendors[0]);

  return (
    <>
      <SaveFlash visible={!!flash} name={flash} />
      <CardShell gold>
        <CardHead icon="columns-2" kicker={`So sánh · ${cat.name}`} title={`${vendors.length} vendor đặt cạnh nhau`} />

        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ minWidth: LABEL_W + vendors.length * COL_W }}>
            {/* head */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--line-100)' }}>
              <div style={{ width: LABEL_W, flexShrink: 0, position: 'sticky', left: 0, background: 'var(--card)', zIndex: 2,
                borderRight: '1px solid var(--line-100)', display: 'flex', alignItems: 'flex-end', padding: '0 8px 8px' }}>
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 8.5, fontWeight: 700, color: 'var(--ink-300)',
                  textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tiêu chí</span>
              </div>
              {vendors.map((v, i) => (
                <div key={v.id} style={{ width: COL_W, flexShrink: 0, padding: '9px 6px 8px', textAlign: 'center',
                  borderRight: i < vendors.length - 1 ? '1px solid var(--line-100)' : 'none',
                  background: i === 0 ? 'var(--son-50)' : 'transparent' }}>
                  <div style={{ height: 30, borderRadius: 'var(--r-sm)', background: v.grad, marginBottom: 5 }} />
                  <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10.5, fontWeight: 700, color: 'var(--ink-900)', lineHeight: 1.2,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.name.split(' ')[0]}</div>
                  <span style={{ display: 'inline-block', marginTop: 3 }}><MatchBadge pct={v.match} /></span>
                </div>
              ))}
            </div>
            {/* rows */}
            {rows.map((r, ri) => (
              <div key={ri} style={{ display: 'flex', borderBottom: '1px solid var(--line-100)' }}>
                <div style={{ width: LABEL_W, flexShrink: 0, position: 'sticky', left: 0, background: 'var(--card)', zIndex: 2,
                  borderRight: '1px solid var(--line-100)', display: 'flex', alignItems: 'center', padding: '0 8px' }}>
                  <span style={{ fontFamily: 'var(--font-ui)', fontSize: 8.5, fontWeight: 700, color: 'var(--ink-300)',
                    textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1.3 }}>{r.label}</span>
                </div>
                {vendors.map((v, i) => (
                  <div key={v.id} style={{ width: COL_W, flexShrink: 0, padding: r.wrap ? '7px 5px' : '8px 5px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, textAlign: 'center',
                    fontFamily: 'var(--font-ui)', fontSize: r.wrap ? 9.5 : 11, fontWeight: r.win[i] ? 700 : 500, lineHeight: 1.3,
                    color: r.win[i] ? 'var(--sage-500)' : r.wrap ? 'var(--ink-700)' : 'var(--ink-400)',
                    background: r.win[i] ? 'var(--sage-50)' : i === 0 ? 'rgba(158,42,60,0.035)' : 'transparent',
                    borderRight: i < vendors.length - 1 ? '1px solid var(--line-100)' : 'none' }}>
                    {r.win[i] && <Icon name="check" size={9} color="var(--sage-500)" sw={2.5} />}{r.val(v)}
                  </div>
                ))}
              </div>
            ))}
            {/* save row */}
            <div style={{ display: 'flex' }}>
              <div style={{ width: LABEL_W, flexShrink: 0, position: 'sticky', left: 0, background: 'var(--card)', zIndex: 2,
                borderRight: '1px solid var(--line-100)', display: 'flex', alignItems: 'center', padding: '0 8px' }}>
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 8.5, fontWeight: 700, color: 'var(--ink-300)',
                  textTransform: 'uppercase', letterSpacing: '0.04em' }}>Chọn</span>
              </div>
              {vendors.map((v, i) => {
                const sv = savedIds.includes(v.id);
                return (
                  <div key={v.id} style={{ width: COL_W, flexShrink: 0, padding: '8px 5px', display: 'flex', justifyContent: 'center',
                    borderRight: i < vendors.length - 1 ? '1px solid var(--line-100)' : 'none' }}>
                    <button type="button" onClick={() => onSave(v)} disabled={sv} style={{ display: 'flex', alignItems: 'center',
                      justifyContent: 'center', gap: 3, width: '100%', padding: '6px 2px', borderRadius: 'var(--r-pill)',
                      fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 700,
                      color: sv ? 'var(--sage-600)' : '#fff', background: sv ? 'var(--sage-50)' : 'var(--son-500)',
                      border: sv ? '1px solid var(--sage-500)' : 'none', cursor: sv ? 'default' : 'pointer',
                      boxShadow: sv ? 'none' : 'var(--shadow-rose)' }}>
                      <Icon name={sv ? 'check' : 'heart'} size={10} color={sv ? 'var(--sage-600)' : '#fff'} sw={2} />
                      {sv ? 'Đã lưu' : 'Lưu'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {vendors.length > 3 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '6px 0', borderTop: '1px solid var(--line-100)' }}>
            <Icon name="move-horizontal" size={11} color="var(--ink-300)" />
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--ink-300)' }}>Vuốt ngang để xem đủ {vendors.length} cột</span>
          </div>
        )}

        {/* AI tư vấn — xếp hạng theo % phù hợp, suy ra trực tiếp từ dữ liệu match, không gọi thêm LLM */}
        <div style={{ padding: '11px 13px', background: 'var(--kim-50)', borderTop: '1px solid var(--kim-100)', display: 'flex', gap: 8 }}>
          <Avatar size={24} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 9.5, fontWeight: 700, color: 'var(--kim-700)',
              letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 3 }}>Tơ Hồng tư vấn</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, color: 'var(--ink-900)', lineHeight: 1.5 }}>
              Xếp theo độ phù hợp: {ranked.map((v, i) => (
                <span key={v.id}>{i > 0 && ' › '}<b>{v.name.split(' ')[0]} {v.match}%</b></span>
              ))}.{' '}
              <b>{ranked[0].name}</b> dẫn đầu — {(ranked[0].reasons?.[0] || ranked[0].why || 'điểm phù hợp cao nhất').toLowerCase()}.
              {cheapest.id !== ranked[0].id && <> Nếu ưu tiên tiết kiệm, <b>{cheapest.name}</b> ({cheapest.priceTotal}tr) đáng cân nhắc nhất.</>}
            </div>
          </div>
        </div>
      </CardShell>
    </>
  );
}
