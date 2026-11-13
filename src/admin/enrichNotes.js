/** Dòng ghi chú trong drawer enrich: xét theo KHOÁ có trong pool.vendor, không theo giá trị falsy (rating=0 vẫn là khoá có). */
export const notesFor = (notes, field) => (Array.isArray(notes) ? notes : []).filter((n) => n && n.field === field);
export function absentNoteFields(vendor, notes) {
  const v = vendor && typeof vendor === 'object' ? vendor : {};
  const out = [];
  for (const n of Array.isArray(notes) ? notes : []) {
    if (n && typeof n.field === 'string' && !Object.prototype.hasOwnProperty.call(v, n.field) && !out.includes(n.field)) out.push(n.field);
  }
  return out;
}
