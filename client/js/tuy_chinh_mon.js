/* =====================================================================
   FIABESCO PALACE — js/tuy_chinh_mon.js  (module dùng chung, MỚI)
   Một nguồn duy nhất cho:
   • Tùy chọn của món: khẩu phần + topping (lấy từ FB_DETAIL nếu món có trang chi tiết
     riêng, còn lại dùng bộ mặc định đang có của dự án; tráng miệng/đồ uống không có tùy chọn).
   • Tính giá, tạo nhãn lựa chọn, đọc lại lựa chọn cũ trong giỏ, gộp dòng trùng.
   • Popup tùy chỉnh món (A3) — dùng ở Trang chủ, Thực đơn, Giỏ hàng, Thanh toán.
   • Popup tùy chỉnh combo (B1).
   • Panel "Chỉnh sửa lựa chọn" trong Giỏ hàng (C3).
   • Điểm thành viên dự kiến + popup thành viên (C2).
   Nạp SAU main.js và popups.js. Cần js/data/chi_tiet_mon.js để có tùy chọn riêng từng món.
   ===================================================================== */
(function () {
  if (!window.FB || !window.FB_DATA) return;
  const { $, $$, icon: I, vnd, money, Cart } = FB;
  const D = window.FB_DATA;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const MAX_QTY = 20;
  const dishOf = id => (D.dishes || []).find(d => d.id === id) || null;
  const comboOf = id => (D.combos || []).find(c => c.id === id) || null;

  /* =================================================================
     1. TÙY CHỌN CỦA MÓN
     ================================================================= */
  // Bộ mặc định = đúng các lựa chọn đang có trên trang Chi tiết món (Lasagna) & panel sửa món của Giỏ hàng.
  const DEFAULT_SIZES = [{ label: 'Phần tiêu chuẩn', note: '1 người', add: 0 }, { label: 'Phần lớn', note: '2 người', add: 60000 }];
  const DEFAULT_TOPS = [{ name: 'Phô mai Mozzarella', price: 25000 }, { name: 'Nấm truffle đen', price: 45000 }, { name: 'Bánh mì bơ tỏi (2 lát)', price: 20000 }];
  const NO_CUSTOM = new Set(['trang-mieng', 'do-uong']); // tráng miệng & đồ uống: bán theo phần, không topping
  const cleanNote = n => String(n || '').replace(/\s*·\s*\+?[\d.]+\s*$/, '').trim(); // "2 người · +60.000" → "2 người"

  function optionsFor(id) {
    const d = dishOf(id); if (!d) return null;
    const X = (window.FB_DETAIL || {})[id];
    if (X && Array.isArray(X.sizes) && X.sizes.length) {
      return { sizes: X.sizes.map(s => ({ label: s.label, note: cleanNote(s.note), add: +s.add || 0 })),
        tops: (X.toppings || []).map(t => ({ name: t.name, price: +t.price || 0 })) };
    }
    if (NO_CUSTOM.has(d.cat)) return { sizes: [{ label: 'Phần tiêu chuẩn', note: '1 phần', add: 0 }], tops: [] };
    return { sizes: DEFAULT_SIZES.map(s => ({ ...s })), tops: DEFAULT_TOPS.map(t => ({ ...t })) };
  }
  const baseName = n => n.replace(/\s*\(.*\)\s*$/, '').replace(/^Thêm\s+/i, '').replace(/\s+thêm$/i, '').trim();

  /** Lựa chọn hợp lệ (bỏ các giá trị món không hỗ trợ). sel = { size, tops[], note } */
  function normSel(id, sel = {}) {
    const o = optionsFor(id); if (!o) return { size: '', tops: [], note: '' };
    const size = (o.sizes.find(s => s.label === sel.size) || o.sizes[0]).label;
    const tops = o.tops.filter(t => (sel.tops || []).includes(t.name)).map(t => t.name); // thứ tự theo dữ liệu → nhãn ổn định
    return { size, tops, note: String(sel.note || '').trim().slice(0, 200) };
  }
  function unitPrice(id, sel) {
    const d = dishOf(id), o = optionsFor(id); if (!d || !o) return 0;
    const s = normSel(id, sel);
    return d.price + (o.sizes.find(x => x.label === s.size) || { add: 0 }).add + o.tops.filter(t => s.tops.includes(t.name)).reduce((a, t) => a + t.price, 0);
  }
  function labelOf(id, sel) {
    const s = normSel(id, sel);
    return [s.size, ...s.tops.map(t => '+ ' + t)].concat(s.note ? ['Ghi chú: ' + s.note] : []).join(' · ');
  }
  /** Đọc lại lựa chọn từ dòng giỏ cũ (chỉ có chuỗi opt) */
  function parseOpt(id, opt) {
    const o = optionsFor(id); if (!o) return { size: '', tops: [], note: '' };
    const str = String(opt || '');
    let size = o.sizes[0].label;
    o.sizes.forEach(s => { if (str.includes(s.label)) size = s.label; });
    if (/Size Lớn/.test(str) && o.sizes[1]) size = o.sizes[1].label; // định dạng popup xem nhanh cũ
    const tops = o.tops.filter(t => str.includes(t.name) || str.includes(baseName(t.name))).map(t => t.name);
    const note = (str.match(/Ghi chú: (.+)$/) || [])[1] || '';
    return normSel(id, { size, tops, note });
  }
  const selOf = it => (it.sel && it.sel.size !== undefined && !it.combo ? normSel(it.id, it.sel) : parseOpt(it.id, it.opt));

  /* =================================================================
     2. COMBO
     ================================================================= */
  // Món trong combo trỏ tới món thật của thực đơn (để lấy ảnh & tùy chọn).
  const COMBO_INFO = {
    'combo-an-y': { people: 'Dành cho 2 người · 3 món', desc: 'Bộ ba hương vị Ý kinh điển: risotto bò đậm đà, salad Caprese tươi mát và mì Ý cua sốt kem — vừa đủ cho bữa tối hai người.',
      items: [{ id: 'risotto-bo-barolo', name: 'Risotto Bò', qty: 1 }, { id: 'caprese', name: 'Salad cà chua phô mai Caprese', qty: 1 }, { id: 'mi-cua', name: 'Mì Ý Cua', qty: 1 }] },
    'combo-gia-dinh': { people: 'Dành cho 4 người · 5 món', desc: 'Bữa tối sum vầy cho cả nhà: hai pizza nướng lò đá, hai phần mì Ý và salad tươi để cả nhà cùng chia sẻ — tiết kiệm hơn so với gọi lẻ từng món.',
      items: [{ id: 'pizza-margherita', name: 'Pizza Margherita', qty: 2 }, { id: 'bolognese', name: 'Mì Ý Bò Bằm Phô Mai', qty: 2 }, { id: 'burrata', name: 'Salad Phô Mai Burrata', qty: 1 }] },
    'combo-dong-am': { people: 'Dành cho 2 người · 3 món', desc: 'Ấm bụng ngày mưa: súp Minestrone nóng hổi, risotto kem phô mai và ấm trà thảo mộc thơm dịu.',
      items: [{ id: 'minestrone', name: 'Súp Minestrone', qty: 1 }, { id: 'risotto-kem', name: 'Cơm Risotto Kem Phô Mai', qty: 1 }, { id: null, name: 'Trà thảo mộc Ý', qty: 1 }] }
  };
  const comboItems = cid => (COMBO_INFO[cid] || { items: [] }).items;
  /** sel combo = { items: [{ size, tops[] }] } theo đúng thứ tự món trong combo */
  function comboNormSel(cid, sel = {}) {
    return { items: comboItems(cid).map((m, k) => m.id && optionsFor(m.id) ? normSel(m.id, (sel.items || [])[k] || {}) : { size: '', tops: [], note: '' }) };
  }
  function comboExtra(cid, sel) {
    const s = comboNormSel(cid, sel);
    return comboItems(cid).reduce((sum, m, k) => {
      if (!m.id) return sum; const d = dishOf(m.id); if (!d) return sum;
      return sum + (unitPrice(m.id, s.items[k]) - d.price) * m.qty; // phụ thu × số phần của món trong combo
    }, 0);
  }
  const comboUnit = (cid, sel) => (comboOf(cid) || { price: 0 }).price + comboExtra(cid, sel);
  function comboLabel(cid, sel) {
    const info = COMBO_INFO[cid]; const s = comboNormSel(cid, sel);
    const parts = comboItems(cid).map((m, k) => {
      if (!m.id) return ''; const o = optionsFor(m.id); const x = s.items[k];
      const bits = [x.size !== o.sizes[0].label ? x.size : '', ...x.tops.map(t => '+ ' + t)].filter(Boolean);
      return bits.length ? `${m.name}: ${bits.join(', ')}` : '';
    }).filter(Boolean);
    return [info ? info.people.replace('Dành cho ', '') : 'Combo', ...parts].join(' · ');
  }

  /* =================================================================
     3. GIỎ HÀNG — thêm / sửa / gộp dòng tương đương
     ================================================================= */
  const keyOf = it => it.id + '|' + it.opt;
  function mergeCart(items) {
    const out = [];
    items.forEach(it => { const ex = out.find(x => keyOf(x) === keyOf(it) && !!x.combo === !!it.combo); if (ex) ex.qty = Math.min(99, ex.qty + it.qty); else out.push(it); });
    return out;
  }
  function makeItem(id, qty, sel) {
    if (comboOf(id) && !dishOf(id)) { const s = comboNormSel(id, sel); return { id, qty, opt: comboLabel(id, s), unit: comboUnit(id, s), sel: s, combo: true }; }
    const s = normSel(id, sel); return { id, qty, opt: labelOf(id, s), unit: unitPrice(id, s), sel: s };
  }
  function addToCart(id, qty, sel) { const it = makeItem(id, qty, sel); Cart.set(mergeCart(Cart.get().concat([it]))); return it; }
  /** Thay dòng thứ index bằng lựa chọn mới; trả về khóa mới (id|opt) */
  function replaceInCart(index, id, qty, sel) {
    const items = Cart.get(); if (!items[index]) return null;
    const it = makeItem(id, qty, sel); items[index] = it; Cart.set(mergeCart(items)); return keyOf(it);
  }

  /* =================================================================
     4. THÀNH PHẦN GIAO DIỆN DÙNG CHUNG
     ================================================================= */
  const tick = () => `<span class="fb-tick" aria-hidden="true">${I('check')}</span>`;
  function sizesHTML(id, cur, name) {
    const d = dishOf(id), o = optionsFor(id); if (!o || o.sizes.length < 2) return '';
    return `<div class="pp-sizes cz-sizes" role="radiogroup" aria-label="Khẩu phần">${o.sizes.map(s => `<button type="button" role="radio" class="pp-size${s.label === cur ? ' is-active' : ''}" aria-checked="${s.label === cur}" data-cz-size="${esc(s.label)}"${name !== undefined ? ` data-cz-item="${name}"` : ''}><strong>${esc(s.label)}</strong><small>${esc(s.note)}${s.note ? ' · ' : ''}${s.add ? '+' + vnd(s.add) : vnd(d.price)}</small></button>`).join('')}</div>`;
  }
  function topsHTML(id, cur, name) {
    const o = optionsFor(id); if (!o || !o.tops.length) return '';
    return `<div class="cz-tops">${o.tops.map(t => `<label class="cz-top"><input type="checkbox" data-cz-top="${esc(t.name)}"${name !== undefined ? ` data-cz-item="${name}"` : ''}${cur.includes(t.name) ? ' checked' : ''}>${tick()}<span class="cz-top__name">${esc(t.name)}</span><em class="cz-top__price">+${vnd(t.price)}</em></label>`).join('')}</div>`;
  }
  const stepper = q => `<div class="stepper cz-qty" data-cz-qty><button type="button" data-q="-1" aria-label="Giảm số lượng">${I('minus')}</button><output aria-live="polite">${q}</output><button type="button" data-q="1" aria-label="Tăng số lượng">${I('plus')}</button></div>`;
  function popup(id, html, cls) {
    let el = document.getElementById(id); if (el) el.remove();
    el = document.createElement('div'); el.className = 'modal'; el.id = id;
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
    el.innerHTML = `<div class="pp-box ${cls}">${html}</div>`;
    document.body.appendChild(el); FB.hydrateIcons(el); FB.openModal(id);
    const h = el.querySelector('h3'); if (h) { h.id = id + '-title'; el.setAttribute('aria-labelledby', h.id); }
    const back = document.activeElement;
    // Trả focus về nút đã mở popup khi đóng
    const obs = new MutationObserver(() => { if (!el.classList.contains('is-open')) { obs.disconnect(); if (back && back.focus && document.contains(back)) back.focus({ preventScroll: true }); } });
    obs.observe(el, { attributes: true, attributeFilter: ['class'] });
    setTimeout(() => { const f = el.querySelector('.pp-x'); f && f.focus({ preventScroll: true }); }, 60);
    return el;
  }
  const closeX = (white) => `<button type="button" class="pp-x${white ? ' pp-x--white' : ''}" data-close aria-label="Đóng">${I('close')}</button>`;
  const qtyOf = el => +$('[data-cz-qty] output', el).textContent;
  function bindQty(el, onChange) {
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-cz-qty] [data-q]'); if (!b) return;
      const o = $('[data-cz-qty] output', el); o.textContent = Math.max(1, Math.min(MAX_QTY, +o.textContent + +b.dataset.q));
      onChange();
    });
  }

  /* =================================================================
     5. POPUP TÙY CHỈNH MÓN (A3)
     opts: { qty, sel, mode: 'add'|'edit', onSave(sel, qty) }
     ================================================================= */
  const RATING = { burrata: '4.9/5 (214 đánh giá)', lasagna: '4.9/5 (128 đánh giá)' };
  function openCustomize(id, opts = {}) {
    const d = dishOf(id); if (!d) { if (comboOf(id)) return openCombo(id, opts); return; }
    const o = optionsFor(id); const edit = opts.mode === 'edit';
    let sel = normSel(id, opts.sel || {});
    const X = (window.FB_DETAIL || {})[id];
    const rate = X ? `${X.rating}/5 (${X.reviews} đánh giá)` : RATING[id];
    const el = popup('pp-customize', `${closeX(true)}<div class="pp-split cz">
      <div class="pp-split__media cz__media"><img src="${d.img}" alt="${esc(d.name)}"></div>
      <div class="pp-split__body cz__body">
        <span class="pp-eyebrow">${edit ? 'Chỉnh sửa lựa chọn' : 'Tùy chỉnh món'}</span>
        <h3 class="t-h3">${esc(d.name)}</h3>
        ${rate ? `<div class="pp-rate">${I('star')}${rate}</div>` : ''}
        <p class="t-body c-gray">${esc(d.desc)}</p>
        <div class="cz-base"><span>Giá cơ bản</span><b class="money">${money(d.price)}</b></div>
        ${o.sizes.length > 1 ? `<span class="pp-eyebrow pp-eyebrow--gray">Chọn khẩu phần</span>${sizesHTML(id, sel.size)}` : ''}
        ${o.tops.length ? `<div class="cz-head"><span class="pp-eyebrow pp-eyebrow--gray">Topping thêm</span><small>Chọn nhiều</small></div>${topsHTML(id, sel.tops)}` : `<p class="cz-none">Món này được phục vụ theo phần tiêu chuẩn, không có topping thêm.</p>`}
        <label class="cz-note"><span class="pp-eyebrow pp-eyebrow--gray">Ghi chú cho bếp</span><input type="text" maxlength="200" data-cz-note placeholder="Ví dụ: ít cay, không hành…" value="${esc(sel.note)}"></label>
        <div class="cz-total"><span>Tổng cộng</span><b class="money" data-cz-sum></b></div>
        <div class="pp-buy cz-buy">${stepper(opts.qty || 1)}<button type="button" class="btn btn--navy cz-cta" data-cz-ok>${edit ? 'Lưu thay đổi' : 'Thêm vào giỏ hàng'}</button></div>
        <a class="pp-link" href="chi_tiet_mon.html?id=${encodeURIComponent(id)}">Xem chi tiết món →</a>
      </div></div>`, 'pp-box--920');
    const calc = () => { $('[data-cz-sum]', el).textContent = money(unitPrice(id, sel) * qtyOf(el)); };
    el.addEventListener('click', e => {
      const s = e.target.closest('[data-cz-size]'); if (!s) return;
      sel.size = s.dataset.czSize; $$('[data-cz-size]', el).forEach(b => { const on = b === s; b.classList.toggle('is-active', on); b.setAttribute('aria-checked', on); }); calc();
    });
    el.addEventListener('change', e => { if (e.target.matches('[data-cz-top]')) { sel.tops = $$('[data-cz-top]:checked', el).map(x => x.dataset.czTop); calc(); } });
    $('[data-cz-note]', el).addEventListener('input', e => { sel.note = e.target.value; });
    bindQty(el, calc); calc();
    $('[data-cz-ok]', el).addEventListener('click', () => {
      const q = qtyOf(el); const s = normSel(id, sel);
      FB.closeModal(el);
      if (opts.onSave) { opts.onSave(s, q); return; }
      const it = addToCart(id, q, s);
      FB.openAdded ? FB.openAdded(id, q, it.opt, it.unit) : FB.toast('Đã thêm vào giỏ hàng', `${q} × ${d.name}`, 'Xem giỏ', 'gio_hang.html', 'navy');
    });
    return el;
  }

  /* =================================================================
     6. POPUP TÙY CHỈNH COMBO (B1)
     ================================================================= */
  function openCombo(cid, opts = {}) {
    const c = comboOf(cid); const info = COMBO_INFO[cid]; if (!c || !info) return;
    const edit = opts.mode === 'edit';
    let sel = comboNormSel(cid, opts.sel || {});
    const rows = info.items.map((m, k) => {
      const d = m.id && dishOf(m.id); const o = d && optionsFor(m.id);
      const custom = o && (o.sizes.length > 1 || o.tops.length);
      return `<div class="cz-ci${custom ? '' : ' is-fixed'}">
        <div class="pp-combo-item"><img src="${d ? d.img : c.img}" alt=""><div><strong>${esc(m.name)}</strong><small data-ci-sub="${k}"></small></div><b>x${m.qty}</b></div>
        ${custom ? `<details class="cz-ci__opt"${k === 0 ? ' open' : ''}><summary>${I('edit')}Tùy chỉnh món này<span class="cz-ci__note">Phụ thu tính theo ${m.qty} phần</span></summary>
          ${o.sizes.length > 1 ? `<span class="pp-eyebrow pp-eyebrow--gray">Khẩu phần</span>${sizesHTML(m.id, sel.items[k].size, k)}` : ''}
          ${o.tops.length ? `<span class="pp-eyebrow pp-eyebrow--gray">Topping thêm</span>${topsHTML(m.id, sel.items[k].tops, k)}` : ''}</details>`
        : `<p class="cz-ci__fixed">Món cố định trong combo — không có tùy chỉnh.</p>`}</div>`;
    }).join('');
    const el = popup('pp-combo', `${closeX(true)}<div class="pp-split cz">
      <div class="pp-split__media pp-split__media--fit cz__media"><img src="${c.img}" alt="${esc(c.name)}"></div>
      <div class="pp-split__body cz__body">
        <span class="pp-eyebrow">${edit ? 'Chỉnh sửa combo' : 'Chi tiết combo'}</span><h3 class="t-h3">${esc(c.name)}</h3>
        <div class="pp-rate" style="color:var(--gray)">${I('users')}${esc(info.people)}</div>
        <p class="t-body c-gray">${esc(info.desc)}</p>
        <div class="cz-base"><span>Giá combo</span><b class="money">${money(c.price)}</b></div>
        <span class="pp-eyebrow pp-eyebrow--gray">Combo gồm</span>
        <div class="cz-cis">${rows}</div>
        <span class="pp-note">Không áp dụng đổi món trong combo. Bạn có thể nâng khẩu phần hoặc thêm topping cho món hỗ trợ; combo được đóng gói riêng từng món để giữ nhiệt khi giao.</span>
        <div class="cz-total"><span>Phụ thu tùy chỉnh / combo</span><b class="money" data-cz-extra></b></div>
        <div class="cz-total cz-total--main"><span>Tổng cộng</span><b class="money" data-cz-sum></b></div>
        <div class="pp-buy cz-buy">${stepper(opts.qty || 1)}<button type="button" class="btn btn--navy cz-cta" data-cz-ok>${edit ? 'Lưu thay đổi' : 'Thêm vào giỏ hàng'}</button></div>
      </div></div>`, 'pp-box--920');
    const calc = () => {
      sel = comboNormSel(cid, sel);
      info.items.forEach((m, k) => {
        const sub = $(`[data-ci-sub="${k}"]`, el); if (!sub) return;
        if (!m.id || !optionsFor(m.id)) { sub.textContent = 'Khẩu phần: Tiêu chuẩn'; return; }
        const x = sel.items[k], add = (unitPrice(m.id, x) - dishOf(m.id).price) * m.qty;
        sub.textContent = [x.size, ...x.tops.map(t => '+ ' + t)].join(' · ') + (add ? ` (+${vnd(add)})` : '');
      });
      $('[data-cz-extra]', el).textContent = (comboExtra(cid, sel) ? '+' : '') + money(comboExtra(cid, sel));
      $('[data-cz-sum]', el).textContent = money(comboUnit(cid, sel) * qtyOf(el));
    };
    el.addEventListener('click', e => {
      const s = e.target.closest('[data-cz-size]'); if (!s) return;
      const k = +s.dataset.czItem; sel.items[k].size = s.dataset.czSize;
      $$(`[data-cz-size][data-cz-item="${k}"]`, el).forEach(b => { const on = b === s; b.classList.toggle('is-active', on); b.setAttribute('aria-checked', on); }); calc();
    });
    el.addEventListener('change', e => {
      if (!e.target.matches('[data-cz-top]')) return; const k = +e.target.dataset.czItem;
      sel.items[k].tops = $$(`[data-cz-top][data-cz-item="${k}"]:checked`, el).map(x => x.dataset.czTop); calc();
    });
    bindQty(el, calc); calc();
    $('[data-cz-ok]', el).addEventListener('click', () => {
      const q = qtyOf(el); const s = comboNormSel(cid, sel); FB.closeModal(el);
      if (opts.onSave) { opts.onSave(s, q); return; }
      const it = addToCart(cid, q, s);
      FB.openAdded ? FB.openAdded(cid, q, 'Combo · ' + it.opt, it.unit) : FB.toast('Đã thêm vào giỏ hàng', c.name, 'Xem giỏ', 'gio_hang.html', 'navy');
    });
    return el;
  }

  /** Mở popup sửa cho 1 dòng giỏ (món hoặc combo). onDone(newKey) sau khi lưu. */
  function editCartLine(index, onDone) {
    const it = Cart.get()[index]; if (!it) return false;
    const save = (s, q) => { const k = replaceInCart(index, it.id, q, s); onDone && onDone(k, keyOf(it)); FB.toast('Đã cập nhật lựa chọn', (dishOf(it.id) || comboOf(it.id) || {}).name || '', '', '', 'navy'); };
    if (it.combo || (!dishOf(it.id) && comboOf(it.id))) { openCombo(it.id, { mode: 'edit', qty: it.qty, sel: it.sel || {}, onSave: save }); return true; }
    if (!dishOf(it.id)) return false;
    openCustomize(it.id, { mode: 'edit', qty: it.qty, sel: selOf(it), onSave: save }); return true;
  }

  /* =================================================================
     7. PANEL "CHỈNH SỬA LỰA CHỌN" TRONG GIỎ HÀNG (C3) — giữ bố cục Figma PC – 04b
     ================================================================= */
  function openInlineEdit(row) {
    $$('.pp-edit').forEach(x => x.remove());
    const i = +row.dataset.i; const it = Cart.get()[i]; if (!it) return false;
    if (it.combo || !dishOf(it.id)) return editCartLine(i, () => window.FB_CART_RENDER && window.FB_CART_RENDER());
    const d = dishOf(it.id), o = optionsFor(it.id);
    let sel = selOf(it); // bản nháp — dữ liệu giỏ chỉ đổi khi bấm Lưu
    const panel = document.createElement('div'); panel.className = 'pp-edit';
    panel.setAttribute('role', 'group'); panel.setAttribute('aria-label', 'Chỉnh sửa lựa chọn ' + d.name);
    panel.innerHTML = `<div class="pp-row"><strong class="row t-title" style="gap:8px;font-size:16px">${I('edit')}Chỉnh sửa lựa chọn</strong><button type="button" class="t-body-s c-gray" data-cancel>Thu gọn ▴</button></div>
      ${o.sizes.length > 1 ? `<span class="pp-edit__label">Kích cỡ</span>${sizesHTML(it.id, sel.size)}` : ''}
      ${o.tops.length ? `<span class="pp-edit__label">Thêm topping</span>${topsHTML(it.id, sel.tops)}` : ''}
      <span class="pp-edit__label">Ghi chú cho bếp</span>
      <textarea data-note placeholder="Ít cay, không hành…" maxlength="200">${esc(sel.note)}</textarea>
      <div class="pp-edit__actions"><button type="button" class="btn btn--outline" data-cancel>Huỷ</button><button type="button" class="btn btn--navy" data-save>Lưu thay đổi · <span data-sum class="money"></span></button></div>`;
    row.after(panel); FB.hydrateIcons(panel);
    const calc = () => { $('[data-sum]', panel).textContent = money(unitPrice(it.id, sel) * it.qty); };
    calc();
    panel.addEventListener('change', e => { if (e.target.matches('[data-cz-top]')) { sel.tops = $$('[data-cz-top]:checked', panel).map(x => x.dataset.czTop); calc(); } });
    panel.addEventListener('click', e => {
      const p = e.target.closest('[data-cz-size]'); if (p) { sel.size = p.dataset.czSize; $$('[data-cz-size]', panel).forEach(b => { const on = b === p; b.classList.toggle('is-active', on); b.setAttribute('aria-checked', on); }); calc(); }
      if (e.target.closest('[data-cancel]')) panel.remove(); // hủy: không ghi gì vào giỏ
      if (e.target.closest('[data-save]')) {
        sel.note = $('[data-note]', panel).value;
        replaceInCart(i, it.id, it.qty, sel); panel.remove();
        window.FB_CART_RENDER && window.FB_CART_RENDER();
        FB.toast('Đã cập nhật món', d.name, '', '', 'navy');
      }
    });
    panel.addEventListener('keydown', e => { if (e.key === 'Escape') { panel.remove(); row.querySelector('.cart-item__edit')?.focus(); } });
    return true;
  }

  /* =================================================================
     8. ĐIỂM THÀNH VIÊN (C2)
     Quy tắc hiện có của Giỏ hàng: 1 điểm / 10.000 VND tổng thanh toán.
     Điểm chỉ là DỰ KIẾN — được cộng vào tài khoản khi đơn chuyển sang "Đã nhận món".
     ================================================================= */
  const TIERS = [['Bạc', 0], ['Vàng', 1000], ['Bạch Kim', 2000]]; // trùng với js/pages/thanh_vien.js
  const PERKS = {
    'Bạc': ['Tích 1 điểm cho mỗi 10.000 VND', 'Quà chào mừng thành viên', 'Đổi điểm lấy Tiramisu từ 300 điểm'],
    'Vàng': ['Tích 1 điểm cho mỗi 10.000 VND', 'Đổi ưu đãi giảm 10% hóa đơn từ 500 điểm', 'Ưu tiên giữ bàn đẹp khi đặt trước'],
    'Bạch Kim': ['Giảm 10% mọi hóa đơn', 'Ưu đãi gói Cầu hôn / Sinh nhật', 'Ưu tiên giữ bàn đẹp khi đặt trước']
  };
  const pointsFor = total => Math.max(0, Math.round((+total || 0) / 10000));
  const getUser = () => (FB.getUser ? FB.getUser() : null);
  function openPoints(expected) {
    const u = getUser();
    if (u) {
      const pts = +u.points || 0;
      const tier = ([...TIERS].reverse().find(t => pts >= t[1]) || TIERS[0])[0];
      const next = TIERS.find(t => pts < t[1]);
      const pct = next ? Math.min(100, Math.round(pts / next[1] * 100)) : 100;
      popup('pp-points', `${closeX()}<div class="pp-pad">
        <div class="mb-hero pt-hero">
          <span class="pt-hero__av">${esc(u.name.trim().split(/\s+/).slice(-2).map(w => w[0]).join('').toUpperCase())}</span>
          <div class="pt-hero__info"><h3 class="pt-hero__name">${esc(u.name)}</h3><span class="pt-hero__tier">${I('star')}Thành viên ${esc(tier)}${u.code ? ' • ' + esc(u.code) : ''}</span></div>
          <div class="pt-hero__pts"><b>${vnd(pts)} điểm</b><span>${next ? 'Hạng kế: ' + next[0] : 'Hạng cao nhất'}</span></div>
          <div class="pt-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="Tiến độ lên hạng"><i style="width:${pct}%"></i></div>
          <p class="pt-hero__note">${next ? `Còn ${vnd(next[1] - pts)} điểm để lên hạng ${next[0]}` : 'Bạn đang ở hạng Bạch Kim – giảm 10% mọi hóa đơn.'}</p>
        </div>
        <div class="pt-expect"><span>${I('gift')}Điểm dự kiến từ đơn này</span><b>+${vnd(expected)} điểm</b></div>
        <p class="t-body-s c-gray">Điểm dự kiến <strong>chưa</strong> nằm trong ${vnd(pts)} điểm hiện có. Điểm được cộng vào tài khoản khi đơn hàng được giao thành công; đơn bị hủy sẽ không được tích điểm.</p>
        <span class="pp-eyebrow pp-eyebrow--gray">Quyền lợi hạng ${esc(tier)}</span>
        <ul class="pt-perks">${PERKS[tier].map(p => `<li>${I('check')}<span>${esc(p)}</span></li>`).join('')}</ul>
        <div class="pp-actions"><button type="button" class="btn btn--outline" data-close>Đóng</button><a class="btn btn--navy" href="thanh_vien.html#the-thanh-vien">Xem thành viên</a></div>
      </div>`, 'pp-box--500');
      return;
    }
    popup('pp-points', `${closeX()}<div class="pp-pad pp-center">
      <span class="pp-badge">${I('gift')}</span>
      <span class="pp-eyebrow">Fiabesco Membership</span>
      <h3 class="t-h3">Đừng bỏ lỡ +${vnd(expected)} điểm thưởng</h3>
      <p class="t-body c-gray">Đăng nhập hoặc tạo tài khoản thành viên trước khi thanh toán để đơn hàng này được tích điểm và đổi ưu đãi cho những lần sau.</p>
      <details class="pt-program"><summary>Xem thông tin chương trình thành viên</summary>
        <ul class="pt-perks">${TIERS.map(([t, p]) => `<li>${I('star')}<span><strong>${t}</strong> (từ ${vnd(p)} điểm): ${esc(PERKS[t].join(' · '))}</span></li>`).join('')}</ul>
        <p class="t-caption c-gray">Tích 1 điểm cho mỗi 10.000 VND. Điểm được cộng khi đơn hàng giao thành công.</p></details>
      <div class="pp-actions"><a class="btn btn--outline" href="thanh_vien.html#dang-ky">Đăng ký</a><a class="btn btn--navy" href="thanh_vien.html#dang-nhap">Đăng nhập</a></div>
    </div>`, 'pp-box--500');
  }
  /** Biến 1 phần tử ".points" thành nút mở popup; text cập nhật qua setPoints(el, total) */
  function bindPoints(el, getTotal) {
    if (!el || el.dataset.ptBound) return; el.dataset.ptBound = '1';
    el.classList.add('points--btn'); el.setAttribute('role', 'button'); el.tabIndex = 0;
    el.setAttribute('aria-haspopup', 'dialog');
    if (!el.querySelector('.points__go')) el.insertAdjacentHTML('beforeend', `<span class="points__go" aria-hidden="true">${I('chevron-right')}</span>`);
    const go = () => openPoints(pointsFor(getTotal()));
    el.addEventListener('click', go);
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  }

  /* ---------- Gắn vào hệ thống hiện có ---------- */
  Object.assign(FB, {
    Custom: { optionsFor, normSel, unitPrice, labelOf, parseOpt, selOf, makeItem, addToCart, replaceInCart, mergeCart, keyOf, comboItems, comboNormSel, comboUnit, comboLabel, COMBO_INFO, sizesHTML, topsHTML, tick, pointsFor, TIERS },
    openCustomize, openQuickView: openCustomize, openCombo, openInlineEdit, editCartLine, openPoints, bindPoints, pointsFor
  });
})();
