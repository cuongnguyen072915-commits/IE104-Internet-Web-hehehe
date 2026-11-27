/* =====================================================================
   FIABESCO PALACE — js/pages/thuc_don_popup.js  (CHỈ nạp ở Trang Thực đơn)
   Popup chi tiết / tùy chỉnh món dạng "Italian Split-Screen":
   trái nền navy + ảnh món tròn lớn, phải nền trắng chứa khẩu phần, topping, ghi chú, số lượng.
   • Chỉ thay GIAO DIỆN. Logic tùy chọn / tính giá / thêm giỏ dùng lại FB.Custom (js/tuy_chinh_mon.js)
     → cùng một giỏ hàng, cùng cách gộp dòng, cùng popup "Đã thêm vào giỏ".
   • Trang chủ & các trang khác không nạp file này → vẫn dùng popup A3 hiện có.
   • Chế độ sửa dòng giỏ (mode 'edit' / onSave) và combo vẫn chuyển về popup gốc.
   Nạp SAU tuy_chinh_mon.js.
   ===================================================================== */
(function () {
  if (!window.FB || !window.FB_DATA || !FB.Custom || !FB.openCustomize) return;
  const { $, $$, icon: I, vnd, money } = FB;
  const C = FB.Custom, D = window.FB_DATA;
  const base = FB.openCustomize;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const MAX_QTY = 20, MAX_NOTE = 200;

  // Câu nhấn tiếng Ý (trang trí) — riêng vài món, còn lại theo chương
  const IT_DISH = { 'pizza-margherita': 'La regina di Napoli', tiramisu: 'Il dolce più amato', limoncello: 'Il sole di Amalfi', espresso: 'Un caffè, per favore' };
  const IT_CHAP = { 'khai-vi': 'Per cominciare', sup: 'Calda come a casa', 'mi-y': 'La pasta, sempre', risotto: 'Mantecato con pazienza', salad: 'Fresca dell’orto',
    nuong: 'Alla griglia', pizza: 'Dal forno a legna', 'trang-mieng': 'Per finire in dolcezza', 'do-uong': 'Un sorso d’Italia' };
  // Ghi chú nhanh theo chương
  const QUICK = { pizza: ['Cắt 8 miếng', 'Nướng giòn hơn', 'Không hành'], 'trang-mieng': ['Ít ngọt', 'Đóng gói riêng', 'Thêm muỗng'],
    'do-uong': ['Ít đá', 'Ít ngọt', 'Không đá'], _: ['Ít cay', 'Không hành', 'Ít muối'] };
  const BADGE = { 'best seller': 'Bán chạy', 'mới': 'Món mới' };

  function openMenuDish(id, opts = {}) {
    const d = D.byId(id), o = C.optionsFor(id); if (!d || !o) return base(id, opts);
    const ch = FB.menuChapter ? FB.menuChapter(d) : { id: d.cat, label: '' };
    const sel = C.normSel(id, opts.sel || {});
    const quick = QUICK[ch.id] || QUICK._;
    const badge = d.tag ? BADGE[d.tag.trim().toLowerCase()] || d.tag : '';
    const req = o.sizes.length > 1;

    const sizes = req ? `<section class="mz-sec">
        <div class="mz-sec__head"><span class="mz-sec__t" id="mz-size-t">Chọn khẩu phần</span><small>Bắt buộc</small></div>
        <div class="mz-sizes" role="radiogroup" aria-labelledby="mz-size-t">${o.sizes.map(s => `<button type="button" role="radio" class="mz-size${s.label === sel.size ? ' is-active' : ''}" aria-checked="${s.label === sel.size}" data-cz-size="${esc(s.label)}">
          <strong>${esc(s.label)}</strong>${s.note ? `<small>${esc(s.note)}</small>` : ''}<em class="money">${s.add ? '+' + money(s.add) : money(d.price)}</em></button>`).join('')}</div></section>` : '';
    const tops = o.tops.length ? `<section class="mz-sec">
        <div class="mz-sec__head"><span class="mz-sec__t">Thêm topping</span><small>Chọn nhiều</small></div>
        <div class="mz-tops">${o.tops.map(t => `<label class="mz-top"><input type="checkbox" data-cz-top="${esc(t.name)}"${sel.tops.includes(t.name) ? ' checked' : ''}>
          <span class="mz-top__tick" aria-hidden="true">${I('check')}</span><span class="mz-top__name">${esc(t.name)}</span><em class="mz-top__price">+${vnd(t.price)}</em></label>`).join('')}</div></section>` : '';

    const old = document.getElementById('pp-menu-dish'); if (old) old.remove();
    const el = document.createElement('div');
    el.className = 'modal mz-modal'; el.id = 'pp-menu-dish';
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'mz-title');
    el.innerHTML = `<div class="pp-box mz">
      <aside class="mz__art">
        ${badge ? `<span class="mz__badge">${esc(badge)}</span>` : ''}
        <div class="mz__plate"><span class="mz__ring mz__ring--a" aria-hidden="true"></span><span class="mz__ring mz__ring--b" aria-hidden="true"></span><img src="${d.img}" alt="${esc(d.name)}"></div>
        <div class="mz__intro"><p class="mz__it" lang="it">${esc(IT_DISH[id] || IT_CHAP[ch.id] || 'Buon appetito')}</p><p class="mz__desc">${esc(d.desc)}</p></div>
      </aside>
      <div class="mz__body">
        <button type="button" class="pp-x mz__x" data-close aria-label="Đóng">${I('close')}</button>
        <div class="mz__scroll">
          ${ch.label ? `<span class="mz__chap" lang="it">${esc(ch.label)}</span>` : ''}
          <div class="mz__head"><h3 class="mz__name" id="mz-title">${esc(d.name)}</h3><b class="mz__price money" data-mz-unit aria-live="polite"></b></div>
          ${sizes}${tops}
          ${!req && !o.tops.length ? '<p class="mz-none">Món được phục vụ theo phần tiêu chuẩn, không có tùy chọn thêm.</p>' : ''}
          <section class="mz-sec">
            <div class="mz-sec__head"><span class="mz-sec__t" id="mz-note-t">Ghi chú cho bếp</span><small>Không bắt buộc</small></div>
            <div class="mz-quick">${quick.map(q => `<button type="button" class="mz-pill" data-mz-quick="${esc(q)}" aria-pressed="false">${esc(q)}</button>`).join('')}</div>
            <div class="mz-note"><textarea data-cz-note maxlength="${MAX_NOTE}" rows="2" aria-labelledby="mz-note-t" placeholder="Bạn muốn nhắn gì với đầu bếp?">${esc(sel.note)}</textarea><small data-mz-count></small></div>
          </section>
          <a class="mz__link" href="chi_tiet_mon.html?id=${encodeURIComponent(id)}">Xem chi tiết món ${I('arrow-right')}</a>
        </div>
        <div class="mz__foot">
          <div class="stepper mz-qty" data-cz-qty><button type="button" data-q="-1" aria-label="Giảm số lượng">${I('minus')}</button><output aria-live="polite">${Math.max(1, Math.min(MAX_QTY, opts.qty || 1))}</output><button type="button" data-q="1" aria-label="Tăng số lượng">${I('plus')}</button></div>
          <button type="button" class="btn mz__cta" data-cz-ok>Thêm vào giỏ món · <span class="money" data-cz-sum></span></button>
        </div>
      </div>
    </div>`;
    document.body.appendChild(el); FB.hydrateIcons(el); FB.openModal(el.id);

    // Trả focus về nút đã mở popup khi đóng (X, Escape, bấm nền)
    const back = document.activeElement;
    const obs = new MutationObserver(() => { if (!el.classList.contains('is-open')) { obs.disconnect(); if (back && back.focus && document.contains(back)) back.focus({ preventScroll: true }); } });
    obs.observe(el, { attributes: true, attributeFilter: ['class'] });
    setTimeout(() => $('.mz__x', el).focus({ preventScroll: true }), 60);

    const note = $('[data-cz-note]', el), out = $('[data-cz-qty] output', el);
    const qty = () => +out.textContent;
    const calc = () => {
      const unit = C.unitPrice(id, sel);
      $('[data-mz-unit]', el).textContent = money(unit);          // giá của lựa chọn hiện tại — không có chữ "từ"
      $('[data-cz-sum]', el).textContent = money(unit * qty());   // tổng = đơn giá × số lượng
    };
    // Ghi chú nhanh ↔ textarea: bật pill = thêm cụm vào ghi chú, tắt = gỡ ra; gõ tay cũng đồng bộ trạng thái pill
    const parts = () => note.value.split(',').map(s => s.trim()).filter(Boolean);
    const syncNote = () => {
      sel.note = note.value;
      const p = parts().map(s => s.toLowerCase());
      $$('[data-mz-quick]', el).forEach(b => { const on = p.includes(b.dataset.mzQuick.toLowerCase()); b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', on); });
      $('[data-mz-count]', el).textContent = `${note.value.length}/${MAX_NOTE}`;
    };

    el.addEventListener('click', e => {
      const s = e.target.closest('[data-cz-size]');
      if (s) { sel.size = s.dataset.czSize; $$('[data-cz-size]', el).forEach(b => { const on = b === s; b.classList.toggle('is-active', on); b.setAttribute('aria-checked', on); }); calc(); return; }
      const q = e.target.closest('[data-cz-qty] [data-q]');
      if (q) { out.textContent = Math.max(1, Math.min(MAX_QTY, qty() + +q.dataset.q)); calc(); return; }
      const p = e.target.closest('[data-mz-quick]');
      if (p) {
        const v = p.dataset.mzQuick, cur = parts();
        const has = cur.some(x => x.toLowerCase() === v.toLowerCase());
        const next = has ? cur.filter(x => x.toLowerCase() !== v.toLowerCase()) : cur.concat(v);
        note.value = next.join(', ').slice(0, MAX_NOTE); syncNote();
      }
    });
    // Phím mũi tên trong nhóm khẩu phần (radiogroup)
    el.addEventListener('keydown', e => {
      const s = e.target.closest('[data-cz-size]'); if (!s || !/^Arrow(Left|Right|Up|Down)$/.test(e.key)) return;
      e.preventDefault(); const all = $$('[data-cz-size]', el); const k = all.indexOf(s) + (/Right|Down/.test(e.key) ? 1 : -1);
      const n = all[(k + all.length) % all.length]; n.focus(); n.click();
    });
    el.addEventListener('change', e => { if (e.target.matches('[data-cz-top]')) { sel.tops = $$('[data-cz-top]:checked', el).map(x => x.dataset.czTop); calc(); } });
    note.addEventListener('input', syncNote);
    // Mobile: bàn phím ảo không che ô ghi chú
    note.addEventListener('focus', () => setTimeout(() => note.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300));
    syncNote(); calc();

    $('[data-cz-ok]', el).addEventListener('click', () => {
      const q = qty(), s = C.normSel(id, sel);
      FB.closeModal(el);
      const it = C.addToCart(id, q, s); // cùng giỏ hàng / gộp dòng như popup gốc
      FB.openAdded ? FB.openAdded(id, q, it.opt, it.unit) : FB.toast('Đã thêm vào giỏ hàng', `${q} × ${d.name}`, 'Xem giỏ', 'gio_hang.html', 'navy');
    });
    return el;
  }

  // Trang Thực đơn: nút "+" trên thẻ món (popups.js gọi FB.openCustomize) → popup mới.
  // Sửa dòng giỏ / có onSave / combo → popup gốc.
  FB.openCustomize = (id, opts = {}) => (opts.mode === 'edit' || opts.onSave || !D.byId(id)) ? base(id, opts) : openMenuDish(id, opts);
  FB.openMenuDish = openMenuDish;
})();
