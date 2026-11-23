/* Trang chủ */
document.addEventListener('fb:ready', () => {
  const { $, $$, dishCard } = FB;
  // Món nổi bật: 4 thẻ như thiết kế
  const picks = ['burrata', 'lasagna', 'bolognese', 'risotto-kem'].map(FB_DATA.byId);
  $('#featured-grid').innerHTML = picks.map(d => dishCard(d, { tag: d.homeTag || d.tag })).join('');

  // Đánh giá: 3 thẻ / trang, 3 chấm phân trang
  const reviews = [
    ['A', 'Nguyễn Minh Anh', 'Khách đặt giao hàng', 'Mì Lasagna đút lò rất đậm vị, giao đến vẫn còn nóng. Đóng gói đẹp, shipper lịch sự.'],
    ['B', 'Trần Quốc Bảo', 'Khách đặt bàn', 'Không gian ấm cúng, phục vụ chu đáo. Risotto kem phô mai là món tôi gọi mỗi lần ghé.'],
    ['H', 'Lê Thu Hà', 'Thành viên Vàng', 'Đặt bàn trực tuyến nhanh, tích điểm đổi ưu đãi rất tiện. Sẽ giới thiệu cho bạn bè.']
  ];
  const all = reviews.concat(reviews, reviews);
  const track = $('#reviews-track');
  track.innerHTML = all.map(([i, n, r, t]) => `<article class="review"><div class="review__top"><span class="stars">★★★★★</span><span class="review__mark">”</span></div>
    <p class="t-body-l">“${t}”</p><hr class="divider"><div class="review__who"><span class="review__av">${i}</span><div class="stack"><strong style="font:600 16px/1.4 var(--f-sans)">${n}</strong><span class="t-caption c-gray">${r}</span></div></div></article>`).join('');
  const dots = $('#reviews-dots'); let page = 0; const pages = 3;
  dots.innerHTML = Array.from({ length: pages }, (_, i) => `<button aria-label="Trang ${i + 1}"></button>`).join('');
  const go = p => {
    page = (p + pages) % pages;
    const card = track.children[0]; const step = card.offsetWidth + 24;
    const per = Math.max(1, Math.round((track.parentElement.offsetWidth + 24) / step));
    track.style.transform = `translateX(${-page * per * step}px)`;
    $$('button', dots).forEach((b, i) => b.classList.toggle('is-active', i === page));
  };
  $$('.reviews__nav').forEach(b => b.addEventListener('click', () => go(page + +b.dataset.dir)));
  $$('button', dots).forEach((b, i) => b.addEventListener('click', () => go(i)));
  window.addEventListener('resize', () => go(page)); go(0);

  // Đặt bàn nhanh → chuyển sang trang Đặt bàn kèm thông tin
  const form = $('.quick-book');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const f = form.phone.closest('.field'); const raw = form.phone.value.trim();
    f.classList.toggle('is-error', raw !== '' && !FB.isPhone(raw));
    if (f.classList.contains('is-error')) return;
    const q = new URLSearchParams({ date: form.date.value, time: form.time.value, guests: form.guests.value || '', phone: FB.normPhone(raw) });
    location.href = 'lien_he.html?' + q.toString() + '#contact-form';
  });
});
