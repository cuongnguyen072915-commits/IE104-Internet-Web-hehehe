/* =====================================================================
   Chi tiết món — nâng cấp (MỚI). Nạp SAU chi_tiet_mon.js + chi_tiet_mon_day_du.js + tuy_chinh_mon.js.
   B3 · Thư viện ảnh: carousel trượt ngang tự chuyển 4,5 giây (dừng khi người dùng tương tác),
        thanh thumbnail có mũi tên, lightbox phóng to (nút +/−, lăn chuột, chụm 2 ngón, kéo để
        di chuyển, chuyển ảnh, Esc để đóng, đóng xong quay lại đúng ảnh đang xem).
   B4 · Mô tả món: tab Giới thiệu / Thành phần & hương vị / Khẩu phần & lưu ý / Đánh giá.
        Chỉ hiển thị dị ứng & dinh dưỡng khi dữ liệu dự án có sẵn, kèm ghi chú "ước tính".
   A4 · Khẩu phần + topping dùng chung dữ liệu & ô tick tròn với popup (js/tuy_chinh_mon.js).
   ===================================================================== */
document.addEventListener('fb:ready', () => {
  const { $, $$, icon: I, vnd, money } = FB;
  const C = FB.Custom; if (!C) return;
  const id = FB.params.get('id') || 'lasagna';
  const d = FB_DATA.byId(id) && FB_DATA.dishes.find(x => x.id === id) ? FB_DATA.byId(id) : FB_DATA.byId('lasagna');
  const X = (window.FB_DETAIL || {})[d.id];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =================================================================
     B3 · CAROUSEL
     ================================================================= */
  const oldThumbs = $('#thumbs'), main = $('.pd__main');
  const imgs = $$('img', oldThumbs).map((im, i) => ({ src: im.getAttribute('src'), alt: `${d.name} – ảnh ${i + 1}` }));
  if (!imgs.length) imgs.push({ src: $('#main-img').getAttribute('src'), alt: d.name });
  const soldout = $('.pd__soldout', main);
  main.classList.add('pd-car');
  main.setAttribute('role', 'region'); main.setAttribute('aria-roledescription', 'carousel'); main.setAttribute('aria-label', 'Ảnh món ' + d.name);
  main.innerHTML = `<div class="pd-car__track" id="pd-track" aria-live="off">${imgs.map((m, i) => `<button type="button" class="pd-car__slide" role="group" aria-roledescription="slide" aria-label="Ảnh ${i + 1}/${imgs.length} – bấm để phóng to" data-zoom="${i}"><img src="${m.src}" alt="${esc(m.alt)}"${i ? ' loading="lazy"' : ''}${i ? '' : ' id="main-img"'}></button>`).join('')}</div>
    ${imgs.length > 1 ? `<button type="button" class="pd-car__nav pd-car__nav--prev" data-step="-1" aria-label="Ảnh trước">${I('chevron-left')}</button>
    <button type="button" class="pd-car__nav pd-car__nav--next" data-step="1" aria-label="Ảnh tiếp theo">${I('chevron-right')}</button>
    <span class="pd-car__count" aria-hidden="true"><b data-cur>1</b>/${imgs.length}</span>` : ''}
    <span class="pd-car__zoom" aria-hidden="true">${I('search')}Bấm để phóng to</span>`;
  if (soldout) main.appendChild(soldout);
  // Thay thanh thumbnail (bỏ trình nghe cũ của chi_tiet_mon.js)
  const thumbsWrap = document.createElement('div'); thumbsWrap.className = 'pd-thumbs' + (imgs.length < 2 ? ' is-single' : '');
  thumbsWrap.innerHTML = `<button type="button" class="pd-thumbs__arrow pd-thumbs__arrow--prev" data-tscroll="-1" aria-label="Xem ảnh nhỏ phía trước">${I('chevron-left')}</button>
    <div class="pd__thumbs" id="thumbs" role="tablist" aria-label="Chọn ảnh">${imgs.map((m, i) => `<button type="button" role="tab" class="${i ? '' : 'is-active'}" aria-selected="${!i}" aria-label="Ảnh ${i + 1}" data-go="${i}"><img src="${m.src}" alt=""></button>`).join('')}</div>
    <button type="button" class="pd-thumbs__arrow pd-thumbs__arrow--next" data-tscroll="1" aria-label="Xem ảnh nhỏ phía sau">${I('chevron-right')}</button>`;
  oldThumbs.replaceWith(thumbsWrap);
  const track = $('#pd-track'), strip = $('#thumbs', thumbsWrap);
  let cur = 0, timer = 0, paused = false, lbOpen = false;

  function go(i, user) {
    cur = (i + imgs.length) % imgs.length;
    track.style.transform = `translateX(-${cur * 100}%)`;
    const c = $('[data-cur]', main); if (c) c.textContent = cur + 1;
    $$('[data-go]', strip).forEach((b, k) => { b.classList.toggle('is-active', k === cur); b.setAttribute('aria-selected', k === cur); });
    $$('.pd-car__slide', track).forEach((s, k) => { s.tabIndex = k === cur ? 0 : -1; s.setAttribute('aria-hidden', k !== cur); });
    const t = $$('[data-go]', strip)[cur];
    if (t) strip.scrollTo({ left: t.offsetLeft - (strip.clientWidth - t.offsetWidth) / 2, behavior: reduceMotion ? 'auto' : 'smooth' });
    if (user) restart();
  }
  const tick = () => { if (!paused && !lbOpen && !document.hidden) go(cur + 1); };
  function restart() { clearInterval(timer); if (imgs.length > 1 && !reduceMotion) timer = setInterval(tick, 4500); }
  // Tạm dừng khi người dùng đang tương tác với khu ảnh
  const gallery = $('.pd__gallery');
  ['pointerenter', 'focusin', 'touchstart'].forEach(ev => gallery.addEventListener(ev, () => { paused = true; }, { passive: true }));
  ['pointerleave', 'focusout'].forEach(ev => gallery.addEventListener(ev, e => { if (ev === 'focusout' && gallery.contains(e.relatedTarget)) return; paused = false; }));
  gallery.addEventListener('touchend', () => setTimeout(() => { paused = false; }, 4000), { passive: true });
  main.addEventListener('click', e => {
    const n = e.target.closest('[data-step]'); if (n) { go(cur + +n.dataset.step, true); return; }
    const z = e.target.closest('[data-zoom]'); if (z && !swiped) openLightbox(+z.dataset.zoom);
  });
  main.addEventListener('keydown', e => { if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1, true); } if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1, true); } });
  thumbsWrap.addEventListener('click', e => {
    const t = e.target.closest('[data-go]'); if (t) { go(+t.dataset.go, true); return; }
    const a = e.target.closest('[data-tscroll]'); if (a) strip.scrollBy({ left: +a.dataset.tscroll * strip.clientWidth * 0.8, behavior: 'smooth' });
  });
  const syncArrows = () => {
    const max = strip.scrollWidth - strip.clientWidth;
    thumbsWrap.classList.toggle('can-prev', strip.scrollLeft > 4);
    thumbsWrap.classList.toggle('can-next', strip.scrollLeft < max - 4);
  };
  strip.addEventListener('scroll', syncArrows, { passive: true }); window.addEventListener('resize', syncArrows);
  // Vuốt ngang trên ảnh chính (cảm ứng & chuột)
  let sx = null, swiped = false;
  main.addEventListener('pointerdown', e => { if (e.target.closest('.pd-car__nav')) return; sx = e.clientX; swiped = false; });
  main.addEventListener('pointerup', e => { if (sx == null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 40) { swiped = true; go(cur + (dx < 0 ? 1 : -1), true); setTimeout(() => { swiped = false; }, 0); } });
  main.addEventListener('dragstart', e => e.preventDefault());
  go(0); restart(); requestAnimationFrame(syncArrows);

  /* =================================================================
     B3 · LIGHTBOX — component dùng chung js/lightbox.js
     ================================================================= */
  function openLightbox(i) {
    if (!FB.openLightbox) return;
    lbOpen = true;
    FB.openLightbox(imgs, i, { onClose: li => { lbOpen = false; go(li, true); const s = $$('.pd-car__slide', track)[li]; if (s) s.focus({ preventScroll: true }); } });
  }

  /* =================================================================
     A4 · KHẨU PHẦN + TOPPING (dữ liệu dùng chung)
     ================================================================= */
  const o = C.optionsFor(d.id);
  let sel = C.normSel(d.id, { tops: o.tops.length && id === 'lasagna' ? [o.tops[0].name] : (X && X.toppings && X.toppings[0] ? [X.toppings[0].name] : []) });
  let qty = 1;
  const sizesBox = $('#sizes'), topsBox = $('#tops');
  const sizeTitle = sizesBox.previousElementSibling, topTitle = topsBox.previousElementSibling;
  if (o.sizes.length > 1) {
    sizesBox.innerHTML = o.sizes.map(s => `<button type="button" class="opt${s.label === sel.size ? ' is-active' : ''}" role="radio" aria-checked="${s.label === sel.size}" data-size="${esc(s.label)}"><span class="radio"></span><span class="stack"><strong>${esc(s.label)}</strong><small>${esc(s.note)}${s.note ? ' · ' : ''}${s.add ? '+' + vnd(s.add) : vnd(d.price)}</small></span></button>`).join('');
    sizesBox.setAttribute('role', 'radiogroup'); sizesBox.setAttribute('aria-label', 'Kích cỡ');
  } else { sizesBox.hidden = true; if (sizeTitle) sizeTitle.hidden = true; }
  if (o.tops.length) topsBox.outerHTML = `<div class="tops" id="tops">${C.topsHTML(d.id, sel.tops)}</div>`;
  else { topsBox.hidden = true; if (topTitle) topTitle.hidden = true; }
  // Bỏ trình nghe cũ của chi_tiet_mon.js trên nút số lượng / thêm vào giỏ
  ['#qty', '#add-btn'].forEach(s => { const el = $(s); if (el) el.replaceWith(el.cloneNode(true)); });
  const update = () => { $('#qty output').textContent = qty; $('#total').textContent = money(C.unitPrice(d.id, sel) * qty); };
  $('#sizes').addEventListener('click', e => { const b = e.target.closest('[data-size]'); if (!b) return; sel.size = b.dataset.size; $$('#sizes .opt').forEach(x => { const on = x === b; x.classList.toggle('is-active', on); x.setAttribute('aria-checked', on); }); update(); });
  $('#tops') && $('#tops').addEventListener('change', () => { sel.tops = $$('#tops [data-cz-top]:checked').map(x => x.dataset.czTop); update(); });
  const [minus, plus] = $$('#qty button');
  minus.addEventListener('click', () => { qty = Math.max(1, qty - 1); update(); });
  plus.addEventListener('click', () => { qty = Math.min(20, qty + 1); update(); });
  $('#add-btn').addEventListener('click', () => {
    const it = C.addToCart(d.id, qty, sel);
    FB.toast('Đã thêm vào giỏ hàng', `${qty} × ${d.name} · ${it.opt}`, 'Xem giỏ', 'gio_hang.html', 'navy');
  });
  update();

  /* =================================================================
     B4 · MÔ TẢ MÓN
     ================================================================= */
  // Lasagna: nội dung đang có sẵn trong HTML (giữ nguyên dữ liệu dự án)
  const LASAGNA = { title: 'Công thức truyền thống vùng Emilia-Romagna', long: 'Lớp mì tươi cán tay xen kẽ sốt bò bằm Bolognese hầm 6 giờ, sốt béchamel mịn và phô mai Parmigiano Reggiano, nướng lò đá tới khi mặt vàng giòn.',
    story: ['Mỗi khay lasagna được làm thủ công trong ngày với 7 lớp mì trứng tươi. Sốt Bolognese nấu từ bò Úc xay, cà chua San Marzano và rượu vang đỏ, hầm chậm trong 6 giờ để dậy vị ngọt tự nhiên.', 'Gợi ý: dùng kèm salad rau rocket và một ly Chianti để cân bằng vị béo.'],
    ingredients: 'Mì trứng tươi cán tay, bò Úc xay, cà chua San Marzano, rượu vang đỏ, sốt béchamel, phô mai Parmigiano Reggiano, húng quế.',
    allergy: 'Dị ứng: gluten, sữa, trứng, cần tây.', nutrition: ['720 kcal', '34 g', '62 g', '36 g'], rating: '4.9', reviews: 128,
    review: { text: 'Mì Lasagna đút lò rất đậm vị, giao đến vẫn còn nóng. Đóng gói đẹp, shipper lịch sự.', author: 'Nguyễn Minh Anh' } };
  const info = d.id === 'lasagna' ? LASAGNA : X;
  const cat = (FB_DATA.categories.find(c => c.id === d.cat) || {}).name || '';
  const story = info ? info.story || [] : [];
  const tipIdx = story.findIndex(p => /^Gợi ý/i.test(p));
  const tip = tipIdx > -1 ? story[tipIdx].replace(/^Gợi ý:\s*/i, '') : '';
  const intro = story.filter((_, i) => i !== tipIdx);
  const ingList = info && info.ingredients ? info.ingredients.replace(/\.$/, '').split(/,\s*/) : [];
  const allergy = info && info.allergy ? info.allergy.replace(/^Dị ứng:\s*/i, '').replace(/\.$/, '') : '';
  const N = ['Năng lượng', 'Đạm', 'Carb', 'Chất béo'];
  const tabs = [['intro', 'Giới thiệu'], ['ing', 'Thành phần & hương vị'], ['serve', 'Khẩu phần & lưu ý'], ['rev', `Đánh giá (${info ? info.reviews : 0})`]];
  const sec = $('#mo-ta');
  sec.classList.add('pd-desc');
  sec.innerHTML = `
    <div class="pd-desc__head"><div><span class="t-eyebrow c-wine">Về món ăn</span><h2 class="t-h3">${esc(d.name)}</h2></div>
      <div class="tabs pd-desc__tabs" role="tablist" aria-label="Thông tin món">${tabs.map(([k, t], i) => `<button type="button" class="tab${i ? '' : ' is-active'}" role="tab" id="tab-${k}" aria-controls="panel-${k}" aria-selected="${!i}" tabindex="${i ? -1 : 0}" data-tab="${k}">${t}</button>`).join('')}</div></div>
    <div class="pd-desc__panel" role="tabpanel" id="panel-intro" aria-labelledby="tab-intro" data-panel="intro">
      <div class="pd-desc__grid">
        <div class="pd-desc__main">
          <h3 class="pd-desc__title">${esc(info ? info.title : d.name)}</h3>
          <p class="pd-desc__lead">${esc(info ? info.long : d.desc)}</p>
          ${intro.map(p => `<p class="t-body c-gray">${esc(p)}</p>`).join('') || `<p class="t-body c-gray">Món được bếp Fiabesco chuẩn bị theo từng phần ngay khi nhận đơn.</p>`}
        </div>
        <aside class="pd-desc__aside">
          <div class="pd-fact"><span>Danh mục</span><b>${esc(cat)}</b></div>
          ${d.veg ? '<div class="pd-fact"><span>Chế độ ăn</span><b>Phù hợp người ăn chay</b></div>' : ''}
          <div class="pd-fact"><span>Phục vụ</span><b>Chế biến khi nhận đơn</b></div>
          ${tip ? `<div class="pd-tip">${I('sparkle')}<div><strong>Gợi ý thưởng thức</strong><p>${esc(tip)}</p></div></div>` : ''}
        </aside>
      </div>
    </div>
    <div class="pd-desc__panel" role="tabpanel" id="panel-ing" aria-labelledby="tab-ing" data-panel="ing" hidden>
      <div class="pd-desc__grid">
        <div class="pd-desc__main">
          <h3 class="pd-desc__sub">Thành phần &amp; nguyên liệu nổi bật</h3>
          ${ingList.length ? `<ul class="pd-ing">${ingList.map(x => `<li>${I('leaf')}${esc(x)}</li>`).join('')}</ul>` : `<p class="t-body c-gray">${esc(d.desc)}</p><p class="t-body-s c-gray">Danh sách nguyên liệu chi tiết của món này đang được cập nhật.</p>`}
          <h3 class="pd-desc__sub">Đặc trưng hương vị</h3>
          <p class="t-body c-gray">${esc(info ? info.long : d.desc)}</p>
        </div>
        <aside class="pd-desc__aside">
          <div class="pd-allergy${allergy ? '' : ' is-unknown'}">${I('alert-triangle')}<div><strong>Lưu ý dị ứng</strong>
            <p>${allergy ? 'Món có chứa: ' + esc(allergy) + '.' : 'Chưa có thông tin dị ứng đã xác nhận cho món này. Vui lòng ghi chú cho bếp hoặc gọi hotline 0123 456 789 trước khi đặt.'}</p></div></div>
        </aside>
      </div>
    </div>
    <div class="pd-desc__panel" role="tabpanel" id="panel-serve" aria-labelledby="tab-serve" data-panel="serve" hidden>
      <div class="pd-desc__grid">
        <div class="pd-desc__main">
          <h3 class="pd-desc__sub">Thông tin khẩu phần</h3>
          <div class="pd-serve">${o.sizes.map(s => `<div class="pd-serve__row"><strong>${esc(s.label)}</strong><span>${esc(s.note || '—')}</span><b class="money">${money(d.price + s.add)}</b></div>`).join('')}</div>
          ${o.tops.length ? `<p class="t-body-s c-gray">Có thể thêm: ${o.tops.map(t => `${esc(t.name)} (+${vnd(t.price)})`).join(', ')}.</p>` : '<p class="t-body-s c-gray">Món được phục vụ theo phần tiêu chuẩn, không có topping thêm.</p>'}
        </div>
        <aside class="pd-desc__aside">
          ${info && info.nutrition ? `<div class="nutri pd-nutri"><span class="t-title" style="font-size:15px">Dinh dưỡng / phần tiêu chuẩn</span>
            ${info.nutrition.map((v, i) => `<div class="between t-body-s"><span class="c-gray">${N[i]}</span><span>${esc(v)}</span></div>`).join('')}
            <small class="pd-note">Giá trị ước tính do nhà hàng cung cấp, chỉ mang tính tham khảo.</small></div>`
          : '<div class="pd-fact pd-fact--muted"><span>Dinh dưỡng</span><b>Chưa có dữ liệu dinh dưỡng cho món này.</b></div>'}
        </aside>
      </div>
    </div>
    <div class="pd-desc__panel" role="tabpanel" id="panel-rev" aria-labelledby="tab-rev" data-panel="rev" hidden>
      ${info && info.review ? `<div class="pd-rev"><div class="pd-rev__score"><b>${esc(info.rating)}</b><span class="stars-sm">★★★★★</span><small>${info.reviews} đánh giá</small></div>
        <blockquote class="pd-rev__quote"><p>“${esc(info.review.text)}”</p><cite>— ${esc(info.review.author)}</cite></blockquote></div>`
      : `<p class="t-body c-gray">Chưa có đánh giá. Hãy là người đầu tiên đánh giá ${esc(d.name)} sau khi nhận món.</p>`}
    </div>`;
  FB.hydrateIcons(sec);
  const tabBtns = $$('[role="tab"]', sec);
  const select = t => { tabBtns.forEach(x => { const on = x === t; x.classList.toggle('is-active', on); x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; }); $$('[data-panel]', sec).forEach(p => { p.hidden = p.dataset.panel !== t.dataset.tab; }); };
  sec.addEventListener('click', e => { const t = e.target.closest('[role="tab"]'); if (t) select(t); });
  sec.addEventListener('keydown', e => {
    const i = tabBtns.indexOf(document.activeElement); if (i < 0) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); const n = tabBtns[(i + (e.key === 'ArrowRight' ? 1 : tabBtns.length - 1)) % tabBtns.length]; n.focus(); select(n); }
  });
});
