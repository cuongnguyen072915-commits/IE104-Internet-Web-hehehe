/* Kết quả đơn hàng (Luồng 4): Đặt hàng thành công · Đơn đã hủy · Đã nhận món – Đánh giá
   Đọc đơn từ js/don_hang_store.js (FB_ORDERS) theo ?ma=<mã đơn> hoặc đơn gần nhất.
   Không hiển thị đơn giả khi không có dữ liệu. */
document.addEventListener('fb:ready', () => {
  const { $, $$, money, vnd, Cart, icon } = FB;
  const page = document.body.dataset.page;
  const O = window.FB_ORDERS;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const id = FB.params.get('ma') || (O && O.lastId());
  const o = O && id ? O.get(id) : null;
  const main = $('main');

  function notFound(title, desc) {
    main.innerHTML = `<section class="result__card card ok-missing"><span class="result__badge result__badge--wine"><i data-icon="receipt"></i></span>
      <h1 class="t-h2">${title}</h1><p class="t-body-l c-gray">${desc}</p>
      <div class="result__actions"><a class="btn btn--outline" href="thuc_don.html">Xem thực đơn</a><a class="btn btn--navy" href="theo_doi_don_hang.html">Tra cứu đơn hàng</a></div></section>`;
    main.classList.add('result'); FB.hydrateIcons(main);
  }
  if (!o) { notFound('Không tìm thấy đơn hàng', 'Chưa có dữ liệu đơn hàng trên thiết bị này hoặc mã đơn không đúng. Vui lòng kiểm tra lại mã đơn trong trang Tra cứu đơn.'); return; }

  const first = (o.customer.name || '').trim().split(/\s+/).slice(-2).join(' ');
  const cash = o.pay.method === 'Tiền mặt';
  const payState = { COD: 'Thanh toán khi nhận hàng', CASH_UNPAID: 'Chưa thanh toán · trả tiền mặt khi nhận hàng', PAID: 'Đã thanh toán', PENDING: 'Đang chờ xác nhận', UNPAID: 'Chưa thanh toán', FAILED: 'Thanh toán thất bại', CANCELED: 'Đã hủy giao dịch', EXPIRED: 'Hết hạn thanh toán' };
  const reorder = () => { const items = Cart.get(); (o.items || []).forEach(it => items.push({ ...it })); Cart.set(FB.Custom ? FB.Custom.mergeCart(items) : items); location.href = 'gio_hang.html'; };
  const table = rows => { $('#r-table').innerHTML = rows.map(([k, v, cls]) => `<div><dt>${k}</dt><dd class="${cls || ''}">${v}</dd></div>`).join(''); };

  /* ================= E · ĐẶT HÀNG THÀNH CÔNG ================= */
  if (page === 'dat_hang_thanh_cong') {
    if (o.status === 'CANCELED') { location.replace('don_hang_da_huy.html?ma=' + encodeURIComponent(o.id)); return; }
    if (o.status === 'PENDING_PAYMENT') { // chưa được xác nhận thanh toán → không hiển thị "thành công"
      notFound('Đơn hàng chưa được thanh toán', `Đơn #${esc(o.id)} đang chờ xác nhận thanh toán. Trang xác nhận chỉ hiển thị sau khi cổng thanh toán báo giao dịch thành công.`);
      const a = $('.ok-missing .btn--navy'); if (a) { a.href = 'thanh_toan.html'; a.textContent = 'Quay lại thanh toán'; } return;
    }
    $('#ok-card').removeAttribute('aria-busy');
    $('#r-desc').textContent = `Cảm ơn ${first || 'bạn'}! Fiabesco Palace đã ghi nhận đơn hàng #${o.id}${cash ? '' : ' và khoản thanh toán của bạn'}. Chúng tôi sẽ thông báo ngay khi nhà hàng xác nhận và bắt đầu chuẩn bị món.`;
    table([['Mã đơn hàng', '#' + esc(o.id)], ['Thời gian đặt', O.fmtTime(o.createdAt)], ['Phương thức thanh toán', esc(o.pay.label)],
      ['Trạng thái thanh toán', (cash && o.pay.status === 'UNPAID' ? payState.CASH_UNPAID : payState[o.pay.status]) || o.pay.status, o.pay.status === 'PAID' ? 'is-green' : ''], ['Tổng số tiền', `<span class="money">${money(o.total)}</span>`, 'is-money']]);
    // Thời gian dự kiến: chỉ lấy từ dữ liệu đơn; chưa xác nhận → "Đang cập nhật"
    const eta = o.eta || O.computeEta(o);
    $('#r-eta-label').textContent = o.pickup ? 'Thời gian nhận món dự kiến' : 'Thời gian giao hàng dự kiến';
    if (o.pickup) $('#r-eta .ok__eta-ic').innerHTML = icon('chef-hat');
    $('#r-eta-time').textContent = eta ? `${O.hm(eta.from)} – ${O.hm(eta.to)}` : 'Đang cập nhật thời gian dự kiến'; $('#r-eta-time').classList.toggle('is-text', !eta);
    $('#r-eta-note').textContent = eta ? 'Thời gian có thể thay đổi tùy tình hình chuẩn bị và giao hàng.'
      : `Thời gian dự kiến sẽ hiển thị khi nhà hàng xác nhận đơn (thường ${O.CFG.PREP_MIN + O.CFG.DELIVERY_MIN[0]}–${O.CFG.PREP_MIN + O.CFG.DELIVERY_MIN[1]} phút sau khi xác nhận).`;
    $('#r-track').href = 'theo_doi_don_hang.html?ma=' + encodeURIComponent(o.id);
    // Chỉ hủy được khi bếp chưa bắt đầu chuẩn bị (theo trạng thái, không theo đồng hồ)
    const btn = $('#cancel-order');
    const canCancel = ['ORDER_PLACED', 'CONFIRMED'].includes(o.status);
    if (!canCancel) { btn.disabled = true; btn.textContent = 'Nhà hàng đã bắt đầu chế biến – không thể hủy'; }
    btn.addEventListener('click', () => FB.openCancelOrder({ id: o.id, code: o.id, pay: cash ? 'Tiền mặt' : o.pay.label, paid: o.pay.status === 'PAID' }));
  }

  /* ================= ĐƠN ĐÃ HỦY ================= */
  if (page === 'don_hang_da_huy') {
    const paid = o.pay.status === 'PAID';
    $('#r-desc').textContent = paid ? `Fiabesco đã hủy đơn #${o.id} theo yêu cầu của bạn. Số tiền đã thanh toán sẽ được hoàn về ${o.pay.label}.`
      : `Fiabesco đã hủy đơn #${o.id} theo yêu cầu của bạn. Đơn chưa phát sinh thanh toán nên bạn không bị trừ tiền.`;
    table([['Trạng thái đơn', 'Đã hủy', 'is-wine'], ['Số tiền hoàn', `<span class="money">${money(paid ? o.total : 0)}</span>`, 'is-money'], ['Hoàn về', paid ? esc(o.pay.label) : 'Không phát sinh'], ['Thời gian dự kiến', paid ? '1–3 ngày làm việc' : '—']]);
    $('#reorder').addEventListener('click', reorder);
  }

  /* ================= G · ĐÃ NHẬN MÓN – ĐÁNH GIÁ ================= */
  if (page === 'danh_gia_don_hang') {
    const done = O.statusAt(o, 'DELIVERED');
    $('#order-meta').textContent = `Mã đơn #${o.id} · ${done ? 'Đã giao lúc ' + O.hm(done) : O.info(o, o.status).title} · ${money(o.total)}`;
    if (done) { $('#done-at').textContent = O.hm(done); $('#t4').textContent = O.hm(done); }
    ['CONFIRMED', 'PREPARING', 'DELIVERING'].forEach((s, i) => { const t = O.statusAt(o, s); const el = $$('.track__step small')[i]; if (el) el.textContent = t ? O.hm(t) : '—'; });
    $('#to').textContent = (o.addr || '') + (o.apt ? ' · ' + o.apt : '');
    $('#who').textContent = `${first} · ${o.customer.phone}`;
    $('#lines').innerHTML = (o.items || []).map(it => { const d = FB_DATA.byId(it.id) || {}; return `<div class="line-item"><img src="${d.img}" alt=""><div class="stack"><strong style="font:600 15px/1.4 var(--f-sans)">${esc(d.name)}</strong><span class="t-caption c-gray">× ${it.qty}${it.opt ? ' · ' + esc(it.opt) : ''}</span></div><span class="price money">${vnd(it.qty * it.unit)}</span></div>`; }).join('');
    $('#sub').textContent = money(o.sub); $('#fee').textContent = money(o.fee); $('#disc').textContent = '−' + money(Math.max(0, o.disc)); $('#total').textContent = money(o.total);
    $('#reorder').addEventListener('click', reorder);
    initReview(o);
  }

  function initReview(order) {
    const form = $('#review'); if (!form) return;
    const LABEL = ['', 'Chưa hài lòng · 1/5', 'Tạm được · 2/5', 'Khá ngon · 3/5', 'Rất ngon · 4/5', 'Tuyệt vời · 5/5'];
    if (order.status !== 'DELIVERED') { // chỉ đánh giá khi đơn đã giao
      form.classList.add('is-locked');
      form.querySelectorAll('button,textarea').forEach(x => { if (!x.closest('.result__actions a')) x.disabled = true; });
      form.insertAdjacentHTML('afterbegin', `<p class="review__lock">${icon('clock')}Bạn có thể đánh giá sau khi đơn hàng được giao thành công. Trạng thái hiện tại: <b>${esc(O.info(order, order.status).title)}</b>.</p>`);
      FB.hydrateIcons(form); return;
    }
    if (order.review) { // đã gửi trước đó
      form.innerHTML = `<span class="t-eyebrow c-wine">Đánh giá đơn hàng</span><h2 class="t-h3">Cảm ơn bạn đã đánh giá!</h2>
        <div class="review__done"><span class="stars-big">${'★'.repeat(order.review.stars)}<span class="stars__off">${'★'.repeat(5 - order.review.stars)}</span></span><strong>${LABEL[order.review.stars]}</strong></div>
        ${order.review.text ? `<blockquote class="review__quote">“${esc(order.review.text)}”</blockquote>` : ''}<p class="t-body-s c-gray">Gửi lúc ${O.fmtTime(order.review.at)}</p>`;
      return;
    }
    let stars = 0;
    const paint = n => $$('[data-star]').forEach(b => { const on = +b.dataset.star <= n; b.classList.toggle('is-on', on); b.setAttribute('aria-checked', +b.dataset.star === stars); });
    $$('[data-star]').forEach(b => {
      b.addEventListener('mouseenter', () => paint(+b.dataset.star)); b.addEventListener('mouseleave', () => paint(stars));
      b.addEventListener('click', () => { stars = +b.dataset.star; paint(stars); $('#star-text').textContent = LABEL[stars]; $('#star-text').hidden = false; $('#review-err').hidden = true; });
    });
    $('#tags').addEventListener('click', e => { const c = e.target.closest('.chip'); if (c) c.setAttribute('aria-pressed', c.getAttribute('aria-pressed') !== 'true'); });
    const cp = $('[data-copy]'); if (cp) cp.addEventListener('click', e => { const v = e.currentTarget.dataset.copy; (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject()).catch(() => {}).finally(() => FB.toast('Đã sao chép mã', v, '', '', 'navy')); });
    form.addEventListener('submit', e => {
      e.preventDefault(); if (!stars) { $('#review-err').hidden = false; return; }
      const cur = O.get(order.id); if (!cur || cur.status !== 'DELIVERED') return;
      cur.review = { stars, tags: $$('#tags [aria-pressed="true"]').map(c => c.textContent), text: form.text.value.trim().slice(0, 1000), at: Date.now() };
      O.put(cur); FB.openThanks(); initReview(cur);
    });
  }
  window.FB_INIT_REVIEW = initReview; // dùng lại ở trang Theo dõi đơn hàng
});
