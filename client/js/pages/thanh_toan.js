/* Thanh toán: kiểm tra form (E10), ngoài vùng giao (E08), thanh toán thất bại (E11) */
document.addEventListener('fb:ready', () => {
  const { $, $$, icon, money, Cart } = FB;
  let data; try { data = JSON.parse(sessionStorage.getItem('fb_checkout')); } catch (e) {}
  if (!data) { const items = Cart.get(); const sub = items.reduce((s, i) => s + i.qty * i.unit, 0); data = { items, sub, fee: 25000, disc: 25000, total: sub, mode: 'ship', coupon: 'FREESHIP' }; }
  let pickup = data.mode === 'pickup';

  $('#count').textContent = `Đơn hàng (${data.items.length} món)`;
  $('#lines').innerHTML = data.items.map(it => { const d = FB_DATA.byId(it.id) || {}; return `<div class="line-item"><img src="${d.img}" alt=""><div class="stack"><strong style="font:600 15px/1.4 var(--f-sans)">${d.name}</strong><span class="t-caption c-gray">× ${it.qty}</span></div><span class="price">${FB.vnd(it.qty * it.unit)}</span></div>`; }).join('');

  function totals() {
    const fee = pickup ? 0 : 25000;
    const c = data.coupon && FB_DATA.coupons[data.coupon];
    let disc = 0; if (c) { if (c.type === 'ship') disc = fee; else if (c.type === 'percent') disc = Math.round(data.sub * c.value / 100); else if (c.type === 'fixed') disc = c.value; }
    const bonusEl = $('.pay.is-active'); const bonus = bonusEl && bonusEl.dataset.bonus ? +bonusEl.dataset.bonus : 0;
    const total = Math.max(0, data.sub + fee - disc - bonus);
    $('#sub').textContent = money(data.sub); $('#fee').textContent = money(fee);
    $('#row-coupon').hidden = !c; if (c) { $('#coupon-name').textContent = 'Mã ' + data.coupon; $('#disc').textContent = '−' + money(disc); }
    $('#row-bonus').hidden = !bonus;
    $('#total').textContent = money(total);
    return total;
  }

  $$('#when .choice').forEach(c => c.addEventListener('click', () => { $$('#when .choice').forEach(x => x.classList.toggle('is-active', x === c)); $('#sched').classList.toggle('is-on', c.dataset.when === 'later'); }));
  $$('#sched .chip').forEach(c => c.addEventListener('click', () => $$('#sched .chip').forEach(x => x.classList.toggle('is-active', x === c))));
  $$('#pays .pay').forEach(p => p.addEventListener('click', () => { $$('#pays .pay').forEach(x => x.classList.toggle('is-active', x === p)); totals(); }));
  totals();

  const form = $('#co');
  const setErr = (key, msg) => { const f = $(`[data-f="${key}"]`, form); const l = $('.field__label', f); f.classList.toggle('is-error', !!msg); l.textContent = l.dataset.l + (msg ? ' — ' + msg : ''); };
  const OUT_ZONE = /(bình chánh|binh chanh|củ chi|cu chi|cần giờ|can gio|hóc môn|hoc mon|nhà bè|nha be|long an|bình dương|binh duong|đồng nai|dong nai)/i;

  // E08 – ngoài vùng giao
  function outOfZone(addr) {
    FB.modal({ id: 'm-zone', icon: 'location-pin', tone: 'wine', title: 'Địa chỉ nằm ngoài vùng giao hàng',
      desc: 'Rất tiếc, chúng tôi chưa giao tới khu vực này. Bạn có thể đổi địa chỉ khác hoặc tự đến lấy tại chi nhánh gần nhất.',
      extra: `<div class="alert alert--gold" style="width:100%;flex-direction:column;gap:6px"><span class="row t-body-s" style="gap:8px"><span class="c-wine">${icon('location-pin')}</span>${addr} · cách 14,2 km</span><span class="t-caption c-gray">Vùng giao hiện tại: bán kính 10 km quanh 3 chi nhánh.</span></div>`,
      actions: [{ label: 'Đổi địa chỉ', style: 'outline', attr: 'data-close data-act="addr"' }, { label: 'Tự đến lấy (Q.7)', style: 'navy', attr: 'data-close data-act="pickup"' }] });
    FB.openModal('m-zone');
  }
  // E11 – thanh toán thất bại
  function payFailed() {
    const m = $('.pay.is-active').dataset.pay; const t = totals();
    FB.modal({ id: 'm-fail', icon: 'home/icons/credit-card', tone: 'wine', title: 'Thanh toán không thành công',
      desc: `Giao dịch ${m} #ZP2611-8842 đã bị từ chối. Bạn có thể thử lại hoặc chọn phương thức khác.`,
      extra: `<div class="alert alert--gold" style="width:100%;flex-direction:column;gap:8px;text-align:left">${[`Số dư ví ${m} không đủ (cần ${FB.vnd(t)}đ)`, 'Giao dịch đã quá thời gian xác nhận 5 phút', 'Đơn hàng được giữ thêm 10 phút — không bị trừ tiền'].map(s => `<span class="row t-body-s" style="gap:8px"><span class="c-wine">${icon('dot')}</span>${s}</span>`).join('')}</div>`,
      actions: [{ label: 'Đổi phương thức', style: 'outline', attr: 'data-close data-act="method"' }, { label: 'Thử lại', style: 'wine', attr: 'data-close data-act="retry"' }] });
    FB.openModal('m-fail');
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-act]'); if (!a) return;
    if (a.dataset.act === 'addr') setTimeout(() => form.addr.focus(), 50);
    if (a.dataset.act === 'pickup') { pickup = true; form.addr.value = '102 Tôn Dật Tiên, Quận 7 (tự đến lấy)'; totals(); }
    if (a.dataset.act === 'method') $('#pay-card').scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (a.dataset.act === 'retry') finish();
  });

  function finish() {
    const order = { name: form.name.value.trim(), phone: form.phone.value.trim(), addr: form.addr.value.trim(), apt: form.apt.value.trim(), pay: $('.pay.is-active').dataset.pay, total: totals(), items: data.items, sub: data.sub, fee: pickup ? 0 : 25000, disc: data.sub + (pickup ? 0 : 25000) - totals() };
    try { sessionStorage.setItem('fb_order', JSON.stringify(order)); } catch (e) {}
    Cart.set([]); location.href = 'theo_doi_don_hang.html';
  }

  form.addEventListener('submit', e => {
    e.preventDefault(); let n = 0;
    const name = form.name.value.trim(), phone = form.phone.value.trim(), email = form.email.value.trim(), addr = form.addr.value.trim();
    if (!name) { setErr('name', 'Vui lòng nhập họ tên'); n++; } else setErr('name');
    if (!FB.isPhone(phone)) { setErr('phone', 'Số điện thoại không hợp lệ'); n++; } else setErr('phone');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr('email', 'Email chưa đúng định dạng'); n++; } else setErr('email');
    if (addr.length < 10) { setErr('addr', 'Vui lòng chọn địa chỉ cụ thể'); n++; } else setErr('addr');
    const termsOk = form.terms.checked; $('#terms').classList.toggle('is-error', !termsOk); if (!termsOk) n++;
    $('#err-sum').classList.toggle('is-on', n > 0); $('#err-text').textContent = `Có ${n} thông tin cần kiểm tra lại trước khi thanh toán.`;
    if (n) { $('#err-sum').scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    if (!pickup && (OUT_ZONE.test(addr) || FB.demo === 'out-of-zone')) { outOfZone(addr); return; }
    if (FB.demo === 'payment-failed') { payFailed(); return; }
    finish();
  });
  form.terms.addEventListener('change', () => { $('#terms').classList.toggle('is-error', !form.terms.checked); $('#pay-btn').style.opacity = form.terms.checked ? '' : .45; });
});
