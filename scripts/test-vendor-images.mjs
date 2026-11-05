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
