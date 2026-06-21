import { useState, useEffect, useCallback } from 'react';
import { Icon } from '../ui/Icon.jsx';
import { api } from '../api.js';

/* ════════════════════════════════════════════════════════
   SHARED ATOMS
═══════════════════════════════════════════════════════════ */
function AIAvatar() {
  return (
    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--son-500)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="14" height="14" viewBox="0 0 80 80" fill="none">
        <path d="M40 28C40 20,33 14,25.5 14C17 14,11 20,11 28C11 41,27 52,40 62C53 52,69 41,69 28C69 20,63 14,54.5 14C47 14,40 20,40 28Z"
          stroke="#FFF7F0" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M40 62L40 70" stroke="#FFF7F0" strokeWidth="6" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function MatchRing({ pct, size = 44, stroke = 4 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - pct / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line-200)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--son-500)" strokeWidth={stroke}
        strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset .7s cubic-bezier(.3,.7,.3,1)' }} />
      <text x="50%" y="52%" textAnchor="middle" dominantBaseline="central"
        fontFamily="var(--font-ui)" fontSize={size * 0.28} fontWeight="700" fill="var(--son-600)">{pct}</text>
    </svg>
  );
}

function ReasonChip({ icon, label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 600,
      color: '#4d7a59', background: '#edf7ee', border: '1px solid #cfe3d2',
      borderRadius: 999, padding: '3px 9px', whiteSpace: 'nowrap' }}>
      <Icon name={icon} size={11} color="#5e8c6a" sw={2} /> {label}
    </span>
  );
}

function ProfileBar({ profile }) {
  if (!profile) return null;
  const items = [
    profile.styles?.[0] && { icon: 'palette', label: `Gu ${profile.styles[0]}` },
    profile.budgetTotal && { icon: 'wallet', label: `${profile.budgetTotal}tr` },
    profile.weddingDate && { icon: 'calendar-heart', label: new Date(profile.weddingDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) },
    profile.city && { icon: 'map-pin', label: profile.city === 'HCMC' ? 'TP.HCM' : profile.city },
  ].filter(Boolean);
  if (!items.length) return null;
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {items.map((it, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0,
          fontFamily: 'var(--font-ui)', fontSize: 11.5, fontWeight: 600, color: 'var(--son-700)',
          background: 'var(--son-50)', border: '1px solid var(--son-100)', borderRadius: 999, padding: '4px 10px' }}>
          <Icon name={it.icon} size={12} color="var(--son-500)" sw={2} /> {it.label}
        </span>
      ))}
    </div>
  );
}

const CAT_OPTS = [
  { id: null,            label: 'Tất cả' },
  { id: 'photography',   label: 'Chụp ảnh' },
  { id: 'venue',         label: 'Tiệc' },
  { id: 'flower',        label: 'Trang trí' },
  { id: 'wedding_attire',label: 'Trang phục' },
  { id: 'makeup',        label: 'Làm đẹp' },
];

/* ════════════════════════════════════════════════════════
   DESIGN A — BẢNG ĐỘ HỢP (ranked list)
═══════════════════════════════════════════════════════════ */
function MatchCard({ v, shortlisted, onShortlist, onDismiss }) {
  const [saved, setSaved] = useState(shortlisted);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => { setSaved(shortlisted); }, [shortlisted]);

  if (dismissed) return null;

  const handleShortlist = () => {
    const next = !saved;
    setSaved(next);
    onShortlist(v.id, next);
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss(v.id);
  };

  const match = v.match || {};
  const reasons = match.reasons || [];
  const score = match.totalScore ?? 0;

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--line-100)', borderRadius: 'var(--r-lg)',
      boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
      {/* Photo */}
      <div style={{ position: 'relative', height: 124, background: 'var(--sand)' }}>
        {v.photos?.[0]?.url && (
          <img src={v.photos[0].url} alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(43,36,32,0) 45%,rgba(43,36,32,.4) 100%)' }} />
        {/* Category badge */}
        <span style={{ position: 'absolute', top: 10, left: 10, display: 'inline-flex', alignItems: 'center', gap: 5,
          fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 600, color: 'var(--ink-900)',
          background: 'rgba(255,253,251,.92)', backdropFilter: 'blur(4px)', borderRadius: 999, padding: '4px 10px' }}>
          <Icon name={v.catIcon || 'store'} size={12} color="var(--son-500)" /> {v.catLabel}
        </span>
        {/* Match ring */}
        <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(255,253,251,.94)',
          backdropFilter: 'blur(4px)', borderRadius: '50%', padding: 3, boxShadow: '0 2px 8px rgba(80,50,40,.18)' }}>
          <MatchRing pct={score} size={44} stroke={4} />
        </div>
        {/* Score label */}
        <span style={{ position: 'absolute', bottom: 9, right: 10, fontFamily: 'var(--font-ui)', fontSize: 10.5, fontWeight: 700,
          letterSpacing: '.04em', color: '#FFF7F0', textShadow: '0 1px 3px rgba(43,36,32,.5)' }}>{score}% HỢP</span>
      </div>

      {/* Body */}
      <div style={{ padding: '12px 14px 13px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginBottom: 2 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, color: 'var(--ink-900)' }}>{v.name}</span>
          {v.rating > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontFamily: 'var(--font-ui)', fontSize: 11.5, fontWeight: 600, color: 'var(--kim-700)' }}>
              <Icon name="star" size={10} color="var(--kim-500)" fill="var(--kim-400)" sw={0} /> {v.rating}
            </span>
          )}
          <span style={{ flex: 1 }} />
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 16, fontWeight: 700, color: 'var(--son-600)', fontVariantNumeric: 'tabular-nums' }}>
            {v.priceMin}-{v.priceMax}tr
          </span>
        </div>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--ink-400)', marginBottom: 9 }}>
          {v.spec} · {v.city}
        </div>

        {/* Reason chips */}
        {reasons.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {reasons.map((r, i) => <ReasonChip key={i} icon={r.icon} label={r.label} />)}
          </div>
        )}

        {/* Tơ Hồng why */}
        {match.whySentence && (
          <div style={{ display: 'flex', gap: 7, padding: '8px 11px', background: 'var(--kim-50)', border: '1px solid var(--kim-100)', borderRadius: 'var(--r-sm)', marginBottom: 11 }}>
            <AIAvatar />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, color: 'var(--ink-700)', lineHeight: 1.45 }}>{match.whySentence}</span>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleShortlist}
            style={{ width: 44, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: saved ? 'var(--son-50)' : 'var(--card)', border: `1px solid ${saved ? 'var(--son-300)' : 'var(--line-300)'}`,
              borderRadius: 999, padding: '10px 0', cursor: 'pointer' }}>
            <Icon name="heart" size={17} color={saved ? 'var(--son-500)' : 'var(--ink-400)'} sw={2} fill={saved ? 'var(--son-500)' : 'none'} />
          </button>
          <button onClick={handleDismiss}
            style={{ width: 44, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--card)', border: '1px solid var(--line-300)', borderRadius: 999, padding: '10px 0', cursor: 'pointer' }}>
            <Icon name="x" size={16} color="var(--ink-400)" sw={2} />
          </button>
          <button style={{ flex: 1, fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 700, color: '#fff',
            background: 'var(--son-500)', border: 'none', borderRadius: 999, padding: '10px 0', cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(168,50,70,.18)' }}>
            Xem hồ sơ
          </button>
        </div>
      </div>
    </div>
  );
}

export function ScreenVendorMatch({ coupleId, onMenuOpen }) {
  const [vendors, setVendors] = useState([]);
  const [profile, setProfile] = useState(null);
  const [category, setCategory] = useState(null);
  const [shortlisted, setShortlisted] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (cat) => {
    setLoading(true);
    setError('');
    try {
      const [matchRes, prefsRes] = await Promise.all([
        api.matchVendors(coupleId, { category: cat, minScore: 0 }),
        coupleId ? api.getVendorPrefs(coupleId) : Promise.resolve(null),
      ]);
      setVendors(matchRes.vendors || []);
      setProfile({
        styles: matchRes.profileSnapshot?.styles,
        budgetTotal: matchRes.profileSnapshot?.budgetTotal,
        weddingDate: matchRes.profileSnapshot?.weddingDate,
        city: matchRes.profileSnapshot?.city,
      });
      if (prefsRes?.shortlistedVendorIds) {
        setShortlisted(new Set(prefsRes.shortlistedVendorIds));
      }
    } catch (e) {
      setError('Không tải được danh sách. Thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, [coupleId]);

  useEffect(() => { load(category); }, [load, category]);

  const handleShortlist = async (vendorId, add) => {
    if (!coupleId) return;
    setShortlisted((prev) => {
      const next = new Set(prev);
      add ? next.add(vendorId) : next.delete(vendorId);
      return next;
    });
    try {
      if (add) await api.addToShortlist(coupleId, vendorId);
      else await api.removeFromShortlist(coupleId, vendorId);
    } catch {}
  };

  const handleDismiss = async (vendorId) => {
    if (!coupleId) return;
    try { await api.dismissVendor(coupleId, vendorId); } catch {}
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--paper)' }}>
      {/* Header */}
      <div style={{ flexShrink: 0, background: 'rgba(252,248,243,0.96)', backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid var(--line-100)', padding: 'var(--header-pt) 16px 11px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: profile ? 10 : 0 }}>
          <button onClick={onMenuOpen} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
            <Icon name="menu" size={22} color="var(--ink-700)" />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 600, color: 'var(--ink-900)', lineHeight: 1.1 }}>Gợi ý cho bạn</div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--ink-400)', marginTop: 1 }}>
              {loading ? 'Đang tìm…' : `${vendors.length} vendor hợp gu · sắp theo độ hợp`}
            </div>
          </div>
          <Icon name="sliders-horizontal" size={20} color="var(--ink-400)" />
        </div>
        {profile && <ProfileBar profile={profile} />}
      </div>

      {/* Category filter */}
      <div style={{ flexShrink: 0, display: 'flex', gap: 7, overflowX: 'auto', padding: '10px 16px 9px',
        borderBottom: '1px solid var(--line-100)' }}>
        {CAT_OPTS.map((c) => {
          const on = category === c.id;
          return (
            <button key={c.label} onClick={() => setCategory(c.id)}
              style={{ flexShrink: 0, fontFamily: 'var(--font-ui)', fontSize: 12.5, fontWeight: on ? 700 : 500,
                color: on ? '#fff' : 'var(--ink-700)', background: on ? 'var(--son-500)' : 'var(--card)',
                border: `1px solid ${on ? 'var(--son-500)' : 'var(--line-200)'}`, borderRadius: 999, padding: '7px 14px', cursor: 'pointer' }}>
              {c.label}
            </button>
          );
        })}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '13px 16px 24px', display: 'flex', flexDirection: 'column', gap: 13 }}>
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, color: 'var(--ink-400)', fontFamily: 'var(--font-ui)', fontSize: 13 }}>
            Đang tìm vendor phù hợp…
          </div>
        )}
        {!loading && error && (
          <div style={{ padding: '12px 14px', background: 'var(--error-bg)', border: '1px solid #e8c5c5', borderRadius: 'var(--r-md)', fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--error)' }}>
            {error}
          </div>
        )}
        {!loading && !error && vendors.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, paddingTop: 48, textAlign: 'center' }}>
            <Icon name="search-x" size={36} color="var(--ink-300)" />
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, color: 'var(--ink-900)', marginBottom: 6 }}>Chưa có vendor phù hợp</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 13.5, color: 'var(--ink-500)', lineHeight: 1.6, maxWidth: 240 }}>
                Thử chọn danh mục khác hoặc cập nhật gu phong cách của bạn.
              </div>
            </div>
          </div>
        )}
        {!loading && vendors.map((v) => (
          <MatchCard key={v.id} v={v}
            shortlisted={shortlisted.has(v.id)}
            onShortlist={handleShortlist}
            onDismiss={handleDismiss} />
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   DESIGN B — TƠ HỒNG SE DUYÊN (swipe deck)
═══════════════════════════════════════════════════════════ */
function DeckCard({ v, peek }) {
  const match = v.match || {};
  const score = match.totalScore ?? 0;
  const reasons = match.reasons || [];

  return (
    <div style={{ position: 'absolute', inset: 0, borderRadius: 'var(--r-xl)', overflow: 'hidden', background: 'var(--card)',
      border: '1px solid var(--line-100)', boxShadow: 'var(--shadow-lg)',
      transform: peek ? 'scale(.93) translateY(14px)' : 'none', opacity: peek ? 0.6 : 1,
      transition: 'transform .3s ease, opacity .3s ease', pointerEvents: peek ? 'none' : 'auto' }}>
      {/* Photo */}
      <div style={{ position: 'relative', height: '62%', background: 'var(--sand)' }}>
        {v.photos?.[0]?.url && (
          <img src={v.photos[0].url} alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(43,36,32,0) 40%,rgba(43,36,32,.55) 100%)' }} />
        {/* Match badge */}
        <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', alignItems: 'center', gap: 7,
          background: 'rgba(255,253,251,.94)', backdropFilter: 'blur(6px)', borderRadius: 999, padding: '5px 12px 5px 6px', boxShadow: 'var(--shadow-sm)' }}>
          <MatchRing pct={score} size={34} stroke={3.5} />
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 700, color: 'var(--son-600)' }}>hợp gu</span>
        </div>
        {/* Category */}
        <span style={{ position: 'absolute', top: 14, left: 14, display: 'inline-flex', alignItems: 'center', gap: 5,
          fontFamily: 'var(--font-ui)', fontSize: 11.5, fontWeight: 600, color: '#FFF7F0',
          background: 'rgba(43,36,32,.34)', backdropFilter: 'blur(4px)', borderRadius: 999, padding: '5px 11px' }}>
          <Icon name={v.catIcon || 'store'} size={12} color="#FFF7F0" /> {v.catLabel}
        </span>
        {/* Name overlay */}
        <div style={{ position: 'absolute', left: 18, right: 18, bottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: '#FFF7F0', textShadow: '0 2px 8px rgba(43,36,32,.5)' }}>{v.name}</span>
            {v.rating > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 600, color: '#FFF7F0' }}>
                <Icon name="star" size={11} color="var(--kim-300)" fill="var(--kim-300)" sw={0} /> {v.rating}
              </span>
            )}
          </div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12.5, color: 'rgba(255,247,240,.85)', marginTop: 2 }}>{v.spec}</div>
        </div>
      </div>

      {/* Lower body */}
      <div style={{ height: '38%', padding: '14px 18px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-ui)', fontSize: 12.5, color: 'var(--ink-500)' }}>
            <Icon name="map-pin" size={13} color="var(--ink-400)" /> {v.city}
          </span>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 18, fontWeight: 700, color: 'var(--son-600)', fontVariantNumeric: 'tabular-nums' }}>
            {v.priceMin}-{v.priceMax}tr
          </span>
        </div>
        {reasons.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {reasons.map((r, i) => <ReasonChip key={i} icon={r.icon} label={r.label} />)}
          </div>
        )}
        {match.whySentence && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flex: 1 }}>
            <AIAvatar />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-700)', lineHeight: 1.45 }}>{match.whySentence}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function ScreenVendorSwipe({ coupleId, onMenuOpen, onBack }) {
  const [vendors, setVendors] = useState([]);
  const [idx, setIdx] = useState(0);
  const [liked, setLiked] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.matchVendors(coupleId, { minScore: 0, limit: 50 })
      .then((r) => setVendors(r.vendors || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [coupleId]);

  const act = async (like) => {
    const cur = vendors[idx];
    if (like && cur) {
      setLiked((l) => [...l, cur]);
      try { await api.addToShortlist(coupleId, cur.id); } catch {}
    } else if (cur) {
      try { await api.dismissVendor(coupleId, cur.id); } catch {}
    }
    setIdx((i) => i + 1);
  };

  const undo = () => setIdx((i) => Math.max(0, i - 1));
  const restart = () => { setIdx(0); setLiked([]); };

  const total = vendors.length;
  const done = idx >= total;
  const cur = vendors[idx];
  const next = vendors[idx + 1];

  if (loading) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--paper)', color: 'var(--ink-400)', fontFamily: 'var(--font-ui)', fontSize: 13 }}>
      Đang tìm vendor…
    </div>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--paper)' }}>
      {/* Header */}
      <div style={{ flexShrink: 0, padding: 'var(--header-pt) 18px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--ink-600)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--ink-900)', lineHeight: 1.1 }}>Tơ Hồng se duyên</div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--ink-400)', marginTop: 1 }}>Vuốt qua từng vendor hợp gu của bạn</div>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 700, color: 'var(--son-600)',
          background: 'var(--son-50)', border: '1px solid var(--son-100)', borderRadius: 999, padding: '4px 11px' }}>
          <Icon name="heart" size={12} color="var(--son-500)" fill="var(--son-500)" sw={0} /> {liked.length}
        </span>
      </div>

      {/* Progress dots */}
      {total > 0 && (
        <div style={{ flexShrink: 0, display: 'flex', gap: 5, justifyContent: 'center', padding: '4px 0 10px' }}>
          {vendors.map((_, i) => (
            <span key={i} style={{ width: i === Math.min(idx, total - 1) ? 20 : 6, height: 6, borderRadius: 999,
              background: i < idx ? 'var(--son-300)' : i === idx ? 'var(--son-500)' : 'var(--line-200)', transition: 'all .25s ease' }} />
          ))}
        </div>
      )}

      {/* Deck */}
      <div style={{ flex: 1, position: 'relative', margin: '0 18px' }}>
        {done ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, textAlign: 'center', padding: '0 24px' }}>
            <div style={{ width: 66, height: 66, borderRadius: '50%', background: 'var(--son-50)', border: '1px solid var(--son-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="heart-handshake" size={30} color="var(--son-500)" sw={1.7} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 600, color: 'var(--ink-900)' }}>Đã xem hết!</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink-500)', lineHeight: 1.55, marginTop: 6 }}>
                Bạn đã thích <b>{liked.length} vendor</b>. Tơ Hồng sẽ giúp bạn đặt lịch xem & so sánh.
              </div>
            </div>
            <button onClick={restart} style={{ fontFamily: 'var(--font-ui)', fontSize: 13.5, fontWeight: 600, color: 'var(--son-700)',
              background: 'var(--card)', border: '1px solid var(--son-200)', borderRadius: 999, padding: '10px 22px', cursor: 'pointer' }}>
              Xem lại từ đầu
            </button>
          </div>
        ) : (
          <>
            {next && <DeckCard v={next} peek />}
            {cur && <DeckCard v={cur} />}
          </>
        )}
      </div>

      {/* Action bar */}
      {!done && (
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22, padding: '16px 0 24px' }}>
          <button onClick={() => act(false)}
            style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--card)', border: '1.5px solid var(--line-300)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>
            <Icon name="x" size={26} color="var(--ink-400)" sw={2.2} />
          </button>
          <button onClick={undo}
            style={{ width: 46, height: 46, borderRadius: '50%', background: 'var(--card)', border: '1.5px solid var(--line-200)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>
            <Icon name="rotate-ccw" size={19} color="var(--kim-600)" sw={2.2} />
          </button>
          <button onClick={() => act(true)}
            style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--son-500)', border: '1.5px solid var(--son-500)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 8px 24px rgba(168,50,70,.18)' }}>
            <Icon name="heart" size={26} color="#fff" sw={2.2} fill="#fff" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   EXISTING TRACKER (static, kept intact)
═══════════════════════════════════════════════════════════ */
const VS = {
  confirmed:   { label: 'Đã chốt',  color: 'var(--sage-500)', bg: '#edf7ee', border: '#c3dfc7', icon: 'check-circle-2' },
  shortlisted: { label: 'Đang xem', color: '#b45309',          bg: '#fef9ed', border: '#fcd34d', icon: 'bookmark'       },
  none:        { label: 'Chưa có',  color: 'var(--ink-400)',   bg: 'var(--sand)', border: 'var(--line-200)', icon: 'circle-dashed' },
};

const COMPARE_VENDORS = [
  { id: 'hf',  name: 'Hỷ Films',    spec: 'Phóng sự + phim ngắn', price: 52, rating: 4.8, rv: 97,  why: 'Phù hợp nếu muốn thêm phim lưu niệm ngắn',        grad: 'linear-gradient(135deg,#c9a07a,#9a6b4a)' },
  { id: 'ts2', name: 'Tâm Studio',  spec: 'Phóng sự phim',        price: 40, rating: 4.9, rv: 212, why: 'Được đặt nhiều nhất cho ngày 12.10 ở Q.1',          grad: 'linear-gradient(135deg,#caa090,#a77060)' },
  { id: 'mw2', name: 'Mộc Wedding', spec: 'Phong cách tự nhiên',  price: 35, rating: 4.7, rv: 168, why: 'Ngân sách tốt · style hợp với áo dài truyền thống', grad: 'linear-gradient(135deg,#b9a080,#8b7060)' },
];

const VCATS_INIT = [
  { id: 'tiec',   name: 'Tiệc & nhà hàng', icon: 'utensils-crossed', budget: 220, color: 'var(--son-500)',
    vendors: [{ id: 'wh', name: 'White Palace', spec: 'Sảnh 25 bàn · 200 khách', price: 200, rating: 4.8, rv: 312, status: 'confirmed', note: 'Đặt cọc 30tr · 12.10' }],
    nudge: 'Chưa chốt menu — cần gửi cho bếp trước 4 tuần.' },
  { id: 'chup',   name: 'Chụp ảnh / quay', icon: 'camera', budget: 60, color: 'var(--dao-400)',
    vendors: [
      { id: 'ts', name: 'Tâm Studio',  spec: 'Phóng sự phim',      price: 40, rating: 4.9, rv: 212, status: 'shortlisted' },
      { id: 'mw', name: 'Mộc Wedding', spec: 'Phong cách tự nhiên', price: 35, rating: 4.7, rv: 168, status: 'shortlisted' },
    ], aiMore: true },
  { id: 'trang',  name: 'Trang trí & hoa', icon: 'flower-2', budget: 70, color: 'var(--son-300)',
    vendors: [{ id: 'hn', name: 'Hương Ngọc Decor', spec: 'Hoa tươi & backdrop', price: 45, rating: 4.8, rv: 89, status: 'confirmed' }] },
  { id: 'trangp', name: 'Trang phục', icon: 'shirt', budget: 50, color: 'var(--kim-300)',
    vendors: [{ id: 'dd', name: 'Duyên Dáng Bridal', spec: 'Áo dài + váy cưới', price: 30, rating: 4.6, rv: 145, status: 'shortlisted' }] },
  { id: 'nhac',   name: 'Âm nhạc / MC', icon: 'music-2', budget: 0, color: 'var(--ink-300)', vendors: [], empty: true },
];

function catStKey(cat) {
  if (cat.vendors.length === 0) return 'none';
  if (cat.vendors.some((v) => v.status === 'confirmed')) return 'confirmed';
  return 'shortlisted';
}

function VRow({ v, catIcon, catColor, onCycle }) {
  const s = VS[v.status];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--line-100)' }}>
      <div style={{ width: 34, height: 34, borderRadius: 'var(--r-sm)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: v.status === 'confirmed' ? '#edf7ee' : 'var(--sand)', border: `1px solid ${v.status === 'confirmed' ? '#c3dfc7' : 'var(--line-200)'}` }}>
        <Icon name={catIcon} size={16} color={v.status === 'confirmed' ? 'var(--sage-500)' : catColor} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: 'var(--ink-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11.5, color: 'var(--ink-400)' }}>{v.spec}</span>
          {v.rating && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 600, color: 'var(--kim-700)' }}>
              <Icon name="star" size={10} color="var(--kim-500)" /> {v.rating}
            </span>
          )}
        </div>
        {v.note && <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10.5, color: 'var(--son-600)', marginTop: 2 }}>{v.note}</div>}
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 700, color: 'var(--ink-900)', fontVariantNumeric: 'tabular-nums', marginBottom: 4 }}>{v.price}tr</div>
        <button onClick={onCycle} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontFamily: 'var(--font-ui)', fontSize: 10.5, fontWeight: 600,
          color: s.color, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 999, padding: '2px 8px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <Icon name={s.icon} size={10} color={s.color} /> {s.label}
        </button>
      </div>
    </div>
  );
}

function VNudge({ text }) {
  const [show, setShow] = useState(true);
  if (!show) return null;
  return (
    <div style={{ position: 'relative', margin: '6px 0 2px', borderRadius: 'var(--r-sm)', background: 'var(--kim-50)', border: '1px solid var(--kim-200)', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'linear-gradient(var(--kim-400),var(--son-400))' }} />
      <div style={{ padding: '8px 10px 8px 14px', display: 'flex', alignItems: 'flex-start', gap: 7 }}>
        <Icon name="sparkles" size={13} color="var(--kim-600)" />
        <span style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: 12.5, color: 'var(--ink-900)', lineHeight: 1.45 }}>{text}</span>
        <button onClick={() => setShow(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, opacity: .7 }}>
          <Icon name="x" size={14} color="var(--ink-400)" />
        </button>
      </div>
    </div>
  );
}

function VAiMore({ budgetLeft, onCompare }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  if (done) return (
    <div style={{ padding: '8px 14px 10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 12px', background: 'var(--sage-50)', border: '1px solid #c3dfc7', borderRadius: 'var(--r-md)' }}>
        <Icon name="check-circle-2" size={15} color="var(--sage-500)" />
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12.5, fontWeight: 600, color: 'var(--sage-500)' }}>Đã thêm Hỷ Films vào danh sách xem 💕</span>
      </div>
    </div>
  );
  return (
    <div style={{ padding: '6px 14px 12px', borderTop: '1px solid var(--line-100)' }}>
      {!open
        ? <button onClick={() => onCompare ? onCompare() : setOpen(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600, color: 'var(--kim-700)',
            background: 'var(--kim-50)', border: '1px solid var(--kim-200)', borderRadius: 'var(--r-md)', padding: '9px 0', cursor: 'pointer' }}>
            <Icon name="sparkles" size={14} color="var(--kim-600)" /> Tơ Hồng gợi ý thêm 1 studio
          </button>
        : <div style={{ background: 'var(--kim-50)', border: '1px solid var(--kim-200)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
            <div style={{ padding: '11px 13px 9px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <AIAvatar />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-900)', lineHeight: 1.5 }}>
                  <b>Hỷ Films</b> có phóng sự + phim ngắn · 52tr. Lịch 12.10 còn. Ngân sách còn dư {budgetLeft}tr sau khi chọn.
                </div>
              </div>
            </div>
            <div style={{ padding: '8px 13px 11px', borderTop: '1px solid var(--kim-100)', display: 'flex', gap: 7 }}>
              <button onClick={() => setOpen(false)} style={{ fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 600, color: 'var(--ink-500)',
                background: 'var(--card)', border: '1px solid var(--line-300)', borderRadius: 999, padding: '6px 13px', cursor: 'pointer' }}>Bỏ qua</button>
              <button onClick={() => setDone(true)} style={{ fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 600, color: '#fff',
                background: 'var(--son-500)', border: 'none', borderRadius: 999, padding: '6px 15px', cursor: 'pointer' }}>+ Lưu để xem</button>
            </div>
          </div>
      }
    </div>
  );
}

function VCatCard({ cat, onCycle, onCompare }) {
  const stk = catStKey(cat);
  const s = VS[stk];
  const spent = cat.vendors.reduce((n, v) => n + v.price, 0);
  const left = cat.budget - spent;
  return (
    <div style={{ background: 'var(--card)', border: `1px solid ${stk === 'confirmed' ? '#c3dfc7' : 'var(--line-100)'}`,
      borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', marginBottom: 12 }}>
      <div style={{ padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10,
        background: stk === 'confirmed' ? '#f4fbf4' : 'var(--sand)', borderBottom: '1px solid var(--line-100)' }}>
        <span style={{ width: 30, height: 30, borderRadius: 'var(--r-sm)', background: cat.color, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={cat.icon} size={15} color="#fff" sw={2} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13.5, fontWeight: 700, color: 'var(--ink-900)' }}>{cat.name}</div>
          {cat.budget > 0 && (
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: left < 0 ? 'var(--danger-500,#dc2626)' : 'var(--ink-400)' }}>
              Ngân sách {cat.budget}tr{spent > 0 ? ` · còn ${left}tr` : ''}
            </div>
          )}
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 700,
          color: s.color, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 999, padding: '3px 9px' }}>
          <Icon name={s.icon} size={10} color={s.color} /> {s.label}
        </span>
      </div>
      {cat.vendors.length > 0 && (
        <div style={{ padding: '0 14px' }}>
          {cat.vendors.map((v) => <VRow key={v.id} v={v} catIcon={cat.icon} catColor={cat.color} onCycle={() => onCycle(cat.id, v.id)} />)}
        </div>
      )}
      {cat.nudge && <div style={{ padding: '0 14px 8px' }}><VNudge text={cat.nudge} /></div>}
      {cat.empty && (
        <div style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 13px', background: 'var(--kim-50)', border: '1px solid var(--kim-200)', borderRadius: 'var(--r-md)' }}>
            <Icon name="sparkles" size={14} color="var(--kim-600)" />
            <span style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-900)', lineHeight: 1.4 }}>Tơ Hồng gợi ý MC/band nhạc — muốn xem không?</span>
            <button style={{ fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 600, color: 'var(--son-600)', background: 'var(--card)',
              border: '1px solid var(--son-200)', borderRadius: 999, padding: '5px 11px', cursor: 'pointer', flexShrink: 0 }}>Xem</button>
          </div>
        </div>
      )}
      {cat.aiMore && <VAiMore budgetLeft={cat.budget - spent} onCompare={onCompare} />}
    </div>
  );
}

function CompCard({ v, selected, onSelect, onConfirm }) {
  return (
    <div onClick={onSelect} style={{ borderRadius: 'var(--r-lg)', border: `1.5px solid ${selected ? 'var(--son-400)' : 'var(--line-100)'}`,
      background: selected ? 'var(--son-50)' : 'var(--card)', boxShadow: selected ? '0 0 0 3px rgba(168,50,70,.12)' : 'var(--shadow-xs)',
      overflow: 'hidden', cursor: 'pointer', transition: 'all .15s ease', marginBottom: 12 }}>
      <div style={{ height: 68, background: v.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <Icon name="camera" size={26} color="rgba(255,255,255,0.78)" />
        {selected && (
          <div style={{ position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderRadius: '50%', background: 'var(--son-500)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>
            <Icon name="check" size={12} color="#fff" sw={3} />
          </div>
        )}
      </div>
      <div style={{ padding: '11px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginBottom: 3 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--ink-900)' }}>{v.name}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontFamily: 'var(--font-ui)', fontSize: 11.5, fontWeight: 600, color: 'var(--kim-700)' }}>
            <Icon name="star" size={10} color="var(--kim-500)" /> {v.rating}
          </span>
          <span style={{ flex: 1 }} />
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 16, fontWeight: 700, color: 'var(--son-600)', fontVariantNumeric: 'tabular-nums' }}>{v.price}tr</span>
        </div>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--ink-500)', marginBottom: 8 }}>{v.spec}</div>
        <div style={{ display: 'flex', gap: 6, padding: '8px 10px', background: 'var(--kim-50)', borderRadius: 'var(--r-sm)', border: '1px solid var(--kim-100)' }}>
          <Icon name="sparkles" size={13} color="var(--kim-600)" />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, color: 'var(--ink-900)', lineHeight: 1.4 }}>{v.why}</span>
        </div>
      </div>
      {selected && (
        <div style={{ padding: '0 14px 13px', display: 'flex', gap: 8 }}>
          <button style={{ flex: 1, fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600, color: 'var(--ink-700)',
            background: 'var(--card)', border: '1px solid var(--line-300)', borderRadius: 999, padding: '9px 0', cursor: 'pointer' }}>Lưu để xem</button>
          <button onClick={(e) => { e.stopPropagation(); onConfirm(); }} style={{ flex: 1.2, fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600, color: '#fff',
            background: 'var(--son-500)', border: 'none', borderRadius: 999, padding: '9px 0', cursor: 'pointer' }}>Chốt luôn</button>
        </div>
      )}
    </div>
  );
}

export function ScreenVendorCompare({ onBack }) {
  const [sel, setSel] = useState(null);
  const [done, setDone] = useState(null);
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--paper)' }}>
      <div style={{ flexShrink: 0, background: 'rgba(252,248,243,0.96)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--line-100)', padding: 'var(--header-pt) 16px 13px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', display: 'flex' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="var(--ink-600)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--ink-900)', lineHeight: 1.1 }}>Chụp ảnh / quay</div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11.5, color: 'var(--ink-500)', marginTop: 1 }}>3 gợi ý từ Tơ Hồng</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--son-50)', border: '1px solid var(--son-200)', borderRadius: 999, padding: '5px 11px' }}>
            <Icon name="wallet" size={13} color="var(--son-500)" />
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12.5, fontWeight: 700, color: 'var(--son-600)' }}>60tr</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 9, background: 'var(--kim-50)', border: '1px solid var(--kim-200)', borderRadius: 'var(--r-md)', padding: '10px 12px' }}>
          <AIAvatar />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-900)', lineHeight: 1.5, flex: 1 }}>
            Mình lọc <b>3 studio</b> còn lịch 12.10, phù hợp ngân sách và style của bạn. Chạm để xem chi tiết:
          </span>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 12px' }}>
        {done
          ? <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 48, gap: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--sage-50)', border: '2.5px solid var(--sage-500)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="check-circle-2" size={32} color="var(--sage-500)" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--ink-900)', marginBottom: 6 }}>Đã chốt {done}!</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink-500)', lineHeight: 1.6, maxWidth: 260 }}>Mình đã thêm vào danh mục Chụp ảnh và ghi nhớ vào kế hoạch.</div>
              </div>
              <button onClick={() => { setSel(null); setDone(null); }} style={{ fontFamily: 'var(--font-ui)', fontSize: 13.5, fontWeight: 600, color: 'var(--son-700)',
                background: 'var(--card)', border: '1px solid var(--son-200)', borderRadius: 999, padding: '10px 22px', cursor: 'pointer' }}>
                Xem lại các studio khác
              </button>
            </div>
          : COMPARE_VENDORS.map((v) => (
              <CompCard key={v.id} v={v} selected={sel === v.id}
                onSelect={() => setSel(v.id === sel ? null : v.id)}
                onConfirm={() => setDone(v.name)} />
            ))
        }
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   ROOT — combines tracker + match modes with tab switcher
═══════════════════════════════════════════════════════════ */
const ROOT_MODES = [
  { id: 'match',   label: 'Gợi ý AI',  icon: 'sparkles' },
  { id: 'swipe',   label: 'Se duyên',  icon: 'heart' },
  { id: 'tracker', label: 'Kế hoạch',  icon: 'clipboard-list' },
];

export function ScreenVendorTracker({ coupleId, onMenuOpen }) {
  const [mode, setMode] = useState('match');
  const [compareView, setCompareView] = useState(false);
  const [cats, setCats] = useState(VCATS_INIT.map((c) => ({ ...c, vendors: c.vendors.map((v) => ({ ...v })) })));

  if (mode === 'swipe') {
    return <ScreenVendorSwipe coupleId={coupleId} onMenuOpen={onMenuOpen} onBack={() => setMode('match')} />;
  }

  if (mode === 'match') {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <ScreenVendorMatch coupleId={coupleId} onMenuOpen={onMenuOpen} />
        </div>
        {/* Mode switcher */}
        <div style={{ flexShrink: 0, display: 'flex', borderTop: '1px solid var(--line-100)', background: 'rgba(252,248,243,0.97)', backdropFilter: 'blur(12px)' }}>
          {ROOT_MODES.map((m) => {
            const on = mode === m.id;
            return (
              <button key={m.id} onClick={() => setMode(m.id)}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  padding: '9px 2px 7px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <Icon name={m.icon} size={20} color={on ? 'var(--son-500)' : 'var(--ink-400)'} sw={on ? 2.2 : 1.7} fill={on && m.id === 'swipe' ? 'var(--son-500)' : 'none'} />
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 9.5, fontWeight: on ? 700 : 500, color: on ? 'var(--son-600)' : 'var(--ink-400)' }}>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Tracker mode
  if (compareView) return <ScreenVendorCompare onBack={() => setCompareView(false)} />;

  const cycleVendor = (catId, vId) => setCats((cs) => cs.map((c) => c.id !== catId ? c : {
    ...c, vendors: c.vendors.map((v) => v.id !== vId ? v : { ...v, status: v.status === 'confirmed' ? 'shortlisted' : 'confirmed' }),
  }));

  const totalVendors = cats.flatMap((c) => c.vendors).length;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--paper)' }}>
        <div style={{ flexShrink: 0, background: 'rgba(252,248,243,0.96)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--line-100)', padding: 'var(--header-pt) 16px 13px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={onMenuOpen} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
              <Icon name="menu" size={22} color="var(--ink-700)" />
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--ink-900)', lineHeight: 1.1 }}>Kế hoạch Vendor</div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11.5, color: 'var(--ink-500)', marginTop: 1 }}>{cats.length} danh mục · {totalVendors} vendor</div>
            </div>
            <button style={{ width: 34, height: 34, borderRadius: 'var(--r-sm)', background: 'var(--son-500)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Icon name="plus" size={18} color="#fff" sw={2.2} />
            </button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 8px' }}>
          {cats.map((cat) => <VCatCard key={cat.id} cat={cat} onCycle={cycleVendor} onCompare={() => setCompareView(true)} />)}
        </div>
      </div>
      {/* Mode switcher */}
      <div style={{ flexShrink: 0, display: 'flex', borderTop: '1px solid var(--line-100)', background: 'rgba(252,248,243,0.97)', backdropFilter: 'blur(12px)' }}>
        {ROOT_MODES.map((m) => {
          const on = mode === m.id;
          return (
            <button key={m.id} onClick={() => setMode(m.id)}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                padding: '9px 2px 7px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <Icon name={m.icon} size={20} color={on ? 'var(--son-500)' : 'var(--ink-400)'} sw={on ? 2.2 : 1.7} />
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 9.5, fontWeight: on ? 700 : 500, color: on ? 'var(--son-600)' : 'var(--ink-400)' }}>{m.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
