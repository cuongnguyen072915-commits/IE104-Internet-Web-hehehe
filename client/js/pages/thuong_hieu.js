/* Thương hiệu – Luồng Thương hiệu (Lam): kiểm tra & gửi form "Gửi tin nhắn cho chúng tôi" (Figma iPhone 17 - 4).
   Bản demo không có máy chủ nên chỉ báo đã nhận, không gửi dữ liệu đi đâu. */
document.addEventListener('fb:ready', () => {
  const { $, $$ } = FB;
  const form = $('#th-form'); if (!form) return;
  const ok = $('.th-form__ok', form);
  const setErr = (k, msg) => { const f = $(`[data-f="${k}"]`, form); f.classList.toggle('is-error', !!msg); $('.field__error', f).textContent = msg || ''; $('input,textarea', f).setAttribute('aria-invalid', msg ? 'true' : 'false'); return !!msg; };
  form.addEventListener('input', e => { if (e.target.name) setErr(e.target.name, ''); ok.hidden = true; });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = form.name.value.trim(), email = form.email.value.trim(), msg = form.msg.value.trim();
    let bad = false;
    bad = setErr('name', !name ? 'Vui lòng nhập họ và tên' : '') || bad;
    bad = setErr('email', !email ? 'Vui lòng nhập email' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'Email không đúng định dạng' : '') || bad;
    bad = setErr('msg', !msg ? 'Vui lòng nhập nội dung lời nhắn' : msg.length < 10 ? 'Lời nhắn cần tối thiểu 10 ký tự' : '') || bad;
    if (bad) { $('.is-error input, .is-error textarea', form).focus(); return; }
    if (navigator.onLine === false) { ok.textContent = 'Mất kết nối mạng – vui lòng thử lại khi có mạng.'; ok.className = 'th-form__ok is-err'; ok.hidden = false; return; }
    form.reset(); $$('.field', form).forEach(f => f.classList.remove('is-error'));
    ok.className = 'th-form__ok'; ok.textContent = `Cảm ơn ${name.split(' ').pop()}! Fiabesco đã nhận lời nhắn và sẽ phản hồi qua email trong 24 giờ (bản demo – chưa gửi thật).`; ok.hidden = false;
  });
});
