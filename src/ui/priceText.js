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

// "4tr–4,6tr" (hạng mục theo gói) hoặc "4tr–4,6tr/bàn" (nhà hàng có nguồn giá). Hai đầu cùng chữ thì một số.
export function priceText(min, max, perTable = false) {
  const a = fmtTr(min);
  const b = max ? fmtTr(max) : '';
  return `${a}tr${b && b !== a ? `–${b}tr` : ''}${perTable ? '/bàn' : ''}`;
}

// "4,3–4,8tr" / "25–27tr" / "4,2tr" (câu "Giá hiện tại trên Tơ Hồng: …", một chữ "tr" ở cuối)
export function rangeTr(min, max) {
  const a = fmtTr(min);
  const b = max != null ? fmtTr(max) : '';
  return `${a}${b && b !== a ? `–${b}` : ''}tr`;
}
