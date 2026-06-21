import { useState, useEffect } from 'react';
import { ScreenPaywall, ScreenUnlocked } from './paywall.jsx';
import { AppChat } from './AppChat.jsx';
import { api } from '../../api.js';
import { track, startJourney, journeyDuration, endJourney } from '../../analytics.js';

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
  const [overlay, setOverlay] = useState(null); // null | 'paywall' | 'done'
  const [plan, setPlan] = useState(null);
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
  }, [coupleId]);

  // Decrement trial counter after each successful AI reply (optimistic)
  const onReply = () => {
    setTrialInfo((prev) => prev ? { ...prev, remaining: Math.max(0, prev.remaining - 1) } : prev);
  };

  const onConfirm = async (selectedPlan) => {
    setUnlocking(true);
    setUnlockError('');
    track('subscribe_clicked', { journey: 'monetization', plan_id: selectedPlan.id, plan_months: selectedPlan.months, price_k: selectedPlan.price, duration_ms: journeyDuration('monetization') });
    const clickMs = Date.now();
    try {
      if (coupleId) {
        await api.subscribe(coupleId, selectedPlan.id);
      }
      setPlan(selectedPlan);
      setTrialInfo(null); // paid — clear trial banner
      setOverlay('done');
      track('subscribe_success', { journey: 'monetization', plan_id: selectedPlan.id, plan_months: selectedPlan.months, duration_ms: endJourney('monetization'), checkout_ms: Date.now() - clickMs });
    } catch (err) {
      setUnlockError(err.message || 'Không thể mở khóa. Vui lòng thử lại.');
      track('subscribe_error', { journey: 'monetization', plan_id: selectedPlan.id, error: err.message });
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
            unlocking={unlocking}
            error={unlockError}
          />
        </div>
      )}
      {overlay === 'done' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
          <ScreenUnlocked plan={plan} onStart={() => setOverlay(null)} />
        </div>
      )}
    </div>
  );
}

export default ChatTabWrapper;
