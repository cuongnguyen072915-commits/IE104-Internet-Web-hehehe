/* =====================================================================
   FIABESCO PALACE — thanh_vien.js  ·  Luồng Thành viên (phần của Lam)
   Figma "★ TỔNG HỢP LUỒNG" › 07 · THÀNH VIÊN (A, A2, B, C, C2, D, E, E2)
   + "Page PC" › PC – 09 Thành viên – Đăng nhập.
   - Mỗi màn = 1 view, đổi bằng hash (#dang-nhap, #ho-so, #lich-su/giao-hang…).
   - Bản demo không có máy chủ: tài khoản, OTP, lịch sử lưu ở localStorage.
     Người dùng đang đăng nhập dùng chung khoá "fb_user_v1" với popups.js
     (popup Đăng nhập/Đăng ký trên header) để header luôn đồng bộ.
   - Xem nhanh trường hợp cần điều kiện đặc biệt: ?demo=sat-gio (E34),
     ?demo=het-hang (E36). Mất mạng (E07, E25) dùng trạng thái mạng thật.
   ===================================================================== */
document.addEventListener('fb:ready', () => {
  const { $, $$, icon: I, vnd, money } = FB;
  const D = window.FB_DATA || { byId: () => null };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {
    get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const USER_KEY = 'fb_user_v1';          // dùng chung với popups.js
  const ACC_KEY = 'fb_members_v1';        // danh sách tài khoản demo của trang này
  const HOTLINE = '0123 456 789', HOTLINE_TEL = 'tel:0123456789';
  const MAX_FAIL = 5, LOCK_MIN = 15, OTP_TTL = 5 * 60e3, OTP_WAIT = 60, OTP_MAX_TRY = 5, OTP_MAX_RESEND = 3;
  const DEMO = FB.demo;

  /* ---------------- Tài khoản demo ---------------- */
  const DEMO_ACC = { name: 'Nguyễn Văn An', email: 'nguyenvanan@gmail.com', phone: '0901234678', pw: 'Fiabesco1', verified: true, dob: '2002-08-15', code: 'FP-20481', card: 'FP 2048 1937', points: 1250 };
  const accounts = () => { const a = store.get(ACC_KEY, null); if (Array.isArray(a)) return a; store.set(ACC_KEY, [DEMO_ACC]); return [DEMO_ACC]; };
  const saveAccounts = a => store.set(ACC_KEY, a);
  const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const findAcc = id => { const v = id.trim().toLowerCase(); const p = FB.normPhone(id); return accounts().find(a => a.email.toLowerCase() === v || (FB.isPhone(id) && a.phone === p)); };
  const updateAcc = (email, patch) => { const a = accounts(); const i = a.findIndex(x => x.email === email); if (i > -1) { a[i] = { ...a[i], ...patch }; saveAccounts(a); return a[i]; } return null; };

  /* ---------------- Hạng thành viên (Figma: Bạc → Vàng → Bạch Kim) ---------------- */
  const TIERS = [['Bạc', 0, 'SILVER'], ['Vàng', 1000, 'GOLD'], ['Bạch Kim', 2000, 'PLATINUM']];
  const tierOf = p => [...TIERS].reverse().find(t => p >= t[1]);
  const nextTier = p => TIERS.find(t => p < t[1]) || null;

  /* ---------------- Người dùng đang đăng nhập ---------------- */
  const getUser = () => store.get(USER_KEY, null);
  let lastUser = JSON.stringify(getUser());
  const setUser = u => { if (u) u.tier = tierOf(u.points || 0)[0]; store.set(USER_KEY, u); FB.renderAccount && FB.renderAccount(); lastUser = JSON.stringify(u); };
  // Figma M10: "Nguyễn Văn An" → "NA" (chữ đầu của họ + tên)
  const initials = n => { const w = String(n || '?').trim().split(/\s+/); return (w[0][0] + (w.length > 1 ? w[w.length - 1][0] : '')).toUpperCase(); };
  const maskPhone = p => { const d = FB.normPhone(p || ''); return d.length >= 7 ? `${d.slice(0, 4)} *** ${d.slice(-3)}` : p; };
  const fmtPhone = p => { const d = FB.normPhone(p || ''); return d.length === 10 ? `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}` : (p || ''); };
  const pad = n => String(n).padStart(2, '0');
  const dmy = d => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  const hm = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const WD = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const sameDay = (a, b) => a.toDateString() === b.toDateString();

  /* Dữ liệu mẫu lịch sử: dùng chung DẠNG DỮ LIỆU với trang Tra cứu (js/data/tra_cuu.js)
     để thẻ đặt bàn / đơn giao và các thao tác hủy, đổi lịch hiển thị giống hệt nhau.
     TODO(BE): GET /api/thanh-vien/lich-su (token thành viên) → { bookings, orders }. */
  const histSample = phone => { const T = window.FB_TRA_CUU; const d = T ? T.sample(phone || DEMO_ACC.phone) : { bookings: [], orders: [] }; return { bookings: d.bookings, orders: d.orders }; };
  const oldHistory = u => (u.bookings || []).some(b => !b.tableId) || (u.orders || []).some(o => !Array.isArray(o.items) || Array.isArray(o.items[0])); // dữ liệu demo bản cũ
  function demoData(phone) {
    return {
      ...histSample(phone),
      log: [['Đơn giao hàng #FB2410-0190', '07/11/2026', 125], ['Đổi Tiramisu miễn phí', '02/11/2026', -300], ['Quà chào mừng thành viên', '20/10/2026', 100]]
    };
  }
  function makeUser(acc, extra = {}) {
    const fresh = !!extra.fresh;
    const base = fresh ? { bookings: [], orders: [], log: [['Quà chào mừng thành viên', dmy(new Date()), 100]] } : demoData(acc.phone);
    return { name: acc.name, id: acc.email || acc.phone, email: acc.email || '', phone: acc.phone || '', dob: acc.dob || '',
      code: acc.code || 'FP-' + String(Math.floor(10000 + Math.random() * 89999)), card: acc.card || (acc.email === DEMO_ACC.email ? DEMO_ACC.card : ''), points: fresh ? 100 : (acc.points != null ? acc.points : 1250),
      avatar: acc.avatar || '', fresh, vouchers: [], ...base, ...extra };
  }
  /* Người dùng đăng nhập qua popup header (popups.js) chỉ có name/id/tier/points → bổ sung dữ liệu hồ sơ */
  function ensureUser() {
    const u = getUser(); if (!u) return null;
    if (!u.code || !Array.isArray(u.bookings)) {
      const id = String(u.id || ''), acc = id && findAcc(id);
      const fresh = !acc && (u.points || 0) < 1000;
      const full = makeUser(acc || { name: u.name, email: isEmail(id) ? id : '', phone: FB.isPhone(id) ? FB.normPhone(id) : '' }, { fresh });
      full.points = u.points != null ? u.points : full.points;
      if (fresh) full.log = [['Quà chào mừng thành viên', dmy(new Date()), full.points]];
      setUser(full); return full;
    }
    if (oldHistory(u)) { Object.assign(u, histSample(u.phone)); setUser(u); } // chuyển dữ liệu demo bản cũ sang dạng mới
    return u;
  }

  /* ---------------- Hộp thoại (dùng FB.modal của main.js) ---------------- */
  function dialog(opts, onOk) {
    const el = FB.modal({ id: opts.id || 'mb-dialog', icon: opts.icon || 'alert-triangle', tone: opts.tone || 'navy', title: opts.title, desc: opts.desc, extra: opts.extra || '',
      actions: opts.actions || [{ label: opts.cancel || 'Đóng', style: 'outline' }, { label: opts.ok || 'Đồng ý', style: opts.okStyle || 'navy', attr: 'data-mb-ok' }] });
    el.classList.add('mb-modal'); FB.hydrateIcons(el); FB.openModal(el.id);
    const ok = $('[data-mb-ok]', el); if (ok) ok.addEventListener('click', e => { e.preventDefault(); FB.closeModal(el); onOk && onOk(); });
    setTimeout(() => $('.btn', el)?.focus(), 60);
    return el;
  }

  /* ---------------- Trợ giúp form ---------------- */
  const field = (form, k) => $(`[data-f="${k}"]`, form);
  function setErr(form, k, msg) { const f = field(form, k); if (!f) return !!msg; f.classList.toggle('is-error', !!msg); const e = $('.field__error', f); if (e) e.textContent = msg || ''; const inp = $('input', f); if (inp) inp.setAttribute('aria-invalid', msg ? 'true' : 'false'); return !!msg; }
  function clearErrs(form) { $$('.field', form).forEach(f => { f.classList.remove('is-error'); const inp = $('input', f); if (inp) inp.removeAttribute('aria-invalid'); }); form.classList.remove('is-terms-error'); }
  function alertBox(view, tone, title, text, extra = '') {
    const a = $(`[data-view="${view}"] [data-alert]`); if (!a) return;
    if (!title) { a.hidden = true; a.innerHTML = ''; return; }
    a.className = 'mb-alert mb-alert--' + tone; a.hidden = false;
    a.innerHTML = `${I(tone === 'ok' ? 'check' : tone === 'info' ? 'wifi-off' : 'alert-triangle')}<div><strong>${title}</strong><p>${text}</p>${extra}</div>`;
  }
  function busy(btn, on, label) {
    if (on) { btn.dataset.label = btn.innerHTML; btn.disabled = true; btn.classList.add('is-loading'); btn.innerHTML = `<span class="mb-spin" aria-hidden="true"></span>${label}`; }
    else { btn.disabled = false; btn.classList.remove('is-loading'); if (btn.dataset.label) btn.innerHTML = btn.dataset.label; }
  }
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const pwScore = pw => [pw.length >= 8, /[a-z]/.test(pw) && /[A-Z]/.test(pw), /\d/.test(pw), /[^A-Za-z0-9]/.test(pw)];
  const pwStrong = pw => { const s = pwScore(pw); return s[0] && s[1] && s[2]; };
  const offline = () => navigator.onLine === false;
  const badName = n => n.length < 2 || /[\d!@#$%^&*()_+=<>?/\\|{}[\]~`"]/.test(n);

  /* =================================================================
     ĐIỀU HƯỚNG GIỮA CÁC VIEW
     ================================================================= */
  const GROUP = {
    'dang-nhap': 'auth', 'dang-ky': 'auth', otp: 'auth', 'dang-ky-thanh-cong': 'auth', 'quen-mat-khau': 'auth', 'dat-lai-mat-khau': 'auth', 'doi-mat-khau-thanh-cong': 'auth',
    'can-dang-nhap': 'guest', 'ho-so': 'account', 'the-thanh-vien': 'account', 'lich-su': 'account', 'yeu-thich': 'account', 'cap-nhat': 'account'
  };
  const TITLES = { 'dang-nhap': 'Đăng nhập', 'dang-ky': 'Đăng ký', otp: 'Xác thực OTP', 'dang-ky-thanh-cong': 'Đăng ký thành công', 'quen-mat-khau': 'Quên mật khẩu', 'dat-lai-mat-khau': 'Đặt lại mật khẩu', 'doi-mat-khau-thanh-cong': 'Đổi mật khẩu thành công', 'can-dang-nhap': 'Thành viên', 'ho-so': 'Hồ sơ thành viên', 'the-thanh-vien': 'Thẻ thành viên', 'lich-su': 'Lịch sử', 'yeu-thich': 'Món yêu thích', 'cap-nhat': 'Cập nhật thông tin' };
  let current = '', sub = '', afterLogin = 'ho-so';
  const otp = { mode: '', target: '', code: '', exp: 0, tries: 0, resends: 0, timer: 0, left: 0, locked: false, data: null };
  let resetMode = '', resetEmail = '';

  function go(view) { if (location.hash.slice(1) === view) route(); else location.hash = view; }
  function route() {
    const [raw, s = ''] = decodeURIComponent(location.hash.slice(1)).split('/');
    let v = GROUP[raw] ? raw : '';
    const u = ensureUser();
    // E40: rời trang Cập nhật thông tin khi chưa lưu (trừ khi sang OTP xác thực thay đổi)
    if (current === 'cap-nhat' && v !== 'cap-nhat' && v !== 'otp' && u && editDirty()) {
      const target = location.hash || '#ho-so'; history.replaceState(null, '', '#cap-nhat');
      dialog({ id: 'mb-leave', icon: 'edit', title: 'Rời trang khi chưa lưu?', desc: 'Các thay đổi về họ tên, ngày sinh, email, số điện thoại hoặc ảnh đại diện sẽ không được lưu.', cancel: 'Ở lại', ok: 'Rời trang', okStyle: 'wine' },
        () => { editReset(); location.hash = target; });
      return;
    }
    if (!v) v = u ? 'ho-so' : 'dang-nhap';
    if (GROUP[v] === 'account' && !u) { afterLogin = raw + (s ? '/' + s : ''); v = 'can-dang-nhap'; }
    if (u && ['dang-nhap', 'dang-ky', 'quen-mat-khau', 'can-dang-nhap'].includes(v)) v = 'ho-so';
    if (v === 'otp' && !otp.mode) v = u ? 'ho-so' : 'dang-nhap';
    if (v === 'dat-lai-mat-khau') { if (u) { resetMode = 'change'; resetEmail = u.email; } else if (resetMode !== 'reset') v = 'quen-mat-khau'; }
    if (!u && v === 'dang-ky-thanh-cong') v = 'dang-nhap';
    show(v, s);
  }
  function show(v, s) {
    const prev = current; current = v; sub = s;
    // Đồng bộ hash với view thực sự hiển thị (giữ nguyên hash gốc khi chuyển sang E13 để quay lại sau đăng nhập)
    if (v !== 'can-dang-nhap' && location.hash.slice(1).split('/')[0] !== v) history.replaceState(null, '', '#' + v + (s ? '/' + s : ''));
    $$('[data-group]').forEach(g => { g.hidden = g.dataset.group !== GROUP[v]; });
    $$('[data-view]').forEach(sec => { sec.hidden = sec.dataset.view !== v; });
    document.title = `${TITLES[v]} – Fiabesco Palace`;
    ({ 'ho-so': renderProfile, 'the-thanh-vien': renderCard, 'lich-su': renderHistory, 'yeu-thich': renderFavs, 'cap-nhat': () => { if (prev !== 'otp' && prev !== 'cap-nhat') fillEdit(); },
      otp: renderOtp, 'dang-ky-thanh-cong': () => { $('[data-user-name]').textContent = (getUser() || {}).name || ''; }, 'dat-lai-mat-khau': prepReset, 'doi-mat-khau-thanh-cong': prepPwOk })[v]?.();
    if (prev && prev !== v) {
      window.scrollTo({ top: 0, behavior: 'auto' });
      const h = $(`[data-view="${v}"] h1`); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    }
  }
  window.addEventListener('hashchange', route);
  document.addEventListener('click', e => { const g = e.target.closest('[data-mb-go]'); if (g) { e.preventDefault(); go(g.dataset.mbGo); } });
  // Đăng nhập/đăng xuất bằng popup trên header (popups.js) → cập nhật view của trang
  const syncUser = () => setTimeout(() => {
    const now = JSON.stringify(getUser()); if (now === lastUser) return; lastUser = now;
    if (getUser() && GROUP[current] !== 'account') { location.hash = afterLogin || 'ho-so'; route(); } else route();
  }, 0);
  document.addEventListener('click', syncUser); document.addEventListener('submit', syncUser);

  /* =================================================================
     M01 ĐĂNG NHẬP  ·  E01–E09
     ================================================================= */
  const fLogin = $('#f-login');
  fLogin.addEventListener('input', e => { if (e.target.name) setErr(fLogin, e.target.name, ''); });
  fLogin.addEventListener('submit', async e => {
    e.preventDefault(); clearErrs(fLogin); alertBox('dang-nhap');
    const id = fLogin.id.value.trim(), pw = fLogin.pw.value;
    let bad = false;
    if (!id) bad = setErr(fLogin, 'id', 'Vui lòng nhập email hoặc số điện thoại') || bad;                                       // E01
    else if (!isEmail(id) && !FB.isPhone(id)) bad = setErr(fLogin, 'id', 'Email hoặc số điện thoại không đúng định dạng') || bad; // E02
    if (!pw) bad = setErr(fLogin, 'pw', 'Vui lòng nhập mật khẩu') || bad;                                                       // E01
    if (bad) { $('.is-error input', fLogin)?.focus(); return; }
    if (offline()) return alertBox('dang-nhap', 'info', 'Mất kết nối mạng', 'Không thể đăng nhập lúc này. Kiểm tra Wi-Fi hoặc 4G rồi thử lại.'); // E07
    const btn = $('[type="submit"]', fLogin); busy(btn, true, 'Đang đăng nhập…'); await wait(700); busy(btn, false);         // E06
    const acc = findAcc(id);
    if (!acc) { // E04
      alertBox('dang-nhap', 'err', 'Tài khoản chưa được đăng ký', `Không tìm thấy tài khoản với ${isEmail(id) ? 'email' : 'số điện thoại'} này.`, `<a class="mb-link" href="#dang-ky" data-prefill="${esc(id)}">Đăng ký ngay với thông tin này</a>`);
      return;
    }
    if (acc.lockUntil && acc.lockUntil > Date.now()) return lockedAlert(acc);                                                    // E05
    if (acc.pw !== pw) { // E03
      const fails = (acc.fails || 0) + 1;
      if (fails >= MAX_FAIL) return lockedAlert(updateAcc(acc.email, { fails: 0, lockUntil: Date.now() + LOCK_MIN * 60e3 }));
      updateAcc(acc.email, { fails });
      setErr(fLogin, 'pw', 'Mật khẩu không đúng');
      alertBox('dang-nhap', 'err', 'Email/SĐT hoặc mật khẩu không đúng', `Bạn còn ${MAX_FAIL - fails} lần thử. Nhập sai ${MAX_FAIL} lần, tài khoản sẽ bị tạm khóa ${LOCK_MIN} phút.`);
      fLogin.pw.select(); return;
    }
    updateAcc(acc.email, { fails: 0, lockUntil: 0 });
    if (!acc.verified) { // E08
      alertBox('dang-nhap', 'warn', 'Tài khoản chưa xác thực số điện thoại', `Vui lòng nhập mã OTP gửi tới ${maskPhone(acc.phone)} để hoàn tất đăng ký.`, `<button type="button" class="mb-link" data-verify="${esc(acc.email)}">Xác thực ngay</button>`);
      return;
    }
    loginAs(acc);
  });
  function lockedAlert(acc) {
    fLogin.pw.value = '';
    alertBox('dang-nhap', 'err', 'Tài khoản tạm khóa', `Bạn đã nhập sai mật khẩu ${MAX_FAIL} lần. Vui lòng thử lại sau ${hm(new Date(acc.lockUntil))} hoặc đặt lại mật khẩu.`, '<a class="mb-link" href="#quen-mat-khau">Đặt lại mật khẩu</a>');
  }
  function loginAs(acc, extra) {
    const u = makeUser(acc, extra); setUser(u);
    fLogin.reset(); alertBox('dang-nhap');
    FB.toast('Đăng nhập thành công', `Chào mừng ${esc(u.name.split(' ').pop())} trở lại Fiabesco Palace!`, '', '', 'navy');
    const to = afterLogin || 'ho-so'; afterLogin = 'ho-so'; go(to);
  }
  document.addEventListener('click', e => {
    const p = e.target.closest('[data-prefill]'); if (p) { const v = p.dataset.prefill; const f = $('#f-reg'); f.reset(); if (isEmail(v)) f.email.value = v; else f.phone.value = v; }
    const vf = e.target.closest('[data-verify]'); if (vf) { const acc = accounts().find(a => a.email === vf.dataset.verify); if (acc) startOtp('verify', acc.phone, { email: acc.email }); }
  });
  // E09 – Google/Facebook: hỏi cấp quyền; bấm "Hủy" = đăng nhập bị hủy
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-mb-social]'); if (!b) return;
    const net = b.dataset.mbSocial; alertBox('dang-nhap');
    if (offline()) return alertBox('dang-nhap', 'info', 'Mất kết nối mạng', `Không thể kết nối ${net}. Kiểm tra mạng rồi thử lại.`);
    const el = dialog({ id: 'mb-social', icon: 'user', title: `Tiếp tục với ${net}?`, desc: `Fiabesco Palace sẽ nhận họ tên và email từ tài khoản ${net} của bạn để đăng nhập tài khoản thành viên.`,
      actions: [{ label: 'Hủy', style: 'outline', attr: 'data-close data-social-cancel' }, { label: 'Cho phép', style: 'navy', attr: 'data-mb-ok' }] },
    () => loginAs(accounts().find(a => a.email === DEMO_ACC.email) || DEMO_ACC));
    $('[data-social-cancel]', el).addEventListener('click', () => alertBox('dang-nhap', 'err', `Đăng nhập ${net} đã bị hủy`, `Bạn đã đóng cửa sổ ${net} trước khi hoàn tất. Thử lại hoặc đăng nhập bằng email/số điện thoại.`));
  });

  /* =================================================================
     M02 ĐĂNG KÝ  ·  E10–E12
     ================================================================= */
  const fReg = $('#f-reg');
  const meter = $('[data-strength]', fReg);
  fReg.addEventListener('input', e => {
    if (e.target.name) setErr(fReg, e.target.name, '');
    const pw = fReg.pw.value; meter.hidden = !pw;
    const n = pwScore(pw).filter(Boolean).length, lv = pwStrong(pw) ? (n === 4 ? 4 : 3) : Math.min(n, 2);
    meter.dataset.level = lv; $('b', meter).textContent = ['Yếu', 'Yếu', 'Trung bình', 'Khá mạnh', 'Mạnh'][lv];
  });
  fReg.addEventListener('change', e => { if (e.target.name === 'terms') fReg.classList.remove('is-terms-error'); });
  fReg.addEventListener('submit', async e => {
    e.preventDefault(); clearErrs(fReg); alertBox('dang-ky');
    const v = { name: fReg.name.value.trim().replace(/\s+/g, ' '), email: fReg.email.value.trim(), phone: fReg.phone.value.trim(), pw: fReg.pw.value, pw2: fReg.pw2.value };
    let bad = false;
    if (!v.name) bad = setErr(fReg, 'name', 'Vui lòng nhập họ và tên') || bad;                                                   // E10
    else if (badName(v.name)) bad = setErr(fReg, 'name', 'Họ tên chỉ gồm chữ cái và khoảng trắng') || bad;
    if (!v.email) bad = setErr(fReg, 'email', 'Vui lòng nhập email') || bad;
    else if (!isEmail(v.email)) bad = setErr(fReg, 'email', 'Email không đúng định dạng (vd: ten@gmail.com)') || bad;
    if (!v.phone) bad = setErr(fReg, 'phone', 'Vui lòng nhập số điện thoại') || bad;
    else if (!FB.isPhone(v.phone)) bad = setErr(fReg, 'phone', 'Số điện thoại gồm 10 chữ số, bắt đầu bằng 0') || bad;
    if (!v.pw) bad = setErr(fReg, 'pw', 'Vui lòng nhập mật khẩu') || bad;
    else if (!pwStrong(v.pw)) bad = setErr(fReg, 'pw', 'Mật khẩu yếu: cần tối thiểu 8 ký tự, có chữ hoa, chữ thường và chữ số') || bad; // E12
    if (!v.pw2) bad = setErr(fReg, 'pw2', 'Vui lòng nhập lại mật khẩu') || bad;
    else if (v.pw && v.pw2 !== v.pw) bad = setErr(fReg, 'pw2', 'Mật khẩu nhập lại không khớp') || bad;                        // E12
    if (!fReg.terms.checked) { fReg.classList.add('is-terms-error'); bad = true; }                                           // E10
    if (bad) { ($('.is-error input', fReg) || fReg.terms).focus(); return; }
    if (offline()) return alertBox('dang-ky', 'info', 'Mất kết nối mạng', 'Không thể tạo tài khoản lúc này. Kiểm tra kết nối rồi thử lại.');
    const usedEmail = accounts().some(a => a.email.toLowerCase() === v.email.toLowerCase()), usedPhone = accounts().some(a => a.phone === FB.normPhone(v.phone));
    if (usedEmail || usedPhone) { // E11
      if (usedEmail) setErr(fReg, 'email', 'Email này đã được sử dụng');
      if (usedPhone) setErr(fReg, 'phone', 'Số điện thoại này đã được sử dụng');
      alertBox('dang-ky', 'err', `${usedEmail && usedPhone ? 'Email và số điện thoại' : usedEmail ? 'Email' : 'Số điện thoại'} đã được đăng ký`, 'Nếu đây là tài khoản của bạn, hãy đăng nhập hoặc lấy lại mật khẩu.', '<a class="mb-link" href="#dang-nhap">Đăng nhập</a> · <a class="mb-link" href="#quen-mat-khau">Quên mật khẩu?</a>');
      return;
    }
    const btn = $('[type="submit"]', fReg); busy(btn, true, 'Đang tạo tài khoản…'); await wait(600); busy(btn, false);
    const acc = { name: v.name, email: v.email, phone: FB.normPhone(v.phone), pw: v.pw, verified: false, dob: '' };
    saveAccounts([...accounts(), acc]);
    startOtp('register', acc.phone, { email: acc.email });
  });

  /* =================================================================
     M03/M06 OTP  ·  E15–E20
     ================================================================= */
  const fOtp = $('#f-otp'), boxes = $$('[data-otp-boxes] input', fOtp);
  const otpTo = () => otp.mode === 'update' && isEmail(otp.target) ? otp.target : maskPhone(otp.target);
  function newCode() { otp.code = String(Math.floor(100000 + Math.random() * 900000)); otp.exp = Date.now() + OTP_TTL; FB.toast('Mã OTP (bản demo)', `Mã của bạn là ${otp.code} – có hiệu lực 5 phút.`, '', '', 'navy'); }
  function startOtp(mode, target, data) {
    Object.assign(otp, { mode, target, data: data || null, tries: 0, resends: 0, locked: false });
    newCode(); countdown(); boxes.forEach(b => { b.value = ''; }); fOtp.classList.remove('is-error'); alertBox('otp');
    go('otp');
  }
  function countdown() {
    clearInterval(otp.timer); otp.left = OTP_WAIT; tick();
    otp.timer = setInterval(() => { otp.left--; tick(); if (otp.left <= 0) clearInterval(otp.timer); }, 1000);
  }
  function tick() {
    const b = $('[data-resend]', fOtp);
    if (otp.left > 0) { b.disabled = true; b.innerHTML = `Gửi lại sau <span data-timer>${pad(Math.floor(otp.left / 60))}:${pad(otp.left % 60)}</span>`; }
    else { b.disabled = otp.resends >= OTP_MAX_RESEND || otp.locked; b.textContent = 'Gửi lại mã'; } // E17
  }
  function renderOtp() {
    $('[data-otp-desc]').innerHTML = otp.mode === 'reset' ? `Nhập mã 6 chữ số vừa được gửi đến <b>${esc(otpTo())}</b> để đặt lại mật khẩu.`
      : otp.mode === 'update' ? `Nhập mã 6 chữ số vừa được gửi đến <b>${esc(otpTo())}</b> để xác nhận thông tin liên hệ mới.`
      : `Mã gồm 6 chữ số đã được gửi đến số điện thoại <b>${esc(otpTo())}</b>`;
    $('[data-otp-change]', fOtp).textContent = otp.mode === 'reset' ? 'Đổi email / số điện thoại' : otp.mode === 'update' ? 'Sửa lại thông tin' : 'Đổi số điện thoại';
    $('[data-otp-back]').setAttribute('href', otpBack());
    lockOtp(otp.locked); setTimeout(() => { if (!otp.locked) (boxes.find(b => !b.value) || boxes[5]).focus(); }, 60);
  }
  const otpBack = () => ({ register: '#dang-ky', reset: '#quen-mat-khau', update: '#cap-nhat' }[otp.mode] || '#dang-nhap');
  function lockOtp(on) { otp.locked = on; boxes.forEach(b => { b.disabled = on; }); $('[type="submit"]', fOtp).disabled = on; tick(); }
  boxes.forEach((b, i) => {
    b.addEventListener('input', () => { b.value = b.value.replace(/\D/g, '').slice(-1); fOtp.classList.remove('is-error'); if (b.value && boxes[i + 1]) boxes[i + 1].focus(); if (boxes.every(x => x.value)) fOtp.requestSubmit(); });
    b.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !b.value && boxes[i - 1]) { e.preventDefault(); boxes[i - 1].value = ''; boxes[i - 1].focus(); }
      if (e.key === 'ArrowLeft' && boxes[i - 1]) boxes[i - 1].focus();
      if (e.key === 'ArrowRight' && boxes[i + 1]) boxes[i + 1].focus();
    });
    b.addEventListener('paste', e => { const t = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6); if (!t) return; e.preventDefault(); boxes.forEach((x, k) => { x.value = t[k] || ''; }); (boxes[t.length] || boxes[5]).focus(); if (t.length === 6) fOtp.requestSubmit(); });
  });
  $('[data-resend]', fOtp).addEventListener('click', () => {
    if (otp.resends >= OTP_MAX_RESEND || otp.locked) return;
    otp.resends++; otp.tries = 0; newCode(); countdown(); boxes.forEach(b => { b.value = ''; }); fOtp.classList.remove('is-error'); boxes[0].focus();
    if (otp.resends >= OTP_MAX_RESEND) alertBox('otp', 'warn', 'Đã gửi lại mã mới', `Đây là lần gửi lại cuối cùng (${OTP_MAX_RESEND}/${OTP_MAX_RESEND}). Nếu vẫn chưa nhận được mã, vui lòng gọi hotline ${HOTLINE}.`); // E19
    else alertBox('otp', 'ok', 'Đã gửi lại mã mới', `Mã mới đã được gửi đến ${esc(otpTo())}. Mã cũ không còn hiệu lực.`); // E18
  });
  $('[data-otp-change]', fOtp).addEventListener('click', () => { const back = otpBack().slice(1); clearInterval(otp.timer); otp.mode = ''; location.hash = back; });
  fOtp.addEventListener('submit', async e => {
    e.preventDefault(); if (otp.locked || !otp.mode) return;
    const val = boxes.map(b => b.value).join('');
    if (val.length < 6) { fOtp.classList.add('is-error'); alertBox('otp', 'err', 'Chưa đủ 6 chữ số', 'Vui lòng nhập đầy đủ mã xác nhận.'); return; }
    if (offline()) return alertBox('otp', 'info', 'Mất kết nối mạng', 'Không thể xác thực lúc này. Kiểm tra kết nối rồi thử lại.');
    const btn = $('[type="submit"]', fOtp); busy(btn, true, 'Đang xác thực…'); boxes.forEach(b => { b.disabled = true; }); await wait(700); busy(btn, false); boxes.forEach(b => { b.disabled = false; }); // E20
    if (Date.now() > otp.exp) { fOtp.classList.add('is-error'); boxes.forEach(b => { b.value = ''; }); return alertBox('otp', 'err', 'Mã đã hết hạn', 'Mã OTP chỉ có hiệu lực 5 phút. Vui lòng bấm “Gửi lại mã” để nhận mã mới.'); } // E16
    if (val !== otp.code) {
      otp.tries++; fOtp.classList.add('is-error'); boxes.forEach(b => { b.value = ''; });
      if (otp.tries >= OTP_MAX_TRY) { clearInterval(otp.timer); otp.left = 0; lockOtp(true); return alertBox('otp', 'err', 'Đã nhập sai quá số lần cho phép', `Bạn đã nhập sai mã ${OTP_MAX_TRY} lần. Vì lý do bảo mật, vui lòng thử lại sau ${LOCK_MIN} phút hoặc gọi hotline ${HOTLINE}.`); } // E19
      boxes[0].focus();
      return alertBox('otp', 'err', 'Mã xác nhận không đúng', `Vui lòng kiểm tra lại tin nhắn. Bạn còn ${OTP_MAX_TRY - otp.tries} lần thử.`); // E15
    }
    clearInterval(otp.timer); const mode = otp.mode, data = otp.data || {}; otp.mode = '';
    if (mode === 'register' || mode === 'verify') {
      const acc = updateAcc(data.email, { verified: true });
      if (mode === 'register') { setUser(makeUser(acc, { fresh: true })); fReg.reset(); meter.hidden = true; afterLogin = 'ho-so'; go('dang-ky-thanh-cong'); }
      else loginAs(acc);
    } else if (mode === 'reset') { resetMode = 'reset'; resetEmail = data.email; go('dat-lai-mat-khau'); }
    else if (mode === 'update') saveEdit(data.patch);
  });

  /* =================================================================
     M05 QUÊN MẬT KHẨU · E21   |   M07 ĐẶT LẠI / ĐỔI MẬT KHẨU · E22   |   M08
     ================================================================= */
  const fForgot = $('#f-forgot');
  fForgot.addEventListener('input', () => { clearErrs(fForgot); alertBox('quen-mat-khau'); });
  fForgot.addEventListener('submit', async e => {
    e.preventDefault(); clearErrs(fForgot); alertBox('quen-mat-khau');
    const id = fForgot.id.value.trim();
    if (!id) return void setErr(fForgot, 'id', 'Vui lòng nhập email hoặc số điện thoại');
    if (!isEmail(id) && !FB.isPhone(id)) return void setErr(fForgot, 'id', 'Email hoặc số điện thoại không đúng định dạng');
    if (offline()) return alertBox('quen-mat-khau', 'info', 'Mất kết nối mạng', 'Không thể gửi mã lúc này. Kiểm tra kết nối rồi thử lại.');
    const btn = $('[type="submit"]', fForgot); busy(btn, true, 'Đang gửi mã…'); await wait(600); busy(btn, false);
    const acc = findAcc(id);
    if (!acc) return alertBox('quen-mat-khau', 'err', 'Email/SĐT chưa được đăng ký', 'Không tìm thấy tài khoản nào với thông tin này. Kiểm tra lại hoặc tạo tài khoản mới.', `<a class="mb-link" href="#dang-ky" data-prefill="${esc(id)}">Đăng ký tài khoản</a>`); // E21
    fForgot.reset(); startOtp('reset', acc.phone, { email: acc.email });
  });

  const fReset = $('#f-reset');
  function prepReset() {
    fReset.reset(); clearErrs(fReset); alertBox('dat-lai-mat-khau'); paintRules('');
    const change = resetMode === 'change', back = $('[data-reset-back]');
    $('#t-reset').textContent = change ? 'Đổi mật khẩu' : 'Tạo mật khẩu mới';
    back.setAttribute('href', change ? '#cap-nhat' : '#dang-nhap');
    back.lastChild.textContent = change ? 'Quay lại cập nhật thông tin' : 'Quay lại đăng nhập';
    $('[type="submit"]', fReset).textContent = change ? 'Lưu mật khẩu mới' : 'Đặt lại mật khẩu';
  }
  function paintRules(pw) { const [len, cs, num, sp] = pwScore(pw); const ok = { len, case: cs, num, special: sp }; $$('[data-rule]', fReset).forEach(li => li.classList.toggle('is-ok', !!ok[li.dataset.rule])); }
  fReset.addEventListener('input', e => { if (e.target.name) setErr(fReset, e.target.name, ''); paintRules(fReset.pw.value); });
  fReset.addEventListener('submit', e => {
    e.preventDefault(); clearErrs(fReset); alertBox('dat-lai-mat-khau');
    const pw = fReset.pw.value, pw2 = fReset.pw2.value, acc = accounts().find(a => a.email === resetEmail);
    if (!acc) return alertBox('dat-lai-mat-khau', 'warn', 'Không thể đổi mật khẩu', 'Tài khoản này đăng nhập bằng popup nhanh hoặc Google/Facebook nên chưa có mật khẩu riêng.');
    let bad = false;
    if (!pw) bad = setErr(fReset, 'pw', 'Vui lòng nhập mật khẩu mới') || bad;
    else if (!pwStrong(pw)) bad = setErr(fReset, 'pw', 'Mật khẩu chưa đạt 3 yêu cầu bắt buộc bên dưới') || bad;
    else if (acc.pw === pw) bad = setErr(fReset, 'pw', 'Mật khẩu mới không được trùng mật khẩu cũ') || bad;                    // E22
    if (!pw2) bad = setErr(fReset, 'pw2', 'Vui lòng nhập lại mật khẩu mới') || bad;
    else if (pw && pw2 !== pw) bad = setErr(fReset, 'pw2', 'Mật khẩu nhập lại không khớp') || bad;                              // E22
    if (bad) { $('.is-error input', fReset)?.focus(); return; }
    updateAcc(acc.email, { pw, fails: 0, lockUntil: 0 });
    go('doi-mat-khau-thanh-cong');
  });
  function prepPwOk() {
    const change = resetMode === 'change' && getUser();
    const a = $('[data-pwok-next]'); a.textContent = change ? 'Về hồ sơ' : 'Đăng nhập'; a.setAttribute('href', change ? '#ho-so' : '#dang-nhap');
    resetMode = ''; resetEmail = '';
  }

  /* =================================================================
     M10 HỒ SƠ THÀNH VIÊN  ·  E23–E26
     ================================================================= */
  const REWARDS = [
    { id: 'tiramisu', name: 'Tiramisu miễn phí', desc: 'Áp dụng khi dùng bữa tại nhà hàng', cost: 300, prefix: 'TIRA' },
    { id: 'giam10', name: 'Giảm 10% hóa đơn', desc: 'Tối đa 150.000 VND • HSD 31/12/2026', cost: 500, prefix: 'GIAM10' },
    { id: 'cau-hon', name: 'Ưu đãi gói Cầu hôn', desc: 'Giảm 15% gói Setup Cầu hôn / Sinh nhật', cost: 1500, prefix: 'SETUP15' }
  ];
  const item = (href, ic, t, s) => `<a class="mb-item" href="${href}"><span class="mb-item__ic">${I(ic)}</span><span class="mb-item__txt"><strong>${esc(t)}</strong><small>${esc(s)}</small></span>${I('chevron-right')}</a>`;
  const avatarHtml = u => u.avatar ? `<img src="${esc(u.avatar)}" alt="Ảnh đại diện của ${esc(u.name)}">` : esc(initials(u.name));
  let profileLoaded = false;
  function renderProfile() {
    const box = $('[data-profile]'), u = getUser(); if (!u) return;
    if (offline()) { // E25
      box.innerHTML = `<div class="mb-empty">${I('wifi-off')}<h1 class="t-h3">Không tải được dữ liệu</h1><p class="t-body c-gray">Kết nối mạng đang gián đoạn nên chưa thể tải hồ sơ thành viên. Kiểm tra Wi-Fi hoặc 4G rồi thử lại.</p><button type="button" class="btn btn--navy" data-retry>${I('refresh')}Thử lại</button></div>`;
      return;
    }
    if (!profileLoaded) { // E24 – khung chờ trong lúc tải dữ liệu
      box.innerHTML = `<div class="mb-skel" aria-busy="true" aria-label="Đang tải hồ sơ"><i class="mb-skel__hero"></i><i class="mb-skel__btn"></i><i></i><i></i><i></i><i></i></div>`;
      profileLoaded = true; setTimeout(() => { if (current === 'ho-so') renderProfile(); }, 450); return;
    }
    const nt = nextTier(u.points), favN = (FB.Fav ? FB.Fav.all() : []).length;
    const R = window.FB_TRA_CUU && FB_TRA_CUU.rules, upcoming = R ? (u.bookings || []).filter(R.isUpcoming).length : 0, shipping = R ? (u.orders || []).filter(R.isActiveOrder).length : 0;
    const canRedeem = REWARDS.filter(r => u.points >= r.cost).length;
    const pct = nt ? Math.min(100, Math.round(u.points / nt[1] * 100)) : 100;
    const noActivity = !(u.bookings || []).length && !(u.orders || []).length;
    const histSub = upcoming || shipping ? [upcoming && `${upcoming} bàn sắp tới`, shipping && `${shipping} đơn đang xử lý`].filter(Boolean).join(' • ') : noActivity ? 'Chưa có hoạt động' : 'Xem các lượt đặt bàn và đơn đã giao';
    box.innerHTML = `
      <div class="mb-hero">
        <span class="mb-avatar">${avatarHtml(u)}</span>
        <div class="mb-hero__info"><h1 class="mb-hero__name">${esc(u.name)}</h1>
          <span class="mb-hero__tier">${I('star')}Thành viên ${u.tier} • ${esc(u.code)}</span>
          <small>${[u.email, fmtPhone(u.phone)].filter(Boolean).map(esc).join(' • ') || esc(u.id || '')}</small></div>
        <div class="mb-hero__pts"><b>${vnd(u.points)} điểm</b><span>${nt ? 'Hạng kế: ' + nt[0] : 'Hạng cao nhất'}</span></div>
        <div class="mb-bar-prog" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="Tiến độ lên hạng"><i style="width:${pct}%"></i></div>
        <p class="mb-hero__note">${nt ? `Còn ${vnd(nt[1] - u.points)} điểm để lên hạng ${nt[0]}` : 'Bạn đang ở hạng Bạch Kim – giảm 10% mọi hóa đơn.'}</p>
      </div>
      <a class="btn btn--outline btn--block" href="#cap-nhat">Chỉnh sửa hồ sơ</a>
      ${noActivity ? `<div class="mb-box mb-start"><strong>${I('sparkle')}Bắt đầu tích điểm</strong><p class="t-body-s c-gray">Bạn chưa có hoạt động nào. Mỗi lần đặt bàn hoặc đặt món, bạn nhận 5% giá trị đơn thành điểm thưởng.</p>
        <div class="mb-row2"><a class="btn btn--navy" href="dat_ban.html">Đặt bàn</a><a class="btn btn--outline" href="thuc_don.html">Xem thực đơn</a></div></div>` : ''}
      <h2 class="t-h4 mb-sub">Tài khoản của tôi</h2>
      <nav class="mb-list" aria-label="Tài khoản của tôi">
        ${item('#the-thanh-vien', 'star', 'Thẻ thành viên & đổi điểm', `${vnd(u.points)} điểm • ${canRedeem ? canRedeem + ' ưu đãi có thể đổi' : 'chưa đủ điểm đổi ưu đãi'}`)}
        ${item('#lich-su', 'clock', 'Lịch sử đặt bàn & giao hàng', histSub)}
        ${item('#yeu-thich', 'heart', 'Món yêu thích', favN ? `${favN} món đã lưu` : 'Chưa lưu món nào')}
        ${item('#cap-nhat', 'edit', 'Cập nhật thông tin', 'Họ tên, ngày sinh, email, số điện thoại')}
      </nav>
      <button type="button" class="btn btn--block mb-logout" data-mb-logout>Đăng xuất</button>`;
  }
  document.addEventListener('click', e => {
    if (e.target.closest('[data-retry]')) { profileLoaded = false; renderProfile(); }
    if (e.target.closest('[data-mb-logout]')) // E26
      dialog({ id: 'mb-logout', icon: 'user', tone: 'wine', title: 'Đăng xuất khỏi tài khoản?', desc: 'Bạn sẽ cần đăng nhập lại để xem điểm thưởng và lịch sử. Giỏ hàng vẫn được giữ trên thiết bị này.', cancel: 'Ở lại', ok: 'Đăng xuất', okStyle: 'wine' },
        () => { setUser(null); profileLoaded = false; afterLogin = 'ho-so'; FB.toast('Đã đăng xuất', 'Hẹn gặp lại bạn tại Fiabesco Palace.', '', '', 'navy'); go('dang-nhap'); });
  });
  window.addEventListener('online', () => { if (current === 'ho-so') { profileLoaded = false; renderProfile(); } });

  /* =================================================================
     M11 THẺ THÀNH VIÊN & ĐỔI ĐIỂM  ·  E27–E29
     ================================================================= */
  // Số thẻ in trên thẻ (Figma M11: "FP 2048 1937"); tài khoản khác: 8 số suy ra từ mã thành viên
  const cardNo = u => { if (u.card) return u.card; const d = String(u.code || '').replace(/\D/g, ''); const n = (d + d.split('').reverse().join('') + '00000000').slice(0, 8); return `FP ${n.slice(0, 4)} ${n.slice(4)}`; };
  function renderCard() {
    const u = getUser(); if (!u) return;
    const [tier, , label] = tierOf(u.points), nt = nextTier(u.points);
    const pct = Math.min(100, Math.round(u.points / 2000 * 100));
    const log = u.log || [], vouchers = u.vouchers || [];
    $('[data-card]').innerHTML = `
      <div class="mb-card mb-card--${label.toLowerCase()}">
        <div class="mb-card__top"><span class="mb-card__logo">Fiabesco Palace<small>Italy on Every Plate</small></span><span class="mb-card__tier">${label}</span></div>
        <span class="mb-card__lbl">Điểm tích lũy</span><b class="mb-card__pts">${vnd(u.points)}</b>
        <div class="mb-card__bot"><span>${esc(u.name.toUpperCase())}</span><span class="mb-card__no">${esc(cardNo(u))}</span></div>
      </div>
      <div class="mb-box mb-tierbox">
        <div class="mb-tierbox__lbl">${TIERS.map(t => `<span class="${t[0] === tier ? 'is-on' : ''}">${t[0]}</span>`).join('')}</div>
        <div class="mb-bar-prog mb-bar-prog--light"><i style="width:${pct}%"></i></div>
        <p class="t-body">${nt ? `Tích thêm ${vnd(nt[1] - u.points)} điểm để lên ${nt[0]}${nt[0] === 'Bạch Kim' ? ' – giảm 10% mọi hóa đơn.' : '.'}` : 'Bạn đang ở hạng Bạch Kim – giảm 10% mọi hóa đơn.'}</p>
      </div>
      ${vouchers.length ? `<h2 class="t-h4 mb-sub">Mã ưu đãi của bạn</h2><div class="mb-vouchers">${vouchers.map(v => `<div class="mb-voucher"><div><strong>${esc(v.name)}</strong><small>Đổi ngày ${esc(v.date)} · hiệu lực 30 ngày</small></div><button type="button" class="code" data-copy="${esc(v.code)}" aria-label="Sao chép mã ${esc(v.code)}">${esc(v.code)}${I('copy')}</button></div>`).join('')}</div>` : ''}
      <h2 class="t-h4 mb-sub">Đổi điểm lấy ưu đãi</h2>
      <div class="mb-rewards">${REWARDS.map(r => { const ok = u.points >= r.cost; return `<div class="mb-reward${ok ? '' : ' is-locked'}"><span class="mb-reward__ic">${I('gift')}</span>
        <div class="mb-reward__txt"><strong>${r.name}</strong><small>${r.desc}</small><b>${vnd(r.cost)} điểm</b></div>
        ${ok ? `<button type="button" class="mb-reward__btn" data-redeem="${r.id}">Đổi</button>` : `<span class="mb-reward__btn is-off" title="Còn thiếu ${vnd(r.cost - u.points)} điểm">Chưa đủ</span>`}</div>`; }).join('')}</div>
      ${u.points < REWARDS[0].cost ? `<p class="t-body-s c-gray mb-note">Bạn cần tối thiểu ${REWARDS[0].cost} điểm để đổi ưu đãi đầu tiên. Đặt bàn hoặc đặt món để tích thêm điểm.</p>` : ''}
      <h2 class="t-h4 mb-sub">Lịch sử điểm</h2>
      ${log.length ? `<div class="mb-box mb-log">${log.map(([t, d, v]) => `<div class="mb-log__row"><div><strong>${esc(t)}</strong><small>${esc(d)}</small></div><b class="${v < 0 ? 'is-minus' : ''}">${v > 0 ? '+' : '−'}${vnd(Math.abs(v))}</b></div>`).join('')}</div>`
        : `<div class="mb-box mb-empty-sm">${I('clock')}<p class="t-body-s c-gray">Chưa có lịch sử điểm. Điểm sẽ được cộng sau mỗi đơn hoàn thành.</p></div>`}`; // E29
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-redeem]');
    if (b) {
      const r = REWARDS.find(x => x.id === b.dataset.redeem), u = getUser(); if (!r || !u || u.points < r.cost) return;
      dialog({ id: 'mb-redeem', icon: 'gift', title: `Đổi ${vnd(r.cost)} điểm lấy ${r.name}?`, desc: `Sau khi đổi, bạn còn ${vnd(u.points - r.cost)} điểm. Mã ưu đãi có hiệu lực 30 ngày và không thể hoàn điểm sau khi đổi.`, cancel: 'Để sau', ok: 'Xác nhận đổi' }, () => { // E27
        const me = getUser(); if (!me || me.points < r.cost) return;
        const code = `FB-${r.prefix}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        me.points -= r.cost; me.log = [[`Đổi ${r.name}`, dmy(new Date()), -r.cost], ...(me.log || [])];
        me.vouchers = [{ code, name: r.name, date: dmy(new Date()) }, ...(me.vouchers || [])];
        setUser(me); renderCard();
        dialog({ id: 'mb-redeem-ok', icon: 'check', tone: 'green', title: 'Đổi điểm thành công!', desc: `Mã ưu đãi “${r.name}” đã được lưu vào thẻ thành viên. Đưa mã cho nhân viên hoặc nhập ở bước thanh toán.`, // E28
          extra: `<button type="button" class="code mb-code-lg" data-copy="${code}">${code}${I('copy')}</button>`, actions: [{ label: 'Đóng', style: 'navy' }] });
      });
    }
    const c = e.target.closest('[data-copy]');
    if (c) { const code = c.dataset.copy; (navigator.clipboard ? navigator.clipboard.writeText(code) : Promise.reject()).catch(() => {}); FB.toast('Đã sao chép mã ' + esc(code), 'Dán mã ở bước thanh toán để áp dụng ưu đãi.', '', '', 'navy'); }
  });

  /* =================================================================
     M12a/M12b LỊCH SỬ ĐẶT BÀN & GIAO HÀNG  ·  E30–E34
     ================================================================= */
  const empty = (ic, t, d, href, label) => `<div class="mb-empty">${I(ic)}<h2 class="t-h3">${t}</h2><p class="t-body c-gray">${d}</p><a class="btn btn--navy" href="${href}">${label}</a></div>`;
  /* Thẻ, popup hủy bàn / đổi lịch / hủy đơn dùng component chung FB_DON
     (js/components/don_dat.js) — giống hệt trang Tra cứu (tra_cuu.html).
     Thành viên đã đăng nhập nên không cần OTP khi thao tác trên lịch sử của mình. */
  // API thành viên: cùng tên hàm với FB_TRA_CUU.guestApi; dữ liệu demo lưu trong đối tượng người dùng.
  // TODO(BE): thay bằng các endpoint có token thành viên (xem chú thích trong js/data/tra_cuu.js).
  const memberApi = window.FB_TRA_CUU ? FB_TRA_CUU.createApi({
    load: () => { const u = getUser() || {}; return { name: u.name, bookings: u.bookings || [], orders: u.orders || [] }; },
    save: (_, d) => { const u = getUser(); if (!u) return; u.bookings = d.bookings; u.orders = d.orders; setUser(u); }
  }) : null;
  function renderHistory() {
    const u = getUser(); if (!u) return;
    const tab = sub === 'giao-hang' ? 'giao-hang' : 'dat-ban';
    $$('[data-tab]').forEach(b => { const on = b.dataset.tab === tab; b.classList.toggle('is-active', on); b.setAttribute('aria-selected', on); });
    const box = $('[data-history]');
    if (!window.FB_DON || !memberApi) { box.innerHTML = '<p class="t-body c-gray">Thiếu js/components/don_dat.js hoặc js/data/tra_cuu.js.</p>'; return; }
    box.innerHTML = tab === 'dat-ban'
      ? FB_DON.bookingsHtml(u.bookings || [], { emptyTitle: 'Bạn chưa có lượt đặt bàn nào', emptyText: 'Đặt bàn trước để được giữ chỗ đẹp, chọn gói trang trí và tích điểm thành viên.' }) // E30
      : FB_DON.ordersHtml(u.orders || [], { emptyTitle: 'Bạn chưa có đơn giao hàng nào', emptyText: 'Đặt món yêu thích và nhận tận nơi trong 30–40 phút. Mỗi đơn đều được tích điểm.' }); // E31
    FB.hydrateIcons(box);
    FB_DON.mount(box, {
      api: memberApi,
      ctx: () => getUser(),                         // đã đăng nhập = đã xác thực
      reverify: () => go('dang-nhap'),
      find: (kind, code) => ((getUser() || {})[kind === 'order' ? 'orders' : 'bookings'] || []).find(x => x.code === code),
      onChange: () => renderHistory()
    });
  }
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-tab]'); if (t) { history.replaceState(null, '', '#lich-su/' + t.dataset.tab); sub = t.dataset.tab; renderHistory(); }
  });

  /* =================================================================
     M13 MÓN YÊU THÍCH  ·  E35–E36
     ================================================================= */
  let lastRemoved = null;
  function renderFavs() {
    const box = $('[data-favs]'), ids = FB.Fav ? FB.Fav.all() : [];
    const list = ids.map(id => D.byId(id)).filter(Boolean);
    const status = {}; if (DEMO === 'het-hang') { if (list[0]) status[list[0].id] = 'out'; if (list[1]) status[list[1].id] = 'stop'; } // E36 xem nhanh
    const undo = lastRemoved ? `<div class="mb-undo" role="status">${I('heart')}<span>Đã bỏ <b>${esc(lastRemoved.name)}</b> khỏi danh sách yêu thích.</span><button type="button" data-undo>Hoàn tác</button></div>` : '';
    if (!list.length) { // E35
      box.innerHTML = undo + empty('heart', 'Chưa có món yêu thích', 'Nhấn biểu tượng ♥ trên món ăn để lưu lại và đặt nhanh hơn ở lần sau.', 'thuc_don.html', 'Khám phá thực đơn'); return;
    }
    box.innerHTML = `${undo}<p class="t-body c-gray mb-count">${list.length} món bạn đã lưu</p><div class="mb-favs">${list.map(d => {
      const s = status[d.id];
      return `<article class="mb-fav${s ? ' is-off' : ''}"><a class="mb-fav__img" href="chi_tiet_mon.html?id=${d.id}"><img src="${d.img}" alt="${esc(d.name)}" loading="lazy">${s ? `<span>${s === 'out' ? 'Tạm hết hàng' : 'Ngừng bán'}</span>` : ''}</a>
        <div class="mb-fav__body"><a class="mb-fav__name" href="chi_tiet_mon.html?id=${d.id}">${esc(d.name)}</a><p class="t-caption c-gray">${esc(d.desc)}</p>
          <div class="between"><span class="mb-fav__price">${vnd(d.price)} <small>VND</small></span>
          ${s ? `<small class="c-wine">${s === 'out' ? 'Có lại vào ngày mai' : 'Món đã ngừng phục vụ'}</small>` : `<button type="button" class="mb-fav__add" data-fav-add="${d.id}" aria-label="Thêm ${esc(d.name)} vào giỏ">${I('plus')}</button>`}</div></div>
        <button type="button" class="mb-fav__heart" data-fav-rm="${d.id}" aria-label="Bỏ ${esc(d.name)} khỏi yêu thích">${I('heart')}</button></article>`; }).join('')}</div>`;
  }
  document.addEventListener('click', e => {
    const rm = e.target.closest('[data-fav-rm]');
    if (rm) { const id = rm.dataset.favRm; lastRemoved = { id, name: (D.byId(id) || {}).name || '', idx: FB.Fav.all().indexOf(id) }; if (FB.Fav.has(id)) FB.Fav.toggle(id); renderFavs(); return; }
    if (e.target.closest('[data-undo]') && lastRemoved) { const a = FB.Fav.all().filter(x => x !== lastRemoved.id); a.splice(Math.max(0, lastRemoved.idx), 0, lastRemoved.id); FB.Fav.set(a); lastRemoved = null; renderFavs(); return; }
    const add = e.target.closest('[data-fav-add]');
    if (add) { const id = add.dataset.favAdd; FB.Cart.add(id); if (FB.openAdded) FB.openAdded(id); else FB.toast('Đã thêm vào giỏ', esc((D.byId(id) || {}).name || ''), 'Xem giỏ', 'gio_hang.html', 'navy'); }
  });

  /* =================================================================
     M14 CẬP NHẬT THÔNG TIN  ·  E37–E40
     ================================================================= */
  const fEdit = $('#f-edit'); let editSnap = '', pendingAvatar = null;
  const editVals = () => ({ name: fEdit.name.value.trim().replace(/\s+/g, ' '), dob: fEdit.dob.value, email: fEdit.email.value.trim(), phone: FB.normPhone(fEdit.phone.value) });
  const editDirty = () => editSnap !== '' && (JSON.stringify(editVals()) !== editSnap || pendingAvatar !== null);
  function editReset() { pendingAvatar = null; editSnap = ''; }
  function fillEdit() {
    const u = getUser(); if (!u) return;
    clearErrs(fEdit); $('[data-avatar-error]').textContent = '';
    fEdit.name.value = u.name || ''; fEdit.dob.value = u.dob || ''; fEdit.email.value = u.email || ''; fEdit.phone.value = fmtPhone(u.phone);
    fEdit.dob.max = new Date().toISOString().slice(0, 10);
    pendingAvatar = null; fEdit.avatar.value = ''; $('[data-edit-avatar]').innerHTML = avatarHtml(u); editSnap = JSON.stringify(editVals());
  }
  fEdit.addEventListener('input', e => { if (e.target.name && e.target.name !== 'avatar') setErr(fEdit, e.target.name, ''); });
  fEdit.avatar.addEventListener('change', () => { // E37 – ảnh không hợp lệ
    const f = fEdit.avatar.files[0], err = $('[data-avatar-error]'); err.textContent = ''; if (!f) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(f.type)) { err.textContent = 'Ảnh không hợp lệ: chỉ nhận JPG, PNG hoặc WEBP.'; fEdit.avatar.value = ''; return; }
    if (f.size > 5 * 1024 * 1024) { err.textContent = 'Ảnh quá lớn: dung lượng tối đa 5MB.'; fEdit.avatar.value = ''; return; }
    const img = new Image(), url = URL.createObjectURL(f);
    img.onload = () => {
      const s = 160, c = document.createElement('canvas'); c.width = c.height = s; const k = Math.max(s / img.width, s / img.height);
      c.getContext('2d').drawImage(img, (s - img.width * k) / 2, (s - img.height * k) / 2, img.width * k, img.height * k);
      pendingAvatar = c.toDataURL('image/jpeg', 0.85); URL.revokeObjectURL(url); $('[data-edit-avatar]').innerHTML = `<img src="${pendingAvatar}" alt="Ảnh đại diện mới">`;
    };
    img.onerror = () => { URL.revokeObjectURL(url); err.textContent = 'Không đọc được ảnh này. Vui lòng chọn ảnh khác.'; fEdit.avatar.value = ''; };
    img.src = url;
  });
  fEdit.addEventListener('submit', e => {
    e.preventDefault(); clearErrs(fEdit);
    const v = editVals(), raw = fEdit.phone.value.trim(), u = getUser(); if (!u) return;
    let bad = false;
    if (!v.name) bad = setErr(fEdit, 'name', 'Vui lòng nhập họ và tên') || bad;
    else if (badName(v.name)) bad = setErr(fEdit, 'name', 'Họ tên chỉ gồm chữ cái và khoảng trắng') || bad;
    if (v.dob) { const d = new Date(v.dob + 'T00:00:00'), age = (Date.now() - d) / 315576e5; if (isNaN(d) || d > new Date()) bad = setErr(fEdit, 'dob', 'Ngày sinh không hợp lệ') || bad; else if (age < 13) bad = setErr(fEdit, 'dob', 'Thành viên cần từ 13 tuổi trở lên') || bad; }
    if (!v.email) bad = setErr(fEdit, 'email', 'Vui lòng nhập email') || bad;
    else if (!isEmail(v.email)) bad = setErr(fEdit, 'email', 'Email không đúng định dạng') || bad;
    if (!raw) bad = setErr(fEdit, 'phone', 'Vui lòng nhập số điện thoại') || bad;
    else if (!FB.isPhone(raw)) bad = setErr(fEdit, 'phone', 'Số điện thoại gồm 10 chữ số, bắt đầu bằng 0') || bad;
    const others = accounts().filter(a => a.email !== u.email);
    if (!bad && v.email.toLowerCase() !== (u.email || '').toLowerCase() && others.some(a => a.email.toLowerCase() === v.email.toLowerCase())) bad = setErr(fEdit, 'email', 'Email này đã được tài khoản khác sử dụng');
    if (!bad && v.phone !== u.phone && others.some(a => a.phone === v.phone)) bad = setErr(fEdit, 'phone', 'Số điện thoại này đã được tài khoản khác sử dụng');
    if (bad) { $('.is-error input', fEdit)?.focus(); return; }                                                               // E37
    const patch = { ...v }; if (pendingAvatar) patch.avatar = pendingAvatar;
    const phoneChanged = v.phone !== (u.phone || ''), mailChanged = v.email.toLowerCase() !== (u.email || '').toLowerCase();
    if (phoneChanged || mailChanged) { // E38 – đổi SĐT/email cần OTP
      const target = phoneChanged ? v.phone : v.email;
      dialog({ id: 'mb-verify', icon: 'shield-check', title: 'Xác thực thông tin mới', desc: `Để bảo vệ tài khoản, chúng tôi sẽ gửi mã OTP tới ${phoneChanged ? 'số điện thoại' : 'email'} mới ${esc(phoneChanged ? maskPhone(target) : target)}. Thông tin chỉ được lưu sau khi xác thực.`, cancel: 'Để sau', ok: 'Gửi mã OTP' },
        () => startOtp('update', target, { patch }));
      return;
    }
    saveEdit(patch);
  });
  function saveEdit(patch) {
    const u = getUser(); if (!u) return;
    const oldEmail = u.email; Object.assign(u, patch); setUser(u);
    updateAcc(oldEmail, { name: u.name, email: u.email, phone: u.phone, dob: u.dob, ...(patch.avatar ? { avatar: patch.avatar } : {}) });
    editReset();
    FB.toast('Đã lưu thay đổi', 'Thông tin thành viên của bạn đã được cập nhật.', '', '', 'navy'); // E39
    go('ho-so');
  }
  window.addEventListener('beforeunload', e => { if (current === 'cap-nhat' && editDirty()) { e.preventDefault(); e.returnValue = ''; } });

  /* ---------------- Khởi động ---------------- */
  accounts(); route();
});
