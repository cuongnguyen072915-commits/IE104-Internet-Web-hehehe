/* =====================================================================
   Tuyển dụng – Luồng Tuyển dụng (Lam)
   Figma "★ TỔNG HỢP LUỒNG" › 11 · TUYỂN DỤNG: Danh sách → Chi tiết vị trí →
   Form ứng tuyển → Ứng tuyển thành công. Chuyển màn bằng hash để nút Back
   của trình duyệt hoạt động: #vi-tri/<mã>, #ung-tuyen/<mã>, #da-gui.
   Nội dung "Nhân viên phục vụ" lấy đúng Figma; 3 vị trí còn lại Figma chỉ có
   ở danh sách nên phần mô tả được viết theo cùng khuôn.
   Bản demo không có máy chủ: hồ sơ không được gửi đi đâu.
   ===================================================================== */
document.addEventListener('fb:ready', () => {
  const { $, $$, icon: I } = FB;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const SAVE_KEY = 'fb_jobs_saved_v1';
  const saved = { get() { try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || []; } catch (e) { return []; } }, set(v) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(v)); } catch (e) {} } };

  const JOBS = [
    { id: 'nhan-vien-phuc-vu', team: 'phuc-vu', icon: 'users', title: 'Nhân viên phục vụ', type: 'Toàn thời gian', area: 'Quận 1', shift: 'Ca xoay', salary: '8 – 12 triệu / tháng',
      desc: ['Đón khách, hướng dẫn chọn bàn và tư vấn món', 'Phục vụ món đúng quy trình, giữ không gian gọn gàng', 'Phối hợp với bếp và thu ngân trong giờ cao điểm'],
      req: ['Từ 18 tuổi, giao tiếp lịch sự, thái độ tích cực', 'Có thể làm ca xoay, kể cả cuối tuần', 'Ưu tiên người có kinh nghiệm nhà hàng'],
      perks: ['Lương 8 – 12 triệu cùng thưởng và tip', 'Suất ăn miễn phí mỗi ca, đồng phục cấp sẵn', 'Đào tạo kỹ năng phục vụ và rượu vang'] },
    { id: 'phu-bep-bep-pho', team: 'bep', icon: 'chef-hat', title: 'Phụ bếp / Bếp phó', type: 'Toàn thời gian', area: 'Quận 1', shift: 'Ca xoay', salary: '12 – 18 triệu / tháng',
      desc: ['Sơ chế nguyên liệu, chuẩn bị mì tươi và sốt nền mỗi ngày', 'Hỗ trợ bếp trưởng ra món đúng định lượng và trình bày', 'Giữ khu bếp sạch sẽ theo chuẩn an toàn thực phẩm'],
      req: ['Có kinh nghiệm bếp Âu từ 1 năm (bếp phó từ 3 năm)', 'Chịu được áp lực giờ cao điểm, làm việc nhóm tốt', 'Có giấy khám sức khỏe và chứng nhận an toàn thực phẩm'],
      perks: ['Lương 12 – 18 triệu theo năng lực', 'Học công thức và kỹ thuật cùng đầu bếp Ý', 'Suất ăn miễn phí mỗi ca, xét tăng lương mỗi năm'] },
    { id: 'thu-ngan', team: 'phuc-vu', icon: 'credit-card', title: 'Thu ngân', type: 'Bán thời gian', area: 'Quận 3', shift: 'Ca tối', salary: '7 – 10 triệu / tháng',
      desc: ['Thanh toán hóa đơn tại quầy: tiền mặt, thẻ, ví điện tử', 'Kiểm tra mã ưu đãi và tích điểm thành viên cho khách', 'Đối soát doanh thu cuối ca cùng quản lý'],
      req: ['Từ 18 tuổi, cẩn thận và trung thực', 'Biết sử dụng máy tính cơ bản', 'Ưu tiên sinh viên có thể làm ca tối và cuối tuần'],
      perks: ['Thu nhập 7 – 10 triệu theo số ca', 'Lịch làm linh hoạt, đăng ký ca theo tuần', 'Suất ăn miễn phí mỗi ca'] },
    { id: 'shipper-giao-hang', team: 'giao-hang', icon: 'delivery-truck', title: 'Shipper giao hàng', type: 'Linh hoạt', area: 'TP. Hồ Chí Minh', shift: 'Tự chọn ca', salary: '10 – 15 triệu / tháng',
      desc: ['Nhận món tại nhà hàng và giao đến khách trong 30–40 phút', 'Giữ món đúng nhiệt độ, đóng gói nguyên vẹn khi giao', 'Cập nhật trạng thái đơn trên ứng dụng của nhà hàng'],
      req: ['Có xe máy, bằng lái A1 và điện thoại thông minh', 'Thông thạo đường phố TP. Hồ Chí Minh', 'Thân thiện, đúng giờ'],
      perks: ['Thu nhập 10 – 15 triệu theo số đơn', 'Hỗ trợ xăng xe và đồng phục, thùng giữ nhiệt', 'Thưởng tháng cho shipper được đánh giá cao'] }
  ];
  const byId = id => JOBS.find(j => j.id === id);
  let team = 'all', lastJob = null;

  /* ---------- Danh sách ---------- */
  $('#td-count').textContent = `${JOBS.length} vị trí đang mở tại Fiabesco Palace.`;
  function drawList() {
    const list = JOBS.filter(j => team === 'all' || j.team === team);
    $('#td-jobs').innerHTML = list.length ? list.map(j => `<li><a class="td-job reveal" href="#vi-tri/${j.id}">
      <span class="td-job__ic">${I(j.icon)}</span>
      <span class="td-job__txt"><strong>${esc(j.title)}</strong><small>${esc(j.type)} · ${esc(j.area)}</small></span>
      <span class="td-job__pay">${esc(j.salary)}</span><span class="td-job__go" aria-hidden="true">${I('arrow-right')}</span></a></li>`).join('')
      : `<li class="td-empty">Hiện chưa có vị trí nào ở bộ phận này. <button type="button" data-team="all">Xem tất cả vị trí</button></li>`;
    FB.initReveal($('#td-jobs'));
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-team]'); if (!b) return;
    team = b.dataset.team;
    $$('#td-filter .chip').forEach(c => { const on = c.dataset.team === team; c.classList.toggle('is-active', on); c.setAttribute('aria-pressed', on); });
    drawList();
  });

  /* ---------- Chi tiết vị trí ---------- */
  const list = (t, items) => `<section class="td-box"><h2 class="t-h4">${t}</h2><ul class="td-checks">${items.map(x => `<li>${I('check')}<span>${esc(x)}</span></li>`).join('')}</ul></section>`;
  function drawDetail(j) {
    const isSaved = saved.get().includes(j.id);
    $('#td-detail').innerHTML = `<h1 class="t-h1 td-title" id="td-job-title">${esc(j.title)}</h1>
      <p class="td-pay">${esc(j.salary)}</p>
      <div class="td-tags"><span>${esc(j.type)}</span><span>${esc(j.area)}</span><span>${esc(j.shift)}</span></div>
      ${list('Mô tả công việc', j.desc)}${list('Yêu cầu', j.req)}${list('Quyền lợi', j.perks)}
      <div class="td-cta"><a class="btn btn--navy" href="#ung-tuyen/${j.id}">Ứng tuyển ngay</a>
        <button type="button" class="td-save${isSaved ? ' is-on' : ''}" data-save="${j.id}" aria-pressed="${isSaved}" aria-label="${isSaved ? 'Bỏ lưu vị trí' : 'Lưu vị trí'}">${I('heart')}</button></div>`;
  }
  document.addEventListener('click', e => {
    const s = e.target.closest('[data-save]'); if (!s) return;
    const id = s.dataset.save, all = saved.get(), on = !all.includes(id);
    saved.set(on ? [...all, id] : all.filter(x => x !== id));
    s.classList.toggle('is-on', on); s.setAttribute('aria-pressed', on); s.setAttribute('aria-label', on ? 'Bỏ lưu vị trí' : 'Lưu vị trí');
    FB.toast(on ? 'Đã lưu vị trí' : 'Đã bỏ lưu vị trí', esc(byId(id).title), '', '', 'navy');
  });

  /* ---------- Form ứng tuyển ---------- */
  const form = $('#td-form'), sel = $('#td-job-select'), cvText = $('#td-cv-text'), CV_DEFAULT = cvText.textContent;
  sel.innerHTML = JOBS.map(j => `<option value="${j.id}">${esc(j.title)}</option>`).join('');
  const setErr = (k, msg) => { const f = $(`[data-f="${k}"]`, form); f.classList.toggle('is-error', !!msg); $('.field__error', f).textContent = msg || ''; const c = $('input,select,textarea', f); if (c) c.setAttribute('aria-invalid', msg ? 'true' : 'false'); return !!msg; };
  form.addEventListener('input', e => { if (e.target.name && e.target.name !== 'cv') setErr(e.target.name, ''); });
  form.cv.addEventListener('change', () => {
    const f = form.cv.files[0]; setErr('cv', '');
    if (!f) { cvText.textContent = CV_DEFAULT; return; }
    const pdf = f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
    if (!pdf) { form.cv.value = ''; cvText.textContent = CV_DEFAULT; return void setErr('cv', 'Chỉ nhận tệp PDF'); }
    if (f.size > 5 * 1024 * 1024) { form.cv.value = ''; cvText.textContent = CV_DEFAULT; return void setErr('cv', 'Tệp quá lớn: tối đa 5MB'); }
    cvText.textContent = `${f.name} · ${f.size < 1048576 ? Math.max(1, Math.round(f.size / 1024)) + ' KB' : (f.size / 1048576).toFixed(1).replace('.', ',') + ' MB'}`;
  });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const v = { name: form.name.value.trim(), phone: form.phone.value.trim(), email: form.email.value.trim(), job: sel.value };
    let bad = false;
    bad = setErr('name', !v.name ? 'Vui lòng nhập họ và tên' : /[\d!@#$%^&*()_+=<>?/\\|{}[\]~`"]/.test(v.name) ? 'Họ tên chỉ gồm chữ cái và khoảng trắng' : '') || bad;
    bad = setErr('phone', !v.phone ? 'Vui lòng nhập số điện thoại' : !FB.isPhone(v.phone) ? 'Số điện thoại gồm 10 chữ số, bắt đầu bằng 0' : '') || bad;
    bad = setErr('email', v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email) ? 'Email không đúng định dạng' : '') || bad;
    bad = setErr('cv', !form.cv.files[0] ? 'Vui lòng tải lên CV (PDF, tối đa 5MB)' : '') || bad;
    if (bad) { $('.is-error input, .is-error select, .is-error textarea', form)?.focus(); return; }
    if (navigator.onLine === false) return void FB.toast('Mất kết nối mạng', 'Hồ sơ chưa được gửi. Vui lòng thử lại khi có mạng.', '', '');
    lastJob = byId(v.job); form.reset(); cvText.textContent = CV_DEFAULT;
    location.replace('#da-gui'); // thay màn form trong lịch sử: Back từ "Đã nhận hồ sơ" về chi tiết vị trí
  });

  /* ---------- Điều hướng ---------- */
  function route() {
    const [view, id] = decodeURIComponent(location.hash.slice(1)).split('/');
    let v = 'list', j = byId(id);
    if (view === 'vi-tri' && j) { v = 'detail'; drawDetail(j); }
    else if (view === 'ung-tuyen' && j) { v = 'apply'; sel.value = j.id; $('[data-apply-back]').setAttribute('href', `#vi-tri/${j.id}`); }
    else if (view === 'da-gui' && lastJob) { v = 'done'; $('#td-done-job').textContent = `Vị trí ứng tuyển: ${lastJob.title}`; }
    else if (location.hash && location.hash !== '#') history.replaceState(null, '', location.pathname + location.search);
    $$('[data-view]').forEach(s => { s.hidden = s.dataset.view !== v; });
    document.title = `${v === 'detail' ? j.title + ' – Tuyển dụng' : v === 'apply' ? 'Ứng tuyển' : v === 'done' ? 'Đã nhận hồ sơ' : 'Tuyển dụng'} – Fiabesco Palace`;
    if (v === 'list') drawList();
    window.scrollTo({ top: 0, behavior: 'auto' });
    const h = $(`[data-view="${v}"] h1`); if (h && location.hash) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }
  window.addEventListener('hashchange', route);
  route();
});
