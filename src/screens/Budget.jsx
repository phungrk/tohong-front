import { useState, useEffect } from 'react';
import { Icon } from '../ui/Icon.jsx';
import { EditName, EditAmount, AllocSlider } from '../ui/atoms.jsx';
import { useBudget } from '../budget/useBudget.js';
import { track } from '../analytics.js';

const CAT_STATE = {
  trong_muc:    { label: 'Trong mức', color: 'var(--sage-600)', bg: '#edf7ee', border: '#c3dfc7' },
  vuot_muc:     { label: 'Vượt mức',  color: '#dc2626',         bg: '#fef2f2', border: '#fca5a5' },
};

function AllocMeter({ cats, total, target, mung, totalEstimated, budgetUsedPct }) {
  const max = Math.max(total, target, 1);
  const over = total - target;
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--line-100)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-xs)', padding: '16px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 13, gap: 14 }}>
        <div style={{ minWidth: 0 }}>
          <div className="ds-label" style={{ color: 'var(--kim-600)' }}>Đã phân bổ</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 600, color: 'var(--ink-900)', lineHeight: 1.05, marginTop: 3, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
            {total}<span style={{ fontSize: 20 }}>tr</span>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--ink-400)', whiteSpace: 'nowrap' }}>
            {target > 0 ? `Mục tiêu ${target}tr` : 'Chưa đặt mục tiêu'}
          </div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14.5, fontWeight: 600, marginTop: 1,
            color: target <= 0 ? 'var(--ink-400)' : (over > 0 ? 'var(--danger-500)' : (over < 0 ? 'var(--info-500)' : 'var(--sage-500)')) }}>
            {target <= 0 ? 'Thiết lập trong hồ sơ' : (over === 0 ? 'Cân đối' : (over > 0 ? `Vượt ${over}tr` : `Còn ${-over}tr`))}
          </div>
        </div>
      </div>

      {/* Stacked allocation bar */}
      <div style={{ position: 'relative', height: 12, borderRadius: 999, background: 'var(--line-100)', overflow: 'hidden', display: 'flex' }}>
        {cats.map((c) => (
          <div key={c.id} style={{ width: ((c.allocated_tr || 0) / max) * 100 + '%', background: c.color, transition: 'width .18s ease', borderRight: '1.5px solid var(--card)' }} />
        ))}
      </div>

      {/* Confirmed (estimated) row */}
      {totalEstimated > 0 && (
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Icon name="check-circle-2" size={13} color="var(--sage-500)" />
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--ink-500)' }}>Đã đặt cọc / chốt</span>
          </div>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 700, color: 'var(--sage-600)', fontVariantNumeric: 'tabular-nums' }}>
            {totalEstimated}tr{budgetUsedPct > 0 ? ` · ${budgetUsedPct}%` : ''}
          </span>
        </div>
      )}

      {mung > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 11, borderTop: '1px solid var(--line-100)' }}>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12.5, color: 'var(--ink-500)' }}>Tiền mừng dự kiến</span>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13.5, fontWeight: 600, color: 'var(--sage-500)' }}>+{mung}tr → thực ~{Math.max(0, total - mung)}tr</span>
        </div>
      )}
    </div>
  );
}

function ItemRow({ it, onAmt, onName, onRemove }) {
  const [amtStr, setAmtStr] = useState(String(it.amt || 0));
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
        <EditName value={it.name} onChange={onName} size={13} weight={500} focusNew={it.isNew} />
        {it.vendor && it.status === 'confirmed' && (
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 9.5, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--sage-600)', marginLeft: 7 }}>đã chốt</span>
        )}
        {it.vendor && it.status !== 'confirmed' && (
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 9.5, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--kim-600)', marginLeft: 7 }}>đang xem</span>
        )}
      </div>
      <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 1, flexShrink: 0 }}>
        <input
          value={amtStr}
          inputMode="numeric"
          onChange={(e) => setAmtStr(e.target.value.replace(/\D/g, ''))}
          onBlur={commitAmt}
          onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
          style={{
            width: Math.max(24, amtStr.length * 8 + 4),
            fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 13,
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

function CatRow({ c, itemsTotal, totalTarget, defaultOpen, onAmt, onName, onRemove, onItemAmt, onItemName, onItemRemove, onAddItem }) {
  const [open, setOpen] = useState(!!defaultOpen);
  const used = itemsTotal(c);
  const allocated = c.allocated_tr || 0;
  const left = allocated - used;
  const count = (c.items || []).length;
  const stateInfo = CAT_STATE[c.state];
  const isOver = c.state === 'vuot_muc';
  const pctDisplay = totalTarget > 0 ? Math.round((allocated / totalTarget) * 100) : null;

  return (
    <div style={{ background: 'var(--card)', border: `1px solid ${isOver ? '#fca5a5' : 'var(--line-100)'}`, borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-xs)', padding: '12px 13px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
        <span style={{ width: 22, height: 22, borderRadius: 'var(--r-xs)', background: c.color || 'var(--dao-300)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={c.icon || 'circle'} size={12} color="#fff" sw={2.2} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <EditName value={c.name} onChange={onName} size={14.5} focusNew={c.isNew} />
        </div>
        {pctDisplay !== null && (
          <span style={{ flexShrink: 0, fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--ink-300)', fontVariantNumeric: 'tabular-nums' }}>{pctDisplay}%</span>
        )}
        <EditAmount value={allocated} onChange={onAmt} size={15} color={isOver ? '#dc2626' : 'var(--ink-900)'} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <AllocSlider value={allocated} max={totalTarget || 300} color={c.color || 'var(--son-500)'} onChange={onAmt} />

        {/* State badge — only shown when there's confirmed spend */}
        {stateInfo && (c.estimated_tr || 0) > 0 && (
          <span style={{ flexShrink: 0, fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 600,
            color: stateInfo.color, background: stateInfo.bg, border: `1px solid ${stateInfo.border}`,
            borderRadius: 999, padding: '2px 8px', whiteSpace: 'nowrap' }}>
            {c.estimated_tr}tr chốt
          </span>
        )}

        <button onClick={() => setOpen((o) => !o)} style={{ height: 30, borderRadius: 'var(--r-pill)', flexShrink: 0, cursor: 'pointer', padding: '0 11px',
          background: open ? 'var(--son-50)' : 'transparent', border: `1px solid ${open ? 'var(--son-200)' : 'var(--line-200)'}`,
          display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 600, color: open ? 'var(--son-600)' : 'var(--ink-500)' }}>
          <Icon name="list" size={13} color={open ? 'var(--son-500)' : 'var(--ink-400)'} /> {count}
          <Icon name={open ? 'chevron-up' : 'chevron-down'} size={13} color={open ? 'var(--son-500)' : 'var(--ink-400)'} />
        </button>
        <button onClick={onRemove} title="Xoá hạng mục" style={{ width: 30, height: 30, borderRadius: 'var(--r-sm)', flexShrink: 0, cursor: 'pointer',
          background: 'transparent', border: '1px solid var(--line-200)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="trash-2" size={14} color="var(--ink-400)" />
        </button>
      </div>

      {open && (
        <div style={{ marginTop: 11, padding: '4px 12px 10px', background: 'var(--bg-1)', border: '1px solid var(--line-100)', borderRadius: 'var(--r-sm)' }}>
          {count === 0 ? (
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--ink-400)', padding: '9px 0' }}>Chưa có hạng mục con nào trong khoản này.</div>
          ) : (
            (c.items || []).map((it, i) => (
              <div key={it.id} style={{ borderBottom: i === count - 1 ? 'none' : '1px solid var(--line-100)' }}>
                <ItemRow it={it} onAmt={(v) => onItemAmt(it.id, v)} onName={(n) => onItemName(it.id, n)} onRemove={() => onItemRemove(it.id)} />
              </div>
            ))
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingTop: 9, borderTop: '1px dashed var(--line-200)' }}>
            <button onClick={onAddItem} style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 600, color: 'var(--son-600)',
              background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
              <Icon name="plus" size={13} color="var(--son-600)" /> Thêm mục con
            </button>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11.5, fontWeight: 600,
              color: left < 0 ? 'var(--danger-500)' : (left === 0 ? 'var(--ink-400)' : 'var(--sage-500)') }}>
              {left < 0 ? `Vượt ${-left}tr` : (left === 0 ? `Đã dùng hết ${allocated}tr` : `Còn trống ${left}tr`)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export function ScreenBudget({ coupleId = null, onMenuOpen = () => {} }) {
  const bud = useBudget(coupleId);

  useEffect(() => {
    track('budget_viewed', { journey: 'budget' });
  }, []);

  return (
    <div style={{ height: '100%', position: 'relative', background: 'var(--paper)', overflow: 'hidden' }}>
      <div style={{ height: '100%', overflowY: 'auto', padding: 'var(--header-pt) 16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingTop: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <button onClick={onMenuOpen} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
              <Icon name="chevron-left" size={24} color="var(--ink-700)" />
            </button>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, color: 'var(--ink-900)' }}>Ngân sách</span>
          </div>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12.5, color: 'var(--ink-400)' }}>
            {bud.guests > 0 ? `${bud.guests} khách` : 'Chưa có số khách'}
          </span>
        </div>

        <AllocMeter
          cats={bud.cats}
          total={bud.total}
          target={bud.totalTarget}
          mung={bud.mung}
          totalEstimated={bud.totalEstimated}
          budgetUsedPct={bud.budgetUsedPct}
        />

        <div className="ds-label" style={{ margin: '20px 2px 11px' }}>Các hạng mục · kéo để chỉnh · mở để xem mục con</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {bud.cats.length === 0 && (
            <div style={{ padding: '22px 16px', textAlign: 'center', border: '1px dashed var(--line-200)', borderRadius: 'var(--r-md)',
              fontFamily: 'var(--font-body)', fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink-500)' }}>
              Chưa có hạng mục ngân sách. Thêm khoản đầu tiên để bắt đầu phân bổ.
            </div>
          )}
          {bud.cats.map((c, i) => (
            <CatRow key={c.id} c={c} itemsTotal={bud.itemsTotal} totalTarget={bud.totalTarget} defaultOpen={i === 0}
              onAmt={(v) => { bud.setAmt(c.id, v); track('budget_category_amount_changed', { journey: 'budget', category_id: c.id, new_amt: v }); }}
              onName={(n) => bud.rename(c.id, n)}
              onRemove={() => { bud.remove(c.id); track('budget_category_removed', { journey: 'budget', category_id: c.id }); }}
              onItemAmt={(iid, v) => { bud.setItemAmt(c.id, iid, v); track('budget_item_amount_changed', { journey: 'budget', category_id: c.id, item_id: iid, new_amt: v }); }}
              onItemName={(iid, n) => bud.renameItem(c.id, iid, n)}
              onItemRemove={(iid) => { bud.removeItem(c.id, iid); track('budget_item_removed', { journey: 'budget', category_id: c.id, item_id: iid }); }}
              onAddItem={() => { bud.addItem(c.id); track('budget_item_added', { journey: 'budget', category_id: c.id }); }} />
          ))}
        </div>

        <button onClick={() => { bud.add(); track('budget_category_added', { journey: 'budget' }); }} style={{ width: '100%', marginTop: 12, fontFamily: 'var(--font-ui)', fontSize: 13.5, fontWeight: 600, color: 'var(--son-600)',
          background: 'transparent', border: '1.5px dashed var(--son-200)', borderRadius: 'var(--r-md)', padding: '12px 0', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
          <Icon name="plus" size={16} color="var(--son-600)" /> Thêm hạng mục
        </button>
      </div>
    </div>
  );
}

export default ScreenBudget;
