// Ghi công tác giả ảnh Google (T-156, ADR-041 điểm 4): tên tác giả của CHÍNH ảnh đang hiện, chữ thuần nhìn thấy được,
// nguyên văn (không đổi hoa thường), cỡ chữ 10px, không cắt (tên dài xuống dòng), đứng cạnh ảnh.
// `credit` null (ảnh không phải Google) thì không hiện gì. Ô ảnh nhỏ: đặt `inline` ngay cạnh/dưới ô, không ép vào trong ô.
const BASE = { fontFamily: 'var(--font-ui)', fontSize: 10, lineHeight: 1.3, overflowWrap: 'anywhere', whiteSpace: 'normal', textTransform: 'none' };

export function PhotoCredit({ credit, overlay = false, run = false, left = 8, bottom = 8, style }) {
  if (!credit) return null;
  if (overlay) {
    return (
      <span style={{ ...BASE, position: 'absolute', left, bottom, maxWidth: `calc(100% - ${left * 2}px)`, boxSizing: 'border-box',
        padding: '2px 7px', borderRadius: 10, color: '#fff', background: 'rgba(0,0,0,0.55)', ...style }}>
        Ảnh: {credit}
      </span>
    );
  }
  if (run) return <span style={{ ...BASE, fontStyle: 'normal', color: 'var(--ink-500)', ...style }}>Ảnh: {credit}</span>;
  return <div style={{ ...BASE, color: 'var(--ink-500)', ...style }}>Ảnh: {credit}</div>;
}
