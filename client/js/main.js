/* =========================================================
   Fiabesco Palace – JS dùng chung
   - Header/Footer (component "Header", "Footer" trong Figma)
   - Icon SVG (../assets/template-20261120T115451Z-1-001 - Copy/template/bộ icon/), giỏ hàng (localStorage)
   - Trạng thái dùng chung: mất mạng (E02), phiên hết hạn (E14)
   ========================================================= */
(function () {
  const ICONS = window.FB_ICONS || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- HTML icons ----------
     Tất cả icon UI viết trực tiếp vào DOM bằng <i><svg>…</svg></i>.
     Chỉ icon giỏ hàng dùng ảnh SVG theo đúng yêu cầu. */
  const CART_ICON_URL = '../assets/template-20261120T115451Z-1-001 - Copy/template/bộ icon/giohang.svg';
  function icon(key, cls = '') {
    const full = String(key).split('/').pop();
    const className = 'ic' + (cls ? ' ' + cls : '');
    if (full === 'giohang') {
      return `<img class="${className}" src="${CART_ICON_URL}" alt="" aria-hidden="true">`;
    }
    const markup = ICONS[full];
    if (!markup) { console.warn('Thiếu icon HTML', full); return ''; }
    return `<i class="${className}" aria-hidden="true">${markup}</i>`;
  }
  function hydrateIcons(root = document) {
    $$('[data-icon]', root).forEach(el => {
      el.outerHTML = icon(el.getAttribute('data-icon'), el.className || '');
    });
  }

  /* ---------- Format ---------- */
  const vnd = n => Math.round(n).toLocaleString('vi-VN').replace(/,/g, '.');
  const money = n => vnd(n) + ' VND';

  /* ---------- Cart store ---------- */
  const CART_KEY = 'fb_cart_v1';
  const defaultCart = [
    { id: 'lasagna', qty: 1, opt: 'Phần tiêu chuẩn · + Phô mai Mozzarella', unit: 184000 },
    { id: 'burrata', qty: 2, opt: 'Ghi chú: ít dầu giấm', unit: 118000 },
    { id: 'risotto-kem', qty: 1, opt: 'Phần tiêu chuẩn', unit: 89000 }
  ];
  const Cart = {
    get() {
      try { const v = JSON.parse(localStorage.getItem(CART_KEY)); return Array.isArray(v) ? v : defaultCart.map(o => ({ ...o })); }
      catch (e) { return defaultCart.map(o => ({ ...o })); }
    },
    set(items) { try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch (e) {} updateBadge(); document.dispatchEvent(new CustomEvent('cart:change')); },
    add(id, qty = 1, opt = 'Phần tiêu chuẩn', unit) {
      const d = window.FB_DATA && FB_DATA.byId(id); const items = Cart.get();
      const price = unit || (d ? d.price : 0);
      const ex = items.find(i => i.id === id && i.opt === opt);
      if (ex) ex.qty += qty; else items.push({ id, qty, opt, unit: price });
      Cart.set(items);
    },
    count() { return Cart.get().reduce((s, i) => s + i.qty, 0); },
    subtotal() { return Cart.get().reduce((s, i) => s + i.qty * i.unit, 0); }
  };
  function updateBadge() { $$('[data-cart]').forEach(b => { const c = Cart.count(); b.textContent = c; b.dataset.count = c; }); }

  /* ---------- Header/Footer — shared global.css + layout.css ----------
     Class names follow the team's published example (site-header, site-nav,
     site-footer). Desktop-only additions retain the PC Figma composition.
     Cart icon URL: ../assets/template-20261120T115451Z-1-001 - Copy/template/bộ icon/giohang.svg. */
  const NAV = [
    ['Trang chủ','trang_chu.html'],
    ['Thực đơn','thuc_don.html'],
    ['Tra cứu đơn','tra_cuu.html'],
    ['Đặt bàn','dat_ban.html'],
    ['Về chúng tôi','gioi_thieu.html'],
    ['Bộ sưu tập','bo_suu_tap.html'],
    ['Tuyển dụng','tuyen_dung.html'],
    ['Blog','blog.html'],
    ['Liên hệ','lien_he.html'],
    ['Ưu đãi','khuyen_mai.html']
  ];
  const assetIcon = (name) => name === 'giohang'
    ? `<img src="${CART_ICON_URL}" alt="" aria-hidden="true">`
    : icon(name);
  function navLink(label, href, current) {
    if (!href) return `<span class="site-nav__link" aria-disabled="true" title="Đang phát triển">${label}</span>`;
    const active = href.split('#')[0] === current && !href.includes('#');
    return `<a class="site-nav__link" href="${href}" ${active ? 'aria-current="page"':''}>${label}</a>`;
  }
  function brand(light = false) {
    return `<a class="brand" href="trang_chu.html" aria-label="Fiabesco Palace – Trang chủ">
      <img class="brand__logo" src="../assets/template-20261120T115451Z-1-001 - Copy/template/Logo (remove backround).png" alt="Logo Fiabesco Palace">
      <span class="brand__text"><span class="brand__name">FiabescoPalace</span>
      <span class="brand__tagline">Italy on Every Plate</span></span></a>`;
  }
  function renderHeader(el) {
    const current = location.pathname.split('/').pop() || 'trang_chu.html';
    el.className = 'site-header pc-header';
    el.innerHTML = `
      <div class="pc-topbar" aria-label="Thông tin nhà hàng">
        <div class="container pc-topbar__inner">
          <div class="pc-topbar__group"><span>Giao hàng 10:00 – 22:00 mỗi ngày</span>
            <a href="tel:0123456789">Hotline: 0123 456 789</a></div>
          <div class="pc-topbar__group"><a href="tra_cuu.html">Tra cứu đơn</a>
            <a href="khuyen_mai.html">Khuyến mãi</a><span lang="vi">VI</span></div>
        </div>
      </div>
      <div class="container site-header__inner">
        ${brand()}
        <nav class="site-nav" id="site-nav" aria-label="Điều hướng chính" aria-hidden="false">
          <div class="site-nav__head">
            <span class="site-nav__label">MENU</span>
            <button class="site-nav__close" type="button" aria-label="Đóng menu">✕</button>
          </div>
          <ul class="site-nav__list">${NAV.map(([name,href])=>`<li>${navLink(name,href,current)}</li>`).join('')}</ul>
          <div class="site-nav__contact">
            ${brand()}
            <div><p class="site-nav__hotline-label">HOTLINE</p><a class="site-nav__hotline" href="tel:0123456789">0123 456 789</a></div>
            <div class="social-dots"><a href="lien_he.html" aria-label="Facebook">${icon('social-facebook')}</a>
              <a href="lien_he.html" aria-label="Instagram">${icon('social-instagram')}</a>
              <a href="lien_he.html" aria-label="YouTube">${icon('social-youtube')}</a></div>
          </div>
        </nav>
        <div class="header-actions">
          <a class="header-action pc-search" href="thuc_don.html#tim-kiem" aria-label="Tìm món">
            ${assetIcon('search')}</a>
          <a class="header-action pc-cart" href="gio_hang.html" aria-label="Giỏ hàng">
            ${assetIcon('giohang')}<span class="cart-badge" data-cart>0</span></a>
          <button class="header-action pc-account" type="button" aria-label="Tài khoản" data-account-info>
            ${assetIcon('user')}</button>
          <a class="pc-book btn btn--navy" href="dat_ban.html">Đặt bàn</a>
          <button class="header-action nav-toggle" type="button" aria-controls="site-nav"
             aria-expanded="false" aria-label="Mở menu">
            <span class="pc-hamburger" aria-hidden="true"><i></i><i></i><i></i></span>
          </button>
        </div>
      </div>`;
    // The overlay must be OUTSIDE <header>, otherwise header z-index creates
    // a stacking context preventing the overlay from covering the page.
    const overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    overlay.setAttribute('data-close-nav','');
    overlay.setAttribute('aria-hidden','true');
    el.insertAdjacentElement('afterend',overlay);
    const nav = $('.site-nav',el);
    const toggle = $('.nav-toggle',el);
    const close = () => {
      nav.classList.remove('is-open'); overlay.classList.remove('is-open');
      toggle.setAttribute('aria-expanded','false');
      document.body.classList.remove('no-scroll');
      if (window.matchMedia('(max-width: 767px)').matches) nav.setAttribute('inert','');
    };
    const open = () => {
      nav.removeAttribute('inert');
      nav.classList.add('is-open'); overlay.classList.add('is-open');
      toggle.setAttribute('aria-expanded','true');
      document.body.classList.add('no-scroll');
      $('.site-nav__close',el)?.focus();
    };
    const syncViewport = () => {
      if (window.matchMedia('(max-width: 767px)').matches) {if (!nav.classList.contains('is-open')) nav.setAttribute('inert','');}
      else { nav.removeAttribute('inert'); close(); }
    };
    toggle.addEventListener('click',()=>nav.classList.contains('is-open') ? close() : open());
    $('.site-nav__close',el).addEventListener('click',()=>{close();toggle.focus();});
    overlay.addEventListener('click',()=>{close();toggle.focus();});
    nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',close));
    document.addEventListener('keydown',e=>{if(e.key==='Escape' && nav.classList.contains('is-open')){close();toggle.focus();}});
    window.addEventListener('resize',syncViewport);
    syncViewport();
    // Tài khoản: popup Đăng nhập/Đăng ký & menu tài khoản do popups.js xử lý (Luồng 1)
  }

  function renderFooter(el) {
    el.className = 'site-footer fiabesco-footer';
    el.innerHTML = `<div class="site-footer__inner">
      <form class="newsletter" novalidate>
        <div class="stack" style="gap:6px"><span class="newsletter__kicker">BUON APPETITO</span>
          <h3>Nhận thực đơn mới &amp; ưu đãi thành viên mỗi tháng</h3>
          <span class="newsletter__msg" aria-live="polite"></span></div>
        <div class="newsletter__form"><input class="newsletter__input" type="email"
          placeholder="Email của bạn" aria-label="Email" required>
          <button class="btn btn--gold" type="submit">Đăng ký</button></div>
      </form>
      <div class="footer-top">
        <a class="footer-brand" href="trang_chu.html" aria-label="Fiabesco Palace – Trang chủ">
          <span class="footer-brand__badge"><img src="../assets/template-20261120T115451Z-1-001 - Copy/template/Logo (remove backround).png" alt="Logo Fiabesco Palace"><span class="footer-brand__fallback" aria-hidden="true">FP</span></span>
          <span><span class="footer-brand__name">FiabescoPalace</span><br>
            <span class="footer-brand__tagline">Italy on Every Plate</span></span>
        </a>
        <div class="footer-company"><p class="footer-company__name">Công ty TNHH Fiabesco</p>
          <p class="footer-company__est">Est. 2014 · Ẩm thực Ý tại Sài Gòn</p></div>
      </div>
      <section class="footer-col"><h2 class="footer-col__title">Giới thiệu</h2>
        <ul class="footer-links"><li><a href="trang_chu.html">Trang chủ</a></li>
          <li><a href="gioi_thieu.html">Về chúng tôi</a></li>
          <li><a href="thuong_hieu.html">Câu chuyện thương hiệu</a></li>
          <li><a href="thuc_don.html">Thực đơn</a></li>
          <li><a href="bo_suu_tap.html">Bộ sưu tập</a></li>
          <li><a href="mon_yeu_thich.html">Món yêu thích</a></li>
          <li><a href="khuyen_mai.html">Ưu đãi</a></li></ul></section>
      <section class="footer-col"><h2 class="footer-col__title">Chính sách</h2>
        <ul class="footer-links"><li><span>Chính sách khách hàng (đang cập nhật)</span></li>
          <li><span>Chính sách đổi trả (đang cập nhật)</span></li>
          <li><span>Bảo mật thông tin (đang cập nhật)</span></li>
          <li><span>Điều khoản sử dụng (đang cập nhật)</span></li></ul></section>
      <section class="footer-col"><h2 class="footer-col__title">Liên hệ</h2>
        <ul class="footer-social"><li><a href="lien_he.html" aria-label="Facebook">${icon('social-facebook')}</a></li>
          <li><a href="lien_he.html" aria-label="Instagram">${icon('social-instagram')}</a></li>
          <li><a href="lien_he.html" aria-label="YouTube">${icon('social-youtube')}</a></li></ul>
        <a class="footer-hotline" href="tel:0123456789">Hotline: 0123 456 789</a>
        <p><a href="lien_he.html">Xem chi nhánh &amp; gửi liên hệ</a></p>
      </section>
      <div class="footer-bottom"><p class="footer-copy">© 2026 Fiabesco Palace · Est. 2014</p>
        <p class="footer-copy">MoMo · ZaloPay · VISA · Mastercard · Tiền mặt</p></div>
    </div>`;
    // Nếu GitHub chưa có đúng Logo (remove backround).png, không hiện biểu tượng ảnh lỗi.
    // Khi file có mặt, logo thật được giữ nguyên theo Figma.
    const footerLogo = $('.footer-brand__badge img', el);
    const logoFallback = () => footerLogo.closest('.footer-brand__badge').classList.add('is-missing-logo');
    footerLogo.addEventListener('error', logoFallback);
    if (footerLogo.complete && !footerLogo.naturalWidth) logoFallback();
    const form = $('.newsletter',el), msg = $('.newsletter__msg',el);
    form.addEventListener('submit',e=>{
      e.preventDefault();const v=$('input',form).value.trim();
      msg.textContent=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
        ? 'Cảm ơn bạn! Đây là bản demo, email chưa được gửi.' : 'Vui lòng nhập email hợp lệ.';
    });
  }

  /* ---------- Dish card ---------- */
  function dishCard(d, opts = {}) {
    const tag = opts.tag !== undefined ? opts.tag : d.tag;
    return `<article class="dish reveal" data-id="${d.id}">
      <a class="dish__media" href="chi_tiet_mon.html?id=${d.id}"><img src="${d.img}" alt="${d.name}" loading="lazy">
        ${tag ? `<span class="dish__tag">${tag}</span>` : ''}</a>
      <button class="dish__fav" aria-label="Yêu thích" aria-pressed="false">${icon('heart')}</button>
      <div class="dish__body"><a class="dish__name" href="chi_tiet_mon.html?id=${d.id}">${d.name}</a>
        <p class="dish__desc">${opts.desc || d.desc}</p>
        <div class="dish__foot"><span class="dish__price">${money(d.price)}</span>
          <button class="dish__add" aria-label="Thêm vào giỏ">${icon('plus')}</button></div></div></article>`;
  }
  document.addEventListener('click', e => {
    const add = e.target.closest('.dish__add');
    if (add) { const id = add.closest('.dish').dataset.id; Cart.add(id); }
  });

  /* ---------- Modal ---------- */
  function openModal(id) { const m = document.getElementById(id); if (m) { m.classList.add('is-open'); document.body.style.overflow = 'hidden'; } }
  function closeModal(m) { if (typeof m === 'string') m = document.getElementById(m); if (!m) return; m.classList.remove('is-open'); if (!$('.modal.is-open')) document.body.style.overflow = ''; }
  document.addEventListener('click', e => {
    const op = e.target.closest('[data-open]'); if (op) { e.preventDefault(); openModal(op.dataset.open); }
    const cl = e.target.closest('[data-close]'); if (cl) { e.preventDefault(); closeModal(cl.closest('.modal')); }
    if (e.target.classList && e.target.classList.contains('modal')) closeModal(e.target);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') $$('.modal.is-open').forEach(closeModal); });
  function modal({ id, icon: ic = 'reservation/icons/alert-triangle', tone = 'navy', title, desc, extra = '', actions = [] }) {
    const old = document.getElementById(id); if (old) old.remove();
    const el = document.createElement('div'); el.className = 'modal'; el.id = id; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
    el.innerHTML = `<div class="modal__box"><div class="modal__icon${tone !== 'navy' ? ' modal__icon--' + tone : ''}">${icon(ic)}</div>
      <h3 class="t-h3">${title}</h3><p class="t-body c-gray">${desc}</p>${extra}
      <div class="modal__actions">${actions.map(a => a.href ? `<a class="btn btn--${a.style}" href="${a.href}">${a.label}</a>` : `<button class="btn btn--${a.style}" ${a.attr || 'data-close'}>${a.label}</button>`).join('')}</div></div>`;
    document.body.appendChild(el); return el;
  }

  /* ---------- Toast ---------- */
  let toastEl, toastT;
  function toast(title, text, btnLabel, href, tone) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.className = 'toast' + (tone === 'navy' ? ' toast--navy' : '');
    toastEl.innerHTML = `${icon(tone === 'navy' ? 'check' : 'errors/icons/wifi-off')}<div class="toast__text"><strong style="font:600 16px/1.4 var(--f-sans)">${title}</strong><span class="t-body-s" style="opacity:.85">${text}</span></div>
      ${btnLabel ? `<a class="toast__btn" href="${href || '#'}">${tone === 'navy' ? '' : icon('refresh')}${btnLabel}</a>` : ''}`;
    requestAnimationFrame(() => toastEl.classList.add('is-show'));
    clearTimeout(toastT); if (tone === 'navy') toastT = setTimeout(() => toastEl.classList.remove('is-show'), 3200);
    return toastEl;
  }

  /* ---------- E02: Mất kết nối mạng ---------- */
  function offline() {
    const t = toast('Mất kết nối mạng', 'Đang thử kết nối lại… Món trong giỏ vẫn được lưu trên thiết bị.', 'Thử lại', '#');
    t.querySelector('.toast__btn').addEventListener('click', e => { e.preventDefault(); if (navigator.onLine) t.classList.remove('is-show'); });
  }
  window.addEventListener('offline', offline);
  window.addEventListener('online', () => toastEl && toastEl.classList.remove('is-show'));

  /* ---------- Reveal ---------- */
  let io;
  function initReveal(root = document) {
    const els = $$('.reveal:not(.is-in)', root);
    if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('is-in')); return; }
    io = io || new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -6% 0px' });
    els.forEach(e => io.observe(e));
  }

  /* ---------- Phone validation (dùng chung) ---------- */
  const normPhone = v => { let d = String(v).replace(/[^\d+]/g, ''); if (d.startsWith('+84')) d = '0' + d.slice(3); return d.replace(/\D/g, ''); };
  const isPhone = v => /^0\d{9}$/.test(normPhone(v));

  /* ---------- Demo states (trạng thái cần máy chủ thật) ---------- */
  const params = new URLSearchParams(location.search);
  const demo = params.get('demo');

  document.addEventListener('DOMContentLoaded', () => {
    $$('[data-header]').forEach(renderHeader);
    $$('[data-footer]').forEach(renderFooter);
    hydrateIcons();
    updateBadge();
    if (demo === 'offline') offline();
    if (demo === 'session-expired') {
      modal({ id: 'm-session', icon: 'lock', title: 'Phiên đăng nhập đã hết hạn',
        desc: 'Vì lý do bảo mật, bạn đã được đăng xuất sau 30 phút không hoạt động. Đăng nhập lại để tiếp tục — giỏ hàng của bạn vẫn được giữ nguyên.',
        actions: [{ label: 'Để sau', style: 'outline' }, { label: 'Đăng nhập lại', style: 'navy', attr: 'data-close data-pp="login"' }] });
      openModal('m-session');
    }
    document.dispatchEvent(new Event('fb:ready'));
    hydrateIcons();
    requestAnimationFrame(() => initReveal());
  });

  window.FB = { $, $$, icon, hydrateIcons, vnd, money, Cart, dishCard, modal, openModal, closeModal, toast, params, demo, initReveal, normPhone, isPhone };
})();
