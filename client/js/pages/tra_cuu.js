/* =====================================================================
   FIABESCO PALACE — js/pages/tra_cuu.js
   Trang Tra cứu đặt bàn & đơn giao (pages/tra_cuu.html).
   Luồng: chọn loại → nhập SĐT → OTP (1 lần cho cả phiên 15 phút) → kết quả
          → hủy bàn / đổi lịch / hủy đơn giao qua component FB_DON.
   - Thành viên đang đăng nhập tra cứu CHÍNH SĐT của mình → bỏ qua OTP;
     tra SĐT khác → vẫn phải OTP như khách.
   - Tham số: ?loai=dat-ban|giao-hang  ?sdt=0901234567
     Demo: ?demo=sat-gio (đặt bàn còn ~5 giờ), ?demo=ban-da-dat (đổi lịch: bàn vừa bị đặt)
           SĐT 0900000000 → không có đơn nào (Figma TH7).
   Mọi chỗ cần máy chủ nằm trong js/data/tra_cuu.js (TODO(BE)).
   ===================================================================== */
document.addEventListener('fb:ready', () => {
  const { $, $$ } = FB;
  const T = window.FB_TRA_CUU, UI = window.FB_DON;
  if (!T || !UI || !window.FB_DAT_BAN) { console.error('Thiếu js/data/tra_cuu.js, js/data/dat_ban.js hoặc js/components/don_dat.js'); return; }
  const API = T.guestApi;
  const fmtPhone = p => { const d = T.normPhone(p); return d.length === 10 ? `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}` : p; };
  const member = () => { try { return JSON.parse(localStorage.getItem('fb_user_v1')); } catch (e) { return null; } }; // dùng chung khoá với popups.js / thanh_vien.js
  const state = { kind: FB.params.get('loai') === 'giao-hang' ? 'giao-hang' : 'dat-ban', phone: '', data: null, otp: null, tick: 0 };

  /* ---------- Chuyển bước ---------- */
  function step(name) {
    $$('[data-step]').forEach(s => { s.hidden = s.dataset.step !== name; });
    if (state.otp && name !== 'otp') { state.otp.destroy(); state.otp = null; }
    if (name !== 'result') clearInterval(state.tick);
    $('.tq-card').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* ---------- Bước 1 · chọn loại + SĐT ---------- */
  const kindBox = $('#tq-kind');
  function setKind(k) {
    state.kind = k;
    $$('[data-kind]', kindBox).forEach(b => { const on = b.dataset.kind === k; b.classList.toggle('is-on', on); b.setAttribute('aria-checked', on); b.tabIndex = on ? 0 : -1; });
  }
  kindBox.addEventListener('click', e => { const b = e.target.closest('[data-kind]'); if (b) setKind(b.dataset.kind); });
  kindBox.addEventListener('keydown', e => { if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) { e.preventDefault(); const k = state.kind === 'dat-ban' ? 'giao-hang' : 'dat-ban'; setKind(k); $(`[data-kind="${k}"]`, kindBox).focus(); } });
  setKind(state.kind);

  const input = $('#tq-phone'), err = $('#tq-phone-err'), send = $('#tq-send');
  const showErr = t => { err.hidden = !t; err.innerHTML = t || ''; input.closest('.tq-input').classList.toggle('is-err', !!t); input.setAttribute('aria-invalid', !!t); };
  input.addEventListener('input', () => { input.value = input.value.replace(/[^\d\s]/g, ''); showErr(''); });
  if (FB.params.get('sdt')) input.value = fmtPhone(FB.params.get('sdt'));

  // Thành viên đang đăng nhập: gợi ý xem nhanh + nút dùng số của mình (không cần OTP)
  const me = member(), myPhone = me && T.isPhone(me.phone || me.id || '') ? T.normPhone(me.phone || me.id) : '';
  if (me) {
    const box = $('#tq-member'); box.hidden = false;
    box.innerHTML = `<span>${FB.icon('user')}</span><div><strong>Xin chào, ${String(me.name || 'thành viên').replace(/[<>&]/g, '')}</strong>
      <small>Đặt bàn và đơn hàng của bạn luôn có sẵn trong mục Thành viên. Ở đây bạn có thể tra cứu cả số điện thoại khác.</small>
      <div class="tq-member__links"><a href="thanh_vien.html#lich-su/dat-ban">Đặt bàn của tôi</a><a href="thanh_vien.html#lich-su/giao-hang">Đơn hàng của tôi</a>${myPhone ? '<button type="button" data-mine>Dùng số của tôi</button>' : ''}</div></div>`;
    const mine = $('[data-mine]', box);
    if (mine) mine.addEventListener('click', () => { input.value = fmtPhone(myPhone); showErr(''); $('#tq-form').requestSubmit(); });
    $('.tq-join').hidden = true;
  }

  $('#tq-form').addEventListener('submit', e => {
    e.preventDefault();
    const raw = input.value.trim();
    if (!raw) { showErr('Vui lòng nhập số điện thoại.'); input.focus(); return; } // TH8 / T06
    if (!T.isPhone(raw)) { showErr('Số điện thoại gồm 10 chữ số và bắt đầu bằng 0, ví dụ 0901 234 567.'); input.focus(); return; }
    if (navigator.onLine === false) { showErr('Mất kết nối mạng. Kiểm tra Wi-Fi hoặc 4G rồi thử lại.'); return; } // TH9 / T10
    state.phone = T.normPhone(raw);
    const s = T.session.get();
    if (s && s.phone === state.phone) return loadResult();             // đã xác minh trong phiên này
    if (myPhone && state.phone === myPhone) { T.guestApi.trustPhone(myPhone); return loadResult(); } // thành viên tra số của mình
    step('otp');
    state.otp = UI.otp($('#tq-otp'), { phone: state.phone, api: API, submitLabel: state.kind === 'dat-ban' ? 'Xác nhận và xem đặt bàn' : 'Xác nhận và xem đơn hàng',
      onVerified: () => loadResult(), onChangePhone: () => { step('form'); input.focus(); input.select(); } });
  });

  /* ---------- Bước 3 · kết quả ---------- */
  const list = $('#tq-list');
  async function loadResult() {
    step('result');
    list.innerHTML = '<div class="tq-skel" aria-busy="true"><i></i><i></i><i></i></div>';
    try { state.data = await API.getHistory(T.session.get()); } // TODO(BE) — xem FB_TRA_CUU.createApi().getHistory
    catch (e) { console.error(e); list.innerHTML = `<div class="dd-empty"><span class="dd-empty__ic">${FB.icon('wifi-off')}</span><h3>Không tải được dữ liệu</h3><p>Kết nối máy chủ gián đoạn. Vui lòng thử lại sau ít phút.</p><button type="button" class="dd-btn dd-btn--navy" data-retry>Thử lại</button></div>`; return; }
    renderResult(); startSessionTimer();
  }
  list.addEventListener('click', e => { if (e.target.closest('[data-retry]')) loadResult(); });

  function renderResult() {
    const d = state.data, nb = d.bookings.length, no = d.orders.length;
    $('[data-count="dat-ban"]').textContent = nb; $('[data-count="giao-hang"]').textContent = no;
    $$('.tq-tabs [data-tab]').forEach(t => { const on = t.dataset.tab === state.kind; t.classList.toggle('is-on', on); t.setAttribute('aria-selected', on); });
    const n = state.kind === 'dat-ban' ? nb : no, what = state.kind === 'dat-ban' ? 'đặt bàn' : 'đơn giao hàng';
    $('#tq-res-title').textContent = n ? `Tìm thấy ${n} ${what}` : `Chưa có ${what} nào`;
    $('#tq-res-sub').innerHTML = `${d.name && (nb || no) ? `Đặt bởi ${d.name} · ` : ''}${T.maskPhone(state.phone)}`;
    list.innerHTML = state.kind === 'dat-ban'
      ? UI.bookingsHtml(d.bookings, { emptyTitle: 'Không tìm thấy đặt bàn', emptyText: `Số ${T.maskPhone(state.phone)} chưa có lượt đặt bàn nào. Kiểm tra lại số điện thoại hoặc đặt bàn mới.` })
      : UI.ordersHtml(d.orders, { emptyTitle: 'Không tìm thấy đơn giao hàng', emptyText: `Số ${T.maskPhone(state.phone)} chưa có đơn đặt món nào. Kiểm tra lại số điện thoại hoặc xem thực đơn.` });
    FB.hydrateIcons(list);
  }
  $$('.tq-tabs [data-tab]').forEach(t => t.addEventListener('click', () => { state.kind = t.dataset.tab; setKind(state.kind); renderResult(); }));
  $('#tq-other').addEventListener('click', () => { T.session.clear(); state.data = null; input.value = ''; step('form'); input.focus(); });

  UI.mount(list, {
    api: API,
    ctx: () => { const s = T.session.get(); return s && s.phone === state.phone ? s : null; },
    // Phiên hết hạn → xác minh lại bằng popup OTP rồi làm tiếp thao tác đang dở
    reverify: cb => UI.openOtp(state.phone, API, s => { startSessionTimer(); cb(s); }),
    find: (kind, code) => state.data && (kind === 'order' ? state.data.orders : state.data.bookings).find(x => x.code === code),
    onChange: async () => { try { state.data = await API.getHistory(T.session.get() || { phone: state.phone }); } catch (e) {} renderResult(); }
  });

  function startSessionTimer() {
    clearInterval(state.tick);
    const el = $('#tq-session'), pad = n => String(n).padStart(2, '0');
    const run = () => {
      const s = T.session.get();
      if (!s) { el.innerHTML = `${FB.icon('lock')}<span>Phiên xác minh đã hết hạn — bạn vẫn xem được, nhưng cần nhập lại mã khi hủy hoặc đổi lịch.</span>`; clearInterval(state.tick); return; }
      const left = Math.max(0, Math.round((s.exp - Date.now()) / 1000));
      el.innerHTML = s.token === 'member' ? `${FB.icon('shield-check')}<span>Đã xác minh bằng tài khoản thành viên.</span>` : `${FB.icon('shield-check')}<span>Đã xác minh · phiên còn <b>${pad(Math.floor(left / 60))}:${pad(left % 60)}</b> để hủy hoặc đổi lịch không cần nhập lại mã.</span>`;
    };
    run(); state.tick = setInterval(run, 1000);
  }

  /* ---------- Khởi tạo: còn phiên → mở thẳng kết quả ---------- */
  const s = T.session.get();
  if (s && (!FB.params.get('sdt') || T.normPhone(FB.params.get('sdt')) === s.phone)) { state.phone = s.phone; input.value = fmtPhone(s.phone); loadResult(); }
  else step('form');
});
