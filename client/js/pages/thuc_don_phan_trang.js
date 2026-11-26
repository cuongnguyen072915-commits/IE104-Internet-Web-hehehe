/* Thực đơn – phân trang 12 món/trang (Figma: “PC – 02g Thực đơn – Tất cả (Trang 1–8/8)”).
   Nạp SAU ../js/pages/thuc_don.js. Không sửa logic lọc/tìm kiếm của thuc_don.js:
   mỗi khi #grid được render lại, file này chia các thẻ món thành trang và vẽ lại thanh #pager.
   B5: luôn có nút Trang trước / Trang sau (khi còn trang), hiện trang hiện tại + các trang liền kề,
   dấu “…” khi bị lược; số trang tính động từ số món sau lọc; Mobile rút gọn còn ±1 trang. */
document.addEventListener('fb:ready', () => {
  const { $, $$, icon } = FB;
  const grid = $('#grid'), pager = $('#pager'), meta = $('#list-meta');
  if (!grid || !pager) return;
  const SIZE = (window.FB_DATA && FB_DATA.PAGE_SIZE) || 12;
  const mobile = window.matchMedia('(max-width: 600px)');
  let page = 1, busy = false;

  /* Dãy số trang. Ví dụ trang 3/10 (Desktop): 1 2 [3] 4 5 … 10 — Mobile: 1 2 [3] 4 … 10 */
  function slots(p, n) {
    const r = mobile.matches ? 1 : 2;
    const set = new Set([1, n]);
    for (let i = p - r; i <= p + r; i++) if (i >= 1 && i <= n) set.add(i);
    const nums = [...set].sort((a, b) => a - b), out = [];
    nums.forEach((v, i) => {
      if (i) { const gap = v - nums[i - 1]; if (gap === 2) out.push(v - 1); else if (gap > 2) out.push('…'); }
      out.push(v);
    });
    return out;
  }

  function apply() {
    busy = true;
    const cards = $$(':scope > .dish', grid);
    const pages = Math.max(1, Math.ceil(cards.length / SIZE));
    page = Math.min(Math.max(1, page), pages); // trang không còn hợp lệ → về trang hợp lệ gần nhất
    cards.forEach((c, i) => { c.hidden = i < (page - 1) * SIZE || i >= page * SIZE; });

    // Dòng “Hiển thị …” – giữ phần “· Bộ lọc: …” do thuc_don.js tạo
    if (meta && cards.length) {
      const txt = meta.textContent;
      const total = (txt.match(/\/\s*(\d+)\s*món/) || [])[1] || cards.length;
      const filter = txt.includes(' · Bộ lọc:') ? txt.slice(txt.indexOf(' · Bộ lọc:')) : '';
      const a = (page - 1) * SIZE + 1, b = Math.min(page * SIZE, cards.length);
      const shown = cards.length > SIZE ? `${a}–${b}` : `${cards.length}`;
      meta.textContent = `Hiển thị ${shown} / ${total} món` + (pages > 1 ? ` · Trang ${page}/${pages}` : '') + filter;
    }

    if (!cards.length || pages <= 1) { pager.hidden = true; pager.innerHTML = ''; }
    else {
      pager.hidden = false;
      pager.innerHTML =
        (page > 1 ? `<button class="pager__nav" aria-label="Trang trước" data-page="${page - 1}">${icon('chevron-left')}</button>` : '')
        + slots(page, pages).map(s => s === '…'
          ? '<span class="pager__gap" aria-hidden="true">…</span>'
          : `<button class="${s === page ? 'is-active' : ''}" data-page="${s}" aria-label="Trang ${s}"${s === page ? ' aria-current="page"' : ''}>${s}</button>`).join('')
        + (page < pages ? `<button class="pager__nav" aria-label="Trang sau" data-page="${page + 1}">${icon('chevron-right')}</button>` : '');
    }
    busy = false;
  }

  // Cuộn về đầu danh sách món, chừa chỗ cho Header dính
  function toListTop() {
    const head = $('.site-header'); const anchor = $('#list-title') || grid;
    const y = anchor.getBoundingClientRect().top + window.scrollY - ((head && head.offsetHeight) || 0) - 24;
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
  }

  pager.addEventListener('click', e => {
    const b = e.target.closest('button[data-page]'); if (!b) return;
    e.stopImmediatePropagation();
    page = +b.dataset.page; apply(); toListTop();
    const cur = pager.querySelector('[aria-current="page"]'); if (cur) cur.focus({ preventScroll: true });
  }, true);

  // thuc_don.js render lại lưới khi đổi danh mục / tìm kiếm / lọc / sắp xếp → về trang 1
  new MutationObserver(() => { if (!busy) { page = 1; apply(); } }).observe(grid, { childList: true });
  mobile.addEventListener ? mobile.addEventListener('change', apply) : mobile.addListener(apply);
  apply();
});
