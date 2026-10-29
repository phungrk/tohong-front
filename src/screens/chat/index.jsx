import { useState, useEffect } from 'react';
import { ScreenPaywall } from './paywall.jsx';
import { useConnect } from '../connectContext.js';
import { AppChat } from './AppChat.jsx';
import { api } from '../../api.js';
import { track, startJourney, journeyDuration } from '../../analytics.js';

export function ChatTabWrapper({
  coupleId = null,
  ctxId = 'home',
  chatSession,
  onMenuOpen,
  onAction,
  onConversationChange,
  onConversationUpdated,
  hideHeader = false,
}) {
  const [overlay, setOverlay] = useState(null); // null | 'paywall' (kèm trạng thái chờ nếu đã có yêu cầu nâng cấp)
  const [upgrade, setUpgrade] = useState(null); // yêu cầu nâng cấp đang chờ: { plan, price_k, status }
  const { role } = useConnect();
  const [trialInfo, setTrialInfo] = useState(null); // { remaining, total } — null = paid/unknown
  const [trialExtended, setTrialExtended] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState('');

  useEffect(() => {
    if (overlay === 'paywall') {
      startJourney('monetization');
      track('paywall_shown', { journey: 'monetization', trial_extended: trialExtended });
    }
  }, [overlay, trialExtended]);

  useEffect(() => {
    if (!coupleId) return;
    api.getSubscription(coupleId)
      .then(({ subscription: s }) => {
        if (s.plan && s.status === 'active' && s.expires_at && new Date(s.expires_at) > new Date()) {
          setTrialInfo(null); // paid — no banner
          return;
        }
        const total = s.trial_messages_total * (s.trial_extended ? 2 : 1);
        const used  = s.trial_messages_used || 0;
        setTrialExtended(!!s.trial_extended);
        setTrialInfo({ remaining: Math.max(0, total - used), total });
        if (used >= total) setOverlay('paywall');
      })
      .catch(() => {});
    api.getUpgradeRequest(coupleId)
      .then(({ upgrade: u }) => setUpgrade(u && u.status === 'pending' ? u : null))
      .catch(() => {});
  }, [coupleId]);

  // Decrement trial counter after each successful AI reply (optimistic)
  const onReply = () => {
    setTrialInfo((prev) => prev ? { ...prev, remaining: Math.max(0, prev.remaining - 1) } : prev);
  };

  // Chọn gói chỉ tạo yêu cầu nâng cấp; Tơ Hồng kích hoạt thủ công sau khi nhận chuyển khoản (spec 002 US4).
  const onConfirm = async (selectedPlan, contactText = '') => {
    setUnlockError('');
    if (!coupleId) {
      setUnlockError('Hãy hoàn tất hồ sơ trước khi chọn gói nhé.');
      return;
    }
    setUnlocking(true);
    track('subscribe_clicked', { journey: 'monetization', plan_id: selectedPlan.id, plan_months: selectedPlan.months, price_k: selectedPlan.price, duration_ms: journeyDuration('monetization') });
    try {
      const res = await api.requestUpgrade(coupleId, selectedPlan.id, contactText ? { phone: contactText } : undefined);
      setUpgrade(res.upgrade);
      track('upgrade_requested', { journey: 'monetization', plan: selectedPlan.id, price_k: res.upgrade?.price_k ?? selectedPlan.price });
    } catch (err) {
      const msg = err.code === 'guest_not_allowed'
        ? 'Hai bạn đăng nhập để Tơ Hồng liên hệ lại được nhé.'
        : err.code === 'rate_limited'
          ? 'Hai bạn đã gửi khá nhiều yêu cầu trong một giờ qua, mình xin hai bạn thử lại sau nhé.'
          : err.status === 403
            ? 'Tài khoản này chỉ được xem, chưa chọn gói được.'
            : 'Chưa gửi được yêu cầu. Hai bạn thử lại nhé.';
      setUnlockError(msg);
      track('subscribe_error', { journey: 'monetization', plan_id: selectedPlan.id, error: err.code || `http_${err.status || 0}` });
    } finally {
      setUnlocking(false);
    }
  };

  const onTrial = async () => {
    track('trial_extended', { journey: 'monetization', duration_ms: journeyDuration('monetization') });
    if (coupleId) {
      try {
        await api.extendTrial(coupleId);
        // Re-fetch for accurate count after extension
        const { subscription: s } = await api.getSubscription(coupleId);
        const total = s.trial_messages_total * 2;
        setTrialInfo({ remaining: Math.max(0, total - (s.trial_messages_used || 0)), total });
      } catch (error) {
        setUnlockError(error.message || 'Không thể gia hạn lượt dùng thử.');
        return;
      }
    } else {
      setUnlockError('Hãy hoàn tất hồ sơ trước khi gia hạn lượt dùng thử.');
      return;
    }
    setTrialExtended(true);
    setOverlay(null); // close overlay → AppChat session continues
  };

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <AppChat
        key={chatSession?.version ?? 'default'}
        coupleId={coupleId}
        ctxId={ctxId}
        chatSession={chatSession}
        onMenuOpen={onMenuOpen}
        onPaywall={() => setOverlay('paywall')}
        onReply={onReply}
        onAction={onAction}
        onConversationChange={onConversationChange}
        onConversationUpdated={onConversationUpdated}
        trialInfo={trialInfo}
        hideHeader={hideHeader}
      />
      {overlay === 'paywall' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
          <ScreenPaywall
            trialUsed={trialExtended}
            onConfirm={onConfirm}
            onTrial={onTrial}
            onClose={() => setOverlay(null)}
            unlocking={unlocking}
            error={unlockError}
            pending={upgrade}
            viewer={role === 'viewer'}
          />
        </div>
      )}
    </div>
  );
}

export default ChatTabWrapper;
