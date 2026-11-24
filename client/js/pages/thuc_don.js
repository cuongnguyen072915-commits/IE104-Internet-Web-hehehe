/* Thực đơn: danh mục, tìm kiếm (E05), bộ lọc, sắp xếp, ngoài giờ nhận đơn (E04) */
document.addEventListener('fb:ready', () => {
  const { $, $$, icon, dishCard, money } = FB;
  const D = FB_DATA;
  const MENU_IDS = ['burrata', 'lasagna', 'bolognese', 'risotto-kem', 'risotto-ga', 'carbonara'];
  const state = { cat: 'all', q: '', price: null, veg: false, sort: 'pop', filtered: false };
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

  $('#cats').innerHTML = D.categories.map((c, i) => `<li class="${i ? '' : 'is-active'}"><button data-cat="${c.id}"><img src="${c.img}" alt=""><span>${c.name}</span><em>${c.count}</em></button></li>`).join('');
  $('#combos').innerHTML = D.combos.map(c => `<article class="combo reveal"><img src="${c.img}" alt="${c.name}" loading="lazy"><div class="combo__body">
    <h3 class="t-title">${c.name}</h3><p class="t-body-s c-gray">${c.desc}</p>
    <div class="between"><span class="t-price c-wine">${money(c.price)}</span><button class="combo__more" data-combo="${c.id}">Chi tiết ${icon('chevron-right')}</button></div></div></article>`).join('');

  function render() {
    let list = (state.cat === 'all' && !state.q && !state.filtered) ? MENU_IDS.map(D.byId) : D.dishes.slice();
    if (state.cat !== 'all') list = list.filter(d => d.cat === state.cat);
    if (state.q) list = list.filter(d => norm(d.name + ' ' + d.desc).includes(norm(state.q)));
    if (state.filtered && state.price) { const [a, b] = state.price; list = list.filter(d => d.price >= a && d.price <= b); }
    if (state.filtered && state.veg) list = list.filter(d => d.veg);
    if (state.sort === 'asc') list.sort((a, b) => a.price - b.price);
    if (state.sort === 'desc') list.sort((a, b) => b.price - a.price);
    const searching = !!state.q;
    $('#combo-block').hidden = searching;
    $('#list-title').textContent = searching ? `Kết quả cho “${state.q}”` : (state.cat === 'all' ? 'Bán chạy' : D.categories.find(c => c.id === state.cat).name);
    const f = filterLabel();
    $('#list-meta').textContent = `Hiển thị ${list.length} / ${D.categories.find(c => c.id === state.cat).count} món` + (f ? ' · Bộ lọc: ' + f : '');
    $('#grid').innerHTML = list.map(d => dishCard(d)).join('');
    const empty = list.length === 0;
    $('#empty').hidden = !empty; $('#pager').hidden = empty; $('#grid').hidden = empty;
    $('#search').classList.toggle('is-error', empty && searching);
    if (empty) {
      $('#empty-title').textContent = searching ? `Không tìm thấy “${state.q}”` : 'Không có món phù hợp bộ lọc';
      $('#empty-desc').textContent = `Thử từ khóa ngắn hơn, kiểm tra chính tả hoặc bỏ bớt bộ lọc${f ? ' “' + f + '”' : ''}.`;
    }
    FB.initReveal();
  }
  function filterLabel() {
    const p = $('#price .is-active'); const parts = [];
    if (p) parts.push(p.textContent.trim()); if ($('[name=veg]').checked) parts.push('Thuần chay');
    if ($('[name=mild]').checked) parts.push('Không cay'); if ($('[name=gf]').checked) parts.push('Không gluten');
    return parts.join(', ');
  }

  $('#cats').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $$('#cats li').forEach(li => li.classList.toggle('is-active', li.contains(b))); state.cat = b.dataset.cat; render(); });
  $('#search').addEventListener('submit', e => { e.preventDefault(); state.q = e.target.q.value.trim(); render(); });
  $('#search input').addEventListener('input', e => { if (!e.target.value) { state.q = ''; render(); } });
  $$('#price .chip').forEach(c => c.addEventListener('click', () => { const on = !c.classList.contains('is-active'); $$('#price .chip').forEach(x => x.classList.remove('is-active')); c.classList.toggle('is-active', on); }));
  $('#filters').addEventListener('submit', e => {
    e.preventDefault(); const p = $('#price .is-active');
    state.price = p ? p.dataset.p.split('-').map(Number) : null; state.veg = $('[name=veg]').checked; state.filtered = true; render();
    $('#grid').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  $('#to-filter').addEventListener('click', () => $('#filters').scrollIntoView({ behavior: 'smooth', block: 'center' }));
  $('#reset').addEventListener('click', () => { state.q = ''; state.filtered = false; state.cat = 'all'; $('#search input').value = ''; $$('#cats li').forEach((li, i) => li.classList.toggle('is-active', i === 0)); render(); });
  $('#suggest').addEventListener('click', e => { const c = e.target.closest('[data-q]'); if (!c) return; state.q = c.dataset.q; $('#search input').value = c.dataset.q; render(); });
  $$('#pager button').forEach(b => b.addEventListener('click', () => { if (b.disabled || b.querySelector('.ic')) return; $$('#pager button').forEach(x => x.classList.toggle('is-active', x === b)); $('#grid').scrollIntoView({ behavior: 'smooth' }); }));
  $$('.combo__more').forEach(b => b.addEventListener('click', () => FB.openCombo(b.dataset.combo)));

  // Dropdown "Giao đến" & "Sắp xếp"
  $$('.dd').forEach(dd => {
    const btn = $('[data-dd]', dd), menu = $('.dd__menu', dd);
    btn.addEventListener('click', e => { if (btn.dataset.dd === 'area' && FB.openAddress) { FB.openAddress(); return; } e.stopPropagation(); $$('.dd').forEach(x => x !== dd && x.classList.remove('is-open')); dd.classList.toggle('is-open'); });
    menu.addEventListener('click', e => {
      const o = e.target.closest('button'); if (!o) return;
      $$('button', menu).forEach(x => x.classList.toggle('is-active', x === o)); dd.classList.remove('is-open');
      if (btn.dataset.dd === 'sort') { state.sort = o.dataset.sort; $('span', btn).textContent = 'Sắp xếp: ' + o.textContent; render(); }
      else $('span', btn).textContent = 'Giao đến: ' + o.textContent;
    });
  });
  document.addEventListener('click', () => $$('.dd').forEach(x => x.classList.remove('is-open')));

  if (location.hash === '#tim-kiem') setTimeout(() => $('#search input').focus(), 300);
  const q = FB.params.get('q'); if (q) { state.q = q; $('#search input').value = q; }
  render();

  // E04 – Ngoài giờ nhận đơn (10:00 – 22:00)
  const now = new Date(); const h = now.getHours();
  if (FB.demo === 'closed' || h >= 22 || h < 10) {
    const hh = String(h).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    FB.modal({ id: 'm-closed', icon: 'clock', title: 'Bếp đã ngừng nhận đơn hôm nay',
      desc: 'Bạn vẫn có thể đặt trước — đơn sẽ được giao từ 10:30 sáng mai, hoặc đặt bàn cho bữa tối ngày mai.',
      extra: `<div class="alert alert--gold" style="width:100%;align-items:center"><span class="c-wine">${icon('clock')}</span><span class="t-body-s">Giờ nhận đơn: 10:00 – 22:00 · Hiện tại ${FB.demo === 'closed' ? '22:47' : hh}</span></div>`,
      actions: [{ label: 'Đặt bàn', style: 'outline', href: 'lien_he.html' }, { label: 'Hẹn giao 10:30 mai', style: 'navy' }] });
    FB.openModal('m-closed');
  }
});
