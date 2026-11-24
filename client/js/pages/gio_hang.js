/* Giỏ hàng: chọn món, số lượng, mã ưu đãi (E09), đơn tối thiểu (E12), giỏ trống (E07) */
document.addEventListener('fb:ready', () => {
  const { $, $$, icon, money, vnd, Cart } = FB;
  const MIN_ORDER = 150000, SHIP_FEE = 25000;
  let off = new Set();               // món bỏ chọn (theo index)
  let mode = 'ship';
  let coupon = 'FREESHIP';           // thiết kế: mã FREESHIP đang được áp dụng

  if (FB.demo === 'empty') Cart.set([]);
  if (FB.demo === 'min-order') Cart.set([{ id: 'risotto-kem', qty: 1, opt: 'Phần tiêu chuẩn', unit: 89000 }]);

  $('#upsell').innerHTML = [['bruschetta', 'Bánh mì Bruschetta'], ['caprese', 'Salad Caprese'], ['minestrone', 'Súp Minestrone']].map(([id, n]) => {
    const d = FB_DATA.byId(id); return `<div class="up"><img src="${d.img}" alt=""><div class="stack"><strong style="font:600 15px/1.4 var(--f-sans)">${n}</strong><span style="font:400 16px/1.2 var(--f-price)" class="c-wine">${money(d.price)}</span></div><button data-up="${id}" aria-label="Thêm ${n}">${icon('plus')}</button></div>`;
  }).join('');
  $('#loved').innerHTML = ['burrata', 'lasagna', 'bolognese', 'risotto-kem'].map(id => FB.dishCard(FB_DATA.byId(id), { tag: '' })).join('');

  function calc() {
    const items = Cart.get(); const sel = items.filter((_, i) => !off.has(i));
    const sub = sel.reduce((s, i) => s + i.qty * i.unit, 0); const portions = sel.reduce((s, i) => s + i.qty, 0);
    const fee = mode === 'ship' ? SHIP_FEE : 0;
    const c = coupon && FB_DATA.coupons[coupon];
    let disc = 0;
    if (c && !c.expired) { if (c.type === 'ship') disc = fee; else if (c.type === 'percent') disc = Math.round(sub * c.value / 100); else if (c.type === 'fixed') disc = Math.min(c.value, sub); }
    return { items, sel, sub, portions, fee, disc, total: Math.max(0, sub + fee - disc) };
  }

  function render() {
    const r = calc(); const empty = r.items.length === 0;
    $('#cart-full').hidden = empty; $('#cart-head').hidden = empty; $('#cart-empty').hidden = !empty;
    if (empty) { FB.initReveal(); return; }
    $('#items').innerHTML = r.items.map((it, i) => {
      const d = FB_DATA.byId(it.id) || {};
      return `<div class="cart-item${off.has(i) ? ' is-off' : ''}" data-i="${i}">
        <label class="checkbox"><input type="checkbox" ${off.has(i) ? '' : 'checked'} data-sel="${i}"><span class="checkbox__box">${icon('check')}</span></label>
        <img class="cart-item__img" src="${d.img}" alt="">
        <div class="cart-item__info"><strong class="t-title">${d.name}</strong><span class="t-body-s c-gray">${it.opt}</span>
          ${it.combo ? '' : `<a class="cart-item__edit" href="chi_tiet_mon.html?id=${it.id}">${icon('edit')}Sửa lựa chọn</a>`}</div>
        <div class="stepper stepper--sm"><button data-dec="${i}" aria-label="Giảm">${icon('minus')}</button><output>${it.qty}</output><button data-inc="${i}" aria-label="Tăng">${icon('plus')}</button></div>
        <div class="cart-item__price"><span class="t-price c-wine">${money(it.qty * it.unit)}</span>${it.qty > 1 ? `<span class="t-caption c-gray">${vnd(it.unit)} / phần</span>` : ''}</div>
        <button class="cart-item__del" data-del="${i}" aria-label="Xóa món">${icon('trash')}</button></div>`;
    }).join('');
    $('#all').checked = off.size === 0;
    $('#all-label').textContent = `Chọn tất cả (${r.items.length} món)`;
    $('#sub-label').textContent = `Tạm tính (${r.portions} phần)`;
    $('#sub').textContent = money(r.sub);
    $('#fee').textContent = money(r.fee);
    $('#disc').textContent = (r.disc ? '−' : '') + money(r.disc);
    $('#total').textContent = money(r.total);
    $('#points').textContent = `Bạn sẽ nhận +${Math.round(r.total / 10000)} điểm thành viên`;
    // E12 – chưa đạt giá trị đơn tối thiểu (chỉ áp dụng giao hàng)
    const lack = mode === 'ship' && r.sub < MIN_ORDER && r.sel.length > 0;
    $('#min-alert').hidden = !lack;
    if (lack) { $('#min-text').textContent = `Thêm ${vnd(MIN_ORDER - r.sub)}đ để đạt đơn giao hàng tối thiểu ${vnd(MIN_ORDER)}đ`; $('#min-bar').style.width = (r.sub / MIN_ORDER * 100) + '%'; }
    $('#go').classList.toggle('is-disabled', lack || r.sel.length === 0);
    try { sessionStorage.setItem('fb_checkout', JSON.stringify({ items: r.sel, sub: r.sub, fee: r.fee, disc: r.disc, total: r.total, mode, coupon, note: $('#note').value })); } catch (e) {}
  }
  window.FB_CART_RENDER = render;
  document.addEventListener('cart:change', () => render());

  $('#items').addEventListener('click', e => {
    const items = Cart.get(); const t = e.target.closest('[data-inc],[data-dec],[data-del]'); if (!t) return;
    if (t.dataset.inc) items[+t.dataset.inc].qty++;
    if (t.dataset.dec) { const i = +t.dataset.dec; items[i].qty = Math.max(1, items[i].qty - 1); }
    if (t.dataset.del) { items.splice(+t.dataset.del, 1); off = new Set(); }
    Cart.set(items); render();
  });
  $('#items').addEventListener('change', e => { const i = e.target.dataset.sel; if (i === undefined) return; e.target.checked ? off.delete(+i) : off.add(+i); render(); });
  $('#all').addEventListener('change', e => { off = e.target.checked ? new Set() : new Set(Cart.get().map((_, i) => i)); render(); });
  $('#del-sel').addEventListener('click', () => { const keep = Cart.get().filter((_, i) => off.has(i)); off = new Set(); Cart.set(keep); render(); });
  $('#upsell').addEventListener('click', e => { const b = e.target.closest('[data-up]'); if (!b) return; Cart.add(b.dataset.up); render(); FB.toast('Đã thêm vào giỏ hàng', FB_DATA.byId(b.dataset.up).name, '', '', 'navy'); });
  $$('#mode button').forEach(b => b.addEventListener('click', () => { $$('#mode button').forEach(x => x.classList.toggle('is-active', x === b)); mode = b.dataset.mode; render(); }));
  $('#note').addEventListener('input', render);

  // Mã ưu đãi (E09)
  function showCoupon() {
    $('#coupon-ok').hidden = !coupon; $('#coupon-err').hidden = true; $('#coupon').classList.remove('is-error');
    if (coupon) $('#coupon-label').textContent = FB_DATA.coupons[coupon].label;
  }
  $('#coupon').addEventListener('submit', e => {
    e.preventDefault(); const code = e.target.code.value.trim().toUpperCase(); if (!code) return;
    const c = FB_DATA.coupons[code];
    if (c && !c.expired) { coupon = code; e.target.code.value = ''; showCoupon(); render(); return; }
    coupon = null; $('#coupon-ok').hidden = true; $('#coupon').classList.add('is-error'); $('#coupon-err').hidden = false;
    $('#coupon-msg').innerHTML = c && c.expired ? `Mã ${code} đã hết hạn ngày ${c.expiredAt}. Xem mã còn hiệu lực trong mục <a href="khuyen_mai.html">Khuyến mãi</a>.` : `Mã ${code} không tồn tại hoặc không áp dụng cho đơn này. Xem mã còn hiệu lực trong mục <a href="khuyen_mai.html">Khuyến mãi</a>.`;
    render();
  });
  $('#coupon-rm').addEventListener('click', () => { coupon = null; showCoupon(); render(); });
  showCoupon(); render();
  // E09 theo thiết kế: mã FREESHIP đang áp dụng đã hết hạn
  if (FB.demo === 'coupon-expired') {
    FB_DATA.coupons.FREESHIP = { ...FB_DATA.coupons.FREESHIP, expired: true, expiredAt: '20/11/2026' };
    $('#coupon').code.value = 'FREESHIP'; $('#coupon').requestSubmit();
  }
});
