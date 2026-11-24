/* Kết quả đơn hàng (Luồng 4): Đặt hàng thành công · Đơn đã hủy · Đã nhận món – Đánh giá
   Đọc đơn vừa đặt từ sessionStorage "fb_order" (do thanh_toan.js lưu). */
document.addEventListener('fb:ready', () => {
  const { $, $$, money, vnd, Cart } = FB;
  const page = document.body.dataset.page;
  let o; try { o = JSON.parse(sessionStorage.getItem('fb_order')); } catch (e) {}
  o = o || { name: 'Nguyễn Minh Anh', phone: '0901 234 567', addr: '68 Lê Lợi, Q.1', apt: 'Lầu 5', pay: 'ZaloPay', total: 499000, sub: 509000, fee: 25000, disc: 35000,
    items: [{ id: 'lasagna', qty: 1, unit: 184000, opt: 'Phần tiêu chuẩn · + Phô mai Mozzarella' }, { id: 'burrata', qty: 2, unit: 118000, opt: 'Ghi chú: ít dầu giấm' }, { id: 'risotto-kem', qty: 1, unit: 89000, opt: 'Phần tiêu chuẩn' }] };
  const CODE = o.code || 'FB2611-0248';
  const first = (o.name || 'Minh Anh').trim().split(/\s+/).slice(-2).join(' ');
  const cash = o.pay === 'Tiền mặt';
  const hm = d => String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  const placed = o.placedAt ? new Date(o.placedAt) : new Date();
  const dmy = d => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  const table = rows => { $('#r-table').innerHTML = rows.map(([k, v, cls]) => `<div><dt>${k}</dt><dd class="${cls || ''}">${v}</dd></div>`).join(''); };
  const reorder = () => { const items = Cart.get(); (o.items || []).forEach(it => items.push({ ...it })); Cart.set(items); location.href = 'gio_hang.html'; };

  if (page === 'dat_hang_thanh_cong') {
    if (o.canceled) { location.replace('don_hang_da_huy.html'); return; }
    $('#r-title').textContent = `Cảm ơn bạn, ${first}!`;
    const eta = new Date(placed.getTime() + 28 * 60000), eta2 = new Date(eta.getTime() + 10 * 60000);
    table([['Mã đơn', '#' + CODE], ['Thời gian đặt', `${dmy(placed)} · ${hm(placed)}`], [o.pickup ? 'Tự đến lấy' : 'Dự kiến giao', o.pickup ? 'Sẵn sàng sau 20 phút' : `${hm(eta)} – ${hm(eta2)}`],
      ['Thanh toán', cash ? 'Tiền mặt · Thanh toán khi nhận' : `${o.pay} · Đã thanh toán`, cash ? '' : 'is-green'], ['Tổng tiền', money(o.total), 'is-money']]);
    // Chỉ hủy được trong 5 phút đầu (nhà hàng chưa chế biến)
    const btn = $('#cancel-order'); const lock = () => { if (Date.now() - placed.getTime() > 5 * 60000) { btn.disabled = true; btn.textContent = 'Nhà hàng đã bắt đầu chế biến – không thể hủy'; } };
    lock(); setInterval(lock, 15000);
    btn.addEventListener('click', () => FB.openCancelOrder({ code: CODE, pay: o.pay }));
  }

  if (page === 'don_hang_da_huy') {
    $('#r-desc').textContent = cash ? `Fiabesco đã hủy đơn #${CODE} theo yêu cầu của bạn. Đơn thanh toán khi nhận hàng nên bạn không bị trừ tiền.` : `Fiabesco đã hủy đơn #${CODE} theo yêu cầu của bạn. Tiền sẽ được hoàn về ${o.pay === 'ZaloPay' || o.pay === 'MoMo' ? 'ví ' : ''}${o.pay}.`;
    table([['Trạng thái đơn', 'Đã hủy', 'is-wine'], ['Số tiền hoàn', cash ? '0 VND' : money(o.total), 'is-money'], ['Hoàn về', cash ? 'Không phát sinh' : o.pay], ['Thời gian dự kiến', cash ? '—' : '1–3 ngày làm việc']]);
    $('#reorder').addEventListener('click', reorder);
  }

  if (page === 'danh_gia_don_hang') {
    const done = o.deliveredAt ? new Date(o.deliveredAt) : new Date();
    $('#done-at').textContent = hm(done); $('#t4').textContent = hm(done);
    $('#order-meta').textContent = `Mã đơn #${CODE} · Đã giao lúc ${hm(done)} · ${money(o.total)}`;
    $('#to').textContent = (o.addr || '68 Lê Lợi, Q.1') + (o.apt ? ' · ' + o.apt : '');
    $('#who').textContent = `${first} · ${o.phone}`;
    $('#lines').innerHTML = (o.items || []).map(it => { const d = FB_DATA.byId(it.id) || {}; return `<div class="line-item"><img src="${d.img}" alt=""><div class="stack"><strong style="font:600 15px/1.4 var(--f-sans)">${d.name}</strong><span class="t-caption c-gray">× ${it.qty}</span></div><span class="price">${vnd(it.qty * it.unit)}</span></div>`; }).join('');
    $('#sub').textContent = money(o.sub); $('#fee').textContent = money(o.fee); $('#disc').textContent = '−' + money(Math.max(0, o.disc)); $('#total').textContent = money(o.total);
    $('#reorder').addEventListener('click', reorder);
    const LABEL = ['Chạm để chọn số sao', 'Chưa hài lòng · 1/5', 'Tạm được · 2/5', 'Khá ngon · 3/5', 'Rất ngon · 4/5', 'Tuyệt vời · 5/5'];
    let stars = 0;
    const paint = n => $$('[data-star]').forEach(b => { const on = +b.dataset.star <= n; b.classList.toggle('is-on', on); b.setAttribute('aria-checked', +b.dataset.star === stars); });
    $$('[data-star]').forEach(b => {
      b.addEventListener('mouseenter', () => paint(+b.dataset.star)); b.addEventListener('mouseleave', () => paint(stars));
      b.addEventListener('click', () => { stars = +b.dataset.star; paint(stars); $('#star-text').textContent = LABEL[stars]; $('#review-err').hidden = true; });
    });
    $('#tags').addEventListener('click', e => { const c = e.target.closest('.chip'); if (c) c.setAttribute('aria-pressed', c.getAttribute('aria-pressed') !== 'true'); });
    $('[data-copy]').addEventListener('click', e => { const v = e.currentTarget.dataset.copy; (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject()).catch(() => {}).finally(() => FB.toast('Đã sao chép mã', v, '', '', 'navy')); });
    $('#review').addEventListener('submit', e => {
      e.preventDefault(); if (!stars) { $('#review-err').hidden = false; return; }
      try { localStorage.setItem('fb_review_' + CODE, JSON.stringify({ stars, tags: $$('#tags [aria-pressed="true"]').map(c => c.textContent), text: e.target.text.value.trim(), at: Date.now() })); } catch (er) {}
      FB.openThanks();
    });
  }
});
