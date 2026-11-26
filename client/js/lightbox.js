/* =====================================================================
   FIABESCO PALACE — js/lightbox.js (MỚI) · Trình xem ảnh phóng to dùng chung
   Tách từ trang Chi tiết món (B3) để dùng lại cho ảnh @fiabescopalace ở Trang chủ (mục 8).
   FB.openLightbox(images, index, { onClose(index), zoom: true })
     images: [{ src, alt, cap? }] · cap: chú thích hiển thị dưới ảnh (tùy chọn)
   Hỗ trợ: nút +/−, lăn chuột, chụm 2 ngón, kéo để di chuyển, chuyển ảnh, Esc / X / nền để đóng.
   Nạp SAU main.js. CSS: css/lightbox.css
   ===================================================================== */
(function () {
  if (!window.FB) return;
  const { $, $$, icon: I } = FB;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const MIN = 1, MAX = 4;
  let lb = null, imgs = [], li = 0, scale = 1, tx = 0, ty = 0, opts = {}, opener = null;

  function open(list, i = 0, o = {}) {
    if (lb) close();
    imgs = list; li = i; opts = o; opener = document.activeElement;
    const zoom = o.zoom !== false;
    lb = document.createElement('div'); lb.className = 'modal pd-lb'; lb.id = 'pd-lightbox';
    lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Xem ảnh phóng to');
    lb.innerHTML = `<div class="pd-lb__bar">
        <span class="pd-lb__count" data-lb-count></span>
        <div class="pd-lb__tools">${zoom ? `<button type="button" data-lb-zoom="-1" aria-label="Thu nhỏ">${I('minus')}</button><span data-lb-pct>100%</span><button type="button" data-lb-zoom="1" aria-label="Phóng to">${I('plus')}</button>` : ''}
        <button type="button" class="pd-lb__x" data-lb-close aria-label="Đóng">${I('close')}</button></div></div>
      <div class="pd-lb__stage" data-lb-stage><img data-lb-img alt="" draggable="false"></div>
      <p class="pd-lb__cap" data-lb-cap hidden></p>
      ${imgs.length > 1 ? `<button type="button" class="pd-lb__nav pd-lb__nav--prev" data-lb-step="-1" aria-label="Ảnh trước">${I('chevron-left')}</button><button type="button" class="pd-lb__nav pd-lb__nav--next" data-lb-step="1" aria-label="Ảnh tiếp theo">${I('chevron-right')}</button>` : ''}
      <p class="pd-lb__hint">${zoom ? 'Lăn chuột hoặc chụm 2 ngón để phóng to · Kéo để di chuyển · ' : ''}Esc để đóng</p>`;
    document.body.appendChild(lb); FB.hydrateIcons(lb); FB.openModal('pd-lightbox');
    show(li); setTimeout(() => lb && $('[data-lb-close]', lb).focus(), 50);
    bind(zoom);
  }
  function close() {
    if (!lb) return; FB.closeModal(lb); const el = lb; lb = null; setTimeout(() => el.remove(), 0);
    if (opts.onClose) opts.onClose(li); // vd. carousel quay lại đúng ảnh đang xem
    else if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
  }
  function show(i) {
    li = (i + imgs.length) % imgs.length; const im = $('[data-lb-img]', lb), m = imgs[li];
    im.src = m.src; im.alt = m.alt || '';
    $('[data-lb-count]', lb).textContent = `${li + 1} / ${imgs.length}`;
    const cap = $('[data-lb-cap]', lb); cap.hidden = !m.cap; cap.textContent = m.cap || '';
    reset();
  }
  function clamp() {
    const st = $('[data-lb-stage]', lb), im = $('[data-lb-img]', lb);
    const mx = Math.max(0, (im.offsetWidth * scale - st.clientWidth) / 2), my = Math.max(0, (im.offsetHeight * scale - st.clientHeight) / 2);
    tx = Math.max(-mx, Math.min(mx, tx)); ty = Math.max(-my, Math.min(my, ty));
  }
  function apply() {
    if (!lb) return; clamp(); const im = $('[data-lb-img]', lb);
    im.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    const pct = $('[data-lb-pct]', lb); if (pct) pct.textContent = Math.round(scale * 100) + '%';
    const zo = $('[data-lb-zoom="-1"]', lb), zi = $('[data-lb-zoom="1"]', lb);
    if (zo) zo.disabled = scale <= MIN; if (zi) zi.disabled = scale >= MAX;
    lb.classList.toggle('is-zoomed', scale > 1);
  }
  const reset = () => { scale = 1; tx = ty = 0; apply(); };
  const zoomTo = (s, cx = 0, cy = 0) => { const ns = Math.max(MIN, Math.min(MAX, s)); const k = ns / scale; tx = cx - (cx - tx) * k; ty = cy - (cy - ty) * k; scale = ns; if (scale === 1) { tx = ty = 0; } apply(); };
  function bind(zoom) {
    const st = $('[data-lb-stage]', lb);
    lb.addEventListener('click', e => {
      if (e.target.closest('[data-lb-close]') || e.target === lb) return close();
      const z = e.target.closest('[data-lb-zoom]'); if (z) return zoomTo(scale + +z.dataset.lbZoom * 0.5);
      const s = e.target.closest('[data-lb-step]'); if (s) return show(li + +s.dataset.lbStep);
    });
    const center = e => { const r = st.getBoundingClientRect(); return [e.clientX - r.left - r.width / 2, e.clientY - r.top - r.height / 2]; };
    if (zoom) {
      st.addEventListener('wheel', e => { e.preventDefault(); const [cx, cy] = center(e); zoomTo(scale * (e.deltaY < 0 ? 1.2 : 1 / 1.2), cx, cy); }, { passive: false });
      st.addEventListener('dblclick', e => { const [cx, cy] = center(e); zoomTo(scale > 1 ? 1 : 2, cx, cy); });
    }
    // Kéo để di chuyển + chụm 2 ngón để phóng
    const pts = new Map(); let start = null;
    st.addEventListener('pointerdown', e => { st.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); start = { tx, ty, scale, pts: new Map(pts) }; });
    st.addEventListener('pointermove', e => {
      if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (zoom && pts.size === 2 && start.pts.size === 2) {
        const [a, b] = [...pts.values()], [a0, b0] = [...start.pts.values()];
        const dist = Math.hypot(a[0] - b[0], a[1] - b[1]), d0 = Math.hypot(a0[0] - b0[0], a0[1] - b0[1]) || 1;
        scale = Math.max(MIN, Math.min(MAX, start.scale * dist / d0)); if (scale === 1) { tx = ty = 0; } apply();
      } else if (pts.size === 1 && scale > 1) {
        const p0 = [...start.pts.values()][0]; tx = start.tx + e.clientX - p0[0]; ty = start.ty + e.clientY - p0[1]; apply();
      }
    });
    const up = e => { const was = pts.size; const p0 = start && start.pts.get(e.pointerId); pts.delete(e.pointerId); start = { tx, ty, scale, pts: new Map(pts) };
      if (was === 1 && scale === 1 && p0 && Math.abs(e.clientX - p0[0]) > 60) show(li + (e.clientX < p0[0] ? 1 : -1)); }; // vuốt ngang → chuyển ảnh
    st.addEventListener('pointerup', up); st.addEventListener('pointercancel', up);
    lb.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') show(li + 1); else if (e.key === 'ArrowLeft') show(li - 1);
      else if (zoom && (e.key === '+' || e.key === '=')) zoomTo(scale + 0.5); else if (zoom && e.key === '-') zoomTo(scale - 0.5);
      else if (e.key === 'Tab') { const f = $$('button:not([disabled])', lb); const i = f.indexOf(document.activeElement); if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); } }
    });
  }
  window.addEventListener('resize', () => lb && apply());
  // Esc: đóng lightbox trước khi trình đóng .modal chung của main.js chạy
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && lb) { e.preventDefault(); close(); } }, true);

  FB.openLightbox = open; FB.closeLightbox = close; FB.lightboxOpen = () => !!lb;
})();
