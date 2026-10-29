// Tiện ích định dạng cho trang admin (không gọi analytics, không đụng dữ liệu cá nhân ngoài màn hình).

export function fmtTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', { hour12: false, dateStyle: 'short', timeStyle: 'short' });
}

export function fmtWait(hours) {
  if (hours == null) return '—';
  if (hours < 1) return 'dưới 1 giờ';
  if (hours < 48) return `${Math.round(hours)} giờ`;
  const days = Math.floor(hours / 24);
  const rest = Math.round(hours - days * 24);
  return rest ? `${days} ngày ${rest} giờ` : `${days} ngày`;
}

// price_k tính bằng nghìn đồng
export function fmtPriceK(k) {
  if (k == null) return '—';
  return `${(k * 1000).toLocaleString('vi-VN')}đ`;
}

export function fmtContact(c) {
  if (!c) return '—';
  const parts = [];
  if (c.phone) parts.push(`ĐT ${c.phone}`);
  if (c.zalo) parts.push(`Zalo ${c.zalo}`);
  if (c.website) parts.push(c.website);
  return parts.length ? parts.join(' · ') : '—';
}

// Mã lỗi backend → câu tiếng Việt ngắn cho admin.
const ERR = {
  forbidden: 'Bạn không có quyền thực hiện thao tác này.',
  invalid_transition: 'Chỉ được đổi trạng thái một bước (tiến hoặc lùi).',
  close_reason_required: 'Hãy chọn lý do khi đóng yêu cầu.',
  invalid_close_reason: 'Lý do đóng không hợp lệ với trạng thái này.',
  note_required: 'Hãy nhập ghi chú trước khi từ chối.',
  not_pending: 'Yêu cầu này đã được xử lý rồi.',
  not_active: 'Gói này không còn ở trạng thái đang dùng.',
  not_found: 'Không tìm thấy mục này.',
  vendor_not_found: 'Không tìm thấy vendor này.',
  version_conflict: 'Vendor đã được sửa ở nơi khác, hãy tải lại rồi sửa tiếp.',
  invalid_price: 'Khoảng giá chưa hợp lệ: giá không âm và giá thấp nhất không vượt giá cao nhất.',
  hidden_reason_required: 'Hãy nhập lý do khi ẩn vendor.',
  invalid_override: 'Dữ liệu ghi đè chưa hợp lệ.',
  override_not_found: 'Vendor này chưa có ghi đè nào.',
  conflict: 'Có thay đổi đồng thời, hãy thử lại.',
};

export function adminErrMsg(err) {
  if (err?.code && ERR[err.code]) return ERR[err.code];
  return err?.message || 'Có lỗi xảy ra, hãy thử lại.';
}
