/* T-174 (spec T-171 H5, ADR-104 A): ghép lần ghi lại dự toán sau lỗi.
 * Ba bản, cùng dạng "payload" ({ categories:[{id,name,allocated_tr,pct,priority,items:[{id,name,amt,status,vendor}]}], total_tr, guests, mung_tr }):
 *   server = bản vừa lấy từ server; base = bản front biết là đã lưu (lần tải gần nhất hoặc lần ghi thành công gần nhất); mine = bản đang hiện trên màn.
 * Kết quả = server + CHỈ phần người dùng đã đổi (mine so với base): trường số, hạng mục và khoản/mục con thêm, sửa, xoá theo `id`.
 * Mọi thứ người dùng không đụng tới (vd khoản `vendor_<id>` do chốt vendor ghi xen, mung_tr do nơi khác đổi) lấy theo server, KHÔNG BAO GIỜ bị xoá. */
const CAT_KEYS = ['name', 'allocated_tr', 'pct', 'priority'];
const ITEM_KEYS = ['name', 'amt', 'status', 'vendor'];
const META_KEYS = ['total_tr', 'guests', 'mung_tr'];

const pickKeys = (o, keys) => Object.fromEntries(Object.keys(o || {}).filter((k) => keys.includes(k)).map((k) => [k, o[k]]));
const changed = (a, b, keys) => keys.some((k) => JSON.stringify(a?.[k]) !== JSON.stringify(b?.[k]));
const byId = (list) => new Map((list || []).map((x) => [x.id, x]));

/* Giữ thứ tự trường như máy chủ trả về, chỉ lọc bỏ trường chỉ đọc (estimated_tr, variance_tr, state). */
export function toPayload(cats, meta) {
  return {
    categories: (cats || []).map((c) => ({
      ...pickKeys(c, ['id', ...CAT_KEYS]),
      items: (c.items || []).map((it) => pickKeys(it, ['id', ...ITEM_KEYS])),
    })),
    total_tr: meta.totalTr,
    guests: meta.guests,
    mung_tr: meta.mungTr,
  };
}

export function docToPayload(doc) {
  return {
    categories: (doc?.categories || []).map((c) => ({ ...c, items: (c.items || []).map((it) => ({ ...it })) })),
    total_tr: doc?.total_tr, guests: doc?.guests, mung_tr: doc?.mung_tr,
  };
}

function mergeItems(server, base, mine) {
  const b = byId(base), m = byId(mine), s = byId(server);
  const out = [];
  for (const it of server || []) {
    const bi = b.get(it.id), mi = m.get(it.id);
    if (bi && !mi) continue;                                            // người dùng đã xoá
    if (mi && (!bi || changed(mi, bi, ITEM_KEYS))) out.push({ ...it, ...pickKeys(mi, ITEM_KEYS) }); // người dùng thêm/sửa
    else out.push(it);                                                  // không đụng tới: theo server
  }
  for (const mi of mine || []) if (!s.has(mi.id) && !b.has(mi.id)) out.push(mi); // người dùng thêm (server chưa có)
  return out;
}

export function mergeBudget(server, base, mine) {
  const out = { ...server };
  for (const k of META_KEYS) if (changed(mine, base, [k])) out[k] = mine[k];
  const b = byId(base?.categories), m = byId(mine?.categories), s = byId(server?.categories);
  const cats = [];
  for (const c of server?.categories || []) {
    const bc = b.get(c.id), mc = m.get(c.id);
    if (bc && !mc) continue;                                            // người dùng đã xoá hạng mục
    if (!mc) { cats.push(c); continue; }                                // chỉ có ở server
    const merged = { ...c };
    for (const k of CAT_KEYS) if (!bc || changed(mc, bc, [k])) merged[k] = mc[k];
    merged.items = mergeItems(c.items, bc?.items, mc.items);
    cats.push(merged);
  }
  for (const mc of mine?.categories || []) if (!s.has(mc.id) && !b.has(mc.id)) cats.push(mc); // người dùng thêm hạng mục
  out.categories = cats;
  return out;
}

/* Khi màn tải lại lúc còn thay đổi chưa lưu: màn đã được ghép (mergeBudget: server + phần người dùng đã đổi), nên nền mới = bản server vừa tải.
 * Khi đó (1) chỗ người dùng không đổi: nền = server, nên server đổi cùng một khoản nhiều lần không bị coi là người dùng sửa; (2) chỗ người dùng đã đổi: màn còn giá trị
 * của người dùng khác nền = server, vẫn là "đã đổi"; (3) khoản người dùng đã xoá: nền còn khoản (server có), màn không có, vẫn là "đã xoá"; (4) khoản mới của server
 * (vd vendor_<id>) nằm trong nền và trên màn đã ghép, nên không bị coi là người dùng xoá. Phải gọi SAU khi màn đã nhận bản ghép. `base` giữ trong chữ ký để rõ
 * đây là phép thay nền. */
export function extendBase(base, server) {
  return docToPayload(server);
}
