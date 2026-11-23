/* Khuyến mãi: lọc mã, sao chép mã, lưu mã */
document.addEventListener('fb:ready', () => {
  const { $, $$, icon } = FB;
  const deals = [
    ['../assets/template-20261120T115451Z-1-001 - Copy/template/promo-green-spaghetti.jpg', 'Green Spaghetti – Món mới', 'Giảm 20% cho món mới Spaghetti sốt pesto trong tuần đầu ra mắt.', 'PESTO20', '30/11/2026', 'Giao hàng', 'ship'],
    ['../assets/template-20261120T115451Z-1-001 - Copy/template/promo-pizza-news.jpg', 'Pizza ngày thứ Tư', 'Mua 1 tặng 1 pizza size M mỗi thứ Tư, áp dụng tại nhà hàng.', 'WEDPIZZA', '31/12/2026', 'Tại nhà hàng', 'dine'],
    ['../assets/template-20261120T115451Z-1-001 - Copy/template/combo-family.jpg', 'Combo Gia Đình −15%', 'Giảm 15% combo 4 người: 2 pizza, 2 mì Ý, salad và nước.', 'FIABESCO15', '15/12/2026', 'Giao & tại chỗ', 'ship dine'],
    ['../assets/template-20261120T115451Z-1-001 - Copy/template/dish-chicken-risotto.jpg', 'Freeship đơn từ 300k', 'Miễn phí giao hàng trong bán kính 5 km cho mọi đơn từ 300.000đ.', 'FREESHIP', '31/12/2026', 'Giao hàng', 'ship'],
    ['../assets/template-20261120T115451Z-1-001 - Copy/template/promo-food-journal.jpg', 'Bản tin ẩm thực', 'Đọc bài viết mới và nhận mã giảm 10% cho lần đặt món tiếp theo.', 'NEWS10', '30/11/2026', 'Thành viên', 'ship dine'],
    ['../assets/template-20261120T115451Z-1-001 - Copy/template/dish-lasagna-baking-dish.jpg', 'Lasagna Thứ Hai', 'Giảm 25.000đ cho Mì Lasagna đút lò vào mỗi thứ Hai.', 'MONLASAGNA', '31/12/2026', 'Giao & tại chỗ', 'ship dine']
  ];
  $('#deals').innerHTML = deals.map(([img, t, d, code, exp, tag, f]) => `<article class="deal reveal" data-f="${f}"><img src="${img}" alt="${t}" loading="lazy">
    <div class="deal__body"><div class="deal__meta"><span class="pill">${tag}</span><span class="deal__exp">${icon('clock')}HSD ${exp}</span></div>
    <h3 class="t-h4">${t}</h3><p class="t-body-s c-gray">${d}</p>
    <div class="deal__foot"><button class="deal__code" data-code="${code}" title="Sao chép mã">${code}${icon('copy')}</button><button class="deal__save">Lưu mã</button></div></div></article>`).join('');

  $$('#deal-filter .chip').forEach(c => c.addEventListener('click', () => {
    $$('#deal-filter .chip').forEach(x => x.classList.toggle('is-active', x === c));
    $$('.deal').forEach(d => d.classList.toggle('is-hidden', c.dataset.f !== 'all' && !d.dataset.f.includes(c.dataset.f)));
  }));
  document.addEventListener('click', e => {
    const b = e.target.closest('.deal__code');
    if (b) { const code = b.dataset.code; (navigator.clipboard ? navigator.clipboard.writeText(code) : Promise.reject()).catch(() => {});
      FB.toast('Đã sao chép mã ' + code, 'Dán mã ở bước Giỏ hàng để áp dụng ưu đãi.', 'Đến giỏ hàng', 'gio_hang.html', 'navy'); }
    const s = e.target.closest('.deal__save');
    if (s) { s.classList.toggle('is-saved'); s.textContent = s.classList.contains('is-saved') ? 'Đã lưu' : 'Lưu mã'; }
  });
});
