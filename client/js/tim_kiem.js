/* =====================================================================
   FIABESCO PALACE — js/tim_kiem.js · Tìm kiếm chung (A7) + SearchModal trên Header (mục 7)
   - MỘT bộ xử lý tìm kiếm duy nhất (FB.Search.attach) dùng cho:
       • thanh tìm kiếm dưới Header ở Trang chủ (form#gsearch)
       • popup tìm kiếm mở từ icon kính lúp trên Header ở mọi trang (FB.openSearch)
   - Dữ liệu lấy trực tiếp từ FB_DATA (món, combo, mã ưu đãi) + FB_BLOG (nếu trang có nạp)
     + danh sách TRANG ĐANG TỒN TẠI trong client/pages. Không tạo dữ liệu món riêng.
   - Tìm có dấu / không dấu; chọn bằng chuột hoặc bàn phím (↑ ↓ Enter Esc).
   - "Tìm kiếm gần đây" lưu localStorage (chung khóa với gợi ý ở Thực đơn), bỏ qua chuỗi giống
     số điện thoại / email / số dài để không lưu thông tin cá nhân.
   ===================================================================== */
(function () {
  if (!window.FB) return;
  const { $, $$, icon: I, money } = FB;
  const RECENT_KEY = 'fb_recent_v1', MAX_RECENT = 6;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/\s+/g, ' ').trim();

  /* ---------- Chỉ mục (dựng 1 lần, khi cần) ---------- */
  const PAGES = [
    ['Thực đơn', 'thuc_don.html', 'menu-list', 'Xem toàn bộ món ăn & combo', 'thuc don menu mon an goi mon dat mon'],
    ['Khuyến mãi & Ưu đãi', 'khuyen_mai.html', 'coupon-tag', 'Mã giảm giá, freeship, ưu đãi tháng', 'khuyen mai uu dai giam gia voucher ma giam freeship promotion'],
    ['Giỏ hàng', 'gio_hang.html', 'shopping-cart', 'Xem các món đã chọn', 'gio hang cart thanh toan'],
    ['Liên hệ', 'lien_he.html', 'phone', 'Hotline, chi nhánh & gửi liên hệ', 'lien he hotline dien thoai dia chi chi nhanh contact ban do'],
    ['Đặt bàn', 'dat_ban.html', 'calendar', 'Chọn bàn, giờ và gói trang trí', 'dat ban giu cho booking table sinh nhat cau hon'],
    ['Theo dõi đơn hàng', 'theo_doi_don_hang.html', 'receipt', 'Xem trạng thái đơn giao hàng', 'theo doi don hang don hang giao hang tracking'],
    ['Tra cứu đặt bàn & đơn giao', 'tra_cuu.html', 'search', 'Tra cứu lượt đặt bàn và đơn giao của bạn', 'tra cuu don dat ban lich su'],
    ['Về chúng tôi', 'gioi_thieu.html', 'chef-hat', 'Giới thiệu nhà hàng Fiabesco Palace', 've chung toi gioi thieu nha hang about'],
    ['Câu chuyện thương hiệu', 'thuong_hieu.html', 'sparkle', 'Hành trình Fiabesco Palace', 'thuong hieu cau chuyen brand'],
    ['Bộ sưu tập', 'bo_suu_tap.html', 'grid', 'Hình ảnh không gian & món ăn', 'bo suu tap hinh anh khong gian gallery'],
    ['Tuyển dụng', 'tuyen_dung.html', 'users', 'Vị trí đang tuyển', 'tuyen dung viec lam career'],
    ['Blog & Cảm hứng Ý', 'blog.html', 'leaf', 'Câu chuyện ẩm thực, tin tức, mẹo', 'blog bai viet tin tuc meo cau chuyen'],
    ['Món yêu thích', 'mon_yeu_thich.html', 'heart', 'Các món bạn đã lưu', 'mon yeu thich favorite'],
    ['Thành viên', 'thanh_vien.html#ho-so', 'user', 'Hồ sơ, điểm thưởng, hạng thành viên', 'thanh vien tai khoan diem thuong tich diem dang nhap dang ky member']
  ];
  const TYPE_LABEL = { page: 'Trang', dish: 'Món ăn', combo: 'Combo', coupon: 'Mã ưu đãi', post: 'Bài viết' };
  const FOR_YOU = ['Pizza Margherita', 'Carbonara', 'Combo Gia Đình', 'Ưu đãi', 'Đặt bàn', 'Risotto'];
  let INDEX = null;
  function index() {
    if (INDEX) return INDEX;
    const D = window.FB_DATA || { dishes: [], combos: [], categories: [], coupons: {} };
    const catName = id => ((D.categories || []).find(c => c.id === id) || {}).name || '';
    INDEX = [
      ...PAGES.map(([title, href, ic, sub, kw]) => ({ type: 'page', title, href, ic, sub, kw })),
      ...(D.dishes || []).map(d => ({ type: 'dish', title: d.name, href: `chi_tiet_mon.html?id=${encodeURIComponent(d.id)}`, img: d.img, sub: catName(d.cat), price: d.price, kw: `${d.short || ''} ${d.desc} ${catName(d.cat)} mon an` })),
      ...(D.combos || []).map(c => ({ type: 'combo', title: c.name, href: 'thuc_don.html#combo-block', img: c.img, sub: 'Combo · ' + c.desc, price: c.price, kw: 'combo ' + c.desc })),
      ...Object.entries(D.coupons || {}).filter(([, c]) => c && !c.expired && c.label).map(([code, c]) => ({ type: 'coupon', title: code, href: 'khuyen_mai.html', ic: 'coupon-tag', sub: c.label, kw: 'ma giam gia uu dai khuyen mai ' + c.label })),
      ...(window.FB_BLOG || []).map(p => ({ type: 'post', title: p.title, href: `blog_chi_tiet.html?id=${encodeURIComponent(p.id)}`, img: p.img, sub: 'Blog · ' + p.tag, kw: `blog bai viet ${p.sub} ${p.tag}` }))
    ].map(x => ({ ...x, nt: norm(x.title), nk: norm(x.kw + ' ' + x.sub) }));
    return INDEX;
  }
  function search(q) {
    const nq = norm(q); if (!nq) return [];
    const toks = nq.split(' ');
    return index().map(x => {
      const hay = x.nt + ' ' + x.nk;
      if (!toks.every(t => hay.includes(t))) return null;
      let s = 0;
      if (x.nt === nq) s += 100; else if (x.nt.startsWith(nq)) s += 60; else if (x.nt.includes(nq)) s += 40;
      if ((' ' + x.nk + ' ').includes(' ' + nq + ' ')) s += x.type === 'page' ? 55 : 20; // từ khóa trang trùng khớp → trang đứng đầu
      s += toks.filter(t => x.nt.includes(t)).length * 5;
      if (x.type === 'page') s += 3;
      return { ...x, score: s };
    }).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 8);
  }

  /* ---------- Lịch sử ---------- */
  const getRecent = () => { try { const v = JSON.parse(localStorage.getItem(RECENT_KEY)); return Array.isArray(v) ? v.filter(x => typeof x === 'string') : []; } catch (e) { return []; } };
  const setRecent = a => { try { localStorage.setItem(RECENT_KEY, JSON.stringify(a.slice(0, MAX_RECENT))); } catch (e) {} };
  const sensitive = v => /@/.test(v) || /\d{6,}/.test(v.replace(/[\s.-]/g, '')) || v.length > 40;
  const remember = v => { v = v.trim(); if (!v || sensitive(v)) return; setRecent([v, ...getRecent().filter(x => norm(x) !== norm(v))]); };

  /* =================================================================
     attach(form, opts) — gắn hành vi tìm kiếm cho 1 form chứa input + .gsearch__pop
     opts.always: popup gợi ý luôn hiển thị (dùng trong SearchModal)
     ================================================================= */
  let uid = 0;
  function attach(form, opts = {}) {
    const input = $('input', form), pop = $('.gsearch__pop', form); const id = 'gs' + (++uid);
    let results = [], active = -1;
    const hl = t => {
      const q = norm(input.value); if (!q) return esc(t);
      const i = norm(t).indexOf(q);
      return i < 0 || norm(t).length !== t.length ? esc(t) : esc(t.slice(0, i)) + '<mark>' + esc(t.slice(i, i + q.length)) + '</mark>' + esc(t.slice(i + q.length));
    };
    const optHTML = (x, i) => {
      const media = x.img ? `<img src="${x.img}" alt="" loading="lazy">` : `<span class="gs-ic">${I(x.ic || 'search')}</span>`;
      return `<a class="gs-hit" role="option" id="${id}-opt-${i}" aria-selected="false" href="${x.href}" data-i="${i}">${media}
        <span class="gs-hit__txt"><strong>${hl(x.title)}</strong><small>${esc(x.sub || '')}</small></span>
        ${x.price ? `<b class="gs-hit__price money">${money(x.price)}</b>` : `<span class="gs-hit__type">${TYPE_LABEL[x.type]}</span>`}</a>`;
    };
    function draw() {
      const q = input.value.trim();
      results = q ? search(q) : []; active = -1;
      const rec = getRecent();
      let html = '';
      if (!q) {
        html += rec.length ? `<div class="gs-row"><h4>Tìm kiếm gần đây</h4><button type="button" class="gs-clear" data-gs-clear>Xóa lịch sử</button></div>
          <ul class="gs-recent">${rec.map(r => `<li><button type="button" class="gs-recent__go" data-gs-q="${esc(r)}">${I('clock')}<span>${esc(r)}</span></button><button type="button" class="gs-recent__rm" data-gs-rm="${esc(r)}" aria-label="Xóa “${esc(r)}” khỏi lịch sử">${I('close')}</button></li>`).join('')}</ul>`
          : `<p class="gs-empty-hint">${I('clock')}Chưa có tìm kiếm gần đây.</p>`;
        html += `<h4>Gợi ý dành cho bạn</h4><div class="gs-chips">${FOR_YOU.map(t => `<button type="button" class="chip chip--sm" data-gs-q="${esc(t)}">${I('search')}${esc(t)}</button>`).join('')}</div>`;
      } else if (results.length) {
        html += `<div class="gs-row"><h4>${results.length > 1 ? `${results.length} kết quả phù hợp` : 'Kết quả phù hợp'}</h4><small class="gs-tip">↑ ↓ để chọn · Enter để mở</small></div>
          <div class="gs-list">${results.map(optHTML).join('')}</div>`;
      } else {
        html += `<div class="gs-none">${I('search')}<div><strong>Không tìm thấy kết quả cho “${esc(q)}”</strong><small>Thử từ khóa ngắn hơn, kiểm tra chính tả hoặc chọn một gợi ý bên dưới.</small></div></div>
          <div class="gs-chips">${FOR_YOU.map(t => `<button type="button" class="chip chip--sm" data-gs-q="${esc(t)}">${esc(t)}</button>`).join('')}</div>`;
      }
      pop.innerHTML = html; FB.hydrateIcons(pop);
      input.removeAttribute('aria-activedescendant');
    }
    const open = () => { draw(); pop.hidden = false; input.setAttribute('aria-expanded', 'true'); form.classList.add('is-open'); };
    const close = () => { if (opts.always) return; pop.hidden = true; input.setAttribute('aria-expanded', 'false'); form.classList.remove('is-open'); active = -1; };
    const setActive = i => {
      const o = $$('[role="option"]', pop); if (!o.length) return;
      active = (i + o.length) % o.length;
      o.forEach((x, k) => { x.classList.toggle('is-active', k === active); x.setAttribute('aria-selected', k === active); });
      input.setAttribute('aria-activedescendant', o[active].id); o[active].scrollIntoView({ block: 'nearest' });
    };
    const goTo = x => { remember(input.value.trim() || x.title); location.href = x.href; };

    input.setAttribute('role', 'combobox'); input.setAttribute('aria-autocomplete', 'list'); input.setAttribute('aria-controls', pop.id || (pop.id = id + '-pop'));
    input.addEventListener('focus', open);
    input.addEventListener('input', open);
    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); if (pop.hidden) open(); setActive(active + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
      else if (e.key === 'Escape' && !opts.always) { if (!pop.hidden) { e.preventDefault(); close(); } }
    });
    form.addEventListener('submit', e => {
      e.preventDefault();
      const q = input.value.trim(); if (!q) { input.focus(); open(); return; }
      if (pop.hidden) open();
      if (active > -1 && results[active]) return goTo(results[active]);
      if (!results.length) { draw(); return; }
      const exact = results.filter(x => x.nt === norm(q) || (x.type === 'page' && (' ' + x.nk + ' ').includes(' ' + norm(q) + ' ')));
      if (results.length === 1 || exact.length === 1) return goTo(exact[0] || results[0]);
      remember(q); setActive(0); // nhiều kết quả: giữ danh sách để người dùng chọn
    });
    pop.addEventListener('mousedown', e => { if (!e.target.closest('a')) e.preventDefault(); }); // giữ focus ở ô nhập
    pop.addEventListener('click', e => {
      const rm = e.target.closest('[data-gs-rm]'); if (rm) { setRecent(getRecent().filter(x => x !== rm.dataset.gsRm)); draw(); input.focus(); return; }
      if (e.target.closest('[data-gs-clear]')) { setRecent([]); draw(); input.focus(); return; }
      const q = e.target.closest('[data-gs-q]'); if (q) { input.value = q.dataset.gsQ; open(); input.focus(); return; }
      const hit = e.target.closest('.gs-hit'); if (hit) remember(input.value.trim() || results[+hit.dataset.i].title);
    });
    pop.addEventListener('mousemove', e => { const o = e.target.closest('[role="option"]'); if (o && +o.dataset.i !== active) setActive(+o.dataset.i); });
    if (!opts.always) {
      document.addEventListener('click', e => { if (!form.contains(e.target)) close(); });
      document.addEventListener('focusin', e => { if (!form.contains(e.target)) close(); });
    }
    return { open, close, draw, input };
  }

  /* =================================================================
     SearchModal — mở từ icon tìm kiếm trên Header (mọi trang)
     ================================================================= */
  let modal = null, ctl = null, opener = null;
  function openSearch() {
    opener = document.activeElement;
    if (!modal) {
      modal = document.createElement('div'); modal.className = 'modal gs-modal'; modal.id = 'search-modal';
      modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.setAttribute('aria-label', 'Tìm kiếm trên website');
      modal.innerHTML = `<div class="gs-modal__box">
        <div class="gs-modal__head"><span class="gs-modal__title">${I('search')}Tìm kiếm</span><button type="button" class="pp-x" data-close aria-label="Đóng tìm kiếm">${I('close')}</button></div>
        <form class="gsearch__form gs-modal__form" role="search" autocomplete="off" novalidate>
          ${I('search')}<input type="search" name="q" placeholder="Bạn đang tìm món ăn, ưu đãi hay thông tin gì?" aria-label="Tìm món ăn, ưu đãi hoặc thông tin" maxlength="80">
          <button class="gsearch__btn" type="submit">Tìm kiếm</button>
          <div class="gsearch__pop gs-modal__pop" role="listbox" aria-label="Gợi ý tìm kiếm"></div>
        </form></div>`;
      document.body.appendChild(modal); FB.hydrateIcons(modal);
      ctl = attach($('form', modal), { always: true });
      // Trả focus về icon tìm kiếm khi đóng (vị trí cuộn được giữ nguyên vì nền chỉ bị khóa cuộn, không cuộn lại)
      new MutationObserver(() => { if (!modal.classList.contains('is-open') && opener && document.contains(opener)) opener.focus({ preventScroll: true }); })
        .observe(modal, { attributes: true, attributeFilter: ['class'] });
    }
    ctl.input.value = ''; ctl.draw();
    FB.openModal('search-modal');
    setTimeout(() => ctl.input.focus({ preventScroll: true }), 30);
  }
  // Icon kính lúp trên Header: mở popup thay vì chuyển sang Thực đơn
  document.addEventListener('click', e => {
    const s = e.target.closest('.pc-header .pc-search'); if (!s) return;
    e.preventDefault(); openSearch();
  }, true);

  FB.Search = { attach, search, open: openSearch };
  FB.openSearch = openSearch;

  /* Thanh tìm kiếm ở Trang chủ */
  document.addEventListener('fb:ready', () => { const f = document.getElementById('gsearch'); if (f) attach(f); });
})();
