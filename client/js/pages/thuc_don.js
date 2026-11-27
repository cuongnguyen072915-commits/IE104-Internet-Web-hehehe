/* Thực đơn: danh mục, tìm kiếm (E05), bộ lọc, sắp xếp, ngoài giờ nhận đơn (E04)
   Lượt bổ sung:
   • 4 · "Lọc theo" mở popup BỘ LỌC MÓN ĂN — bộ lọc duy nhất của trang.
   • 5 · Khu "Combo hấp dẫn" dạng Featured Combo; giá gốc / mức tiết kiệm tính từ giá món thật trong combo.
   Thiết kế lại theo QR-M (bản cập nhật):
   • Bỏ khối bộ lọc cột trái ("Filtri") — popup "Lọc theo" là bộ lọc DUY NHẤT.
   • Danh mục là thanh ngang chỉ có chữ (#cats).
   • "Tất cả" hiển thị món theo từng danh mục (chương); chọn 1 danh mục → chỉ nhóm đó.
   • Chef's Signature dựng từ dữ liệu món; ảnh combo là slideshow các món thật trong combo. */
document.addEventListener('fb:ready', () => {
  const { $, $$, icon, dishCard, money, vnd } = FB;
  const D = FB_DATA;
  const state = { cat: 'all', q: '', price: null, veg: false, mild: false, ings: [], sort: 'pop', filtered: false };
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- Tiêu chí lọc (chỉ dựa trên dữ liệu món hiện có: giá, danh mục, veg, tên + mô tả) ---------- */
  const PRICES = [['0-99999', '< 100k'], ['100000-200000', '100–200k'], ['200001-9999999', '> 200k']];
  // Nguyên liệu: so khớp từ khóa có dấu trong tên + mô tả món (tránh nhầm "bò"/"bơ" khi bỏ dấu)
  const INGS = [
    ['hai-san', 'Hải sản', /hải sản|tôm|mực|nghêu|cua|vẹm|bạch tuộc|cá hồi|cá ngừ|sò điệp|cá chẽm/],
    ['bo', 'Thịt bò', /\bbò(?![a-zà-ỹ])|bít tết|carpaccio|tagliata/], // \b không nhận chữ có dấu → dùng lookahead
    ['ga', 'Thịt gà', /\bgà(?![a-zà-ỹ])/],
    ['heo', 'Thịt heo / xúc xích', /guanciale|prosciutto|pepperoni|salami|giăm bông|bacon|đùi heo|heo muối/],
    ['pho-mai', 'Phô mai', /phô mai|mozzarella|parmigiano|parmesan|pecorino|burrata|gorgonzola|ricotta|provola|fontina|mascarpone|feta/],
    ['nam', 'Nấm & truffle', /nấm|truffle|porcini/]
  ];
  const SPICY = /cay|ớt|diavola|calabria/;
  const text = d => (d.name + ' ' + d.desc).toLowerCase();
  const matchIng = (d, id) => { const g = INGS.find(x => x[0] === id); return g && g[2].test(text(d)); };
  const priceLabel = p => (PRICES.find(x => x[0] === p.join('-')) || [, ''])[1];

  function applyFilters(list, s = state) {
    if (s.cat !== 'all') list = list.filter(d => d.cat === s.cat);
    if (s.q) list = list.filter(d => norm(d.name + ' ' + d.desc).includes(norm(s.q)));
    if (s.filtered) {
      if (s.price) { const [a, b] = s.price; list = list.filter(d => d.price >= a && d.price <= b); }
      if (s.veg) list = list.filter(d => d.veg);
      if (s.mild) list = list.filter(d => !SPICY.test(text(d)));
      if (s.ings.length) list = list.filter(d => s.ings.some(id => matchIng(d, id)));
    }
    return list;
  }
  const activeCount = (s = state) => (s.filtered ? (s.price ? 1 : 0) + (s.veg ? 1 : 0) + (s.mild ? 1 : 0) + s.ings.length : 0) + (s.cat !== 'all' ? 1 : 0);
  function filterLabel() {
    if (!state.filtered) return '';
    const parts = [];
    if (state.price) parts.push(priceLabel(state.price));
    if (state.veg) parts.push('Thuần chay'); if (state.mild) parts.push('Không cay');
    state.ings.forEach(id => parts.push((INGS.find(x => x[0] === id) || [])[1]));
    return parts.filter(Boolean).join(', ');
  }

  $('#cats').innerHTML = D.categories.map(c => `<li class="${c.id === 'all' ? 'is-active' : ''}"><button type="button" data-cat="${c.id}" aria-pressed="${c.id === 'all'}">${c.id === 'all' ? 'Xem tất cả' : esc(c.name)}</button></li>`).join('');

  /* =================================================================
     CHEF'S SIGNATURE — theo khối "CHEF'S SIGNATURE" của QR-M; dữ liệu lấy từ món thật
     ================================================================= */
  const SIG_ID = 'risotto-tom-hum';
  const sig = D.byId(SIG_ID);
  const sigBox = $('#chef-sig');
  if (sig && sigBox) {
    const url = `chi_tiet_mon.html?id=${encodeURIComponent(sig.id)}`;
    sigBox.innerHTML = `
      <div class="qm-sig__txt">
        <span class="t-eyebrow c-goldl eyebrow-line">Chef’s Signature</span>
        <h2 class="qm-sig__title" id="sig-title"><a href="${url}">${esc(sig.name)}</a></h2>
        <p class="t-body-l qm-sig__desc">${esc(sig.desc)}</p>
        <div class="qm-sig__price-row"><span class="t-price-l c-goldl money">${money(sig.price)}</span>${sig.tag ? `<span class="pill pill--wine">${esc(sig.tag)}</span>` : ''}</div>
        <a class="btn btn--cream qm-sig__cta" href="${url}">Xem chi tiết ${icon('arrow-right')}</a>
      </div>
      <a class="qm-sig__art" href="${url}" tabindex="-1" aria-hidden="true">
        <span class="qm-ring qm-ring--a"></span><span class="qm-ring qm-ring--b"></span>
        <img src="${sig.img}" alt="" loading="lazy">
      </a>`;
  } else if (sigBox) sigBox.hidden = true;

  /* =================================================================
     5 · COMBO HẤP DẪN — Featured Combo + các combo còn lại
     ================================================================= */
  const C = FB.Custom;
  const comboInfo = c => {
    const info = (C && C.COMBO_INFO[c.id]) || { items: [], people: '' };
    const priced = info.items.every(m => m.id && D.byId(m.id));
    const original = priced && info.items.length ? info.items.reduce((s, m) => s + D.byId(m.id).price * m.qty, 0) : null; // giá gọi lẻ = tổng giá món thật
    const save = original && original > c.price ? original - c.price : 0;
    const count = info.items.reduce((s, m) => s + m.qty, 0);
    return { info, original, save, pct: save ? Math.round(save * 100 / original) : 0, count, people: (info.people || '').replace('Dành cho ', '').split(' · ')[0] };
  };
  /* Slideshow ảnh combo: CHỈ ảnh các món thật thuộc combo (theo thứ tự trong combo, bỏ trùng / món không có ảnh) */
  const comboSlides = (c, x) => {
    const seen = new Set(), out = [];
    x.info.items.forEach(m => { const d = m.id && D.byId(m.id); if (d && d.img && !seen.has(d.img)) { seen.add(d.img); out.push({ img: d.img, name: d.name }); } });
    return out.length ? out : [{ img: c.img, name: c.name }];
  };
  const slidesHTML = (c, x, small) => {
    const list = comboSlides(c, x), many = list.length > 1;
    return `<div class="qm-slides${small ? ' qm-slides--sm' : ''}" ${many ? `data-slides aria-roledescription="carousel" aria-label="Ảnh các món trong ${esc(c.name)}"` : ''}>
      <div class="qm-slides__view"><div class="qm-slides__track">${list.map((s, k) => `<figure class="qm-slide"${k ? ' aria-hidden="true"' : ''}><img src="${s.img}" alt="${esc(s.name)}" loading="lazy" draggable="false"></figure>`).join('')}</div></div>
      ${many ? `${small ? '' : `<span class="qm-slides__name" aria-live="polite">${esc(list[0].name)}</span>
        <button type="button" class="qm-slides__nav qm-slides__nav--prev" data-slide-step="-1" aria-label="Ảnh trước">${icon('chevron-left')}</button>
        <button type="button" class="qm-slides__nav qm-slides__nav--next" data-slide-step="1" aria-label="Ảnh sau">${icon('chevron-right')}</button>`}
        <div class="qm-slides__dots">${list.map((s, k) => `<button type="button" data-slide-to="${k}" aria-label="Ảnh ${k + 1}: ${esc(s.name)}"${k ? '' : ' aria-current="true"'}></button>`).join('')}</div>` : ''}
    </div>`;
  };
  const combos = D.combos.map(c => ({ c, x: comboInfo(c) }));
  const feat = combos.slice().sort((a, b) => b.x.save - a.x.save)[0];
  const rest = combos.filter(o => o !== feat);
  $('#combos').className = 'combos combos--v2';
  $('#combos').innerHTML = feat ? `
    <article class="cfeat reveal">
      <div class="cfeat__media">${slidesHTML(feat.c, feat.x)}<span class="cfeat__badge">${icon('sparkle')}Combo đặc biệt</span></div>
      <div class="cfeat__body">
        <div class="cfeat__info">
          <div class="cfeat__tags"><span class="cfeat__tag cfeat__tag--soft">Dành cho nhóm ${esc(feat.x.people)}</span></div>
          <h3 class="cfeat__name">${esc(feat.c.name)}</h3>
          <p class="cfeat__desc">${esc(feat.x.info.desc || feat.c.desc)}</p>
          <ul class="cfeat__items" aria-label="${feat.x.count} món trong combo">${feat.x.info.items.map(m => `<li>${icon('check')}<span>${esc(m.name)}</span><b>x${m.qty}</b></li>`).join('')}</ul>
        </div>
        <!-- Cụm giá: (1) giá combo → (2) giá gọi lẻ → (3) lợi ích — số tiết kiệm tính từ giá món thật -->
        <div class="cfeat__deal">
          <div class="cfeat__prices">
            <span class="cfeat__label">Giá combo</span>
            <strong class="cfeat__now money">${money(feat.c.price)}</strong>
            ${feat.x.original ? `<span class="cfeat__was">Giá gọi lẻ <s class="money">${money(feat.x.original)}</s></span>` : ''}
          </div>
          ${feat.x.save ? `<div class="cfeat__benefit">
            <span class="cfeat__save" title="So với tổng giá gọi lẻ các món trong combo (khẩu phần tiêu chuẩn)">${icon('sparkle')}Tiết kiệm ${money(feat.x.save)}<em>−${feat.x.pct}%</em></span>
          </div>` : ''}
        </div>
        <button type="button" class="btn cfeat__cta" data-combo="${feat.c.id}">Xem chi tiết ${icon('arrow-right')}</button>
      </div>
    </article>
    <div class="ccards">${rest.map(({ c, x }) => `
      <article class="ccard reveal">
        <div class="ccard__media">${slidesHTML(c, x, true)}${x.save ? `<span class="ccard__tag">−${x.pct}%</span>` : ''}</div>
        <div class="ccard__body">
          <h3 class="ccard__name">${esc(c.name)}</h3>
          <span class="ccard__meta">${x.count} món · ${esc(x.people)}</span>
          <p class="ccard__desc">${esc(c.desc)}</p>
          <div class="ccard__foot"><div class="ccard__price">${x.original ? `<s class="money">${money(x.original)}</s>` : ''}<strong class="money">${money(c.price)}</strong></div>
            <button type="button" class="ccard__more" data-combo="${c.id}">Xem chi tiết ${icon('chevron-right')}</button></div>
        </div>
      </article>`).join('')}</div>` : '';

  /* ---------- Slideshow combo: 1 bộ hẹn giờ chung, 4 giây / ảnh, trượt ngang, quay vòng;
     tạm dừng khi rê chuột / focus trong slideshow; chuyển tay bằng chấm, mũi tên, phím ←/→ hoặc vuốt ---------- */
  const SLIDE_MS = 4000;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const shows = $$('[data-slides]').map(el => {
    const s = { el, i: 0, n: $$('.qm-slide', el).length, last: Date.now(), hover: false, focus: false };
    s.go = k => {
      s.i = (k + s.n) % s.n; s.last = Date.now();
      $('.qm-slides__track', el).style.transform = `translateX(${-100 * s.i}%)`;
      $$('.qm-slide', el).forEach((f, j) => f.setAttribute('aria-hidden', j !== s.i));
      $$('[data-slide-to]', el).forEach((b, j) => (j === s.i ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current')));
      const nm = $('.qm-slides__name', el); if (nm) nm.textContent = $$('.qm-slide img', el)[s.i].alt;
    };
    el.addEventListener('click', e => {
      const to = e.target.closest('[data-slide-to]'), st = e.target.closest('[data-slide-step]');
      if (to) s.go(+to.dataset.slideTo); else if (st) s.go(s.i + +st.dataset.slideStep);
    });
    el.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') s.go(s.i - 1); if (e.key === 'ArrowRight') s.go(s.i + 1); });
    el.addEventListener('mouseenter', () => { s.hover = true; }); el.addEventListener('mouseleave', () => { s.hover = false; s.last = Date.now(); });
    el.addEventListener('focusin', () => { s.focus = true; }); el.addEventListener('focusout', () => { s.focus = false; s.last = Date.now(); });
    let x0 = null;
    el.addEventListener('pointerdown', e => { x0 = e.clientX; s.last = Date.now(); });
    el.addEventListener('pointerup', e => { if (x0 == null) return; const dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 40) s.go(s.i + (dx < 0 ? 1 : -1)); });
    return s;
  });
  if (shows.length) setInterval(() => {
    if (document.hidden || reduce.matches || $('#combo-block').hidden) return;
    const now = Date.now();
    shows.forEach(s => { if (!s.hover && !s.focus && now - s.last >= SLIDE_MS) s.go(s.i + 1); });
  }, 500);

  /* ---------- Danh sách món ---------- */
  // Tên tiếng Ý của từng chương (1 nhãn nhỏ duy nhất, chỉ trình bày)
  const IT = { 'khai-vi': 'Antipasti', sup: 'Zuppe', 'mi-y': 'Pasta', risotto: 'Risotti', salad: 'Insalate', nuong: 'Secondi & Pizze', 'trang-mieng': 'Dolci', 'do-uong': 'Bevande' };
  const CHAPTERS = D.categories.filter(c => c.id !== 'all');
  function groupHTML(c, items) {
    return `<section class="qm-group" data-group="${esc(c.id)}" aria-labelledby="g-${esc(c.id)}">
      <header class="qm-group__head">
        ${IT[c.id] ? `<span class="qm-group__it" lang="it">${IT[c.id]}</span>` : ''}
        <h3 class="qm-group__title" id="g-${esc(c.id)}">${esc(c.name)}</h3>
      </header>
      <div class="qm-group__list">${items.map(d => dishCard(d)).join('')}</div>
    </section>`;
  }
  function render() {
    let list = applyFilters(D.dishes.slice());
    if (state.sort === 'asc') list.sort((a, b) => a.price - b.price);
    if (state.sort === 'desc') list.sort((a, b) => b.price - a.price);
    const searching = !!state.q;
    $('#combo-block').hidden = searching; if (sigBox) sigBox.hidden = searching || !sig;
    // "Xem tất cả": tiêu đề "Toàn bộ thực đơn"; 1 danh mục: tên chương của nhóm đã là tiêu đề → ẩn tiêu đề chung để không lặp
    $('#list-title').textContent = searching ? `Kết quả cho “${state.q}”` : 'Toàn bộ thực đơn';
    $('#list-title').hidden = !searching && state.cat !== 'all';
    const f = filterLabel();
    $('#list-meta').textContent = `Hiển thị ${list.length} / ${D.categories.find(c => c.id === state.cat).count} món` + (f ? ' · Bộ lọc: ' + f : '');
    // Nhóm theo danh mục (giữ thứ tự sắp xếp bên trong từng nhóm); không dựng nhóm rỗng; mỗi món chỉ thuộc 1 nhóm
    const known = new Set(CHAPTERS.map(c => c.id));
    const groups = CHAPTERS.filter(c => state.cat === 'all' || c.id === state.cat).map(c => [c, list.filter(d => d.cat === c.id)]);
    const other = list.filter(d => !known.has(d.cat)); if (other.length) groups.push([{ id: 'khac', name: 'Món khác' }, other]);
    // "Xem tất cả" = xổ TOÀN BỘ món, chia theo từng danh mục (không cắt chương sang trang khác) → tắt phân trang.
    // Chọn 1 danh mục → chỉ nhóm đó; phân trang 12 món/trang vẫn áp dụng khi nhóm vượt 12 món.
    $('#grid').dataset.paginate = state.cat === 'all' ? 'off' : 'on'; // đặt TRƯỚC khi dựng lưới (thuc_don_phan_trang.js đọc khi lưới đổi)
    $('#grid').innerHTML = groups.filter(g => g[1].length).map(g => groupHTML(g[0], g[1])).join('');
    const empty = list.length === 0;
    $('#empty').hidden = !empty; $('#pager').hidden = empty; $('#grid').hidden = empty;
    $('#search').classList.toggle('is-error', empty && searching);
    if (empty) {
      $('#empty-title').textContent = searching ? `Không tìm thấy “${state.q}”` : 'Không có món phù hợp bộ lọc';
      $('#empty-desc').textContent = `Thử từ khóa ngắn hơn, kiểm tra chính tả hoặc bỏ bớt bộ lọc${f ? ' “' + f + '”' : ''}.`;
    }
    // Số tiêu chí đang áp dụng trên nút "Lọc theo"
    const n = activeCount(); const pill = $('#to-filter');
    let badge = $('.tool-pill__count', pill);
    if (n) { if (!badge) { badge = document.createElement('b'); badge.className = 'tool-pill__count'; pill.insertBefore(badge, $('.tool-pill__chev', pill)); } badge.textContent = n; pill.setAttribute('aria-label', `Lọc theo — đang áp dụng ${n} tiêu chí`); }
    else { badge && badge.remove(); pill.setAttribute('aria-label', 'Lọc theo'); }
    FB.initReveal();
  }
  // Đồng bộ trạng thái chọn của thanh danh mục (sau khi bấm danh mục / áp dụng bộ lọc / xóa bộ lọc)
  function syncSide() {
    $$('#cats li').forEach(li => { const on = $('button', li).dataset.cat === state.cat; li.classList.toggle('is-active', on); $('button', li).setAttribute('aria-pressed', on); });
    const bar = $('#cats'), a = $('#cats .is-active');
    if (bar && a) { const l = a.offsetLeft - bar.offsetLeft, r = l + a.offsetWidth; if (l < bar.scrollLeft || r > bar.scrollLeft + bar.clientWidth) bar.scrollTo({ left: Math.max(0, l - 16), behavior: 'smooth' }); } // chỉ cuộn trong thanh, không cuộn trang
  }

  $('#cats').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; state.cat = b.dataset.cat; syncSide(); render(); });
  $('#search').addEventListener('submit', e => { e.preventDefault(); state.q = e.target.q.value.trim(); render(); });
  $('#search input').addEventListener('input', e => { if (!e.target.value) { state.q = ''; render(); } });

  /* =================================================================
     4 · POPUP "BỘ LỌC MÓN ĂN" — không cuộn trang; nền bị khóa cuộn (FB.openModal), Esc/X để đóng
     ================================================================= */
  $('#to-filter').addEventListener('click', openFilter);
  $('#to-filter').setAttribute('aria-haspopup', 'dialog');
  function openFilter() {
    // Bản nháp: chỉ ghi vào state khi bấm "Áp dụng"
    const draft = { cat: state.cat, price: state.filtered ? state.price : null, veg: state.filtered && state.veg, mild: state.filtered && state.mild, ings: state.filtered ? state.ings.slice() : [] };
    const chip = (attr, val, label, on) => `<button type="button" class="chip chip--sm${on ? ' is-active' : ''}" ${attr}="${val}" aria-pressed="${on}">${esc(label)}</button>`;
    const old = document.getElementById('menu-filter'); if (old) old.remove();
    const m = document.createElement('div'); m.className = 'modal'; m.id = 'menu-filter';
    m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-labelledby', 'mf-title');
    m.innerHTML = `<div class="pp-box pp-box--560 mf">
      <div class="mf__head"><h3 class="mf__title" id="mf-title">${icon('filter')}Bộ lọc món ăn <span class="mf__count" data-mf-count></span></h3>
        <button type="button" class="pp-x" data-close aria-label="Đóng bộ lọc">${icon('close')}</button></div>
      <div class="mf__body">
        <fieldset class="mf__group"><legend>Khoảng giá</legend><div class="mf__chips">${PRICES.map(([v, l]) => chip('data-mf-price', v, l, draft.price && draft.price.join('-') === v)).join('')}</div></fieldset>
        <fieldset class="mf__group"><legend>Danh mục</legend><div class="mf__chips">${D.categories.map(c => chip('data-mf-cat', c.id, c.name, draft.cat === c.id)).join('')}</div></fieldset>
        <fieldset class="mf__group"><legend>Nguyên liệu</legend><div class="mf__chips">${INGS.map(([id, l]) => chip('data-mf-ing', id, l, draft.ings.includes(id))).join('')}</div>
          <p class="mf__hint">Chọn nhiều — hiển thị món có ít nhất một nguyên liệu đã chọn (theo tên và mô tả món).</p></fieldset>
        <fieldset class="mf__group"><legend>Hương vị &amp; chế độ ăn</legend>
          <label class="checkbox"><input type="checkbox" data-mf-veg${draft.veg ? ' checked' : ''}><span class="checkbox__box">${icon('check')}</span><span class="t-body-s">Thuần chay</span></label>
          <label class="checkbox"><input type="checkbox" data-mf-mild${draft.mild ? ' checked' : ''}><span class="checkbox__box">${icon('check')}</span><span class="t-body-s">Không cay</span></label>
          <label class="checkbox is-disabled" title="Thực đơn chưa có dữ liệu gluten cho từng món"><input type="checkbox" disabled><span class="checkbox__box">${icon('check')}</span><span class="t-body-s">Không gluten <em>(chưa có dữ liệu)</em></span></label>
        </fieldset>
      </div>
      <div class="mf__foot"><button type="button" class="btn btn--outline" data-mf-clear>Xóa bộ lọc</button><button type="button" class="btn btn--navy" data-mf-apply>Áp dụng bộ lọc</button></div>
    </div>`;
    document.body.appendChild(m); FB.hydrateIcons(m); FB.openModal('menu-filter');
    const back = $('#to-filter');
    new MutationObserver((_, ob) => { if (!m.classList.contains('is-open')) { ob.disconnect(); back.focus({ preventScroll: true }); } }).observe(m, { attributes: true, attributeFilter: ['class'] });
    setTimeout(() => $('.pp-x', m).focus({ preventScroll: true }), 40);

    const preview = () => {
      const s = { ...state, cat: draft.cat, price: draft.price, veg: draft.veg, mild: draft.mild, ings: draft.ings, filtered: true };
      const n = activeCount(s), count = applyFilters(D.dishes.slice(), s).length;
      $('[data-mf-count]', m).textContent = n ? `${n} tiêu chí` : '';
      $('[data-mf-apply]', m).textContent = `Áp dụng bộ lọc · ${count} món`;
      $('[data-mf-apply]', m).disabled = !count;
    };
    const setSingle = (attr, el) => { $$(`[${attr}]`, m).forEach(b => { const on = b === el; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', on); }); };
    m.addEventListener('click', e => {
      const p = e.target.closest('[data-mf-price]'); if (p) { const on = !p.classList.contains('is-active'); setSingle('data-mf-price', on ? p : null); draft.price = on ? p.dataset.mfPrice.split('-').map(Number) : null; return preview(); }
      const c = e.target.closest('[data-mf-cat]'); if (c) { setSingle('data-mf-cat', c); draft.cat = c.dataset.mfCat; return preview(); }
      const g = e.target.closest('[data-mf-ing]'); if (g) { const on = !g.classList.contains('is-active'); g.classList.toggle('is-active', on); g.setAttribute('aria-pressed', on); draft.ings = $$('[data-mf-ing].is-active', m).map(x => x.dataset.mfIng); return preview(); }
      if (e.target.closest('[data-mf-clear]')) {
        Object.assign(draft, { cat: 'all', price: null, veg: false, mild: false, ings: [] });
        $$('[data-mf-price],[data-mf-ing]', m).forEach(b => { b.classList.remove('is-active'); b.setAttribute('aria-pressed', false); });
        setSingle('data-mf-cat', $('[data-mf-cat="all"]', m)); $('[data-mf-veg]', m).checked = false; $('[data-mf-mild]', m).checked = false;
        return preview();
      }
      if (e.target.closest('[data-mf-apply]')) {
        Object.assign(state, { cat: draft.cat, price: draft.price, veg: draft.veg, mild: draft.mild, ings: draft.ings.slice() });
        state.filtered = !!(draft.price || draft.veg || draft.mild || draft.ings.length);
        syncSide(); render(); FB.closeModal(m); // danh sách + phân trang cập nhật, giữ nguyên vị trí cuộn
      }
    });
    m.addEventListener('change', e => { if (e.target.matches('[data-mf-veg]')) draft.veg = e.target.checked; if (e.target.matches('[data-mf-mild]')) draft.mild = e.target.checked; preview(); });
    preview();
  }

  $('#reset').addEventListener('click', () => { state.q = ''; state.filtered = false; state.cat = 'all'; state.ings = []; state.price = null; state.veg = state.mild = false; $('#search input').value = ''; syncSide(); render(); });
  $('#suggest').addEventListener('click', e => { const c = e.target.closest('[data-q]'); if (!c) return; state.q = c.dataset.q; $('#search input').value = c.dataset.q; render(); });

  // Dropdown "Giao đến" & "Sắp xếp"
  $$('.dd').forEach(dd => {
    const btn = $('[data-dd]', dd), menu = $('.dd__menu', dd);
    btn.addEventListener('click', e => { if (btn.dataset.dd === 'area' && FB.openAddress) { FB.openAddress(); return; } e.stopPropagation(); $$('.dd').forEach(x => x !== dd && x.classList.remove('is-open')); dd.classList.toggle('is-open'); });
    menu.addEventListener('click', e => {
      const o = e.target.closest('button'); if (!o) return;
      $$('button', menu).forEach(x => x.classList.toggle('is-active', x === o)); dd.classList.remove('is-open');
      if (btn.dataset.dd === 'sort') { state.sort = o.dataset.sort; $('span', btn).textContent = 'Sắp xếp: ' + o.textContent; render(); }
      else $('span', btn).textContent = 'Giao đến: ' + o.textContent;
    });
  });
  document.addEventListener('click', () => $$('.dd').forEach(x => x.classList.remove('is-open')));

  if (location.hash === '#tim-kiem') setTimeout(() => $('#search input').focus(), 300);
  const q = FB.params.get('q'); if (q) { state.q = q; $('#search input').value = q; }
  render();

  // E04 – Ngoài giờ nhận đơn (10:00 – 22:00)
  const now = new Date(); const h = now.getHours();
  if (FB.demo === 'closed' || h >= 22 || h < 10) {
    const hh = String(h).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    FB.modal({ id: 'm-closed', icon: 'clock', title: 'Bếp đã ngừng nhận đơn hôm nay',
      desc: 'Bạn vẫn có thể đặt trước — đơn sẽ được giao từ 10:30 sáng mai, hoặc đặt bàn cho bữa tối ngày mai.',
      extra: `<div class="alert alert--gold" style="width:100%;align-items:center"><span class="c-wine">${icon('clock')}</span><span class="t-body-s">Giờ nhận đơn: 10:00 – 22:00 · Hiện tại ${FB.demo === 'closed' ? '22:47' : hh}</span></div>`,
      actions: [{ label: 'Đặt bàn', style: 'outline', href: 'lien_he.html' }, { label: 'Hẹn giao 10:30 mai', style: 'navy' }] });
    FB.openModal('m-closed');
  }
});
