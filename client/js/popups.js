/* =====================================================================
   FIABESCO PALACE — popups.js
   Popup & trạng thái bổ sung cho 3 luồng (theo Figma › Page PC):
   • Luồng 1 – Trang chủ & thông tin: Đăng nhập, Đăng ký, Tài khoản thành công,
     menu tài khoản (đã đăng nhập), Xem nhanh món, Chọn vị trí giao hàng,
     Tuyển dụng sắp ra mắt.
   • Luồng 3 – Giao hàng: Gợi ý tìm kiếm, Chi tiết combo, Chọn địa chỉ giao,
     Đã thêm vào giỏ, lưu Món yêu thích.
   • Luồng 4 – Giỏ hàng → Thanh toán → Theo dõi đơn: Sửa món trực tiếp,
     Sửa nhiều món, Xóa món, Rời trang thanh toán, Đang xử lý thanh toán,
     Hủy đơn, Cảm ơn đánh giá.
   Nạp SAU main.js (và trước/ sau JS trang đều được). Không sửa main.js:
   các hành vi cũ được thay bằng listener pha capture khi cần.
   ===================================================================== */
(function () {
  if (!window.FB) return;
  const { $, $$, icon, vnd, money, Cart } = FB;
  const D = window.FB_DATA || { dishes: [], combos: [], byId: () => null };
  const page = document.body.dataset.page || '';
  const store = {
    get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const USER_KEY = 'fb_user_v1', FAV_KEY = 'fb_fav_v1', ADDR_KEY = 'fb_addr_v1', RECENT_KEY = 'fb_recent_v1';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const I = k => icon(k);

  /* ---------- Hộp popup dùng chung (dựa trên .modal) ---------- */
  function popup(id, html, cls = '') {
    let el = document.getElementById(id); if (el) el.remove();
    el = document.createElement('div'); el.className = 'modal'; el.id = id;
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
    el.innerHTML = `<div class="pp-box ${cls}">${html}</div>`;
    document.body.appendChild(el); FB.hydrateIcons(el); FB.openModal(id);
    const f = el.querySelector('input,button:not(.pp-x)'); if (f) setTimeout(() => f.focus({ preventScroll: true }), 60);
    return el;
  }
  const closeX = (white) => `<button type="button" class="pp-x${white ? ' pp-x--white' : ''}" data-close aria-label="Đóng">${I('close')}</button>`;
  const close = id => FB.closeModal(id);

  /* =================================================================
     LUỒNG 1 · TÀI KHOẢN
     ================================================================= */
  const getUser = () => store.get(USER_KEY, null);
  const initials = n => n.trim().split(/\s+/).slice(-2).map(w => w[0]).join('').toUpperCase();

  function openAuth(tab = 'login') {
    const reg = tab === 'register';
    const el = popup('pp-auth', `${closeX()}<div class="pp-pad">
      <h3 class="t-h3">${reg ? 'Tạo tài khoản' : 'Chào mừng trở lại'}</h3>
      <p class="t-body c-gray">${reg ? 'Chỉ 1 phút để nhận ưu đãi thành viên mới.' : 'Đăng nhập để tích điểm, xem đơn hàng và lưu món yêu thích.'}</p>
      <div class="pp-seg" role="tablist"><button type="button" class="${reg ? '' : 'is-active'}" data-auth-tab="login">Đăng nhập</button><button type="button" class="${reg ? 'is-active' : ''}" data-auth-tab="register">Đăng ký</button></div>
      <form class="pp-form" novalidate>
        ${reg ? `<label class="field" data-f="name"><span class="field__label">Họ và tên</span><span class="field__box"><input name="name" placeholder="Nguyễn Minh Anh" autocomplete="name"></span><span class="field__error">Vui lòng nhập họ tên</span></label>` : ''}
        <label class="field" data-f="id"><span class="field__label">Email hoặc số điện thoại</span><span class="field__box"><input name="id" placeholder="0901 234 567" autocomplete="username"></span><span class="field__error">Email hoặc số điện thoại chưa đúng</span></label>
        <label class="field" data-f="pw"><span class="field__label">Mật khẩu</span><span class="field__box"><input name="pw" type="password" placeholder="${reg ? 'Tối thiểu 8 ký tự' : '••••••••'}" autocomplete="${reg ? 'new-password' : 'current-password'}"><button type="button" class="pp-eye" data-eye>Hiện</button></span><span class="field__error">${reg ? 'Mật khẩu tối thiểu 8 ký tự' : 'Sai mật khẩu — còn 4 lần thử'}</span></label>
        ${reg
          ? `<label class="checkbox" data-f="terms"><input type="checkbox" name="terms"><span class="checkbox__box">${I('check')}</span><span class="t-body-s">Tôi đồng ý với Điều khoản sử dụng và Chính sách bảo mật của Fiabesco Palace.</span></label>`
          : `<div class="pp-row"><label class="checkbox"><input type="checkbox" checked><span class="checkbox__box">${I('check')}</span><span class="t-body-s">Ghi nhớ đăng nhập</span></label><button type="button" class="c-wine" style="font:600 14px/1.4 var(--f-sans)" data-forgot>Quên mật khẩu?</button></div>`}
        <button class="btn btn--navy btn--block" type="submit">${reg ? 'Tạo tài khoản' : 'Đăng nhập'}</button>
      </form>
      ${reg ? `<p class="t-body-s c-gray" style="text-align:center">Đã có tài khoản? <button type="button" class="c-wine" style="font-weight:600" data-auth-tab="login">Đăng nhập</button></p>`
            : `<div class="pp-or">hoặc tiếp tục với</div><div class="pp-social"><button type="button" class="btn btn--outline" data-social="Google"><svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true" focusable="false"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"/></svg>Google</button><button type="button" class="btn btn--outline" data-social="Facebook"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="12" fill="#1877F2"/><path fill="#fff" d="M15.1 7.5h-1.6c-.9 0-1.1.4-1.1 1v1.4h2.6l-.3 2.6h-2.3v7h-2.7v-7H7.5V9.9h2.3V8.3c0-2.2 1.4-3.5 3.4-3.5 1 0 1.8.1 2 .1v2.6z"/></svg>Facebook</button></div>`}
    </div>`, 'pp-box--500');
    const form = $('form', el);
    const err = (k, bad) => { const f = $(`[data-f="${k}"]`, form); if (f) f.classList.toggle('is-error', bad); return bad; };
    form.addEventListener('submit', e => {
      e.preventDefault();
      const id = form.id.value.trim(), pw = form.pw.value;
      const idOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(id) || FB.isPhone(id);
      let bad = err('id', !idOk);
      if (reg) { bad = err('name', !form.name.value.trim()) || bad; bad = err('pw', pw.length < 8) || bad; const t = !form.terms.checked; $('[data-f="terms"]', form).style.color = t ? 'var(--wine)' : ''; bad = bad || t; }
      else bad = err('pw', pw.length < 6) || bad;
      if (bad) return;
      const name = reg ? form.name.value.trim() : 'Nguyễn Minh Anh';
      store.set(USER_KEY, { name, id, tier: reg ? 'Bạc' : 'Vàng', points: reg ? 50 : 1250 });
      close('pp-auth'); renderAccount();
      if (reg) openWelcome(); else FB.toast('Đăng nhập thành công', `Chào mừng ${name.split(' ').pop()} trở lại Fiabesco Palace!`, '', '', 'navy');
    });
  }
  function openWelcome() {
    popup('pp-welcome', `${closeX()}<div class="pp-pad pp-center">
      <span class="pp-badge pp-badge--green">${I('check')}</span>
      <h3 class="t-h3">Chào mừng đến Fiabesco!</h3>
      <span class="pp-tag">${I('gift')}Tài khoản đã sẵn sàng · tặng 50 điểm</span>
      <p class="t-body c-gray">Điểm thưởng dùng được cho cả giao hàng và đặt bàn. Xem hồ sơ thành viên của bạn bất cứ lúc nào.</p>
      <div class="pp-actions"><button type="button" class="btn btn--outline" data-close>Tiếp tục</button><a class="btn btn--navy" href="thanh_vien.html#ho-so">Trang cá nhân</a></div>
    </div>`, 'pp-box--480');
  }

  /* Nút tài khoản trên header: khách → popup đăng nhập; đã đăng nhập → menu tài khoản */
  function renderAccount() {
    const btn = $('.pc-account'); if (!btn) return;
    const u = getUser();
    let wrap = btn.closest('.pp-account');
    if (!wrap) { wrap = document.createElement('div'); wrap.className = 'pp-account'; btn.replaceWith(wrap); wrap.appendChild(btn); }
    $('.pp-menu', wrap)?.remove();
    wrap.classList.toggle('is-member', !!u);
    requestAnimationFrame(syncAvatarGap); // đo sau khi avatar đã được chèn
    if (!u) { btn.innerHTML = I('user'); btn.setAttribute('aria-label', 'Đăng nhập'); btn.removeAttribute('aria-haspopup'); btn.removeAttribute('title'); return; }
    btn.innerHTML = `<span class="pp-chip"><span class="pp-chip__badge">${I('user')}</span>${I('chevron-down')}</span>`;
    btn.setAttribute('aria-label', 'Tài khoản thành viên của ' + u.name); btn.setAttribute('aria-haspopup', 'menu');
    btn.title = `Tài khoản thành viên · Hạng ${u.tier}`;
    const next = u.tier === 'Vàng' ? 5000 : 1000;
    wrap.insertAdjacentHTML('beforeend', `<div class="pp-menu" role="menu">
      <div class="pp-menu__head"><span class="pp-avatar">${esc(initials(u.name))}</span><div><strong>Xin chào, ${esc(u.name.split(' ').pop())}!</strong><small>Thành viên ${u.tier} · ${vnd(u.points)} điểm</small></div></div>
      <div class="pp-points"><div class="pp-row"><span>Còn ${vnd(next - u.points)} điểm để lên ${u.tier === 'Vàng' ? 'Kim cương' : 'Vàng'}</span><a href="thanh_vien.html#uu-dai">Ưu đãi của tôi →</a></div><i></i></div>
      <a class="pp-menu__item" href="thanh_vien.html#ho-so">${I('user')}<span>Hồ sơ cá nhân</span>${I('chevron-right')}</a>
      <a class="pp-menu__item" href="thanh_vien.html#lich-su/giao-hang">${I('receipt')}<span>Đơn hàng của tôi</span>${I('chevron-right')}</a>
      <a class="pp-menu__item" href="thanh_vien.html#lich-su/dat-ban">${I('calendar')}<span>Đặt bàn của tôi</span>${I('chevron-right')}</a>
      <a class="pp-menu__item" href="mon_yeu_thich.html">${I('heart')}<span>Món yêu thích</span>${I('chevron-right')}</a>
      <a class="pp-menu__item" href="thanh_vien.html#uu-dai">${I('gift')}<span>Ưu đãi của tôi</span>${I('chevron-right')}</a>
      <button type="button" class="pp-menu__item pp-menu__out" data-logout>${I('arrow-left')}<span>Đăng xuất</span></button></div>`);
  }
  /* Khoảng cách Avatar → "Đặt bàn" = khoảng cách "Ưu đãi" → icon tìm kiếm.
     Menu nằm giữa phần trống nên khoảng cách đó thay đổi theo bề rộng màn hình
     và chính margin thêm vào (thêm M → khoảng "Ưu đãi" giảm M/2), vì vậy đo thực tế
     rồi hiệu chỉnh vài vòng. Chỉ áp dụng khi đã đăng nhập và nút "Đặt bàn" hiển thị. */
  let scheduleGap = null;
  function syncAvatarGap() {
    // Đăng ký theo dõi trước mọi điều kiện thoát sớm (CSS/font có thể chưa tải xong)
    if (!scheduleGap) {
      let raf = 0;
      scheduleGap = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(syncAvatarGap); };
      window.addEventListener('resize', scheduleGap);
      window.addEventListener('load', scheduleGap);
      document.fonts?.addEventListener?.('loadingdone', scheduleGap);
      document.fonts?.ready.then(scheduleGap);
    }
    const wrap = $('.pc-header .pp-account'); if (!wrap) return;
    wrap.style.removeProperty('--pp-avatar-gap');
    const book = $('.pc-header .pc-book'), search = $('.pc-header .pc-search');
    const last = [...document.querySelectorAll('.pc-header .site-nav__list .site-nav__link')].pop();
    if (!wrap.classList.contains('is-member') || !book || !search || !last ||
        !book.offsetWidth || !search.offsetWidth) return;
    const edge = $('.pp-chip', wrap) || wrap;
    let m = 0;
    for (let i = 0; i < 4; i++) {
      const target = search.getBoundingClientRect().left - last.getBoundingClientRect().right;
      const now = book.getBoundingClientRect().left - edge.getBoundingClientRect().right;
      const diff = target - now; if (Math.abs(diff) < 0.25) break;
      m = Math.max(0, m + diff * 2 / 3);
      wrap.style.setProperty('--pp-avatar-gap', m + 'px');
    }
  }

  // Pha capture: thay popup "Tài khoản thành viên" cũ trong main.js
  document.addEventListener('click', e => {
    const acc = e.target.closest('.pc-account');
    if (acc) {
      e.preventDefault(); e.stopPropagation();
      const menu = acc.parentElement.querySelector('.pp-menu');
      if (menu) { menu.classList.toggle('is-open'); acc.setAttribute('aria-expanded', menu.classList.contains('is-open')); } else openAuth('login');
      return;
    }
    if (!e.target.closest('.pp-menu')) $$('.pp-menu.is-open').forEach(m => m.classList.remove('is-open'));
  }, true);

  /* =================================================================
     LUỒNG 1 · XEM NHANH MÓN, CHỌN VỊ TRÍ, TUYỂN DỤNG
     ================================================================= */
  const SIZES = [['Nhỏ', -10000, '−10.000'], ['Vừa', 0, 'Giá chuẩn'], ['Lớn', 20000, '+20.000']];
  const TOPPINGS = [['Thêm phô mai Parmesan', 15000], ['Thêm bacon giòn', 20000], ['Thêm sốt pesto', 10000]];
  const RATING = { burrata: '4.8/5 (134 đánh giá)', lasagna: '4.9/5 (128 đánh giá)', bolognese: '4.8/5 (212 đánh giá)', 'risotto-kem': '4.7/5 (96 đánh giá)', 'risotto-ga': '4.8/5 (88 đánh giá)' };

  function qtyStep(id) { return `<div class="stepper" data-qty="${id}"><button type="button" data-q="-1" aria-label="Giảm">${I('minus')}</button><output>1</output><button type="button" data-q="1" aria-label="Tăng">${I('plus')}</button></div>`; }
  function bindQty(el, onChange) {
    el.addEventListener('click', e => { const b = e.target.closest('[data-q]'); if (!b) return; const o = $('output', b.parentElement); o.textContent = Math.max(1, Math.min(20, +o.textContent + +b.dataset.q)); onChange && onChange(); });
  }
  function openQuickView(id) {
    const d = D.byId(id); if (!d) return;
    const el = popup('pp-quick', `${closeX(true)}<div class="pp-split">
      <div class="pp-split__media"><img src="${d.img}" alt="${esc(d.name)}"></div>
      <div class="pp-split__body">
        ${d.tag ? `<div class="pp-chips"><span class="chip chip--sm is-active">${esc(d.tag)}</span></div>` : ''}
        <h3 class="t-h3">${esc(d.name)}</h3>
        <div class="pp-rate">${I('star')}${RATING[id] || '4.8/5 (100+ đánh giá)'}</div>
        <span class="t-price-l c-wine" data-base="${d.price}">${money(d.price)}</span>
        <p class="t-body c-gray">${esc(d.desc)}</p>
        <span class="pp-eyebrow pp-eyebrow--gray">Chọn size</span>
        <div class="pp-sizes">${SIZES.map(([n, , l], i) => `<button type="button" class="pp-size${i === 1 ? ' is-active' : ''}" data-size="${i}"><strong>${n}</strong><small>${l}</small></button>`).join('')}</div>
        <span class="pp-eyebrow pp-eyebrow--gray">Topping thêm</span>
        ${TOPPINGS.map(([n, p], i) => `<label class="pp-opt checkbox"><input type="checkbox" data-top="${i}"><span class="checkbox__box">${I('check')}</span><span>${n}</span><em>+${vnd(p)}</em></label>`).join('')}
        <div class="pp-buy">${qtyStep('quick')}<button type="button" class="btn btn--navy" data-buy>Thêm vào giỏ · <span data-sum>${money(d.price)}</span></button></div>
        <a class="pp-link" href="chi_tiet_mon.html?id=${id}">Xem chi tiết món →</a>
      </div></div>`, 'pp-box--920');
    let size = 1;
    const calc = () => { const tops = $$('[data-top]:checked', el).map(x => TOPPINGS[+x.dataset.top]); const unit = d.price + SIZES[size][1] + tops.reduce((s, t) => s + t[1], 0); const q = +$('[data-qty] output', el).textContent; $('[data-sum]', el).textContent = money(unit * q); return { unit, q, opt: ['Size ' + SIZES[size][0], ...tops.map(t => t[0])].join(' · ') }; };
    el.addEventListener('click', e => { const s = e.target.closest('[data-size]'); if (s) { size = +s.dataset.size; $$('[data-size]', el).forEach(b => b.classList.toggle('is-active', b === s)); calc(); } });
    el.addEventListener('change', calc); bindQty(el, calc);
    $('[data-buy]', el).addEventListener('click', () => { const r = calc(); Cart.add(id, r.q, r.opt, r.unit); close('pp-quick'); openAdded(id, r.q, r.opt, r.unit); });
  }

  function openLocation(next) {
    const saved = store.get(ADDR_KEY, null);
    const el = popup('pp-location', `${closeX()}<div class="pp-split">
      <div class="pp-map" data-map><img class="pp-map__img" src="../assets/template-20261120T115451Z-1-001 - Copy/template/branch-map.svg" alt="Bản đồ khu vực giao hàng">
        <label class="pp-map__search">${I('search')}<input value="${esc(saved ? saved.short : '12 Nguyễn Huệ, Quận 1')}" aria-label="Tìm địa chỉ" data-q-addr></label>
        <div class="pp-map__pin"><span>Giao đến đây</span><b>${I('location-pin')}</b></div>
        <button type="button" class="pp-map__me" aria-label="Vị trí của tôi" data-me>${I('location-pin')}</button></div>
      <div class="pp-split__body" style="padding:44px 36px">
        <span class="pp-eyebrow">Giao hàng</span><h3 class="t-h3">Chọn vị trí giao hàng</h3>
        <div class="pp-line" style="background:none;border:0;padding:0"><span class="pp-addr__ic">${I('location-pin')}</span><div class="pp-line__info"><strong data-l1>12 Nguyễn Huệ</strong><small data-l2>P. Bến Nghé, Quận 1, TP. Hồ Chí Minh</small></div></div>
        <div class="pp-infos"><span>${I('clock')}Giao 30–40 phút</span><span>${I('chef-hat')}<b data-km style="font-weight:400">Cách nhà hàng 1,2 km</b></span></div>
        <label class="field"><span class="field__label">Ghi chú cho tài xế</span><span class="field__box"><input data-note placeholder="Số nhà, tầng, ghi chú cho tài xế"></span></label>
        <div class="grow"></div>
        <button type="button" class="btn btn--navy btn--block" data-ok>Xác nhận vị trí</button>
        <p class="t-caption c-gray" style="text-align:center">Kéo bản đồ để ghim chính xác vị trí nhận món.</p>
      </div></div>`, 'pp-box--1040');
    // Kéo bản đồ (minh hoạ): di chuyển nền, ghim cố định ở giữa
    const map = $('[data-map]', el), img = $('.pp-map__img', el); let drag = null, ox = -40, oy = -30;
    map.addEventListener('pointerdown', e => { if (e.target.closest('input,button')) return; drag = { x: e.clientX, y: e.clientY, ox, oy }; map.classList.add('is-drag'); map.setPointerCapture(e.pointerId); });
    map.addEventListener('pointermove', e => { if (!drag) return; ox = Math.max(-260, Math.min(0, drag.ox + e.clientX - drag.x)); oy = Math.max(-80, Math.min(0, drag.oy + e.clientY - drag.y)); img.style.left = ox + 'px'; img.style.top = oy + 'px'; });
    map.addEventListener('pointerup', () => { if (!drag) return; drag = null; map.classList.remove('is-drag'); const km = (1 + Math.hypot(ox + 40, oy + 30) / 60).toFixed(1).replace('.', ','); $('[data-km]', el).textContent = `Cách nhà hàng ${km} km`; });
    $('[data-me]', el).addEventListener('click', () => { ox = -40; oy = -30; img.style.left = ox + 'px'; img.style.top = oy + 'px'; $('[data-km]', el).textContent = 'Cách nhà hàng 1,2 km'; });
    $('[data-q-addr]', el).addEventListener('change', e => { const v = e.target.value.trim(); if (!v) return; const [a, ...rest] = v.split(','); $('[data-l1]', el).textContent = a.trim(); $('[data-l2]', el).textContent = rest.join(',').trim() || 'TP. Hồ Chí Minh'; });
    $('[data-ok]', el).addEventListener('click', () => {
      const short = $('[data-l1]', el).textContent, full = `${short}, ${$('[data-l2]', el).textContent}`;
      store.set(ADDR_KEY, { short, full, note: $('[data-note]', el).value.trim(), label: 'Vị trí đã ghim' });
      close('pp-location'); syncAreaLabel();
      FB.toast('Đã lưu vị trí giao hàng', full, '', '', 'navy');
      if (typeof next === 'string') location.href = next;
    });
  }

  function openRecruit() {
    popup('pp-recruit', `${closeX()}<div class="pp-pad pp-center">
      <span class="pp-badge pp-badge--wine">!</span>
      <span class="pp-eyebrow">Fiabesco Palace · Tuyển dụng</span>
      <h3 class="t-h3">Trang tuyển dụng sắp ra mắt</h3>
      <p class="t-body c-gray">Chúng tôi đang chuẩn bị các vị trí mới. Bạn có thể theo dõi Fanpage hoặc gọi hotline để được báo sớm nhất.</p>
      <div class="pp-actions"><button type="button" class="btn btn--outline" data-close>Đóng</button><a class="btn btn--navy" href="trang_chu.html">Về trang chủ</a></div>
    </div>`, 'pp-box--480');
  }

  /* =================================================================
     LUỒNG 3 · GIAO HÀNG
     ================================================================= */
  function openAdded(id, qty = 1, opt = 'Phần tiêu chuẩn', unit) {
    const d = D.byId(id) || (D.combos || []).find(c => c.id === id) || {};
    const total = Cart.subtotal();
    popup('pp-added', `${closeX()}<div class="pp-pad pp-center">
      <span class="pp-badge pp-badge--green">${I('check')}</span>
      <h3 class="t-h3">Đã thêm vào giỏ hàng!</h3>
      <div class="pp-line"><img src="${d.img}" alt=""><div class="pp-line__info"><strong>${esc(d.name || '')}</strong><small>${esc(opt)} · x${qty}</small></div><span class="pp-line__price">${money((unit || d.price || 0) * qty)}</span></div>
      <p class="row t-body" style="gap:8px;font-weight:600">${I('shopping-cart')}Giỏ hàng: ${Cart.count()} món · ${money(total)}</p>
      <p class="t-body c-gray">Bạn có thể tiếp tục chọn món hoặc mở giỏ hàng để thanh toán.</p>
      <div class="pp-actions"><button type="button" class="btn btn--outline" data-close>Tiếp tục chọn món</button><a class="btn btn--navy" href="gio_hang.html">Xem giỏ hàng</a></div>
    </div>`, 'pp-box--540');
  }
  // Pha capture: nút "+" trên thẻ món → popup "Đã thêm vào giỏ" (thay toast)
  document.addEventListener('click', e => {
    const add = e.target.closest('.dish__add'); if (!add) return;
    const card = add.closest('.dish'); if (!card) return;
    e.preventDefault(); e.stopPropagation();
    const id = card.dataset.id; Cart.add(id); openAdded(id);
  }, true);

  // Món yêu thích (localStorage) – đồng bộ trái tim trên mọi thẻ món
  const Fav = {
    all: () => store.get(FAV_KEY, ['carbonara', 'bolognese', 'burrata', 'lasagna', 'risotto-kem', 'risotto-ga', 'bruschetta', 'caprese']),
    has: id => Fav.all().includes(id),
    toggle(id) { const a = Fav.all(); const i = a.indexOf(id); if (i < 0) a.unshift(id); else a.splice(i, 1); store.set(FAV_KEY, a); document.dispatchEvent(new CustomEvent('fav:change', { detail: { id, on: i < 0 } })); return i < 0; },
    set: a => { store.set(FAV_KEY, a); document.dispatchEvent(new CustomEvent('fav:change')); }
  };
  function paintFav(root = document) { $$('.dish[data-id]', root).forEach(c => { const b = $('.dish__fav', c); if (b) { const on = Fav.has(c.dataset.id); b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', on); b.setAttribute('aria-label', on ? 'Bỏ khỏi món yêu thích' : 'Thêm vào món yêu thích'); } }); }
  document.addEventListener('click', e => {
    const b = e.target.closest('.dish__fav'); if (!b) return;
    const c = b.closest('.dish[data-id]'); if (!c) return;
    e.preventDefault(); e.stopPropagation();
    const on = Fav.toggle(c.dataset.id); paintFav();
    FB.toast(on ? 'Đã lưu vào Món yêu thích' : 'Đã bỏ khỏi Món yêu thích', (D.byId(c.dataset.id) || {}).name || '', on ? 'Xem danh sách' : '', 'mon_yeu_thich.html', 'navy');
  }, true);
  new MutationObserver(() => paintFav()).observe(document.documentElement, { childList: true, subtree: true });

  // Chi tiết combo
  const COMBO_ITEMS = {
    'combo-an-y': { people: 'Dành cho 2 người · 3 món', desc: 'Bộ ba hương vị Ý kinh điển: risotto bò đậm đà, salad Caprese tươi mát và mì Ý cua sốt kem — vừa đủ cho bữa tối hai người.', items: [['risotto-kem', 'Risotto Bò', 1], ['caprese', 'Salad cà chua phô mai Caprese', 1], ['carbonara', 'Mì Ý Cua', 1]] },
    'combo-gia-dinh': { people: 'Dành cho 4 người · 5 món', desc: 'Bữa tối sum vầy cho cả nhà: hai pizza nướng lò đá, hai phần mì Ý và salad tươi chia sẻ — tiết kiệm 15% so với gọi lẻ.', items: [['lasagna', 'Pizza Margherita', 2], ['bolognese', 'Mì Ý Bò Bằm Phô Mai', 2], ['burrata', 'Salad Phô Mai Burrata', 1]] },
    'combo-dong-am': { people: 'Dành cho 2 người · 3 món', desc: 'Ấm bụng ngày mưa: súp Minestrone nóng hổi, risotto kem phô mai và ấm trà thảo mộc thơm dịu.', items: [['minestrone', 'Súp Minestrone', 1], ['risotto-kem', 'Cơm Risotto Kem Phô Mai', 1], ['caprese', 'Trà thảo mộc Ý', 1]] }
  };
  function openCombo(cid) {
    const c = (D.combos || []).find(x => x.id === cid); if (!c) return;
    const info = COMBO_ITEMS[cid];
    const el = popup('pp-combo', `${closeX(true)}<div class="pp-split">
      <div class="pp-split__media pp-split__media--fit"><img src="${c.img}" alt="${esc(c.name)}"></div>
      <div class="pp-split__body">
        <span class="pp-eyebrow">Chi tiết combo</span><h3 class="t-h3">${esc(c.name)}</h3>
        <div class="pp-rate" style="color:var(--gray)">${I('users')}${info.people}</div>
        <span class="t-price-l c-wine">${money(c.price)}</span>
        <p class="t-body c-gray">${info.desc}</p>
        <span class="pp-eyebrow pp-eyebrow--gray">Combo gồm</span>
        ${info.items.map(([id, n, q]) => `<div class="pp-combo-item"><img src="${(D.byId(id) || {}).img}" alt=""><div><strong>${n}</strong><small>Khẩu phần: Tiêu chuẩn</small></div><b>x${q}</b></div>`).join('')}
        <span class="pp-note">Lưu ý: Không áp dụng đổi món trong combo. Combo được đóng gói riêng từng món để giữ nhiệt khi giao.</span>
        <div class="pp-buy">${qtyStep('combo')}<button type="button" class="btn btn--navy" data-buy>Thêm vào giỏ · <span data-sum>${money(c.price)}</span></button></div>
      </div></div>`, 'pp-box--920');
    bindQty(el, () => { $('[data-sum]', el).textContent = money(c.price * +$('[data-qty] output', el).textContent); });
    $('[data-buy]', el).addEventListener('click', () => {
      const q = +$('[data-qty] output', el).textContent; const items = Cart.get(); const ex = items.find(i => i.id === cid);
      if (ex) ex.qty += q; else items.push({ id: cid, qty: q, opt: info.people.replace('Dành cho ', ''), unit: c.price, combo: true });
      Cart.set(items); close('pp-combo'); openAdded(cid, q, 'Combo · ' + info.people.replace('Dành cho ', ''), c.price);
    });
  }
  // Ảnh/tên combo trong giỏ: main/gio_hang tra FB_DATA.byId → bổ sung tra combo
  if (D.byId && !D.__comboPatched) { const base = D.byId; D.byId = id => base(id) || (D.combos || []).find(c => c.id === id); D.__comboPatched = true; }
  document.addEventListener('click', e => { const b = e.target.closest('.combo__more,[data-combo]'); if (!b) return; e.preventDefault(); e.stopImmediatePropagation(); openCombo(b.dataset.combo || b.closest('[data-combo]')?.dataset.combo); }, true);

  // Chọn địa chỉ giao
  const ADDRS = [['home', 'Nhà riêng', '12 Nguyễn Huệ, P. Bến Nghé, Quận 1, TP. Hồ Chí Minh', '1,2 km', 'Quận 1'], ['work', 'Công ty', '268 Lý Thường Kiệt, P. 14, Quận 10, TP. Hồ Chí Minh', '3,4 km', 'Quận 10'], ['parent', 'Nhà ba mẹ', '45 Phan Xích Long, P. 2, Phú Nhuận, TP. Hồ Chí Minh', '4,1 km', 'Phú Nhuận']];
  function openAddress() {
    const cur = store.get(ADDR_KEY, null); let sel = cur && cur.key || 'home';
    const el = popup('pp-address', `${closeX()}<div class="pp-pad">
      <span class="pp-eyebrow">Giao đến</span><h3 class="t-h3">Giao hàng đến đâu?</h3>
      <p class="t-body c-gray">Chọn địa chỉ đã lưu hoặc ghim vị trí mới trên bản đồ.</p>
      ${ADDRS.map(([k, n, a, km], i) => `<button type="button" class="pp-addr${k === sel ? ' is-active' : ''}" data-addr="${k}"><span class="radio"></span><span class="pp-addr__ic">${I(k === 'home' ? 'home' : 'location-pin')}</span><span class="pp-addr__txt"><strong>${n}${i === 0 ? '<span class="pill pill--green">Mặc định</span>' : ''}</strong><small>${a}</small></span><span class="pp-addr__km">${km}</span></button>`).join('')}
      <button type="button" class="pp-pin-btn" data-pin>${I('map')}Ghim chính xác vị trí trên bản đồ</button>
      <div class="pp-actions"><button type="button" class="btn btn--outline" data-pin>Thêm địa chỉ mới</button><button type="button" class="btn btn--navy" data-ok>Giao đến đây</button></div>
    </div>`, 'pp-box--560');
    el.addEventListener('click', e => {
      const a = e.target.closest('[data-addr]'); if (a) { sel = a.dataset.addr; $$('[data-addr]', el).forEach(b => b.classList.toggle('is-active', b === a)); }
      if (e.target.closest('[data-pin]')) { close('pp-address'); openLocation(); }
      if (e.target.closest('[data-ok]')) { const r = ADDRS.find(x => x[0] === sel); store.set(ADDR_KEY, { key: r[0], short: r[4], full: r[2], label: r[1] }); close('pp-address'); syncAreaLabel(); }
    });
  }
  function syncAreaLabel() { const a = store.get(ADDR_KEY, null); const s = $('[data-dd="area"] span'); if (a && s) s.textContent = 'Giao đến: ' + a.short; }
  document.addEventListener('click', e => { const b = e.target.closest('[data-dd="area"]'); if (!b) return; e.preventDefault(); e.stopImmediatePropagation(); openAddress(); }, true);

  // Gợi ý tìm kiếm (Thực đơn) – Figma "PC – 02d Tìm kiếm – Gợi ý"
  function initSearchSuggest() {
    const form = $('#search'); if (!form) return; const input = $('input', form); if (!input) return;
    form.style.position = 'relative';
    const box = document.createElement('div'); box.className = 'pp-suggest'; box.setAttribute('role', 'listbox'); form.appendChild(box);
    const HOT = ['Mì Ý sốt kem', 'Mì Ý Bò Bằm', 'Mì Lasagna', 'Risotto', 'Phô mai Burrata'];
    const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').toLowerCase();
    function draw() {
      const q = input.value.trim(); const rec = store.get(RECENT_KEY, ['Risotto', 'Phô mai Burrata', 'Lasagna']);
      const hits = q ? D.dishes.filter(d => norm(d.name + ' ' + d.desc).includes(norm(q))).slice(0, 3) : D.dishes.slice(0, 3);
      const hl = n => { if (!q) return esc(n); const i = norm(n).indexOf(norm(q)); return i < 0 ? esc(n) : esc(n.slice(0, i)) + '<mark>' + esc(n.slice(i, i + q.length)) + '</mark>' + esc(n.slice(i + q.length)); };
      box.innerHTML = `${rec.length ? `<div class="pp-row"><h4>Tìm kiếm gần đây</h4><button type="button" class="c-wine t-body-s" data-clear>Xóa tất cả</button></div>
        ${rec.map(r => `<div class="pp-recent"><button type="button" class="pp-recent" data-go="${esc(r)}" style="flex:1">${I('clock')}<span>${esc(r)}</span></button><button type="button" data-rm="${esc(r)}" aria-label="Xóa">${I('close')}</button></div>`).join('')}<hr>` : ''}
        <h4>Gợi ý tìm kiếm</h4><div class="pp-chips">${HOT.map(h => `<button type="button" class="chip chip--sm" data-go="${h}">${I('search')}${h}</button>`).join('')}</div><hr>
        <h4>${q ? 'Món phù hợp' : 'Đề xuất'}</h4>
        ${hits.length ? hits.map(d => `<a class="pp-hit" href="chi_tiet_mon.html?id=${d.id}"><img src="${d.img}" alt=""><div><strong>${hl(d.name)}</strong><small>${(D.categories.find(c => c.id === d.cat) || {}).name || ''}</small></div><b>${money(d.price)}</b></a>`).join('') : '<p class="t-body-s c-gray">Chưa có món khớp — nhấn Enter để xem gợi ý thay thế.</p>'}
        ${q ? `<button type="button" class="pp-link" data-go="${esc(q)}" style="align-self:flex-start">Xem tất cả kết quả cho “${esc(q)}” →</button>` : ''}`;
      FB.hydrateIcons(box);
    }
    const open = () => { draw(); box.classList.add('is-open'); };
    input.addEventListener('focus', open); input.addEventListener('input', open);
    document.addEventListener('click', e => { if (!form.contains(e.target)) box.classList.remove('is-open'); });
    input.addEventListener('keydown', e => { if (e.key === 'Escape') box.classList.remove('is-open'); });
    box.addEventListener('mousedown', e => e.preventDefault());
    box.addEventListener('click', e => {
      const rm = e.target.closest('[data-rm]'); if (rm) { store.set(RECENT_KEY, store.get(RECENT_KEY, []).filter(x => x !== rm.dataset.rm)); draw(); return; }
      if (e.target.closest('[data-clear]')) { store.set(RECENT_KEY, []); draw(); return; }
      const g = e.target.closest('[data-go]'); if (g) { input.value = g.dataset.go; box.classList.remove('is-open'); form.requestSubmit(); }
    });
    form.addEventListener('submit', () => { const q = input.value.trim(); if (!q) return; const r = store.get(RECENT_KEY, []).filter(x => x !== q); r.unshift(q); store.set(RECENT_KEY, r.slice(0, 5)); box.classList.remove('is-open'); });
  }

  /* =================================================================
     LUỒNG 4 · GIỎ HÀNG → THANH TOÁN → THEO DÕI ĐƠN
     ================================================================= */
  const rerenderCart = () => { if (typeof window.FB_CART_RENDER === 'function') window.FB_CART_RENDER(); else location.reload(); };

  // Xóa món (popup xác nhận) – thay nút thùng rác của giỏ hàng
  function openRemove(idxs, done) {
    const items = Cart.get(); const list = idxs.map(i => items[i]).filter(Boolean); if (!list.length) return;
    const one = list.length === 1, it = list[0], d = D.byId(it.id) || {};
    popup('pp-remove', `${closeX()}<div class="pp-pad pp-center">
      <span class="pp-badge pp-badge--soft">${I('trash')}</span>
      <h3 class="t-h3">${one ? 'Xóa món khỏi giỏ hàng?' : `Xóa ${list.length} món khỏi giỏ hàng?`}</h3>
      ${one ? `<div class="pp-line"><img src="${d.img}" alt=""><div class="pp-line__info"><strong>${esc(d.name)}</strong><small>x${it.qty} · ${esc(it.opt)}</small></div><span class="pp-line__price">${money(it.qty * it.unit)}</span></div>` : ''}
      <p class="t-body c-gray">${one ? 'Món này sẽ được xóa' : 'Các món đã chọn sẽ được xóa'} khỏi giỏ hàng và tổng tiền sẽ được cập nhật lại. Bạn vẫn có thể thêm lại món từ thực đơn bất cứ lúc nào.</p>
      <div class="pp-actions"><button type="button" class="btn btn--outline" data-close>Giữ lại</button><button type="button" class="btn btn--wine" data-ok>Xóa món</button></div>
    </div>`, 'pp-box--480');
    $('#pp-remove [data-ok]').addEventListener('click', () => { close('pp-remove'); done(); });
  }

  // Sửa món trực tiếp trong giỏ – Figma "PC – 04b"
  const PORTION = [['Phần tiêu chuẩn', '1 người', 0], ['Phần lớn', '2 người', 60000]];
  const CART_TOPS = [['Phô mai Mozzarella thêm', 25000], ['Nấm truffle đen', 45000], ['Bánh mì bơ tỏi (2 lát)', 20000]];
  function openInlineEdit(row) {
    $$('.pp-edit').forEach(x => x.remove());
    const i = +row.dataset.i; const it = Cart.get()[i]; const d = D.byId(it.id); if (!d || it.combo) return false;
    let por = /Phần lớn/.test(it.opt) ? 1 : 0;
    const tops = CART_TOPS.map(([n]) => it.opt.includes(n.replace(' thêm', '')));
    const note = (it.opt.match(/Ghi chú: (.+)$/) || [])[1] || '';
    const panel = document.createElement('div'); panel.className = 'pp-edit';
    panel.innerHTML = `<div class="pp-row"><strong class="row t-title" style="gap:8px;font-size:16px">${I('edit')}Chỉnh sửa lựa chọn</strong><button type="button" class="t-body-s c-gray" data-cancel>Thu gọn ▴</button></div>
      <span class="pp-edit__label">Kích cỡ</span>
      <div class="pp-sizes">${PORTION.map(([n, s, p], k) => `<button type="button" class="pp-size${k === por ? ' is-active' : ''}" data-por="${k}"><strong>${n}</strong><small>${s} · ${k ? '+' + vnd(p) : vnd(d.price)}</small></button>`).join('')}</div>
      <span class="pp-edit__label">Thêm topping</span>
      ${CART_TOPS.map(([n, p], k) => `<label class="pp-opt checkbox"><input type="checkbox" data-t="${k}" ${tops[k] ? 'checked' : ''}><span class="checkbox__box">${I('check')}</span><span>${n}</span><em>+${vnd(p)}</em></label>`).join('')}
      <span class="pp-edit__label">Ghi chú cho bếp</span>
      <textarea data-note placeholder="Ít cay, không hành…">${esc(note)}</textarea>
      <div class="pp-edit__actions"><button type="button" class="btn btn--outline" data-cancel>Huỷ</button><button type="button" class="btn btn--navy" data-save>Lưu thay đổi · <span data-sum></span></button></div>`;
    row.after(panel); FB.hydrateIcons(panel);
    const calc = () => { const t = $$('[data-t]:checked', panel).map(x => CART_TOPS[+x.dataset.t]); const unit = d.price + PORTION[por][2] + t.reduce((s, x) => s + x[1], 0); $('[data-sum]', panel).textContent = money(unit * it.qty); return { unit, t }; };
    calc();
    panel.addEventListener('change', calc);
    panel.addEventListener('click', e => {
      const p = e.target.closest('[data-por]'); if (p) { por = +p.dataset.por; $$('[data-por]', panel).forEach(b => b.classList.toggle('is-active', b === p)); calc(); }
      if (e.target.closest('[data-cancel]')) panel.remove();
      if (e.target.closest('[data-save]')) {
        const r = calc(); const n = $('[data-note]', panel).value.trim();
        const items = Cart.get(); items[i] = { ...items[i], unit: r.unit, opt: [PORTION[por][0], ...r.t.map(x => '+ ' + x[0].replace(' thêm', ''))].join(' · ') + (n ? ` · Ghi chú: ${n}` : '') };
        Cart.set(items); panel.remove(); rerenderCart(); FB.toast('Đã cập nhật món', d.name, '', '', 'navy');
      }
    });
    return true;
  }

  // Sửa nhiều món – Figma "PC – 04c"
  function initCartTools() {
    const items = $('#items'); if (!items) return;
    const bar = document.createElement('div'); bar.className = 'pp-bulk'; bar.setAttribute('aria-live', 'polite');
    bar.innerHTML = `<div class="pp-bulk__txt"><strong data-n>Đã chọn 0 món</strong><small>Áp dụng cho các món đã chọn</small></div>
      <button type="button" class="pp-bulk__btn" data-bulk-del>${I('trash')}<span>Xoá (0)</span></button>
      <button type="button" class="pp-bulk__btn" data-bulk-size>${I('edit')}Đổi khẩu phần</button>
      <button type="button" class="btn btn--gold" data-bulk-done>Xong</button>`;
    items.after(bar); FB.hydrateIcons(bar);
    const head = $('.cart-list__head'); if (head && !$('[data-bulk-on]', head)) { const t = document.createElement('button'); t.type = 'button'; t.className = 'pp-bulk-toggle'; t.dataset.bulkOn = ''; t.innerHTML = `${I('edit')}Sửa nhiều món`; head.insertBefore(t, $('#del-sel')); FB.hydrateIcons(t); }
    const checked = () => $$('[data-sel]', items).filter(x => x.checked).map(x => +x.dataset.sel);
    const sync = () => { const n = checked().length; $('[data-n]', bar).textContent = `Đã chọn ${n} món`; $('[data-bulk-del] span', bar).textContent = `Xoá (${n})`; };
    document.addEventListener('change', e => { if (e.target.matches('[data-sel],#all')) setTimeout(sync); });
    document.addEventListener('click', e => {
      if (e.target.closest('[data-bulk-on]')) { bar.classList.add('is-on'); sync(); }
      if (e.target.closest('[data-bulk-done]')) bar.classList.remove('is-on');
      if (e.target.closest('[data-bulk-del]')) { const idx = checked(); if (idx.length) openRemove(idx, () => { $('#del-sel').dataset.ppOk = '1'; $('#del-sel').click(); bar.classList.remove('is-on'); }); }
      if (e.target.closest('[data-bulk-size]')) {
        const idx = checked(); if (!idx.length) return; const list = Cart.get();
        idx.forEach(i => { const it = list[i]; const d = D.byId(it.id); if (!d || it.combo) return; const big = /Phần lớn/.test(it.opt); it.opt = big ? it.opt.replace('Phần lớn', 'Phần tiêu chuẩn') : (/Phần tiêu chuẩn/.test(it.opt) ? it.opt.replace('Phần tiêu chuẩn', 'Phần lớn') : 'Phần lớn · ' + it.opt); it.unit += big ? -60000 : 60000; });
        Cart.set(list); rerenderCart(); FB.toast('Đã đổi khẩu phần', `${idx.length} món đã chọn`, '', '', 'navy');
      }
    });
    // Thùng rác từng món & "Xóa đã chọn" → popup xác nhận
    document.addEventListener('click', e => {
      const del = e.target.closest('#items [data-del]');
      if (del && !del.dataset.ppOk) { e.preventDefault(); e.stopImmediatePropagation(); openRemove([+del.dataset.del], () => { del.dataset.ppOk = '1'; del.click(); }); return; }
      const ds = e.target.closest('#del-sel');
      if (ds && !ds.dataset.ppOk) { e.preventDefault(); e.stopImmediatePropagation(); const idx = checked(); if (idx.length) openRemove(idx, () => { ds.dataset.ppOk = '1'; ds.click(); }); return; }
      if (ds) delete ds.dataset.ppOk;
      const ed = e.target.closest('#items .cart-item__edit');
      if (ed) { const row = ed.closest('.cart-item'); if (row && openInlineEdit(row)) { e.preventDefault(); e.stopImmediatePropagation(); } }
    }, true);
  }

  // Rời trang thanh toán (popup) – bấm "Quay lại giỏ hàng" ở trang Thanh toán
  function initLeaveCheckout() {
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href="gio_hang.html"]'); if (!a || a.dataset.ppOk) return;
      e.preventDefault(); e.stopImmediatePropagation();
      popup('pp-leave', `${closeX()}<div class="pp-pad pp-center">
        <span class="pp-badge pp-badge--cream">${I('shopping-cart')}</span>
        <h3 class="t-h3">Rời khỏi trang thanh toán?</h3>
        <span class="pp-tag pp-tag--wine">Đơn hàng của bạn chưa được đặt</span>
        <p class="t-body c-gray">Các món vẫn được giữ nguyên trong giỏ hàng. Bạn có thể quay lại thanh toán bất cứ lúc nào.</p>
        <div class="pp-actions"><a class="btn btn--outline" href="gio_hang.html" data-pp-ok="1">Về giỏ hàng</a><button type="button" class="btn btn--navy" data-close>Ở lại</button></div>
      </div>`, 'pp-box--480');
    }, true);
  }

  // Đang xử lý thanh toán – gọi FB.payProcessing(cb) trước khi chuyển trang
  function payProcessing(method = 'ZaloPay', total, cb) {
    popup('pp-processing', `<div class="pp-pad pp-center">
      <span class="pp-spin" role="progressbar" aria-label="Đang xử lý"></span>
      <h3 class="t-h3">Đang xử lý thanh toán…</h3>
      <p class="t-body c-gray">Vui lòng không tắt trình duyệt. Fiabesco đang xác nhận giao dịch với ${esc(method)}.</p>
      <span class="pp-tag pp-tag--green">${I('lock')}Mã hóa SSL 256-bit${total ? ' · ' + money(total) : ''}</span>
    </div>`, 'pp-box--480');
    setTimeout(() => { close('pp-processing'); cb && cb(); }, 1800);
  }

  // Hủy đơn – FB.openCancelOrder(order)
  function openCancelOrder(o = {}) {
    popup('pp-cancel', `${closeX()}<div class="pp-pad pp-center">
      <span class="pp-badge pp-badge--wine">!</span>
      <h3 class="t-h3">Hủy đơn hàng #${esc(o.code || 'FB2611-0248')}?</h3>
      <span class="pp-tag pp-tag--green">${I('clock')}Nhà hàng chưa bắt đầu chế biến món</span>
      <p class="t-body c-gray">${o.pay === 'Tiền mặt' ? 'Đơn thanh toán khi nhận hàng nên bạn không bị trừ tiền.' : `Nếu hủy bây giờ, số tiền đã thanh toán qua ${esc(o.pay || 'ZaloPay')} sẽ được hoàn lại trong 1–3 ngày làm việc.`} Bạn không thể khôi phục đơn sau khi hủy.</p>
      <div class="pp-actions"><button type="button" class="btn btn--outline" data-close>Giữ đơn</button><button type="button" class="btn btn--wine" data-ok>Hủy đơn</button></div>
    </div>`, 'pp-box--500');
    $('#pp-cancel [data-ok]').addEventListener('click', () => {
      try { const cur = JSON.parse(sessionStorage.getItem('fb_order') || '{}'); cur.canceled = true; cur.canceledAt = Date.now(); sessionStorage.setItem('fb_order', JSON.stringify(cur)); } catch (e) {}
      location.href = 'don_hang_da_huy.html';
    });
  }

  // Cảm ơn đánh giá
  function openThanks() {
    popup('pp-thanks', `${closeX()}<div class="pp-pad pp-center">
      <span class="pp-badge pp-badge--green">${I('check')}</span>
      <h3 class="t-h3">Cảm ơn đánh giá của bạn!</h3>
      <span class="pp-tag">${I('coupon-tag')}Mã FIABESCO10 đã được lưu vào tài khoản</span>
      <p class="t-body c-gray">Ý kiến của bạn giúp Fiabesco phục vụ tốt hơn mỗi ngày. Hẹn gặp lại bạn ở đơn tiếp theo!</p>
      <div class="pp-actions"><a class="btn btn--outline" href="khuyen_mai.html">Xem ưu đãi</a><a class="btn btn--navy" href="trang_chu.html">Về trang chủ</a></div>
    </div>`, 'pp-box--480');
  }

  /* =================================================================
     GẮN VÀO TRANG
     ================================================================= */
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-auth-tab]'); if (t) { openAuth(t.dataset.authTab); return; }
    const eye = e.target.closest('[data-eye]'); if (eye) { const i = eye.parentElement.querySelector('input'); const show = i.type === 'password'; i.type = show ? 'text' : 'password'; eye.textContent = show ? 'Ẩn' : 'Hiện'; return; }
    if (e.target.closest('[data-forgot]')) { location.href = 'thanh_vien.html#quen-mat-khau'; return; } // Luồng Thành viên – M05 Quên mật khẩu
    const so = e.target.closest('[data-social]'); if (so) { store.set(USER_KEY, { name: 'Nguyễn Minh Anh', id: so.dataset.social, tier: 'Vàng', points: 1250 }); close('pp-auth'); renderAccount(); FB.toast('Đăng nhập thành công', 'Đã liên kết tài khoản ' + so.dataset.social, '', '', 'navy'); return; }
    if (e.target.closest('[data-logout]')) { store.set(USER_KEY, null); renderAccount(); FB.toast('Đã đăng xuất', 'Hẹn gặp lại bạn tại Fiabesco Palace.', '', '', 'navy'); return; }
    const soon = e.target.closest('[data-soon]'); if (soon) { e.preventDefault(); FB.toast(soon.dataset.soon, 'Tính năng sẽ sớm ra mắt.', '', '', 'navy'); return; }
    const op = e.target.closest('[data-pp]'); if (op) { e.preventDefault(); const k = op.dataset.pp; ({ login: () => openAuth('login'), register: () => openAuth('register'), location: () => openLocation(op.dataset.next), address: openAddress, recruit: openRecruit })[k]?.(); }
  });
  // "Tuyển dụng" giờ dẫn tới trang tuyen_dung.html (Luồng Tuyển dụng); popup "sắp ra mắt" vẫn mở được bằng ?popup=recruit hoặc data-pp="recruit".

  document.addEventListener('fb:ready', () => {
    renderAccount(); paintFav(); syncAreaLabel();
    if (page === 'thuc_don') initSearchSuggest();
    if (page === 'gio_hang') initCartTools();
    if (page === 'thanh_toan') initLeaveCheckout();
    if (page === 'trang_chu') {
      // Thẻ món nổi bật → Xem nhanh món; "Đặt món ngay" → Chọn vị trí giao hàng
      document.addEventListener('click', e => {
        const link = e.target.closest('#featured-grid .dish__media,#featured-grid .dish__name');
        if (link) { e.preventDefault(); e.stopImmediatePropagation(); openQuickView(link.closest('.dish').dataset.id); return; }
        const order = e.target.closest('a.btn[href="thuc_don.html"]');
        if (order && /Đặt món ngay/i.test(order.textContent) && !store.get(ADDR_KEY, null)) { e.preventDefault(); e.stopImmediatePropagation(); openLocation('thuc_don.html'); }
      }, true);
    }
    const p = FB.params.get('popup');   // xem nhanh từng popup: ?popup=login|register|welcome|location|recruit|quick|combo|address|thanks
    ({ login: () => openAuth('login'), register: () => openAuth('register'), welcome: openWelcome, location: () => openLocation(), recruit: openRecruit, quick: () => openQuickView(FB.params.get('id') || 'burrata'), combo: () => openCombo(FB.params.get('id') || 'combo-an-y'), address: openAddress, thanks: openThanks, processing: () => payProcessing('ZaloPay', 499000) })[p]?.();
  });

  Object.assign(FB, { Fav, openAuth, openWelcome, openQuickView, openLocation, openRecruit, openAdded, openCombo, openAddress, openRemove, payProcessing, openCancelOrder, openThanks, store, getUser, renderAccount });
})();
