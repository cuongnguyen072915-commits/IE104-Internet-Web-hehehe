/* Bộ sưu tập: lọc theo chủ đề, bố cục masonry 3 cột (chiều cao ảnh theo Figma), xem ảnh phóng to */
document.addEventListener('fb:ready', () => {
  const { $, $$, icon } = FB;
  const A = '../assets/template-20261120T115451Z-1-001 - Copy/template/';
  const CAT = { space: 'Không gian', food: 'Món ăn', event: 'Sự kiện', kitchen: 'Hậu trường bếp' };
  // [ảnh, tiêu đề, chủ đề, chiều cao (px ở khổ 384px)] – đúng thứ tự 3 cột trong Figma
  const PHOTOS = [
    ['restaurant-dining-hall.jpg', 'Phòng ăn chính', 'space', 300], ['dish-handmade-pasta.jpg', 'Mì tươi cán tay', 'kitchen', 440], ['restaurant-wine-bar.jpg', 'Quầy rượu vang', 'space', 260],
    ['dish-lasagna-baking-dish.jpg', 'Mì Lasagna đút lò', 'food', 420], ['restaurant-garden-terrace.jpg', 'Sân vườn buổi tối', 'space', 260], ['restaurant-dinner-table.jpg', 'Bữa tối gia đình', 'event', 420],
    ['event-birthday-party.jpg', 'Tiệc sinh nhật', 'event', 260], ['dish-burrata-salad.jpg', 'Salad Burrata', 'food', 280], ['event-family-gathering.jpg', 'Tiệc gia đình', 'event', 300],
    ['dish-spaghetti-bolognese.jpg', 'Mì Ý Bò Bằm Phô Mai', 'food', 300], ['dish-baked-pasta.jpg', 'Món nướng đút lò', 'kitchen', 420], ['event-proposal-setup.jpg', 'Góc cầu hôn', 'event', 260],
    ['restaurant-cozy-interior.jpg', 'Góc ấm cúng', 'space', 260], ['dish-tiramisu.jpg', 'Tiramisù', 'food', 300], ['dish-lasagna-top-view.jpg', 'Lasagna mới ra lò', 'kitchen', 300],
    ['drink-red-wine.jpg', 'Vang đỏ Toscana', 'food', 300], ['restaurant-garden-dinner.jpg', 'Bữa tối sân vườn', 'space', 260], ['dish-chicken-risotto.jpg', 'Cơm Risotto Gà', 'food', 300]
  ];
  let filter = 'all', shown = 9, list = [], cur = 0;
  const box = $('#masonry'), more = $('#more'), lb = $('#lightbox');

  function render() {
    list = PHOTOS.filter(p => filter === 'all' || p[2] === filter);
    const vis = list.slice(0, shown);
    const cols = window.matchMedia('(max-width:640px)').matches ? 1 : window.matchMedia('(max-width:1100px)').matches ? 2 : 3;
    const buckets = Array.from({ length: cols }, () => []); vis.forEach((p, i) => buckets[i % cols].push([p, i]));
    box.innerHTML = buckets.map(b => `<div class="masonry__col">${b.map(([p, i]) => `<button type="button" class="shot reveal" data-i="${i}" style="height:${p[3]}px" aria-label="Xem ảnh ${p[1]}">
      <img src="${A + p[0]}" alt="${p[1]}" loading="lazy"><span class="shot__tools"><i>${icon('expand')}</i><i>${icon('heart')}</i></span>
      <span class="shot__cap"><span>${CAT[p[2]]}</span><strong>${p[1]}</strong></span></button>`).join('')}</div>`).join('');
    $('#gal-empty').hidden = list.length > 0;
    more.hidden = shown >= list.length;
    FB.initReveal(box);
  }
  function openLb(i) {
    cur = (i + list.length) % list.length; const p = list[cur];
    $('img', lb).src = A + p[0]; $('img', lb).alt = p[1];
    $('figcaption span', lb).textContent = CAT[p[2]]; $('figcaption strong', lb).textContent = p[1];
    FB.openModal('lightbox');
  }
  $$('.gal__chip').forEach(c => c.addEventListener('click', () => {
    $$('.gal__chip').forEach(x => { x.classList.toggle('is-active', x === c); x.setAttribute('aria-selected', x === c); });
    filter = c.dataset.filter; shown = 9; render();
  }));
  more.addEventListener('click', () => { shown += 6; render(); });
  box.addEventListener('click', e => { const s = e.target.closest('.shot'); if (s) openLb(+s.dataset.i); });
  $('.lightbox__nav--prev', lb).addEventListener('click', () => openLb(cur - 1));
  $('.lightbox__nav--next', lb).addEventListener('click', () => openLb(cur + 1));
  document.addEventListener('keydown', e => { if (!lb.classList.contains('is-open')) return; if (e.key === 'ArrowLeft') openLb(cur - 1); if (e.key === 'ArrowRight') openLb(cur + 1); });
  let w = innerWidth; window.addEventListener('resize', () => { if (Math.abs(innerWidth - w) > 80) { w = innerWidth; render(); } });
  render();
});
