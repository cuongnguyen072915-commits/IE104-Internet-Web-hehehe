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
      <p class="t-caption c-gray">Bản đồ án chưa có máy chủ: đơn chỉ được lưu trên trình duyệt đã đặt. <button type="button" class="trk-link" data-sample>Xem đơn mẫu (dữ liệu minh họa)</button></p></section>`;
    FB.hydrateIcons(root);
    $('form', root).addEventListener('submit', e => { e.preventDefault(); const v = e.target.ma.value.trim().toUpperCase().replace(/^#/, ''); if (v) location.search = '?ma=' + encodeURIComponent(v); });
    $('[data-sample]', root).addEventListener('click', () => { const o = O.createSample(); location.search = '?ma=' + encodeURIComponent(o.id); });
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
    const eta = o.eta || O.computeEta(o);
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
      : eta ? `<span class="trk-banner__eta-label">${o.pickup ? 'Dự kiến sẵn sàng' : 'Dự kiến giao'}</span><strong>${O.hm(eta.from)} – ${O.hm(eta.to)}</strong><small>Ước tính</small>`
      : `<span class="trk-banner__eta-label">${o.pickup ? 'Dự kiến sẵn sàng' : 'Dự kiến giao'}</span><strong class="is-small">Đang cập nhật</strong><small>Sau khi nhà hàng xác nhận</small>`;

    root.innerHTML = `
    ${o.sample ? `<p class="trk-sample">${I('alert-triangle')}<span><b>Đơn mẫu minh họa</b> — dữ liệu được tạo để xem giao diện, không phải đơn hàng thật.</span></p>` : ''}
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
        <strong class="trk-eta__time${delivered || stopped || !eta ? ' is-text' : ''}">${delivered ? `${O.fmtTime(O.statusAt(o, 'DELIVERED'))}` : stopped ? 'Không áp dụng' : eta ? `${O.hm(eta.from)} – ${O.hm(eta.to)}` : 'Đang cập nhật thời gian dự kiến'}</strong>
        <p>${delivered ? (o.pointsAwarded ? `+${vnd(o.expectedPoints)} điểm thành viên đã được cộng vào tài khoản của bạn.` : 'Cảm ơn bạn đã đặt món tại Fiabesco Palace.') : stopped ? esc(st.desc) : 'Thời gian có thể thay đổi tùy tình hình chuẩn bị và giao hàng.'}</p>
        ${eta && !delivered && !stopped ? `<small>Cập nhật lần cuối: ${O.hm(eta.updatedAt || o.updatedAt)}</small>` : ''}
      </div>
    </section>

    <!-- Phần 4 · Giao hàng -->
    <section class="trk-ship">
      <div class="trk-ship__info card">
        <h2 class="t-h4">${o.pickup ? 'Thông tin nhận món' : 'Thông tin giao hàng'}</h2>
        <dl class="trk-dl">
          <div><dt>${I('location-pin')}${o.pickup ? 'Nhận tại' : 'Địa chỉ nhận hàng'}</dt><dd>${esc(o.addr)}${o.deliveryArea && o.deliveryArea.name ? `<small>Khu vực giao hàng: ${esc(o.deliveryArea.name)}</small>` : ''}</dd></div>
          <div><dt>${I('user')}Người nhận</dt><dd>${esc(o.customer.name)}</dd></div>
          <div><dt>${I('phone')}Số điện thoại</dt><dd>${maskPhone(o.customer.phone)}<small>Ẩn một phần để bảo vệ thông tin cá nhân</small></dd></div>
          <div><dt>${I('chat')}Hướng dẫn giao hàng</dt><dd>${esc([o.apt, o.note].filter(Boolean).join(' · ') || 'Không có ghi chú')}${o.when === 'later' && o.slot ? `<small>Hẹn giao: ${esc(o.slot)}</small>` : ''}</dd></div>
          <div><dt>${I('credit-card')}Thanh toán</dt><dd>${esc(o.pay.label)}<span class="trk-pay ${pay[1]}">${pay[0]}</span></dd></div>
        </dl>
      </div>
      <div class="trk-map card">
        <div class="trk-map__frame">
          <img src="${IMG}delivery-route-map.svg" alt="Sơ đồ khu vực giao hàng (minh họa)">
          <div class="dpin" style="left:15.46%;top:60.53%"><span class="dpin__dot">${I('chef-hat')}</span><span class="dpin__label">Fiabesco Palace</span></div>
          ${o.pickup ? '' : `<div class="dpin" style="left:69.59%;top:69.74%"><span class="dpin__dot">${I('home')}</span><span class="dpin__label">Địa chỉ của bạn</span></div>`}
        </div>
        <p class="trk-map__note">${I('map')}Sơ đồ khu vực minh họa — hệ thống chưa có theo dõi GPS trực tiếp của tài xế.</p>
      </div>
    </section>

    <!-- Phần 5 + 6 · Chi tiết đơn (trái) ↔ Hỗ trợ & Đánh giá (phải) — mục G -->
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
        <div class="trk-support card">
          <h2 class="t-h4">Hỗ trợ đơn hàng</h2>
          <a class="trk-sup" href="tel:0123456789"><span>${I('phone')}</span><div><strong>Liên hệ nhà hàng</strong><small>Hotline 0123 456 789 · 10:00 – 22:00</small></div>${I('chevron-right')}</a>
          <a class="trk-sup" href="#chi-tiet-don"><span>${I('receipt')}</span><div><strong>Xem thông tin đơn</strong><small>Món, khẩu phần, topping và thanh toán</small></div>${I('chevron-right')}</a>
          <details class="trk-sup trk-sup--faq"><summary><span>${I('clock')}</span><div><strong>Đơn giao trễ?</strong><small>Hướng dẫn xử lý</small></div>${I('chevron-down')}</summary>
            <ol><li>Kiểm tra thời gian dự kiến — thời gian có thể thay đổi khi bếp đông khách hoặc trời mưa.</li><li>Nếu đã quá thời gian dự kiến 15 phút, gọi hotline 0123 456 789 và đọc mã đơn #${esc(o.id)}.</li><li>Đơn giao trễ quá 30 phút so với dự kiến sẽ được nhà hàng hỗ trợ ưu đãi cho lần đặt sau (theo chính sách của nhà hàng).</li></ol></details>
          ${canCancel ? `<button type="button" class="trk-cancel" data-cancel>Hủy đơn hàng</button>` : ''}
        </div>
        <div class="trk-review card" id="danh-gia">${reviewHTML(o)}</div>
      </div>
    </section>

    ${o.status === 'DELIVERED' || stopped ? '' : demoHTML(o)}`;
    FB.hydrateIcons(root);
    if (changed) {
      requestAnimationFrame(() => requestAnimationFrame(() => { const s = $('.trk-steps', root); if (s) s.style.setProperty('--fill', fillPct); }));
      FB.toast('Đơn hàng vừa được cập nhật', st.title + (eta && !delivered ? ` · Dự kiến ${O.hm(eta.from)} – ${O.hm(eta.to)}` : ''), '', '', 'navy');
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
  function demoHTML(o) {
    const next = O.STATUS[o.status].next.filter(s => s !== 'ORDER_PLACED' || o.status !== 'PENDING_PAYMENT');
    return `<details class="demo-ctl trk-demo"><summary>${I('sparkle')}Bộ điều khiển mô phỏng phía nhà hàng <span>· chỉ dùng cho demo đồ án</span></summary>
      <p>Dự án chưa có backend nên trạng thái đơn được chuyển thủ công tại đây (chỉ theo thứ tự hợp lệ). Trang tự cập nhật — kể cả khi mở ở tab khác.</p>
      <div class="demo-ctl__btns">${next.length ? next.map(s => `<button type="button" class="chip chip--sm" data-to="${s}">→ ${esc(O.info(o, s).title)}</button>`).join('') : '<span class="t-caption c-gray">Đơn đang chờ cổng thanh toán xác nhận (xem trang Thanh toán).</span>'}</div></details>`;
  }

  function bind(o) {
    $$('[data-to]', root).forEach(b => b.addEventListener('click', () => {
      const r = O.transition(o.id, b.dataset.to, 'Cập nhật mô phỏng'); if (!r.ok) { FB.toast('Không thể chuyển trạng thái', r.error, '', '', 'navy'); return; }
      sub && sub.poke(); const d = $('.trk-demo', root); if (d) d.open = true;
    }));
    const ro = $('[data-reorder]', root); if (ro) ro.addEventListener('click', () => { const items = Cart.get(); o.items.forEach(it => items.push({ ...it })); Cart.set(FB.Custom ? FB.Custom.mergeCart(items) : items); location.href = 'gio_hang.html'; });
    const cc = $('[data-cancel]', root); if (cc) cc.addEventListener('click', () => FB.openCancelOrder({ id: o.id, code: o.id, pay: o.pay.method === 'Tiền mặt' ? 'Tiền mặt' : o.pay.label, paid: o.pay.status === 'PAID' }));
    const d = $('.trk-demo', root); if (d && shownStatus === o.status && sessionStorage.getItem('trk_demo_open')) d.open = true;
    if (d) d.addEventListener('toggle', () => { try { d.open ? sessionStorage.setItem('trk_demo_open', '1') : sessionStorage.removeItem('trk_demo_open'); } catch (e) {} });
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
