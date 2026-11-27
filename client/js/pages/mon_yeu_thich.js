/* =====================================================================
   Món yêu thích — FIABESCO FAVORITES · YOUR PERSONAL COLLECTION
   - Nguồn dữ liệu DUY NHẤT: FB.Fav (popups.js, localStorage 'fb_fav_v1', món lưu gần nhất đứng đầu)
     → trái tim đồng bộ với Trang chủ / Thực đơn / Chi tiết món; không tạo hệ thống yêu thích thứ hai.
   - Thẻ món dùng lại class .dish / .dish__fav / .dish__add nên nút ♥ (bỏ/thêm yêu thích) và nút "+"
     (popup tùy chỉnh món của js/tuy_chinh_mon.js) chạy đúng như các trang khác.
   - Khách chưa đăng nhập vẫn lưu được món yêu thích (giữ hành vi hiện có).
   ===================================================================== */
document.addEventListener('fb:ready', () => {
  const { $, $$, icon: I, money, Cart } = FB; const D = FB_DATA;
  if (FB.demo === 'empty') FB.Fav.set([]);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').toLowerCase();
  const catName = id => (D.categories.find(c => c.id === id) || {}).name || '';
  const state = { cat: 'all', q: '', sort: 'recent' };
  const items = () => FB.Fav.all().map(id => D.dishes.find(d => d.id === id)).filter(Boolean); // giữ thứ tự lưu (mới nhất trước)

  const card = d => `<article class="dish fvc" data-id="${d.id}">
      <a class="dish__media fvc__media" href="chi_tiet_mon.html?id=${encodeURIComponent(d.id)}" tabindex="-1" aria-hidden="true"><img src="${d.img}" alt="" loading="lazy">
        ${d.tag ? `<span class="fvc__tag">${esc(d.tag)}</span>` : ''}</a>
      <button class="dish__fav fvc__fav is-active" aria-pressed="true" aria-label="Bỏ ${esc(d.name)} khỏi món yêu thích">${I('heart')}</button>
      <div class="fvc__body">
        <span class="fvc__cat">${esc(catName(d.cat))}</span>
        <a class="dish__name fvc__name" href="chi_tiet_mon.html?id=${encodeURIComponent(d.id)}">${esc(d.name)}</a>
        <p class="fvc__desc">${esc(d.desc)}</p>
        <div class="fvc__foot">
          <span class="dish__price fvc__price money">${money(d.price)}</span>
          <div class="fvc__acts">
            <a class="fvc__more" href="chi_tiet_mon.html?id=${encodeURIComponent(d.id)}">Xem chi tiết</a>
            <button class="dish__add fvc__add" aria-label="Tùy chỉnh và thêm ${esc(d.name)} vào giỏ">${I('plus')}</button>
          </div>
        </div>
      </div>
    </article>`;

  function render() {
    const all = items(); const empty = !all.length;
    $('#fv-list').hidden = empty; $('#fv-empty').hidden = !empty;
    const cats = [...new Set(all.map(d => d.cat))];
    $('#fv-stats').innerHTML = empty ? '<li><b>0</b><span>món đã lưu</span></li>'
      : `<li><b>${all.length}</b><span>món đã lưu</span></li><li><b>${cats.length}</b><span>danh mục</span></li>`;
    if (all[0]) $('#fv-hero-img').src = all[0].img;
    if (empty) {
      $('#fv-suggest').innerHTML = ['burrata', 'lasagna', 'bolognese', 'risotto-kem'].map(id => FB.dishCard(D.byId(id))).join('');
      FB.hydrateIcons($('#fv-suggest')); FB.initReveal(); return;
    }
    if (state.cat !== 'all' && !cats.includes(state.cat)) state.cat = 'all';
    // Chỉ hiện danh mục có món trong bộ sưu tập
    $('#fv-chips').innerHTML = [['all', 'Tất cả', all.length], ...cats.map(c => [c, catName(c), all.filter(d => d.cat === c).length])]
      .map(([id, n, k]) => `<button type="button" role="tab" class="fv-chip${state.cat === id ? ' is-active' : ''}" aria-selected="${state.cat === id}" data-cat="${id}">${esc(n)}<em>${k}</em></button>`).join('');
    let list = all.filter(d => (state.cat === 'all' || d.cat === state.cat) && (!state.q || norm(d.name + ' ' + d.desc).includes(norm(state.q))));
    if (state.sort === 'name') list = list.slice().sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    if (state.sort === 'asc') list = list.slice().sort((a, b) => a.price - b.price);
    if (state.sort === 'desc') list = list.slice().sort((a, b) => b.price - a.price);
    $('#fv-count').innerHTML = `Bộ sưu tập của bạn <span>— ${all.length} món ăn</span>`;
    $('#fv-grid').innerHTML = list.map(card).join('');
    $('#fv-none').hidden = !!list.length;
    $('#fv-none').textContent = list.length ? '' : `Không có món nào khớp “${state.q}”${state.cat !== 'all' ? ' trong ' + catName(state.cat) : ''}.`;
    $('#fv-tip').innerHTML = FB.getUser && FB.getUser()
      ? 'Danh sách yêu thích được lưu cùng tài khoản của bạn trên thiết bị này.'
      : 'Món yêu thích được lưu trên thiết bị này — <button type="button" class="c-wine" data-pp="login">đăng nhập</button> hoặc <button type="button" class="c-wine" data-pp="register">đăng ký</button> để nhận ưu đãi thành viên.';
    FB.hydrateIcons($('#fv-list'));
  }

  $('#fv-chips').addEventListener('click', e => { const c = e.target.closest('[data-cat]'); if (c) { state.cat = c.dataset.cat; render(); } });
  $('#fv-q').addEventListener('input', e => { state.q = e.target.value.trim(); render(); });
  $('#fv-sort').addEventListener('change', e => { state.sort = e.target.value; render(); });
  $('#fav-all').addEventListener('click', () => {
    const list = items().filter(d => state.cat === 'all' || d.cat === state.cat); list.forEach(d => Cart.add(d.id));
    FB.toast('Đã thêm vào giỏ hàng', `${list.length} món (phần tiêu chuẩn) — có thể chỉnh khẩu phần, topping trong giỏ`, 'Xem giỏ', 'gio_hang.html', 'navy');
  });
  // Bỏ ♥ ở đây (hoặc ở tab khác) → cập nhật ngay, có hiệu ứng mờ dần cho thẻ vừa bỏ
  document.addEventListener('fav:change', e => {
    const id = e.detail && e.detail.id; const el = id && !e.detail.on && $(`#fv-grid .fvc[data-id="${id}"]`);
    if (el) { el.classList.add('is-out'); setTimeout(render, 220); } else render();
  });
  window.addEventListener('storage', e => { if (e.key === 'fb_fav_v1') render(); });
  render();
});
