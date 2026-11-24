/* =====================================================================
   FIABESCO PALACE — js/pages/thanh_toan_dat_coc.js
   Trang Thanh toán đặt cọc (Figma › Page PC › "PC – 07b", 2 phương thức).
   - Đọc đơn giữ bàn do trang Đặt bàn để lại (sessionStorage 'fb_dat_ban_pending')
   - Đồng hồ giữ bàn 5 phút → hết giờ hiện popup "Hết thời gian giữ chỗ"
   - VietQR: tạo mã ngay trên trình duyệt (không gọi dịch vụ ngoài, không tốn phí)
   - Ví điện tử: cùng mã VietQR, hướng dẫn quét theo từng ví
   - "Tôi đã chuyển khoản": chỉ GHI NHẬN lời báo của khách — xác nhận tiền
     về là việc của backend, để phát triển sau (TODO(BE) trong DepositAPI).
   Demo: ?demo=mau  → dùng đơn mẫu (mở trang trực tiếp không qua Đặt bàn)
         ?demo=het-gio → đơn mẫu, đồng hồ chỉ còn 10 giây để xem popup hết giờ
   ===================================================================== */
document.addEventListener('fb:ready', () => {
  const { $, $$, icon, money } = FB;
  const P = window.FB_DAT_COC, D = window.FB_DAT_BAN;
  if (!P || !D || !window.FB_QR) { console.error('Thiếu js/data/thanh_toan_dat_coc.js, js/data/dat_ban.js hoặc js/vendor/qrcode.js'); return; }
  const API = P.DepositAPI;

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = n => String(n).padStart(2, '0');
  const WD = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const fmtDate = iso => { const [y, m, d] = iso.split('-').map(Number); const t = new Date(y, m - 1, d); return `${WD[t.getDay()]}, ${pad(d)}/${pad(m)}/${y}`; };
  const fmtPhone = p => String(p || '').replace(/^(\d{4})(\d{3})(\d+)$/, '$1 $2 $3');
  const fmtAcc = a => String(a).replace(/^(\d{4})(\d{4})(\d+)$/, '$1 $2 $3'); // 0071 0012 34567
  const helpTel = D.HOTLINE.replace(/\s/g, '');

  const state = { booking: null, method: null, wallet: P.WALLETS[0].id, qrText: '', timer: null, expired: false, sending: false, reported: false };

  /* ================= KHỞI TẠO ================= */
  $('#tc-help-line').textContent = `Hotline ${D.HOTLINE} · 9:00 – 22:00 mỗi ngày`;
  $('#tc-help').href = 'tel:' + helpTel;
  init();
  async function init() {
    const id = FB.params.get('ma');
    let b = null;
    try { b = await API.getBooking(id); } catch (e) { console.error(e); }
    if (!b) return openNoBooking();
    state.booking = b;
    renderSummary();
    renderTransfer();
    const rep = API.getReport(b.bookingId);
    if (rep) { setMethod(rep.method); if (rep.wallet) { state.wallet = rep.wallet; renderWallet(); } markReported(); }
    else startTimer();
  }

  /* ================= TÓM TẮT (cột phải) ================= */
  function renderSummary() {
    const b = state.booking, t = D.byId(b.tableId) || { id: b.tableId, floor: b.floor, seats: b.guests, shape: '', zone: '' };
    const pre = b.preview || {};
    const zoneKey = String(t.id).split('-')[0], zi = P.ZONE_INFO[zoneKey] || P.ZONE_INFO.T;
    const pkg = D.PACKAGES.find(p => p.id === b.packageId) || D.PACKAGES[0];
    $('#tc-seat-bg').style.backgroundImage = `url("${zi.img}")`;
    $('#tc-seat-id').textContent = t.id;
    $('#tc-seat-floor').textContent = `Tầng ${t.floor}`;
    $('#tc-seat-seats').textContent = `${t.seats} khách`;
    $('#tc-seat-desc').textContent = `${P.SHAPE_NAME[t.shape] || 'Bàn'} ${zi.desc}`;
    $('#tc-date').textContent = fmtDate(b.date);
    $('#tc-slot').textContent = b.slot;
    $('#tc-guests').textContent = `${b.guests} người lớn`;
    $('#tc-pkg').textContent = pkg.name;
    $('#tc-person').textContent = `${b.customer.name} · ${fmtPhone(b.customer.phone)}`;
    $('#tc-fee-table').textContent = money(pre.tableFee || 0);
    $('#tc-fee-pkg').textContent = pre.pkgFee ? money(pre.pkgFee) : 'Miễn phí';
    $('#tc-total').innerHTML = moneyBig(b.total);
    $('#tc-deposit').innerHTML = moneyBig(b.deposit);
  }
  const moneyBig = n => `${FB.vnd(n)}<small>VND</small>`;

  /* ================= THÔNG TIN CHUYỂN KHOẢN + QR ================= */
  function renderTransfer() {
    const b = state.booking, bank = P.BANK;
    const content = P.transferContent(b.bookingId);
    state.qrText = P.buildVietQR({ amount: b.deposit, content });
    $('#tc-bank').textContent = bank.bankName;
    $('#tc-acc-name').textContent = bank.accountName;
    $$('[data-acc-name]').forEach(e => { e.textContent = bank.accountName; });
    $('#tc-acc-no').textContent = fmtAcc(bank.accountNo);
    $('#tc-amount').textContent = money(b.deposit);
    $('#tc-content').textContent = content;
    $$('[data-qr]').forEach(el => { el.innerHTML = qrSVG(state.qrText); });
    if (bank.demo) $$('.tc-qrbox').forEach(box => {
      if (!box.querySelector('.tc-demo')) box.insertAdjacentHTML('afterbegin', '<span class="tc-demo" title="Đổi BANK trong js/data/thanh_toan_dat_coc.js">Tài khoản minh hoạ</span>');
    });
  }
  /** Vẽ QR thành SVG (1 path) — sắc nét ở mọi kích thước. */
  function qrSVG(text) {
    const qr = FB_QR.create(text, 'M'), n = qr.getModuleCount(), q = 2; // q = vùng trắng
    let d = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c + q} ${r + q}h1v1h-1z`;
    return `<svg viewBox="0 0 ${n + q * 2} ${n + q * 2}" shape-rendering="crispEdges" aria-hidden="true"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#002842"/></svg>`;
  }

  /* Sao chép */
  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-copy]'); if (!b || !state.booking) return;
    const v = { acc: P.BANK.accountNo, amount: String(state.booking.deposit), content: P.transferContent(state.booking.bookingId) }[b.dataset.copy];
    let ok = false;
    try { await navigator.clipboard.writeText(v); ok = true; } catch (err) {
      const ta = document.createElement('textarea'); ta.value = v; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
      try { ok = document.execCommand('copy'); } catch (er) {} ta.remove();
    }
    if (ok) { b.classList.add('is-done'); b.lastChild.textContent = 'Đã chép'; setTimeout(() => { b.classList.remove('is-done'); b.lastChild.textContent = 'Sao chép'; }, 1600); }
  });

  /* Lưu ảnh mã QR (vẽ canvas ngay trên máy, tải PNG) */
  document.addEventListener('click', e => {
    if (!e.target.closest('[data-save-qr]') || !state.booking) return;
    const qr = FB_QR.create(state.qrText, 'M'), n = qr.getModuleCount();
    const s = 8, W = (n + 8) * s, H = W + 120, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const g = cv.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.fillStyle = '#002842';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) g.fillRect((c + 4) * s, (r + 4) * s, s, s);
    g.textAlign = 'center'; g.font = '600 22px sans-serif';
    g.fillText(money(state.booking.deposit), W / 2, W + 34);
    g.font = '16px sans-serif'; g.fillStyle = '#657582';
    g.fillText(`${P.BANK.bankName} · ${P.BANK.accountName}`, W / 2, W + 64);
    g.fillText(P.transferContent(state.booking.bookingId), W / 2, W + 92);
    const a = document.createElement('a'); a.download = `VietQR-${state.booking.bookingId}.png`; a.href = cv.toDataURL('image/png'); a.click();
  });

  /* ================= CHỌN PHƯƠNG THỨC ================= */
  const PAY_LABEL = { vietqr: 'Tôi đã chuyển khoản', wallet: 'Tôi đã thanh toán trên ví' };
  $('#tc-methods').addEventListener('click', e => { const m = e.target.closest('[data-method]'); if (m) setMethod(m.dataset.method); });
  $('#tc-methods').addEventListener('keydown', e => {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return;
    e.preventDefault(); const list = $$('[data-method]'); const i = list.indexOf(document.activeElement);
    const nx = list[(i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : list.length - 1)) % list.length]; nx.focus(); setMethod(nx.dataset.method);
  });
  function setMethod(m) {
    if (state.expired || (state.reported && state.method)) return;
    state.method = m;
    $$('[data-method]').forEach(b => { const on = b.dataset.method === m; b.classList.toggle('is-active', on); b.setAttribute('aria-checked', on); b.tabIndex = on ? 0 : -1; });
    $('#tc-branch-vietqr').hidden = m !== 'vietqr';
    $('#tc-branch-wallet').hidden = m !== 'wallet';
    // "Lưu ý về tiền cọc" chuyển sang cột phải để 2 cột cân nhau (theo Figma)
    const notes = $('#tc-notes');
    $('#tc-right').insertBefore(notes, $('#tc-help'));
    notes.classList.add('is-side');
    const pay = $('#tc-pay'); pay.disabled = false; pay.textContent = PAY_LABEL[m];
    pay.classList.toggle('is-wine', m === 'wallet');
    if (m === 'wallet') renderWallet();
    const panel = $('#tc-branch-' + m);
    if (panel.getBoundingClientRect().top > innerHeight * .75) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ---- Ví điện tử ---- */
  const segBox = $('#tc-wallets');
  segBox.innerHTML = P.WALLETS.map(w => `<button type="button" role="tab" data-wallet="${w.id}" aria-selected="false">${w.name}</button>`).join('');
  segBox.addEventListener('click', e => { const b = e.target.closest('[data-wallet]'); if (b) { state.wallet = b.dataset.wallet; renderWallet(); } });
  function renderWallet() {
    const w = P.WALLETS.find(x => x.id === state.wallet);
    $$('[data-wallet]', segBox).forEach(b => { const on = b.dataset.wallet === w.id; b.classList.toggle('is-active', on); b.setAttribute('aria-selected', on); });
    $('#tc-wallet-cap').textContent = `Quét bằng ứng dụng ${w.name}`;
    const steps = [
      w.scan,
      'Quét mã VietQR bên cạnh — số tiền và nội dung tự điền sẵn',
      `Kiểm tra người nhận: ${P.BANK.accountName}`,
      'Xác nhận trong ví, rồi bấm “Tôi đã thanh toán trên ví”'
    ];
    $('#tc-wallet-steps').innerHTML = steps.map((s, i) => `<li><b>${i + 1}</b><span>${esc(s)}</span></li>`).join('');
  }

  /* ================= ĐỒNG HỒ GIỮ BÀN ================= */
  function startTimer() {
    const total = D.HOLD_MINUTES * 60000;
    let end = new Date(state.booking.holdExpiresAt).getTime();
    if (FB.demo === 'het-gio') end = Date.now() + 10000;
    const tick = () => {
      const left = Math.max(0, end - Date.now()), sec = Math.ceil(left / 1000);
      const txt = `${pad(Math.floor(sec / 60))}:${pad(sec % 60)}`;
      $$('[data-countdown]').forEach(e => { e.textContent = txt; });
      const pct = Math.max(0, Math.min(100, left / total * 100));
      $('#tc-hold-bar').style.width = pct + '%';
      $('.tc-hold__bar').setAttribute('aria-valuenow', Math.round(pct));
      $('#tc-hold').classList.toggle('is-low', sec <= 60);
      if (left <= 0) { clearInterval(state.timer); onExpired(); }
    };
    tick(); state.timer = setInterval(tick, 1000);
  }
  async function onExpired() {
    if (state.expired) return;
    state.expired = true;
    document.body.classList.add('is-expired');
    const pay = $('#tc-pay'); pay.disabled = true; pay.textContent = 'Đã hết thời gian giữ bàn';
    try { await API.releaseHold(state.booking.bookingId); } catch (e) {} // TODO(BE)
    $$('.modal.is-open').forEach(m => FB.closeModal(m));
    ppOpen('tc-pp-expired', `<div class="pp-pad pp-center">
      <span class="tc-pp-ic"><i data-icon="clock"></i></span>
      <span class="pp-eyebrow">Thời gian giữ chỗ</span>
      <h3 class="tc-serif tc-pp-title">Đã hết ${pad(D.HOLD_MINUTES)}:00 giữ bàn</h3>
      <p class="t-body c-gray">Bàn của bạn đã được mở lại cho khách khác vì chưa nhận được tiền cọc trong thời gian giữ chỗ. Thông tin bạn đã nhập vẫn được lưu.</p>
      <p class="tc-pp-note">Nếu tài khoản đã bị trừ tiền, vui lòng gọi hotline <a href="tel:${helpTel}">${D.HOTLINE}</a> để được hỗ trợ.</p>
      <a class="tc-pp-btn" href="dat_ban.html">Chọn lại bàn</a></div>`, 'pp-box--480 tc-pp', { lock: true });
  }

  /* ================= BÁO ĐÃ THANH TOÁN ================= */
  $('#tc-pay').addEventListener('click', async () => {
    if (!state.method || state.expired || state.sending || state.reported) return;
    state.sending = true;
    ppOpen('tc-pp-busy', `<div class="pp-pad pp-center"><span class="pp-spin" aria-hidden="true"></span>
      <h3 class="tc-serif tc-pp-title">Đang ghi nhận…</h3><p class="t-body c-gray">Vui lòng không đóng trang trong giây lát.</p></div>`, 'pp-box--480 tc-pp', { lock: true });
    let res;
    try { res = await API.reportTransfer(state.booking.bookingId, state.method, state.method === 'wallet' ? state.wallet : null); } // TODO(BE)
    catch (e) { console.error(e); res = { status: 'error' }; }
    state.sending = false;
    FB.closeModal('tc-pp-busy');
    if (res.status === 'paid') return openPaid();
    if (res.status === 'error') return openError();
    markReported();
    openPending();
  });
  /** Đã báo chuyển: dừng đếm ngược (BE gia hạn giữ bàn khi đối soát), khoá nút. */
  function markReported() {
    state.reported = true; clearInterval(state.timer);
    const hold = $('#tc-hold'); hold.classList.remove('is-low'); hold.classList.add('is-reported');
    $('.tc-hold__txt strong', hold).textContent = 'Đã báo chuyển khoản';
    $('.tc-hold__txt span', hold).textContent = 'Bàn được giữ trong lúc nhà hàng đối chiếu khoản cọc';
    $('#tc-hold-bar').style.width = '100%';
    $$('.tc-expiry').forEach(e => { e.hidden = true; });
    $$('[data-method]').forEach(b => { if (b.dataset.method !== state.method) b.disabled = true; });
    const pay = $('#tc-pay'); pay.disabled = true; pay.classList.remove('is-wine'); pay.textContent = 'Đang chờ nhà hàng xác nhận';
  }

  function openPending() {
    const b = state.booking;
    const box = ppOpen('tc-pp-pending', `<div class="pp-pad pp-center">
      <span class="tc-pp-ic tc-pp-ic--gold"><i data-icon="receipt"></i></span>
      <span class="pp-eyebrow">Đã ghi nhận</span>
      <h3 class="tc-serif tc-pp-title">Cảm ơn bạn, ${esc(b.customer.name.split(' ').pop())}!</h3>
      <p class="t-body c-gray">Nhà hàng đã nhận được thông báo chuyển khoản cho đơn <b>${esc(b.bookingId)}</b>. Đơn sẽ được xác nhận sau khi nhà hàng đối chiếu khoản cọc <b>${money(b.deposit)}</b>.</p>
      <dl class="tc-pp-sum">
        <div><dt>Bàn</dt><dd>${esc(b.tableId)} · Tầng ${esc(b.floor)}</dd></div>
        <div><dt>Thời gian</dt><dd>${esc(b.slot)} · ${fmtDate(b.date)}</dd></div>
        <div><dt>Nội dung CK</dt><dd>${esc(P.transferContent(b.bookingId))}</dd></div>
      </dl>
      <p class="tc-pp-note">Chưa thấy xác nhận sau 30 phút? Gọi <a href="tel:${helpTel}">${D.HOTLINE}</a> và đọc mã đơn ở trên.</p>
      <div class="pp-actions"><button type="button" class="tc-pp-btn tc-pp-btn--ghost" data-close>Xem lại mã QR</button><a class="tc-pp-btn" href="trang_chu.html">Về trang chủ</a></div></div>`, 'pp-box--500 tc-pp');
    // TODO(BE): khi có cơ chế xác nhận, có thể hỏi trạng thái định kỳ
    // (GET /api/dat-ban/{id}) rồi gọi openPaid() khi status = 'paid'.
    return box;
  }
  function openPaid() {
    clearInterval(state.timer);
    const b = state.booking;
    try { sessionStorage.removeItem(P.PENDING_KEY); } catch (e) {}
    ppOpen('tc-pp-paid', `<div class="pp-pad pp-center">
      <span class="tc-pp-ic tc-pp-ic--green"><i data-icon="check"></i></span>
      <span class="pp-eyebrow" style="color:var(--green)">Đặt cọc thành công</span>
      <h3 class="tc-serif tc-pp-title">Hẹn gặp bạn tại Fiabesco</h3>
      <p class="t-body c-gray">Bàn <b>${esc(b.tableId)}</b> · ${esc(b.slot)} · ${fmtDate(b.date)} đã được xác nhận. Mã đặt bàn <b>${esc(b.bookingId)}</b>.</p>
      <a class="tc-pp-btn" href="trang_chu.html">Về trang chủ</a></div>`, 'pp-box--480 tc-pp', { lock: true });
  }
  function openError() {
    ppOpen('tc-pp-err', `<div class="pp-pad pp-center">${closeX()}
      <span class="tc-pp-ic tc-pp-ic--wine"><i data-icon="alert-triangle"></i></span>
      <h3 class="tc-serif tc-pp-title">Chưa gửi được thông báo</h3>
      <p class="t-body c-gray">Kết nối tới máy chủ đang gián đoạn. Nếu bạn đã chuyển khoản, đừng lo — hãy thử lại hoặc gọi <a href="tel:${helpTel}">${D.HOTLINE}</a>.</p>
      <button type="button" class="tc-pp-btn" data-close>Thử lại</button></div>`, 'pp-box--480 tc-pp');
  }
  function openNoBooking() {
    ppOpen('tc-pp-none', `<div class="pp-pad pp-center">
      <span class="tc-pp-ic"><i data-icon="table"></i></span>
      <span class="pp-eyebrow">Thanh toán đặt cọc</span>
      <h3 class="tc-serif tc-pp-title">Chưa có bàn đang được giữ</h3>
      <p class="t-body c-gray">Phiên giữ bàn không còn hoặc bạn mở trang này trực tiếp. Hãy chọn bàn trước, sau đó quay lại bước đặt cọc.</p>
      <a class="tc-pp-btn" href="dat_ban.html">Đi tới trang Đặt bàn</a></div>`, 'pp-box--480 tc-pp', { lock: true });
    $('#tc-pay').textContent = 'Chưa có bàn đang giữ';
  }

  /* ================= SỬA NGƯỜI ĐẶT ================= */
  $('#tc-edit').addEventListener('click', () => {
    if (!state.booking) return;
    const c = state.booking.customer;
    const el = ppOpen('tc-pp-edit', `<div class="pp-pad">${closeX()}
      <span class="pp-eyebrow">Người đặt</span><h3 class="tc-serif tc-pp-title" style="text-align:left">Sửa thông tin liên hệ</h3>
      <form class="tc-edit-form" novalidate>
        <label class="field" data-req="name"><span class="field__label">Họ và tên *</span><span class="field__box"><input name="name" autocomplete="name" value="${esc(c.name)}"></span><span class="field__error">Vui lòng nhập họ tên</span></label>
        <label class="field" data-req="phone"><span class="field__label">Số điện thoại *</span><span class="field__box"><input name="phone" type="tel" inputmode="tel" autocomplete="tel" value="${esc(fmtPhone(c.phone))}"></span><span class="field__error">Số điện thoại gồm 10 chữ số, bắt đầu bằng 0</span></label>
        <label class="field"><span class="field__label">Ghi chú cho Quản lý bàn</span><textarea class="textarea" name="note" rows="3" maxlength="500">${esc(c.note || '')}</textarea></label>
        <div class="pp-actions"><button type="button" class="tc-pp-btn tc-pp-btn--ghost" data-close>Huỷ</button><button type="submit" class="tc-pp-btn">Lưu thay đổi</button></div>
      </form></div>`, 'pp-box--500 tc-pp');
    const f = $('form', el);
    f.addEventListener('input', e => { const fl = e.target.closest('.field'); if (fl) fl.classList.remove('is-error'); });
    f.addEventListener('submit', async e => {
      e.preventDefault();
      const name = f.elements.name.value.trim(), phone = f.elements.phone.value, note = f.elements.note.value.trim();
      const okN = !!name, okP = FB.isPhone(phone);
      f.querySelector('[data-req="name"]').classList.toggle('is-error', !okN);
      f.querySelector('[data-req="phone"]').classList.toggle('is-error', !okP);
      if (!okN || !okP) return;
      const cust = { name, phone: FB.normPhone(phone), note };
      await API.updateCustomer(state.booking.bookingId, cust); // TODO(BE)
      state.booking.customer = cust; renderSummary(); FB.closeModal(el);
    });
  });

  /* ================= POPUP ================= */
  function ppOpen(id, html, cls = '', opt = {}) {
    let el = document.getElementById(id); if (el) el.remove();
    el = document.createElement('div'); el.className = 'modal' + (opt.lock ? ' tc-lock' : ''); el.id = id;
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
    el.innerHTML = `<div class="pp-box ${cls}">${html}</div>`;
    document.body.appendChild(el); FB.hydrateIcons(el); FB.openModal(id);
    const h = el.querySelector('h3'); if (h) { h.id = id + '-t'; el.setAttribute('aria-labelledby', h.id); }
    const f = el.querySelector('a.tc-pp-btn, button.tc-pp-btn, input'); if (f) setTimeout(() => f.focus({ preventScroll: true }), 60);
    return el;
  }
  const closeX = () => `<button type="button" class="pp-x" data-close aria-label="Đóng">${icon('close')}</button>`;
  // Popup khoá (hết giờ / không có đơn / đang xử lý): không đóng bằng click nền hoặc Esc
  document.addEventListener('click', e => { const m = e.target.classList && e.target.classList.contains('tc-lock') ? e.target : null; if (m) { e.stopImmediatePropagation(); } }, true);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('.modal.tc-lock.is-open')) e.stopImmediatePropagation(); }, true);
});
