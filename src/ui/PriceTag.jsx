// Nhãn nguồn giá của vendor. Back là nơi duy nhất tạo nhãn (T-164): app vẽ NGUYÊN VĂN `price_label` của API, không tự dựng.
// Back cũ hoặc vendor chưa có nguồn giá (không có label): nhãn dự phòng theo `price_source` ("giá đã xác minh" / "giá ước tính").
// Luôn có một nhãn khi có giá: gọi PriceTag ở chỗ đang hiện số giá (kể cả khi price_source thiếu).
export function PriceTag({ source, label, style }) {
  const text = typeof label === 'string' && label.trim() ? label : source === 'verified' ? 'giá đã xác minh' : 'giá ước tính';
  const ok = source === 'verified';
  return (
    <span
      data-testid="price-tag"
      style={{
        display: 'inline-block', fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 600, lineHeight: 1.3,
        color: ok ? 'var(--sage-600)' : 'var(--ink-400)', ...style,
      }}
    >
      {text}
    </span>
  );
}
