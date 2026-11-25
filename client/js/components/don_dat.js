/* =====================================================================
   FIABESCO PALACE — js/components/don_dat.js
   Component DÙNG CHUNG cho "đặt bàn" và "đơn giao" — một giao diện duy nhất
   cho cả trang Tra cứu (khách vãn lai) và trang Thành viên (#lich-su).
     - Thẻ đặt bàn (sắp tới / trước đây), thẻ đơn giao (đang xử lý / đã xong)
     - Popup: hủy đặt bàn, đổi lịch (chọn ngày, suất, bàn tương tự còn trống),
       hủy đơn giao, không thể thao tác (trong 24 giờ / đơn đang giao)
     - Ô nhập OTP 6 số (dùng ở trang Tra cứu và khi phiên hết hạn)
   Cần nạp trước: main.js (window.FB), js/data/dat_ban.js, js/data/tra_cuu.js.
   CSS đi kèm: css/components/don_dat.css (tiền tố class "dd-").

   CÁCH DÙNG
     root.innerHTML = FB_DON.bookingsHtml(list) | FB_DON.ordersHtml(list)
     FB_DON.mount(root, {
       api,                       // FB_TRA_CUU.guestApi hoặc API thành viên (cùng tên hàm)
       ctx: () => ctxHoặcNull,    // phiên OTP còn hạn / thành viên đang đăng nhập
       reverify: cb => …,         // phiên hết hạn → xác minh lại rồi gọi cb(ctx)
       find: (kind, code) => obj, // lấy object đặt bàn / đơn theo mã từ danh sách đang hiển thị
       onChange: () => …          // gọi sau khi hủy/đổi thành công để vẽ lại danh sách
     })
   ===================================================================== */
window.FB_DON = (function () {
  const T = () => window.FB_TRA_CUU, D = () => window.FB_DAT_BAN;
  const I = n => FB.icon(n);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = n => String(n).padStart(2, '0');
  const WD = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const WD_S = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const d0 = s => new Date(s);
  const dmy = d => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  const hm = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const isoDay = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addMin = (d, m) => new Date(d.getTime() + m * 60e3);
  const startOfDay = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const dayDiff = d => Math.round((startOfDay(d) - startOfDay(new Date())) / 864e5);
  const money = n => FB.money(n || 0);
  const tableLabel = b => `${b.tableId} · Tầng ${b.floor}`;
  const MAP_URL = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Fiabesco Palace 68 Lê Lợi Quận 1 TP Hồ Chí Minh');
  const tag = ([label, tone]) => `<span class="dd-tag dd-tag--${tone}"><i></i>${label}</span>`;

  /* ================= THẺ ĐẶT BÀN ================= */
  function bookingsHtml(list, opts = {}) {
    const R = T().rules;
    const up = list.filter(R.isUpcoming).sort((a, b) => d0(a.at) - d0(b.at));
    const past = list.filter(b => !R.isUpcoming(b)).sort((a, b) => d0(b.at) - d0(a.at));
    if (!list.length) return emptyHtml('calendar', opts.emptyTitle || 'Chưa có lượt đặt bàn nào', opts.emptyText || 'Đặt bàn trước để được giữ chỗ đẹp, chọn gói trang trí và nhận ưu đãi.', 'dat_ban.html', 'Đặt bàn ngay');
    return `${up.length ? `<h3 class="dd-sec">Sắp diễn ra</h3>${up.map(bookingHero).join('')}` : ''}
      ${past.length ? `<h3 class="dd-sec">Trước đây</h3><div class="dd-list">${past.map(bookingRow).join('')}</div>` : ''}`;
  }
  function headline(b) {
    const d = d0(b.at), n = dayDiff(d);
    if (b.status === 'pending') return 'Đang chờ xác nhận tiền cọc';
    return n <= 0 ? `Hôm nay, hẹn gặp bạn lúc ${hm(d)}!` : n === 1 ? 'Ngày mai gặp bạn nhé!' : `Còn ${n} ngày nữa, hẹn gặp bạn!`;
  }
  function bookingHero(b) {
    const R = T().rules, d = d0(b.at), end = addMin(d, b.durationMin || 90), locked = R.isLocked(b);
    const canRe = R.canReschedule(b), canCancel = R.canCancelBooking(b);
    const reBtn = b.status !== 'confirmed' ? '' : canRe ? `<button type="button" class="dd-btn dd-btn--ghost" data-dd="reschedule" data-code="${esc(b.code)}">${I('calendar')}Đổi lịch</button>`
      : `<button type="button" class="dd-btn dd-btn--ghost" data-dd="locked" data-code="${esc(b.code)}" data-why="${locked ? 'time' : 'limit'}">${I('calendar')}Đổi lịch</button>`;
    return `<article class="dd-bk" data-booking="${esc(b.code)}">
      <header class="dd-bk__top">
        <div class="dd-bk__row"><span class="dd-bk__date">${WD[d.getDay()]} · ${dmy(d)}</span>${tag(T().B_STATUS[b.status])}</div>
        <p class="dd-bk__hl">${headline(b)}</p>
        <p class="dd-bk__time"><b class="dd-num">${hm(d)}</b><span>– ${hm(end)} · ${b.durationMin || 90} phút</span></p>
        <div class="dd-bk__code"><span>Mã đặt bàn</span><b class="dd-num">${esc(b.code)}</b></div>
      </header>
      <dl class="dd-bk__rows">
        <div><dt>${I('table')}Bàn</dt><dd>${esc(tableLabel(b))}<small>${esc(b.zone || '')}</small></dd></div>
        <div><dt>${I('users')}Số khách</dt><dd>${b.guests} người</dd></div>
        <div><dt>${I('gift')}Gói trang trí</dt><dd>${esc(b.pkgName || 'Mặc định')}</dd></div>
        <div><dt>${I('wallet')}Đã đặt cọc</dt><dd class="dd-green"><b class="dd-num">${FB.vnd(b.deposit || 0)}</b><small>VND</small></dd></div>
      </dl>
      ${b.paidVia ? `<p class="dd-bk__paid">${I('check')}Đã thanh toán qua ${esc(b.paidVia)}${b.paidAt ? ` lúc ${hm(d0(b.paidAt))}, ${dmy(d0(b.paidAt))}` : ''}</p>` : ''}
      ${b.rescheduled ? `<p class="dd-bk__paid dd-muted">${I('refresh')}Đã đổi lịch ${b.rescheduled} lần${b.prevAt ? ` (lịch cũ ${hm(d0(b.prevAt))}, ${dmy(d0(b.prevAt))})` : ''}</p>` : ''}
      <div class="dd-bk__acts">
        <a class="dd-btn dd-btn--ghost" href="${MAP_URL}" target="_blank" rel="noopener">${I('directions')}Chỉ đường</a>
        ${reBtn}
        <button type="button" class="dd-btn dd-btn--navy dd-span2" data-dd="ics" data-code="${esc(b.code)}">${I('calendar-date')}Thêm vào lịch của tôi</button>
      </div>
      <p class="dd-note ${locked ? 'dd-note--wine' : ''}">${I('clock')}<span>${locked
        ? `Lịch hẹn đã trong vòng ${T().CUTOFF_H} giờ nên không thể đổi lịch hoặc hủy trực tuyến. Cần hỗ trợ, vui lòng gọi <a href="${T().HOTLINE_TEL}">${T().HOTLINE}</a>.`
        : `Hủy miễn phí trước ${T().CUTOFF_H} giờ so với giờ hẹn để được hoàn 100% tiền cọc. Đổi lịch miễn phí ${T().MAX_RESCHEDULE} lần, cũng trước ${T().CUTOFF_H} giờ.`}</span></p>
      ${canCancel ? `<button type="button" class="dd-link dd-link--wine" data-dd="cancel-booking" data-code="${esc(b.code)}">Hủy đặt bàn này</button>` : ''}
    </article>`;
  }
  function bookingRow(b) {
    const d = d0(b.at);
    const extra = b.status === 'cancelled' && b.refund ? `<span class="dd-green">Đã hoàn cọc ${money(b.refund)}</span>` : '';
    return `<article class="dd-row" data-booking="${esc(b.code)}">
      <span class="dd-row__day"><b class="dd-num">${pad(d.getDate())}</b><small>Th${d.getMonth() + 1}</small></span>
      <div class="dd-row__main"><strong>${WD[d.getDay()]} · ${hm(d)}</strong>
        <span>${esc(tableLabel(b))} · ${b.guests} khách · ${esc(b.code)}</span>${extra}
        <div class="dd-row__links"><a href="dat_ban.html?guests=${b.guests}">${I('refresh')}Đặt lại bàn này</a></div></div>
      ${tag(T().B_STATUS[b.status])}
    </article>`;
  }

  /* ================= THẺ ĐƠN GIAO ================= */
  function ordersHtml(list, opts = {}) {
    const R = T().rules;
    const act = list.filter(R.isActiveOrder).sort((a, b) => d0(b.at) - d0(a.at));
    const past = list.filter(o => !R.isActiveOrder(o)).sort((a, b) => d0(b.at) - d0(a.at));
    if (!list.length) return emptyHtml('delivery-truck', opts.emptyTitle || 'Chưa có đơn giao hàng nào', opts.emptyText || 'Đặt món yêu thích và nhận tận nơi trong 30–40 phút.', 'thuc_don.html', 'Đặt món ngay');
    return `${act.length ? `<h3 class="dd-sec">Đang xử lý</h3>${act.map(orderCard).join('')}` : ''}
      ${past.length ? `<h3 class="dd-sec">Trước đây</h3><div class="dd-list">${past.map(orderRow).join('')}</div>` : ''}`;
  }
  function orderCard(o) {
    const S = T().O_STEPS, idx = S.findIndex(s => s[0] === o.status), canCancel = T().rules.canCancelOrder(o);
    const eta = o.eta ? d0(o.eta) : null, mins = eta ? Math.max(0, Math.round((eta - Date.now()) / 60e3)) : 0;
    return `<article class="dd-od" data-order="${esc(o.code)}">
      <header class="dd-od__top">
        <div><span class="dd-od__eyebrow">Đơn giao hàng · ${hm(d0(o.at))}, ${dmy(d0(o.at))}</span>
          <strong class="dd-num dd-od__code">#${esc(o.code)}</strong>${tag(T().O_STATUS[o.status])}</div>
        ${eta ? `<div class="dd-od__eta"><span>Dự kiến giao lúc</span><b class="dd-num">${hm(eta)}</b><small>còn khoảng ${mins} phút</small></div>` : ''}
      </header>
      <ol class="dd-steps" aria-label="Tiến trình đơn hàng">${S.map(([k, label, ic], i) => `<li class="${i < idx ? 'is-done' : i === idx ? 'is-now' : ''}"${i === idx ? ' aria-current="step"' : ''}><span>${I(ic)}</span>${label}</li>`).join('')}</ol>
      <dl class="dd-od__meta">
        <div><dt>${I('location-pin')}Giao đến</dt><dd>${esc(o.address)}</dd></div>
        <div><dt>${I('user')}Người nhận</dt><dd>${esc(o.receiver)} · ${esc(fmtPhone(o.phone))}</dd></div>
        <div><dt>${I('wallet')}Thanh toán</dt><dd>${esc(T().PAY[o.payMethod] || o.payMethod)}${o.paid ? ' · Đã thanh toán' : ''}</dd></div>
      </dl>
      <div class="dd-od__body">
        <ul class="dd-items">${o.items.map(it => `<li>${it.img ? `<img src="${esc(it.img)}" alt="" loading="lazy">` : '<span class="dd-items__ph"></span>'}<div><b>${esc(it.name)}</b><small>× ${it.qty}</small></div><span class="dd-num">${FB.vnd(it.price * it.qty)}</span></li>`).join('')}</ul>
        <dl class="dd-od__sum">
          <div><dt>Tạm tính</dt><dd>${money(o.subtotal)}</dd></div>
          <div><dt>Phí giao hàng</dt><dd>${money(o.shipFee)}</dd></div>
          ${o.discount ? `<div><dt>Ưu đãi</dt><dd class="dd-green">−${money(o.discount)}</dd></div>` : ''}
          <div class="dd-od__total"><dt>${o.paid ? 'Đã thanh toán' : 'Cần thanh toán'}</dt><dd><b class="dd-num">${FB.vnd(o.total)}</b> VND</dd></div>
        </dl>
      </div>
      <div class="dd-od__acts">
        ${canCancel ? `<button type="button" class="dd-btn dd-btn--wine-ghost" data-dd="cancel-order" data-code="${esc(o.code)}">Hủy đơn hàng</button>`
          : `<a class="dd-btn dd-btn--ghost" href="${T().HOTLINE_TEL}">${I('phone')}Liên hệ hỗ trợ</a>`}
        <a class="dd-btn dd-btn--navy" href="theo_doi_don_hang.html?ma=${encodeURIComponent(o.code)}">Theo dõi đơn hàng${I('arrow-right')}</a>
      </div>
      <p class="dd-note">${I('clock')}<span>${canCancel ? 'Bạn có thể hủy khi nhà hàng còn đang chuẩn bị món, trước khi đơn được giao cho tài xế.' : `Đơn đang giao nên không thể hủy. Cần hỗ trợ? Gọi <a href="${T().HOTLINE_TEL}">${T().HOTLINE}</a>.`}</span></p>
    </article>`;
  }
  function orderRow(o) {
    const d = d0(o.at), names = o.items.map(i => `${i.name} ×${i.qty}`).join(', ');
    const extra = o.status === 'cancelled' ? (o.refund ? `<span class="dd-green">Hoàn ${money(o.refund)} trong 1–3 ngày làm việc</span>` : '<span>Không phát sinh thanh toán</span>') : '';
    return `<article class="dd-row" data-order="${esc(o.code)}">
      <span class="dd-row__thumb">${o.items[0] && o.items[0].img ? `<img src="${esc(o.items[0].img)}" alt="" loading="lazy">` : ''}</span>
      <div class="dd-row__main"><strong>#${esc(o.code)} · ${money(o.total)}</strong><span>${hm(d)}, ${dmy(d)} · ${esc(names)}</span>${extra}
        <div class="dd-row__links">${o.status === 'delivered' ? `<a href="danh_gia_don_hang.html?ma=${encodeURIComponent(o.code)}">${I('star')}Đánh giá</a>` : ''}<button type="button" data-dd="reorder" data-code="${esc(o.code)}">${I('refresh')}Đặt lại</button></div></div>
      ${tag(T().O_STATUS[o.status])}
    </article>`;
  }
  const fmtPhone = p => { const d = String(p || ''); return d.length === 10 ? `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}` : d; };
  function emptyHtml(ic, title, text, href, label) {
    return `<div class="dd-empty"><span class="dd-empty__ic">${I(ic)}</span><h3>${esc(title)}</h3><p>${esc(text)}</p><a class="dd-btn dd-btn--navy" href="${href}">${label}</a></div>`;
  }

  /* ================= POPUP ================= */
  function pp(id, html, size = 520, opt = {}) {
    let el = document.getElementById(id); if (el) el.remove();
    el = document.createElement('div'); el.className = 'modal dd-modal' + (opt.lock ? ' dd-lock' : ''); el.id = id;
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
    el.innerHTML = `<div class="pp-box dd-pp" style="width:${size}px">${opt.lock ? '' : `<button type="button" class="pp-x" data-close aria-label="Đóng">${I('close')}</button>`}${html}</div>`;
    document.body.appendChild(el); FB.hydrateIcons(el); FB.openModal(id);
    const h = el.querySelector('h3'); if (h) { h.id = id + '-t'; el.setAttribute('aria-labelledby', h.id); }
    const f = el.querySelector('[data-autofocus], .dd-btn--navy, .dd-btn--wine'); if (f) setTimeout(() => f.focus({ preventScroll: true }), 60);
    return el;
  }
  const close = el => FB.closeModal(el);
  const busy = (btn, on, label) => { if (!btn) return; if (on) { btn.dataset.label = btn.innerHTML; btn.disabled = true; btn.innerHTML = `<span class="dd-spin" aria-hidden="true"></span>${label || 'Đang xử lý…'}`; } else { btn.disabled = false; btn.innerHTML = btn.dataset.label || btn.innerHTML; } };
  function msg(id, { icon = 'check', tone = 'green', eyebrow = '', title, body = '', actions = '' }) {
    return pp(id, `<div class="dd-pp__pad dd-center"><span class="dd-pp__ic dd-pp__ic--${tone}">${I(icon)}</span>
      ${eyebrow ? `<span class="dd-eyebrow">${eyebrow}</span>` : ''}<h3 class="dd-pp__title">${title}</h3>${body}
      <div class="dd-pp__acts">${actions || '<button type="button" class="dd-btn dd-btn--navy" data-close>Đóng</button>'}</div></div>`);
  }
  // Popup khoá (không đóng bằng click nền/Esc)
  document.addEventListener('click', e => { if (e.target.classList && e.target.classList.contains('dd-lock')) e.stopImmediatePropagation(); }, true);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.querySelector('.modal.dd-lock.is-open')) e.stopImmediatePropagation(); }, true);

  /* ================= GẮN SỰ KIỆN ================= */
  function mount(root, o) {
    if (root.dataset.ddMounted) { root._dd = o; return; }
    root.dataset.ddMounted = '1'; root._dd = o;
    root.addEventListener('click', e => {
      const btn = e.target.closest('[data-dd]'); if (!btn) return;
      const opt = root._dd, code = btn.dataset.code, act = btn.dataset.dd;
      const kind = ['cancel-order', 'reorder'].includes(act) ? 'order' : 'booking';
      const item = opt.find(kind, code); if (!item) return;
      if (act === 'ics') return downloadIcs(item);
      if (act === 'reorder') return reorder(item);
      if (act === 'locked') return openLocked(item, btn.dataset.why);
      withCtx(opt, ctx => {
        if (act === 'cancel-booking') openCancelBooking(item, ctx, opt);
        if (act === 'reschedule') openReschedule(item, ctx, opt);
        if (act === 'cancel-order') openCancelOrder(item, ctx, opt);
      });
    });
  }
  /** Mọi thao tác hủy/đổi cần phiên còn hạn (khách: OTP 15 phút; thành viên: đăng nhập). */
  function withCtx(opt, cb) { const c = opt.ctx(); if (c) cb(c); else if (opt.reverify) opt.reverify(cb); }
  const fail = (code, what) => ({
    TOO_LATE: `Đã quá thời hạn ${what} trực tuyến. Vui lòng gọi hotline ${T().HOTLINE} để được hỗ trợ.`,
    LIMIT: `Đặt bàn này đã dùng hết ${T().MAX_RESCHEDULE} lần đổi lịch miễn phí.`,
    NOT_ALLOWED: `Không thể ${what} ở trạng thái hiện tại.`, NOT_FOUND: 'Không tìm thấy thông tin. Vui lòng tải lại trang.'
  }[code] || 'Kết nối máy chủ gián đoạn. Vui lòng thử lại.');
  function errorPopup(title, text) {
    msg('dd-pp-err', { icon: 'alert-triangle', tone: 'wine', title, body: `<p class="dd-pp__text">${text}</p>`,
      actions: `<a class="dd-btn dd-btn--ghost" href="${T().HOTLINE_TEL}">${I('phone')}Gọi hotline</a><button type="button" class="dd-btn dd-btn--navy" data-close>Đóng</button>` });
  }

  /* ---------- Không thể thao tác trực tuyến (Figma E34 / DL4) ---------- */
  function openLocked(b, why) {
    const h = Math.max(0, T().rules.hoursUntil(b)), left = h >= 1 ? `${Math.floor(h)} giờ` : `${Math.max(1, Math.round(h * 60))} phút`;
    msg('dd-pp-locked', { icon: 'clock', tone: 'gold', eyebrow: 'Đổi lịch / hủy bàn',
      title: why === 'limit' ? 'Đã dùng lượt đổi lịch' : 'Không thể thao tác trực tuyến',
      body: `<p class="dd-pp__text">${why === 'limit' ? `Đặt bàn <b>${esc(b.code)}</b> đã đổi lịch ${b.rescheduled} lần — mỗi đặt bàn được đổi miễn phí ${T().MAX_RESCHEDULE} lần.` : `Bàn <b>${esc(b.code)}</b> sẽ bắt đầu sau ${left} nữa. Trong vòng ${T().CUTOFF_H} giờ trước giờ hẹn, đổi lịch hoặc hủy bàn chỉ thực hiện qua hotline.`}</p>
        <p class="dd-pp__hint">${I('phone')}Hotline ${T().HOTLINE} · 9:00 – 22:00 mỗi ngày</p>`,
      actions: `<button type="button" class="dd-btn dd-btn--ghost" data-close>Đóng</button><a class="dd-btn dd-btn--navy" href="${T().HOTLINE_TEL}">Gọi hotline</a>` });
  }

  /* ---------- Hủy đặt bàn (Figma E32 → E33) ---------- */
  function openCancelBooking(b, ctx, opt) {
    const d = d0(b.at);
    const el = pp('dd-pp-cancel', `<div class="dd-pp__pad dd-center">
      <span class="dd-pp__ic dd-pp__ic--wine">${I('alert-triangle')}</span>
      <span class="dd-eyebrow">Hủy đặt bàn</span><h3 class="dd-pp__title">Hủy đặt bàn <span class="dd-num">${esc(b.code)}</span>?</h3>
      <span class="dd-chip dd-chip--green">${I('check')}Còn hơn ${T().CUTOFF_H} giờ trước giờ hẹn</span>
      <dl class="dd-kv"><div><dt>Thời gian</dt><dd>${hm(d)} · ${WD[d.getDay()]}, ${dmy(d)}</dd></div><div><dt>Bàn</dt><dd>${esc(tableLabel(b))} · ${b.guests} khách</dd></div>
        <div><dt>Tiền cọc hoàn lại</dt><dd class="dd-green"><b class="dd-num">${FB.vnd(b.deposit || 0)}</b> VND (100%)</dd></div></dl>
      <p class="dd-pp__text">Tiền cọc được hoàn về phương thức thanh toán ban đầu (${esc(b.paidVia || 'tài khoản đã chuyển')}) trong 3–5 ngày làm việc. Sau khi hủy, bàn sẽ mở lại cho khách khác và không thể khôi phục.</p>
      <div class="dd-pp__acts"><button type="button" class="dd-btn dd-btn--ghost" data-close data-autofocus>Giữ đặt bàn</button><button type="button" class="dd-btn dd-btn--wine" data-ok>Hủy đặt bàn</button></div></div>`, 520);
    el.querySelector('[data-ok]').addEventListener('click', async ev => {
      const btn = ev.currentTarget; busy(btn, true, 'Đang hủy…');
      let r; try { r = await opt.api.cancelBooking(ctx, b.code); } catch (e) { console.error(e); r = { ok: false }; }
      busy(btn, false); close(el);
      if (!r.ok) return errorPopup('Chưa hủy được đặt bàn', fail(r.code, 'hủy bàn'));
      opt.onChange && opt.onChange();
      msg('dd-pp-cancel-ok', { icon: 'check', tone: 'green', eyebrow: 'Đã hủy', title: 'Đã hủy đặt bàn',
        body: `<p class="dd-pp__text">Đặt bàn <b>${esc(b.code)}</b> đã được hủy. Tiền cọc <b>${money(r.refund)}</b> sẽ được hoàn trong 3–5 ngày làm việc.</p>`,
        actions: `<a class="dd-btn dd-btn--ghost" href="dat_ban.html">Đặt bàn mới</a><button type="button" class="dd-btn dd-btn--navy" data-close>Đóng</button>` });
    });
  }

  /* ---------- Hủy đơn giao (Figma "PC Popup – Hủy đơn hàng") ---------- */
  function openCancelOrder(o, ctx, opt) {
    const refundText = o.paid ? `Số tiền <b>${money(o.total)}</b> đã thanh toán qua ${esc(T().PAY[o.payMethod] || o.payMethod)} sẽ được hoàn lại trong 1–3 ngày làm việc.` : 'Đơn thanh toán khi nhận hàng nên bạn không mất phí khi hủy.';
    const el = pp('dd-pp-cancel-order', `<div class="dd-pp__pad dd-center">
      <span class="dd-pp__ic dd-pp__ic--wine">${I('alert-triangle')}</span>
      <h3 class="dd-pp__title">Hủy đơn hàng <span class="dd-num">#${esc(o.code)}</span>?</h3>
      <span class="dd-chip dd-chip--green">${I('clock')}Nhà hàng đang chuẩn bị, đơn chưa được giao</span>
      <ul class="dd-mini">${o.items.map(i => `<li><span>${esc(i.name)} × ${i.qty}</span><b>${money(i.price * i.qty)}</b></li>`).join('')}</ul>
      <p class="dd-pp__text">${refundText} Bạn không thể khôi phục đơn sau khi hủy.</p>
      <div class="dd-pp__acts"><button type="button" class="dd-btn dd-btn--ghost" data-close data-autofocus>Giữ đơn</button><button type="button" class="dd-btn dd-btn--wine" data-ok>Hủy đơn</button></div></div>`, 520);
    el.querySelector('[data-ok]').addEventListener('click', async ev => {
      const btn = ev.currentTarget; busy(btn, true, 'Đang hủy…');
      let r; try { r = await opt.api.cancelOrder(ctx, o.code); } catch (e) { console.error(e); r = { ok: false }; }
      busy(btn, false); close(el);
      if (!r.ok) { opt.onChange && opt.onChange(); return errorPopup(r.code === 'TOO_LATE' ? 'Đơn đã được giao cho tài xế' : 'Chưa hủy được đơn', r.code === 'TOO_LATE' ? `Đơn <b>#${esc(o.code)}</b> vừa rời bếp nên không thể hủy trực tuyến. Vui lòng gọi hotline ${T().HOTLINE}.` : fail(r.code, 'hủy đơn')); }
      opt.onChange && opt.onChange();
      msg('dd-pp-cancel-order-ok', { icon: 'check', tone: 'green', eyebrow: 'Đã hủy', title: `Đã hủy đơn #${esc(o.code)}`,
        body: `<p class="dd-pp__text">${r.refund ? `Fiabesco sẽ hoàn <b>${money(r.refund)}</b> về ${esc(T().PAY[o.payMethod] || '')} trong 1–3 ngày làm việc.` : 'Đơn đã được hủy, bạn không bị tính phí.'}</p>`,
        actions: `<a class="dd-btn dd-btn--ghost" href="thuc_don.html">Xem thực đơn</a><button type="button" class="dd-btn dd-btn--navy" data-close>Đóng</button>` });
    });
  }

  /* ---------- Đổi lịch (Figma DL1 → DL2 → DL5, DL3 bàn cũ đã có khách) ---------- */
  function openReschedule(b, ctx, opt) {
    const DB = D(); if (!DB) { console.error('Thiếu js/data/dat_ban.js'); return; }
    const cur = DB.byId(b.tableId) || { id: b.tableId, seats: b.guests, feeType: '', floor: b.floor, zone: b.zone };
    const curDate = d0(b.at), curDay = isoDay(curDate), curSlot = (DB.SLOTS.find(s => s.start === hm(curDate)) || {}).id;
    const today = startOfDay(new Date()), last = startOfDay(new Date()); last.setDate(last.getDate() + DB.BOOK_AHEAD_DAYS);
    const st = { week: Math.max(today, startOfDay(addMin(curDate, -3 * 1440))), date: curDay < isoDay(today) ? isoDay(today) : curDay, slot: null, slots: [], status: null, table: null, guests: b.guests, req: 0, step: 1 };
    const el = pp('dd-pp-re', `<div class="dd-re" data-re></div>`, 760);
    const box = el.querySelector('[data-re]');
    const slotById = id => DB.SLOTS.find(s => s.id === id);
    const slotPassed = (day, s) => { if (day !== isoDay(new Date())) return false; const [h, m] = s.start.split(':').map(Number); const n = new Date(); return n.getHours() * 60 + n.getMinutes() >= h * 60 + m; };
    const fmtDay = iso => { const [y, m, d] = iso.split('-').map(Number); const x = new Date(y, m - 1, d); return `${WD[x.getDay()]}, ${pad(d)}/${pad(m)}`; };
    // Bàn tương tự = cùng loại phí (cùng sức chứa → tiền cọc giữ nguyên), còn trống, đủ chỗ
    const similar = () => DB.tables.filter(t => t.feeType === cur.feeType && t.seats >= st.guests && st.status && st.status[t.id] === 'available')
      .sort((x, y) => (x.id === cur.id ? -1 : 0) - (y.id === cur.id ? -1 : 0) || (x.zone === cur.zone ? -1 : 0) - (y.zone === cur.zone ? -1 : 0) || (x.floor === cur.floor ? -1 : 0) - (y.floor === cur.floor ? -1 : 0));
    const unchanged = () => st.date === curDay && st.slot === curSlot && st.table === cur.id && st.guests === b.guests;

    async function loadSlots() {
      const id = ++st.req; st.slots = null; render();
      try { st.slots = await DB.BookingAPI.getSlots(st.date, st.guests); } catch (e) { st.slots = []; } // TODO(BE) — BookingAPI.getSlots
      if (id === st.req) render();
    }
    async function loadTables() {
      const id = ++st.req; st.status = null; st.table = null; render();
      try { st.status = await DB.BookingAPI.getTableStatus(st.date, st.slot, st.guests); } catch (e) { st.status = {}; } // TODO(BE) — BookingAPI.getTableStatus
      if (id !== st.req) return;
      const list = similar(); st.table = list.some(t => t.id === cur.id) ? cur.id : (list[0] ? list[0].id : null);
      render();
    }
    function render() {
      if (st.step === 2) return renderConfirm();
      const days = Array.from({ length: 7 }, (_, i) => { const x = new Date(st.week); x.setDate(x.getDate() + i); return x; });
      const canPrev = st.week > today, canNext = days[6] < last;
      const t = st.table && DB.byId(st.table), slot = st.slot && slotById(st.slot);
      const list = st.status ? similar() : [];
      const curFree = st.status && st.status[cur.id] === 'available' && cur.seats >= st.guests;
      const maxG = t ? t.seats : cur.seats;
      box.innerHTML = `
        <div class="dd-re__bar">
          <div><span class="dd-eyebrow">Đổi lịch · <span class="dd-num">${esc(b.code)}</span></span>
            <strong>${slot ? `${fmtDay(st.date)} · ${slot.start}${t ? ` · Bàn ${t.id}` : ''}` : 'Chọn ngày và giờ mới'}</strong></div>
          <span class="dd-chip dd-chip--green">${I('check')}Miễn phí</span>
          <button type="button" class="dd-btn dd-btn--navy" data-next ${slot && t && !unchanged() ? '' : 'disabled'}>Tiếp tục</button>
        </div>
        <div class="dd-re__body">
          <p class="dd-note">${I('refresh')}<span>Lịch hiện tại: <b>${hm(curDate)} · ${WD[curDate.getDay()]}, ${dmy(curDate)} · Bàn ${esc(tableLabel(b))}</b>. Tiền cọc ${money(b.deposit)} được chuyển sang lịch mới.</span></p>
          <div class="dd-re__head"><h4>Chọn ngày mới</h4><div class="dd-re__nav"><button type="button" data-week="-1" ${canPrev ? '' : 'disabled'} aria-label="Tuần trước">${I('chevron-left')}</button><span>Tháng ${days[3].getMonth() + 1}/${days[3].getFullYear()}</span><button type="button" data-week="1" ${canNext ? '' : 'disabled'} aria-label="Tuần sau">${I('chevron-right')}</button></div></div>
          <div class="dd-days" role="radiogroup" aria-label="Ngày">${days.map(x => { const k = isoDay(x), off = x < today || x > last;
            return `<button type="button" role="radio" aria-checked="${k === st.date}" class="dd-day${k === st.date ? ' is-on' : ''}${k === curDay ? ' is-cur' : ''}" data-day="${k}" ${off ? 'disabled' : ''}><small>${WD_S[x.getDay()]}</small><b class="dd-num">${x.getDate()}</b></button>`; }).join('')}</div>
          <p class="dd-legend"><i class="is-on"></i>Đang chọn<i class="is-cur"></i>Lịch hiện tại<i class="is-off"></i>Đã qua</p>
          <h4>Chọn giờ · ${fmtDay(st.date)}</h4>
          <div class="dd-slots">${st.slots == null ? '<p class="dd-muted">Đang kiểm tra suất còn bàn…</p>' : DB.SLOTS.map(s => {
            const sv = (st.slots.find(x => x.id === s.id) || {}).status, past = slotPassed(st.date, s), full = sv === 'full', isCur = st.date === curDay && s.id === curSlot;
            return `<button type="button" class="dd-slot${st.slot === s.id ? ' is-on' : ''}" data-slot="${s.id}" ${past || full ? 'disabled' : ''} aria-pressed="${st.slot === s.id}"><b>${s.start} – ${s.end}</b><small>${past ? 'Đã qua giờ' : full ? 'Đã hết bàn' : isCur ? 'Lịch hiện tại' : st.slot === s.id ? '● Đang chọn' : 'Còn bàn'}</small></button>`; }).join('')}</div>
          ${st.slot ? `<h4>Bàn &amp; số khách</h4>
          <div class="dd-re__tables">${st.status == null ? '<p class="dd-muted">Đang tìm bàn trống…</p>'
            : `${curFree ? '' : `<p class="dd-note dd-note--wine">${I('alert-triangle')}<span>Bàn ${esc(cur.id)} đã có khách ở khung giờ này. Chọn một bàn tương tự (${cur.seats} chỗ, cùng mức phí) bên dưới.</span></p>`}
              ${list.length ? `<div class="dd-tables" role="radiogroup" aria-label="Bàn">${list.slice(0, 8).map(x => `<button type="button" role="radio" aria-checked="${st.table === x.id}" class="dd-tbl${st.table === x.id ? ' is-on' : ''}" data-table="${x.id}"><b>${x.id === cur.id ? 'Giữ bàn ' : ''}${x.id} · Tầng ${x.floor}</b><small>${esc(x.zone)} · ${x.seats} chỗ</small></button>`).join('')}</div>`
                : `<p class="dd-note dd-note--wine">${I('alert-triangle')}<span>Không còn bàn tương tự ở khung giờ này. Hãy chọn giờ hoặc ngày khác.</span></p>`}
              <div class="dd-guests"><div>${I('users')}<span><b>Số khách</b><small>${t ? `Bàn ${t.id} phục vụ tối đa ${t.seats} khách` : ''}</small></span></div>
                <div class="dd-step"><button type="button" data-g="-1" ${st.guests <= 1 ? 'disabled' : ''} aria-label="Bớt khách">${I('minus')}</button><b class="dd-num" aria-live="polite">${st.guests}</b><button type="button" data-g="1" ${st.guests >= maxG ? 'disabled' : ''} aria-label="Thêm khách">${I('plus')}</button></div></div>`}
          </div>` : ''}
        </div>`;
      FB.hydrateIcons(box);
    }
    function renderConfirm() {
      const t = DB.byId(st.table), slot = slotById(st.slot);
      box.innerHTML = `<div class="dd-pp__pad">
        <span class="dd-eyebrow">Xác nhận đổi lịch</span><h3 class="dd-pp__title" style="text-align:left">Kiểm tra lại lịch mới</h3>
        <div class="dd-cmp">
          <div class="dd-cmp__old"><span>Lịch cũ</span><b class="dd-num">${hm(curDate)}</b><p>${WD[curDate.getDay()]}, ${dmy(curDate)}</p><p>Bàn ${esc(tableLabel(b))} · ${b.guests} khách</p></div>
          <span class="dd-cmp__arrow">${I('arrow-right')}</span>
          <div class="dd-cmp__new"><span>Lịch mới</span><b class="dd-num">${slot.start}</b><p>${fmtDay(st.date)}/${st.date.slice(0, 4)}</p><p>Bàn ${t.id} · Tầng ${t.floor} · ${st.guests} khách</p></div>
        </div>
        <ul class="dd-checks"><li>${I('check')}<span>Tiền cọc <b>${money(b.deposit)}</b> được chuyển sang lịch mới, không phát sinh phí.</span></li>
          <li>${I('check')}<span>Gói trang trí <b>${esc(b.pkgName || 'Mặc định')}</b> giữ nguyên.</span></li>
          <li>${I('alert-triangle')}<span>Mỗi đặt bàn chỉ được đổi lịch miễn phí ${T().MAX_RESCHEDULE} lần. Sau khi đổi, hủy trước ${T().CUTOFF_H} giờ so với lịch mới vẫn được hoàn 100% cọc.</span></li></ul>
        <div class="dd-pp__acts"><button type="button" class="dd-btn dd-btn--ghost" data-back>Quay lại</button><button type="button" class="dd-btn dd-btn--navy" data-confirm>Xác nhận đổi lịch</button></div></div>`;
      FB.hydrateIcons(box);
    }
    box.addEventListener('click', async e => {
      const w = e.target.closest('[data-week]'); if (w && !w.disabled) { st.week.setDate(st.week.getDate() + 7 * +w.dataset.week); if (st.week < today) st.week = new Date(today); return render(); }
      const dy = e.target.closest('[data-day]'); if (dy && !dy.disabled) { st.date = dy.dataset.day; st.slot = null; st.status = null; st.table = null; return loadSlots(); }
      const sl = e.target.closest('[data-slot]'); if (sl && !sl.disabled) { st.slot = sl.dataset.slot; return loadTables(); }
      const tb = e.target.closest('[data-table]'); if (tb) { st.table = tb.dataset.table; const t = DB.byId(st.table); if (st.guests > t.seats) st.guests = t.seats; return render(); }
      const g = e.target.closest('[data-g]'); if (g && !g.disabled) { st.guests += +g.dataset.g; if (st.table && DB.byId(st.table).seats < st.guests) st.table = null; const l = similar(); if (!st.table && l[0]) st.table = l[0].id; return render(); }
      if (e.target.closest('[data-next]')) { st.step = 2; return render(); }
      if (e.target.closest('[data-back]')) { st.step = 1; return render(); }
      const cf = e.target.closest('[data-confirm]'); if (!cf) return;
      busy(cf, true, 'Đang đổi lịch…');
      let r; try { r = await opt.api.rescheduleBooking(ctx, b.code, { date: st.date, slotId: st.slot, tableId: st.table, guests: st.guests }); } catch (err) { console.error(err); r = { ok: false }; }
      busy(cf, false);
      if (r.code === 'TABLE_TAKEN') { st.step = 1; await loadTables(); const n = box.querySelector('.dd-re__tables'); if (n) n.insertAdjacentHTML('afterbegin', `<p class="dd-note dd-note--wine">${I('alert-triangle')}<span>Bàn vừa được khách khác đặt. Vui lòng chọn bàn khác.</span></p>`); FB.hydrateIcons(box); return; }
      close(el);
      if (!r.ok) return errorPopup('Chưa đổi được lịch', fail(r.code, 'đổi lịch'));
      opt.onChange && opt.onChange();
      const nb = r.booking, nd = d0(nb.at);
      msg('dd-pp-re-ok', { icon: 'check', tone: 'green', eyebrow: 'Đổi lịch thành công', title: `Hẹn gặp bạn lúc ${hm(nd)}`,
        body: `<p class="dd-pp__text">${WD[nd.getDay()]}, ${dmy(nd)} · Bàn ${esc(tableLabel(nb))} · ${nb.guests} khách. Mã đặt bàn <b>${esc(nb.code)}</b> giữ nguyên.</p>`,
        actions: `<button type="button" class="dd-btn dd-btn--ghost" data-dd-ics>Thêm vào lịch</button><button type="button" class="dd-btn dd-btn--navy" data-close>Xong</button>` })
        .querySelector('[data-dd-ics]').addEventListener('click', () => downloadIcs(nb));
    });
    loadSlots();
  }

  /* ---------- Tiện ích ---------- */
  function downloadIcs(b) {
    const s = d0(b.at), e = addMin(s, b.durationMin || 90);
    const f = d => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Fiabesco Palace//VI', 'BEGIN:VEVENT', `UID:${b.code}@fiabesco`, `DTSTART:${f(s)}`, `DTEND:${f(e)}`,
      `SUMMARY:Fiabesco Palace – Bàn ${b.tableId}`, `DESCRIPTION:Mã đặt bàn ${b.code} · ${b.guests} khách`, 'LOCATION:68 Lê Lợi, Quận 1, TP. Hồ Chí Minh', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); a.download = `Fiabesco-${b.code}.ics`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  function reorder(o) {
    let n = 0; o.items.forEach(i => { if (FB.Cart && window.FB_DATA && FB_DATA.byId(i.id)) { FB.Cart.add(i.id, i.qty); n += i.qty; } });
    if (n) location.href = 'gio_hang.html'; else FB.toast('Chưa thêm được món', 'Các món trong đơn hiện không còn trên thực đơn.', null, null, 'navy');
  }

  /* ================= Ô NHẬP OTP (Figma TH10) =================
     otp(host, { phone, api, onVerified(session), onChangePhone() }) */
  function otp(host, o) {
    const C = T().OTP; let left = 0, timer = 0, busyOn = false;
    host.innerHTML = `<div class="dd-otp">
      <span class="dd-otp__ic">${I('lock')}</span>
      <h3 class="dd-pp__title">Xác minh số điện thoại</h3>
      <p class="dd-pp__text">Để bảo vệ thông tin của bạn, mã gồm ${C.LEN} chữ số đã được gửi qua SMS tới <b>${esc(T().maskPhone(o.phone))}</b>.</p>
      <form class="dd-otp__form" novalidate>
        <div class="dd-otp__boxes" role="group" aria-label="Mã OTP ${C.LEN} số">${Array.from({ length: C.LEN }, (_, i) => `<input inputmode="numeric" autocomplete="${i ? 'off' : 'one-time-code'}" maxlength="1" aria-label="Số thứ ${i + 1}" class="dd-num">`).join('')}</div>
        <p class="dd-otp__err" role="alert" hidden></p>
        <p class="dd-otp__resend">Chưa nhận được mã? <button type="button" data-resend disabled>Gửi lại sau <b>01:00</b></button></p>
        <button type="submit" class="dd-btn dd-btn--navy dd-btn--block" disabled>${esc(o.submitLabel || 'Xác nhận và xem')}</button>
      </form>
      ${o.onChangePhone ? '<button type="button" class="dd-link dd-link--wine" data-change>Đổi số điện thoại</button>' : ''}
      <p class="dd-note dd-note--gray">${I('lock')}<span>Nhập sai mã quá ${C.MAX_WRONG} lần, tính năng tra cứu sẽ tạm khoá ${C.LOCK_MIN} phút. Sau khi xác minh, bạn có thể hủy hoặc đổi lịch trong ${T().SESSION_MIN} phút mà không cần nhập lại mã.</span></p>
    </div>`;
    FB.hydrateIcons(host);
    const form = host.querySelector('form'), boxes = [...host.querySelectorAll('.dd-otp__boxes input')], err = host.querySelector('.dd-otp__err');
    const resend = host.querySelector('[data-resend]'), submit = form.querySelector('[type=submit]');
    const val = () => boxes.map(b => b.value).join('');
    const showErr = t => { err.hidden = !t; err.innerHTML = t || ''; boxes.forEach(b => b.classList.toggle('is-err', !!t)); };
    const sync = () => { submit.disabled = busyOn || val().length !== C.LEN; };
    const tick = () => { if (left > 0) { resend.disabled = true; resend.innerHTML = `Gửi lại sau <b>${pad(Math.floor(left / 60))}:${pad(left % 60)}</b>`; left--; } else { clearInterval(timer); resend.disabled = false; resend.textContent = 'Gửi lại mã'; } };
    const lock = until => { boxes.forEach(b => { b.disabled = true; }); submit.disabled = true; resend.disabled = true; clearInterval(timer); const m = Math.ceil((until - Date.now()) / 60e3); showErr(`Bạn đã nhập sai quá nhiều lần. Tra cứu tạm khoá ${m} phút để bảo vệ thông tin.`); };
    async function send() {
      resend.disabled = true; let r;
      try { r = await o.api.sendOtp(o.phone); } catch (e) { r = { ok: false }; }
      if (!r.ok) {
        if (r.code === 'LOCKED') return lock(r.retryAt);
        if (r.code === 'TOO_MANY') { showErr(`Bạn đã yêu cầu mã quá nhiều lần. Vui lòng thử lại sau ${Math.ceil((r.retryAt - Date.now()) / 60e3)} phút.`); return; }
        showErr(navigator.onLine === false ? 'Mất kết nối mạng. Kiểm tra Wi-Fi hoặc 4G rồi thử lại.' : 'Chưa gửi được mã. Vui lòng thử lại.'); resend.disabled = false; resend.textContent = 'Gửi lại mã'; return;
      }
      // GIẢ LẬP: hiện mã để chấm bài. TODO(BE): xoá dòng này — mã chỉ được gửi qua SMS.
      if (r.devCode) FB.toast('Mã OTP (bản demo)', `Mã của bạn là ${r.devCode}`, null, null, 'navy');
      left = r.resendIn || C.RESEND_SEC; clearInterval(timer); tick(); timer = setInterval(tick, 1000);
      boxes.forEach(b => { b.value = ''; }); sync(); boxes[0].focus();
    }
    boxes.forEach((b, i) => {
      b.addEventListener('input', () => { b.value = b.value.replace(/\D/g, '').slice(-1); showErr(''); if (b.value && boxes[i + 1]) boxes[i + 1].focus(); sync(); if (val().length === C.LEN) form.requestSubmit(); });
      b.addEventListener('keydown', e => { if (e.key === 'Backspace' && !b.value && boxes[i - 1]) { boxes[i - 1].focus(); boxes[i - 1].value = ''; sync(); } if (e.key === 'ArrowLeft' && boxes[i - 1]) boxes[i - 1].focus(); if (e.key === 'ArrowRight' && boxes[i + 1]) boxes[i + 1].focus(); });
      b.addEventListener('paste', e => { const t = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, C.LEN); if (!t) return; e.preventDefault(); boxes.forEach((x, k) => { x.value = t[k] || ''; }); sync(); (boxes[t.length] || boxes[C.LEN - 1]).focus(); if (t.length === C.LEN) form.requestSubmit(); });
    });
    resend.addEventListener('click', send);
    const ch = host.querySelector('[data-change]'); if (ch) ch.addEventListener('click', () => { clearInterval(timer); o.onChangePhone(); });
    form.addEventListener('submit', async e => {
      e.preventDefault(); if (val().length !== C.LEN || busyOn) return;
      busyOn = true; busy(submit, true, 'Đang xác minh…'); let r;
      try { r = await o.api.verifyOtp(o.phone, val()); } catch (er) { r = { ok: false }; }
      busyOn = false; busy(submit, false); sync();
      if (r.ok) { clearInterval(timer); return o.onVerified(T().session.get()); }
      if (r.code === 'LOCKED') return lock(r.retryAt);
      if (r.code === 'EXPIRED') { showErr('Mã đã hết hạn. Bấm “Gửi lại mã” để nhận mã mới.'); clearInterval(timer); left = 0; tick(); return; }
      if (r.code === 'WRONG') { showErr(`Mã chưa đúng. Bạn còn ${r.left} lần thử.`); boxes.forEach(x => { x.value = ''; }); sync(); boxes[0].focus(); return; }
      showErr('Kết nối máy chủ gián đoạn. Vui lòng thử lại.');
    });
    send();
    return { destroy() { clearInterval(timer); } };
  }
  /** Phiên hết hạn giữa chừng → popup OTP, xác minh xong gọi cb(ctx). */
  function openOtp(phone, api, cb) {
    const el = pp('dd-pp-otp', '<div class="dd-pp__pad" data-host></div>', 520);
    const w = otp(el.querySelector('[data-host]'), { phone, api, submitLabel: 'Xác minh và tiếp tục', onVerified: s => { w.destroy(); close(el); cb(s); } });
  }

  return { bookingsHtml, ordersHtml, bookingHero, bookingRow, orderCard, orderRow, mount, otp, openOtp, popup: pp, message: msg };
})();
