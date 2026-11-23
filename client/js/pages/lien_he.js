/* Liên hệ: chọn chi nhánh ↔ ghim bản đồ, chủ đề, kiểm tra form */
document.addEventListener('fb:ready', () => {
  const { $, $$, icon } = FB;
  const B = [
    ['Fiabesco Lê Lợi', 'Chi nhánh chính', '68 Lê Lợi, P. Bến Nghé, Quận 1', '0123 456 789', '10:00 – 22:30', '2,4 km', 270, 260, 'Lê Lợi · Q.1'],
    ['Fiabesco Thảo Điền', 'Sân vườn', '25 Xuân Thủy, P. Thảo Điền, TP. Thủ Đức', '0123 456 790', '10:00 – 22:00', '6,8 km', 600, 110, 'Thảo Điền'],
    ['Fiabesco Phú Mỹ Hưng', 'Tiệc riêng', '102 Tôn Dật Tiên, Quận 7', '0123 456 791', '10:30 – 22:00', '9,1 km', 470, 470, 'Phú Mỹ Hưng']
  ];
  $('#branch-list').innerHTML = B.map(([n, tag, a, p, h, d], i) => `<div class="branch${i ? '' : ' is-active'}" data-i="${i}" tabindex="0" role="button">
    <div class="between"><div class="branch__name"><h3>${n}</h3><span class="branch__tag">${tag}</span></div><span class="branch__dist">${d}</span></div>
    <div class="branch__line">${icon('location-pin')}${a}</div>
    <div class="row" style="gap:24px"><span class="branch__line">${icon('phone')}${p}</span><span class="branch__line">${icon('clock')}${h}</span></div>
    <a class="branch__dir" href="https://maps.google.com/?q=${encodeURIComponent(a + ', TP. Hồ Chí Minh')}" target="_blank" rel="noopener">${icon('directions')}Chỉ đường</a></div>`).join('');
  $('#pins').innerHTML = B.map((b, i) => `<div class="pin${i ? '' : ' is-active'}" data-i="${i}" style="left:${b[6] / 736 * 100}%;top:${b[7] / 560 * 100}%"><span class="pin__dot">${icon('chef-hat')}</span><span class="pin__label">${b[8]}</span></div>`).join('');
  const select = i => { $$('.branch').forEach(x => x.classList.toggle('is-active', +x.dataset.i === i)); $$('.pin').forEach(x => x.classList.toggle('is-active', +x.dataset.i === i)); $('select[name=branch]').selectedIndex = i; };
  $$('.branch').forEach(b => { b.addEventListener('click', e => { if (!e.target.closest('a')) select(+b.dataset.i); }); b.addEventListener('keydown', e => { if (e.key === 'Enter') select(+b.dataset.i); }); });
  $$('.pin').forEach(p => p.addEventListener('click', () => select(+p.dataset.i)));
  const [zin, zout] = $$('.zoom button'); zin.onclick = () => $('.branch-map').classList.add('is-zoom'); zout.onclick = () => $('.branch-map').classList.remove('is-zoom');

  $$('#topics .chip').forEach(c => c.addEventListener('click', () => $$('#topics .chip').forEach(x => x.classList.toggle('is-active', x === c))));
  if (location.hash === '#tuyen-dung') $$('#topics .chip')[2].click();

  const form = $('#contact-form');
  // Nhận dữ liệu đặt bàn nhanh từ trang chủ, điền sẵn để khách tiếp tục.
  const q = new URLSearchParams(location.search);
  const input = key => form.elements.namedItem(key);
  if (q.has('phone')) input('phone').value = q.get('phone') || '';
  if (q.has('date') || q.has('time') || q.has('guests')) {
    const details = [q.get('date') && 'Ngày: ' + q.get('date'),
      q.get('time') && 'Giờ: ' + q.get('time'),
      q.get('guests') && 'Số khách: ' + q.get('guests')].filter(Boolean).join(' · ');
    input('msg').value = 'Tôi muốn liên hệ đặt bàn. ' + details;
  }
  form.addEventListener('submit', e => {
    e.preventDefault();
    const v = { name: input('name').value.trim() !== '', phone: FB.isPhone(input('phone').value), email: !input('email').value.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input('email').value.trim()), msg: input('msg').value.trim() !== '' };
    $$('[data-req]', form).forEach(f => f.classList.toggle('is-error', !v[f.dataset.req]));
    if (Object.values(v).every(Boolean)) {
      FB.modal({ id: 'm-sent', icon: 'check', tone: 'green', title: 'Đã kiểm tra nội dung', desc: 'Đây là bản demo giao diện, yêu cầu chưa được gửi tới nhà hàng. Vui lòng gọi hotline để xác nhận đặt bàn hoặc gửi liên hệ.', actions: [{ label: 'Đóng', style: 'navy' }] });
      FB.openModal('m-sent'); form.reset();
    }
  });
});
