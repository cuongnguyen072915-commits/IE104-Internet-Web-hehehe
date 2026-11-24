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
  /* Carousel = vùng cuộn ngang gốc (.reviews__viewport): vuốt cảm ứng/touchpad có sẵn,
     scroll-snap dừng ở thẻ đầu mỗi trang; chuột kéo bằng pointer events. Mũi tên/chấm
     cuộn tới trang; chấm cập nhật theo vị trí cuộn. Mỗi trang = số thẻ vừa khung (3/2/1),
     chỉ hiện đủ 3 trang thẻ như cơ chế cũ, không tạo thêm thẻ. */
  const dots = $('#reviews-dots'); const vp = track.parentElement; let page = 0; const pages = 3;
  dots.innerHTML = Array.from({ length: pages }, (_, i) => `<button aria-label="Trang ${i + 1}"></button>`).join('');
  let per = 1, step = 1;
  const layout = () => {
    const cards = [...track.children]; cards.forEach(c => { c.style.display = ''; });
    step = cards[0].offsetWidth + parseFloat(getComputedStyle(track).columnGap || 24);
    per = Math.max(1, Math.round((vp.clientWidth + step - cards[0].offsetWidth) / step));
    cards.forEach((c, i) => { c.style.display = i < pages * per ? '' : 'none'; c.style.scrollSnapAlign = i % per ? 'none' : 'start'; });
  };
  const setDots = p => { page = p; $$('button', dots).forEach((b, i) => b.classList.toggle('is-active', i === p)); };
  const pageAt = () => {
    const max = vp.scrollWidth - vp.clientWidth;
    return vp.scrollLeft >= max - 2 ? pages - 1 : Math.min(pages - 1, Math.max(0, Math.round(vp.scrollLeft / (per * step))));
  };
  // Trong lúc cuộn tự động (mũi tên/chấm), giữ chấm ở trang đích để không nháy qua trang giữa
  let lock = false, lockTimer = 0;
  const unlock = () => { lock = false; clearTimeout(lockTimer); setDots(pageAt()); };
  const go = (p, smooth = true) => {
    p = (p + pages) % pages; setDots(p);
    const left = p * per * step;
    if (smooth && Math.abs(vp.scrollLeft - left) > 1) { lock = true; clearTimeout(lockTimer); lockTimer = setTimeout(unlock, 900); }
    vp.scrollTo({ left, behavior: smooth ? 'smooth' : 'auto' });
  };
  let raf = 0;
  vp.addEventListener('scroll', () => { if (lock) return; cancelAnimationFrame(raf); raf = requestAnimationFrame(() => setDots(pageAt())); }, { passive: true });
  vp.addEventListener('scrollend', () => { if (lock) unlock(); });
  // Người dùng chạm/vuốt/lăn ngay trong lúc đang cuộn tự động → trả quyền cập nhật chấm
  ['touchstart', 'wheel'].forEach(t => vp.addEventListener(t, () => { if (lock) unlock(); }, { passive: true }));
  $$('.reviews__nav').forEach(b => b.addEventListener('click', () => go(page + +b.dataset.dir)));
  $$('button', dots).forEach((b, i) => b.addEventListener('click', () => go(i)));

  // Kéo bằng chuột (cảm ứng dùng cuộn gốc của trình duyệt)
  let drag = null, justDragged = false;
  vp.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    if (lock) unlock();
    drag = { x: e.clientX, left: vp.scrollLeft, start: pageAt(), moved: false, id: e.pointerId };
  });
  vp.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > 5) {
      drag.moved = true; vp.classList.add('is-dragging'); try { vp.setPointerCapture(drag.id); } catch (_) { /* con trỏ đã nhả */ }
      getSelection()?.removeAllRanges();
    }
    if (drag.moved) { e.preventDefault(); vp.scrollLeft = drag.left - dx; }
  });
  const endDrag = e => {
    if (!drag) return; const d = drag; drag = null;
    if (!d.moved) return;
    const dx = e.clientX - d.x;
    vp.classList.remove('is-dragging');
    // Kéo quá 15% bề rộng thẻ → sang trang kế theo hướng kéo (không vòng ở hai đầu)
    let target = d.start;
    if (Math.abs(dx) > step * 0.15) target = Math.min(pages - 1, Math.max(0, d.start + (dx < 0 ? 1 : -1)));
    go(target);
    justDragged = true; setTimeout(() => { justDragged = false; }, 0);
  };
  vp.addEventListener('pointerup', endDrag);
  vp.addEventListener('pointercancel', endDrag);
  vp.addEventListener('lostpointercapture', e => { if (drag) endDrag(e); });
  // Không kích hoạt link/nút bên trong thẻ sau một lần kéo; không kéo ảnh/chữ kiểu "ghost"
  vp.addEventListener('click', e => { if (justDragged) { e.preventDefault(); e.stopPropagation(); } }, true);
  vp.addEventListener('dragstart', e => e.preventDefault());

  const relayout = () => { layout(); go(page, false); };
  window.addEventListener('resize', relayout); relayout();

  // Đặt bàn nhanh → chuyển sang trang Đặt bàn kèm thông tin
  const form = $('.quick-book');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const f = form.phone.closest('.field'); const raw = form.phone.value.trim();
    f.classList.toggle('is-error', raw !== '' && !FB.isPhone(raw));
    if (f.classList.contains('is-error')) return;
    const q = new URLSearchParams({ date: form.date.value, time: form.time.value, guests: form.guests.value || '', phone: FB.normPhone(raw) });
    location.href = 'dat_ban.html?' + q.toString();
  });
});
