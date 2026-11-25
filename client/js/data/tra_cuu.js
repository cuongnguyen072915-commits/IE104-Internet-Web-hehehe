/* =====================================================================
   FIABESCO PALACE — js/data/tra_cuu.js
   Dữ liệu + lớp gọi máy chủ (giả lập) cho TRA CỨU ĐẶT BÀN / ĐƠN GIAO.
   Dùng chung bởi:
     - pages/tra_cuu.html   (khách vãn lai: SĐT + OTP, phiên 15 phút)
     - pages/thanh_vien.html (#lich-su: đặt bàn & đơn hàng của tôi)
   Giao diện (thẻ, popup hủy/đổi) nằm ở js/components/don_dat.js.

   QUY ƯỚC CHO BACKEND
   - Mọi chỗ cần máy chủ có ghi "TODO(BE)" + endpoint dự kiến. Khi lắp BE chỉ
     thay thân các hàm trong `guestApi` (và `memberApi` ở thanh_vien.js), giữ
     nguyên TÊN HÀM và DẠNG DỮ LIỆU trả về → không phải sửa giao diện.
   - Quy tắc nghiệp vụ (24 giờ, đổi lịch 1 lần, hủy đơn khi chưa giao) nằm ở
     `rules` để FE ẩn/hiện nút; BE vẫn phải kiểm tra lại khi nhận yêu cầu.

   DẠNG DỮ LIỆU
   Booking { code, status:'pending'|'confirmed'|'done'|'cancelled'|'expired',
             at:'ISO giờ bắt đầu', durationMin, guests, tableId, floor, zone,
             pkg, pkgName, deposit, paidVia, paidAt, rescheduled, refund?, name, phone }
   Order   { code, status:'placed'|'cooking'|'shipping'|'delivered'|'cancelled',
             at, eta, address, receiver, phone, items:[{id,name,qty,price,img}],
             subtotal, shipFee, discount, total, payMethod, paid, refund? }
   ===================================================================== */
window.FB_TRA_CUU = (function () {
  const HOTLINE = '0123 456 789', HOTLINE_TEL = 'tel:0123456789';
  const OTP = { LEN: 6, RESEND_SEC: 60, TTL_MIN: 5, MAX_WRONG: 5, LOCK_MIN: 15, MAX_SEND_10MIN: 5 };
  const SESSION_MIN = 15;            // xác minh 1 lần dùng cho cả phiên
  const CUTOFF_H = 24;               // hủy / đổi lịch trực tuyến phải trước 24 giờ
  const MAX_RESCHEDULE = 1;          // đổi lịch miễn phí 1 lần (Figma DL1)

  const B_STATUS = {
    pending: ['Chờ xác nhận cọc', 'gold'], confirmed: ['Đã xác nhận', 'green'], done: ['Đã dùng bữa', 'navy'],
    cancelled: ['Đã hủy', 'wine'], expired: ['Hết hạn giữ chỗ', 'gray']
  };
  const O_STATUS = {
    placed: ['Đã xác nhận', 'gold'], cooking: ['Bếp đang chuẩn bị', 'gold'], shipping: ['Đang giao hàng', 'wine'],
    delivered: ['Đã nhận món', 'green'], cancelled: ['Đã hủy', 'gray']
  };
  const O_STEPS = [['placed', 'Đã xác nhận', 'receipt'], ['cooking', 'Bếp đang chuẩn bị', 'chef-hat'], ['shipping', 'Đang giao hàng', 'delivery-truck'], ['delivered', 'Đã nhận món', 'home']];
  const PAY = { cod: 'Tiền mặt khi nhận', momo: 'Ví MoMo', zalopay: 'Ví ZaloPay', vietqr: 'Chuyển khoản VietQR', card: 'Thẻ ngân hàng' };

  /* ================= QUY TẮC (FE dùng để ẩn/hiện nút) ================= */
  const hoursUntil = b => (new Date(b.at).getTime() - Date.now()) / 36e5;
  const rules = {
    hoursUntil,
    isUpcoming: b => ['pending', 'confirmed'].includes(b.status) && hoursUntil(b) > -1.5,
    canCancelBooking: b => b.status === 'confirmed' && hoursUntil(b) >= CUTOFF_H,
    canReschedule: b => b.status === 'confirmed' && hoursUntil(b) >= CUTOFF_H && (b.rescheduled || 0) < MAX_RESCHEDULE,
    /** Trong vòng 24 giờ: không hủy/đổi trực tuyến, gọi hotline. */
    isLocked: b => b.status === 'confirmed' && hoursUntil(b) < CUTOFF_H,
    /** Đơn giao: hủy được khi nhà hàng đang chuẩn bị, chưa giao cho shipper. */
    canCancelOrder: o => ['placed', 'cooking'].includes(o.status),
    isActiveOrder: o => ['placed', 'cooking', 'shipping'].includes(o.status)
  };

  /* ================= TIỆN ÍCH ================= */
  const wait = (ms = 350) => new Promise(r => setTimeout(r, ms));
  const pad = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
  const at = (days, h, m = 0) => { const d = new Date(); d.setDate(d.getDate() + days); d.setHours(h, m, 0, 0); return iso(d); };
  const minsAgo = n => iso(new Date(Date.now() - n * 60e3));
  const normPhone = p => String(p || '').replace(/\D/g, '').replace(/^84/, '0');
  const isPhone = p => /^0\d{9}$/.test(normPhone(p));
  const maskPhone = p => { const d = normPhone(p); return d.length === 10 ? `${d.slice(0, 4)} *** ${d.slice(-3)}` : p; };
  const ss = {
    get(k, d) { try { const v = JSON.parse(sessionStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { sessionStorage.removeItem(k); } catch (e) {} }
  };
  const ls = {
    get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const dish = (id, qty) => {
    const d = window.FB_DATA && FB_DATA.byId ? FB_DATA.byId(id) : null;
    return { id, qty, name: d ? d.name : id, price: d ? d.price : 0, img: d ? d.img : '' };
  };
  const sumOrder = (o) => { o.subtotal = o.items.reduce((s, i) => s + i.price * i.qty, 0); o.total = o.subtotal + o.shipFee - o.discount; return o; };

  /* ================= DỮ LIỆU MẪU (xoá khi có BE) =================
     Mỗi SĐT hợp lệ có một bộ mẫu; riêng 0900000000 → không có đơn (TH7).
     ?demo=sat-gio : đặt bàn sắp tới chỉ còn ~5 giờ (không hủy/đổi trực tuyến). */
  function sample(phone) {
    if (normPhone(phone) === '0900000000') return { name: '', bookings: [], orders: [] };
    const near = (window.FB && FB.demo) === 'sat-gio';
    const name = normPhone(phone) === '0901234678' ? 'Nguyễn Văn An' : 'Nguyễn Văn Mai';
    const b = (o) => ({ durationMin: 90, rescheduled: 0, name, phone: normPhone(phone), ...o });
    const bookings = [
      b({ code: 'FB-2611-0042', status: 'confirmed', at: near ? iso(new Date(Date.now() + 5 * 36e5)).slice(0, 14) + '00:00' : at(3, 18, 30), guests: 6, tableId: 'T-01', floor: 1, zone: 'Khu bàn chính', pkg: 'sinh_nhat', pkgName: 'Sinh nhật', deposit: 350000, paidVia: 'VietQR', paidAt: minsAgo(60 * 26) }),
      b({ code: 'FB-1010-0013', status: 'done', at: at(-46, 19), guests: 4, tableId: 'L-04', floor: 2, zone: 'Khu vực ăn uống', pkg: 'mac_dinh', pkgName: 'Mặc định', deposit: 100000, paidVia: 'MoMo' }),
      b({ code: 'FB-2109-0007', status: 'cancelled', at: at(-65, 12), guests: 2, tableId: 'B-03', floor: 2, zone: 'Ban công', pkg: 'mac_dinh', pkgName: 'Mặc định', deposit: 50000, refund: 50000, paidVia: 'VietQR' })
    ];
    const o = (x) => sumOrder({ receiver: name, phone: normPhone(phone), address: '68 Lê Lợi, Phường Bến Nghé, Quận 1', shipFee: 25000, discount: 0, ...x });
    const orders = [
      o({ code: 'FB2611-0251', status: 'cooking', at: minsAgo(9), eta: iso(new Date(Date.now() + 31 * 60e3)), payMethod: 'zalopay', paid: true, items: [dish('lasagna', 1), dish('burrata', 2)], discount: 35000 }),
      o({ code: 'FB2611-0248', status: 'shipping', at: minsAgo(38), eta: iso(new Date(Date.now() + 14 * 60e3)), payMethod: 'cod', paid: false, items: [dish('risotto-kem', 1), dish('bolognese', 1)] }),
      o({ code: 'FB2410-0190', status: 'delivered', at: at(-18, 19, 10), payMethod: 'momo', paid: true, items: [dish('risotto-ga', 2), dish('lasagna', 1), dish('minestrone', 2)] })
    ];
    return { name, bookings, orders };
  }

  /* Kho giả lập theo SĐT (localStorage để hủy/đổi còn giữ khi tải lại trang) */
  const DB_KEY = 'fb_tra_cuu_demo_v1';
  const guestStore = {
    load(phone) { const all = ls.get(DB_KEY, {}), p = normPhone(phone); if (!all[p]) { all[p] = sample(p); ls.set(DB_KEY, all); } return all[p]; },
    save(phone, data) { const all = ls.get(DB_KEY, {}); all[normPhone(phone)] = data; ls.set(DB_KEY, all); }
  };

  /* ================= TẠO API TỪ MỘT "KHO" =================
     store = { load(ctx) → {name, bookings, orders}, save(ctx, data) }
     ctx   = phiên khách (SĐT đã xác minh) hoặc thành viên đang đăng nhập.
     Dùng cho cả khách lẫn thành viên để logic hủy/đổi chỉ viết một lần. */
  function createApi(store) {
    const find = (list, code) => list.find(x => x.code === code);
    return {
      /** TODO(BE): GET /api/tra-cuu/lich-su  (Authorization: phiên OTP | token thành viên)
       *  → { name, bookings: Booking[], orders: Order[] } */
      async getHistory(ctx) { await wait(); const d = store.load(ctx); return { name: d.name, bookings: d.bookings.slice(), orders: d.orders.slice() }; },

      /** TODO(BE): POST /api/dat-ban/{code}/huy
       *  → { ok, booking, refund } | { ok:false, code:'TOO_LATE'|'NOT_ALLOWED' }
       *  BE kiểm tra lại mốc 24 giờ và hoàn 100% cọc. */
      async cancelBooking(ctx, code) {
        await wait(700); const d = store.load(ctx), b = find(d.bookings, code);
        if (!b) return { ok: false, code: 'NOT_FOUND' };
        if (!rules.canCancelBooking(b)) return { ok: false, code: rules.isLocked(b) ? 'TOO_LATE' : 'NOT_ALLOWED' };
        b.status = 'cancelled'; b.refund = b.deposit || 0; b.cancelledAt = iso(new Date()); store.save(ctx, d);
        return { ok: true, booking: b, refund: b.refund };
      },

      /** TODO(BE): POST /api/dat-ban/{code}/doi-lich  body { date, slotId, tableId, guests }
       *  → { ok, booking } | { ok:false, code:'TABLE_TAKEN'|'TOO_LATE'|'LIMIT' }
       *  Lịch/bàn trống lấy qua BookingAPI.getSlots / getTableStatus (js/data/dat_ban.js). */
      async rescheduleBooking(ctx, code, next) {
        await wait(800); const d = store.load(ctx), b = find(d.bookings, code);
        if (!b) return { ok: false, code: 'NOT_FOUND' };
        if (!rules.canReschedule(b)) return { ok: false, code: (b.rescheduled || 0) >= MAX_RESCHEDULE ? 'LIMIT' : 'TOO_LATE' };
        if (window.FB && FB.demo === 'ban-da-dat') return { ok: false, code: 'TABLE_TAKEN', tableId: next.tableId };
        const t = window.FB_DAT_BAN && FB_DAT_BAN.byId(next.tableId);
        const slot = window.FB_DAT_BAN && FB_DAT_BAN.SLOTS.find(s => s.id === next.slotId);
        b.prevAt = b.at; b.prevTableId = b.tableId;
        b.at = `${next.date}T${slot ? slot.start : '18:30'}:00`;
        b.tableId = next.tableId; if (t) { b.floor = t.floor; b.zone = t.zone; }
        b.guests = next.guests; b.rescheduled = (b.rescheduled || 0) + 1; store.save(ctx, d);
        return { ok: true, booking: b };
      },

      /** TODO(BE): POST /api/don-hang/{code}/huy
       *  → { ok, order, refund } | { ok:false, code:'TOO_LATE' } (đơn đã giao cho shipper) */
      async cancelOrder(ctx, code) {
        await wait(700); const d = store.load(ctx), o = find(d.orders, code);
        if (!o) return { ok: false, code: 'NOT_FOUND' };
        if (!rules.canCancelOrder(o)) return { ok: false, code: 'TOO_LATE' };
        o.status = 'cancelled'; o.refund = o.paid ? o.total : 0; o.cancelledAt = iso(new Date()); store.save(ctx, d);
        return { ok: true, order: o, refund: o.refund };
      }
    };
  }

  /* ================= KHÁCH VÃN LAI: OTP + PHIÊN ================= */
  const SESSION_KEY = 'fb_tra_cuu_phien', OTP_KEY = 'fb_tra_cuu_otp', SEND_KEY = 'fb_tra_cuu_gui';
  const session = {
    /** Phiên còn hạn → { phone, token, exp } ; hết hạn → null */
    get() { const s = ss.get(SESSION_KEY, null); return s && s.exp > Date.now() ? s : null; },
    clear() { ss.del(SESSION_KEY); }
  };
  const guestApi = {
    ...createApi({ load: s => guestStore.load(s.phone), save: (s, d) => guestStore.save(s.phone, d) }),

    /** TODO(BE): POST /api/tra-cuu/otp  body { phone }
     *  → { ok, resendIn } | { ok:false, code:'INVALID_PHONE'|'TOO_MANY'|'LOCKED', retryAt }
     *  BE gửi SMS; chặn quá MAX_SEND_10MIN lần / 10 phút / SĐT (Figma T08). */
    async sendOtp(phone) {
      await wait(500);
      if (!isPhone(phone)) return { ok: false, code: 'INVALID_PHONE' };
      const p = normPhone(phone), now = Date.now();
      const o = ss.get(OTP_KEY, {});
      if (o.phone === p && o.lockUntil > now) return { ok: false, code: 'LOCKED', retryAt: o.lockUntil };
      const sends = ss.get(SEND_KEY, []).filter(t => now - t.at < 10 * 60e3 && t.phone === p);
      if (sends.length >= OTP.MAX_SEND_10MIN) return { ok: false, code: 'TOO_MANY', retryAt: sends[0].at + 10 * 60e3 };
      ss.set(SEND_KEY, [...ss.get(SEND_KEY, []), { phone: p, at: now }]);
      const code = String(Math.floor(100000 + Math.random() * 900000)); // GIẢ LẬP — BE gửi SMS, FE không bao giờ nhận mã
      ss.set(OTP_KEY, { phone: p, code, exp: now + OTP.TTL_MIN * 60e3, wrong: 0, lockUntil: 0 });
      return { ok: true, resendIn: OTP.RESEND_SEC, devCode: code };
    },

    /** TODO(BE): POST /api/tra-cuu/otp/xac-minh  body { phone, code }
     *  → { ok, token, expiresAt } | { ok:false, code:'WRONG'|'EXPIRED'|'LOCKED', left } */
    async verifyOtp(phone, code) {
      await wait(600);
      const p = normPhone(phone), o = ss.get(OTP_KEY, {}), now = Date.now();
      if (o.phone !== p) return { ok: false, code: 'EXPIRED' };
      if (o.lockUntil > now) return { ok: false, code: 'LOCKED', retryAt: o.lockUntil };
      if (o.exp < now) return { ok: false, code: 'EXPIRED' };
      if (String(code) !== o.code) {
        o.wrong += 1; if (o.wrong >= OTP.MAX_WRONG) o.lockUntil = now + OTP.LOCK_MIN * 60e3;
        ss.set(OTP_KEY, o); return o.lockUntil ? { ok: false, code: 'LOCKED', retryAt: o.lockUntil } : { ok: false, code: 'WRONG', left: OTP.MAX_WRONG - o.wrong };
      }
      ss.del(OTP_KEY);
      const s = { phone: p, token: 'demo-' + now.toString(36), exp: now + SESSION_MIN * 60e3 };
      ss.set(SESSION_KEY, s);
      return { ok: true, token: s.token, expiresAt: s.exp };
    },

    /** Thành viên đang đăng nhập tra cứu chính SĐT của mình → bỏ qua OTP.
     *  TODO(BE): dùng token thành viên thay cho phiên OTP. */
    trustPhone(phone) { const s = { phone: normPhone(phone), token: 'member', exp: Date.now() + SESSION_MIN * 60e3 }; ss.set(SESSION_KEY, s); return s; }
  };

  return { HOTLINE, HOTLINE_TEL, OTP, SESSION_MIN, CUTOFF_H, MAX_RESCHEDULE, B_STATUS, O_STATUS, O_STEPS, PAY,
    rules, createApi, guestApi, session, sample, normPhone, isPhone, maskPhone };
})();
