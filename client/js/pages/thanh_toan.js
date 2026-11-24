/* Thanh toán: kiểm tra form (E10), ngoài vùng giao (E08), thanh toán thất bại (E11)
   + Địa chỉ giao hàng tách trường: số nhà/đường, tỉnh/thành, khu vực cũ (gợi ý), phường/xã hiện hành.
   Dữ liệu phường/xã: js/data/dia_chi_tphcm.js (window.FB_DIA_CHI_TPHCM). */
document.addEventListener('fb:ready', () => {
  const { $, $$, icon, money, Cart } = FB;
  let data; try { data = JSON.parse(sessionStorage.getItem('fb_checkout')); } catch (e) {}
  if (!data) { const items = Cart.get(); const sub = items.reduce((s, i) => s + i.qty * i.unit, 0); data = { items, sub, fee: 25000, disc: 25000, total: sub, mode: 'ship', coupon: 'FREESHIP' }; }
  let pickup = data.mode === 'pickup';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

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

  /* ================= ĐỊA CHỈ GIAO HÀNG ================= */
  const DC = window.FB_DIA_CHI_TPHCM || null;
  if (!DC) console.error('Không tải được js/data/dia_chi_tphcm.js – danh sách phường/xã trống.');
  const PICKUP_ADDR = '102 Tôn Dật Tiên (khu vực Quận 7 cũ) – tự đến lấy';
  const SAVE_KEY = 'fb_dia_chi_gan_nhat';
  const el = { street: $('#co-street'), province: $('#co-province'), area: $('#co-area'), ward: $('#co-ward') };
  const wardHint = $('#hint-ward'); const WARD_HINT = wardHint.textContent;
  wardHint.setAttribute('aria-live', 'polite');

  // Hiện chỉ có dữ liệu TP. Hồ Chí Minh; cấu trúc cho phép thêm tỉnh khác sau này.
  const PROVINCES = DC ? [{ id: DC.thongTin.maTinhNoiBo, ten: DC.thongTin.tinh, areas: DC.khuVucCu, wards: DC.layDanhSachPhuongXa }] : [];
  const prov = () => PROVINCES.find(p => p.id === el.province.value) || null;

  // Đổ option; giữ lựa chọn cũ nếu vẫn còn hợp lệ. Trả về false khi lựa chọn cũ bị bỏ.
  function fill(select, placeholder, items) {
    const keep = select.value;
    select.replaceChildren(new Option(placeholder, ''), ...items.map(x => new Option(x.ten, x.id)));
    const ok = !keep || items.some(x => x.id === keep);
    select.value = ok ? keep : '';
    select.classList.toggle('is-placeholder', !select.value);
    return ok;
  }
  function fillProvince() {
    const keep = el.province.value || 'HCM';
    el.province.replaceChildren(...PROVINCES.map(p => new Option(p.ten, p.id)));
    if (!PROVINCES.length) el.province.replaceChildren(new Option('Chọn tỉnh/thành phố', ''));
    el.province.value = PROVINCES.some(p => p.id === keep) ? keep : (PROVINCES[0] ? PROVINCES[0].id : '');
  }
  const fillArea = () => { const p = prov(); fill(el.area, 'Tất cả khu vực', p ? p.areas : []); };
  function fillWard() {
    const p = prov();
    const kept = fill(el.ward, 'Chọn phường/xã', p ? p.wards(el.area.value) : []);
    wardHint.textContent = kept ? WARD_HINT : 'Phường/xã đã chọn không nằm trong khu vực này nên đã được bỏ chọn. Vui lòng chọn lại hoặc chọn “Tất cả khu vực”.';
  }

  function fieldErr(key, msg) {
    const f = $(`[data-f="${key}"]`, form); if (!f) return;
    const ctl = $('input,select', f); const e = $('.field__error', f);
    f.classList.toggle('is-error', !!msg);
    if (e) e.textContent = msg || '';
    if (ctl) ctl.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }
  const clearAddrErrors = () => ['street', 'province', 'ward'].forEach(k => fieldErr(k));

  function readAddress() {
    const p = prov(); const w = DC && DC.layPhuongXaTheoId(el.ward.value);
    const street = el.street.value.trim().replace(/\s+/g, ' ');
    if (!p || !w || !street) return null;
    const a = p.areas.find(x => x.id === el.area.value) || null;
    return {
      street, wardId: w.id, ward: w.ten, wardType: w.loai,
      provinceId: p.id, province: p.ten,
      // Khu vực cũ: chỉ thông tin hỗ trợ giao hàng, KHÔNG nằm trong địa chỉ hành chính.
      deliveryArea: a ? { id: a.id, name: a.ten } : null,
      full: DC.taoDiaChi(street, w.id) // "Số nhà và tên đường, Phường/Xã, Tỉnh/Thành phố"
    };
  }

  function validateAddress() {
    if (pickup) { clearAddrErrors(); return { n: 0, first: null }; }
    let n = 0, first = null; const bad = (k, msg, ctl) => { fieldErr(k, msg); n++; first = first || ctl; };
    const street = el.street.value.trim();
    if (!street) bad('street', 'Vui lòng nhập số nhà, tên đường.', el.street);
    else if (street.length < 5) bad('street', 'Số nhà, tên đường chưa đầy đủ — ví dụ: 123 Nguyễn Huệ.', el.street);
    else fieldErr('street');
    if (!prov()) bad('province', 'Vui lòng chọn tỉnh/thành phố.', el.province); else fieldErr('province');
    if (!el.ward.value) bad('ward', DC ? 'Vui lòng chọn phường/xã.' : 'Chưa tải được danh sách phường/xã, vui lòng tải lại trang.', el.ward); else fieldErr('ward');
    return { n, first };
  }

  // Hiển thị lại địa chỉ đã ghép trong phần tóm tắt đơn hàng.
  function renderShipTo() {
    const box = $('#ship-to'), areaEl = $('#ship-to-area');
    if (pickup) { box.hidden = false; $('#ship-to-text').textContent = PICKUP_ADDR; areaEl.hidden = true; return; }
    const a = readAddress();
    box.hidden = !a; if (!a) return;
    const apt = form.apt.value.trim();
    $('#ship-to-text').textContent = a.full + (apt ? ' · ' + apt : '');
    areaEl.hidden = !a.deliveryArea; areaEl.textContent = a.deliveryArea ? 'Khu vực giao hàng: ' + a.deliveryArea.name : '';
  }

  function setPickup(on) {
    pickup = on;
    $('#addr-block').hidden = on; $('#pickup-note').hidden = !on;
    if (on) clearAddrErrors();
    totals(); renderShipTo();
  }

  // Khởi tạo dropdown + điền lại địa chỉ lần trước (nếu có), không ghi đè giá trị đang nhập.
  fillProvince(); fillArea(); fillWard();
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (s && DC) {
      if (!el.street.value && s.street) el.street.value = s.street;
      if (!form.apt.value && s.apt) form.apt.value = s.apt;
      if (s.provinceId && PROVINCES.some(p => p.id === s.provinceId)) { el.province.value = s.provinceId; fillArea(); }
      if (s.areaId) { el.area.value = s.areaId; if (el.area.value !== s.areaId) el.area.value = ''; el.area.classList.toggle('is-placeholder', !el.area.value); }
      fillWard();
      if (s.wardId) { el.ward.value = s.wardId; if (el.ward.value !== s.wardId) el.ward.value = ''; el.ward.classList.toggle('is-placeholder', !el.ward.value); }
    }
  } catch (e) {}

  el.province.addEventListener('change', () => { fillArea(); fillWard(); if (prov()) fieldErr('province'); renderShipTo(); });
  el.area.addEventListener('change', () => { el.area.classList.toggle('is-placeholder', !el.area.value); fillWard(); renderShipTo(); });
  el.ward.addEventListener('change', () => { el.ward.classList.toggle('is-placeholder', !el.ward.value); wardHint.textContent = WARD_HINT; if (el.ward.value) fieldErr('ward'); renderShipTo(); });
  el.street.addEventListener('input', () => { if (el.street.value.trim().length >= 5) fieldErr('street'); renderShipTo(); });
  form.apt.addEventListener('input', renderShipTo);
  $('#pickup-undo').addEventListener('click', () => { setPickup(false); el.street.focus(); });
  setPickup(pickup);

  /* ================= VÙNG GIAO (demo) ================= */
  // Khu vực ngoài bán kính giao (demo). Ưu tiên khu vực người dùng chọn; nếu trống dùng khu vực gợi ý của phường/xã.
  const OUT_AREAS = new Set(['binh_chanh', 'cu_chi', 'can_gio', 'hoc_mon', 'nha_be', 'binh_duong_cu', 'brvt_cu']);
  const OUT_ZONE = /(bình chánh|binh chanh|củ chi|cu chi|cần giờ|can gio|hóc môn|hoc mon|nhà bè|nha be|long an|bình dương|binh duong|đồng nai|dong nai)/i;
  function isOutOfZone(a) {
    const w = DC && DC.layPhuongXaTheoId(a.wardId);
    const key = a.deliveryArea ? a.deliveryArea.id : (w && w.khuVucCu);
    return OUT_AREAS.has(key) || OUT_ZONE.test(a.street);
  }

  // E08 – ngoài vùng giao
  function outOfZone(addr) {
    FB.modal({ id: 'm-zone', icon: 'location-pin', tone: 'wine', title: 'Địa chỉ nằm ngoài vùng giao hàng',
      desc: 'Rất tiếc, chúng tôi chưa giao tới khu vực này. Bạn có thể đổi địa chỉ khác hoặc tự đến lấy tại chi nhánh gần nhất.',
      extra: `<div class="alert alert--gold" style="width:100%;flex-direction:column;gap:6px"><span class="row t-body-s" style="gap:8px"><span class="c-wine">${icon('location-pin')}</span>${esc(addr)} · cách 14,2 km</span><span class="t-caption c-gray">Vùng giao hiện tại: bán kính 10 km quanh 3 chi nhánh.</span></div>`,
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
    if (a.dataset.act === 'addr') setTimeout(() => el.street.focus(), 50);
    if (a.dataset.act === 'pickup') setPickup(true);
    if (a.dataset.act === 'method') $('#pay-card').scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (a.dataset.act === 'retry') finish();
  });

  function finish() {
    const address = pickup ? null : readAddress();
    const total = totals(), fee = pickup ? 0 : 25000;
    const order = {
      name: form.name.value.trim(), phone: form.phone.value.trim(), email: form.email.value.trim(),
      addr: pickup ? PICKUP_ADDR : address.full, // chuỗi hiển thị (tương thích trang theo dõi đơn)
      address,                                   // các thành phần địa chỉ, để sửa/dùng lại
      deliveryArea: address ? address.deliveryArea : null,
      pickup, apt: form.apt.value.trim(), pay: $('.pay.is-active').dataset.pay,
      total, items: data.items, sub: data.sub, fee, disc: data.sub + fee - total
    };
    order.code = 'FB2611-0248'; order.placedAt = Date.now();
    try { sessionStorage.setItem('fb_order', JSON.stringify(order)); } catch (e) {}
    if (address) {
      try { localStorage.setItem(SAVE_KEY, JSON.stringify({ street: address.street, provinceId: address.provinceId, areaId: address.deliveryArea ? address.deliveryArea.id : '', wardId: address.wardId, apt: order.apt })); } catch (e) {}
    }
    Cart.set([]);
    FB.payProcessing(order.pay, order.total, () => { location.href = 'dat_hang_thanh_cong.html'; });
  }

  form.addEventListener('submit', e => {
    e.preventDefault(); let n = 0;
    const name = form.name.value.trim(), phone = form.phone.value.trim(), email = form.email.value.trim();
    if (!name) { setErr('name', 'Vui lòng nhập họ tên'); n++; } else setErr('name');
    if (!FB.isPhone(phone)) { setErr('phone', 'Số điện thoại không hợp lệ'); n++; } else setErr('phone');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr('email', 'Email chưa đúng định dạng'); n++; } else setErr('email');
    const av = validateAddress(); n += av.n;
    const termsOk = form.terms.checked; $('#terms').classList.toggle('is-error', !termsOk); if (!termsOk) n++;
    $('#err-sum').classList.toggle('is-on', n > 0); $('#err-text').textContent = `Có ${n} thông tin cần kiểm tra lại trước khi thanh toán.`;
    if (n) { $('#err-sum').scrollIntoView({ behavior: 'smooth', block: 'center' }); if (av.first) av.first.focus({ preventScroll: true }); return; }
    renderShipTo();
    if (!pickup) { const a = readAddress(); if (isOutOfZone(a) || FB.demo === 'out-of-zone') { outOfZone(a.full); return; } }
    if (FB.demo === 'payment-failed') { payFailed(); return; }
    finish();
  });
  form.terms.addEventListener('change', () => { $('#terms').classList.toggle('is-error', !form.terms.checked); $('#pay-btn').style.opacity = form.terms.checked ? '' : .45; });
});
