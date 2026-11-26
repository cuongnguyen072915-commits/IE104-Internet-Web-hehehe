/* =====================================================================
   FIABESCO PALACE — js/don_hang_store.js (MỚI)
   Mô hình đơn hàng + luồng trạng thái + cổng thanh toán (CHẾ ĐỘ MÔ PHỎNG).
   ---------------------------------------------------------------------
   ⚠ Dự án CHƯA có backend / cổng thanh toán thật. Toàn bộ dữ liệu ở đây được lưu
   trên trình duyệt (localStorage) và mọi thay đổi trạng thái thanh toán / giao hàng
   chỉ xảy ra qua các hàm của mô-đun này (điểm nối cho backend) — giao diện khách hàng không có nút đổi trạng thái.
   Không có trạng thái nào tự chuyển chỉ vì thời gian trôi qua.
   TODO(BE): thay OrderAPI/PaymentAPI bằng gọi API thật:
     POST /api/orders                    → tạo đơn, trả về id duy nhất
     GET  /api/orders/{id}               → trạng thái mới nhất (dùng khi tải lại trang)
     GET  /api/orders/{id}/events (SSE)  → cập nhật thời gian thực
     POST /api/payments {orderId,method} → URL cổng ZaloPay / phiên Apple Pay / VietQR
     GET  /api/payments/{ref}            → kết quả đã được cổng xác thực (IPN/callback)
   Nạp SAU main.js.
   ===================================================================== */
window.FB_ORDERS = (function () {
  const KEY = 'fb_orders_v1', LAST = 'fb_last_order_id', CHANNEL = 'fb_orders_ping';
  const CFG = { PREP_MIN: 20, DELIVERY_MIN: [15, 25], PICKUP_READY_MIN: 20, QR_TTL_MIN: 15 }; // thông số ước tính ETA

  /* ---------- Trạng thái (F4) ---------- */
  const STATUS = {
    PENDING_PAYMENT: { title: 'Đang chờ xác nhận thanh toán', banner: 'ĐANG CHỜ XÁC NHẬN THANH TOÁN', icon: 'wallet', tone: 'gold',
      desc: 'Fiabesco đang chờ cổng thanh toán xác nhận giao dịch. Bếp chỉ bắt đầu chuẩn bị sau khi thanh toán được xác nhận.', next: ['ORDER_PLACED', 'CANCELED'] },
    ORDER_PLACED: { title: 'Đặt hàng thành công', banner: 'ĐƠN HÀNG ĐÃ ĐƯỢC GỬI TỚI NHÀ HÀNG', icon: 'receipt', tone: 'navy',
      desc: 'Đơn hàng của bạn đã đến Fiabesco Palace và đang chờ nhà hàng xác nhận.', next: ['CONFIRMED', 'CANCELED'] },
    CONFIRMED: { title: 'Đã xác nhận', banner: 'ĐÃ XÁC NHẬN', icon: 'check', tone: 'navy',
      desc: 'Fiabesco Palace đã tiếp nhận và xác nhận đơn hàng. Bếp sẽ bắt đầu chuẩn bị ngay.', next: ['PREPARING', 'CANCELED'] },
    PREPARING: { title: 'Bếp đang chuẩn bị', banner: 'BẾP ĐANG CHUẨN BỊ MÓN', icon: 'chef-hat', tone: 'navy',
      desc: 'Đầu bếp Fiabesco đang chuẩn bị những món ăn trong đơn hàng của bạn.', next: ['DELIVERING', 'CANCELED'] },
    DELIVERING: { title: 'Đang giao hàng', banner: 'MÓN ĂN ĐANG TRÊN ĐƯỜNG GIAO', icon: 'delivery-truck', tone: 'navy',
      desc: 'Món ăn đã rời nhà hàng và đang được giao đến địa chỉ của bạn.', next: ['DELIVERED', 'FAILED_DELIVERY'] },
    DELIVERED: { title: 'Đã nhận món', banner: 'ĐƠN HÀNG ĐÃ ĐƯỢC GIAO THÀNH CÔNG', icon: 'home', tone: 'green',
      desc: 'Chúc bạn ngon miệng! Cảm ơn bạn đã chọn Fiabesco Palace.', next: [] },
    CANCELED: { title: 'Đã hủy', banner: 'ĐƠN HÀNG ĐÃ BỊ HỦY', icon: 'close', tone: 'wine',
      desc: 'Đơn hàng đã được hủy và không còn được chuẩn bị hay giao.', next: [] },
    FAILED_DELIVERY: { title: 'Không thể giao hàng', banner: 'CHƯA THỂ GIAO ĐƠN HÀNG', icon: 'alert-triangle', tone: 'wine',
      desc: 'Tài xế chưa thể giao đơn tới địa chỉ của bạn. Nhà hàng sẽ liên hệ để sắp xếp lại.', next: [] }
  };
  // Nhãn riêng cho đơn tự đến lấy
  const PICKUP_LABEL = { DELIVERING: { title: 'Sẵn sàng tại quầy', banner: 'MÓN ĐÃ SẴN SÀNG TẠI QUẦY', desc: 'Món đã được đóng gói, mời bạn đến chi nhánh 102 Tôn Dật Tiên để nhận.' },
    DELIVERED: { title: 'Đã nhận món', banner: 'BẠN ĐÃ NHẬN MÓN', desc: 'Chúc bạn ngon miệng! Cảm ơn bạn đã chọn Fiabesco Palace.' } };
  const STEPS = ['CONFIRMED', 'PREPARING', 'DELIVERING', 'DELIVERED'];
  const info = (o, s) => ({ code: s, ...STATUS[s], ...((o && o.pickup && PICKUP_LABEL[s]) || {}) });

  /* ---------- Lưu trữ ---------- */
  const all = () => { try { const v = JSON.parse(localStorage.getItem(KEY)); return v && typeof v === 'object' ? v : {}; } catch (e) { return {}; } };
  const saveAll = m => { try { localStorage.setItem(KEY, JSON.stringify(m)); localStorage.setItem(CHANNEL, String(Date.now())); } catch (e) {} };
  const get = id => (id ? all()[id] || null : null);
  function put(o) {
    // Tách bạch: orderStatus (trạng thái đơn) ↔ paymentStatus (trạng thái thanh toán)
    o.orderStatus = o.status; o.paymentStatus = o.pay.status; o.paymentMethod = PAY_CODE[o.pay.method] || o.pay.method;
    o.updatedAt = Date.now(); const m = all(); m[o.id] = o; saveAll(m);
    if (o.status !== 'PENDING_PAYMENT') { try { localStorage.setItem(LAST, o.id); } catch (e) {} }
    syncLegacy(o); return o;
  }
  const lastId = () => { try { return localStorage.getItem(LAST); } catch (e) { return null; } };
  /* Tương thích trang cũ (đơn đã hủy, đánh giá…) vẫn đọc sessionStorage "fb_order" */
  function syncLegacy(o) {
    try {
      sessionStorage.setItem('fb_order', JSON.stringify({ code: o.id, name: o.customer.name, phone: o.customer.phone, email: o.customer.email, addr: o.addr, apt: o.apt,
        address: o.address, deliveryArea: o.deliveryArea, pickup: o.pickup, pay: o.pay.label, total: o.total, items: o.items, sub: o.sub, fee: o.fee, disc: o.disc,
        placedAt: o.createdAt, canceled: o.status === 'CANCELED', canceledAt: o.status === 'CANCELED' ? statusAt(o, 'CANCELED') : undefined,
        deliveredAt: statusAt(o, 'DELIVERED') || undefined }));
    } catch (e) {}
  }

  /* ---------- Mã đơn duy nhất ---------- */
  function newId() {
    const d = new Date(), p = n => String(n).padStart(2, '0');
    const base = `FB${String(d.getFullYear()).slice(2)}${p(d.getMonth() + 1)}${p(d.getDate())}`;
    const m = all(); let id;
    do { id = `${base}-${(Date.now() % 1679616).toString(36).toUpperCase().padStart(4, '0')}${Math.floor(Math.random() * 1296).toString(36).toUpperCase().padStart(2, '0')}`; } while (m[id]);
    return id;
  }

  /* ---------- Thời gian ---------- */
  const statusAt = (o, s) => { const h = (o.history || []).filter(x => x.status === s).pop(); return h ? h.at : null; };
  const pad = n => String(n).padStart(2, '0');
  const hm = t => { const d = new Date(t); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const dmy = t => { const d = new Date(t); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`; };
  const fmtTime = t => (t ? `${hm(t)} · ${dmy(t)}` : '');
  /** ETA chỉ được tính sau khi nhà hàng xác nhận; trả về null nếu chưa xác định */
  function computeEta(o) {
    const now = Date.now();
    if (o.pickup) {
      const c = statusAt(o, 'CONFIRMED'); if (!c) return null;
      return { from: c + CFG.PICKUP_READY_MIN * 60000, to: c + (CFG.PICKUP_READY_MIN + 10) * 60000, updatedAt: now };
    }
    const dl = statusAt(o, 'DELIVERING');
    if (dl) return { from: dl + CFG.DELIVERY_MIN[0] * 60000, to: dl + CFG.DELIVERY_MIN[1] * 60000, updatedAt: now };
    const base = statusAt(o, 'PREPARING') || statusAt(o, 'CONFIRMED'); if (!base) return null;
    return { from: base + (CFG.PREP_MIN + CFG.DELIVERY_MIN[0]) * 60000, to: base + (CFG.PREP_MIN + CFG.DELIVERY_MIN[1]) * 60000, updatedAt: now };
  }

  /* ---------- Điểm thành viên: chỉ cộng khi đơn "Đã nhận món" ---------- */
  function awardPoints(o) {
    if (o.pointsAwarded || !o.member || !o.expectedPoints) return;
    try {
      const u = JSON.parse(localStorage.getItem('fb_user_v1'));
      if (!u || (u.id || u.email || u.name) !== o.member) return; // chỉ cộng cho đúng tài khoản đã đặt đơn
      u.points = (+u.points || 0) + o.expectedPoints;
      u.log = [[`Tích điểm đơn #${o.id}`, dmy(Date.now()), o.expectedPoints], ...(u.log || [])];
      localStorage.setItem('fb_user_v1', JSON.stringify(u));
      o.pointsAwarded = true;
    } catch (e) {}
  }

  /* ---------- Chuyển trạng thái (chỉ theo thứ tự hợp lệ) ---------- */
  function transition(id, to, note) {
    const o = get(id); if (!o) return { ok: false, error: 'Không tìm thấy đơn hàng' };
    if (!STATUS[o.status].next.includes(to)) return { ok: false, error: `Không thể chuyển từ "${STATUS[o.status].title}" sang "${STATUS[to].title}"` };
    o.status = to; o.history.push({ status: to, at: Date.now(), note: note || '' });
    o.eta = computeEta(o);
    if (to === 'DELIVERED') awardPoints(o);
    if (to === 'CANCELED' && o.pay.status === 'PENDING') o.pay.status = 'CANCELED';
    put(o); return { ok: true, order: o };
  }

  /* ---------- Tạo đơn ---------- */
  const PAY_CODE = { 'ZaloPay': 'ZALOPAY', 'VietQR': 'VIETQR', 'Thẻ quốc tế': 'CARD', 'Apple Pay': 'APPLE_PAY', 'Tiền mặt': 'CASH' };
  const PAY_LABEL = { 'ZaloPay': 'Ví ZaloPay', 'VietQR': 'Chuyển khoản VietQR', 'Thẻ quốc tế': 'Thẻ VISA / Mastercard', 'Apple Pay': 'Apple Pay', 'Tiền mặt': 'Tiền mặt khi nhận hàng' };
  function create(data) {
    const cash = data.method === 'Tiền mặt';
    const user = (() => { try { return JSON.parse(localStorage.getItem('fb_user_v1')); } catch (e) { return null; } })();
    const now = Date.now();
    const o = {
      id: newId(), createdAt: now, demo: true,
      customer: data.customer, addr: data.addr, address: data.address || null, deliveryArea: data.deliveryArea || null, apt: data.apt || '',
      pickup: !!data.pickup, note: data.note || '', when: data.when || 'now', slot: data.slot || '',
      items: data.items, sub: data.sub, fee: data.fee, disc: data.disc, bonus: data.bonus || 0, coupon: data.coupon || null, total: data.total,
      pay: { method: data.method, label: PAY_LABEL[data.method] || data.method, status: 'UNPAID', ref: null, paidAt: null },
      // Đơn đặt thành công khởi tạo ở trạng thái "Đã xác nhận" (CONFIRMED); đơn trả trước chờ cổng thanh toán xác nhận
      status: cash ? 'CONFIRMED' : 'PENDING_PAYMENT',
      history: cash ? [{ status: 'ORDER_PLACED', at: now }, { status: 'CONFIRMED', at: now }] : [{ status: 'PENDING_PAYMENT', at: now }],
      eta: null, member: user ? (user.id || user.email || user.name) : null,
      expectedPoints: Math.max(0, Math.round((+data.total || 0) / 10000)), pointsAwarded: false, review: null
    };
    o.eta = computeEta(o);
    return put(o);
  }
  /** Đổi phương thức cho đơn còn chờ thanh toán (không tạo đơn mới, không mất dữ liệu) */
  function setMethod(id, method, total, bonus) {
    const o = get(id); if (!o || o.status !== 'PENDING_PAYMENT') return null;
    o.pay = { method, label: PAY_LABEL[method] || method, status: 'UNPAID', ref: null, paidAt: null };
    if (total != null) { o.total = total; o.bonus = bonus || 0; o.disc = o.sub + o.fee - total; o.expectedPoints = Math.round(total / 10000); }
    return put(o);
  }
  /** Thanh toán tiền mặt khi đơn đang chờ (người dùng đổi sang tiền mặt) */
  function toCash(id, total) {
    const o = get(id); if (!o || o.status !== 'PENDING_PAYMENT') return null;
    o.pay = { method: 'Tiền mặt', label: PAY_LABEL['Tiền mặt'], status: 'UNPAID', ref: null, paidAt: null };
    if (total != null) { o.total = total; o.bonus = 0; o.disc = o.sub + o.fee - total; o.expectedPoints = Math.round(total / 10000); }
    put(o); transition(id, 'ORDER_PLACED', 'Khách chọn thanh toán tiền mặt khi nhận hàng');
    return transition(id, 'CONFIRMED').order;
  }

  /* =================================================================
     PaymentAPI — chưa có cổng thật. Kết quả chỉ thay đổi khi backend/cổng gọi demoResolve() (tương lai: IPN/callback).
     ================================================================= */
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const PaymentAPI = {
    gatewayConfigured: false, // TODO(BE): true khi có app_id/key ZaloPay, merchant Apple Pay, tài khoản nhận tiền thật
    async start(id) {
      await wait(400);
      const o = get(id); if (!o) throw new Error('Không tìm thấy đơn');
      if (o.pay.status === 'PAID') return { status: 'PAID', ref: o.pay.ref };
      o.pay.status = 'PENDING';
      o.pay.ref = o.pay.ref || `PAY-${o.id.slice(-6)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      o.pay.startedAt = Date.now();
      if (o.pay.method === 'VietQR') o.pay.expiresAt = Date.now() + CFG.QR_TTL_MIN * 60000;
      put(o);
      // Tích hợp thật: payUrl = order_url do ZaloPay Gateway trả về (KHÔNG phải https://zalo.me/vi/)
      return { status: 'PENDING', ref: o.pay.ref, payUrl: null, demo: true };
    },
    /** Kiểm tra trạng thái — tương lai: GET /api/payments/{ref} (kết quả do backend xác thực từ cổng) */
    async check(id) {
      await wait(900);
      const o = get(id); if (!o) return { status: 'ERROR' };
      if (o.pay.status === 'PENDING' && o.pay.expiresAt && Date.now() > o.pay.expiresAt) { o.pay.status = 'EXPIRED'; put(o); }
      return { status: o.pay.status, reason: o.pay.reason || '', order: o };
    },
    /** CHỈ DÙNG CHO DEMO: giả lập kết quả mà cổng thanh toán / ngân hàng gửi về backend */
    demoResolve(id, result, reason) {
      const o = get(id); if (!o || o.pay.status === 'PAID') return o;
      o.pay.status = result; o.pay.reason = reason || '';
      if (result === 'PAID') { o.pay.paidAt = Date.now(); put(o); transition(id, 'ORDER_PLACED', `Thanh toán ${o.pay.label} đã xác nhận`); transition(id, 'CONFIRMED'); return get(id); }
      put(o); return o;
    },
    /** Khách hủy giao dịch đang chờ (đơn vẫn được giữ để chọn phương thức khác) — TODO(BE): POST /api/payments/{ref}/cancel */
    cancel(id) {
      const o = get(id); if (!o || o.pay.status === 'PAID') return o;
      o.pay.status = 'CANCELED'; o.pay.reason = 'Khách hủy'; return put(o);
    }
  };

  /* ---------- Theo dõi thay đổi (thay cho SSE/WebSocket khi chưa có backend) ---------- */
  function subscribe(id, cb) {
    let last = JSON.stringify(get(id));
    const fire = () => { const now = JSON.stringify(get(id)); if (now !== last) { const prev = last ? JSON.parse(last) : null; last = now; cb(get(id), prev); } };
    const onStorage = e => { if (e.key === KEY || e.key === CHANNEL) fire(); };
    window.addEventListener('storage', onStorage);
    const t = setInterval(fire, 5000); // polling dự phòng — 1 interval duy nhất cho mỗi lần subscribe
    return { stop() { clearInterval(t); window.removeEventListener('storage', onStorage); }, poke: fire };
  }

  /* ---------- Đơn mẫu (chỉ tạo khi người dùng bấm "Xem đơn mẫu") ---------- */
  function createSample() {
    const D = window.FB_DATA;
    const items = ['lasagna', 'burrata', 'risotto-kem'].map((id, i) => { const d = D.byId(id); return { id, qty: i === 1 ? 2 : 1, unit: d.price, opt: 'Phần tiêu chuẩn' }; });
    const sub = items.reduce((s, i) => s + i.qty * i.unit, 0);
    const o = create({ method: 'Tiền mặt', customer: { name: 'Khách mẫu', phone: '0901234567', email: '' }, addr: '12 Nguyễn Huệ, Phường Sài Gòn, TP. Hồ Chí Minh', apt: '',
      items, sub, fee: 25000, disc: 0, total: sub + 25000 });
    o.sample = true; o.member = null; return put(o);
  }

  return { STATUS, STEPS, CFG, info, get, put, all, lastId, create, setMethod, toCash, transition, computeEta, statusAt, subscribe, PaymentAPI, createSample, hm, dmy, fmtTime, PAY_LABEL };
})();
