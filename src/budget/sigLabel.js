/* T-182 (spec T-179 H3): so số đã lưu và nhãn "Theo dự toán …" (thuần, không gọi API). */
/* So số thô (không làm tròn): 90 và 90,04 là khác nhau. */
export const sameSig = (a, b) => a.d === b.d && a.k === b.k;

const fmt = (x) => String(Math.round(x * 10) / 10).replace('.', ',');
export const sigLabel = (s) => {
  if (!s) return null;
  if (s.d <= 0) return 'Chưa có dự toán cho hạng mục này';
  return `Theo dự toán ${fmt(s.d)}tr${s.k > 0 ? ` · ${s.k} khách` : ''}`;
};
