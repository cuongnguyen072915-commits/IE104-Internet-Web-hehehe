/* =====================================================================
   FIABESCO PALACE — js/data/dat_ban.js
   Dữ liệu + lớp gọi máy chủ (BookingAPI) cho trang Đặt bàn (pages/dat_ban.html).
   Nguồn: Figma "104" › Page PC › "PC – 07 Đặt bàn" + biến Booking_Map /
   Chon_ban / Thanh_toan của bản Mobile.

   ⚠ FE HIỆN TẠI LÀ GIẢ LẬP. Mọi chỗ cần backend được đánh dấu "TODO(BE)".
     Khi BE xong, chỉ cần thay phần thân các hàm trong BookingAPI bằng
     fetch() thật — giữ nguyên tên hàm và hình dạng dữ liệu trả về
     (mô tả ở chú thích mỗi hàm), trang dat_ban.js không phải sửa.
   ===================================================================== */
window.FB_DAT_BAN = (function () {
  const IMG = '../assets/template-20261120T115451Z-1-001 - Copy/template/';

  /* ---------- Sơ đồ mặt bằng ----------
     Ảnh nền 2 tầng xuất từ Figma (đã bỏ bàn). Bàn được vẽ bằng <button>
     đặt theo toạ độ % so với khung ảnh 880 × 874 (đúng tỉ lệ Figma).
     shape: r4/r8 = bàn tròn 4/8 ghế · q4 = bàn vuông 4 ghế (ghế 2 bên)
            h4 = bàn chữ nhật ngang 4 ghế · v6/h6 = bàn dài 6 ghế dọc/ngang
            b2 = bàn đôi dọc · vip = bàn tròn lớn phòng riêng
     TODO(BE): danh sách bàn (mã, tầng, khu, sức chứa, loại phí) nên lấy từ
     API quản trị; toạ độ vẽ (x,y,w,h,shape) có thể giữ ở FE. */
  const FLOORS = [
    { id: 1, name: 'Tầng 1', img: IMG + 'seat-map-tang-1.png', w: 880, h: 874 },
    { id: 2, name: 'Tầng 2', img: IMG + 'seat-map-tang-2.png', w: 457, h: 437 }
  ];
  const ZONES = {
    T: 'Khu bàn chính', V: 'Sân vườn', VIP: 'Phòng VIP', L: 'Khu vực ăn uống', B: 'Ban công'
  };
  //        mã      tầng shape  x      y      w     h     chỗ  loại phí
  const T = [
    ['T-01', 1, 'r8', 51.56, 41.19, 8.63, 7.74, 8, 'ban_8'],
    ['T-02', 1, 'r8', 51.56, 49.79, 8.63, 7.74, 8, 'ban_8'],
    ['T-03', 1, 'q4', 63.86, 42.24, 5.75, 4.19, 4, 'ban_4'],
    ['T-04', 1, 'q4', 74.08, 42.24, 5.75, 4.19, 4, 'ban_4'],
    ['T-05', 1, 'q4', 83.86, 42.20, 5.75, 4.19, 4, 'ban_4'],
    ['T-06', 1, 'q4', 74.08, 51.89, 5.75, 4.19, 4, 'ban_4'],
    ['T-07', 1, 'q4', 84.08, 51.89, 5.75, 4.19, 4, 'ban_4'],
    ['T-08', 1, 'q4', 63.45, 61.54, 5.75, 4.19, 4, 'ban_4'],
    ['T-09', 1, 'q4', 74.08, 61.54, 5.75, 4.19, 4, 'ban_4'],
    ['T-10', 1, 'q4', 83.86, 61.18, 5.75, 4.19, 4, 'ban_4'],
    ['T-11', 1, 'q4', 63.45, 71.19, 5.75, 4.19, 4, 'ban_4'],
    ['T-12', 1, 'q4', 74.49, 71.19, 5.75, 4.19, 4, 'ban_4'],
    ['T-14', 1, 'r8', 82.73, 73.41, 8.63, 7.74, 8, 'ban_8'],
    ['V-01', 1, 'r4', 11.82, 19.67, 4.22, 3.78, 4, 'ban_4'],
    ['V-02', 1, 'r4', 11.82, 29.73, 4.22, 3.78, 4, 'ban_4'],
    ['V-03', 1, 'r4', 11.54, 41.19, 4.22, 3.78, 4, 'ban_4'],
    ['V-04', 1, 'r4', 11.75, 53.57, 4.22, 3.78, 4, 'ban_4'],
    ['V-05', 1, 'r4', 11.54, 65.73, 4.22, 3.78, 4, 'ban_4'],
    ['V-06', 1, 'r4', 16.54, 78.53, 4.22, 3.78, 4, 'ban_4'],
    ['V-07', 1, 'r4', 23.84, 87.34, 4.22, 3.78, 4, 'ban_4'],
    ['V-08', 1, 'r4', 31.76, 87.34, 4.22, 3.78, 4, 'ban_4'],
    ['V-09', 1, 'r4', 69.91, 87.55, 4.22, 3.78, 4, 'ban_4'],
    ['V-10', 1, 'r4', 82.83, 87.55, 4.22, 3.78, 4, 'ban_4'],
    // ---- Tầng 2 ---- toạ độ theo Figma "component map › Frame 11" (457 × 437)
    ['VIP-01', 2, 'vip', 14.36, 5.31, 11.67, 10.37, 15, 'ban_vip'],
    ['VIP-02', 2, 'vip', 35.66, 5.31, 11.67, 10.37, 15, 'ban_vip'],
    ['VIP-03', 2, 'vip', 54.46, 5.31, 11.67, 10.37, 15, 'ban_vip'],
    ['VIP-04', 2, 'vip', 74.20, 4.75, 13.00, 11.50, 15, 'ban_vip'],
    ['VIP-05', 2, 'vip', 10.28, 59.04, 11.67, 10.37, 10, 'ban_vip'],
    ['VIP-06', 2, 'vip', 10.28, 76.89, 11.67, 10.37, 10, 'ban_vip'],
    ['L-01', 2, 'h4', 49.89, 48.74, 6.53, 5.05, 4, 'ban_4'],
    ['L-02', 2, 'h4', 59.30, 48.74, 6.53, 5.05, 4, 'ban_4'],
    ['L-03', 2, 'h4', 68.71, 48.74, 6.53, 5.05, 4, 'ban_4'],
    ['L-04', 2, 'v6', 81.18, 43.71, 5.63, 8.61, 6, 'ban_6'],
    ['L-05', 2, 'h4', 49.89, 56.29, 6.53, 5.05, 4, 'ban_4'],
    ['L-06', 2, 'h4', 59.30, 56.29, 6.53, 5.05, 4, 'ban_4'],
    ['L-07', 2, 'h4', 68.71, 56.29, 6.53, 5.05, 4, 'ban_4'],
    ['L-08', 2, 'v6', 81.18, 56.52, 5.63, 8.61, 6, 'ban_6'],
    ['L-09', 2, 'v6', 35.67, 68.88, 5.63, 8.61, 6, 'ban_6'],
    ['L-10', 2, 'v6', 49.89, 68.88, 5.63, 8.61, 6, 'ban_6'],
    ['L-11', 2, 'h4', 60.39, 70.48, 6.53, 5.05, 4, 'ban_4'],
    ['L-12', 2, 'h4', 67.18, 70.48, 6.53, 5.05, 4, 'ban_4'],
    ['L-14', 2, 'v6', 81.18, 70.48, 5.63, 8.61, 6, 'ban_6'],
    ['L-16', 2, 'h4', 35.45, 83.30, 6.53, 5.05, 4, 'ban_4'],
    ['L-17', 2, 'h6', 47.70, 82.84, 8.23, 5.89, 6, 'ban_6'],
    ['L-18', 2, 'h4', 60.39, 83.30, 6.53, 5.05, 4, 'ban_4'],
    ['L-19', 2, 'h4', 67.18, 83.30, 6.53, 5.05, 4, 'ban_4'],
    ['L-20', 2, 'r8', 77.90, 81.46, 9.05, 8.44, 8, 'ban_8'],
    ['B-01', 2, 'b2', 3.05, 9.20, 2.30, 6.00, 2, 'ban_2'],
    ['B-02', 2, 'b2', 3.05, 25.90, 2.30, 6.00, 2, 'ban_2'],
    ['B-03', 2, 'b2', 3.05, 44.80, 2.30, 6.00, 2, 'ban_2'],
    ['B-04', 2, 'b2', 3.05, 61.30, 2.30, 6.00, 2, 'ban_2'],
    ['B-05', 2, 'b2', 3.05, 80.70, 2.30, 6.00, 2, 'ban_2'],
    ['B-06', 2, 'b2', 16.15, 92.50, 2.30, 6.00, 2, 'ban_2'],
    ['B-08', 2, 'b2', 25.55, 92.50, 2.30, 6.00, 2, 'ban_2'],
    ['B-09', 2, 'q4', 46.30, 93.00, 5.20, 5.00, 4, 'ban_4'],
    ['B-10', 2, 'b2', 69.85, 92.50, 2.30, 6.00, 2, 'ban_2'],
    ['B-11', 2, 'b2', 80.05, 92.50, 2.30, 6.00, 2, 'ban_2'],
    ['B-12', 2, 'b2', 94.75, 79.10, 2.30, 6.00, 2, 'ban_2'],
    ['B-14', 2, 'b2', 94.75, 60.90, 2.30, 6.00, 2, 'ban_2'],
    ['B-15', 2, 'b2', 94.75, 44.00, 2.30, 6.00, 2, 'ban_2'],
    ['B-16', 2, 'b2', 94.75, 26.30, 2.30, 6.00, 2, 'ban_2'],
    ['B-17', 2, 'b2', 94.75, 8.60, 2.30, 6.00, 2, 'ban_2']
  ];
  const tables = T.map(([id, floor, shape, x, y, w, h, seats, feeType]) => ({
    id, floor, shape, x, y, w, h, seats, feeType, zone: ZONES[id.split('-')[0]]
  }));

  /* ---------- Suất giờ (6 suất × 90 phút) — theo popup "Chọn giờ đặt bàn" ---------- */
  const SLOTS = [
    { id: '1100', start: '11:00', end: '12:30' },
    { id: '1230', start: '12:30', end: '14:00' },
    { id: '1400', start: '14:00', end: '15:30' },
    { id: '1700', start: '17:00', end: '18:30' },
    { id: '1830', start: '18:30', end: '20:00' },
    { id: '2000', start: '20:00', end: '21:30' }
  ];
  const MAX_GUESTS = 15;      // Đặt trực tuyến tối đa 15 khách (popup "Đoàn trên 15 khách?")
  const BOOK_AHEAD_DAYS = 30; // [GIẢ ĐỊNH] số ngày được đặt trước — TODO(BE): xác nhận chính sách
  const DEPOSIT_RATE = 0.5;   // Đặt cọc trước 50%
  const HOLD_MINUTES = 5;     // Giữ bàn 5 phút khi sang bước thanh toán (biến dem_nguoc trong Figma)
  const HOTLINE = '1900 6868';

  /* ---------- Bảng giá (biến "Thanh_toan" trong Figma, đơn vị nghìn đồng) ----------
     TODO(BE): giá phí giữ bàn & giá gói phải lấy từ máy chủ, FE chỉ hiển thị. */
  const PRICES = {
    table: { ban_2: 100000, ban_4: 200000, ban_6: 300000, ban_8: 400000, ban_vip: 1000000 },
    pkg: { mac_dinh: 0, sinh_nhat: 300000, cau_hon: 1500000, gia_dinh: 300000 }
  };

  /* ---------- Gói trang trí — nội dung lấy nguyên văn từ popup Figma ---------- */
  const PACKAGES = [
    { id: 'mac_dinh', name: 'Mặc định', title: 'Mặc định', img: IMG + 'restaurant-garden-dinner.jpg',
      tagline: 'Thanh lịch trong từng chi tiết',
      desc: 'Không cần một dịp đặc biệt để xứng đáng với một bữa tối trọn vẹn. Bàn tiệc tiêu chuẩn của Fiabesco được chuẩn bị như một lời chào đón ân cần: khăn lanh phẳng phiu, ly pha lê lấp lánh và ánh nến ấm áp, vừa đủ để câu chuyện của bạn trở thành trung tâm của buổi tối.',
      items: ['Khăn trải bàn và khăn ăn vải lanh', 'Bộ đồ ăn sứ, ly pha lê đặt sẵn theo số khách', 'Nến bàn và bình hoa tươi nhỏ theo mùa', 'Nước lọc phục vụ miễn phí suốt bữa', 'Nhân viên phục vụ riêng theo khu vực'],
      note: 'Áp dụng sẵn cho mọi đặt bàn, không cần báo trước.' },
    { id: 'sinh_nhat', name: 'Sinh nhật', title: 'Sinh nhật', img: IMG + 'event-birthday-party.jpg',
      tagline: 'Thắp sáng tuổi mới giữa lòng nước Ý',
      desc: 'Có những khoảnh khắc chỉ đến một lần mỗi năm, và nó xứng đáng được nâng niu đúng cách. Từ chùm bóng bay pastel trên bàn, tấm bảng tên viết tay dành riêng cho người thương, đến lúc đèn dịu xuống và chiếc bánh lung linh nến được mang ra cùng lời chúc của cả đội ngũ, mọi thứ đều được sắp đặt để nụ cười ấy rạng rỡ nhất.',
      items: ['Bánh kem 12 cm, chọn vị chocolate Ý hoặc tiramisu', 'Bóng bay trang trí và bảng tên viết tay', 'Giảm đèn, nhân viên hát chúc mừng khi ra bánh', '01 ảnh in lấy liền làm kỷ niệm', 'Thiệp chúc mừng có chữ ký đội ngũ Fiabesco'],
      note: 'Vui lòng đặt trước ít nhất 24 giờ và ghi tên, lời chúc trong mục Ghi chú cho Quản lý bàn.' },
    { id: 'cau_hon', name: 'Cầu hôn', title: 'Cầu hôn', img: IMG + 'event-proposal-setup.jpg',
      tagline: 'Để lời “Đồng ý” được kể lại mãi',
      desc: 'Một lời cầu hôn không chỉ là một câu hỏi, đó là chương mở đầu của cả một câu chuyện. Giữa lối đi rải cánh hồng, ánh nến lung linh và tiếng violin ngân lên bản tình ca bạn chọn, chiếc nhẫn sẽ xuất hiện đúng vào giây phút trái tim người ấy rung động nhất. Bạn chỉ cần quỳ xuống, mọi điều còn lại đã có chúng tôi lo.',
      items: ['Trải cánh hồng và nến LED quanh bàn', 'Phông hoa “Marry Me” để chụp ảnh', 'Bó hồng đỏ 20 bông trao tay', 'Nghệ sĩ violin trình diễn 01 bản nhạc theo yêu cầu', '02 ly vang nổ Prosecco chúc mừng', 'Giữ nhẫn bí mật và ra nhẫn cùng món tráng miệng'],
      note: 'Đặt trước ít nhất 48 giờ. Quản lý sẽ gọi điện để cùng bạn lên kịch bản. Gợi ý: chọn bàn Ban công hoặc Phòng VIP để riêng tư hơn.' },
    { id: 'gia_dinh', name: 'Gia đình', title: 'Tiệc gia đình', img: IMG + 'event-family-gathering.jpg',
      tagline: 'Bàn tròn sum vầy, trọn vị yêu thương',
      desc: 'Ở Ý, bữa cơm gia đình là nơi ba thế hệ cùng ngồi lại, chuyền tay nhau đĩa mì và những câu chuyện không bao giờ cũ. Fiabesco mang tinh thần ấy đến bàn tiệc của bạn: bàn tròn ấm cúng điểm hoa tươi, chỗ ngồi chu đáo cho các bé, và một món ngọt nhỏ để buổi sum họp khép lại bằng những nụ cười.',
      items: ['Hoa tươi trang trí và bảng tên “Gia đình …”', 'Ghế ăn và bộ dụng cụ riêng cho trẻ em', 'Bút màu, tranh tô cho bé trong lúc chờ món', 'Panna cotta tráng miệng dùng chung cho cả bàn', '01 ảnh gia đình in lấy liền'],
      note: 'Phù hợp nhất với bàn 6–15 khách. Vui lòng đặt trước ít nhất 12 giờ.' }
  ];

  /* ================= GIẢ LẬP (xoá khi có BE) ================= */
  const MOCK_ALWAYS_BOOKED = ['T-11', 'V-07', 'B-08']; // bàn xám trong Figma
  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const wait = (ms = 250) => new Promise(r => setTimeout(r, ms));
  const pad = n => String(n).padStart(2, '0');
  const isoDate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  function mockSlotFull(date, slotId) { return hash(date + slotId) % 9 === 0; }
  function mockBooked(date, slotId, tableId) {
    if (MOCK_ALWAYS_BOOKED.includes(tableId)) return true;
    if (mockSlotFull(date, slotId)) return true;
    return hash(date + '|' + slotId + '|' + tableId) % 100 < 18;
  }

  /* ================= LỚP GỌI MÁY CHỦ ================= */
  const BookingAPI = {
    /** Tình trạng 6 suất của một ngày.
     *  TODO(BE): GET /api/dat-ban/suat?ngay=YYYY-MM-DD&so_khach=N
     *  Trả về: [{ id:'1100', status:'available'|'full' }] */
    async getSlots(date, guests) {
      await wait(150);
      return SLOTS.map(s => ({ id: s.id, status: mockSlotFull(date, s.id) ? 'full' : 'available' }));
    },

    /** Trạng thái tất cả bàn cho ngày + suất.
     *  TODO(BE): GET /api/dat-ban/ban-trong?ngay=YYYY-MM-DD&suat=1830&so_khach=N
     *  Trả về: { [maBan]: 'available' | 'booked' }  (bàn không đủ chỗ FE tự lọc theo seats) */
    async getTableStatus(date, slotId, guests) {
      await wait(250);
      const out = {};
      tables.forEach(t => { out[t.id] = (date && slotId && mockBooked(date, slotId, t.id)) ? 'booked' : 'available'; });
      return out;
    },

    /** Bảng giá phí giữ bàn & gói trang trí.
     *  TODO(BE): GET /api/dat-ban/bang-gia → { table:{ban_2:…}, pkg:{mac_dinh:…} } */
    async getPrices() { await wait(80); return JSON.parse(JSON.stringify(PRICES)); },

    /** Giữ bàn + tạo đơn đặt bàn chờ đặt cọc.
     *  TODO(BE): POST /api/dat-ban  body = payload (xem dat_ban.js › buildPayload)
     *  - Máy chủ phải KIỂM TRA LẠI bàn còn trống & TỰ TÍNH tiền (không tin số FE gửi).
     *  - Thành công: { ok:true, bookingId, holdExpiresAt (ISO), total, deposit }
     *  - Bàn vừa bị người khác đặt: { ok:false, code:'TABLE_TAKEN', tableId }
     *  - Lỗi khác: { ok:false, code:'...', message } */
    async createBooking(payload) {
      await wait(700);
      const demo = new URLSearchParams(location.search).get('demo');
      if (demo === 'ban-da-dat') return { ok: false, code: 'TABLE_TAKEN', tableId: payload.tableId };
      return {
        ok: true,
        bookingId: 'DB' + Date.now().toString().slice(-8),
        holdExpiresAt: new Date(Date.now() + HOLD_MINUTES * 60000).toISOString(),
        total: payload.preview.total, deposit: payload.preview.deposit
      };
    }
  };

  return { FLOORS, tables, SLOTS, PACKAGES, PRICES, MAX_GUESTS, BOOK_AHEAD_DAYS, DEPOSIT_RATE, HOLD_MINUTES, HOTLINE, BookingAPI, isoDate,
    byId: id => tables.find(t => t.id === id) };
})();
