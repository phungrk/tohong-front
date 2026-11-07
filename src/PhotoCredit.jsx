// Ghi công ảnh Google Place Photos (spec 005, FR-002): Google yêu cầu hiện authorAttributions ở mọi nơi ảnh xuất hiện.
// `full`: pill "Ảnh: <tác giả> · Google" cho ô ≥ 100px. `compact`: chấm "G" có title cho ô nhỏ (30–56px) không đủ chỗ chữ.
export function PhotoCredit({ credit, compact = false, bottom = 6, left = 6 }) {
  if (!credit) return null;
  const title = `Ảnh của ${credit} trên Google Maps`;
  if (compact) {
    return (
      <span title={title} aria-label={title} style={{ position: 'absolute', left: 3, bottom: 3, width: 14, height: 14, borderRadius: '50%',
        background: 'rgba(0,0,0,0.45)', color: '#fff', fontFamily: 'var(--font-ui)', fontSize: 9, fontWeight: 700, lineHeight: '14px',
        textAlign: 'center', pointerEvents: 'auto' }}>G</span>
    );
  }
  return (
    <span title={title} style={{ position: 'absolute', left, bottom, maxWidth: 'calc(100% - 12px)', overflow: 'hidden',
      textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-ui)', fontSize: 10, lineHeight: '16px',
      padding: '0 6px', borderRadius: 999, color: '#fff', background: 'rgba(0,0,0,0.38)', backdropFilter: 'blur(4px)' }}>
      Ảnh: {credit} · Google
    </span>
  );
}
