/* Đặt bàn: chọn chi nhánh, ngày, giờ, số khách, dịp; tóm tắt trực tiếp; kiểm tra form */
document.addEventListener('fb:ready', () => {
  const { $, $$, hydrateIcons } = FB;
  const form = $('#bk-form');

  /* ---------- Chi nhánh (cùng dữ liệu với trang Liên hệ) ---------- */
  const BRANCHES = [
    ['Fiabesco Lê Lợi', 'Chi nhánh chính', '68 Lê Lợi, P. Bến Nghé, Quận 1', '10:00 – 22:30'],
    ['Fiabesco Thảo Điền', 'Sân vườn', '25 Xuân Thủy, P. Thảo Điền, TP. Thủ Đức', '10:00 – 22:00'],
    ['Fiabesco Phú Mỹ Hưng', 'Tiệc riêng', '102 Tôn Dật Tiên, Quận 7', '10:30 – 22:00']
  ];
  $('#bk-branches').innerHTML = BRANCHES.map(([n, tag, a, h], i) => `
    <button type="button" class="bk-branch${i ? '' : ' is-active'}" role="radio" aria-checked="${!i}" data-i="${i}">
      <span class="bk-branch__top"><span class="radio"></span><strong>${n}</strong></span>
      <span class="bk-branch__tag">${tag}</span>
      <small>${a}</small><small>Mở cửa ${h}</small>
    </button>`).join('');

  /* ---------- Khung giờ: trưa & tối, mỗi 30 phút ---------- */
  const SLOTS = { 'Buổi trưa': ['11:00', '11:30', '12:00', '12:30', '13:00', '13:30'],
                  'Buổi tối': ['17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'] };
  $('#bk-slots').innerHTML = Object.entries(SLOTS).map(([g, list]) =>
    `<span class="bk-slot-group">${g}</span>` + list.map(t => `<button type="button" class="chip" role="radio" aria-checked="false" data-t="${t}">${t}</button>`).join('')).join('');

  const pad = n => String(n).padStart(2, '0');
  const today = new Date();
  const todayISO = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  const dateIn = form.date; dateIn.min = todayISO;

  const st = { branch: 0, time: '', guests: 2, occ: '' };
  const MIN_G = 1, MAX_G = 15;

  // Pick 1 trong nhóm nút dạng radio
  const pick = (btns, el) => btns.forEach(b => { const on = b === el; b.classList.toggle('is-active', on); b.setAttribute('aria-checked', on); });

  // Hôm nay: khóa các giờ đã qua (cần đặt trước ít nhất 60 phút)
  const syncSlots = () => {
    const now = new Date(); const cutoff = now.getHours() * 60 + now.getMinutes() + 60;
    $$('#bk-slots .chip').forEach(b => {
      const [h, m] = b.dataset.t.split(':').map(Number);
      const past = dateIn.value === todayISO && h * 60 + m < cutoff;
      b.disabled = past; b.title = past ? 'Đã qua giờ có thể đặt' : '';
      if (past && st.time === b.dataset.t) { st.time = ''; pick($$('#bk-slots .chip'), null); }
    });
  };

  const fmtDate = v => { if (!v) return 'Chưa chọn'; const [y, m, d] = v.split('-'); const wd = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][new Date(+y, m - 1, +d).getDay()]; return `${wd}, ${d}/${m}/${y}`; };
  const summary = () => {
    $('#sum-branch').textContent = BRANCHES[st.branch][0].replace('Fiabesco ', '');
    $('#sum-date').textContent = fmtDate(dateIn.value);
    $('#sum-time').textContent = st.time || 'Chưa chọn';
    $('#sum-guests').textContent = st.guests + ' người';
    $('#sum-occ').textContent = st.occ || 'Không';
  };

  /* ---------- Tương tác ---------- */
  $('#bk-branches').addEventListener('click', e => {
    const b = e.target.closest('.bk-branch'); if (!b) return;
    st.branch = +b.dataset.i; pick($$('.bk-branch'), b); summary();
  });
  $('#bk-slots').addEventListener('click', e => {
    const b = e.target.closest('.chip'); if (!b || b.disabled) return;
    st.time = b.dataset.t; pick($$('#bk-slots .chip'), b); setErr('time', false); summary();
  });
  $('#bk-occasion').addEventListener('click', e => {
    const b = e.target.closest('.chip'); if (!b) return;
    st.occ = b.dataset.v; pick($$('#bk-occasion .chip'), b); summary();
  });
  const [gMinus, gPlus] = $$('[data-g]');
  const setGuests = n => {
    st.guests = Math.min(MAX_G, Math.max(MIN_G, n)); $('#bk-guests').textContent = st.guests;
    gMinus.disabled = st.guests <= MIN_G; gPlus.disabled = st.guests >= MAX_G; summary();
  };
  $$('[data-g]').forEach(b => b.addEventListener('click', () => setGuests(st.guests + +b.dataset.g)));
  dateIn.addEventListener('change', () => { syncSlots(); if (dateIn.value) setErr('date', !validDate()); summary(); });

  /* ---------- Kiểm tra ---------- */
  const field = k => $(`[data-f="${k}"]`, form);
  function setErr(k, on) {
    const f = field(k); if (!f) return; f.classList.toggle('is-error', on);
    $('input', f)?.setAttribute('aria-invalid', on ? 'true' : 'false');
  }
  const validDate = () => !!dateIn.value && dateIn.value >= todayISO;
  const checks = {
    date: validDate,
    time: () => !!st.time,
    name: () => form.name.value.trim() !== '',
    phone: () => FB.isPhone(form.phone.value),
    email: () => { const v = form.email.value.trim(); return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
  };
  ['name', 'phone', 'email'].forEach(k => form[k].addEventListener('input', () => { if (field(k).classList.contains('is-error')) setErr(k, !checks[k]()); }));

  form.addEventListener('submit', e => {
    e.preventDefault();
    let first = null;
    Object.entries(checks).forEach(([k, ok]) => { const bad = !ok(); setErr(k, bad); if (bad && !first) first = field(k); });
    if (first) {
      first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      ($('input', first) || $('.chip:not(:disabled)', first))?.focus({ preventScroll: true });
      return;
    }
    const b = BRANCHES[st.branch][0];
    FB.modal({ id: 'm-booked', icon: 'check', tone: 'green', title: 'Đã ghi nhận yêu cầu đặt bàn',
      desc: `${b} · ${fmtDate(dateIn.value)} lúc ${st.time} · ${st.guests} khách${st.occ ? ' · ' + st.occ : ''}. Đây là bản demo giao diện, yêu cầu chưa được gửi tới nhà hàng — vui lòng gọi hotline 0123 456 789 để xác nhận.`,
      actions: [{ label: 'Về trang chủ', style: 'outline', href: 'trang_chu.html' }, { label: 'Đóng', style: 'navy' }] });
    FB.openModal('m-booked');
  });

  /* ---------- Khởi tạo ---------- */
  const u = FB.getUser?.(); if (u?.name) form.name.value = u.name;
  hydrateIcons(form); setGuests(2); syncSlots(); summary();
});
