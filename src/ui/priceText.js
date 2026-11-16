// T-187: một khuôn cho mọi số tiền (triệu đồng) cặp đôi thấy: |x| làm tròn một lần 1 chữ số (nửa đúng lên),
// dấu phẩy thập phân, bỏ ",0", không phân cách nghìn; r = 0 thì "0" không dấu. Thiếu giá trị thì chuỗi rỗng.
// fmtTr(x) -> "4,6" | fmtTr(-3.75) -> "-3,8" | fmtTr(1.15, { plus: true }) -> "+1,2" | fmtTr(-3.75, { minus: '−' }) -> "−3,8"
export function fmtTr(x, { plus = false, minus = '-' } = {}) {
  if (x == null || x === '') return '';
  const n = Number(x);
  if (!Number.isFinite(n)) return '';
  const r = Math.round(Math.abs(n) * 10) / 10;
  const body = String(r).replace('.', ',');
  if (r === 0) return '0';
  return n < 0 ? `${minus}${body}` : plus ? `+${body}` : body;
}

// T-193: giá rỗng = bỏ khuyết, null, chuỗi rỗng (hoặc không phải số); số 0 là giá thật.
const emptyPrice = (x) => x == null || x === '' || !Number.isFinite(Number(x));

// "4tr–4,6tr" (hạng mục theo gói) hoặc "4tr–4,6tr/bàn" (nhà hàng có nguồn giá). Hai đầu cùng chữ thì một số.
// Chỗ MỘT giá (range = false): "4tr"; rỗng -> "Chưa có giá".
// Chỗ KHOẢNG (range = true): đầu dưới rỗng -> "Đến 5tr"; đầu trên rỗng -> "Từ 4tr"; cả hai rỗng -> "Chưa có giá".
export function priceText(min, max, perTable = false, range = false) {
  const unit = perTable ? '/bàn' : '';
  const noMin = emptyPrice(min);
  const b = max && !emptyPrice(max) ? fmtTr(max) : '';
  if (noMin && !(range && b)) return 'Chưa có giá';
  if (noMin) return `Đến ${b}tr${unit}`;
  const a = fmtTr(min);
  if (range && emptyPrice(max)) return `Từ ${a}tr${unit}`;
  return `${a}tr${b && b !== a ? `–${b}tr` : ''}${unit}`;
}

// "4,3–4,8tr" / "25–27tr" / "4,2tr" (câu "Giá hiện tại trên Tơ Hồng: …", một chữ "tr" ở cuối)
export function rangeTr(min, max) {
  const a = fmtTr(min);
  const b = max != null ? fmtTr(max) : '';
  return `${a}${b && b !== a ? `–${b}` : ''}tr`;
}

// T-193: giá "từ" để hiển thị của một vendor: adaptVendor giữ giá nguyên gốc ở priceShown (null = chưa có giá);
// vendor đã lưu từ trước không có trường này thì dùng priceTotal.
export const shownMin = (v) => (v && 'priceShown' in v ? v.priceShown : v?.priceTotal);
