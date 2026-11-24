/* =====================================================================
   FIABESCO PALACE — js/data/thanh_toan_dat_coc.js
   Cấu hình + lớp gọi máy chủ (DepositAPI) cho trang Thanh toán đặt cọc
   (pages/thanh_toan_dat_coc.html · Figma › Page PC › "PC – 07b").

   NGUYÊN TẮC: trang này KHÔNG gọi bất kỳ cổng thanh toán / API trả phí nào.
   - Mã VietQR được tạo ngay trên trình duyệt theo chuẩn EMVCo/NAPAS
     (js/vendor/qrcode.js) — không gọi img.vietqr.io hay dịch vụ ngoài.
   - Ví điện tử (MoMo, ZaloPay, VNPAY) dùng CHÍNH mã VietQR đó: các ví này
     đều quét được VietQR để chuyển khoản vào tài khoản ngân hàng.
   - Cơ chế XÁC NHẬN đã nhận tiền để phát triển sau → mọi chỗ cần backend
     ghi "TODO(BE)". FE hiện chỉ ghi nhận "khách báo đã chuyển".
   ===================================================================== */
window.FB_DAT_COC = (function () {
  const IMG = "../assets/template-20261120T115451Z-1-001 - Copy/template/";

  /* ---------- Tài khoản nhận cọc ----------
     ⚠ SỐ LIỆU MINH HOẠ lấy từ Figma. TRƯỚC KHI CHẠY THẬT phải thay bằng tài
     khoản thật của nhà hàng (và đặt demo:false) — nếu không, khách quét mã sẽ
     chuyển tiền tới một tài khoản không phải của nhà hàng.
     TODO(BE): nên lấy từ GET /api/dat-coc/tai-khoan (đổi tài khoản không cần sửa FE).
     bin: mã ngân hàng 6 số theo NAPAS (Vietcombank = 970436). */
  const BANK = {
    demo: true,
    bankName: "Vietcombank",
    bin: "970436",
    accountNo: "7944569121",
    accountName: "NGUYEN TRAN PHU CUONG",
    transferPrefix: "FIAB", // nội dung CK = "FIAB <mã đặt bàn>" để đối soát
  };

  /* ---------- Ví điện tử (chỉ hướng dẫn quét VietQR, không tích hợp cổng ví) ---------- */
  const WALLETS = [
    {
      id: "momo",
      name: "MoMo",
      scan: "Mở MoMo › chọn “Quét mã” ở màn hình chính",
    },
    {
      id: "zalopay",
      name: "ZaloPay",
      scan: "Mở ZaloPay › chọn “Quét QR” ở màn hình chính",
    },
    {
      id: "vnpay",
      name: "VNPAY",
      scan: "Mở ứng dụng ngân hàng có VNPAY-QR › chọn “QR Pay”",
    },
  ];

  /* ---------- Thông tin chỗ ngồi theo khu (hiển thị ở thẻ "Bàn đã chọn") ---------- */
  const ZONE_INFO = {
    T: {
      img: IMG + "restaurant-wine-bar.jpg",
      desc: "nằm ở khu bàn chính gần quầy rượu, ánh đèn vàng ấm và gần lối phục vụ.",
    },
    V: {
      img: IMG + "restaurant-garden-terrace.jpg",
      desc: "đặt ngoài sân vườn, thoáng gió và nhiều cây xanh — hợp cho bữa tối nhẹ nhàng.",
    },
    VIP: {
      img: IMG + "restaurant-cozy-interior.jpg",
      desc: "trong phòng riêng có cửa đóng, yên tĩnh và có nhân viên phục vụ riêng.",
    },
    L: {
      img: IMG + "restaurant-evening-dining.jpg",
      desc: "ở khu ăn uống tầng 2, không gian rộng rãi, thoải mái cho nhóm bạn và gia đình.",
    },
    B: {
      img: IMG + "restaurant-garden-dinner.jpg",
      desc: "sát lan can ban công, nhìn ra phố — riêng tư và lãng mạn cho hai người.",
    },
  };
  const SHAPE_NAME = {
    r4: "Bàn tròn 4 ghế",
    r8: "Bàn tròn 8 ghế",
    q4: "Bàn vuông 4 ghế",
    h4: "Bàn chữ nhật 4 ghế",
    v6: "Bàn dài 6 ghế",
    h6: "Bàn dài 6 ghế",
    b2: "Bàn đôi",
    vip: "Bàn tròn lớn",
  };

  /* ================= VietQR (EMVCo Merchant-Presented QR) =================
     Cấu trúc: ID(2) + độ dài(2) + giá trị. Trường 38 = thông tin NAPAS 247.
     Chuỗi trả về được bất kỳ app ngân hàng / ví hỗ trợ VietQR quét được. */
  const tlv = (id, v) => id + String(v.length).padStart(2, "0") + v;
  function crc16(s) {
    // CRC-16/CCITT-FALSE
    let c = 0xffff;
    for (let i = 0; i < s.length; i++) {
      c ^= s.charCodeAt(i) << 8;
      for (let k = 0; k < 8; k++)
        c = c & 0x8000 ? ((c << 1) ^ 0x1021) & 0xffff : (c << 1) & 0xffff;
    }
    return c.toString(16).toUpperCase().padStart(4, "0");
  }
  /** Bỏ dấu & ký tự lạ — nội dung chuyển khoản chỉ nên dùng A–Z, 0–9, khoảng trắng. */
  const ascii = (s) =>
    String(s)
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .replace(/[^A-Za-z0-9 ]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase();
  function buildVietQR({ amount, content }) {
    const acc =
      tlv("00", "A000000727") +
      tlv("01", tlv("00", BANK.bin) + tlv("01", BANK.accountNo)) +
      tlv("02", "QRIBFTTA");
    let s =
      tlv("00", "01") +
      tlv("01", amount ? "12" : "11") +
      tlv("38", acc) +
      tlv("53", "704");
    if (amount) s += tlv("54", String(Math.round(amount)));
    s += tlv("58", "VN");
    if (content) s += tlv("62", tlv("08", ascii(content).slice(0, 50)));
    s += "6304";
    return s + crc16(s);
  }
  const transferContent = (bookingId) =>
    ascii(BANK.transferPrefix + " " + bookingId);

  /* ================= GIẢ LẬP (xoá khi có BE) ================= */
  const wait = (ms = 300) => new Promise((r) => setTimeout(r, ms));
  const PENDING_KEY = "fb_dat_ban_pending"; // trang Đặt bàn lưu đơn vào đây trước khi chuyển trang
  const REPORT_KEY = "fb_dat_coc_bao_cao"; // FE ghi nhớ "khách đã báo chuyển khoản"

  /** Đơn mẫu để xem giao diện khi mở trực tiếp: thanh_toan_dat_coc.html?demo=mau (hoặc ?demo=het-gio) */
  function sampleBooking() {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return {
      ok: true,
      bookingId: "DB" + String(Date.now()).slice(-8),
      holdExpiresAt: new Date(Date.now() + 5 * 60000).toISOString(),
      date: iso,
      slotId: "1830",
      slot: "18:30 – 20:00",
      guests: 4,
      tableId: "T-12",
      floor: 1,
      packageId: "sinh_nhat",
      customer: { name: "Nguyễn Văn Mai", phone: "0994562110", note: "" },
      preview: {
        tableFee: 200000,
        pkgFee: 300000,
        total: 500000,
        deposit: 250000,
      },
      total: 500000,
      deposit: 250000,
    };
  }

  /* ================= LỚP GỌI MÁY CHỦ ================= */
  const DepositAPI = {
    /** Lấy đơn giữ bàn đang chờ cọc.
     *  TODO(BE): GET /api/dat-ban/{bookingId} → { bookingId, holdExpiresAt, date, slot, guests,
     *            tableId, packageId, customer, total, deposit, status:'holding'|'expired'|'paid' }
     *  Hiện tại: đọc sessionStorage do trang Đặt bàn ghi. */
    async getBooking(bookingId) {
      await wait(120);
      if (FB.demo === "mau" || FB.demo === "het-gio") return sampleBooking();
      let b = null;
      try {
        b = JSON.parse(sessionStorage.getItem(PENDING_KEY));
      } catch (e) {}
      if (!b || (bookingId && b.bookingId !== bookingId)) return null;
      return b;
    },

    /** Cập nhật người đặt (nút "Sửa").
     *  TODO(BE): PATCH /api/dat-ban/{bookingId} body { customer } */
    async updateCustomer(bookingId, customer) {
      await wait(250);
      try {
        const b = JSON.parse(sessionStorage.getItem(PENDING_KEY));
        if (b && b.bookingId === bookingId) {
          b.customer = customer;
          sessionStorage.setItem(PENDING_KEY, JSON.stringify(b));
        }
      } catch (e) {}
      return { ok: true };
    },

    /** Khách bấm "Tôi đã chuyển khoản" / "Tôi đã thanh toán trên ví".
     *  ⚠ CHƯA XÁC NHẬN TIỀN. FE chỉ ghi nhận lời báo của khách.
     *  TODO(BE): POST /api/dat-coc/{bookingId}/bao-da-chuyen body { method, wallet }
     *  Cơ chế xác nhận để phát triển sau, ví dụ: đối soát sao kê theo nội dung
     *  "FIAB <mã>" (thủ công trên trang quản trị hoặc webhook ngân hàng).
     *  Khi có, trả { status:'paid' } để trang hiện popup thành công;
     *  còn lại trả { status:'pending' }.
     *  ⚠ Máy chủ cần GIA HẠN giữ bàn cho đơn đã báo chuyển trong lúc chờ đối soát
     *  (FE đã dừng đồng hồ 5 phút sau khi khách báo). */
    async reportTransfer(bookingId, method, wallet) {
      await wait(900);
      try {
        sessionStorage.setItem(
          REPORT_KEY,
          JSON.stringify({
            bookingId,
            method,
            wallet,
            at: new Date().toISOString(),
          }),
        );
      } catch (e) {}
      return { status: "pending" };
    },

    /** Hết thời gian giữ bàn.
     *  TODO(BE): máy chủ tự nhả bàn khi quá holdExpiresAt; FE chỉ báo cho khách.
     *  (POST /api/dat-ban/{bookingId}/huy-giu nếu muốn nhả sớm) */
    async releaseHold(bookingId) {
      await wait(80);
      return { ok: true };
    },

    /** Khách đã báo chuyển cho đơn này chưa (để tải lại trang vẫn giữ trạng thái chờ).
     *  TODO(BE): lấy từ status của GET /api/dat-ban/{bookingId} ('reported' | 'paid'). */
    getReport(bookingId) {
      try {
        const r = JSON.parse(sessionStorage.getItem(REPORT_KEY));
        return r && r.bookingId === bookingId ? r : null;
      } catch (e) {
        return null;
      }
    },
  };

  return {
    BANK,
    WALLETS,
    ZONE_INFO,
    SHAPE_NAME,
    buildVietQR,
    transferContent,
    DepositAPI,
    PENDING_KEY,
  };
})();
