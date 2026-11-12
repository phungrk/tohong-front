/** T-129 / T-134: câu lỗi 409 decided_by_capu của bảng enrich (nhãn "Chờ Capu"/"Chờ áp dụng" kiểm bằng eval check_6 của tohong-hq). */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { adminErrMsg } from '../src/admin/format.js';

test('409 decided_by_capu hiện câu có chữ Capu, không hiện mã thô', () => {
  const msg = adminErrMsg({ code: 'decided_by_capu', status: 409 });
  assert.match(msg, /Capu đã quyết dòng này/);
  assert.ok(!msg.includes('decided_by_capu'));
});
