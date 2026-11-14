// "4tr–4.6tr" (hạng mục theo gói) hoặc "4tr–4.6tr/bàn" (nhà hàng có nguồn giá: giá theo bàn).
export function priceText(min, max, perTable = false) {
  return `${min}tr${max && max !== min ? `–${max}tr` : ''}${perTable ? '/bàn' : ''}`;
}
