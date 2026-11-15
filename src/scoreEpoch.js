/* T-174: tín hiệu "số liệu dùng để chấm điểm vendor vừa đổi" (dự toán, số khách, hồ sơ).
 * Chỉ phát sau một lần ghi THÀNH CÔNG làm đổi ít nhất một trường trong danh sách dưới đây (lỗi thì không phát);
 * thẻ vendor trong chat đăng ký bằng useScoreEpoch() và lấy lại điểm khi số đếm tăng. Front không suy luận server dùng số nào. */
import { useSyncExternalStore } from 'react';

let epoch = 0;
const listeners = new Set();

export const bumpScoreEpoch = () => {
  epoch += 1;
  listeners.forEach((l) => l());
};

export const useScoreEpoch = () => useSyncExternalStore(
  (l) => { listeners.add(l); return () => listeners.delete(l); },
  () => epoch,
);

const has = (o, k) => !!o && typeof o === 'object' && Object.prototype.hasOwnProperty.call(o, k);

/* Body PATCH hồ sơ có đụng trường nào ảnh hưởng điểm không (chưa biết giá trị cũ thì coi là đổi). */
export function profilePatchTouchesScore(patch) {
  if (!patch || typeof patch !== 'object') return false;
  const c = patch.couple, p = patch.preferences; // couple.guest_count: eval T-171 (check_5) ghi số khách theo dạng này
  return has(patch, 'guest_count') || has(c, 'guest_count') || has(p, 'guest_count') || has(patch, 'budget') || has(patch, 'budget_by_category')
    || has(patch, 'wedding_date') || has(c, 'wedding_date') || has(patch, 'city') || has(c, 'city')
    || has(p, 'style_tags') || has(patch, 'style_tags') || has(p, 'styles') || has(patch, 'styles');
}

/* Chữ ký phần dự toán ảnh hưởng điểm: allocated_tr theo id hạng mục, total_tr, guests. Tên, khoản (items), pct, priority, mung_tr không tính. */
export const budgetScoreSig = (doc) => JSON.stringify([
  Number(doc?.total_tr) || 0,
  Number(doc?.guests) || 0,
  (doc?.categories || []).map((c) => [c.id, Number(c.allocated_tr) || 0]).sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)),
]);
