import { useState, useEffect, useRef } from 'react';
import { Icon } from '../ui/Icon.jsx';
import { AIButton } from '../ui/AIButton.jsx';
import { EditName, AllocSlider } from '../ui/atoms.jsx';
import { useBudget } from '../budget/useBudget.js';
import { useVendorCtx, VENDOR_CATEGORIES } from './VendorCtx.jsx';
import { track } from '../analytics.js';

/* ── ItemRow (unchanged from original) ─────────────────────── */
function ItemRow({ it, onAmt, onName, onRemove }) {
  const [amtStr, setAmtStr] = useState(String(it.amt || 0));
  const amtRef = useRef(null);
  useEffect(() => { setAmtStr(String(it.amt || 0)); }, [it.amt]);

  const commitAmt = () => {
    const n = parseInt(amtStr, 10);
    onAmt(isNaN(n) || n < 0 ? 0 : n);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 0' }}>
      <span style={{ width: 18, height: 18, borderRadius: 'var(--r-xs)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: it.vendor ? 'var(--son-50)' : 'var(--sand)', border: '1px solid var(--line-200)' }}>
        <Icon name={it.vendor ? 'store' : 'circle-small'} size={it.vendor ? 10 : 13} color={it.vendor ? 'var(--son-500)' : 'var(--ink-400)'} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <EditName
          value={it.name}
          onChange={onName}
          onCommit={() => amtRef.current?.focus()}
          size={13}
          weight={500}
          focusNew={it.isNew}
        />
        {it.vendor && it.status !== 'confirmed' && (
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 9.5, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--kim-600)', marginLeft: 7 }}>đang xem</span>
        )}
      </div>
      <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 1, flexShrink: 0 }}>
        <input
          ref={amtRef}
          value={amtStr}
          inputMode="numeric"
          autoComplete="off"
          onChange={(e) => setAmtStr(e.target.value.replace(/\D/g, ''))}
          onBlur={commitAmt}
          onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
          style={{
            width: `${Math.max(2, amtStr.length) + 0.5}ch`,
            fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 12,
            color: 'var(--ink-700)', textAlign: 'right',
            border: 'none', borderBottom: '1px dashed var(--line-200)', outline: 'none',
            background: 'transparent', padding: '1px 2px',
            fontVariantNumeric: 'tabular-nums',
          }}
        />
        <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 13, color: 'var(--ink-500)' }}>tr</span>
      </span>
      <button onClick={onRemove} title="Bỏ" style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, cursor: 'pointer',
        background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.55 }}>
        <Icon name="x" size={13} color="var(--ink-400)" />
      </button>
    </div>
  );
}

/* ── BudgetCatDetail ─────────────────────────────────────────── */
function BudgetCatDetail({ cat, bud, vendorCtx, onBack, onOpenVendorChat, onOpenAI }) {
  const isVendorCat = VENDOR_CATEGORIES.some(vc => vc.id === cat.id);
  const catVendors = vendorCtx?.saved?.[cat.id] || { shortlisted: [], confirmed: null };
  const confirmedVendorId = catVendors.confirmed?.id;
  const allocated = cat.allocated_tr || 0;
  const confirmedVendorAmt = catVendors.confirmed
    ? (catVendors.confirmed.priceTotal ?? catVendors.confirmed.price ?? 0)
    : 0;
  const vendorStatus = isVendorCat ? vendorCtx?.getCatStatus?.(cat.id) : null;
  const items = cat.items || [];

  return (
    <div style={{ padding: '0 16px 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 0 12px' }}>
        <button onClick={onBack} aria-label="Quay lại" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
          <Icon name="chevron-left" size={24} color="var(--ink-700)" />
        </button>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--ink-900)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.name}</span>
        {isVendorCat && vendorStatus && vendorStatus !== 'none' && (
          <span style={{
            fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 600, flexShrink: 0,
            color: vendorStatus === 'confirmed' ? 'var(--sage-600)' : 'var(--kim-700)',
            background: vendorStatus === 'confirmed' ? 'var(--sage-100)' : 'var(--kim-50)',
            borderRadius: 999, padding: '3px 10px',
          }}>
            {vendorStatus === 'confirmed' ? 'Đã chốt' : 'Đang xem'}
          </span>
        )}
      </div>

      {/* Dự toán card */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--line-100)', borderRadius: 'var(--r-lg)', padding: '16px 18px', marginBottom: 14 }}>
        <div className="ds-label" style={{ marginBottom: 8 }}>Dự toán</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 600, color: 'var(--ink-900)', marginBottom: 12, fontVariantNumeric: 'tabular-nums' }}>
          {allocated}<span style={{ fontSize: 18 }}>tr</span>
        </div>
        <AllocSlider value={allocated} max={bud.totalTarget || 300} color="var(--son-500)" onChange={(v) => bud.setAmt(cat.id, v)} />
        {confirmedVendorAmt > 0 && (
          <div style={{ marginTop: 10, fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--ink-500)' }}>
            Vendor đã chốt:{' '}
            <span style={{ fontWeight: 700, color: allocated >= confirmedVendorAmt ? 'var(--sage-600)' : 'var(--danger-500)' }}>{confirmedVendorAmt}tr</span>
            {allocated < confirmedVendorAmt && (
              <span style={{ color: 'var(--danger-500)' }}> (thiếu {confirmedVendorAmt - allocated}tr)</span>
            )}
          </div>
        )}
      </div>

      {/* Vendor section */}
      {isVendorCat && (
        <div style={{ marginBottom: 14 }}>
          <div className="ds-label" style={{ margin: '0 2px 10px' }}>Vendor đã lưu · {catVendors.shortlisted.length}</div>
          {catVendors.shortlisted.length === 0 ? (
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--ink-400)', padding: '10px 0' }}>
              Chưa lưu vendor nào cho hạng mục này.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {catVendors.shortlisted.map((vendor) => {
                const isConfirmed = confirmedVendorId === vendor.id;
                const price = vendor.priceTotal ?? vendor.price ?? 0;
                const diff = price - allocated;
                return (
                  <div key={vendor.id} style={{ background: 'var(--card)', border: '1px solid var(--line-100)', borderRadius: 'var(--r-md)', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 'var(--r-sm)', flexShrink: 0,
                      background: isConfirmed ? 'linear-gradient(135deg,var(--sage-100),var(--sage-200))' : 'var(--sand)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name={cat.icon || 'store'} size={18} color={isConfirmed ? 'var(--sage-600)' : 'var(--ink-400)'} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 600, color: 'var(--ink-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{vendor.name}</div>
                      <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--ink-500)' }}>
                        {price > 0 ? `${price}tr` : 'Chưa có giá'}{vendor.spec ? ` · ${vendor.spec}` : ''}
                      </div>
                      {price > 0 && allocated > 0 && (
                        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: diff > 0 ? 'var(--danger-500)' : 'var(--sage-600)' }}>
                          {diff > 0 ? `Vượt ${diff}tr so với dự toán` : diff < 0 ? `Còn dư ${-diff}tr` : 'Khớp dự toán'}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => isConfirmed ? vendorCtx.unconfirmVendor(cat.id) : vendorCtx.confirmVendor(cat.id, vendor.id)}
                      style={{
                        fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 600,
                        padding: '5px 12px', borderRadius: 999, cursor: 'pointer', flexShrink: 0,
                        background: isConfirmed ? 'var(--sage-500)' : 'transparent',
                        color: isConfirmed ? '#fff' : 'var(--sage-600)',
                        border: isConfirmed ? 'none' : '1.5px solid var(--sage-200)',
                      }}>
                      Chốt
                    </button>
                    <button onClick={() => vendorCtx.unsaveVendor(cat.id, vendor.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
                      <Icon name="x" size={14} color="var(--ink-400)" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          <button
            onClick={() => onOpenVendorChat(cat.id)}
            style={{ width: '100%', marginTop: 12, padding: '12px 0', background: 'var(--son-50)', border: '1px solid var(--son-100)', borderRadius: 'var(--r-md)', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 13.5, fontWeight: 600, color: 'var(--son-600)' }}>
            Hỏi Tơ Hồng gợi ý {cat.name.toLowerCase()}
          </button>
        </div>
      )}

      {/* Mục con */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--line-100)', borderRadius: 'var(--r-md)', padding: '12px 13px', marginBottom: 14 }}>
        <div className="ds-label" style={{ marginBottom: 8 }}>Mục con</div>
        {items.length === 0 ? (
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--ink-400)', padding: '6px 0' }}>Chưa có hạng mục con nào.</div>
        ) : (
          items.map((it, i) => (
            <div key={it.id} style={{ borderBottom: i === items.length - 1 ? 'none' : '1px solid var(--line-100)' }}>
              <ItemRow
                it={it}
                onAmt={(v) => bud.setItemAmt(cat.id, it.id, v)}
                onName={(n) => bud.renameItem(cat.id, it.id, n)}
                onRemove={() => bud.removeItem(cat.id, it.id)}
              />
            </div>
          ))
        )}
        <div style={{ paddingTop: 9, borderTop: '1px dashed var(--line-200)', marginTop: 8 }}>
          <button onClick={() => bud.addItem(cat.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 600, color: 'var(--son-600)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
            <Icon name="plus" size={13} color="var(--son-600)" /> Thêm mục con
          </button>
        </div>
      </div>

      {/* Delete */}
      {!isVendorCat && (
        <div style={{ textAlign: 'center', paddingTop: 8 }}>
          <button onClick={() => { bud.remove(cat.id); onBack(); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--ink-400)', background: 'none', border: 'none', cursor: 'pointer' }}>
            <Icon name="trash-2" size={14} color="var(--ink-400)" /> Xoá hạng mục
          </button>
        </div>
      )}
    </div>
  );
}

/* ── ScreenBudget ────────────────────────────────────────────── */
export function ScreenBudget({
  coupleId = null,
  onMenuOpen = () => {},
  onOpenAI = () => {},
  openCatId = null,
  onOpenCat = () => {},
  onOpenVendorChat = () => {},
  refreshKey = 0,
}) {
  const bud = useBudget(coupleId, [], refreshKey);
  const vendorCtx = useVendorCtx();
  const confirmedTotal = vendorCtx?.getBudgetConfirmed?.() ?? 0;
  const [compact, setCompact] = useState(false);
  const totalCardRef = useRef(null);

  useEffect(() => {
    track('budget_viewed', { journey: 'budget' });
  }, []);

  // Auto-back if cat was deleted
  useEffect(() => {
    if (openCatId && !bud.cats.find(c => c.id === openCatId)) onOpenCat(null);
  }, [bud.cats, openCatId]);

  // IntersectionObserver for compact header
  useEffect(() => {
    const el = totalCardRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setCompact(!entry.isIntersecting),
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const total = bud.total;
  const target = bud.totalTarget;
  const over = total - target;
  const allocPct = target > 0 ? Math.min(100, Math.round((total / target) * 100)) : 0;
  const confirmPct = target > 0 ? Math.min(100, Math.round((confirmedTotal / target) * 100)) : 0;
  const statusText = target <= 0 ? 'Chưa đặt mục tiêu' : over === 0 ? 'Cân đối' : over > 0 ? `Vượt ${over}tr` : `Còn ${-over}tr`;

  const openCat = openCatId ? bud.cats.find(c => c.id === openCatId) : null;

  if (openCat) {
    return (
      <div style={{ height: '100%', background: 'var(--paper)', overflowY: 'auto' }}>
        <BudgetCatDetail
          cat={openCat}
          bud={bud}
          vendorCtx={vendorCtx}
          onBack={() => onOpenCat(null)}
          onOpenVendorChat={onOpenVendorChat}
          onOpenAI={onOpenAI}
        />
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--paper)' }}>
      {/* Sticky header */}
      <div style={{ flexShrink: 0, background: 'rgba(252,248,243,0.96)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: compact ? '1px solid var(--line-100)' : '1px solid transparent', transition: 'border-color .2s' }}>
        {/* Row 1 — always visible */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--header-pt) 16px 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <button onClick={onMenuOpen} aria-label="Mở menu" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
              <Icon name="chevron-left" size={24} color="var(--ink-700)" />
            </button>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, color: 'var(--ink-900)' }}>Ngân sách</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12.5, color: 'var(--ink-400)' }}>
              {bud.guests > 0 ? `${bud.guests} khách` : 'Chưa có số khách'}
            </span>
            <AIButton onOpen={onOpenAI} />
          </div>
        </div>
        {/* Row 2 — compact summary */}
        {compact && (
          <div style={{ padding: '0 16px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--ink-900)', fontVariantNumeric: 'tabular-nums' }}>{total}/{target}tr</span>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 600, color: over > 0 ? 'var(--danger-500)' : 'var(--sage-600)' }}>{statusText}</span>
              {confirmedTotal > 0 && <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--ink-400)' }}>Đã chốt {confirmedTotal}tr</span>}
            </div>
            <div style={{ position: 'relative', height: 4, borderRadius: 999, background: 'var(--line-100)', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: allocPct + '%', background: 'var(--ink-200)', borderRadius: 999 }} />
              <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: confirmPct + '%', background: 'var(--sage-500)', borderRadius: 999 }} />
            </div>
          </div>
        )}
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 24px' }}>
        {/* Total card — observed for compact trigger */}
        <div ref={totalCardRef} style={{ background: 'var(--card)', border: '1px solid var(--line-100)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-xs)', padding: '16px 18px', marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 14, marginBottom: 12 }}>
            <div>
              <div className="ds-label">Đã phân bổ</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, color: 'var(--ink-900)', lineHeight: 1.05, marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>
                {total}<span style={{ fontSize: 16 }}>tr</span>
                <span style={{ fontSize: 15, color: 'var(--ink-400)', fontWeight: 400 }}> / {target}tr</span>
              </div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 600, marginTop: 4,
                color: over > 0 ? 'var(--danger-500)' : over < 0 ? 'var(--info-500)' : 'var(--sage-500)' }}>
                {statusText}
              </div>
            </div>
            {confirmedTotal > 0 && (
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--ink-400)' }}>Đã chốt vendor</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--sage-600)', fontVariantNumeric: 'tabular-nums' }}>{confirmedTotal}tr</div>
              </div>
            )}
          </div>
          {/* Dual-layer 8px bar */}
          <div style={{ position: 'relative', height: 8, borderRadius: 999, background: 'var(--line-100)', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: allocPct + '%', background: 'var(--ink-200)', borderRadius: 999, transition: 'width .18s' }} />
            <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: confirmPct + '%', background: 'var(--sage-500)', borderRadius: 999, transition: 'width .18s' }} />
          </div>
          {bud.mung > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--line-100)' }}>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12.5, color: 'var(--ink-500)' }}>Tiền mừng dự kiến</span>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13.5, fontWeight: 600, color: 'var(--sage-500)' }}>+{bud.mung}tr → thực ~{Math.max(0, total - bud.mung)}tr</span>
            </div>
          )}
        </div>

        {/* Category list */}
        <div className="ds-label" style={{ margin: '0 2px 10px' }}>Hạng mục</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {bud.cats.length === 0 && (
            <div style={{ padding: '22px 16px', textAlign: 'center', border: '1px dashed var(--line-200)', borderRadius: 'var(--r-md)',
              fontFamily: 'var(--font-body)', fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink-500)' }}>
              Chưa có hạng mục ngân sách. Thêm khoản đầu tiên để bắt đầu phân bổ.
            </div>
          )}
          {bud.cats.map((cat) => {
            const isVendorCat = VENDOR_CATEGORIES.some(vc => vc.id === cat.id);
            const vendorStatus = isVendorCat ? (vendorCtx?.getCatStatus?.(cat.id) ?? 'none') : 'none';
            const isOver = cat.state === 'vuot_muc';

            let iconBg = 'var(--sand)';
            let iconColor = 'var(--ink-500)';
            if (vendorStatus === 'confirmed') { iconBg = 'var(--sage-100)'; iconColor = 'var(--sage-600)'; }
            else if (vendorStatus === 'shortlisted') { iconBg = 'var(--kim-50)'; iconColor = 'var(--kim-700)'; }

            let statusLine = '';
            if (isVendorCat) {
              if (vendorStatus === 'confirmed') statusLine = 'Đã chốt vendor';
              else if (vendorStatus === 'shortlisted') statusLine = 'Đang xem vendor';
              else statusLine = 'Chưa có vendor';
            } else {
              const cnt = (cat.items || []).length;
              statusLine = cnt > 0 ? `${cnt} mục con` : 'Chưa có mục con';
            }

            return (
              <button key={cat.id}
                onClick={() => { onOpenCat(cat.id); track('budget_category_opened', { journey: 'budget', category_id: cat.id }); }}
                style={{ background: 'var(--card)', border: `1px solid ${isOver ? '#fca5a5' : 'var(--line-100)'}`, borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-xs)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left', font: 'inherit', width: '100%' }}>
                <div style={{ width: 34, height: 34, borderRadius: 'var(--r-sm)', flexShrink: 0, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={cat.icon || 'circle'} size={16} color={iconColor} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: 'var(--ink-900)' }}>{cat.name}</div>
                  <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11.5, color: vendorStatus === 'confirmed' ? 'var(--sage-600)' : vendorStatus === 'shortlisted' ? 'var(--kim-700)' : 'var(--ink-400)', marginTop: 2 }}>{statusLine}</div>
                </div>
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 600, color: 'var(--ink-700)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{cat.allocated_tr || 0}tr</span>
                <Icon name="chevron-right" size={16} color="var(--ink-300)" />
              </button>
            );
          })}
        </div>

        <button onClick={() => { bud.add(); track('budget_category_added', { journey: 'budget' }); }}
          style={{ width: '100%', marginTop: 12, fontFamily: 'var(--font-ui)', fontSize: 13.5, fontWeight: 600, color: 'var(--son-600)',
            background: 'transparent', border: '1.5px dashed var(--son-200)', borderRadius: 'var(--r-md)', padding: '12px 0', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
          <Icon name="plus" size={16} color="var(--son-600)" /> Thêm hạng mục
        </button>
      </div>
    </div>
  );
}

export default ScreenBudget;
