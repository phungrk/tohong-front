import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api.js';
import { track } from '../analytics.js';
import { ConnectContext, saveContact } from './connectContext.js';
import { ConnectSheet } from './chat/ConnectSheet.jsx';

// Props analytics cho phép (research R8): KHÔNG số điện thoại, email, ghi chú, tên.
function connectProps(target) {
  return {
    vendor_id: target.vendor.id,
    category: target.catId,
    source: target.source,
    price_verified: target.vendor.priceSource === 'verified',
    journey: 'vendor',
  };
}

export function ConnectProvider({ coupleId, role, isGuest = false, onShowSignIn, children }) {
  const [byVendor, setByVendor] = useState({}); // vendor_id → yêu cầu mới nhất
  const [vendorInfo, setVendorInfo] = useState({});
  const [target, setTarget] = useState(null);   // { vendor, catId, source, clientRequestId }
  const asked = useRef(new Set());

  // Tải trạng thái yêu cầu một lần khi có coupleId (thẻ vendor dùng chung).
  useEffect(() => {
    if (!coupleId || isGuest) return undefined;
    let alive = true;
    api.listConnectRequests(coupleId)
      .then((res) => {
        if (!alive) return;
        const map = {};
        for (const r of res.requests || []) {
          const cur = map[r.vendor_id];
          if (!cur || String(r.created_at) > String(cur.created_at)) map[r.vendor_id] = r;
        }
        setByVendor(map);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [coupleId, isGuest]);

  const ensureVendorInfo = useCallback((ids) => {
    const fresh = [...new Set(ids)].filter((id) => id && !asked.current.has(id));
    for (let i = 0; i < fresh.length; i += 50) {
      const batch = fresh.slice(i, i + 50);
      batch.forEach((id) => asked.current.add(id));
      api.getVendorStatuses(batch)
        .then((res) => setVendorInfo((cur) => ({ ...cur, ...(res?.vendors || {}) })))
        .catch(() => batch.forEach((id) => asked.current.delete(id)));
    }
  }, []);

  const openConnect = useCallback((vendor, catId, source) => {
    const t = { vendor, catId, source, clientRequestId: `cr-${crypto.randomUUID()}` };
    track('vendor_connect_opened', connectProps(t));
    setTarget(t);
  }, []);

  const cancel = () => {
    track('vendor_connect_cancelled', connectProps(target));
    setTarget(null);
  };

  const submit = async ({ contact, note }) => {
    const res = await api.createConnectRequest(coupleId, {
      vendor_id: target.vendor.id,
      contact,
      note,
      source: target.source,
      client_request_id: target.clientRequestId,
    });
    const r = res.request;
    setByVendor((cur) => ({ ...cur, [r.vendor_id]: { ...r, created_at: r.created_at || new Date().toISOString() } }));
    saveContact(contact);
    track('vendor_connect_submitted', connectProps(target));
    return r;
  };

  const value = useMemo(() => ({
    role,
    canAct: Boolean(coupleId) && role !== 'viewer',
    statusFor: (vendorId) => byVendor[vendorId] || null,
    openConnect,
    vendorInfoFor: (vendorId) => vendorInfo[vendorId],
    ensureVendorInfo,
  }), [role, coupleId, byVendor, vendorInfo, openConnect, ensureVendorInfo]);

  return (
    <ConnectContext.Provider value={value}>
      {children}
      {target && (
        <ConnectSheet
          key={target.clientRequestId}
          vendor={target.vendor}
          catId={target.catId}
          isGuest={isGuest}
          onSignIn={onShowSignIn}
          onCancel={cancel}
          onClose={() => setTarget(null)}
          onSubmit={submit}
        />
      )}
    </ConnectContext.Provider>
  );
}
