import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Icon } from '../../ui/Icon.jsx';
import { VENDOR_CATEGORIES, useVendorCtx } from '../VendorCtx.jsx';
import { api } from '../../api.js';
import { CardShell, CardHead, CardAction, GhostBtn } from './cards.jsx';

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
  const img = bv.photos?.[0]?.url || null;
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
    grad: img ? `center/cover no-repeat url("${img}")` : (CAT_FALLBACK_GRAD[catId] || 'linear-gradient(135deg,#d4a0a0,#a06060)'),
    reasons: (bv.match?.reasons || []).map((r) => (typeof r === 'string' ? r : r.label)),
    why: bv.match?.whyThisVendor || '',
    includes: bv.tags || [],
    breakdown: {
      budget: Math.round((bk.budget ?? 0.5) * 100),
      style:  Math.round((bk.style ?? 0.5) * 100),
      avail:  Math.round((bk.availability ?? 0.5) * 100),
    },
    reviews: [],                                 // backend chưa có review text
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
      Đã lưu {name}
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
  const { getCatStatus } = useVendorCtx();
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
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11.5, color: 'var(--ink-400)', marginTop: 1 }}>Budget ~{cat.budget}tr</div>
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [whyThoseVendors, setWhyThoseVendors] = useState('');
  const [phase, setPhase] = useState('loading');  // loading → intro → cards

  const cat = VENDOR_CATEGORIES.find((c) => c.id === catId);

  useEffect(() => {
    let alive = true;
    api.matchVendors(coupleId, { category: catId, limit: 5 })
      .then((res) => {
        if (!alive) return;
        const list = (res?.vendors || []).map((v) => adaptVendor(v, catId));
        setVendors(list);
        setTotal(res?.total ?? list.length);
        const why = res?.whyThoseVendors || '';
        setWhyThoseVendors(why);
        setPhase(list.length && why ? 'intro' : 'cards');
      })
      .catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, [catId, coupleId]);

  const loadMore = () => {
    if (loadingMore || !vendors) return;
    setLoadingMore(true);
    api.matchVendors(coupleId, { category: catId, limit: 5, offset: vendors.length })
      .then((res) => {
        const more = (res?.vendors || []).map((v) => adaptVendor(v, catId));
        setVendors((prev) => [...prev, ...more]);
        setTotal(res?.total ?? total);
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  };

  if (!cat) return null;

  const showCards = phase === 'cards';
  const hasMore = vendors !== null && vendors.length < total;

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

  const onCompare = () => {
    const top2 = (vendors || []).slice(0, 2);
    if (top2.length < 2) return;
    pushUser(`So sánh ${top2[0].name} và ${top2[1].name}`);
    pushAI(VCompareChatCard, { catId, vendors: top2 });
  };

  return (
    <>
      <SaveFlash visible={!!flash} name={flash} />
      <CardShell gold>
        <CardHead icon={cat.icon}
          kicker={vendors ? `${vendors.length} / ${total} gợi ý phù hợp` : 'Tơ Hồng đang tìm…'}
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

        {whyThoseVendors && vendors?.length > 0 && (
          <Typewriter text={whyThoseVendors} borderBottom={showCards}
            onDone={() => setPhase('cards')} />
        )}

        {vendors !== null && vendors.length > 0 && showCards && (
          <div style={{ padding: '4px 0 2px' }}>
            {vendors.map((v, i) => {
              const isBest = i === 0;
              const isSaved = savedIds.includes(v.id);
              return (
                <div key={v.id} className="vm-card-in"
                  style={{ padding: '10px 14px', animationDelay: `${i * 80}ms`,
                  borderBottom: i < vendors.length - 1 ? '1px solid var(--line-100)' : 'none' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    {/* swatch */}
                    <div style={{ width: 54, height: 54, borderRadius: 'var(--r-sm)', flexShrink: 0,
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

        {showCards && hasMore && (
          <div style={{ padding: '10px 14px 4px', borderTop: '1px solid var(--line-100)' }}>
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
          </div>
        )}

        {vendors !== null && vendors.length >= 2 && showCards && (
          <CardAction>
            <GhostBtn icon="sliders-horizontal" small onClick={onCompare}>So sánh top 2</GhostBtn>
          </CardAction>
        )}
      </CardShell>
    </>
  );
}

/* ── VDetailChatCard ─────────────────────────────────────────── */
export function VDetailChatCard({ catId, vendor }) {
  const { coupleId, saved, saveVendor } = useVendorCtx();
  const [flash, setFlash] = useState(false);
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

  const onSave = () => {
    saveVendor(catId, vendor);
    setFlash(true);
    setTimeout(() => setFlash(false), 1900);
  };

  return (
    <>
      <SaveFlash visible={flash} name={vendor.name} />
      <CardShell gold>
        <CardHead icon={cat.icon} kicker="Chi tiết vendor" title={vendor.name} />

        {/* hero gradient / ảnh */}
        <div style={{ height: 140, background: vendor.grad, position: 'relative', flexShrink: 0 }}>
          <div style={{ position: 'absolute', bottom: 10, right: 10,
            background: 'rgba(0,0,0,0.52)', color: '#fff', borderRadius: 999,
            padding: '4px 10px', fontSize: 12, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-ui)' }}>
            <Icon name="star" size={12} color="#f4c542" sw={2} /> {vendor.rating} · {vendor.rv} đánh giá
          </div>
          <div style={{ position: 'absolute', top: 10, left: 10,
            background: 'rgba(0,0,0,0.52)', color: '#fff', borderRadius: 999,
            padding: '4px 10px', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-ui)' }}>
            {vendor.match}% phù hợp
          </div>
        </div>

        {/* AI breakdown */}
        <div style={{ padding: '12px 14px 4px' }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--kim-700)', textTransform: 'uppercase',
            letterSpacing: '0.07em', marginBottom: 8, fontFamily: 'var(--font-ui)' }}>Đánh giá AI</div>
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
        </div>

        {/* why sentence: template dimmed khi đang chờ AI → Typewriter khi AI về khác template */}
        {why && (
          typing ? (
            <Typewriter text={why} speed={14} onDone={() => setTyping(false)}
              style={{ padding: '4px 14px 8px', lineHeight: 1.55 }} />
          ) : (
            <div style={{ padding: '4px 14px 0', fontFamily: 'var(--font-body)', fontSize: 12.5,
              color: 'var(--ink-700)', lineHeight: 1.55,
              opacity: whyLoading ? 0.6 : 1, transition: 'opacity .2s ease' }}>
              {why}{whyLoading && <span className="vm-caret">▌</span>}
            </div>
          )
        )}

        {/* services / tags */}
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

        {/* review (chỉ hiện khi có) */}
        {vendor.reviews?.length > 0 && (
          <div style={{ padding: '0 14px 14px' }}>
            <div style={{ background: 'var(--son-50)', border: '1px solid var(--son-100)',
              borderRadius: 'var(--r-md)', padding: '10px 12px' }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, color: 'var(--ink-700)',
                lineHeight: 1.55, fontStyle: 'italic' }}>
                &ldquo;{vendor.reviews[0].text}&rdquo;
              </div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--ink-400)', marginTop: 4 }}>
                — {vendor.reviews[0].name}
              </div>
            </div>
          </div>
        )}

        <CardAction>
          {isSaved ? (
            <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: 'var(--font-ui)', fontSize: 12.5, color: 'var(--sage-600)', fontWeight: 600 }}>
              <Icon name="check" size={15} color="var(--sage-500)" sw={2.5} /> Đã lưu vào shortlist
            </span>
          ) : (
            <GhostBtn icon="heart" onClick={onSave}>Lưu vào shortlist</GhostBtn>
          )}
        </CardAction>
      </CardShell>
    </>
  );
}

/* ── VCompareChatCard ─────────────────────────────────────────── */
export function VCompareChatCard({ catId, vendors = [] }) {
  const { saved, saveVendor, confirmVendor } = useVendorCtx();
  const [flash, setFlash] = useState(null);

  const cat = VENDOR_CATEGORIES.find((c) => c.id === catId);
  const confirmedId = saved[catId]?.confirmed?.id;
  const winner = vendors.length > 0 ? vendors.reduce((a, b) => (a.match >= b.match ? a : b)) : null;

  if (!cat || vendors.length === 0) return null;

  const onChoose = (v) => {
    saveVendor(catId, v);
    confirmVendor(catId, v.id);
    setFlash(v.name);
    setTimeout(() => setFlash(null), 1900);
  };

  return (
    <>
      <SaveFlash visible={!!flash} name={flash} />
      <CardShell gold>
        <CardHead icon="sliders-horizontal" kicker="So sánh trực tiếp" title={cat.name} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '12px 13px' }}>
          {vendors.map((v) => {
            const isWinner = v.id === winner?.id;
            const isConfirmed = v.id === confirmedId;
            return (
              <div key={v.id} style={{
                background: isWinner ? 'var(--sage-50,#f0f7f0)' : 'var(--bg-1,var(--son-50))',
                border: `1px solid ${isWinner ? 'var(--sage-300,#a3c9a8)' : 'var(--line-100)'}`,
                borderRadius: 'var(--r-md)', padding: '10px 10px 12px' }}>
                <div style={{ height: 60, borderRadius: 'var(--r-sm)', background: v.grad, marginBottom: 8 }} />
                {isWinner && (
                  <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 700,
                    color: 'var(--sage-700,#2d6b3a)', background: 'var(--sage-100,#d0ecd4)',
                    borderRadius: 999, padding: '2px 8px', marginBottom: 6,
                    display: 'inline-flex', alignItems: 'center', gap: 4, letterSpacing: '0.05em' }}>
                    <Icon name="check" size={10} color="var(--sage-600)" sw={2.5} /> TỐT HƠN
                  </div>
                )}
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12.5, fontWeight: 600,
                  color: 'var(--ink-900)', marginBottom: 2 }}>{v.name}</div>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--ink-500)', marginBottom: 8 }}>
                  {v.priceTotal}tr · {v.match}% phù hợp
                </div>
                <button type="button" onClick={() => onChoose(v)}
                  style={{ width: '100%', fontFamily: 'var(--font-ui)', fontSize: 11.5, fontWeight: 600,
                    padding: '6px 0', borderRadius: 999, cursor: 'pointer',
                    background: isWinner ? 'var(--sage-500)' : 'transparent',
                    color: isWinner ? '#fff' : 'var(--ink-600)',
                    border: `1.5px solid ${isWinner ? 'var(--sage-500)' : 'var(--line-200)'}` }}>
                  {isConfirmed ? '✓ Đã chốt' : isWinner ? 'Chọn vendor này' : 'Chọn'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Tơ Hồng tiebreaker */}
        {winner && (
          <div style={{ margin: '0 13px 13px', background: 'var(--kim-50)', border: '1px solid var(--kim-200)',
            borderRadius: 'var(--r-md)', padding: '10px 12px' }}>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 700,
              color: 'var(--kim-700)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Icon name="sparkles" size={12} color="var(--kim-600)" sw={2} /> Gợi ý của Tơ Hồng
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, color: 'var(--ink-700)', lineHeight: 1.55 }}>
              {winner.name} phù hợp hơn — {winner.reasons?.[0] || 'điểm phù hợp cao nhất'} và được khách hàng đánh giá {winner.rating}★.
            </div>
          </div>
        )}

        <CardAction>
          <span style={{ flex: 1, fontFamily: 'var(--font-ui)', fontSize: 11.5,
            color: 'var(--ink-400)', alignSelf: 'center' }}>
            Chọn để chốt vendor cho danh mục này
          </span>
        </CardAction>
      </CardShell>
    </>
  );
}
