/* Thực đơn – phân trang 12 món/trang (Figma: “PC – 02g Thực đơn – Tất cả (Trang 1–8/8)”).
   File MỚI, nạp SAU ../js/pages/thuc_don.js. Không sửa logic lọc/tìm kiếm của thuc_don.js:
   mỗi khi #grid được render lại, file này chia các thẻ món thành trang và vẽ lại thanh #pager. */
document.addEventListener('fb:ready', () => {
  const { $, $$, icon } = FB;
  const grid = $('#grid'), pager = $('#pager'), meta = $('#list-meta');
  if (!grid || !pager) return;
  const SIZE = (window.FB_DATA && FB_DATA.PAGE_SIZE) || 12;
  let page = 1, busy = false;

  /* Dãy nút giống Figma: 1 2 3 … 8 | 1 … p … 8 | 1 … 6 7 8 */
  function slots(p, n) {
    if (n <= 5) return Array.from({ length: n }, (_, i) => i + 1);
    if (p <= 2) return [1, 2, 3, '…', n];
    if (p >= n - 1) return [1, '…', n - 2, n - 1, n];
    return [1, '…', p, '…', n];
  }

  function apply() {
    busy = true;
    const cards = $$(':scope > .dish', grid);
    const pages = Math.max(1, Math.ceil(cards.length / SIZE));
    if (page > pages) page = pages;
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

    // Thanh phân trang
    if (!cards.length || pages <= 1) { pager.hidden = true; pager.innerHTML = ''; }
    else {
      pager.hidden = false;
      pager.innerHTML = slots(page, pages).map(s => s === '…'
        ? '<button disabled>…</button>'
        : `<button class="${s === page ? 'is-active' : ''}" data-page="${s}">${s}</button>`).join('')
        + (page < pages ? `<button aria-label="Trang sau" data-page="${page + 1}">${icon('chevron-right')}</button>` : '');
    }
    busy = false;
  }

  pager.addEventListener('click', e => {
    const b = e.target.closest('button[data-page]'); if (!b) return;
    e.stopImmediatePropagation();
    page = +b.dataset.page; apply();
    grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, true);

  // thuc_don.js render lại lưới khi đổi danh mục / tìm kiếm / lọc / sắp xếp → về trang 1
  new MutationObserver(() => { if (!busy) { page = 1; apply(); } }).observe(grid, { childList: true });
  apply();
});
