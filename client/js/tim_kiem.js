/* =====================================================================
   FIABESCO PALACE — js/tim_kiem.js (MỚI) · A7 Thanh tìm kiếm chung
   - Dữ liệu lấy trực tiếp từ FB_DATA (món, combo, mã ưu đãi) + FB_BLOG (nếu có)
     + danh sách TRANG ĐANG TỒN TẠI trong client/pages. Không tạo dữ liệu món riêng.
   - Tìm có dấu / không dấu; chọn bằng chuột hoặc bàn phím (↑ ↓ Enter Esc).
   - "Tìm kiếm gần đây" lưu localStorage (dùng chung khóa với gợi ý ở Thực đơn),
     bỏ qua chuỗi giống số điện thoại / email / số dài để không lưu thông tin cá nhân.
   Dùng: <form id="gsearch"> chứa input#gsearch-input và .gsearch__pop.
   ===================================================================== */
document.addEventListener('fb:ready', () => {
  const form = document.getElementById('gsearch'); if (!form || !window.FB) return;
  const { $, $$, icon: I, money } = FB;
  const D = window.FB_DATA || { dishes: [], combos: [], categories: [], coupons: {} };
  const input = $('#gsearch-input', form), pop = $('.gsearch__pop', form);
  const RECENT_KEY = 'fb_recent_v1', MAX_RECENT = 6;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/\s+/g, ' ').trim();

  /* ---------- Chỉ mục ---------- */
  // Trang: chỉ những file có thật trong client/pages
  const PAGES = [
    ['Thực đơn', 'thuc_don.html', 'menu-list', 'Xem toàn bộ món ăn & combo', 'thuc don menu mon an goi mon dat mon'],
    ['Khuyến mãi & Ưu đãi', 'khuyen_mai.html', 'coupon-tag', 'Mã giảm giá, freeship, ưu đãi tháng', 'khuyen mai uu dai giam gia voucher ma giam freeship promotion'],
    ['Giỏ hàng', 'gio_hang.html', 'shopping-cart', 'Xem các món đã chọn', 'gio hang cart thanh toan'],
    ['Liên hệ', 'lien_he.html', 'phone', 'Hotline, chi nhánh & gửi liên hệ', 'lien he hotline dien thoai dia chi chi nhanh contact ban do'],
    ['Đặt bàn', 'dat_ban.html', 'calendar', 'Chọn bàn, giờ và gói trang trí', 'dat ban giu cho booking table sinh nhat cau hon'],
    ['Tra cứu / Theo dõi đơn hàng', 'theo_doi_don_hang.html', 'receipt', 'Xem trạng thái đơn giao hàng', 'tra cuu don theo doi don hang don hang giao hang tracking'],
    ['Về chúng tôi', 'gioi_thieu.html', 'chef-hat', 'Giới thiệu nhà hàng Fiabesco Palace', 've chung toi gioi thieu nha hang about'],
    ['Câu chuyện thương hiệu', 'thuong_hieu.html', 'sparkle', 'Hành trình Fiabesco Palace', 'thuong hieu cau chuyen brand'],
    ['Bộ sưu tập', 'bo_suu_tap.html', 'grid', 'Hình ảnh không gian & món ăn', 'bo suu tap hinh anh khong gian gallery'],
    ['Tuyển dụng', 'tuyen_dung.html', 'users', 'Vị trí đang tuyển', 'tuyen dung viec lam career'],
    ['Blog & Cảm hứng Ý', 'blog.html', 'leaf', 'Câu chuyện ẩm thực, tin tức, mẹo', 'blog bai viet tin tuc meo cau chuyen'],
    ['Món yêu thích', 'mon_yeu_thich.html', 'heart', 'Các món bạn đã lưu', 'mon yeu thich favorite'],
    ['Thành viên', 'thanh_vien.html#ho-so', 'user', 'Hồ sơ, điểm thưởng, hạng thành viên', 'thanh vien tai khoan diem thuong tich diem dang nhap dang ky member']
  ].map(([title, href, ic, sub, kw]) => ({ type: 'page', title, href, ic, sub, kw }));
  const catName = id => ((D.categories || []).find(c => c.id === id) || {}).name || '';
  const DISHES = (D.dishes || []).map(d => ({ type: 'dish', title: d.name, href: `chi_tiet_mon.html?id=${encodeURIComponent(d.id)}`, img: d.img, sub: catName(d.cat), price: d.price, kw: `${d.short || ''} ${d.desc} ${catName(d.cat)} mon an` }));
  const COMBOS = (D.combos || []).map(c => ({ type: 'combo', title: c.name, href: 'thuc_don.html#combo-block', img: c.img, sub: 'Combo · ' + c.desc, price: c.price, kw: 'combo ' + c.desc }));
  const COUPONS = Object.entries(D.coupons || {}).filter(([, c]) => c && !c.expired && c.label).map(([code, c]) => ({ type: 'coupon', title: code, href: 'khuyen_mai.html', ic: 'coupon-tag', sub: c.label, kw: 'ma giam gia uu dai khuyen mai ' + c.label }));
  const POSTS = (window.FB_BLOG || []).map(p => ({ type: 'post', title: p.title, href: `blog_chi_tiet.html?id=${encodeURIComponent(p.id)}`, img: p.img, sub: 'Blog · ' + p.tag, kw: `blog bai viet ${p.sub} ${p.tag}` }));
  const INDEX = [...PAGES, ...DISHES, ...COMBOS, ...COUPONS, ...POSTS].map(x => ({ ...x, nt: norm(x.title), nk: norm(x.kw + ' ' + x.sub) }));
  const TYPE_LABEL = { page: 'Trang', dish: 'Món ăn', combo: 'Combo', coupon: 'Mã ưu đãi', post: 'Bài viết' };

  function search(q) {
    const nq = norm(q); if (!nq) return [];
    const toks = nq.split(' ');
    return INDEX.map(x => {
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

  const FOR_YOU = ['Pizza Margherita', 'Carbonara', 'Combo Gia Đình', 'Ưu đãi', 'Đặt bàn', 'Risotto'];

  /* ---------- Vẽ popup ---------- */
  let results = [], active = -1;
  const optHTML = (x, i) => {
    const media = x.img ? `<img src="${x.img}" alt="" loading="lazy">` : `<span class="gs-ic">${I(x.ic || 'search')}</span>`;
    return `<a class="gs-hit" role="option" id="gs-opt-${i}" aria-selected="false" href="${x.href}" data-i="${i}">${media}
      <span class="gs-hit__txt"><strong>${hl(x.title)}</strong><small>${esc(x.sub || '')}</small></span>
      ${x.price ? `<b class="gs-hit__price money">${money(x.price)}</b>` : `<span class="gs-hit__type">${TYPE_LABEL[x.type]}</span>`}</a>`;
  };
  function hl(t) {
    const q = norm(input.value); if (!q) return esc(t);
    const i = norm(t).indexOf(q); // chuẩn hóa NFD giữ nguyên độ dài ký tự gốc với chữ Việt dựng sẵn → cắt theo chỉ số gốc
    return i < 0 || norm(t).length !== t.length ? esc(t) : esc(t.slice(0, i)) + '<mark>' + esc(t.slice(i, i + q.length)) + '</mark>' + esc(t.slice(i + q.length));
  }
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
  const close = () => { pop.hidden = true; input.setAttribute('aria-expanded', 'false'); form.classList.remove('is-open'); active = -1; };
  const setActive = i => {
    const opts = $$('[role="option"]', pop); if (!opts.length) return;
    active = (i + opts.length) % opts.length;
    opts.forEach((o, k) => { o.classList.toggle('is-active', k === active); o.setAttribute('aria-selected', k === active); });
    input.setAttribute('aria-activedescendant', opts[active].id); opts[active].scrollIntoView({ block: 'nearest' });
  };
  const goTo = x => { remember(input.value.trim() || x.title); location.href = x.href; };

  input.addEventListener('focus', open);
  input.addEventListener('input', open);
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); if (pop.hidden) open(); setActive(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
    else if (e.key === 'Escape') { if (!pop.hidden) { e.preventDefault(); close(); } }
  });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const q = input.value.trim(); if (!q) { input.focus(); open(); return; }
    if (pop.hidden) open();
    if (active > -1 && results[active]) return goTo(results[active]);
    if (!results.length) { draw(); return; }
    const exact = results.filter(x => x.nt === norm(q) || (x.type === 'page' && (' ' + x.nk + ' ').includes(' ' + norm(q) + ' ')));
    if (results.length === 1 || exact.length === 1) return goTo(exact[0] || results[0]);
    // Nhiều kết quả: giữ danh sách để người dùng chọn
    remember(q); setActive(0);
  });
  pop.addEventListener('mousedown', e => { if (!e.target.closest('a')) e.preventDefault(); }); // giữ focus ở ô nhập
  pop.addEventListener('click', e => {
    const rm = e.target.closest('[data-gs-rm]'); if (rm) { setRecent(getRecent().filter(x => x !== rm.dataset.gsRm)); draw(); input.focus(); return; }
    if (e.target.closest('[data-gs-clear]')) { setRecent([]); draw(); input.focus(); return; }
    const q = e.target.closest('[data-gs-q]'); if (q) { input.value = q.dataset.gsQ; open(); input.focus(); return; }
    const hit = e.target.closest('.gs-hit'); if (hit) remember(input.value.trim() || results[+hit.dataset.i].title);
  });
  pop.addEventListener('mousemove', e => { const o = e.target.closest('[role="option"]'); if (o && +o.dataset.i !== active) setActive(+o.dataset.i); });
  document.addEventListener('click', e => { if (!form.contains(e.target)) close(); });
  document.addEventListener('focusin', e => { if (!form.contains(e.target)) close(); });
});
