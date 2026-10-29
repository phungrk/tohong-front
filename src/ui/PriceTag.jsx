// Nhãn nguồn giá của vendor (spec 002 FR-035): "giá ước tính" hoặc "giá đã xác minh".
// source: 'verified' | 'estimated' | null (không rõ → không hiện nhãn).
export function PriceTag({ source, style }) {
  if (source !== 'verified' && source !== 'estimated') return null;
  const ok = source === 'verified';
  return (
    <span
      data-testid="price-tag"
      style={{
        display: 'inline-block', fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 600, lineHeight: 1.3,
        color: ok ? 'var(--sage-600)' : 'var(--ink-400)', ...style,
      }}
    >
      {ok ? 'giá đã xác minh' : 'giá ước tính'}
    </span>
  );
}
