/* Trang chủ */
document.addEventListener('fb:ready', () => {
  const { $, $$, dishCard } = FB;
  // Món nổi bật: 4 thẻ như thiết kế
  const picks = ['burrata', 'lasagna', 'bolognese', 'risotto-kem'].map(FB_DATA.byId);
  $('#featured-grid').innerHTML = picks.map(d => dishCard(d, { tag: d.homeTag || d.tag })).join('');

  /* A5 · Sao chép mã giảm giá trong thẻ ưu đãi — không chuyển trang khi bấm vào mã,
     phần còn lại của thẻ vẫn là liên kết tới trang Khuyến mãi như cũ. */
  async function copyText(v) {
    try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(v); return true; } } catch (e) { /* dùng phương án dự phòng */ }
    const ta = document.createElement('textarea'); ta.value = v; ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none'; document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; } ta.remove(); return ok;
  }
  const doCopy = async el => {
    const code = el.dataset.copyCode; const ok = await copyText(code);
    el.classList.add('is-copied'); setTimeout(() => el.classList.remove('is-copied'), 1600);
    if (ok) FB.toast('Đã sao chép mã giảm giá!', `Mã ${code} đã sẵn sàng — dán ở bước Giỏ hàng để áp dụng.`, '', '', 'navy');
    else FB.toast('Chưa sao chép được tự động', `Trình duyệt chặn bộ nhớ tạm. Mã của bạn: ${code}`, '', '', 'navy');
  };
  document.addEventListener('click', e => { const c = e.target.closest('[data-copy-code]'); if (!c) return; e.preventDefault(); e.stopPropagation(); doCopy(c); }, true);
  document.addEventListener('keydown', e => { const c = e.target.closest && e.target.closest('[data-copy-code]'); if (!c || (e.key !== 'Enter' && e.key !== ' ')) return; e.preventDefault(); e.stopPropagation(); doCopy(c); }, true);

  /* A6 · Đánh giá — 9 nội dung khác nhau (3 cũ + 6 mới). ĐÂY LÀ DỮ LIỆU MINH HỌA của đồ án,
     không phải đánh giá đã xác minh từ Google/Foody (xem dòng ghi chú dưới carousel).
     [chữ cái avatar, tên, nhóm khách, số sao, nội dung] */
  const reviews = [
    ['A', 'Nguyễn Minh Anh', 'Khách đặt giao hàng', 5, 'Mì Lasagna đút lò rất đậm vị, giao đến vẫn còn nóng. Đóng gói đẹp, shipper lịch sự.'],
    ['B', 'Trần Quốc Bảo', 'Khách đặt bàn', 5, 'Không gian ấm cúng, phục vụ chu đáo. Risotto kem phô mai là món tôi gọi mỗi lần ghé.'],
    ['H', 'Lê Thu Hà', 'Thành viên Vàng', 5, 'Đặt bàn trực tuyến nhanh, tích điểm đổi ưu đãi rất tiện. Sẽ giới thiệu cho bạn bè.'],
    ['K', 'Phạm Gia Khang', 'Khách ăn tại nhà hàng', 5, 'Pizza Margherita đế mỏng, viền phồng và hơi cháy cạnh đúng kiểu lò củi. Mozzarella kéo sợi, cà chua ngọt chứ không chua gắt.'],
    ['L', 'Võ Ngọc Linh', 'Khách đặt giao hàng', 4, 'Carbonara sánh mịn mà không dùng kem, ăn rất “chuẩn bài”. Lần sau mong quán gửi thêm tiêu đen để mình tự rắc.'],
    ['T', 'Đỗ Minh Tuấn', 'Tiệc gia đình 8 người', 5, 'Tổ chức sinh nhật cho mẹ ở sân vườn, nhân viên tự chuẩn bị nến và chụp ảnh giúp cả nhà. Bé nhà mình mê món Tiramisu.'],
    ['V', 'Huỳnh Thảo Vy', 'Khách đặt giao hàng', 5, 'Đặt lúc trời mưa nhưng vẫn giao đúng giờ, từng hộp được bọc kín, súp Minestrone còn ấm. Tài xế gọi trước khi tới rất chu đáo.'],
    ['Q', 'Bùi Đăng Quang', 'Khách đặt bàn buổi tối', 4, 'Quầy vang có nhiều lựa chọn theo ly, nhân viên gợi ý Chianti hợp món bò. Cuối tuần khá đông nên nên đặt bàn trước.'],
    ['M', 'Trịnh Mai Phương', 'Thành viên Bạch Kim', 5, 'Mình dùng điểm thành viên đổi được phần Tiramisu và voucher giảm 10%. Ứng dụng hiển thị điểm rõ ràng, đổi quà chỉ mất vài bước.']
  ];
  const track = $('#reviews-track');
  const stars = n => `<span class="stars" aria-label="${n} trên 5 sao">${'★'.repeat(n)}<span class="stars__off">${'★'.repeat(5 - n)}</span></span>`;
  track.innerHTML = reviews.map(([i, n, r, s, t]) => `<article class="review"><div class="review__top">${stars(s)}<span class="review__mark">”</span></div>
    <p class="t-body-l">“${t}”</p><hr class="divider"><div class="review__who"><span class="review__av">${i}</span><div class="stack"><strong style="font:600 16px/1.4 var(--f-sans)">${n}</strong><span class="t-caption c-gray">${r}</span></div></div></article>`).join('');
  /* Carousel = vùng cuộn ngang gốc (.reviews__viewport): vuốt cảm ứng/touchpad có sẵn,
     scroll-snap dừng ở thẻ đầu mỗi trang; chuột kéo bằng pointer events. Mũi tên/chấm
     cuộn tới trang; chấm cập nhật theo vị trí cuộn. Mỗi trang = số thẻ vừa khung (3/2/1);
     số trang (và số chấm) tính lại theo số đánh giá khi đổi kích thước màn hình. */
  const dots = $('#reviews-dots'); const vp = track.parentElement; let page = 0; let pages = 3;
  let per = 1, step = 1;
  const layout = () => {
    const cards = [...track.children]; cards.forEach(c => { c.style.display = ''; });
    step = cards[0].offsetWidth + parseFloat(getComputedStyle(track).columnGap || 24);
    per = Math.max(1, Math.round((vp.clientWidth + step - cards[0].offsetWidth) / step));
    const n = Math.max(1, Math.ceil(cards.length / per));
    if (n !== pages || !dots.children.length) {
      pages = n;
      dots.innerHTML = Array.from({ length: pages }, (_, i) => `<button aria-label="Trang đánh giá ${i + 1}"></button>`).join('');
      $$('button', dots).forEach((b, i) => b.addEventListener('click', () => go(i)));
    }
    page = Math.min(page, pages - 1);
    cards.forEach((c, i) => { c.style.scrollSnapAlign = i % per ? 'none' : 'start'; });
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
  // Khung "Đặt bàn" chỉ còn nút liên kết tới dat_ban.html — không còn form cần xử lý.
});
