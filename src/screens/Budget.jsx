import { useState, useEffect, useRef } from 'react';
import { Icon } from '../ui/Icon.jsx';
import { AIButton } from '../ui/AIButton.jsx';
import { EditName, AllocSlider } from '../ui/atoms.jsx';
import { BaselineSlider } from '../components/BaselineSlider.jsx';
import { useBudget, getCategoryBaseline } from '../budget/useBudget.js';
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

/* ── VendorDetailSheet ───────────────────────────────────────── */
function VendorDetailSheet({ vendor, catAllocated, open, onClose, onConfirm, onUnconfirm, onRemove, onNoteChange }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [note, setNote] = useState(vendor?.note || '');
  const startYRef = useRef(null);

  useEffect(() => {
    if (vendor) setNote(vendor.note || '');
  }, [vendor?.id]);

  useEffect(() => {
    if (!open) setConfirmDelete(false);
  }, [open]);

  const handleTouchStart = (e) => { startYRef.current = e.touches[0].clientY; };
  const handleTouchEnd = (e) => {
    if (startYRef.current == null) return;
    const delta = e.changedTouches[0].clientY - startYRef.current;
    if (delta > 60) onClose();
    startYRef.current = null;
  };

  if (!vendor) return null;

  const price = vendor.priceTotal ?? vendor.price ?? 0;
  const diff = catAllocated > 0 && price > 0 ? price - catAllocated : null;
  const isConfirmed = vendor.status === 'confirmed';

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 499,
          background: 'rgba(43,36,32,0.38)',
          opacity: open ? 1 : 0,
          transition: 'opacity .22s',
          pointerEvents: open ? 'auto' : 'none',
        }}
      />
      {/* Sheet */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 500,
          background: 'var(--paper)',
          borderRadius: '22px 22px 0 0',
          maxHeight: '85vh',
          overflowY: 'auto',
          transform: open ? 'translateY(0)' : 'translateY(105%)',
          transition: 'transform .3s cubic-bezier(.2,.7,.3,1)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* Grabber */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--line-300)' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px 12px' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 'var(--r-sm)', flexShrink: 0,
            background: vendor.grad || (isConfirmed ? 'linear-gradient(135deg,var(--sage-100),var(--sage-200))' : 'var(--sand)'),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="store" size={22} color={isConfirmed ? 'var(--sage-600)' : 'var(--ink-400)'} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--ink-900)' }}>{vendor.name}</div>
            {vendor.spec && <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>{vendor.spec}</div>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', flexShrink: 0 }}>
            <Icon name="x" size={20} color="var(--ink-500)" />
          </button>
        </div>

        <div style={{ padding: '0 16px 16px' }}>
          {/* Price + status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--ink-900)', fontVariantNumeric: 'tabular-nums' }}>
              {price > 0 ? `${price}tr` : 'Chưa có giá'}
            </span>
            {isConfirmed && (
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 600, color: 'var(--sage-600)', background: 'var(--sage-100)', borderRadius: 999, padding: '3px 10px' }}>Đã chốt</span>
            )}
          </div>

          {/* Rating */}
          {vendor.rating != null && (
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--ink-600)', marginBottom: 8 }}>
              ★ {vendor.rating.toFixed(1)}{vendor.rv ? ` (${vendor.rv} lượt review)` : ''}
            </div>
          )}

          <div style={{ height: 1, background: 'var(--line-100)', margin: '12px 0' }} />

          {/* Note */}
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => onNoteChange(note)}
            placeholder="Thêm ghi chú…"
            rows={3}
            style={{
              width: '100%', boxSizing: 'border-box',
              fontFamily: 'var(--font-body)', fontSize: 13.5, color: 'var(--ink-800)',
              background: 'var(--sand)', border: '1px solid var(--line-100)',
              borderRadius: 'var(--r-sm)', padding: '10px 12px', resize: 'none', outline: 'none',
            }}
          />

          {/* Compare */}
          {diff !== null && (
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--ink-500)', marginTop: 8 }}>
              Dự toán: {catAllocated}tr ·{' '}
              <span style={{ color: diff > 0 ? 'var(--danger-500)' : 'var(--sage-600)', fontWeight: 600 }}>
                {diff > 0 ? `+${diff}tr` : `${diff}tr`}
              </span>
            </div>
          )}

          <div style={{ height: 1, background: 'var(--line-100)', margin: '14px 0' }} />

          {/* Confirm delete sub-state */}
          {confirmDelete ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--ink-700)', marginBottom: 14 }}>
                Bỏ <strong>{vendor.name}</strong> khỏi danh sách?
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button onClick={() => setConfirmDelete(false)} style={{ fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600, padding: '9px 20px', borderRadius: 999, background: 'var(--sand)', border: '1px solid var(--line-200)', cursor: 'pointer', color: 'var(--ink-700)' }}>Huỷ</button>
                <button onClick={() => { onRemove(); }} style={{ fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600, padding: '9px 20px', borderRadius: 999, background: 'var(--danger-500)', border: 'none', cursor: 'pointer', color: '#fff' }}>Xác nhận xóa</button>
              </div>
            </div>
          ) : (
            <>
              {/* Primary action */}
              <button
                onClick={isConfirmed ? onUnconfirm : onConfirm}
                style={{
                  width: '100%', padding: '13px 0', borderRadius: 999, cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 700,
                  background: isConfirmed ? 'var(--line-200)' : 'var(--sage-500)',
                  color: isConfirmed ? 'var(--ink-700)' : '#fff',
                  border: 'none', marginBottom: 10,
                }}>
                {isConfirmed ? 'Huỷ chốt' : 'Chốt vendor'}
              </button>
              {/* Remove */}
              <button
                onClick={() => setConfirmDelete(true)}
                style={{ display: 'block', width: '100%', textAlign: 'center', fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--danger-500)', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0' }}>
                Bỏ khỏi danh sách
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

/* ── BudgetCatDetail ─────────────────────────────────────────── */
function BudgetCatDetail({ cat, bud, vendorCtx, onBack, onOpenVendorChat, onOpenAI }) {
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const isVendorCat = VENDOR_CATEGORIES.some(vc => vc.id === cat.id);
  const catVendors = vendorCtx?.saved?.[cat.id] || { shortlisted: [], confirmed: null };
  const confirmedVendorId = catVendors.confirmed?.id;
  const allocated = cat.allocated_tr || 0;
  const { basePct, base } = getCategoryBaseline(cat.id, bud.totalTarget || 0);
  const pct = bud.totalTarget > 0 ? Math.round(allocated / bud.totalTarget * 100) : 0;
  const diff = allocated - base;
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
        {/* Row 1: 2-column header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="ds-label" style={{ color: 'var(--kim-600)', marginBottom: 4 }}>Dự toán</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 600, color: 'var(--ink-900)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
              {allocated}<span style={{ fontSize: 17 }}>tr</span>
            </div>
          </div>
          <div style={{ flexShrink: 0, textAlign: 'right' }}>
            <div className="ds-label" style={{ color: 'var(--ink-400)', marginBottom: 4 }}>Ngân sách cưới</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 600, color: 'var(--ink-500)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
              {bud.totalTarget || '—'}{bud.totalTarget > 0 && <span style={{ fontSize: 17 }}>tr</span>}
            </div>
          </div>
        </div>

        {/* Row 2: BaselineSlider + Reset */}
        <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 48, gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <BaselineSlider
              value={allocated}
              max={bud.totalTarget || 300}
              base={base}
              step={base > 0 && base < 50 ? 1 : 5}
              onChange={(v) => bud.setAmt(cat.id, v)}
            />
          </div>
          <button
            onClick={() => { bud.setAmt(cat.id, base); track('budget_category_reset', { category_id: cat.id, from: allocated, to: base }); }}
            disabled={diff === 0}
            style={{
              display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
              fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 600, color: 'var(--son-600)',
              background: 'none', border: 'none', cursor: diff === 0 ? 'default' : 'pointer',
              padding: '4px 0', opacity: diff === 0 ? 0.35 : 1,
            }}
          >
            <Icon name="rotate-ccw" size={12} color="var(--son-600)" />
            Reset
          </button>
        </div>
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
                  <div key={vendor.id} style={{ background: 'var(--card)', border: '1px solid var(--line-100)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center' }}>
                    {/* DETAIL_ZONE */}
                    <button
                      onClick={() => setSelectedVendorId(vendor.id)}
                      style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
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
                    </button>
                    {/* ACTION_ZONE */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 8px 0 0', flexShrink: 0 }}>
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

      {/* Vendor Detail Sheet */}
      {isVendorCat && (() => {
        const selectedVendor = selectedVendorId
          ? catVendors.shortlisted.find((v) => v.id === selectedVendorId)
          : null;
        const isConfirmedVendor = catVendors.confirmed?.id === selectedVendorId;
        const vendorForSheet = selectedVendor
          ? { ...selectedVendor, status: isConfirmedVendor ? 'confirmed' : 'shortlisted' }
          : null;
        return (
          <VendorDetailSheet
            vendor={vendorForSheet}
            catAllocated={allocated}
            open={!!selectedVendorId}
            onClose={() => setSelectedVendorId(null)}
            onConfirm={() => { vendorCtx.confirmVendor(cat.id, selectedVendorId); setSelectedVendorId(null); }}
            onUnconfirm={() => { vendorCtx.unconfirmVendor(cat.id); setSelectedVendorId(null); }}
            onRemove={() => { vendorCtx.unsaveVendor(cat.id, selectedVendorId); setSelectedVendorId(null); }}
            onNoteChange={(note) => vendorCtx.updateVendorNote(cat.id, selectedVendorId, note)}
          />
        );
      })()}
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
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12.5, fontWeight: 500, color: 'var(--ink-400)' }}>
              {bud.guests > 0 ? `${bud.guests} khách` : 'Chưa có số khách'}
            </span>
            <AIButton onOpen={onOpenAI} />
          </div>
        </div>
        {/* Row 2 — compact summary */}
        {compact && (
          <div style={{ padding: '0 16px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--ink-900)', fontVariantNumeric: 'lining-nums tabular-nums' }}>{total}/{target}<span style={{ fontSize: 12, fontWeight: 500 }}>tr</span></span>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 600, color: over > 0 ? 'var(--danger-500)' : 'var(--sage-600)' }}>{statusText}</span>
              {confirmedTotal > 0 && <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 500, color: 'var(--ink-400)', fontVariantNumeric: 'lining-nums tabular-nums' }}>Đã chốt {confirmedTotal}tr</span>}
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
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, color: 'var(--ink-900)', lineHeight: 1.05, marginTop: 3, fontVariantNumeric: 'lining-nums tabular-nums' }}>
                {total}<span style={{ fontSize: 16, fontWeight: 500 }}>tr</span>
                <span style={{ fontSize: 15, color: 'var(--ink-400)', fontWeight: 500 }}> / {target}<span style={{ fontSize: 12 }}>tr</span></span>
              </div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 600, marginTop: 4,
                color: over > 0 ? 'var(--danger-500)' : over < 0 ? 'var(--info-500)' : 'var(--sage-500)' }}>
                {statusText}
              </div>
            </div>
            {confirmedTotal > 0 && (
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 500, color: 'var(--ink-400)' }}>Đã chốt vendor</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--sage-600)', fontVariantNumeric: 'lining-nums tabular-nums' }}>{confirmedTotal}<span style={{ fontSize: 12, fontWeight: 500 }}>tr</span></div>
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
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12.5, fontWeight: 500, color: 'var(--ink-500)' }}>Tiền mừng dự kiến</span>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13.5, fontWeight: 600, color: 'var(--sage-500)', fontVariantNumeric: 'lining-nums tabular-nums' }}>+{bud.mung}tr → thực ~{Math.max(0, total - bud.mung)}tr</span>
            </div>
          )}
        </div>

        {/* Category list */}
        <div className="ds-label" style={{ margin: '0 2px 10px' }}>Hạng mục</div>
        {bud.cats.length === 0 ? (
          <div style={{ padding: '22px 16px', textAlign: 'center', border: '1px dashed var(--line-200)', borderRadius: 'var(--r-md)',
            fontFamily: 'var(--font-body)', fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink-500)' }}>
            Chưa có hạng mục ngân sách. Thêm khoản đầu tiên để bắt đầu phân bổ.
          </div>
        ) : (
          <div style={{ background: 'var(--card)', border: '1px solid var(--line-100)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-sm)', padding: '4px 16px' }}>
            {bud.cats.map((cat, i) => {
              const isLast = i === bud.cats.length - 1;
              const allocated = cat.allocated_tr || 0;
              const isVendorCat = VENDOR_CATEGORIES.some(vc => vc.id === cat.id);
              const catSaved = isVendorCat ? vendorCtx?.getSaved?.(cat.id) : null;
              const confirmedVendor = catSaved?.confirmed || null;
              const shortlistCount = catSaved?.shortlisted?.length || 0;
              const vendorConfirmed = !!confirmedVendor;
              const vendorPrice = confirmedVendor ? (confirmedVendor.priceTotal ?? confirmedVendor.price ?? 0) : 0;
              const over = vendorConfirmed && vendorPrice > allocated;

              let subText;
              let subColor = 'var(--ink-400)';
              if (vendorConfirmed) { subText = confirmedVendor.name; subColor = 'var(--sage-600)'; }
              else if (isVendorCat && shortlistCount > 0) { subText = `Đang xem ${shortlistCount} vendor`; subColor = 'var(--kim-700)'; }
              else if (isVendorCat) subText = 'Chưa chốt vendor';
              else {
                const cnt = (cat.items || []).length;
                subText = cnt > 0 ? `${cnt} mục con` : 'Chưa có mục con';
              }

              return (
                <button key={cat.id}
                  onClick={() => { onOpenCat(cat.id); track('budget_category_opened', { journey: 'budget', category_id: cat.id }); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 0',
                    background: 'transparent', border: 'none', borderBottom: isLast ? 'none' : '1px solid var(--line-100)',
                    cursor: 'pointer', textAlign: 'left', font: 'inherit',
                  }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0, boxSizing: 'border-box',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: vendorConfirmed ? 'var(--sage-600)' : 'transparent',
                    border: `1px solid ${vendorConfirmed ? 'var(--sage-600)' : 'var(--line-200)'}`,
                  }}>
                    <Icon name={cat.icon || 'circle'} size={15} sw={1.6} color={vendorConfirmed ? '#fff' : 'var(--ink-500)'} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 400, color: 'var(--ink-900)', minWidth: 0, textWrap: 'pretty' }}>{cat.name}</span>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 600, color: 'var(--ink-900)', fontVariantNumeric: 'lining-nums tabular-nums', flexShrink: 0, whiteSpace: 'nowrap' }}>
                        {allocated}<span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-500)' }}>tr</span>
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginTop: 2 }}>
                      <span style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 12.5, fontWeight: 400, lineHeight: 1.35, textWrap: 'pretty', color: subColor, minWidth: 0 }}>
                        {subText}
                      </span>
                      {vendorConfirmed && vendorPrice > 0 && (
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 500, color: over ? 'var(--danger-500)' : 'var(--sage-600)', fontVariantNumeric: 'lining-nums tabular-nums', flexShrink: 0, whiteSpace: 'nowrap' }}>
                          {vendorPrice}<span style={{ fontSize: 11 }}>tr</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ alignSelf: 'center', display: 'flex', flexShrink: 0 }}>
                    <Icon name="chevron-right" size={16} color="var(--ink-300)" />
                  </div>
                </button>
              );
            })}
          </div>
        )}

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
