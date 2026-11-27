/* Thanh toán: kiểm tra form (E10), ngoài vùng giao (E08), thanh toán thất bại (E11)
   + Địa chỉ giao hàng tách trường: số nhà/đường, tỉnh/thành, khu vực cũ (gợi ý), phường/xã hiện hành.
   Dữ liệu phường/xã: js/data/dia_chi_tphcm.js (window.FB_DIA_CHI_TPHCM). */
document.addEventListener('fb:ready', () => {
  const { $, $$, icon, money, Cart } = FB;
  let data; try { data = JSON.parse(sessionStorage.getItem('fb_checkout')); } catch (e) {}
  if (!data) { const items = Cart.get(); const sub = items.reduce((s, i) => s + i.qty * i.unit, 0); data = { items, sub, fee: 25000, disc: 25000, total: sub, mode: 'ship', coupon: 'FREESHIP' }; }
  let pickup = data.mode === 'pickup';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const keyOf = it => it.id + '|' + it.opt;
  if (!Array.isArray(data.keys)) data.keys = data.items.map(keyOf);
  function renderLines() {
    $('#count').textContent = `Đơn hàng (${data.items.length} món)`;
    $('#lines').innerHTML = data.items.map((it, k) => { const d = FB_DATA.byId(it.id) || {}; return `<div class="line-item"><img src="${d.img}" alt=""><div class="stack"><strong style="font:600 15px/1.4 var(--f-sans)">${esc(d.name)}</strong><span class="t-caption c-gray">× ${it.qty}${it.opt ? ' · ' + esc(it.opt) : ''}</span>
      <button type="button" class="line-item__edit" data-line="${k}" aria-label="Chỉnh sửa lựa chọn ${esc(d.name)}">${icon('edit')}Chỉnh sửa</button></div><span class="price money">${FB.vnd(it.qty * it.unit)}</span></div>`; }).join('');
  }
  renderLines();
  /* C3 · Chỉnh sửa lựa chọn ngay tại Thanh toán: dùng popup chung, lưu vào giỏ rồi cập nhật tổng.
     Hủy/đóng popup → không thay đổi gì. */
  $('#lines').addEventListener('click', e => {
    const b = e.target.closest('[data-line]'); if (!b || !FB.editCartLine) return;
    const it = data.items[+b.dataset.line]; const idx = Cart.get().findIndex(x => keyOf(x) === keyOf(it));
    if (idx < 0) { FB.toast('Không tìm thấy món trong giỏ', 'Vui lòng quay lại giỏ hàng để chỉnh sửa.', 'Về giỏ hàng', 'gio_hang.html', 'navy'); return; }
    FB.editCartLine(idx, (newKey, oldKey) => {
      data.keys = [...new Set(data.keys.map(k => (k === oldKey ? newKey : k)))];
      const cart = Cart.get(); data.items = cart.filter(x => data.keys.includes(keyOf(x)));
      data.sub = data.items.reduce((s, x) => s + x.qty * x.unit, 0);
      renderLines(); totals();
      try { sessionStorage.setItem('fb_checkout', JSON.stringify(data)); } catch (er) {}
    });
  });

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
    const pts = FB.pointsFor ? FB.pointsFor(total) : Math.round(total / 10000);
    $('#co-points-text').textContent = `Bạn sẽ nhận +${pts} điểm thành viên`;
    return total;
  }

  $$('#when .choice').forEach(c => c.addEventListener('click', () => { $$('#when .choice').forEach(x => x.classList.toggle('is-active', x === c)); $('#sched').classList.toggle('is-on', c.dataset.when === 'later'); }));
  $$('#sched .chip').forEach(c => c.addEventListener('click', () => $$('#sched .chip').forEach(x => x.classList.toggle('is-active', x === c))));
  const syncCard = () => { const on = $('.pay.is-active').dataset.pay === 'Thẻ quốc tế'; $('#card-fields').hidden = !on; if (!on) $('#cc-err').hidden = true; };
  $$('#pays .pay').forEach(p => p.addEventListener('click', () => { $$('#pays .pay').forEach(x => x.classList.toggle('is-active', x === p)); totals(); syncCard(); }));
  totals(); syncCard();
  if (FB.bindPoints) FB.bindPoints($('#co-points'), () => totals());
  // Ô thẻ: chỉ định dạng hiển thị, không lưu ở đâu cả
  $('#cc-num').addEventListener('input', e => { const v = e.target.value.replace(/\D/g, '').slice(0, 19); e.target.value = v.replace(/(\d{4})(?=\d)/g, '$1 '); });
  $('#cc-exp').addEventListener('input', e => { const v = e.target.value.replace(/\D/g, '').slice(0, 4); e.target.value = v.length > 2 ? v.slice(0, 2) + '/' + v.slice(2) : v; });
  $('#cc-cvv').addEventListener('input', e => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4); });
  function cardCheck() {
    const n = $('#cc-num').value.replace(/\s/g, ''), ex = $('#cc-exp').value, cv = $('#cc-cvv').value;
    if (!n && !ex && !cv) return ''; // demo: các ô không bắt buộc
    if (n && (n.length < 13 || !luhn(n))) return 'Số thẻ chưa hợp lệ, vui lòng kiểm tra lại.';
    if (ex && !/^(0[1-9]|1[0-2])\/\d{2}$/.test(ex)) return 'Ngày hết hạn theo dạng MM/YY.';
    if (cv && !/^\d{3,4}$/.test(cv)) return 'Mã bảo mật gồm 3–4 chữ số.';
    return '';
  }
  const luhn = n => { let s = 0; for (let i = 0; i < n.length; i++) { let d = +n[n.length - 1 - i]; if (i % 2) { d *= 2; if (d > 9) d -= 9; } s += d; } return s % 10 === 0; };
  const clearCard = () => { ['#cc-num', '#cc-exp', '#cc-cvv'].forEach(s => { $(s).value = ''; }); };

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

  /* ================= TỰ ĐỘNG ĐIỀN THÔNG TIN NHẬN HÀNG =================
     Ưu tiên: (1) bản nháp đã nhập cho lượt thanh toán này (sessionStorage, đúng tài khoản)
              (2) hồ sơ tài khoản đang đăng nhập (fb_user_v1 — dùng chung với popups.js / thanh_vien.js)
              (3) địa chỉ người dùng đã đồng ý ghi nhớ (gắn với tài khoản / khách)
     Chỉ điền ô đang trống, không khóa ô, không ghi ngược vào hồ sơ tài khoản. */
  const DRAFT_KEY = 'fb_checkout_draft';
  const readJSON = (st, k) => { try { return JSON.parse(st.getItem(k) || 'null'); } catch (e) { return null; } };
  const curUser = () => (FB.getUser ? FB.getUser() : readJSON(localStorage, 'fb_user_v1'));
  const ownerOf = u => (u ? String(u.id || u.email || u.phone || u.name) : 'guest');
  let owner = ownerOf(curUser());
  const fmtTel = p => String(p || '').replace(/\D/g, '').replace(/^(\d{4})(\d{3})(\d+)$/, '$1 $2 $3');
  function profileOf(u) {
    if (!u) return null;
    const id = String(u.id || '');
    return { name: u.name || '', phone: u.phone || (FB.isPhone(id) ? FB.normPhone(id) : ''), email: u.email || (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(id) ? id : ''), address: u.address || null };
  }
  const filledFrom = {}; // tên ô → 'draft' | 'profile' | 'saved' (để biết ô nào là dữ liệu tự điền)
  const setIfEmpty = (input, v, from) => { if (!input || input.value.trim() || !v) return false; input.value = v; filledFrom[input.name] = from; return true; };
  function applyAddress(a, from) {
    if (!a || !DC || el.street.value.trim() || el.ward.value) return false;
    if (a.street) { el.street.value = a.street; filledFrom.street = from; }
    if (a.apt && !form.apt.value) form.apt.value = a.apt;
    if (a.provinceId && PROVINCES.some(p => p.id === a.provinceId)) { el.province.value = a.provinceId; fillArea(); }
    // Khu vực cũ: chỉ chọn khi giá trị đã lưu có trong danh sách
    if (a.areaId) { el.area.value = a.areaId; if (el.area.value !== a.areaId) el.area.value = ''; el.area.classList.toggle('is-placeholder', !el.area.value); }
    fillWard();
    if (a.wardId) {
      el.ward.value = a.wardId;
      if (el.ward.value !== a.wardId) { // phường/xã không còn trong danh mục hiện hành → không chọn bừa
        el.ward.value = ''; wardHint.textContent = 'Phường/xã trong địa chỉ đã lưu không còn trong danh mục hành chính hiện tại. Vui lòng kiểm tra và chọn lại.';
      }
      el.ward.classList.toggle('is-placeholder', !el.ward.value);
    }
    return true;
  }
  /* Bản nháp thông tin nhận hàng (gồm số điện thoại người nhận):
     - Đã đăng nhập: lưu theo tài khoản (localStorage, khóa băm theo tài khoản) → còn khi quay lại sau.
     - Khách: chỉ trong phiên (sessionStorage) → không lưu thông tin cá nhân vô thời hạn.
     - Chỉ đọc bản nháp đúng tài khoản đang đăng nhập; đăng xuất / đổi tài khoản không lộ dữ liệu tài khoản trước. */
  const hashOf = v => { let h = 5381; for (const c of String(v)) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0; return h.toString(36); };
  const draftStore = () => (owner === 'guest' ? sessionStorage : localStorage);
  const draftKey = () => DRAFT_KEY + ':' + hashOf(owner);
  const readDraft = () => { const d = readJSON(draftStore(), draftKey()); return d && d.owner === owner ? d : null; };
  const clearDraft = () => { try { draftStore().removeItem(draftKey()); sessionStorage.removeItem(DRAFT_KEY); } catch (e) {} };
  function prefill() {
    const draft = readDraft();
    const saved = (() => { const s = readJSON(localStorage, SAVE_KEY); return s && (s.owner || 'guest') === owner ? s : null; })();
    const prof = profileOf(curUser());
    let fromProfile = false;
    if (draft) { setIfEmpty(form.name, draft.name, 'draft'); setIfEmpty(form.phone, draft.phone, 'draft'); setIfEmpty(form.email, draft.email, 'draft'); }
    if (prof) {
      fromProfile = setIfEmpty(form.name, prof.name, 'profile') | setIfEmpty(form.phone, fmtTel(prof.phone), 'profile') | setIfEmpty(form.email, prof.email, 'profile');
    }
    const usedSaved = !(draft && draft.street) && !(prof && prof.address) && !!saved;
    applyAddress(draft && (draft.street || draft.wardId) ? draft : null, 'draft') || (prof && applyAddress(prof.address, 'profile')) || applyAddress(saved, 'saved');
    $('#save-addr').checked = usedSaved; // người dùng đã đồng ý ghi nhớ trước đó
    $('#save-addr-label').textContent = prof ? 'Ghi nhớ địa chỉ này cho lần đặt sau (chỉ với tài khoản của bạn, không thay đổi hồ sơ)' : 'Ghi nhớ địa chỉ này cho lần đặt sau trên thiết bị này';
    const note = $('#prefill-note');
    note.hidden = !(fromProfile || usedSaved);
    if (!note.hidden) note.innerHTML = `${icon('user')}<span>Đã điền sẵn từ ${fromProfile ? 'hồ sơ tài khoản' : 'địa chỉ bạn đã lưu'} — bạn có thể sửa bất kỳ thông tin nào cho đơn này.</span>`;
  }
  // Lưu bản nháp của lượt thanh toán hiện tại (không lưu thông tin thẻ)
  function saveDraft() {
    const prev = readDraft() || {};
    const raw = form.phone.value.trim();
    // Số điện thoại: chỉ ghi khi hợp lệ (định dạng Việt Nam); đang gõ dở thì giữ số hợp lệ gần nhất; xóa trống thì xóa
    const phone = !raw ? '' : (FB.isPhone(raw) ? fmtTel(FB.normPhone(raw)) : (prev.phone || ''));
    try { draftStore().setItem(draftKey(), JSON.stringify({ owner, name: form.name.value, phone, email: form.email.value, apt: form.apt.value,
      street: el.street.value, provinceId: el.province.value, areaId: el.area.value, wardId: el.ward.value, at: Date.now() })); } catch (e) {}
  }
  /* Số điện thoại: kiểm tra khi rời ô; tuỳ chọn lưu làm số mặc định của tài khoản (chỉ khi người dùng tick) */
  function syncSavePhone() {
    const prof = profileOf(curUser()); const v = form.phone.value.trim();
    const show = !!prof && FB.isPhone(v) && FB.normPhone(v) !== FB.normPhone(prof.phone || '');
    $('#save-phone-wrap').hidden = !show; if (!show) $('#save-phone').checked = false;
  }
  form.phone.addEventListener('blur', () => { const v = form.phone.value.trim(); setErr('phone', v && !FB.isPhone(v) ? 'Số điện thoại gồm 10 số, bắt đầu bằng 0' : ''); });
  form.phone.addEventListener('input', () => { if (FB.isPhone(form.phone.value)) setErr('phone'); syncSavePhone(); });
  // Đăng xuất / đổi tài khoản: xóa thông tin riêng tư của tài khoản trước khỏi biểu mẫu
  function onAccountChange() {
    const next = ownerOf(curUser()); if (next === owner) return;
    const wasMember = owner !== 'guest'; owner = next;
    if (wasMember) {
      ['name', 'phone', 'email', 'apt'].forEach(k => { form[k].value = ''; });
      el.street.value = ''; el.area.value = ''; fillWard(); el.ward.value = ''; el.ward.classList.add('is-placeholder');
      Object.keys(filledFrom).forEach(k => delete filledFrom[k]);
    }
    prefill(); renderShipTo(); syncSavePhone();
  }
  fillProvince(); fillArea(); fillWard();
  prefill(); syncSavePhone();
  ['input', 'change'].forEach(ev => form.addEventListener(ev, e => { if (e.target.closest('#addr-block, .co-grid') && !e.target.closest('#card-fields')) { delete filledFrom[e.target.name]; saveDraft(); } }));
  window.addEventListener('storage', e => { if (e.key === 'fb_user_v1') onAccountChange(); });
  setInterval(onAccountChange, 1500); // đăng nhập/đăng xuất ngay trên trang (popup header)

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

  /* =================================================================
     ĐẶT ĐƠN + THANH TOÁN (D1–D5)
     - Mỗi lần thanh toán chỉ có MỘT đơn (sessionStorage 'fb_pending_order'); đổi phương thức
       dùng lại đơn đó, không tạo đơn trùng; nút bị khóa trong lúc xử lý.
     - Đơn chỉ sang "Đặt hàng thành công" khi: tiền mặt, hoặc PaymentAPI trả về PAID.
     - Chưa có cổng thật → luồng "Mô phỏng thanh toán" (js/don_hang_store.js), ghi rõ trên giao diện.
     ================================================================= */
  const O = window.FB_ORDERS, PAYAPI = O && O.PaymentAPI;
  const PENDING = 'fb_pending_order';
  const IMG = '../assets/template-20261120T115451Z-1-001 - Copy/template/';
  const LOGO = { 'ZaloPay': 'payment-zalopay.png', 'Apple Pay': 'payment-apple-pay.png', 'VietQR': 'payment-vietqr.png', 'Thẻ quốc tế': 'payment-visa-mastercard.png' };
  let submitting = false, current = null;
  const payBtn = $('#pay-btn');
  const lock = on => { submitting = on; payBtn.disabled = on; payBtn.setAttribute('aria-busy', on); payBtn.textContent = on ? 'Đang xử lý…' : 'Xác nhận & thanh toán'; };
  const getPending = () => { try { const id = sessionStorage.getItem(PENDING); const o = id && O.get(id); return o && o.status === 'PENDING_PAYMENT' && o.pay.status !== 'PAID' ? o : null; } catch (e) { return null; } };

  function orderPayload(method) {
    const address = pickup ? null : readAddress();
    const total = totals(), fee = pickup ? 0 : 25000;
    const bonusEl = $('.pay.is-active'); const bonus = bonusEl && bonusEl.dataset.bonus ? +bonusEl.dataset.bonus : 0;
    const later = $('#when .choice.is-active').dataset.when === 'later';
    return {
      method, customer: { name: form.name.value.trim(), phone: form.phone.value.trim(), email: form.email.value.trim() },
      addr: pickup ? PICKUP_ADDR : address.full, address, deliveryArea: address ? address.deliveryArea : null,
      pickup, apt: form.apt.value.trim(), note: data.note || '', when: later ? 'later' : 'now', slot: later ? ($('#sched .chip.is-active') || {}).textContent || '' : '',
      items: data.items, keys: data.keys, sub: data.sub, fee, bonus, disc: data.sub + fee - total, total, coupon: data.coupon || null
    };
  }
  /* Lưu số nhận hàng làm số mặc định của tài khoản — chỉ khi người dùng chọn */
  function savePhone(p) {
    if ($('#save-phone-wrap').hidden || !$('#save-phone').checked) return;
    try {
      const u = curUser(); if (!u || ownerOf(u) !== owner) return;
      const phone = FB.normPhone(p.customer.phone); const old = u.email || u.id;
      u.phone = phone; localStorage.setItem('fb_user_v1', JSON.stringify(u));
      const acc = readJSON(localStorage, 'fb_members_v1'); // danh sách tài khoản của trang Thành viên
      if (Array.isArray(acc)) { const a = acc.find(x => x.email && x.email === old); if (a) { a.phone = phone; localStorage.setItem('fb_members_v1', JSON.stringify(acc)); } }
    } catch (e) {}
  }
  function saveAddr(p) {
    savePhone(p);
    // Chỉ ghi nhớ khi người dùng đồng ý; gắn với tài khoản đang đăng nhập (hoặc khách) — không sửa hồ sơ tài khoản
    if (!$('#save-addr').checked) { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (s && (s.owner || 'guest') === owner) localStorage.removeItem(SAVE_KEY); } catch (e) {} return; }
    if (p.address) { try { localStorage.setItem(SAVE_KEY, JSON.stringify({ owner, street: p.address.street, provinceId: p.address.provinceId, areaId: p.address.deliveryArea ? p.address.deliveryArea.id : '', wardId: p.address.wardId, apt: p.apt })); } catch (e) {} }
  }
  /** Đơn đã được xác nhận (tiền mặt / đã thanh toán) → bỏ các món đã đặt khỏi giỏ, sang trang cảm ơn */
  function done(o) {
    const keys = data.keys || [];
    try { Cart.set(keys.length ? Cart.get().filter(x => !keys.includes(keyOf(x))) : []); sessionStorage.removeItem(PENDING); sessionStorage.removeItem('fb_checkout'); clearDraft(); } catch (e) {}
    location.href = 'dat_hang_thanh_cong.html?ma=' + encodeURIComponent(o.id);
  }

  async function finish() {
    if (submitting) return; // chặn bấm nhiều lần
    if (!O) { FB.toast('Không tải được mô-đun đơn hàng', 'Vui lòng tải lại trang.', '', '', 'navy'); return; }
    lock(true);
    const method = $('.pay.is-active').dataset.pay;
    const p = orderPayload(method); saveAddr(p);
    let o = getPending();
    if (o) { // cập nhật đơn đang chờ bằng dữ liệu mới nhất, giữ nguyên mã đơn
      Object.assign(o, { customer: p.customer, addr: p.addr, address: p.address, deliveryArea: p.deliveryArea, pickup: p.pickup, apt: p.apt, note: p.note, when: p.when, slot: p.slot, items: p.items, sub: p.sub, fee: p.fee, coupon: p.coupon });
      O.put(o);
      o = method === 'Tiền mặt' ? O.toCash(o.id, p.total) : O.setMethod(o.id, method, p.total, p.bonus);
    } else o = O.create(p);
    if (!o) { lock(false); return; }
    if (o.status !== 'PENDING_PAYMENT') { // D5 · Tiền mặt: giữ quy trình cũ
      FB.payProcessing ? FB.payProcessing('Fiabesco Palace', o.total, () => done(o)) : done(o); return;
    }
    try { sessionStorage.setItem(PENDING, o.id); } catch (e) {}
    current = o;
    if (method === 'VietQR') await openQR(o); else await openGateway(o);
    lock(false);
  }

  /* ---------- Popup kiểm tra trạng thái ---------- */
  function statusPopup(html, cls) {
    const id = 'co-pay-status'; let el = document.getElementById(id); if (el) el.remove();
    el = document.createElement('div'); el.className = 'modal'; el.id = id; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
    el.innerHTML = `<div class="pp-box pp-box--480 ${cls || ''}"><div class="pp-pad pp-center">${html}</div></div>`;
    document.body.appendChild(el); FB.hydrateIcons(el); FB.openModal(id);
    setTimeout(() => { const f = el.querySelector('[data-close],button,a'); f && f.focus({ preventScroll: true }); }, 60);
    return el;
  }
  const closeX = () => `<button type="button" class="pp-x" data-close aria-label="Đóng">${icon('close')}</button>`;
  const MSG = {
    PENDING: ['Đang chờ xác nhận thanh toán', 'Chưa nhận được kết quả từ cổng thanh toán. Nếu bạn đã thanh toán, vui lòng đợi thêm ít phút rồi kiểm tra lại.', 'clock'],
    FAILED: ['Thanh toán không thành công', 'Giao dịch đã bị từ chối. Bạn chưa bị trừ tiền — hãy thử lại hoặc chọn phương thức khác.', 'alert-triangle'],
    CANCELED: ['Giao dịch đã bị hủy', 'Bạn đã hủy giao dịch trên cổng thanh toán. Đơn hàng vẫn được giữ để bạn thanh toán lại.', 'alert-triangle'],
    EXPIRED: ['Mã thanh toán đã hết hạn', 'Đã quá thời gian thanh toán cho mã này. Hãy tạo mã mới để tiếp tục — nếu đã chuyển tiền, vui lòng gọi hotline 0123 456 789.', 'clock'],
    UNDERPAID: ['Số tiền chuyển chưa đủ', 'Nhà hàng nhận được khoản chuyển nhỏ hơn số tiền cần thanh toán. Vui lòng chuyển bổ sung phần còn thiếu hoặc gọi hotline 0123 456 789 để được hỗ trợ.', 'alert-triangle'],
    WRONG_CONTENT: ['Nội dung chuyển khoản chưa khớp', 'Hệ thống chưa đối chiếu được khoản chuyển với đơn này do sai nội dung. Nhân viên sẽ kiểm tra thủ công — vui lòng gọi hotline 0123 456 789 và cung cấp mã đơn.', 'alert-triangle'],
    ERROR: ['Chưa kiểm tra được trạng thái', 'Kết nối đang gián đoạn. Vui lòng thử kiểm tra lại.', 'wifi-off']
  };
  async function checkPayment(o) {
    statusPopup(`<span class="pp-spin" role="progressbar" aria-label="Đang kiểm tra"></span><h3 class="t-h3">Đang kiểm tra trạng thái thanh toán…</h3>
      <p class="t-body c-gray">Fiabesco đang đối chiếu giao dịch ${esc(o.pay.ref || '')} với ${esc(o.pay.label)}. Vui lòng không tắt trình duyệt.</p>`, 'tc-lock-pp');
    let r; try { r = await PAYAPI.check(o.id); } catch (e) { r = { status: 'ERROR' }; }
    FB.closeModal('co-pay-status');
    if (r.status === 'PAID') { statusPopup(`<span class="pp-badge pp-badge--green">${icon('check')}</span><h3 class="t-h3">Thanh toán đã được xác nhận</h3><p class="t-body c-gray">Đang chuyển tới trang xác nhận đơn hàng…</p>`); setTimeout(() => done(r.order), 900); return; }
    const [t, dsc, ic] = MSG[r.status] || MSG.PENDING;
    const retry = ['FAILED', 'CANCELED', 'EXPIRED'].includes(r.status);
    const el = statusPopup(`${closeX()}<span class="pp-badge ${r.status === 'PENDING' ? '' : 'pp-badge--soft'}">${icon(ic)}</span>
      <h3 class="t-h3">${t}</h3><p class="t-body c-gray">${dsc}</p>
      <span class="pp-tag ${r.status === 'PENDING' ? '' : 'pp-tag--wine'}">Mã đơn #${esc(o.id)}</span>
      <div class="pp-actions">${retry ? `<button type="button" class="btn btn--outline" data-pp-act="methods">Đổi phương thức</button><button type="button" class="btn btn--wine" data-pp-act="retry">${r.status === 'EXPIRED' ? 'Tạo mã mới' : 'Thử lại'}</button>`
        : `<button type="button" class="btn btn--outline" data-close>Đóng</button><button type="button" class="btn btn--navy" data-pp-act="recheck">Kiểm tra lại</button>`}</div>`);
    el.addEventListener('click', async e => {
      const a = e.target.closest('[data-pp-act]'); if (!a) return; FB.closeModal(el);
      if (a.dataset.ppAct === 'recheck') checkPayment(O.get(o.id));
      if (a.dataset.ppAct === 'methods') backToMethods();
      if (a.dataset.ppAct === 'retry') { const n = O.get(o.id); n.pay.status = 'UNPAID'; n.pay.ref = null; n.pay.expiresAt = null; O.put(n); n.pay.method === 'VietQR' ? openQR(n) : openGateway(n); }
    });
  }

  /* ---------- D1 · ZaloPay / D2 · Apple Pay / D4 · Thẻ: màn hình cổng thanh toán ---------- */
  const main = $('main.order'), head = $('.order__head'), box = $('#paybox');
  function showPayScreen(on) {
    form.hidden = on; head.hidden = on; box.hidden = !on; main.classList.toggle('is-paying', on);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function backToMethods() {
    showPayScreen(false); form.classList.remove('is-qr'); $('#qr-panel').hidden = true; clearInterval(qrTimer);
    $('#pay-card').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  const applePaySupported = () => { try { return !!(window.ApplePaySession && ApplePaySession.canMakePayments && ApplePaySession.canMakePayments()); } catch (e) { return false; } };
  async function openGateway(o) {
    let r; try { r = await PAYAPI.start(o.id); } catch (e) { FB.toast('Không khởi tạo được giao dịch', 'Vui lòng thử lại.', '', '', 'navy'); return; }
    o = O.get(o.id); const m = o.pay.method;
    const last4 = m === 'Thẻ quốc tế' ? $('#cc-num').value.replace(/\s/g, '').slice(-4) : ''; clearCard(); // không giữ thông tin thẻ
    const ap = m === 'Apple Pay' ? applePaySupported() : null;
    const steps = {
      'ZaloPay': ['Bấm “Mở cổng thanh toán ZaloPay” để chuyển sang cổng ZaloPay.', 'Xác nhận giao dịch trong ứng dụng ZaloPay (quét mã hoặc xác thực).', 'Quay lại trang này — Fiabesco sẽ kiểm tra trạng thái và xác nhận đơn.'],
      'Apple Pay': ['Dùng Safari trên iPhone, iPad hoặc Mac đã thêm thẻ vào Wallet.', 'Xác thực bằng Face ID / Touch ID trên bảng thanh toán của Apple.', 'Đơn hàng chỉ được xác nhận khi Apple Pay và ngân hàng báo thành công.'],
      'Thẻ quốc tế': ['Ngân hàng phát hành có thể yêu cầu xác thực 3-D Secure (OTP).', 'Hoàn tất xác thực trên trang của ngân hàng.', 'Fiabesco chỉ xác nhận đơn khi cổng thanh toán báo giao dịch thành công.']
    }[m];
    box.innerHTML = `<div class="paybox__card card">
      ${PAYAPI.gatewayConfigured ? '' : `<span class="paybox__demo">${icon('alert-triangle')}Cổng ${esc(m === 'Thẻ quốc tế' ? 'thanh toán thẻ' : m)} hiện chưa sẵn sàng — nếu chưa thanh toán được, vui lòng chọn phương thức khác</span>`}
      <span class="paybox__logo"><img src="${IMG + LOGO[m]}" alt="${esc(o.pay.label)}"></span>
      <h1 class="t-h2 paybox__title">${m === 'Thẻ quốc tế' ? 'Thanh toán bằng thẻ VISA / Mastercard' : 'Thanh toán qua ' + esc(m)}</h1>
      <dl class="paybox__info">
        <div><dt>Tổng tiền thanh toán</dt><dd class="paybox__amount money">${money(o.total)}</dd></div>
        <div><dt>Mã đơn hàng</dt><dd>#${esc(o.id)}</dd></div>
        <div><dt>Mã giao dịch</dt><dd>${esc(r.ref)}</dd></div>
        ${last4 ? `<div><dt>Thẻ</dt><dd>•••• ${esc(last4)}</dd></div>` : ''}
      </dl>
      ${m === 'Apple Pay' ? `<div class="paybox__alert${ap ? '' : ' is-warn'}">${icon(ap ? 'shield-check' : 'alert-triangle')}<span>${ap
        ? 'Thiết bị này hỗ trợ Apple Pay, nhưng nhà hàng chưa cấu hình Apple Pay merchant với đơn vị xử lý thanh toán — chưa thể mở bảng thanh toán thật.'
        : 'Trình duyệt hoặc thiết bị này không hỗ trợ Apple Pay. Vui lòng mở trang bằng Safari trên thiết bị Apple, hoặc chọn phương thức khác.'}</span></div>` : ''}
      <ol class="paybox__steps">${steps.map((s, i) => `<li><b>${i + 1}</b><span>${esc(s)}</span></li>`).join('')}</ol>
      <div class="paybox__actions">
        ${m === 'ZaloPay' ? `<button type="button" class="btn btn--navy" data-gw="open">Mở cổng thanh toán ZaloPay ${icon('arrow-right')}</button>` : ''}
        ${m === 'Thẻ quốc tế' ? `<button type="button" class="btn btn--navy" data-gw="open">Tiếp tục xác thực thẻ ${icon('arrow-right')}</button>` : ''}
        <button type="button" class="btn btn--success" data-gw="check">Tôi đã thanh toán</button>
        <div class="paybox__row"><button type="button" class="btn btn--outline" data-gw="back">${icon('arrow-left')}Chọn phương thức khác</button><button type="button" class="btn btn--cancel" data-gw="cancel">Hủy giao dịch</button></div>
      </div>
      ${m === 'ZaloPay' ? '<p class="paybox__note">Tìm hiểu thêm về Zalo tại <a href="https://zalo.me/vi/" target="_blank" rel="noopener noreferrer">zalo.me</a> (trang thông tin, không phải nơi xác nhận giao dịch).</p>' : ''}
    </div>`;
    FB.hydrateIcons(box); showPayScreen(true);
    box.onclick = e => {
      const a = e.target.closest('[data-gw]'); if (!a) return;
      const act = a.dataset.gw; const cur = O.get(o.id);
      if (act === 'back') return backToMethods();
      if (act === 'cancel') { // 3.2 · Luôn hỏi lại trước khi hủy để tránh bấm nhầm
        const c = statusPopup(`${closeX()}<span class="pp-badge pp-badge--soft">${icon('alert-triangle')}</span><h3 class="t-h3">Hủy giao dịch ${esc(cur.pay.label)}?</h3>
          <p class="t-body c-gray">Giao dịch #${esc(cur.pay.ref || '')} sẽ bị hủy. Đơn #${esc(cur.id)} vẫn được giữ để bạn chọn phương thức thanh toán khác. Nếu bạn đã thanh toán, đừng hủy — hãy bấm “Kiểm tra trạng thái”.</p>
          <div class="pp-actions"><button type="button" class="btn btn--outline" data-close>Giữ giao dịch</button><button type="button" class="btn btn--wine" data-confirm-cancel>Hủy giao dịch</button></div>`);
        $('[data-confirm-cancel]', c).addEventListener('click', () => {
          FB.closeModal(c); PAYAPI.cancel(o.id);
          FB.toast('Đã hủy giao dịch', 'Đơn hàng vẫn được giữ — bạn có thể chọn phương thức khác.', '', '', 'navy'); backToMethods();
        });
        return;
      }
      if (act === 'check') {
        /* ZaloPay / Apple Pay — luồng TRÌNH DIỄN nội bộ: "Tôi đã thanh toán" → popup đang xử lý → ghi nhận PAID
           trong dữ liệu mô phỏng (pay.simulated = true) → trang Đặt hàng thành công. Không phải xác nhận tiền thật;
           khi tích hợp cổng thật phải thay bằng kết quả xác thực (IPN/callback) của nhà cung cấp. */
        if (m === 'ZaloPay' || m === 'Apple Pay') {
          if (a.disabled || submitting) return; a.disabled = true; submitting = true;
          const run = () => { const n = O.get(o.id); if (n) { n.pay.simulated = true; O.put(n); } const r = PAYAPI.demoResolve(o.id, 'PAID'); done(r || O.get(o.id)); };
          return FB.payProcessing ? FB.payProcessing(m, cur.total, run) : run();
        }
        return checkPayment(cur);
      }
      if (act === 'open') { // Tích hợp thật: location.href = payUrl (do backend lấy từ cổng). Chưa có cổng → thông báo cho khách.
        FB.toast('Cổng thanh toán chưa sẵn sàng', 'Vui lòng thử lại sau hoặc chọn phương thức thanh toán khác.', '', '', 'navy');
      }
    };
    setTimeout(() => { const h = $('.paybox__title', box); h.tabIndex = -1; h.focus({ preventScroll: true }); }, 80);
  }

  /* ---------- D3 · VietQR (tái sử dụng tạo mã của trang Đặt cọc) ---------- */
  const P = window.FB_DAT_COC; let qrTimer = 0;
  function qrSVG(text) {
    const qr = FB_QR.create(text, 'M'), n = qr.getModuleCount(), q = 2; let d = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c + q} ${r + q}h1v1h-1z`;
    return `<svg viewBox="0 0 ${n + q * 2} ${n + q * 2}" shape-rendering="crispEdges" aria-hidden="true"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#002842"/></svg>`;
  }
  async function openQR(o) {
    const panel = $('#qr-panel');
    if (panel.parentElement !== $('.order__left', form)) $('.order__left', form).prepend(panel); // nằm trong cột trái, thay các mục 1–3
    if (!P || !window.FB_QR) { FB.toast('Không tạo được mã VietQR', 'Thiếu cấu hình chuyển khoản — vui lòng chọn phương thức khác.', '', '', 'navy'); return; }
    try { await PAYAPI.start(o.id); } catch (e) { return; }
    o = O.get(o.id);
    const content = P.transferContent(o.id); // "FIAB <mã đơn>"
    const B = P.BANK, fmtAcc = a => String(a).replace(/^(\d{4})(\d{4})(\d+)$/, '$1 $2 $3');
    panel.innerHTML = `<h2 class="num-title t-h4" id="qr-title"><b>${icon('credit-card')}</b>Chuyển khoản VietQR</h2>
      ${B.demo ? `<p class="qr-demo">${icon('alert-triangle')}<span><strong>Tài khoản nhận tiền minh họa</strong> — vui lòng <u>không chuyển tiền thật</u>.</span></p>` : ''}
      <div class="qr-grid">
        <div class="tc-qrbox">${B.demo ? '<span class="tc-demo">Mã minh họa</span>' : ''}<div class="tc-qr" role="img" aria-label="Mã VietQR thanh toán đơn ${esc(o.id)}">${qrSVG(P.buildVietQR({ amount: o.total, content }))}</div>
          <span class="tc-expiry">${icon('clock')}Mã hết hạn sau <b data-qr-left>15:00</b></span></div>
        <dl class="tc-transfer">
          <div><dt>Ngân hàng</dt><dd>${esc(B.bankName)}</dd></div>
          <div><dt>Chủ tài khoản</dt><dd>${esc(B.accountName)}</dd></div>
          <div class="tc-transfer__copy"><div><dt>Số tài khoản</dt><dd class="tc-num">${esc(fmtAcc(B.accountNo))}</dd></div><button type="button" class="tc-copy" data-qcopy="${esc(B.accountNo)}">${icon('copy')}Sao chép</button></div>
          <div class="tc-transfer__copy"><div><dt>Số tiền</dt><dd class="tc-num c-wine money">${money(o.total)}</dd></div><button type="button" class="tc-copy" data-qcopy="${o.total}">${icon('copy')}Sao chép</button></div>
          <div class="tc-transfer__copy"><div><dt>Nội dung chuyển khoản</dt><dd class="c-wine">${esc(content)}</dd></div><button type="button" class="tc-copy" data-qcopy="${esc(content)}">${icon('copy')}Sao chép</button></div>
          <p class="tc-warn">Giữ nguyên số tiền và nội dung chuyển khoản để hệ thống tự đối chiếu đúng đơn #${esc(o.id)}.</p>
        </dl>
      </div>
      <div class="qr-actions"><button type="button" class="btn btn--outline" data-qr="back">${icon('arrow-left')}Quay lại phương thức thanh toán</button>
        <button type="button" class="btn btn--success" data-qr="paid">Tôi đã chuyển khoản</button></div>`;
    FB.hydrateIcons(panel);
    form.classList.add('is-qr'); panel.hidden = false; panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    panel.onclick = async e => {
      const c = e.target.closest('[data-qcopy]');
      if (c) { let ok = false; try { await navigator.clipboard.writeText(c.dataset.qcopy); ok = true; } catch (er) { const ta = document.createElement('textarea'); ta.value = c.dataset.qcopy; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); try { ok = document.execCommand('copy'); } catch (x) {} ta.remove(); }
        if (ok) { c.classList.add('is-done'); c.lastChild.textContent = 'Đã chép'; setTimeout(() => { c.classList.remove('is-done'); c.lastChild.textContent = 'Sao chép'; }, 1600); } return; }
      const a = e.target.closest('[data-qr]'); if (!a) return;
      if (a.dataset.qr === 'back') return backToMethods();
      if (a.dataset.qr === 'paid') {
        const cur = O.get(o.id);
        /* VietQR — luồng TRÌNH DIỄN nội bộ (giống ZaloPay / Apple Pay): chỉ khi dùng tài khoản nhận tiền MINH HỌA
           và chưa có đối soát ngân hàng. "Tôi đã chuyển khoản" → popup đang xử lý → ghi nhận PAID (pay.simulated = true)
           → đơn CONFIRMED → trang Đặt hàng thành công. Không phải xác nhận tiền thật; khi có tài khoản thật / webhook
           ngân hàng (B.demo = false hoặc gatewayConfigured = true) sẽ đi qua checkPayment() như cũ. */
        if (B.demo && !PAYAPI.gatewayConfigured) {
          if (a.disabled || submitting) return;
          if (cur.pay.expiresAt && Date.now() > cur.pay.expiresAt) return checkPayment(cur); // mã hết hạn → báo hết hạn + "Tạo mã mới"
          a.disabled = true; submitting = true; clearInterval(qrTimer);
          const run = () => { const n = O.get(o.id); if (n) { n.pay.simulated = true; O.put(n); } const r = PAYAPI.demoResolve(o.id, 'PAID'); done(r || O.get(o.id)); };
          return FB.payProcessing ? FB.payProcessing('VietQR', cur.total, run) : run();
        }
        return checkPayment(cur);
      }
    };
    clearInterval(qrTimer);
    const tick = () => { const n = O.get(o.id); const left = Math.max(0, (n.pay.expiresAt || 0) - Date.now()); const s = Math.ceil(left / 1000);
      const el = $('[data-qr-left]', panel); if (el) el.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
      panel.classList.toggle('is-expired', !left); if (!left) clearInterval(qrTimer); };
    tick(); qrTimer = setInterval(tick, 1000);
  }

  // Quay lại trang khi đơn còn chờ thanh toán (ví dụ trở về từ cổng): hiện lại màn hình & kiểm tra trạng thái
  (function resume() {
    const o = getPending(); if (!o || !['PENDING'].includes(o.pay.status)) return;
    current = o;
    if (o.pay.method === 'VietQR') openQR(o).then(() => FB.params.get('pay') === 'return' && checkPayment(O.get(o.id)));
    else openGateway(o).then(() => FB.params.get('pay') === 'return' && checkPayment(O.get(o.id)));
  })();

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
    if ($('.pay.is-active').dataset.pay === 'Thẻ quốc tế') { const ce = cardCheck(); $('#cc-err').hidden = !ce; $('#cc-err').textContent = ce; if (ce) { $('#cc-num').focus(); return; } }
    if (FB.demo === 'payment-failed') { payFailed(); return; }
    finish();
  });
  form.terms.addEventListener('change', () => { $('#terms').classList.toggle('is-error', !form.terms.checked); $('#pay-btn').style.opacity = form.terms.checked ? '' : .45; });
});
