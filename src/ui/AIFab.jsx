import { useState, useEffect } from 'react';

const FAB_NUDGES = {
  0: ['Hỏi Tơ Hồng về kế hoạch cưới'],
  2: ['Phân tích timeline cùng Tơ Hồng'],
  3: ['Nhờ Tơ Hồng xem lại ngân sách'],
  4: ['Nhờ Tơ Hồng phân tích danh sách khách'],
};

export function AIFab({ tab, hidden, onOpen }) {
  const [nudge, setNudge] = useState(null);
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    if (hidden) return;
    const list = FAB_NUDGES[tab] || FAB_NUDGES[0];
    const showT = setTimeout(() => setNudge({
      tab,
      text: list[Math.floor(Math.random() * list.length)],
    }), 1400);
    const hideT = setTimeout(() => setNudge(null), 8200);
    return () => { clearTimeout(showT); clearTimeout(hideT); };
  }, [tab, hidden]);

  if (hidden) return null;

  return (
    <div className="ai-fab" style={{ position: 'absolute', right: 14, bottom: 18, zIndex: 250 }}>
      {nudge?.tab === tab && (
        <div onClick={onOpen} style={{ position: 'absolute', right: 62, bottom: 18,
          width: 'max-content', cursor: 'pointer', animation: 'nudgePop .24s ease-out both' }}>
          <div style={{ background: 'var(--card)', border: '1.5px solid var(--line-200)',
            borderRadius: 16, padding: '9px 16px', maxWidth: 200,
            fontFamily: 'var(--font-body)', fontSize: 12.5, lineHeight: 1.35, color: 'var(--ink-700)',
            boxShadow: '0 2px 10px rgba(80,50,40,0.09)' }}>
            {nudge.text}
          </div>
        </div>
      )}

      {/* expanding ring */}
      <span style={{ position: 'absolute', inset: 0, borderRadius: '50%',
        border: '2px solid rgba(168,50,70,0.4)', animation: 'fabRing 3.6s ease-out infinite',
        pointerEvents: 'none' }} />

      <button onClick={onOpen}
        onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)}
        onMouseLeave={() => setPressed(false)}
        onTouchStart={() => setPressed(true)} onTouchEnd={() => setPressed(false)}
        style={{ position: 'relative', width: 56, height: 56, borderRadius: '50%',
          background: 'var(--son-500)', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fabBreath 3.6s ease-in-out infinite',
          transform: pressed ? 'scale(0.93)' : 'scale(1)', transition: 'transform .15s ease' }}>
        {/* thread-heart */}
        <svg width="30" height="30" viewBox="0 0 80 80" fill="none"
          style={{ animation: 'fabHeart 3.6s ease-in-out infinite' }}>
          <path d="M40 30 C40 22,33 15.5,25.5 15.5C17 15.5,11 22,11 30C11 43,27 53,40 63C53 53,69 43,69 30C69 22,63 15.5,54.5 15.5C47 15.5,40 22,40 30Z"
            stroke="#FFF7F0" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M40 63L40 73" stroke="#FFF7F0" strokeWidth="5" strokeLinecap="round" />
          <circle cx="40" cy="73" r="4" fill="#F3E7C7" />
        </svg>
        {/* gold sparkles */}
        <svg width="11" height="11" viewBox="0 0 12 12"
          style={{ position: 'absolute', top: 4, right: 5,
            animation: 'fabTwinkle 3.6s ease-in-out infinite', animationDelay: '.6s' }}>
          <path d="M6 0 L7.2 4.8 L12 6 L7.2 7.2 L6 12 L4.8 7.2 L0 6 L4.8 4.8 Z" fill="#F3E7C7" />
        </svg>
        <svg width="7" height="7" viewBox="0 0 12 12"
          style={{ position: 'absolute', bottom: 9, left: 7,
            animation: 'fabTwinkle 3.6s ease-in-out infinite', animationDelay: '2.1s' }}>
          <path d="M6 0 L7.2 4.8 L12 6 L7.2 7.2 L6 12 L4.8 7.2 L0 6 L4.8 4.8 Z" fill="#F3E7C7" />
        </svg>
      </button>
    </div>
  );
}
