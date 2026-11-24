/* =====================================================================
   FIABESCO PALACE — js/pages/dat_ban.js
   Trang Đặt bàn (Figma › Page PC › "PC – 07 Đặt bàn").
   - Chọn ngày (lịch), suất 90 phút (popup), số khách (1–15, >15 → popup hotline)
   - Sơ đồ 2D 2 tầng + danh sách "chọn nhanh" dọc bên phải
   - Gói trang trí (popup chi tiết), thông tin người đặt, tạm tính 50% cọc
   - Hướng dẫn: popup chào mừng (thu nhỏ thành nút "?") + 6 bước mũi tên
   Dữ liệu & máy chủ: js/data/dat_ban.js (window.FB_DAT_BAN.BookingAPI).
   ⚠ Chỗ cần backend có ghi "TODO(BE)". FE hiện đang giả lập.
   Demo trạng thái: ?demo=ban-da-dat  → giả lập bàn vừa bị người khác đặt khi thanh toán.
   ===================================================================== */
document.addEventListener('fb:ready', () => {
  const { $, $$, icon, money } = FB;
  const D = window.FB_DAT_BAN;
  if (!D) { console.error('Thiếu js/data/dat_ban.js'); return; }
  const API = D.BookingAPI;

  /* TODO(BE): trang PC – 07b "Thanh toán đặt cọc" chưa có. Khi có, đặt tên file
     vào đây (vd. 'thanh_toan_dat_coc.html'); dữ liệu đơn được lưu ở
     sessionStorage['fb_dat_ban_pending'] trước khi chuyển trang. */
  const NEXT_PAGE = null;

  const DRAFT_KEY = 'fb_dat_ban_draft_v1';
  const GUIDE_KEY = 'fb_dat_ban_guide_seen_v1';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const WD = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const pad = n => String(n).padStart(2, '0');
  const parseISO = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const fmtDate = iso => { const d = parseISO(iso); return `${WD[d.getDay()]}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`; };
  const slotById = id => D.SLOTS.find(s => s.id === id);
  const slotLabel = s => `${s.start} – ${s.end}`;
  const today = () => { const t = new Date(); t.setHours(0, 0, 0, 0); return t; };
  const lastDay = () => { const t = today(); t.setDate(t.getDate() + D.BOOK_AHEAD_DAYS); return t; };
  const slotPassed = (iso, s) => { if (iso !== D.isoDate(new Date())) return false; const [h, m] = s.start.split(':').map(Number); const n = new Date(); return n.getHours() * 60 + n.getMinutes() >= h * 60 + m; };

  /* ---------------- Trạng thái ---------------- */
  const state = { date: null, slot: null, guests: 2, floor: 1, table: null, pkg: 'mac_dinh', status: null, prices: D.PRICES, slots: [], reqId: 0 };
  const form = $('#db-form');
  const field = n => form.elements.namedItem(n);

  /* ---------------- Nội dung hướng dẫn ---------------- */
  const GUIDE = [
    { title: 'Chọn ngày, giờ & số khách', short: 'Mở lịch, chọn 1 trong 6 suất 90 phút và số người lớn (tối đa 15).',
      text: 'Nhấn vào “Ngày đặt bàn” và “Thời gian” để mở lịch và danh sách 6 suất 90 phút. Dùng nút − / + hoặc gõ trực tiếp số người lớn (tối đa 15).', target: '#db-quick', side: 'below' },
    { title: 'Chọn tầng & bàn trên sơ đồ', short: 'Chuyển Tầng 1 / Tầng 2 và chạm vào bàn màu trắng.',
      text: 'Chuyển TẦNG 1 / TẦNG 2, rồi chạm vào bàn màu trắng (còn trống). Bàn đang chọn chuyển đỏ Burgundy; bàn xám nâu đã có khách đặt.', target: '#db-tabs', side: 'below' },
    { title: 'Hoặc chọn nhanh', short: 'Cuộn danh sách bàn trống bên phải sơ đồ.',
      text: 'Cuộn danh sách bàn còn trống của tầng đang xem và nhấn “Chọn bàn”. Khi chạm bàn trên sơ đồ, danh sách sẽ tự cuộn tới thẻ tương ứng.', target: '#db-qlist', side: 'left' },
    { title: 'Chọn gói trang trí', short: 'Mặc định, Sinh nhật, Cầu hôn hoặc Gia đình.',
      text: 'Giữ gói Mặc định hoặc chọn Sinh nhật, Cầu hôn, Gia đình. Nhấn “chi tiết ›” để xem nội dung từng gói.', target: '#db-decor', side: 'above' },
    { title: 'Điền thông tin & ghi chú', short: 'Họ tên, số điện thoại và yêu cầu riêng.',
      text: 'Nhập họ tên, số điện thoại và ghi chú cho Quản lý bàn — ví dụ bánh, hoa hay vị trí ngồi mong muốn.', target: '#db-form', side: 'above' },
    { title: 'Thanh toán cọc 50%', short: 'Kiểm tra tạm tính và giữ bàn.',
      text: 'Kiểm tra lại bàn, ngày giờ, phí giữ bàn và gói trang trí. Đặt cọc 50% để giữ bàn; phần còn lại thanh toán tại nhà hàng.', target: '#db-pay', side: 'above' }
  ];
  $('#db-guide-steps').innerHTML = GUIDE.map((g, i) => `<li><span class="db-guide__num"><b>${i + 1}</b><i></i></span><strong>${g.title}</strong><p>${g.short}</p></li>`).join('');

  /* ================= 01 · NGÀY ================= */
  const calBtn = $('#db-date-btn'), cal = $('#db-cal');
  let calMonth = today();
  function renderCal() {
    const y = calMonth.getFullYear(), m = calMonth.getMonth();
    const first = new Date(y, m, 1), start = (first.getDay() + 6) % 7; // tuần bắt đầu Thứ Hai
    const days = new Date(y, m + 1, 0).getDate();
    const min = today(), max = lastDay();
    const canPrev = new Date(y, m, 1) > new Date(min.getFullYear(), min.getMonth(), 1);
    const canNext = new Date(y, m + 1, 1) <= max;
    let cells = '';
    for (let i = 0; i < start; i++) cells += '<span></span>';
    for (let d = 1; d <= days; d++) {
      const dt = new Date(y, m, d), iso = D.isoDate(dt);
      const off = dt < min || dt > max;
      cells += `<button type="button" class="db-cal__day${iso === D.isoDate(min) ? ' is-today' : ''}${iso === state.date ? ' is-active' : ''}" data-date="${iso}" ${off ? 'disabled' : ''} aria-label="${fmtDate(iso)}"${iso === state.date ? ' aria-pressed="true"' : ''}>${d}</button>`;
    }
    cal.innerHTML = `<div class="db-cal__head">
        <button type="button" class="db-cal__nav" data-nav="-1" aria-label="Tháng trước" ${canPrev ? '' : 'disabled'}>${icon('chevron-left')}</button>
        <strong>Tháng ${m + 1}, ${y}</strong>
        <button type="button" class="db-cal__nav" data-nav="1" aria-label="Tháng sau" ${canNext ? '' : 'disabled'}>${icon('chevron-right')}</button></div>
      <div class="db-cal__grid">${['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(w => `<span class="db-cal__wd">${w}</span>`).join('')}${cells}</div>`;
  }
  function openCal() { calMonth = state.date ? parseISO(state.date) : today(); renderCal(); cal.hidden = false; calBtn.setAttribute('aria-expanded', 'true'); (cal.querySelector('.is-active') || cal.querySelector('.db-cal__day:not(:disabled)'))?.focus(); }
  function closeCal(focus) { if (cal.hidden) return; cal.hidden = true; calBtn.setAttribute('aria-expanded', 'false'); if (focus) calBtn.focus(); }
  calBtn.addEventListener('click', () => cal.hidden ? openCal() : closeCal());
  cal.addEventListener('click', e => {
    const nav = e.target.closest('[data-nav]'); if (nav) { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + +nav.dataset.nav, 1); renderCal(); return; }
    const day = e.target.closest('[data-date]'); if (day && !day.disabled) { setDate(day.dataset.date); closeCal(true); if (!state.slot) openSlotPopup(); }
  });
  document.addEventListener('click', e => { if (!cal.hidden && !e.target.closest('#db-cal,#db-date-btn')) closeCal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCal(true); });

  function setDate(iso) {
    state.date = iso;
    $('#db-date-value').textContent = fmtDate(iso); $('#db-date-value').classList.remove('is-empty');
    $('#db-date-btn').closest('.db-quick__cell').classList.remove('is-error');
    if (state.slot && slotPassed(iso, slotById(state.slot))) setSlot(null);
    refreshStatus(); save();
  }

  /* ================= 01 · SUẤT GIỜ ================= */
  function setSlot(id) {
    state.slot = id;
    const v = $('#db-slot-value');
    v.textContent = id ? slotLabel(slotById(id)) : 'Chọn suất'; v.classList.toggle('is-empty', !id);
    if (id) $('#db-slot-btn').closest('.db-quick__cell').classList.remove('is-error');
    refreshStatus(); save();
  }
  async function openSlotPopup() {
    if (!state.date) { openCal(); return; }
    let temp = state.slot;
    const el = ppOpen('db-pp-slot', `<div class="pp-pad">${closeX()}
      <div class="stack" style="gap:4px"><h3 class="t-h3">Chọn giờ đặt bàn</h3><p class="t-body-s c-gray">${fmtDate(state.date)} · 6 suất • Mỗi suất 1 giờ 30 phút</p></div>
      <div class="db-slots" id="db-slots"><p class="t-body-s c-gray">Đang kiểm tra suất còn bàn…</p></div>
      <div class="db-pp-picked"><small>Suất đã chọn</small><strong id="db-slot-picked">${temp ? slotLabel(slotById(temp)) : 'Chưa chọn suất'}</strong></div>
      <button type="button" class="btn btn--navy btn--block" id="db-slot-ok" ${temp ? '' : 'disabled'}>Xác nhận giờ đặt bàn</button></div>`, 'pp-box--480');
    state.slots = await API.getSlots(state.date, state.guests); // TODO(BE) — xem BookingAPI.getSlots
    const box = $('#db-slots', el); if (!box) return;
    box.innerHTML = D.SLOTS.map(s => {
      const st = (state.slots.find(x => x.id === s.id) || {}).status;
      const past = slotPassed(state.date, s), full = st === 'full';
      const note = past ? 'Đã qua giờ' : full ? 'Đã hết bàn' : (s.id === temp ? '●  Đang chọn' : 'Còn bàn');
      return `<button type="button" class="db-slot${s.id === temp ? ' is-active' : ''}" data-slot="${s.id}" ${past || full ? 'disabled' : ''} aria-pressed="${s.id === temp}"><strong>${slotLabel(s)}</strong><small>${note}</small></button>`;
    }).join('');
    box.addEventListener('click', e => {
      const b = e.target.closest('[data-slot]'); if (!b || b.disabled) return;
      temp = b.dataset.slot;
      $$('.db-slot', box).forEach(x => { const on = x === b; x.classList.toggle('is-active', on); x.setAttribute('aria-pressed', on); if (!x.disabled) x.querySelector('small').textContent = on ? '●  Đang chọn' : 'Còn bàn'; });
      $('#db-slot-picked', el).textContent = slotLabel(slotById(temp)); $('#db-slot-ok', el).disabled = false;
    });
    $('#db-slot-ok', el).addEventListener('click', () => { setSlot(temp); FB.closeModal(el); $('#db-slot-btn').focus(); });
  }
  $('#db-slot-btn').addEventListener('click', openSlotPopup);

  /* ================= 01 · SỐ KHÁCH ================= */
  function setGuests(n) {
    state.guests = Math.max(1, Math.min(D.MAX_GUESTS, n));
    $('#db-guests').value = state.guests;
    const t = state.table && D.byId(state.table);
    if (t && t.seats < state.guests) { selectTable(null); info('Bàn đã bỏ chọn', `Bàn ${t.id} chỉ có ${t.seats} chỗ — vui lòng chọn bàn khác cho ${state.guests} khách.`); }
    renderMap(); renderList(); updateSummary(); save();
  }
  $('#db-guests-minus').addEventListener('click', () => setGuests(state.guests - 1));
  $('#db-guests-plus').addEventListener('click', () => { if (state.guests >= D.MAX_GUESTS) openOverPopup(); else setGuests(state.guests + 1); });
  // Nhập trực tiếp: chỉ nhận số, >15 → giữ 15 + popup hotline, để trống/0 → 1 khi rời ô
  const gInput = $('#db-guests');
  gInput.addEventListener('input', () => {
    gInput.value = gInput.value.replace(/\D/g, '').slice(0, 3);
    const n = parseInt(gInput.value, 10);
    if (!n) return; // đang gõ dở
    if (n > D.MAX_GUESTS) { setGuests(D.MAX_GUESTS); openOverPopup(); return; }
    if (n !== state.guests) setGuests(n);
  });
  gInput.addEventListener('blur', () => { if (!parseInt(gInput.value, 10)) setGuests(1); else gInput.value = state.guests; });
  gInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') gInput.blur();
    if (e.key === 'ArrowUp') { e.preventDefault(); if (state.guests >= D.MAX_GUESTS) openOverPopup(); else setGuests(state.guests + 1); }
    if (e.key === 'ArrowDown') { e.preventDefault(); setGuests(state.guests - 1); }
  });
  gInput.addEventListener('focus', () => gInput.select());
  function openOverPopup() {
    ppOpen('db-pp-over', `<div class="pp-pad pp-center">${closeX()}
      <span class="pp-badge pp-badge--wine">15+</span><span class="pp-eyebrow">Số lượng khách</span>
      <h3 class="t-h3">Đoàn trên 15 khách?</h3><p class="t-title c-wine">Hãy để chúng tôi chuẩn bị riêng cho bạn</p>
      <p class="t-body c-gray">Đặt bàn trực tuyến hiện hỗ trợ tối đa 15 khách. Với đoàn đông hơn, vui lòng liên hệ trực tiếp qua hotline để Fiabesco sắp xếp không gian, thực đơn và nhân viên phục vụ riêng cho buổi tiệc của bạn.</p>
      <div class="db-hotline"><span class="pp-eyebrow pp-eyebrow--gray">Hotline</span><strong>${D.HOTLINE}</strong><small class="t-caption c-gray">Phục vụ 9:00 – 22:00 mỗi ngày</small></div>
      <p class="pp-note">Số lượng khách đã được giữ ở mức 15. Bạn vẫn có thể tiếp tục đặt bàn trực tuyến cho tối đa 15 khách.</p>
      <div class="pp-actions"><button type="button" class="btn btn--outline" data-close>Để sau</button><a class="btn btn--wine" href="tel:${D.HOTLINE.replace(/\s/g, '')}">Gọi hotline</a></div></div>`, 'pp-box--480');
  }

  /* ================= 02 · SƠ ĐỒ ================= */
  const mapEl = $('#db-map'), tablesEl = $('#db-map-tables');
  const ready = () => !!(state.date && state.slot);
  const tStatus = t => (state.status && state.status[t.id]) || 'available';
  const fee = t => (state.prices.table[t.feeType] || 0);

  /** Vẽ bàn + ghế theo đúng tỉ lệ ô (đơn vị = px khi sơ đồ rộng 880). */
  function seatSVG(t) {
    const f = D.FLOORS.find(x => x.id === t.floor), W = t.w * 8.8, H = t.h * 8.8 * f.h / f.w, cx = W / 2, cy = H / 2;
    const S = 'stroke="var(--t-stroke)" stroke-width="1"';
    const tbl = (x, y, w, h, r = 2) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="var(--t-fill)" ${S}/>`;
    const chairR = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(w, h) / 2}" fill="var(--t-chair)" ${S}/>`;
    const ring = (n, R, r, rc) => Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2 - Math.PI / 2; return `<circle cx="${cx + Math.cos(a) * R}" cy="${cy + Math.sin(a) * R}" r="${rc}" fill="var(--t-chair)" ${S}/>`; }).join('') + `<circle cx="${cx}" cy="${cy}" r="${r}" fill="var(--t-fill)" ${S}/>`;
    let g = '';
    const m = Math.min(W, H);
    switch (t.shape) {
      case 'r4': g = ring(4, m * 0.40, m * 0.30, m * 0.10); break;
      case 'r8': g = ring(8, m * 0.40, m * 0.30, m * 0.085); break;
      case 'vip': g = ring(t.seats >= 12 ? 12 : 10, m * 0.42, m * 0.32, m * 0.065); break;
      case 'q4': { const cw = W * 0.12, ch = H * 0.24; g = chairR(0, H * 0.18, cw, ch) + chairR(0, H * 0.58, cw, ch) + chairR(W - cw, H * 0.18, cw, ch) + chairR(W - cw, H * 0.58, cw, ch) + tbl(W * 0.16, H * 0.06, W * 0.68, H * 0.88); break; }
      case 'h4': { const cw = W * 0.26, ch = H * 0.18; g = chairR(W * 0.14, 0, cw, ch) + chairR(W * 0.60, 0, cw, ch) + chairR(W * 0.14, H - ch, cw, ch) + chairR(W * 0.60, H - ch, cw, ch) + tbl(W * 0.06, H * 0.22, W * 0.88, H * 0.56); break; }
      case 'v6': { const cw = W * 0.2, ch = H * 0.2; g = [0.1, 0.4, 0.7].map(p => chairR(0, H * p, cw, ch) + chairR(W - cw, H * p, cw, ch)).join('') + tbl(W * 0.22, H * 0.04, W * 0.56, H * 0.92); break; }
      case 'h6': { const cw = W * 0.2, ch = H * 0.2; g = [0.1, 0.4, 0.7].map(p => chairR(W * p, 0, cw, ch) + chairR(W * p, H - ch, cw, ch)).join('') + tbl(W * 0.04, H * 0.22, W * 0.92, H * 0.56); break; }
      case 'b2': { const cw = W * 0.7, ch = H * 0.14; g = chairR(W * 0.15, 0, cw, ch) + chairR(W * 0.15, H - ch, cw, ch) + tbl(W * 0.05, H * 0.16, W * 0.9, H * 0.68); break; }
      default: g = tbl(0, 0, W, H);
    }
    return `<svg viewBox="0 0 ${W.toFixed(1)} ${H.toFixed(1)}" aria-hidden="true">${g}</svg>`;
  }

  /** Bàn tròn: co cỡ chữ mã bàn theo đường kính để không tràn ra ngoài. */
  function labelSize(t) {
    if (!['r4', 'r8', 'vip'].includes(t.shape)) return '';
    const f = D.FLOORS.find(x => x.id === t.floor);
    const diam = Math.min(t.w, t.h * f.h / f.w) * 0.6; // % chiều rộng sơ đồ
    const cap = t.shape === 'r4' ? 0.9 : 1.3;
    return ` style="font-size:${Math.min(cap, diam / 2.6).toFixed(2)}cqw"`;
  }
  function renderMap() {
    const floor = D.FLOORS.find(f => f.id === state.floor);
    mapEl.setAttribute('aria-label', 'Sơ đồ ' + floor.name);
    $('#db-map-empty').hidden = ready();
    tablesEl.innerHTML = D.tables.filter(t => t.floor === state.floor).map(t => {
      const st = tStatus(t), small = t.seats < state.guests, sel = state.table === t.id;
      const booked = ready() && st === 'booked';
      const label = `Bàn ${t.id}, ${t.seats} chỗ, ${t.zone}` + (booked ? ', đã được đặt' : small ? `, không đủ chỗ cho ${state.guests} khách` : sel ? ', đang chọn' : ', còn trống');
      const cls = ['db-seat', 'db-seat--' + t.shape, sel ? 'is-selected' : '', booked ? 'is-booked' : '', !booked && small ? 'is-small' : ''].join(' ');
      return `<button type="button" class="${cls}" data-id="${t.id}" style="left:${t.x}%;top:${t.y}%;width:${t.w}%;height:${t.h}%" aria-label="${label}" title="${label}" aria-pressed="${sel}" ${booked || small || !ready() ? 'disabled' : ''}>${seatSVG(t)}<span class="db-seat__id"${labelSize(t)}>${t.id}</span></button>`;
    }).join('');
  }
  tablesEl.addEventListener('click', e => { const b = e.target.closest('.db-seat'); if (b && !b.disabled) selectTable(b.dataset.id, 'map'); });

  $$('#db-tabs .db-tab').forEach(tab => tab.addEventListener('click', () => setFloor(+tab.dataset.floor)));
  $('#db-tabs').addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const n = state.floor === 1 ? 2 : 1; setFloor(n); $(`#db-tabs [data-floor="${n}"]`).focus(); } });
  function setFloor(n) {
    state.floor = n;
    $$('#db-tabs .db-tab').forEach(x => { const on = +x.dataset.floor === n; x.classList.toggle('is-active', on); x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; });
    const fl = D.FLOORS.find(f => f.id === n);
    $('#db-map-bg').src = fl.img; mapEl.style.aspectRatio = fl.w + ' / ' + fl.h;
    renderMap(); renderList(); save();
  }

  /** Gọi máy chủ lấy trạng thái bàn mỗi khi đổi ngày / suất. */
  async function refreshStatus() {
    if (!ready()) { state.status = null; renderMap(); renderList(); updateSummary(); return; }
    const id = ++state.reqId;
    $('#db-map-loading').hidden = false;
    try {
      const st = await API.getTableStatus(state.date, state.slot, state.guests); // TODO(BE) — xem BookingAPI.getTableStatus
      if (id !== state.reqId) return; // đã có yêu cầu mới hơn
      state.status = st;
      if (state.table && st[state.table] === 'booked') { const was = state.table; selectTable(null); info('Bàn không còn trống', `Bàn ${was} đã có khách vào suất này — vui lòng chọn bàn khác.`); }
    } catch (err) {
      console.error(err); info('Không tải được sơ đồ', 'Vui lòng kiểm tra kết nối và thử lại.');
    } finally { if (id === state.reqId) $('#db-map-loading').hidden = true; }
    renderMap(); renderList(); updateSummary();
  }

  /* ================= 02 · CHỌN NHANH ================= */
  function renderList() {
    const box = $('#db-qlist-items');
    const floor = D.FLOORS.find(f => f.id === state.floor).name;
    if (!ready()) { $('#db-qlist-sub').textContent = 'Danh sách theo tầng đang xem'; box.innerHTML = `<p class="db-qlist__empty">Chọn ngày và suất giờ để xem bàn còn trống ở ${floor}.</p>`; return; }
    const list = D.tables.filter(t => t.floor === state.floor && tStatus(t) === 'available' && t.seats >= state.guests);
    $('#db-qlist-sub').textContent = `${list.length} bàn trống ở ${floor} cho ${state.guests} khách`;
    box.innerHTML = list.length ? list.map(t => {
      const sel = state.table === t.id;
      return `<article class="db-qcard${sel ? ' is-selected' : ''}" data-id="${t.id}">
        <div class="db-qcard__top"><span class="db-qcard__id">${t.id}</span><span class="db-qcard__fee">${money(fee(t))}</span></div>
        <span class="db-qcard__meta">${t.seats} khách</span><span class="db-qcard__zone">${t.zone}</span>
        <button type="button" class="btn ${sel ? 'btn--wine' : 'btn--navy'}" data-pick="${t.id}" aria-pressed="${sel}">${sel ? 'Đang chọn' : 'Chọn bàn'}</button></article>`;
    }).join('') : `<p class="db-qlist__empty">${floor} không còn bàn phù hợp ${state.guests} khách ở suất này. Hãy thử tầng còn lại hoặc suất giờ khác.</p>`;
  }
  $('#db-qlist-items').addEventListener('click', e => { const b = e.target.closest('[data-pick]'); if (b) selectTable(b.dataset.pick, 'list'); });

  function selectTable(id, from) {
    state.table = id;
    renderMap(); renderList(); updateSummary(); save();
    if (!id) return;
    $('#db-map-tables').closest('.db-sec')?.classList.remove('is-error');
    if (from === 'map') { // giống prototype: chạm bàn → danh sách tự cuộn tới thẻ
      const card = $(`.db-qcard[data-id="${id}"]`), box = $('#db-qlist-items');
      if (card) {
        if (box.scrollHeight > box.clientHeight) box.scrollTop = card.offsetTop - box.offsetTop - 8;
        else box.scrollLeft = card.offsetLeft - box.offsetLeft - 8;
        card.classList.add('is-flash'); setTimeout(() => card.classList.remove('is-flash'), 1300);
      }
    } else if (from === 'list') {
      const seat = $(`.db-seat[data-id="${id}"]`); if (seat) { seat.classList.add('is-flash'); setTimeout(() => seat.classList.remove('is-flash'), 2100); }
    }
  }

  /* ================= 03 · GÓI TRANG TRÍ ================= */
  function pkgPrice(p) { const v = state.prices.pkg[p.id] || 0; return v ? money(v) : 'Miễn phí'; }
  function renderDecor() {
    $('#db-decor').innerHTML = D.PACKAGES.map(p => {
      const on = state.pkg === p.id;
      return `<div class="db-pkg${on ? ' is-active' : ''}" data-pkg="${p.id}">
        <img src="${p.img}" alt="" loading="lazy">
        <button type="button" class="db-pkg__pick" role="radio" aria-checked="${on}" aria-label="Gói ${p.title} – ${pkgPrice(p)}" data-pick-pkg="${p.id}"></button>
        <span class="db-pkg__tick">${icon('check')}</span>
        <div class="db-pkg__body"><div class="db-pkg__name">${p.name}</div><div class="db-pkg__cost">${pkgPrice(p)}</div>
          <div class="db-pkg__foot"><button type="button" class="db-pkg__more" data-more="${p.id}">chi tiết ${icon('chevron-right')}</button></div></div></div>`;
    }).join('');
  }
  $('#db-decor').addEventListener('click', e => {
    const more = e.target.closest('[data-more]'); if (more) { openPkgPopup(more.dataset.more); return; }
    const pick = e.target.closest('[data-pick-pkg]'); if (pick) setPkg(pick.dataset.pickPkg);
  });
  function setPkg(id) { state.pkg = id; renderDecor(); updateSummary(); save(); }
  function openPkgPopup(id) {
    const p = D.PACKAGES.find(x => x.id === id); const v = state.prices.pkg[id] || 0;
    const el = ppOpen('db-pp-pkg', `${closeX(true)}<div class="db-pkgpp__media"><img src="${p.img}" alt="Gói ${p.title}"></div>
      <div class="pp-pad db-pkgpp" style="gap:14px">
        <div class="db-pkgpp__head"><span class="pp-eyebrow">Gói trang trí</span><span class="db-pkgpp__cost">${v ? FB.vnd(v) + ' <small>VND</small>' : 'Miễn phí'}</span></div>
        <h3 class="t-h3">${p.title}</h3><p class="db-pkgpp__tag">${p.tagline}</p>
        <p class="t-body">${p.desc}</p>
        <strong class="t-title">Gói bao gồm</strong>
        <ul>${p.items.map(i => `<li>${icon('check')}<span>${i}</span></li>`).join('')}</ul>
        <p class="db-pkgpp__note">${p.note}</p>
        <div class="pp-actions"><button type="button" class="btn btn--outline" data-close>Để sau</button><button type="button" class="btn btn--navy" id="db-pkg-ok">${state.pkg === id ? 'Đang chọn gói này' : 'Chọn gói này'}</button></div></div>`, 'pp-box--500');
    $('#db-pkg-ok', el).addEventListener('click', () => { setPkg(id); FB.closeModal(el); });
  }

  /* ================= 05 · TẠM TÍNH ================= */
  function calc() {
    const t = state.table && D.byId(state.table);
    const tableFee = t ? fee(t) : 0, pkgFee = state.prices.pkg[state.pkg] || 0;
    const total = tableFee + pkgFee;
    return { tableFee, pkgFee, total, deposit: Math.round(total * D.DEPOSIT_RATE) };
  }
  function updateSummary() {
    const t = state.table && D.byId(state.table), c = calc(), p = D.PACKAGES.find(x => x.id === state.pkg);
    $('#sum-table').innerHTML = t ? `${t.id}<small>${t.zone} · Tầng ${t.floor} · ${t.seats} chỗ</small>` : 'Chưa chọn';
    $('#sum-time').innerHTML = state.date ? `${fmtDate(state.date)}<small>${state.slot ? slotLabel(slotById(state.slot)) : 'Chưa chọn suất'}</small>` : 'Chưa chọn';
    $('#sum-guests').textContent = state.guests + ' người lớn';
    $('#sum-fee').textContent = money(c.tableFee);
    $('#sum-pkg').textContent = `${p.name} · ${c.pkgFee ? money(c.pkgFee) : 'Miễn phí'}`;
    $('#sum-total').textContent = money(c.total);
    $('#sum-deposit').textContent = money(c.deposit);
  }

  /* ================= THANH TOÁN CỌC ================= */
  function validate() {
    const miss = [];
    const cellErr = (sel, bad) => $(sel).closest('.db-quick__cell').classList.toggle('is-error', bad);
    cellErr('#db-date-btn', !state.date); if (!state.date) miss.push('Ngày đặt bàn');
    cellErr('#db-slot-btn', !state.slot); if (!state.slot) miss.push('Suất giờ');
    if (!state.table) miss.push('Bàn trên sơ đồ');
    const okName = field('name').value.trim() !== '', okPhone = FB.isPhone(field('phone').value);
    form.querySelector('[data-req="name"]').classList.toggle('is-error', !okName); if (!okName) miss.push('Họ và tên');
    form.querySelector('[data-req="phone"]').classList.toggle('is-error', !okPhone); if (!okPhone) miss.push('Số điện thoại hợp lệ');
    const box = $('#db-missing');
    box.hidden = !miss.length;
    box.innerHTML = miss.length ? `Vui lòng bổ sung:<ul>${miss.map(m => `<li>${m}</li>`).join('')}</ul>` : '';
    return miss;
  }
  form.addEventListener('input', e => { const f = e.target.closest('.field'); if (f) f.classList.remove('is-error'); save(); });
  form.addEventListener('submit', e => e.preventDefault());

  /** Dữ liệu gửi BE. TODO(BE): thống nhất tên trường với API POST /api/dat-ban. */
  function buildPayload() {
    const c = calc();
    return {
      date: state.date, slotId: state.slot, slot: slotLabel(slotById(state.slot)),
      guests: state.guests, tableId: state.table, floor: D.byId(state.table).floor,
      packageId: state.pkg,
      customer: { name: field('name').value.trim(), phone: FB.normPhone(field('phone').value), note: field('note').value.trim() },
      preview: c // chỉ để hiển thị — BE phải tự tính lại
    };
  }
  $('#db-pay').addEventListener('click', async () => {
    const miss = validate();
    if (miss.length) {
      const first = !state.date || !state.slot ? '#db-quick' : !state.table ? '#db-map' : '#db-form';
      $(first).scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const btn = $('#db-pay'); btn.classList.add('is-loading'); btn.textContent = 'Đang giữ bàn…';
    let res;
    try { res = await API.createBooking(buildPayload()); } // TODO(BE) — xem BookingAPI.createBooking
    catch (err) { console.error(err); res = { ok: false, code: 'NETWORK' }; }
    btn.classList.remove('is-loading'); btn.textContent = 'Thanh toán cọc';
    if (res.ok) return onBooked(res);
    if (res.code === 'TABLE_TAKEN') return openTakenPopup(res.tableId || state.table);
    FB.modal({ id: 'db-pp-err', icon: 'alert-triangle', tone: 'wine', title: 'Chưa giữ được bàn', desc: res.message || 'Có lỗi khi kết nối máy chủ. Vui lòng thử lại sau ít phút hoặc gọi hotline ' + D.HOTLINE + '.', actions: [{ label: 'Đóng', style: 'navy' }] });
    FB.openModal('db-pp-err');
  });
  function onBooked(res) {
    const payload = buildPayload();
    try { sessionStorage.setItem('fb_dat_ban_pending', JSON.stringify({ ...res, ...payload })); } catch (e) {}
    try { sessionStorage.removeItem(DRAFT_KEY); } catch (e) {}
    if (NEXT_PAGE) { location.href = NEXT_PAGE + '?ma=' + encodeURIComponent(res.bookingId); return; }
    const t = D.byId(payload.tableId);
    FB.modal({ id: 'db-pp-ok', icon: 'check', tone: 'green', title: `Đã giữ bàn ${t.id} trong ${D.HOLD_MINUTES} phút`,
      desc: `${fmtDate(payload.date)} · ${payload.slot} · ${payload.guests} khách. Mã giữ chỗ <b>${esc(res.bookingId)}</b>. Tiền cọc cần thanh toán: <b>${money(res.deposit)}</b>.`,
      extra: '<p class="pp-note" style="background:var(--cream-2);color:var(--gray)">Bản demo: bước “Thanh toán đặt cọc” (PC – 07b) sẽ được nối khi trang này hoàn thiện.</p>',
      actions: [{ label: 'Đóng', style: 'navy' }] });
    FB.openModal('db-pp-ok');
  }
  function openTakenPopup(id) {
    if (state.status) state.status[id] = 'booked';
    selectTable(null);
    const el = ppOpen('db-pp-taken', `<div class="pp-pad pp-center">${closeX()}
      <span class="pp-badge pp-badge--wine">!</span><span class="pp-eyebrow">Thanh toán đặt cọc</span>
      <h3 class="t-h3">Bàn này vừa được đặt</h3><p class="t-title c-wine">Rất tiếc, đã có khách nhanh hơn một chút</p>
      <div class="db-taken"><span class="t-body-s c-gray">Bàn</span><b>${esc(id)}</b><span class="t-body-s c-gray">· Đã có người đặt</span></div>
      <p class="t-body c-gray">Trong lúc bạn đang chọn bàn hoặc thực hiện thanh toán, bàn này đã được một khách khác đặt trước. Giao dịch đặt cọc của bạn chưa được thực hiện và bạn chưa bị trừ tiền.</p>
      <p class="pp-note">Vui lòng chọn một bàn khác còn trống trên sơ đồ hoặc ở mục “Chọn nhanh bàn còn trống”. Thông tin bạn đã nhập vẫn được giữ nguyên.</p>
      <div class="pp-actions"><button type="button" class="btn btn--outline" data-close>Đóng</button><button type="button" class="btn btn--navy" id="db-taken-pick">Chọn bàn khác</button></div></div>`, 'pp-box--480');
    $('#db-taken-pick', el).addEventListener('click', () => { FB.closeModal(el); $('#db-map').scrollIntoView({ behavior: 'smooth', block: 'center' }); });
  }

  /* ================= POPUP DÙNG CHUNG ================= */
  function ppOpen(id, html, cls = '') {
    let el = document.getElementById(id); if (el) el.remove();
    el = document.createElement('div'); el.className = 'modal'; el.id = id;
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
    el.innerHTML = `<div class="pp-box ${cls}">${html}</div>`;
    document.body.appendChild(el); FB.hydrateIcons(el); FB.openModal(id);
    const f = el.querySelector('button:not(.pp-x),a.btn,input'); if (f) setTimeout(() => f.focus({ preventScroll: true }), 60);
    return el;
  }
  const closeX = white => `<button type="button" class="pp-x${white ? ' pp-x--white' : ''}" data-close aria-label="Đóng">${icon('close')}</button>`;
  const info = (title, text) => FB.toast(title, text, null, null, 'navy');

  /* ================= HƯỚNG DẪN ================= */
  const fab = $('#db-fab');
  function markSeen() { try { localStorage.setItem(GUIDE_KEY, '1'); } catch (e) {} }
  function openWelcome() {
    endCoach(true);
    const el = ppOpen('db-pp-guide', `<div class="pp-pad db-welcome" style="gap:16px">
      <button type="button" class="pp-x" id="db-guide-min" aria-label="Thu nhỏ hướng dẫn" title="Thu nhỏ">${icon('minus')}</button>
      <span class="pp-eyebrow">Hướng dẫn đặt bàn</span>
      <h3 class="t-h2" style="font-size:34px">Chào mừng đến Fiabesco Palace</h3>
      <p class="t-body c-gray">Chỉ 6 bước để giữ bàn cho bữa tối của bạn. Xem hướng dẫn nhanh — các mũi tên sẽ chỉ trực tiếp vào từng nút trên trang.</p>
      <ol class="db-welcome__steps">${GUIDE.map((g, i) => `<li><b>${i + 1}</b>${g.title}</li>`).join('')}</ol>
      <div class="pp-actions"><button type="button" class="btn btn--wine" id="db-guide-go">Bắt đầu hướng dẫn</button><button type="button" class="btn btn--outline" id="db-guide-self">Tôi sẽ tự khám phá</button></div>
      <p class="t-caption c-gray">Bạn có thể thu nhỏ hướng dẫn và mở lại bất cứ lúc nào bằng biểu tượng ? ở góc dưới bên phải màn hình.</p></div>`, 'pp-box--560');
    const minimize = () => { markSeen(); FB.closeModal(el); fab.classList.add('is-pulse'); setTimeout(() => fab.classList.remove('is-pulse'), 5000); fab.focus(); };
    $('#db-guide-min', el).addEventListener('click', minimize);
    $('#db-guide-self', el).addEventListener('click', minimize);
    $('#db-guide-go', el).addEventListener('click', () => { markSeen(); FB.closeModal(el); startCoach(0); });
    el.addEventListener('click', e => { if (e.target === el) markSeen(); });
  }
  fab.addEventListener('click', openWelcome);
  $('#db-guide-start').addEventListener('click', () => { markSeen(); startCoach(0); });

  const coach = $('#db-coach'), ring = $('#db-coach-ring'), tip = $('#db-coach-tip');
  let step = -1, posTimer;
  function startCoach(i) { closeCal(); coach.hidden = false; showStep(i); document.addEventListener('keydown', coachKeys); }
  function endCoach(silent) {
    if (step < 0) return;
    step = -1; coach.hidden = true; document.removeEventListener('keydown', coachKeys);
    if (!silent) { info('Đã đóng hướng dẫn', 'Mở lại bất cứ lúc nào bằng nút ? ở góc phải màn hình.'); fab.classList.add('is-pulse'); setTimeout(() => fab.classList.remove('is-pulse'), 5000); }
  }
  function coachKeys(e) {
    if (e.key === 'Escape') endCoach();
    else if (e.key === 'ArrowRight' && step < GUIDE.length - 1) showStep(step + 1);
    else if (e.key === 'ArrowLeft' && step > 0) showStep(step - 1);
  }
  function showStep(i) {
    step = i; const g = GUIDE[i], last = i === GUIDE.length - 1;
    tip.innerHTML = `<span class="db-coach__step">Bước ${i + 1} / ${GUIDE.length}</span>
      <h3 class="db-coach__title" id="db-coach-title">${g.title}</h3><p class="db-coach__text">${g.text}</p>
      <div class="db-coach__dots" aria-hidden="true">${GUIDE.map((_, k) => `<i class="${k === i ? 'is-on' : ''}"></i>`).join('')}</div>
      <div class="db-coach__foot"><button type="button" class="db-coach__skip" data-c="skip">${last ? 'Đóng' : 'Bỏ qua hướng dẫn'}</button>
        ${i ? '<button type="button" class="db-coach__prev" data-c="prev">‹ Trước</button>' : ''}
        <button type="button" class="db-coach__next" data-c="next">${last ? 'Hoàn tất ✓' : 'Tiếp theo ›'}</button></div>
      ${last ? '<p class="db-coach__hint">Mở lại hướng dẫn bất cứ lúc nào bằng biểu tượng ? ở góc dưới bên phải.</p>' : ''}`;
    const target = $(g.target);
    target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    clearTimeout(posTimer); position(); posTimer = setTimeout(() => { position(); tip.querySelector('[data-c="next"]').focus({ preventScroll: true }); }, 450);
  }
  tip.addEventListener('click', e => {
    const c = e.target.closest('[data-c]'); if (!c) return;
    if (c.dataset.c === 'skip') endCoach();
    else if (c.dataset.c === 'prev') showStep(step - 1);
    else if (step === GUIDE.length - 1) endCoach();
    else showStep(step + 1);
  });
  function position() {
    if (step < 0) return;
    const g = GUIDE[step], r = $(g.target).getBoundingClientRect(), P = 8, gap = 18;
    const vw = innerWidth, vh = innerHeight;
    ring.style.cssText = `left:${r.left - P}px;top:${r.top - P}px;width:${r.width + 2 * P}px;height:${r.height + 2 * P}px`;
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    const fits = { below: r.bottom + P + gap + th < vh, above: r.top - P - gap - th > 0, left: r.left - P - gap - tw > 0, right: r.right + P + gap + tw < vw };
    const order = [g.side, 'below', 'above', 'left', 'right'];
    const side = order.find(s => fits[s]) || 'below';
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    let x, y;
    if (side === 'below' || side === 'above') {
      x = clamp(r.left, 16, vw - tw - 16);
      y = side === 'below' ? Math.min(r.bottom + P + gap, vh - th - 8) : Math.max(r.top - P - gap - th, 8);
      tip.style.setProperty('--arrow-x', clamp(r.left + Math.min(r.width / 2, 60) - x - 8, 16, tw - 32) + 'px');
    } else {
      y = clamp(r.top, 16, vh - th - 16);
      x = side === 'left' ? r.left - P - gap - tw : r.right + P + gap;
      tip.style.setProperty('--arrow-y', clamp(r.top + 24 - y, 16, th - 32) + 'px');
    }
    tip.dataset.side = side; tip.style.left = x + 'px'; tip.style.top = y + 'px';
  }
  addEventListener('scroll', () => step >= 0 && position(), { passive: true });
  addEventListener('resize', () => step >= 0 && position());

  /* ================= LƯU NHÁP & NHẬN THAM SỐ ================= */
  function save() {
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ date: state.date, slot: state.slot, guests: state.guests, floor: state.floor, table: state.table, pkg: state.pkg,
      name: field('name').value, phone: field('phone').value, note: field('note').value })); } catch (e) {}
  }
  function restore() {
    let d = null; try { d = JSON.parse(sessionStorage.getItem(DRAFT_KEY)); } catch (e) {}
    const q = FB.params; // từ form "Đặt bàn nhanh" ở trang chủ: ?date=YYYY-MM-DD&time=HH:MM&guests=N&phone=…
    const inRange = iso => { if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || '')) return false; const x = parseISO(iso); return x >= today() && x <= lastDay(); };
    const date = inRange(q.get('date')) ? q.get('date') : d && inRange(d.date) ? d.date : null;
    let slot = d && d.date === date ? d.slot : null;
    const time = q.get('time');
    if (/^\d{1,2}:\d{2}$/.test(time || '')) {
      const mins = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; }; const t = mins(time);
      slot = (D.SLOTS.find(s => t >= mins(s.start) && t < mins(s.end)) || D.SLOTS.reduce((a, s) => Math.abs(mins(s.start) - t) < Math.abs(mins(a.start) - t) ? s : a)).id;
    }
    state.guests = Math.max(1, Math.min(D.MAX_GUESTS, +(q.get('guests') || (d && d.guests) || 2) || 2));
    $('#db-guests').value = state.guests;
    if (d) { state.pkg = D.PACKAGES.some(p => p.id === d.pkg) ? d.pkg : 'mac_dinh'; field('name').value = d.name || ''; field('phone').value = d.phone || ''; field('note').value = d.note || ''; }
    if (q.get('phone')) field('phone').value = q.get('phone');
    if (d && d.floor === 2) setFloor(2);
    if (date) { state.date = date; $('#db-date-value').textContent = fmtDate(date); $('#db-date-value').classList.remove('is-empty'); }
    if (date && slot && !slotPassed(date, slotById(slot))) { state.slot = slot; $('#db-slot-value').textContent = slotLabel(slotById(slot)); $('#db-slot-value').classList.remove('is-empty'); }
    if (d && d.table && date === d.date && state.slot === d.slot) state.table = d.table;
  }

  /* ================= KHỞI TẠO ================= */
  (async () => {
    renderDecor(); restore(); renderDecor();
    renderMap(); renderList(); updateSummary();
    try { state.prices = await API.getPrices(); } catch (e) { console.warn('Dùng giá mặc định', e); } // TODO(BE) — xem BookingAPI.getPrices
    renderDecor(); renderList(); updateSummary();
    await refreshStatus();
    // Kích thước cột "chọn nhanh" bám theo chiều cao sơ đồ
    const syncH = () => document.documentElement.style.setProperty('--db-qlist-h', $('.db-mapwrap').offsetHeight + 'px');
    syncH(); addEventListener('resize', syncH); $('#db-map-bg').addEventListener('load', syncH);
    let seen = false; try { seen = localStorage.getItem(GUIDE_KEY) === '1'; } catch (e) {}
    if (!seen && FB.demo !== 'ban-da-dat') setTimeout(openWelcome, 800);
  })();
});
