import { useState } from 'react';
import { Icon } from '../ui/Icon.jsx';
import { VENDOR_CATEGORIES, useVendorCtx } from './VendorCtx.jsx';
import { VFlowOverview, VendorFlowSheet } from './VendorFlowSheet.jsx';

/* ── VDot — ● confirmed indicator (avoids check-circle-2) ──── */
function VDot() {
  return <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--sage-500)', flexShrink: 0, display: 'inline-block' }} />;
}

/* ── Status badge ─────────────────────────────────────────── */
function StatusBadge({ status }) {
  if (status === 'confirmed') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4,
        fontFamily: 'var(--font-ui)', fontSize: 10.5, fontWeight: 700,
        color: 'var(--sage-700,#2d6b3a)', background: 'var(--sage-50,#edf7ee)',
        border: '1px solid var(--sage-200,#b8d9be)', borderRadius: 999, padding: '3px 8px' }}>
        <VDot /> Đã chốt
      </span>
    );
  }
  if (status === 'shortlisted') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4,
        fontFamily: 'var(--font-ui)', fontSize: 10.5, fontWeight: 700,
        color: 'var(--kim-700)', background: 'var(--kim-50)',
        border: '1px solid var(--kim-200)', borderRadius: 999, padding: '3px 8px' }}>
        <Icon name="bookmark" size={11} color="var(--kim-600)" sw={2} /> Đang xem xét
      </span>
    );
  }
  return null;
}

/* ── VVendorRow ─────────────────────────────────────────────── */
function VVendorRow({ catId, vendor, onOpenChat }) {
  const { saved, confirmVendor, unconfirmVendor, unsaveVendor } = useVendorCtx();
  const confirmedId = saved[catId]?.confirmed?.id;
  const isConfirmed = confirmedId === vendor.id;

  const toggleConfirm = () => {
    if (isConfirmed) {
      unconfirmVendor(catId);
    } else {
      confirmVendor(catId, vendor.id);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
      borderBottom: '1px solid var(--line-100)' }}>
      {/* swatch */}
      <div style={{ width: 40, height: 40, borderRadius: 'var(--r-sm)', flexShrink: 0,
        background: vendor.grad }} />
      {/* info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13.5, fontWeight: 600,
          color: 'var(--ink-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {vendor.name}
        </div>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11.5, color: 'var(--ink-400)', marginTop: 1 }}>
          {vendor.priceTotal}tr · {vendor.priceUnit}
        </div>
      </div>
      {/* confirm toggle */}
      <button type="button" onClick={toggleConfirm} style={{ flexShrink: 0,
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 700,
        padding: '5px 10px', borderRadius: 999, cursor: 'pointer',
        background: isConfirmed ? 'var(--sage-500)' : 'var(--card)',
        color: isConfirmed ? '#fff' : 'var(--ink-500)',
        border: `1.5px solid ${isConfirmed ? 'var(--sage-500)' : 'var(--line-200)'}` }}>
        {isConfirmed ? <><VDot /> Chốt</> : 'Chốt'}
      </button>
      {/* unsave */}
      <button type="button" onClick={() => unsaveVendor(catId, vendor.id)} style={{ flexShrink: 0,
        padding: 6, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink-300)' }}>
        <Icon name="x" size={16} color="var(--ink-300)" sw={2} />
      </button>
    </div>
  );
}

/* ── Category card ─────────────────────────────────────────── */
function CatCard({ cat, onOpenChat }) {
  const { saved, getCatStatus, getCatBudget } = useVendorCtx();
  const status = getCatStatus(cat.id);
  const vendors = saved[cat.id]?.shortlisted || [];
  const isConfirmed = status === 'confirmed';

  return (
    <div style={{ background: 'var(--card)',
      border: `1.5px solid ${isConfirmed ? 'var(--sage-300,#a3c9a8)' : 'var(--line-100)'}`,
      borderRadius: 'var(--r-lg)', overflow: 'hidden',
      background: isConfirmed ? 'var(--sage-50,#f0f7f0)' : 'var(--card)',
      marginBottom: 10 }}>
      {/* cat header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
        borderBottom: vendors.length > 0 ? '1px solid var(--line-100)' : 'none' }}>
        <span style={{ width: 34, height: 34, borderRadius: 'var(--r-sm)', flexShrink: 0,
          background: isConfirmed ? 'var(--sage-100,#d0ecd4)' : 'var(--son-50)',
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={cat.icon} size={17} color={isConfirmed ? 'var(--sage-500)' : cat.color} sw={1.8} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13.5, fontWeight: 600, color: 'var(--ink-900)' }}>
            {cat.name}
          </div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11.5, color: 'var(--ink-400)', marginTop: 1 }}>
            Budget ~{getCatBudget(cat.id)}tr
          </div>
        </div>
        <StatusBadge status={status} />
        {/* add / open AI button */}
        <button type="button" onClick={() => onOpenChat(cat.id)}
          style={{ flexShrink: 0, width: 30, height: 30, borderRadius: '50%', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none',
            background: vendors.length === 0 ? 'var(--son-500)' : 'transparent' }}>
          <Icon name={vendors.length === 0 ? 'search' : 'sparkles'} size={16}
            color={vendors.length === 0 ? '#fff' : 'var(--son-500)'} sw={2} />
        </button>
      </div>

      {/* vendor rows */}
      {vendors.map((v) => (
        <VVendorRow key={v.id} catId={cat.id} vendor={v} onOpenChat={onOpenChat} />
      ))}

      {/* empty state */}
      {vendors.length === 0 && (
        <button type="button" onClick={() => onOpenChat(cat.id)}
          style={{ width: '100%', padding: '14px 14px', background: 'transparent', border: 'none',
            cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8,
            borderTop: '1px solid var(--line-100)' }}>
          <Icon name="sparkles" size={15} color="var(--son-400)" sw={1.8} />
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12.5, color: 'var(--son-500)', fontWeight: 600 }}>
            Hỏi Tơ Hồng gợi ý {cat.name.toLowerCase()}
          </span>
        </button>
      )}
    </div>
  );
}

/* ── ScreenVendorShortlist (S05) ─────────────────────────────── */
export function ScreenVendorShortlist({ onMenuOpen, onOpenVendorChat }) {
  const { saved, getCatStatus, getBudgetConfirmed, getCatBudget } = useVendorCtx();
  const [helpOpen, setHelpOpen] = useState(false);
  const totalSaved = VENDOR_CATEGORIES.reduce((s, c) => s + (saved[c.id]?.shortlisted?.length || 0), 0);
  const totalBudget = VENDOR_CATEGORIES.reduce((s, c) => s + getCatBudget(c.id), 0);
  const confirmed = getBudgetConfirmed();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--paper)' }}>
      {/* header */}
      <div style={{ flexShrink: 0, padding: '14px 16px 12px',
        background: 'var(--paper)', borderBottom: '1px solid var(--line-100)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button type="button" onClick={onMenuOpen} style={{ padding: 4, background: 'transparent',
            border: 'none', cursor: 'pointer', color: 'var(--ink-500)' }}>
            <Icon name="menu" size={22} color="var(--ink-600)" sw={1.8} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 600,
              color: 'var(--ink-900)', lineHeight: 1.1 }}>Vendor đã lưu</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 3 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600,
                color: confirmed > 0 ? 'var(--sage-600)' : 'var(--ink-900)', fontVariantNumeric: 'tabular-nums' }}>
                {confirmed}tr
              </span>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--ink-400)' }}>
                / {totalBudget}tr đã chốt
              </span>
            </div>
          </div>
          <button type="button" onClick={() => onOpenVendorChat(null)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px',
              background: 'var(--son-500)', color: '#fff', border: 'none', borderRadius: 'var(--r-pill)',
              cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 12.5, fontWeight: 700 }}>
            <Icon name="sparkles" size={14} color="#fff" sw={2} /> AI
          </button>
        </div>
      </div>

      {/* scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 24px' }}>
        <div style={{ marginBottom: 12 }}>
          <VFlowOverview onOpen={() => setHelpOpen(true)} />
        </div>
        {VENDOR_CATEGORIES.map((cat) => (
          <CatCard key={cat.id} cat={cat} onOpenChat={onOpenVendorChat} />
        ))}
      </div>

      <VendorFlowSheet open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
