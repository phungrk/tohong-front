// Checklist templates for Vietnamese wedding planning.
// buildTemplate(daysLeft) returns { phases, rundown } ready to save to the API.
// Template selection: >= 270 days → 12T, >= 180 → 9T, >= 90 → 6T, else → 3T.
// Phase status (done/current/upcoming) is computed from daysLeft at generation time.

const T = {
  // ── Phase 1 tasks ──────────────────────────────────────────────────────────
  budget_align:   { text: 'Thống nhất ngân sách tổng với 2 bên gia đình' },
  pick_date:      { text: 'Xem ngày cưới' },
  guest_draft:    { text: 'Lên danh sách khách mời sơ bộ' },
  venue_deposit:  { text: 'Đặt cọc nhà hàng / địa điểm tiệc', type: 'vendor', cat: 'reception' },
  photo_studio:   { text: 'Chọn studio chụp ảnh cưới + đặt lịch', type: 'vendor', cat: 'photo' },
  health_check:   { text: 'Khám sức khỏe tiền hôn nhân' },
  vaccine:        { text: 'Tiêm vaccine (nữ: HPV + thai sản)' },
  gold_track:     { text: 'Theo dõi giá vàng' },
  register:       { text: 'Đăng ký kết hôn tại phường/xã' },
  church:         { text: 'Liên hệ Nhà thờ/Chùa xin lịch lễ (nếu theo đạo)' },
  // ── Phase 2 tasks ──────────────────────────────────────────────────────────
  pre_wedding:    { text: 'Chụp ảnh pre-wedding', type: 'vendor', cat: 'photo' },
  photo_day:      { text: 'Đặt photographer + videographer ngày cưới', type: 'vendor', cat: 'photo' },
  dress:          { text: 'Chọn & đặt may/thuê váy cưới', type: 'vendor', cat: 'attire' },
  suit:           { text: 'Chọn & may vest chú rể', type: 'vendor', cat: 'attire' },
  makeup_a:       { text: 'Chọn makeup artist + làm tóc', type: 'vendor', cat: 'makeup' },
  dam_ngo:        { text: 'Hai bên gia đình gặp mặt thống nhất (dạm ngõ)' },
  ring:           { text: 'Mua nhẫn cưới' },
  mc_a:           { text: 'Chọn MC đám cưới', type: 'vendor', cat: 'mc' },
  band:           { text: 'Chọn ban nhạc / DJ (nếu có)', type: 'vendor', cat: 'music' },
  // ── Phase 3 tasks (5–3 months) ─────────────────────────────────────────────
  invitation:     { text: 'Thiết kế & in thiệp cưới', type: 'vendor', cat: 'invitation', tip: 'In dư 10–15% so với số khách để phòng nhầm tên, rách, mời thêm phút chót.' },
  decor_a:        { text: 'Chốt đơn vị trang trí (decor)', type: 'vendor', cat: 'decor' },
  flower:         { text: 'Chốt đơn vị hoa cưới', type: 'vendor', cat: 'flower' },
  ao_dai:         { text: 'Chọn áo dài lễ ăn hỏi (cô dâu + chú rể)', type: 'vendor', cat: 'attire' },
  parents_outfit: { text: 'Trang phục bố mẹ 2 bên' },
  bridesmaids:    { text: 'Chọn phù dâu, phù rể + trang phục' },
  tray_team:      { text: 'Tổ chức đội bê tráp' },
  an_hoi_tray:    { text: 'Đặt tráp ăn hỏi + lễ vật' },
  honeymoon_room: { text: 'Chuẩn bị phòng tân hôn' },
  new_home:       { text: 'Chuẩn bị nơi ở chung (nếu chưa có)' },
  car:            { text: 'Đặt xe rước dâu + đưa đón', type: 'vendor', cat: 'car' },
  // ── Late-phase tasks (shared across templates) ─────────────────────────────
  an_hoi_event:   { text: 'Tổ chức lễ ăn hỏi' },
  guest_final:    { text: 'Sàng lọc danh sách khách mời lần cuối' },
  send_invite:    { text: 'Viết thiệp mời + gửi thiệp' },
  confirm_menu:   { text: 'Chốt menu tiệc cưới + xác nhận số bàn' },
  accessories:    { text: 'Mua phụ kiện cô dâu + chú rể' },
  speech:         { text: 'Chọn người đại diện phát biểu 2 họ' },
  red_envelope:   { text: 'Chuẩn bị phong bao lì xì' },
  sound_light:    { text: 'Chốt âm thanh, ánh sáng' },
  vendor_confirm: { text: 'Xác nhận lại tất cả vendor' },
  mc_rehearsal:   { text: 'Tổng duyệt chương trình với MC' },
  dress_final:    { text: 'Thử váy lần cuối' },
  cash_book:      { text: 'Chuẩn bị sổ ghi tiền mừng + phân công người thu', tip: 'Tự ghi hoặc phân công người tin tưởng. Kinh nghiệm thực tế: đưa mẹ ghi → dễ nhầm lẫn, thiếu sót.' },
  seating:        { text: 'Sắp xếp chỗ ngồi bàn tiệc (sơ đồ bàn)' },
  backup:         { text: 'Chuẩn bị đồ dự phòng ngày cưới' },
  altar:          { text: 'Hoàn tất trang trí gia tiên (nếu cưới tại nhà)' },
  rest:           { text: 'Nghỉ ngơi, ngủ sớm, không uống rượu' },
  driver:         { text: 'Nhờ người khác lái xe ngày cưới (nếu đi xa)' },
  morning_ritual: { text: 'Chuẩn bị lễ vật xin dâu sáng ngày cưới' },
  outfit_check:   { text: 'Kiểm tra lại trang phục, phụ kiện, nhẫn, lì xì' },
  room_decor:     { text: 'Trang trí phòng tân hôn hoàn thiện' },
  assign_tasks:   { text: 'Phân công rõ ràng ai làm gì ngày cưới' },
  ekip_food:      { text: 'Chuẩn bị nước/đồ ăn cho ekip sáng sớm' },
  lai_mat:        { text: 'Lễ lại mặt (về thăm nhà gái)' },
  count_gifts:    { text: 'Kiểm đếm + ghi chép lại tiền mừng, quà tặng' },
  final_payment:  { text: 'Thanh toán hết các khoản vendor còn lại' },
  finance_review: { text: 'Tổng kết tài chính: tổng chi – tổng thu' },
  share_photos:   { text: 'Gửi ảnh/video cho gia đình, bạn bè' },
  thank_vendor:   { text: 'Viết tin nhắn cảm ơn vendor tốt' },
  new_finance:    { text: 'Lên kế hoạch tài chính vợ chồng mới cưới' },
};

function makeTasks(defs, phId) {
  return defs.map((d, i) => ({
    id: `${phId}_t${i}`,
    text: d.text,
    done: false,
    type: d.type || 'action',
    ...(d.cat ? { cat: d.cat } : {}),
    ...(d.tip ? { tip: d.tip } : {}),
  }));
}

// Phases for "2-1 tháng" through "Sau cưới", shared by 12T/9T/6T.
// 6T skips "Tổ chức lễ ăn hỏi" (merged into early phase).
function latePhases(pfx, includeAnHoi) {
  const ph4Tasks = [
    ...(includeAnHoi ? [T.an_hoi_event] : []),
    T.guest_final, T.send_invite, T.confirm_menu,
    T.accessories, T.speech, T.red_envelope, T.sound_light,
  ];
  return [
    { id: `${pfx}_ph4`, label: '2–1 tháng trước cưới', _s: 60, _e: 14,
      tasks: makeTasks(ph4Tasks, `${pfx}_ph4`) },
    { id: `${pfx}_ph5`, label: '2 tuần trước cưới', _s: 14, _e: 7,
      tasks: makeTasks([T.vendor_confirm, T.mc_rehearsal, T.dress_final, T.cash_book, T.seating, T.backup, T.altar], `${pfx}_ph5`) },
    { id: `${pfx}_ph6`, label: '1 tuần trước – đêm trước cưới', _s: 7, _e: 0,
      tasks: makeTasks([T.rest, T.driver, T.morning_ritual, T.outfit_check, T.room_decor, T.assign_tasks, T.ekip_food], `${pfx}_ph6`) },
    { id: `${pfx}_ph7`, label: 'Sau cưới', _s: 0, _e: -9999,
      tasks: makeTasks([T.lai_mat, T.count_gifts, T.final_payment, T.finance_review, T.share_photos, T.new_finance], `${pfx}_ph7`) },
  ];
}

// Assigns done/current/upcoming status based on daysLeft thresholds (_s, _e).
// Phase is "done" when daysLeft <= _e, "current" when _e < daysLeft <= _s, "upcoming" otherwise.
// Strips internal _s/_e fields before returning.
function assignStatus(phases, daysLeft) {
  let currentSet = false;
  const result = phases.map((ph) => {
    const { _s, _e, ...rest } = ph;
    let status;
    if (daysLeft > _s) {
      status = 'upcoming';
    } else if (daysLeft <= _e) {
      status = 'done';
    } else if (!currentSet) {
      status = 'current';
      currentSet = true;
    } else {
      status = 'upcoming';
    }
    return { ...rest, status };
  });
  // Fallback: if all phases ended up upcoming (daysLeft > first phase's _s), make the first one current.
  if (!currentSet) {
    const idx = result.findIndex((p) => p.status === 'upcoming');
    if (idx >= 0) result[idx] = { ...result[idx], status: 'current' };
  }
  return result;
}

export const DEFAULT_RUNDOWN = [
  { id: 'rd_0', name: 'Cô dâu makeup từ sáng sớm',                    tag: 'Lễ',   done: false },
  { id: 'rd_1', name: 'Lễ xin dâu',                                    tag: 'Lễ',   done: false },
  { id: 'rd_2', name: 'Lễ vu quy',                                     tag: 'Lễ',   done: false },
  { id: 'rd_3', name: 'Tiệc cưới chính',                               tag: 'Tiệc', done: false },
  { id: 'rd_4', name: 'Ghi tiền mừng cẩn thận',                        tag: 'Tiệc', done: false },
  { id: 'rd_5', name: 'Thanh toán vendor tại chỗ (nếu có khoản cuối)', tag: 'Tiệc', done: false },
];

export function buildTemplate(daysLeft) {
  let raw;

  if (daysLeft >= 270) {
    // ── 12-month template ─────────────────────────────────────────────────────
    raw = [
      { id: 't12_ph1', label: '12–10 tháng trước cưới', _s: 365, _e: 300,
        tasks: makeTasks([T.budget_align, T.pick_date, T.guest_draft, T.venue_deposit,
          T.photo_studio, T.health_check, T.vaccine, T.gold_track, T.register, T.church], 't12_ph1') },
      { id: 't12_ph2', label: '9–6 tháng trước cưới', _s: 300, _e: 180,
        tasks: makeTasks([T.pre_wedding, T.photo_day, T.dress, T.suit, T.makeup_a,
          T.dam_ngo, T.ring, T.mc_a, T.band], 't12_ph2') },
      { id: 't12_ph3', label: '5–3 tháng trước cưới', _s: 180, _e: 60,
        tasks: makeTasks([T.invitation, T.decor_a, T.flower, T.ao_dai, T.parents_outfit,
          T.bridesmaids, T.tray_team, T.an_hoi_tray, T.honeymoon_room, T.new_home, T.car], 't12_ph3') },
      ...latePhases('t12', true),
    ];
  } else if (daysLeft >= 180) {
    // ── 9-month template ──────────────────────────────────────────────────────
    raw = [
      { id: 't9_ph1', label: '9–7.5 tháng trước cưới', _s: 270, _e: 225,
        tasks: makeTasks([T.budget_align, T.pick_date, T.guest_draft, T.venue_deposit,
          T.photo_studio, T.health_check, T.vaccine, T.gold_track, T.register, T.church], 't9_ph1') },
      { id: 't9_ph2', label: '7.5–5 tháng trước cưới', _s: 225, _e: 150,
        tasks: makeTasks([T.pre_wedding, T.photo_day, T.dress, T.suit, T.makeup_a,
          T.dam_ngo, T.ring, T.mc_a, T.band], 't9_ph2') },
      { id: 't9_ph3', label: '4–2.5 tháng trước cưới', _s: 150, _e: 60,
        tasks: makeTasks([T.invitation, T.decor_a, T.flower, T.ao_dai, T.parents_outfit,
          T.bridesmaids, T.tray_team, T.an_hoi_tray, T.honeymoon_room, T.new_home, T.car], 't9_ph3') },
      ...latePhases('t9', true),
    ];
  } else if (daysLeft >= 90) {
    // ── 6-month template (merged tasks, no health_check, no new_home) ─────────
    raw = [
      { id: 't6_ph1', label: '6–4.5 tháng trước cưới', _s: 180, _e: 120,
        tasks: makeTasks([
          T.budget_align, T.pick_date, T.guest_draft, T.venue_deposit,
          { text: 'Book trọn gói ảnh cưới (pre-wedding + ngày cưới)', type: 'vendor', cat: 'photo' },
          T.vaccine, T.gold_track, T.register,
          { text: 'Chọn & đặt trang phục cô dâu + chú rể', type: 'vendor', cat: 'attire' },
          T.makeup_a, T.dam_ngo, T.ring,
          { text: 'Chốt MC + nhạc/band', type: 'vendor', cat: 'mc' },
        ], 't6_ph1') },
      { id: 't6_ph2', label: '3.5–2.5 tháng trước cưới', _s: 120, _e: 60,
        tasks: makeTasks([
          T.invitation,
          { text: 'Chốt đơn vị trang trí + hoa cưới', type: 'vendor', cat: 'decor' },
          T.ao_dai, T.parents_outfit, T.bridesmaids,
          T.tray_team, T.an_hoi_tray, T.honeymoon_room, T.car,
        ], 't6_ph2') },
      // 6T: ăn hỏi was merged into dạm ngõ above, so skip in late phases
      ...latePhases('t6', false),
    ];
  } else {
    // ── 3-month template (weekly phases, also used for < 42 days) ─────────────
    raw = [
      { id: 't3_ph1', label: 'Tuần 1–2', _s: 84, _e: 70,
        tasks: makeTasks([
          T.budget_align, T.pick_date, T.guest_draft,
          { text: 'Chốt nhà hàng + menu tiệc', type: 'vendor', cat: 'reception' },
          { text: 'Book trọn gói ảnh cưới (pre-wedding + ngày cưới)', type: 'vendor', cat: 'photo' },
          T.vaccine, T.register,
        ], 't3_ph1') },
      { id: 't3_ph2', label: 'Tuần 3–4', _s: 70, _e: 56,
        tasks: makeTasks([
          { text: 'Chọn trang phục trọn gói (váy + vest + áo dài ăn hỏi)', type: 'vendor', cat: 'attire' },
          { text: 'Chọn makeup artist (cô dâu + mẹ 2 bên)', type: 'vendor', cat: 'makeup' },
          { text: 'Gặp mặt 2 gia đình + tổ chức ăn hỏi (gộp nếu được)' },
          T.ring, T.mc_a,
        ], 't3_ph2') },
      { id: 't3_ph3', label: 'Tuần 5–6', _s: 56, _e: 42,
        tasks: makeTasks([
          { text: 'Chốt trọn gói trang trí + tráp + xe', type: 'vendor', cat: 'decor',
            tip: 'Gói combo decor + tráp + xe thường rẻ hơn đặt lẻ ~15%. Hỏi kỹ ai dựng – ai dọn để tránh phát sinh.' },
          { text: 'Thiệp cưới: in + gửi ngay', type: 'vendor', cat: 'invitation',
            tip: 'In dư 10–15% so với số khách để phòng nhầm tên, rách, mời thêm phút chót.' },
          T.guest_final, T.confirm_menu,
        ], 't3_ph3') },
      { id: 't3_ph4', label: 'Tuần 7–8', _s: 42, _e: 28,
        tasks: makeTasks([T.speech, T.red_envelope, T.altar, T.honeymoon_room], 't3_ph4') },
      { id: 't3_ph5', label: 'Tuần 9–10', _s: 28, _e: 14,
        tasks: makeTasks([T.vendor_confirm, T.mc_rehearsal, T.dress_final, T.cash_book, T.seating], 't3_ph5') },
      { id: 't3_ph6', label: 'Tuần 11–12', _s: 14, _e: 0,
        tasks: makeTasks([T.rest, T.driver, T.morning_ritual, T.outfit_check, T.assign_tasks, T.ekip_food], 't3_ph6') },
      { id: 't3_ph7', label: 'Sau cưới', _s: 0, _e: -9999,
        tasks: makeTasks([T.lai_mat, T.count_gifts, T.final_payment, T.finance_review, T.share_photos, T.new_finance], 't3_ph7') },
    ];
  }

  return {
    phases: assignStatus(raw, daysLeft),
    rundown: DEFAULT_RUNDOWN,
  };
}
