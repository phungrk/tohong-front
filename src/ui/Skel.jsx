import { useEffect, useState } from 'react';

/* Trạng thái đang tải (T-061): skeleton đúng hình bố cục, pulse `dbPulse` (tắt khi reduced-motion, xem index.css),
   chỉ dùng token màu. Mốc ~150ms: tải nhanh hơn thì không hề nháy skeleton. */

// true khi `active` đã kéo dài quá `ms`. Không đệm tối thiểu: hết chờ là tắt ngay.
export function useShowAfter(active, ms = 150) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!active) { setShow(false); return undefined; }
    const t = setTimeout(() => setShow(true), ms);
    return () => clearTimeout(t);
  }, [active, ms]);
  return active && show;
}

// Vùng chờ: aria-busy chỉ bọc phần nội dung đang chờ; nhãn "Đang tải…" là aria-label của role=status (không phải chữ nhìn thấy).
// Không phần tử nào bên trong focus được.
export function SkelRegion({ children, style, className }) {
  return (
    <div aria-busy="true" className={className} style={{ position: 'relative', ...style }}>
      <div role="status" aria-label="Đang tải…" className="skel-status" />
      <div aria-hidden="true" style={{ display: 'contents' }}>{children}</div>
    </div>
  );
}

// Một khối skeleton: phần tử rỗng, nền token, bo theo --r-sm (hoặc `r`).
export function Bar({ h, w, mt = 0, r, style }) {
  return <div className="db-skel" style={{ height: h, width: w, marginTop: mt, borderRadius: r, flexShrink: 0, ...style }} />;
}

// Khoảng giữ chỗ lúc chưa tới mốc 150ms (không vẽ gì, giữ chiều cao để bố cục không nhảy).
export function SkelHold({ style }) {
  return <div style={style} />;
}

// Lỗi tải ở bốn tab và trang con: thay skeleton, không trạng thái rỗng giả.
export function LoadError({ what = 'dữ liệu', onRetry, style }) {
  return (
    <div role="alert" style={{ margin: '24px 16px', padding: '22px 16px', textAlign: 'center', border: '1px dashed var(--line-200)', borderRadius: 'var(--r-md)',
      fontFamily: 'var(--font-body)', fontSize: 16, lineHeight: 1.5, color: 'var(--ink-500)', ...style }}>
      <div>Không tải được {what}. Kiểm tra kết nối rồi thử lại nhé.</div>
      <button type="button" onClick={onRetry} style={{ marginTop: 12, fontFamily: 'var(--font-ui)', fontSize: 13.5, fontWeight: 600, color: 'var(--son-600)',
        background: 'transparent', border: '1.5px solid var(--son-200)', borderRadius: 999, padding: '9px 22px', cursor: 'pointer' }}>Thử lại</button>
    </div>
  );
}
