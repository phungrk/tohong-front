/* T-182 (spec T-179): "số đã lưu" của một hạng mục = (D, K): D = allocated_tr của hạng mục, K = guests, đọc từ bản dự toán ĐÃ LƯU trên server
 * bằng một lần GET lúc cần (front không suy luận). Đọc lỗi trả null, không bao giờ trả số đoán.
 * Lần lưu đang chờ (đợi gộp 800ms hoặc đã gửi chưa có phản hồi) được đếm ở đây để bấm "Tìm vendor" đợi lưu xong rồi mới đọc. */
import { api } from '../api.js';
export { sameSig, sigLabel } from './sigLabel.js';

let pending = 0;
const waiters = [];

export const saveBegin = () => { pending += 1; };
export const saveEnd = () => {
  pending = Math.max(0, pending - 1);
  if (pending === 0) waiters.splice(0).forEach((r) => r());
};
const whenSaved = () => new Promise((resolve) => (pending === 0 ? resolve() : waiters.push(resolve)));

/* { d, k } hoặc null nếu không đọc được. d = 0 khi vắng/<= 0; k = 0 nghĩa là "chưa có". */
export async function readSavedSig(coupleId, catId) {
  await whenSaved();
  try {
    const doc = await api.getBudget(coupleId, { track: false });
    if (!Array.isArray(doc?.categories)) return null; // 404 (getBudget trả null) hoặc phản hồi không có dự toán: lỗi đọc, không đoán số 0
    const cat = (doc?.categories || []).find((c) => c.id === catId);
    const d = Number(cat?.allocated_tr);
    const k = Number(doc?.guests);
    return { d: d > 0 ? d : 0, k: k > 0 ? k : 0 };
  } catch {
    return null;
  }
}
