// Test hàm thuần của ảnh vendor (T-052 / spec T-051 mục H). Hành vi trên trình duyệt do eval Playwright check_9, check_10 phủ.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cssBg, urlFromCss, photoUrlsOf, fallbackGradFor } from '../src/vendorImageUrls.js';

test('cssBg và urlFromCss đi qua đi lại', () => {
  const u = 'https://host.example/v/a-b (1).webp';
  assert.equal(urlFromCss(cssBg(u)), u);
});
test('gradient không phải URL ảnh', () => {
  assert.equal(urlFromCss('linear-gradient(135deg,#7a9ab5,#4a6a85)'), null);
  assert.equal(urlFromCss(undefined), null);
});
test('photoUrlsOf lấy gallery, thiếu gallery thì lấy grad, vendor không ảnh thì rỗng', () => {
  assert.deepEqual(photoUrlsOf({ gallery: [cssBg('https://a/1.jpg'), 'linear-gradient(red,blue)', cssBg('https://a/2.jpg')] }), ['https://a/1.jpg', 'https://a/2.jpg']);
  assert.deepEqual(photoUrlsOf({ grad: cssBg('https://a/3.jpg') }), ['https://a/3.jpg']);
  assert.deepEqual(photoUrlsOf({ gallery: ['linear-gradient(red,blue)'], grad: 'linear-gradient(red,blue)' }), []);
  assert.deepEqual(photoUrlsOf(null), []);
});
test('ảnh mặc định theo danh mục, danh mục lạ dùng gradient chung', () => {
  assert.notEqual(fallbackGradFor('venue'), fallbackGradFor('khong-co'));
  assert.equal(fallbackGradFor('khong-co'), fallbackGradFor(undefined));
});

// T-066 / T-068: trạng thái ô ảnh. Chỉ 'bad' mới được hiện minh hoạ.
import { photoStateOf } from '../src/vendorImageUrls.js';
test('photoStateOf: không URL hoặc mọi URL hỏng là bad; còn URL chưa biết là checking; có ảnh tốt là good', () => {
  const good = new Set(['g']), bad = new Set(['b1', 'b2']);
  const isGood = (u) => good.has(u), isBad = (u) => bad.has(u);
  assert.equal(photoStateOf([], isGood, isBad), 'bad');
  assert.equal(photoStateOf(undefined, isGood, isBad), 'bad');
  assert.equal(photoStateOf(['b1', 'b2'], isGood, isBad), 'bad');
  assert.equal(photoStateOf(['b1', 'pending'], isGood, isBad), 'checking');
  assert.equal(photoStateOf(['b1', 'g'], isGood, isBad), 'good');
});

// T-156: ghi công tác giả ảnh Google. Hàm thuần; hành vi trên trình duyệt do eval T-156 (check_3..6) phủ.
import { usablePhotos, photoEntriesOf, isGooglePhoto, isGoogleHostUrl, authorOf } from '../src/vendorImageUrls.js';
test('nhận ra ảnh Google theo source hoặc theo host (kể cả tên miền con), không nhận host giả', () => {
  assert.ok(isGooglePhoto({ url: 'https://x/y.jpg', source: ' Google ' }));
  assert.ok(isGooglePhoto({ url: 'https://lh3.googleusercontent.com/a=s800', source: 'marry' }));
  assert.ok(isGoogleHostUrl('https://googleusercontent.com/a'));
  assert.ok(!isGoogleHostUrl('https://evilgoogleusercontent.com/a'));
  assert.ok(!isGooglePhoto({ url: 'https://cdn.marry.vn/a.jpg', source: 'marry', attribution: 'X' }));
});
test('tên tác giả: bỏ khoảng trắng đầu/cuối; rỗng, khoảng trắng hoặc không phải chuỗi là thiếu', () => {
  assert.equal(authorOf({ attribution: '  Nhãn <b>Sai</b> & Co ' }), 'Nhãn <b>Sai</b> & Co');
  assert.equal(authorOf({ attribution: '   ' }), null);
  assert.equal(authorOf({ attribution: 5 }), null);
  assert.equal(authorOf({}), null);
});
test('usablePhotos: ảnh Google thiếu tên bị bỏ; marry không mang tên kể cả khi có attribution; thứ tự giữ nguyên', () => {
  const g = 'https://lh3.googleusercontent.com/';
  const out = usablePhotos([
    { url: g + '1', source: 'google' },
    { url: 'https://m/1.jpg', source: 'marry', attribution: 'SENT' },
    { url: g + '2', source: 'google', attribution: ' Tác Giả ' },
    { url: g + '3', source: 'google', attribution: '  ' },
  ]);
  assert.deepEqual(out, [{ url: 'https://m/1.jpg', credit: null }, { url: g + '2', credit: 'Tác Giả' }]);
});
test('photoEntriesOf: tên đi cùng từng ảnh; URL Google đã lưu không có tên thì không hiện', () => {
  const g = 'https://lh3.googleusercontent.com/';
  const v = { gallery: [cssBg(g + 'a'), cssBg('https://m/1.jpg'), cssBg(g + 'b')] };
  assert.deepEqual(photoEntriesOf(v), [{ url: 'https://m/1.jpg', credit: null }]);
  v.photoCredits = ['A', null, 'B'];
  assert.deepEqual(photoEntriesOf(v).map((e) => e.credit), ['A', null, 'B']);
});
