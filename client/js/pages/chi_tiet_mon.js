/* Chi tiết món: ảnh, kích cỡ, topping, số lượng, tab, trạng thái hết hàng (E06) */
document.addEventListener('fb:ready', () => {
  const { $, $$, money, vnd, dishCard } = FB;
  const id = FB.params.get('id') || 'lasagna';
  const d = FB_DATA.byId(id) || FB_DATA.byId('lasagna');
  const isLasagna = d.id === 'lasagna';

  if (!isLasagna) {
    document.title = d.name + ' – Fiabesco Palace';
    $$('[data-bind="name"]').forEach(e => e.textContent = d.name);
    $('[data-bind="tag"]').textContent = d.tag || 'Thủ công';
    $('[data-bind="long"]').textContent = d.desc;
    $('[data-bind="price-short"]').textContent = vnd(d.price);
    $('#base-price').textContent = money(d.price); $('#old-price').hidden = true; $('#off').hidden = true;
    $('#main-img').src = d.img; $('#main-img').alt = d.name;
    $('#thumbs').innerHTML = `<button class="is-active"><img src="${d.img}" alt=""></button>`;
    const cat = FB_DATA.categories.find(c => c.id === d.cat); if (cat) $$('#crumb a')[2].textContent = cat.name;
  }

  // Ảnh nhỏ → ảnh chính
  $('#thumbs').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $$('#thumbs button').forEach(x => x.classList.toggle('is-active', x === b)); $('#main-img').src = $('img', b).src; });

  let size = 0, qty = 1;
  const unit = () => d.price + size + $$('#tops input:checked').reduce((s, i) => s + +i.dataset.price, 0);
  const update = () => { $('#qty output').textContent = qty; $('#total').textContent = money(unit() * qty); };
  $$('#sizes .opt').forEach(o => o.addEventListener('click', () => { $$('#sizes .opt').forEach(x => x.classList.toggle('is-active', x === o)); size = +o.dataset.add; update(); }));
  $$('#tops input').forEach(i => i.addEventListener('change', update));
  const [minus, plus] = $$('#qty button');
  minus.addEventListener('click', () => { qty = Math.max(1, qty - 1); update(); });
  plus.addEventListener('click', () => { qty = Math.min(20, qty + 1); update(); });
  update();

  $('#add-btn').addEventListener('click', () => {
    const tops = $$('#tops input:checked').map(i => '+ ' + i.dataset.name);
    const opt = [$('#sizes .is-active strong').textContent].concat(tops).join(' · ');
    FB.Cart.add(d.id, qty, opt, unit());
    FB.toast('Đã thêm vào giỏ hàng', `${qty} × ${d.name}`, 'Xem giỏ', 'gio_hang.html', 'navy');
  });
  $('#fav').addEventListener('click', e => e.currentTarget.classList.toggle('is-active'));

  // Tabs
  $$('.tab').forEach(t => t.addEventListener('click', () => {
    $$('.tab').forEach(x => x.classList.toggle('is-active', x === t));
    $$('.pd-tabs__panel').forEach(p => p.hidden = p.dataset.panel !== t.dataset.tab);
  }));

  // Gợi ý đặt kèm
  $('#suggest').innerHTML = [['bruschetta'], ['burrata', 'Burrata tươi, cà chua bi, dầu ô liu.'], ['risotto-kem', 'Gạo Arborio, kem tươi, Grana Padano.'], ['bolognese', 'Sốt bò bằm hầm chậm cùng Parmigiano.']].map(([id, desc]) => dishCard(FB_DATA.byId(id), { desc })).join('');

  // E06 – Món tạm hết hàng
  if (FB.demo === 'soldout' || FB.params.get('stock') === '0') {
    document.body.classList.add('is-soldout');
    $('.pd__soldout').hidden = false; $('#soldout-alert').hidden = false;
    $('#add-btn').hidden = true; $('#notify-btn').hidden = false;
    $('#notify-btn').addEventListener('click', e => { e.currentTarget.textContent = 'Sẽ báo bạn khi có lại'; e.currentTarget.disabled = true; });
  }
});
