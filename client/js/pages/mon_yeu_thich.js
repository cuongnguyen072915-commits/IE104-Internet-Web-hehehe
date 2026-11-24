/* Món yêu thích: đọc danh sách đã lưu (FB.Fav – popups.js), lọc theo danh mục, thêm tất cả vào giỏ, trạng thái trống */
document.addEventListener('fb:ready', () => {
  const { $, Cart } = FB; const D = FB_DATA;
  if (FB.demo === 'empty') FB.Fav.set([]);
  let cat = 'all';
  const items = () => FB.Fav.all().map(id => D.byId(id)).filter(d => d && d.cat);

  function render() {
    const all = items(); const empty = !all.length;
    $('#fav-list').hidden = empty; $('#fav-head').querySelector('#fav-all').hidden = empty; $('#fav-empty').hidden = !empty;
    $('#fav-sub').textContent = empty ? 'Bạn chưa lưu món nào' : `${all.length} món bạn đã lưu · Bấm ♥ để bỏ khỏi danh sách`;
    if (empty) { $('#fav-suggest').innerHTML = ['burrata', 'lasagna', 'bolognese', 'risotto-kem'].map(id => FB.dishCard(D.byId(id))).join(''); FB.initReveal(); return; }
    const counts = all.reduce((m, d) => (m[d.cat] = (m[d.cat] || 0) + 1, m), {});
    if (cat !== 'all' && !counts[cat]) cat = 'all';
    $('#fav-chips').innerHTML = `<button type="button" role="tab" class="chip${cat === 'all' ? ' is-active' : ''}" data-cat="all">Tất cả <span>(${all.length})</span></button>` +
      Object.keys(counts).map(c => `<button type="button" role="tab" class="chip${cat === c ? ' is-active' : ''}" data-cat="${c}">${(D.categories.find(x => x.id === c) || {}).name || c} <span>(${counts[c]})</span></button>`).join('');
    $('#fav-grid').innerHTML = all.filter(d => cat === 'all' || d.cat === cat).map(d => FB.dishCard(d)).join('');
    $('#fav-tip').innerHTML = FB.getUser && FB.getUser()
      ? 'Danh sách yêu thích đã được đồng bộ với tài khoản của bạn.'
      : 'Danh sách yêu thích được lưu theo tài khoản — <button type="button" class="c-wine" data-pp="login">đăng nhập</button> để xem trên mọi thiết bị.';
    FB.initReveal();
  }
  $('#fav-chips').addEventListener('click', e => { const c = e.target.closest('[data-cat]'); if (c) { cat = c.dataset.cat; render(); } });
  $('#fav-all').addEventListener('click', () => {
    const list = items().filter(d => cat === 'all' || d.cat === cat); list.forEach(d => Cart.add(d.id));
    FB.toast('Đã thêm vào giỏ hàng', `${list.length} món yêu thích đã được thêm`, 'Xem giỏ', 'gio_hang.html', 'navy');
  });
  document.addEventListener('fav:change', () => setTimeout(render, 180));
  render();
});
