/** T-150/T-151: dòng trường vắng xét theo KHOÁ, không theo giá trị falsy. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { absentNoteFields, notesFor } from '../src/admin/enrichNotes.js';

const note = (field) => ({ field, code: 'kept_from_base', text: `ghi chú ${field}` });

test('rating=0 là khoá có: không có dòng trường vắng "rating", ghi chú vẫn gắn vào dòng rating', () => {
  const vendor = { name: 'A', rating: 0, reviewCount: 0, styles: [] };
  const notes = [note('rating'), note('reviewCount'), note('styles')];
  assert.deepEqual(absentNoteFields(vendor, notes), []);
  assert.deepEqual(notesFor(notes, 'rating').map((n) => n.text), ['ghi chú rating']);
});

test('khoá vắng (reviews) có ghi chú: thành dòng trường vắng, mỗi trường một lần', () => {
  const vendor = { name: 'A', rating: 0 };
  assert.deepEqual(absentNoteFields(vendor, [note('reviews'), note('reviews'), note('rating')]), ['reviews']);
});

test('không có ghi chú hay pool null: không có dòng trường vắng', () => {
  assert.deepEqual(absentNoteFields({ a: 1 }, []), []);
  assert.deepEqual(absentNoteFields(null, undefined), []);
});
