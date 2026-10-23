import { useState } from 'react';
import { Icon } from '../ui/Icon.jsx';
import { VENDOR_CATEGORIES, useVendorCtx } from './VendorCtx.jsx';
import { VFlowOverview, VendorFlowSheet } from './VendorFlowSheet.jsx';
import { ListRow, SectionHeader, Amount } from '../ui/ListRow.jsx';

/* ── VVendorRow ─────────────────────────────────────────────── */
function VVendorRow({ catId, vendor }) {
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
    <div style={{ paddingLeft: 44 }}>
      <ListRow
        leading={<div style={{ width: 32, height: 32, borderRadius: 'var(--r-sm)', flexShrink: 0, alignSelf: 'center', background: vendor.grad }} />}
        title={vendor.name}
        sub={`${vendor.priceTotal}tr · ${vendor.priceUnit}`}
        subColor={isConfirmed ? 'var(--sage-600)' : 'var(--ink-400)'}
        right={<>
          <button type="button" onClick={toggleConfirm} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 700,
            padding: '5px 10px', borderRadius: 999, cursor: 'pointer',
            background: isConfirmed ? 'var(--sage-600)' : 'transparent',
            color: isConfirmed ? '#fff' : 'var(--ink-500)',
            border: `1px solid ${isConfirmed ? 'var(--sage-600)' : 'var(--line-200)'}` }}>
            {isConfirmed ? <><Icon name="check" size={12} color="#fff" sw={2.5} /> Đã chốt</> : 'Chốt'}
          </button>
          <button type="button" aria-label="Bỏ lưu" onClick={() => unsaveVendor(catId, vendor.id)} style={{
            padding: 6, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex' }}>
            <Icon name="x" size={16} color="var(--ink-300)" sw={2} />
          </button>
        </>}
      />
    </div>
  );
}

/* ── Category card ─────────────────────────────────────────── */
function CatCard({ cat, onOpenChat }) {
  const { saved, getCatStatus, getCatBudget } = useVendorCtx();
  const status = getCatStatus(cat.id);
  const vendors = saved[cat.id]?.shortlisted || [];
  const confirmedVendor = saved[cat.id]?.confirmed || null;

  let sub = 'Chưa chốt vendor';
  let subColor = 'var(--ink-400)';
  if (status === 'confirmed' && confirmedVendor) { sub = confirmedVendor.name; subColor = 'var(--sage-600)'; }
  else if (vendors.length > 0) { sub = `Đang xem ${vendors.length} vendor`; subColor = 'var(--kim-700)'; }

  return (
    <div>
      <ListRow
        icon={cat.icon} done={status === 'confirmed'}
        title={cat.name}
        value={<Amount value={getCatBudget(cat.id)} unit="tr" />}
        sub={sub} subColor={subColor}
        right={
          <button type="button" aria-label={`Hỏi Tơ Hồng về ${cat.name}`} onClick={() => onOpenChat(cat.id)}
            style={{ width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', marginLeft: 2,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid var(--line-200)', background: 'transparent' }}>
            <Icon name={vendors.length === 0 ? 'search' : 'sparkles'} size={15} color="var(--son-500)" sw={2} />
          </button>
        }
      />

      {vendors.map((v) => (
        <VVendorRow key={v.id} catId={cat.id} vendor={v} />
      ))}

      {vendors.length === 0 && (
        <button type="button" onClick={() => onOpenChat(cat.id)}
          style={{ width: '100%', padding: '12px 0 12px 44px', background: 'transparent', border: 'none',
            borderBottom: '1px solid var(--line-100)', cursor: 'pointer', textAlign: 'left',
            display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="sparkles" size={15} color="var(--son-500)" sw={1.8} />
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--son-600)', fontWeight: 600 }}>
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
      <div style={{ flexShrink: 0, padding: 'var(--header-pt) 16px 12px',
        background: 'rgba(252,248,243,0.96)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--line-100)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button type="button" onClick={onMenuOpen} aria-label="Mở menu" style={{ padding: 4, background: 'transparent',
            border: 'none', cursor: 'pointer', color: 'var(--ink-500)' }}>
            <Icon name="menu" size={22} color="var(--ink-600)" sw={1.8} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600,
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
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 24px' }}>
        <VFlowOverview onOpen={() => setHelpOpen(true)} />
        <SectionHeader label="Hạng mục" />
        {VENDOR_CATEGORIES.map((cat) => (
          <CatCard key={cat.id} cat={cat} onOpenChat={onOpenVendorChat} />
        ))}
      </div>

      <VendorFlowSheet open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
