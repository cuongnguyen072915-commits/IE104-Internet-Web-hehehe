/* =====================================================================
   Theo dõi đơn hàng — thiết kế lại (F) + đổi chỗ Chi tiết đơn ↔ Đánh giá (G)
   - Dữ liệu: FB_ORDERS (js/don_hang_store.js) theo ?ma=<mã> hoặc đơn gần nhất.
   - Cập nhật “thời gian thực”: FB_ORDERS.subscribe (sự kiện storage + polling 5s, 1 interval).
     Khi có backend: thay bằng SSE/WebSocket — xem TODO(BE) trong don_hang_store.js.
   - Trạng thái chỉ đổi khi dữ liệu đơn đổi (bộ điều khiển mô phỏng phía nhà hàng),
     KHÔNG tự chuyển theo đồng hồ. ETA chỉ là ước tính.
   ===================================================================== */
document.addEventListener('fb:ready', () => {
  const { $, $$, icon: I, money, vnd, Cart } = FB;
  const O = window.FB_ORDERS, root = $('#trk-root');
  const IMG = '../assets/template-20261120T115451Z-1-001 - Copy/template/';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const maskPhone = p => { const d = String(p || '').replace(/\D/g, ''); return d.length >= 9 ? `${d.slice(0, 4)} *** ${d.slice(-3)}` : '—'; };
  const PAY_STATE = { COD: ['Thanh toán khi nhận hàng', ''], PAID: ['Đã thanh toán', 'is-ok'], PENDING: ['Đang chờ xác nhận', 'is-warn'], UNPAID: ['Chưa thanh toán', 'is-warn'], FAILED: ['Thanh toán thất bại', 'is-bad'], CANCELED: ['Đã hủy giao dịch', 'is-bad'], EXPIRED: ['Hết hạn thanh toán', 'is-bad'] };
  let sub = null, shownStatus = null;

  /* ---------- Trạng thái tải / lỗi / không có đơn ---------- */
  function error(msg) {
    root.innerHTML = `<section class="trk-empty card"><span class="trk-empty__ic is-bad">${I('wifi-off')}</span><h1 class="t-h3">Không tải được dữ liệu đơn hàng</h1>
      <p class="t-body c-gray">${esc(msg || 'Đã có lỗi khi đọc dữ liệu đơn hàng.')} Vui lòng thử lại.</p><button type="button" class="btn btn--navy" data-retry>${I('refresh')}Thử lại</button></section>`;
    FB.hydrateIcons(root); $('[data-retry]', root).addEventListener('click', load);
  }
  function lookup(code) {
    root.innerHTML = `<section class="trk-empty card"><span class="trk-empty__ic">${I('receipt')}</span>
      <h1 class="t-h3">${code ? `Không tìm thấy đơn #${esc(code)}` : 'Tra cứu đơn hàng'}</h1>
      <p class="t-body c-gray">${code ? 'Mã đơn không có trên thiết bị này. Hãy kiểm tra lại mã trong trang xác nhận đặt hàng.' : 'Nhập mã đơn (ví dụ FB261127-ABC123) để xem tiến trình giao hàng.'}</p>
      <form class="trk-lookup" novalidate><label class="field"><span class="field__label">Mã đơn hàng</span><span class="field__box"><input name="ma" autocomplete="off" placeholder="FB261127-ABC123" value="${esc(code || '')}" maxlength="24"></span></label><button class="btn btn--navy" type="submit">Tra cứu</button></form>
      <p class="t-caption c-gray">Thông tin đơn được lưu trên thiết bị bạn đã dùng để đặt hàng. Cần hỗ trợ, vui lòng gọi 0123 456 789.</p></section>`;
    FB.hydrateIcons(root);
    $('form', root).addEventListener('submit', e => { e.preventDefault(); const v = e.target.ma.value.trim().toUpperCase().replace(/^#/, ''); if (v) location.search = '?ma=' + encodeURIComponent(v); });
  }
  function load() {
    root.innerHTML = '<div class="trk-skel" aria-busy="true" aria-label="Đang tải đơn hàng"><i></i><i></i><i></i></div>';
    if (!O) return error('Thiếu mô-đun dữ liệu đơn hàng.');
    let o; const code = FB.params.get('ma');
    try { o = O.get(code || O.lastId()); } catch (e) { return error(); }
    if (!o) return lookup(code);
    render(o);
    if (sub) sub.stop();
    sub = O.subscribe(o.id, (n, prev) => { if (!n) return; render(n, prev); });
  }

  /* ---------- Dựng giao diện ---------- */
  function stepState(o) {
    const idx = O.STEPS.indexOf(o.status); // -1: ORDER_PLACED/PENDING/CANCELED/FAILED
    let reached = idx;
    if (o.status === 'CANCELED' || o.status === 'FAILED_DELIVERY') reached = Math.max(...O.STEPS.map((s, i) => (O.statusAt(o, s) ? i : -1)));
    return { idx, reached };
  }
  function render(o, prev) {
    const st = O.info(o, o.status), { idx, reached } = stepState(o);
    const stopped = o.status === 'CANCELED' || o.status === 'FAILED_DELIVERY';
    stopJourney();
    let eta = o.eta || O.computeEta(o);
    const J = journey(o); if (J) eta = { from: J.arrival, to: J.arrival, updatedAt: J.at };
    const placed = O.statusAt(o, 'ORDER_PLACED') || o.createdAt;
    const pay = PAY_STATE[o.pay.status] || [o.pay.status, ''];
    const fillPct = Math.max(0, reached) / (O.STEPS.length - 1) * 100;
    const prevReached = prev && prev.status ? stepState(prev).reached : reached;
    const prevPct = Math.max(0, prevReached) / (O.STEPS.length - 1) * 100;
    const changed = prev && prev.status !== o.status;
    const delivered = o.status === 'DELIVERED';
    const canCancel = ['ORDER_PLACED', 'CONFIRMED'].includes(o.status);

    const etaBox = delivered ? `<span class="trk-banner__eta-label">Đã giao lúc</span><strong>${O.hm(O.statusAt(o, 'DELIVERED'))}</strong><small>${O.dmy(O.statusAt(o, 'DELIVERED'))}</small>`
      : stopped ? `<span class="trk-banner__eta-label">Trạng thái</span><strong class="is-small">${esc(st.title)}</strong>`
      : eta ? `<span class="trk-banner__eta-label">${o.pickup ? 'Dự kiến sẵn sàng' : 'Dự kiến giao'}</span><strong>${etaTxt(eta)}</strong><small>Ước tính</small>`
      : `<span class="trk-banner__eta-label">${o.pickup ? 'Dự kiến sẵn sàng' : 'Dự kiến giao'}</span><strong class="is-small">Đang cập nhật</strong><small>Sau khi nhà hàng xác nhận</small>`;

    root.innerHTML = `
    <!-- Phần 1 · Header trạng thái -->
    <section class="trk-banner trk-banner--${st.tone}${changed ? ' is-changed' : ''}" aria-labelledby="trk-status">
      <span class="trk-banner__ic">${I(st.icon)}</span>
      <div class="trk-banner__txt">
        <span class="trk-banner__eyebrow">Đơn hàng của bạn · <b>#${esc(o.id)}</b></span>
        <h1 class="trk-banner__status" id="trk-status">${esc(st.banner)}</h1>
        <p class="trk-banner__desc">${esc(st.desc)}</p>
      </div>
      <div class="trk-banner__eta">${etaBox}</div>
    </section>

    <!-- Phần 2 · Tiến trình -->
    <section class="trk-progress card${stopped ? ' is-stopped' : ''}" aria-label="Tiến trình đơn hàng">
      <p class="trk-progress__placed">${I('receipt')}Đặt hàng thành công lúc <b>${O.fmtTime(placed)}</b>${o.status === 'PENDING_PAYMENT' ? ' · <span class="is-warn">đang chờ xác nhận thanh toán</span>' : ''}</p>
      <ol class="trk-steps" style="--fill:${changed ? prevPct : fillPct}">
        ${O.STEPS.map((s, i) => { const t = O.statusAt(o, s); const cls = i < reached || (i === reached && delivered) ? 'is-done' : i === reached ? 'is-now' : ''; const inf = O.info(o, s);
          return `<li class="trk-step ${cls}${changed && i === idx ? ' is-new' : ''}"${i === reached ? ' aria-current="step"' : ''}>
            <span class="trk-step__dot">${I(cls === 'is-done' ? 'check' : inf.icon)}</span>
            <strong>${esc(inf.title)}</strong><small>${t ? O.hm(t) : (i === reached + 1 && !stopped && reached > -1 ? 'Tiếp theo' : '—')}</small></li>`; }).join('')}
      </ol>
      ${stopped ? `<p class="trk-progress__stop">${I('alert-triangle')}${o.status === 'CANCELED' ? 'Tiến trình đã dừng vì đơn hàng bị hủy' : 'Tiến trình tạm dừng — nhà hàng sẽ liên hệ để sắp xếp lại việc giao hàng'} lúc ${O.hm(O.statusAt(o, o.status))}.</p>` : ''}
      <details class="trk-history"><summary>Lịch sử trạng thái (${o.history.length})</summary>
        <ul>${o.history.slice().reverse().map(h => `<li><b>${O.fmtTime(h.at)}</b><span>${esc(O.info(o, h.status).title)}${h.note ? ' · ' + esc(h.note) : ''}</span></li>`).join('')}</ul></details>
    </section>

    <!-- Phần 3 · Thời gian dự kiến -->
    <section class="trk-eta card${delivered ? ' is-done' : ''}">
      <span class="trk-eta__ic">${I(delivered ? 'check' : 'clock')}</span>
      <div>
        <span class="trk-eta__label">${delivered ? (o.pickup ? 'Đã nhận món' : 'Đơn hàng đã được giao thành công') : (o.pickup ? 'Thời gian nhận món dự kiến' : 'Thời gian giao hàng dự kiến')}</span>
        <strong class="trk-eta__time${delivered || stopped || !eta ? ' is-text' : ''}">${delivered ? `${O.fmtTime(O.statusAt(o, 'DELIVERED'))}` : stopped ? 'Không áp dụng' : eta ? `${etaTxt(eta)}` : 'Đang cập nhật thời gian dự kiến'}</strong>
        <p>${delivered ? (o.pointsAwarded ? `+${vnd(o.expectedPoints)} điểm thành viên đã được cộng vào tài khoản của bạn.` : 'Cảm ơn bạn đã đặt món tại Fiabesco Palace.') : stopped ? esc(st.desc) : 'Thời gian có thể thay đổi tùy tình hình chuẩn bị và giao hàng.'}</p>
        ${eta && !delivered && !stopped ? `<small>Cập nhật lần cuối: ${O.hm(eta.updatedAt || o.updatedAt)}</small>` : ''}
      </div>
    </section>

    <!-- 1.2 · (4) Thông tin giao hàng — hiển thị ở mọi trạng thái -->
    <section class="trk-ship__info card">
      <h2 class="t-h4">${o.pickup ? 'Thông tin nhận món' : 'Thông tin giao hàng'}</h2>
      <dl class="trk-dl trk-dl--grid">
        <div><dt>${I('location-pin')}${o.pickup ? 'Nhận tại' : 'Địa chỉ nhận hàng'}</dt><dd>${esc(o.addr)}${o.deliveryArea && o.deliveryArea.name ? `<small>Khu vực giao hàng: ${esc(o.deliveryArea.name)}</small>` : ''}</dd></div>
        <div><dt>${I('user')}Người nhận</dt><dd>${esc(o.customer.name)}</dd></div>
        <div><dt>${I('phone')}Số điện thoại</dt><dd>${maskPhone(o.customer.phone)}<small>Ẩn một phần để bảo vệ thông tin cá nhân</small></dd></div>
        <div><dt>${I('chat')}Hướng dẫn giao hàng</dt><dd>${esc([o.apt, o.note].filter(Boolean).join(' · ') || 'Không có ghi chú')}${o.when === 'later' && o.slot ? `<small>Hẹn giao: ${esc(o.slot)}</small>` : ''}</dd></div>
        <div><dt>${I('credit-card')}Thanh toán</dt><dd>${esc(o.pay.label)}<span class="trk-pay ${pay[1]}">${pay[0]}</span></dd></div>
      </dl>
    </section>

    ${o.status === 'DELIVERING' && !o.pickup ? liveHTML(o, eta) : ''}


    <!-- 1.2 · (7)(8) Chi tiết đơn hàng + Hỗ trợ đơn hàng ở cuối trang -->
    <section class="trk-bottom">
      <div class="trk-detail card" id="chi-tiet-don">
        <h2 class="t-h4">Chi tiết đơn hàng <span>${o.items.length} món</span></h2>
        <ul class="trk-items">${o.items.map(it => { const d = FB_DATA.byId(it.id) || {}; const parts = String(it.opt || '').split(' · ').filter(Boolean);
          const size = parts.find(p => !p.startsWith('+') && !p.startsWith('Ghi chú')) || ''; const tops = parts.filter(p => p.startsWith('+')).map(p => p.replace(/^\+\s*/, '')); const note = (parts.find(p => p.startsWith('Ghi chú')) || '').replace('Ghi chú: ', '');
          return `<li class="trk-item"><img src="${d.img || ''}" alt=""><div class="trk-item__txt"><strong>${esc(d.name || it.id)}</strong>
            ${size ? `<span>${esc(size)}</span>` : ''}${tops.length ? `<span class="trk-item__tops">Topping: ${esc(tops.join(', '))}</span>` : ''}${note ? `<span>Ghi chú: ${esc(note)}</span>` : ''}
            <em>× ${it.qty} · ${vnd(it.unit)} / phần</em></div><b class="money">${money(it.qty * it.unit)}</b></li>`; }).join('')}</ul>
        <div class="trk-sum">
          <div><span>Tạm tính</span><span class="money">${money(o.sub)}</span></div>
          <div><span>Phí vận chuyển</span><span class="money">${money(o.fee)}</span></div>
          <div><span>Giảm giá${o.coupon ? ' (' + esc(o.coupon) + ')' : ''}</span><span class="money c-green">−${money(Math.max(0, o.disc))}</span></div>
          <div class="trk-sum__total"><span>${o.pay.status === 'PAID' ? 'Đã thanh toán' : 'Tổng thanh toán'}</span><b class="money">${money(o.total)}</b></div>
        </div>
        <button type="button" class="btn btn--outline btn--block" data-reorder>Đặt lại đơn này</button>
      </div>
      <div class="trk-side">
      ${delivered ? `<!-- Đã nhận món: khung đánh giá gọn, cùng cột với Hỗ trợ -->
      <section class="trk-review card" id="danh-gia">${reviewHTML(o)}</section>` : ''}
      <div class="trk-support card">
        <h2 class="t-h4">Hỗ trợ đơn hàng</h2>
        <a class="trk-sup" href="tel:0123456789"><span>${I('phone')}</span><div><strong>Liên hệ nhà hàng</strong><small>Hotline 0123 456 789 · 10:00 – 22:00</small></div>${I('chevron-right')}</a>
        <a class="trk-sup" href="#chi-tiet-don"><span>${I('receipt')}</span><div><strong>Xem thông tin đơn</strong><small>Món, khẩu phần, topping và thanh toán</small></div>${I('chevron-right')}</a>
        <details class="trk-sup trk-sup--faq"><summary><span>${I('clock')}</span><div><strong>Đơn giao trễ?</strong><small>Hướng dẫn xử lý</small></div>${I('chevron-down')}</summary>
          <ol><li>Kiểm tra thời gian dự kiến — thời gian có thể thay đổi khi bếp đông khách hoặc trời mưa.</li><li>Nếu đã quá thời gian dự kiến 15 phút, gọi hotline 0123 456 789 và đọc mã đơn #${esc(o.id)}.</li><li>Đơn giao trễ quá 30 phút so với dự kiến sẽ được nhà hàng hỗ trợ ưu đãi cho lần đặt sau (theo chính sách của nhà hàng).</li></ol></details>
        ${delivered ? '' : `<p class="review__lock">${I('star')}Bạn có thể đánh giá món ăn sau khi đơn hàng được giao thành công.</p>`}
        ${canCancel ? `<button type="button" class="btn btn--cancel trk-cancel" data-cancel>Hủy đơn hàng</button>` : ''}
      </div>
      </div>
    </section>`;
    FB.hydrateIcons(root);
    if (changed) {
      requestAnimationFrame(() => requestAnimationFrame(() => { const s = $('.trk-steps', root); if (s) s.style.setProperty('--fill', fillPct); }));
      if (delivered) FB.toast('Đơn hàng đã hoàn tất', `Đã giao đến địa chỉ nhận lúc ${O.hm(O.statusAt(o, 'DELIVERED'))}`, '', '', 'navy');
      else FB.toast('Đơn hàng vừa được cập nhật', st.title + (eta ? ` · Dự kiến ${etaTxt(eta)}` : ''), '', '', 'navy');
    }
    shownStatus = o.status;
    bind(o);
  }

  /* ---------- Đánh giá (G): chỉ mở khi đã nhận món; bỏ dòng "Chạm để chọn số sao" ---------- */
  const LABEL = ['', 'Chưa hài lòng · 1/5', 'Tạm được · 2/5', 'Khá ngon · 3/5', 'Rất ngon · 4/5', 'Tuyệt vời · 5/5'];
  function reviewHTML(o) {
    if (o.review) return `<span class="t-eyebrow c-wine">Đánh giá đơn hàng</span><h2 class="t-h4">Cảm ơn bạn đã đánh giá!</h2>
      <div class="review__done"><span class="stars-big">${'★'.repeat(o.review.stars)}<span class="stars__off">${'★'.repeat(5 - o.review.stars)}</span></span><strong>${LABEL[o.review.stars]}</strong></div>
      ${o.review.text ? `<blockquote class="review__quote">“${esc(o.review.text)}”</blockquote>` : ''}<p class="t-caption c-gray">Đã gửi lúc ${O.fmtTime(o.review.at)}</p>`;
    if (o.status !== 'DELIVERED') return `<span class="t-eyebrow c-wine">Đánh giá đơn hàng</span><h2 class="t-h4">Chưa thể đánh giá</h2>
      <p class="review__lock">${I('clock')}Bạn có thể đánh giá món ăn sau khi đơn hàng được giao thành công.</p>`;
    return `<form class="review review--side" id="trk-review" novalidate>
      <span class="t-eyebrow c-wine">Đánh giá đơn hàng</span><h2 class="t-h4">Bữa ăn của bạn thế nào?</h2>
      <div class="review__stars" role="radiogroup" aria-label="Chấm điểm từ 1 đến 5 sao">${[1, 2, 3, 4, 5].map(n => `<button type="button" role="radio" aria-checked="false" data-star="${n}" aria-label="${n} sao">${I('star')}</button>`).join('')}
        <strong id="trk-star-text" hidden></strong></div>
      <div class="review__tags" id="trk-tags">${['Món ngon', 'Giao nhanh', 'Đóng gói đẹp', 'Tài xế thân thiện', 'Đúng giờ'].map(t => `<button type="button" class="chip chip--sm" aria-pressed="false">${t}</button>`).join('')}</div>
      <label class="field"><span class="field__label">Nhận xét (không bắt buộc)</span><textarea class="textarea" name="text" rows="4" maxlength="1000" placeholder="Chia sẻ cảm nhận của bạn về món ăn và người giao hàng…"></textarea></label>
      <p class="review__err" id="trk-review-err" hidden>Vui lòng chọn số sao trước khi gửi đánh giá.</p>
      <button class="btn btn--navy btn--block" type="submit">Gửi đánh giá</button></form>`;
  }
  /* =================================================================
     4 · ĐANG GIAO HÀNG — tài xế + lộ trình
     - Đơn có GPS thật (o.gps.real, do hệ thống cung cấp): dùng vị trí đó.
     - Đơn trình diễn (chưa có backend): lộ trình dựng sẵn từ nhà hàng → địa chỉ nhận, mỗi 3 giây sang điểm kế.
       Vị trí tính theo THỜI ĐIỂM bắt đầu giao (không cộng dồn) → tải lại trang / mở nhiều tab không tạo tiến trình trùng.
       Hết lộ trình → chuyển "Đã nhận món" — chỉ áp dụng cho đơn trình diễn (o.demo), không dùng cho đơn thật.
     ================================================================= */
  const ROUTE = [[120, 230], [120, 155], [365, 155], [365, 265], [540, 265]]; // theo delivery-route-map.svg 776×380
  const STOPS = 9, STEP_MS = 3000; // 3 giây / chặng
  const DEMO_DRIVER = { name: 'Nguyễn Minh Khang', role: 'Nhân viên giao hàng Fiabesco Palace' };
  const SEG = ROUTE.slice(1).map((pt, i) => Math.hypot(pt[0] - ROUTE[i][0], pt[1] - ROUTE[i][1]));
  const TOTAL = SEG.reduce((x, y) => x + y, 0);
  function routeXY(p) { // điểm trên tuyến theo tỉ lệ quãng đường p (0..1), toạ độ SVG 776×380
    let d = Math.max(0, Math.min(1, p)) * TOTAL, i = 0;
    while (i < SEG.length - 1 && d > SEG[i]) { d -= SEG[i]; i++; }
    const A = ROUTE[i], B = ROUTE[i + 1], t = SEG[i] ? d / SEG[i] : 0;
    return [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t];
  }
  function pathTo(p) { // các đỉnh đã đi qua + điểm hiện tại
    const out = [ROUTE[0]]; let acc = 0;
    for (let i = 0; i < SEG.length; i++) { acc += SEG[i]; if (acc / TOTAL < p) out.push(ROUTE[i + 1]); else break; }
    out.push(routeXY(p)); return out;
  }
  function pathFrom(p) { const out = [routeXY(p)]; let acc = 0; for (let i = 0; i < SEG.length; i++) { acc += SEG[i]; if (acc / TOTAL > p) out.push(ROUTE[i + 1]); } return out; }
  const pts = list => list.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const etaTxt = e => (e.from === e.to ? O.hm(e.from) : `${O.hm(e.from)} – ${O.hm(e.to)}`);
  const realGps = o => !!(o.gps && o.gps.real);
  /** Lộ trình trình diễn: null nếu không áp dụng */
  function journey(o) {
    if (o.status !== 'DELIVERING' || o.pickup || realGps(o) || !o.demo) return null;
    const start = O.statusAt(o, 'DELIVERING') || Date.now();
    const step = Math.max(0, Math.min(STOPS - 1, Math.floor((Date.now() - start) / STEP_MS)));
    return { start, step, p: step / (STOPS - 1), arrival: start + (STOPS - 1) * STEP_MS, at: start + step * STEP_MS, done: step >= STOPS - 1 };
  }
  let jTimer = 0;
  function stopJourney() { clearTimeout(jTimer); jTimer = 0; }
  function startJourney(o) {
    stopJourney();
    const J = journey(o); if (!J) return;
    if (J.done) { // hết lộ trình trình diễn → hoàn tất đơn trình diễn
      const r = O.transition(o.id, 'DELIVERED', 'Đã giao đến địa chỉ nhận (lộ trình trình diễn)');
      if (r.ok && sub) sub.poke(); return;
    }
    paintJourney(J);
    const wait = STEP_MS - ((Date.now() - J.start) % STEP_MS) + 40;
    jTimer = setTimeout(() => { const cur = O.get(o.id); if (cur) startJourney(cur); }, wait);
  }
  function paintJourney(J) {
    const map = $('.trk-map__frame', root); if (!map) return;
    const [x, y] = routeXY(J.p);
    const rider = $('.rider', map); if (rider) { rider.style.left = (x / 776 * 100) + '%'; rider.style.top = (y / 380 * 100) + '%'; }
    const done = $('[data-route-done]', map), rest = $('[data-route-rest]', map);
    if (done) done.setAttribute('points', pts(pathTo(J.p))); if (rest) rest.setAttribute('points', pts(pathFrom(J.p)));
    const left = Math.max(0, Math.ceil((J.arrival - Date.now()) / 1000));
    const m = $('[data-move]', root); if (m) m.innerHTML = `<b>Tài xế đang trên đường giao</b> · đã đi khoảng ${Math.round(J.p * 100)}% lộ trình · dự kiến đến nơi lúc ${O.hm(J.arrival)}${left ? ` (khoảng ${left} giây nữa)` : ''}`;
    const bar = $('[data-move-bar]', root); if (bar) bar.style.width = Math.round(J.p * 100) + '%';
  }
  window.addEventListener('pagehide', stopJourney);
  function liveHTML(o, eta) {
    const J = journey(o);
    const dr = o.driver && !o.driver.demo ? o.driver : (o.demo ? DEMO_DRIVER : null);
    const hasMap = !!J || realGps(o);
    const p = J ? J.p : (realGps(o) ? Math.max(0, Math.min(1, o.gps.progress || 0)) : 0);
    const [x, y] = routeXY(p);
    return `<!-- (5) Lộ trình & tài xế — chỉ khi đang giao -->
    <section class="trk-live">
      <div class="trk-map card">
        <div class="trk-live__head"><h2 class="t-h4">${realGps(o) ? 'Vị trí tài xế' : 'Lộ trình dự kiến'}</h2></div>
        ${hasMap ? `<div class="trk-map__frame">
            <img src="${IMG}delivery-route-map.svg" alt="Sơ đồ tuyến giao hàng từ nhà hàng đến địa chỉ nhận">
            <svg class="trk-route" viewBox="0 0 776 380" preserveAspectRatio="none" aria-hidden="true">
              <polyline data-route-rest points="${pts(pathFrom(p))}"/><polyline data-route-done points="${pts(pathTo(p))}"/></svg>
            <div class="dpin" style="left:15.46%;top:60.53%"><span class="dpin__dot">${I('chef-hat')}</span><span class="dpin__label">Fiabesco Palace</span></div>
            <div class="dpin" style="left:69.59%;top:69.74%"><span class="dpin__dot">${I('home')}</span><span class="dpin__label">Địa chỉ nhận</span></div>
            <span class="rider" style="left:${x / 776 * 100}%;top:${y / 380 * 100}%">${I('delivery-truck')}</span>
          </div>
          <div class="trk-move-bar"><i data-move-bar style="width:${Math.round(p * 100)}%"></i></div>
          <p class="trk-move">${I('delivery-truck')}<span data-move><b>Tài xế đang trên đường giao</b>${eta ? ` · dự kiến đến nơi ${etaTxt(eta)}` : ''}</span></p>`
        : `<div class="trk-nogps">${I('map')}<div><strong>Chưa có dữ liệu vị trí</strong><p>Đơn hàng đang trên đường giao${eta ? `, dự kiến đến nơi ${etaTxt(eta)}` : ''}. Vị trí sẽ hiển thị khi hệ thống cập nhật.</p></div></div>`}
      </div>
      <div class="trk-driver card">
        <div class="trk-live__head"><h2 class="t-h4">Tài xế giao hàng</h2></div>
        ${dr ? `<div class="trk-driver__row"><span class="trk-driver__av">${dr.photo ? `<img src="${esc(dr.photo)}" alt="">` : I('delivery-truck')}</span>
            <div class="trk-driver__txt"><strong>${esc(dr.name)}</strong><small>${esc(dr.role || [dr.vehicle, dr.plate].filter(Boolean).join(' · ') || 'Nhân viên giao hàng')}</small></div></div>
          <div class="trk-driver__status"><span class="trk-dot"></span>Đang giao hàng${eta ? ` · Dự kiến đến nơi ${etaTxt(eta)}` : ''}</div>
          <div class="trk-driver__acts">${dr.phone ? `<a class="btn btn--navy" href="tel:${esc(String(dr.phone).replace(/\s/g, ''))}">${I('phone')}Gọi tài xế</a>` : `<a class="btn btn--outline" href="tel:0123456789">${I('phone')}Liên hệ qua nhà hàng</a>`}</div>`
        : `<div class="trk-nogps trk-nogps--sm">${I('user')}<div><strong>Đang cập nhật thông tin tài xế</strong><p>Cần hỗ trợ ngay, vui lòng gọi 0123 456 789.</p></div></div>`}
      </div>
    </section>`;
  }
  function bind(o) {
    startJourney(o); // chỉ chạy khi đang giao + đơn trình diễn; tự dừng ở trạng thái khác
    const ro = $('[data-reorder]', root); if (ro) ro.addEventListener('click', () => { const items = Cart.get(); o.items.forEach(it => items.push({ ...it })); Cart.set(FB.Custom ? FB.Custom.mergeCart(items) : items); location.href = 'gio_hang.html'; });
    const cc = $('[data-cancel]', root); if (cc) cc.addEventListener('click', () => FB.openCancelOrder({ id: o.id, code: o.id, pay: o.pay.method === 'Tiền mặt' ? 'Tiền mặt' : o.pay.label, paid: o.pay.status === 'PAID' }));
    const f = $('#trk-review', root); if (!f) return;
    let stars = 0;
    const paint = n => $$('[data-star]', f).forEach(b => { b.classList.toggle('is-on', +b.dataset.star <= n); b.setAttribute('aria-checked', +b.dataset.star === stars); });
    $$('[data-star]', f).forEach(b => {
      b.addEventListener('mouseenter', () => paint(+b.dataset.star)); b.addEventListener('mouseleave', () => paint(stars));
      b.addEventListener('click', () => { stars = +b.dataset.star; paint(stars); const t = $('#trk-star-text', f); t.textContent = LABEL[stars]; t.hidden = false; $('#trk-review-err', f).hidden = true; });
    });
    $('#trk-tags', f).addEventListener('click', e => { const c = e.target.closest('.chip'); if (c) c.setAttribute('aria-pressed', c.getAttribute('aria-pressed') !== 'true'); });
    f.addEventListener('submit', e => {
      e.preventDefault(); if (!stars) { $('#trk-review-err', f).hidden = false; return; }
      const cur = O.get(o.id); if (!cur || cur.status !== 'DELIVERED' || cur.review) return;
      cur.review = { stars, tags: $$('#trk-tags [aria-pressed="true"]', f).map(c => c.textContent), text: f.text.value.trim(), at: Date.now() };
      O.put(cur); FB.openThanks && FB.openThanks(); sub && sub.poke();
    });
  }

  load();
});
