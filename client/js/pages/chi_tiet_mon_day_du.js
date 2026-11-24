/* Chi tiết món – nội dung riêng cho từng món (Figma: “PC – 03b Chi tiết món – <Tên món>”).
   File MỚI, nạp SAU ../js/pages/chi_tiet_mon.js. Dữ liệu: window.FB_DETAIL (js/data/chi_tiet_mon.js).
   - 10 món có dữ liệu đầy đủ: 4 ảnh, kích cỡ, topping, mô tả, thành phần, dinh dưỡng, đánh giá, gợi ý.
   - Các món còn lại: thay phần mô tả/thành phần mặc định (của Lasagna) bằng thông tin của chính món đó. */
document.addEventListener('fb:ready', () => {
  const { $, $$, icon, vnd, money, dishCard } = FB;
  const IMG = '../assets/template-20261120T115451Z-1-001 - Copy/template/';
  const id = FB.params.get('id') || 'lasagna';
  const d = FB_DATA.byId(id);
  if (!d || d.id === 'lasagna') return;
  const X = (window.FB_DETAIL || {})[d.id];
  const panel = name => $(`.pd-tabs__panel[data-panel="${name}"]`);
  const pills = $$('#info .pill');

  if (!X) {
    // Món chưa có trang chi tiết riêng → nội dung chung theo món
    if (pills[1]) pills[1].hidden = true;
    const desc = panel('desc');
    if (desc) desc.innerHTML = `<h3 class="t-h4">${d.name}</h3><p class="t-body c-gray">${d.desc}</p>
      <p class="t-body c-gray">Món được bếp Fiabesco chuẩn bị theo từng phần ngay khi nhận đơn.</p>
      <p class="t-body-s c-wine">Vui lòng ghi chú cho nhà hàng nếu bạn dị ứng với bất kỳ thành phần nào.</p>`;
    const ing = panel('ing');
    if (ing) ing.innerHTML = `<h3 class="t-h4">Thành phần &amp; dị ứng</h3><p class="t-body c-gray">${d.desc}</p>
      <p class="t-body-s c-wine">${d.veg ? 'Phù hợp người ăn chay.' : 'Có thể chứa: gluten, sữa, trứng, hải sản.'}</p>`;
    const rev = panel('rev');
    if (rev) rev.innerHTML = `<h3 class="t-h4">Chưa có đánh giá</h3><p class="t-body c-gray">Hãy là người đầu tiên đánh giá ${d.name} sau khi nhận món.</p>`;
    $$('.tab').forEach(t => { if (t.dataset.tab === 'rev') t.textContent = 'Đánh giá (0)'; });
    $('.nutri') && ($('.nutri').hidden = true);
    const stars = $('#info .stars-sm + .t-body-s'); if (stars) stars.textContent = 'Món mới · chưa có đánh giá';
    return;
  }

  /* ---- Nhãn, đánh giá, giá ---- */
  if (pills[1]) pills[1].textContent = X.rank;
  const rate = $('#info .stars-sm + .t-body-s');
  if (rate) rate.textContent = `${X.rating} · ${X.reviews} đánh giá · Đã bán ${X.sold}`;
  $('[data-bind="long"]').textContent = X.long;
  if (X.oldPrice) {
    $('#old-price').hidden = false; $('#old-price').textContent = money(X.oldPrice);
    $('#off').hidden = false; $('#off').textContent = '-' + Math.round((X.oldPrice - d.price) * 100 / X.oldPrice) + '%';
  }

  /* ---- Ảnh: ảnh chính + 3 ảnh góc khác ---- */
  const imgs = [d.img].concat(X.gallery.map(f => IMG + f));
  $('#main-img').src = imgs[0];
  $('#thumbs').innerHTML = imgs.map((s, i) => `<button class="${i ? '' : 'is-active'}"><img src="${s}" alt="${d.name} – ảnh ${i + 1}"></button>`).join('');

  /* ---- Kích cỡ (giữ nguyên nút, đổi chữ & phụ thu) ---- */
  $$('#sizes .opt').forEach((o, i) => {
    const s = X.sizes[i]; if (!s) return;
    o.dataset.add = s.add;
    $('strong', o).textContent = s.label;
    $('small', o).textContent = s.note;
  });

  /* ---- Topping (món đầu được chọn sẵn như thiết kế) ---- */
  $('#tops').innerHTML = X.toppings.map((t, i) => `<label class="top"><span class="checkbox"><input type="checkbox" data-price="${t.price}" data-name="${t.name}"${i ? '' : ' checked'}><span class="checkbox__box">${icon('check')}</span><span class="t-body">${t.name}</span></span><span class="top__price">+${vnd(t.price)}</span></label>`).join('');
  const recalc = () => { const a = $('#sizes .opt.is-active'); if (a) a.click(); };
  $$('#tops input').forEach(i => i.addEventListener('change', recalc));
  recalc();

  /* ---- Ưu điểm ---- */
  $$('.perks span').forEach((p, i) => { const t = [...p.childNodes].reverse().find(n => n.nodeType === 3); if (t && X.perks[i]) t.textContent = X.perks[i]; });

  /* ---- Tab Mô tả / Thành phần / Đánh giá ---- */
  $$('.tab').forEach(t => { if (t.dataset.tab === 'rev') t.textContent = `Đánh giá (${X.reviews})`; });
  panel('desc').innerHTML = `<h3 class="t-h4">${X.title}</h3>` + X.story.map(p => `<p class="t-body c-gray">${p}</p>`).join('') + `<p class="t-body-s c-wine">${X.allergy}</p>`;
  panel('ing').innerHTML = `<h3 class="t-h4">Thành phần &amp; dị ứng</h3><p class="t-body c-gray">${X.ingredients}</p><p class="t-body-s c-wine">${X.allergy}</p>`;
  panel('rev').innerHTML = `<h3 class="t-h4">${X.rating} <span class="stars-sm">★★★★★</span> · ${X.reviews} đánh giá</h3><p class="t-body c-gray">“${X.review.text}” — ${X.review.author}</p>`;
  $$('.nutri .between span:last-child').forEach((s, i) => { if (X.nutrition[i]) s.textContent = X.nutrition[i]; });

  /* ---- Gợi ý đặt kèm ---- */
  const sug = X.suggest.map(FB_DATA.byId).filter(Boolean);
  if (sug.length) { $('#suggest').innerHTML = sug.map(s => dishCard(s)).join(''); FB.initReveal && FB.initReveal(); }
});
