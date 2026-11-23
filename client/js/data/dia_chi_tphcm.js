/**
 * FIABESCO PALACE — DỮ LIỆU ĐỊA CHỈ TP. HỒ CHÍ MINH (sau 01/07/2025)
 * File: client/js/data/dia_chi_tphcm.js
 *
 * Danh sách 168 đơn vị cấp xã: 113 phường, 54 xã, 01 đặc khu.
 * Nguồn gốc tên/loại: Nghị quyết 1685/NQ-UBTVQH15, đăng toàn văn tại:
 * https://xaydungchinhsach.chinhphu.vn/sap-xep-dvhc-danh-sach-168-xa-phuong-dac-khu-cua-thanh-pho-ho-chi-minh-119250623085031865.htm
 * Kiểm tra đối chiếu hiện trạng 2026: https://tphcm.chinhphu.vn/ddci-2026-tao-dong-luc-cai-cach-moi-truong-dau-tu-kinh-doanh-tren-dia-ban-thanh-pho-101260824171747673.htm
 *
 * LƯU Ý:
 * - id dạng HCM-001...HCM-168 là mã NỘI BỘ cho website, KHÔNG phải mã hành chính nhà nước.
 * - Quận/huyện cũ chỉ dùng để GỢI Ý khu vực giao hàng (đơn vị hành chính cũ
 *   hoặc địa bàn tỉnh cũ). Một số xã/phường mới bao gồm các phần đất từ nhiều
 *   khu vực cũ; KHÔNG dùng bộ lọc này để xác minh một địa chỉ hoặc tính phí ship.
 * - Mặc định nên cho người dùng chọn trực tiếp từ toàn bộ phường/xã hiện hành;
 *   khi chọn bộ lọc khu vực cũ phải có tùy chọn 'Tất cả'.
 * - Phí vận chuyển cần tính từ địa chỉ/toạ độ thực tế, không từ dữ liệu mẫu này.
 */
(function (global) {
  "use strict";
  const THONG_TIN = Object.freeze({
    tinh: "TP. Hồ Chí Minh",
    soLuong: 168,
    maTinhNoiBo: "HCM",
    nguon: "Nghị quyết 1685/NQ-UBTVQH15 (2025)",
    capNhatKiemTra: "2026-11-23",
    quanHuyenCuChiDeGoiY: true
  });

  // Danh mục chỉ dùng để lọc theo KHU VỰC CŨ, không phải địa chỉ hành chính.
  const KHU_VUC_CU = Object.freeze([
    {
        "id": "q1",
        "ten": "Quận 1 (cũ)"
    },
    {
        "id": "q3",
        "ten": "Quận 3 (cũ)"
    },
    {
        "id": "q4",
        "ten": "Quận 4 (cũ)"
    },
    {
        "id": "q5",
        "ten": "Quận 5 (cũ)"
    },
    {
        "id": "q6",
        "ten": "Quận 6 (cũ)"
    },
    {
        "id": "q7",
        "ten": "Quận 7 (cũ)"
    },
    {
        "id": "q8",
        "ten": "Quận 8 (cũ)"
    },
    {
        "id": "q10",
        "ten": "Quận 10 (cũ)"
    },
    {
        "id": "q11",
        "ten": "Quận 11 (cũ)"
    },
    {
        "id": "q12",
        "ten": "Quận 12 (cũ)"
    },
    {
        "id": "binh_tan",
        "ten": "Quận Bình Tân (cũ)"
    },
    {
        "id": "binh_thanh",
        "ten": "Quận Bình Thạnh (cũ)"
    },
    {
        "id": "go_vap",
        "ten": "Quận Gò Vấp (cũ)"
    },
    {
        "id": "phu_nhuan",
        "ten": "Quận Phú Nhuận (cũ)"
    },
    {
        "id": "tan_binh",
        "ten": "Quận Tân Bình (cũ)"
    },
    {
        "id": "tan_phu",
        "ten": "Quận Tân Phú (cũ)"
    },
    {
        "id": "thu_duc",
        "ten": "TP. Thủ Đức (cũ)"
    },
    {
        "id": "binh_duong_cu",
        "ten": "Bình Dương (trước hợp nhất)"
    },
    {
        "id": "brvt_cu",
        "ten": "Bà Rịa - Vũng Tàu (trước hợp nhất)"
    },
    {
        "id": "binh_chanh",
        "ten": "Huyện Bình Chánh (cũ)"
    },
    {
        "id": "can_gio",
        "ten": "Huyện Cần Giờ (cũ)"
    },
    {
        "id": "cu_chi",
        "ten": "Huyện Củ Chi (cũ)"
    },
    {
        "id": "hoc_mon",
        "ten": "Huyện Hóc Môn (cũ)"
    },
    {
        "id": "nha_be",
        "ten": "Huyện Nhà Bè (cũ)"
    }
]);

  const DU_LIEU = [
    [
        "HCM-001",
        "Phường Sài Gòn",
        "phuong",
        "q1"
    ],
    [
        "HCM-002",
        "Phường Tân Định",
        "phuong",
        "q1"
    ],
    [
        "HCM-003",
        "Phường Bến Thành",
        "phuong",
        "q1"
    ],
    [
        "HCM-004",
        "Phường Cầu Ông Lãnh",
        "phuong",
        "q1"
    ],
    [
        "HCM-005",
        "Phường Bàn Cờ",
        "phuong",
        "q3"
    ],
    [
        "HCM-006",
        "Phường Xuân Hòa",
        "phuong",
        "q3"
    ],
    [
        "HCM-007",
        "Phường Nhiêu Lộc",
        "phuong",
        "q3"
    ],
    [
        "HCM-008",
        "Phường Xóm Chiếu",
        "phuong",
        "q4"
    ],
    [
        "HCM-009",
        "Phường Khánh Hội",
        "phuong",
        "q4"
    ],
    [
        "HCM-010",
        "Phường Vĩnh Hội",
        "phuong",
        "q4"
    ],
    [
        "HCM-011",
        "Phường Chợ Quán",
        "phuong",
        "q5"
    ],
    [
        "HCM-012",
        "Phường An Đông",
        "phuong",
        "q5"
    ],
    [
        "HCM-013",
        "Phường Chợ Lớn",
        "phuong",
        "q5"
    ],
    [
        "HCM-014",
        "Phường Bình Tây",
        "phuong",
        "q6"
    ],
    [
        "HCM-015",
        "Phường Bình Tiên",
        "phuong",
        "q6"
    ],
    [
        "HCM-016",
        "Phường Bình Phú",
        "phuong",
        "q6"
    ],
    [
        "HCM-017",
        "Phường Phú Lâm",
        "phuong",
        "q6"
    ],
    [
        "HCM-018",
        "Phường Tân Thuận",
        "phuong",
        "q7"
    ],
    [
        "HCM-019",
        "Phường Phú Thuận",
        "phuong",
        "q7"
    ],
    [
        "HCM-020",
        "Phường Tân Mỹ",
        "phuong",
        "q7"
    ],
    [
        "HCM-021",
        "Phường Tân Hưng",
        "phuong",
        "q7"
    ],
    [
        "HCM-022",
        "Phường Chánh Hưng",
        "phuong",
        "q8"
    ],
    [
        "HCM-023",
        "Phường Phú Định",
        "phuong",
        "q8"
    ],
    [
        "HCM-024",
        "Phường Bình Đông",
        "phuong",
        "q8"
    ],
    [
        "HCM-025",
        "Phường Diên Hồng",
        "phuong",
        "q10"
    ],
    [
        "HCM-026",
        "Phường Vườn Lài",
        "phuong",
        "q10"
    ],
    [
        "HCM-027",
        "Phường Hòa Hưng",
        "phuong",
        "q10"
    ],
    [
        "HCM-028",
        "Phường Minh Phụng",
        "phuong",
        "q11"
    ],
    [
        "HCM-029",
        "Phường Bình Thới",
        "phuong",
        "q11"
    ],
    [
        "HCM-030",
        "Phường Hòa Bình",
        "phuong",
        "q11"
    ],
    [
        "HCM-031",
        "Phường Phú Thọ",
        "phuong",
        "q11"
    ],
    [
        "HCM-032",
        "Phường Đông Hưng Thuận",
        "phuong",
        "q12"
    ],
    [
        "HCM-033",
        "Phường Trung Mỹ Tây",
        "phuong",
        "q12"
    ],
    [
        "HCM-034",
        "Phường Tân Thới Hiệp",
        "phuong",
        "q12"
    ],
    [
        "HCM-035",
        "Phường Thới An",
        "phuong",
        "q12"
    ],
    [
        "HCM-036",
        "Phường An Phú Đông",
        "phuong",
        "q12"
    ],
    [
        "HCM-037",
        "Phường An Lạc",
        "phuong",
        "binh_tan"
    ],
    [
        "HCM-038",
        "Phường Bình Tân",
        "phuong",
        "binh_tan"
    ],
    [
        "HCM-039",
        "Phường Tân Tạo",
        "phuong",
        "binh_tan"
    ],
    [
        "HCM-040",
        "Phường Bình Trị Đông",
        "phuong",
        "binh_tan"
    ],
    [
        "HCM-041",
        "Phường Bình Hưng Hòa",
        "phuong",
        "binh_tan"
    ],
    [
        "HCM-042",
        "Phường Gia Định",
        "phuong",
        "binh_thanh"
    ],
    [
        "HCM-043",
        "Phường Bình Thạnh",
        "phuong",
        "binh_thanh"
    ],
    [
        "HCM-044",
        "Phường Bình Lợi Trung",
        "phuong",
        "binh_thanh"
    ],
    [
        "HCM-045",
        "Phường Thạnh Mỹ Tây",
        "phuong",
        "binh_thanh"
    ],
    [
        "HCM-046",
        "Phường Bình Quới",
        "phuong",
        "binh_thanh"
    ],
    [
        "HCM-047",
        "Phường Hạnh Thông",
        "phuong",
        "go_vap"
    ],
    [
        "HCM-048",
        "Phường An Nhơn",
        "phuong",
        "go_vap"
    ],
    [
        "HCM-049",
        "Phường Gò Vấp",
        "phuong",
        "go_vap"
    ],
    [
        "HCM-050",
        "Phường An Hội Đông",
        "phuong",
        "go_vap"
    ],
    [
        "HCM-051",
        "Phường Thông Tây Hội",
        "phuong",
        "go_vap"
    ],
    [
        "HCM-052",
        "Phường An Hội Tây",
        "phuong",
        "go_vap"
    ],
    [
        "HCM-053",
        "Phường Đức Nhuận",
        "phuong",
        "phu_nhuan"
    ],
    [
        "HCM-054",
        "Phường Cầu Kiệu",
        "phuong",
        "phu_nhuan"
    ],
    [
        "HCM-055",
        "Phường Phú Nhuận",
        "phuong",
        "phu_nhuan"
    ],
    [
        "HCM-056",
        "Phường Tân Sơn Hòa",
        "phuong",
        "tan_binh"
    ],
    [
        "HCM-057",
        "Phường Tân Sơn Nhất",
        "phuong",
        "tan_binh"
    ],
    [
        "HCM-058",
        "Phường Tân Hòa",
        "phuong",
        "tan_binh"
    ],
    [
        "HCM-059",
        "Phường Bảy Hiền",
        "phuong",
        "tan_binh"
    ],
    [
        "HCM-060",
        "Phường Tân Bình",
        "phuong",
        "tan_binh"
    ],
    [
        "HCM-061",
        "Phường Tân Sơn",
        "phuong",
        "tan_binh"
    ],
    [
        "HCM-062",
        "Phường Tây Thạnh",
        "phuong",
        "tan_phu"
    ],
    [
        "HCM-063",
        "Phường Tân Sơn Nhì",
        "phuong",
        "tan_phu"
    ],
    [
        "HCM-064",
        "Phường Phú Thọ Hòa",
        "phuong",
        "tan_phu"
    ],
    [
        "HCM-065",
        "Phường Tân Phú",
        "phuong",
        "tan_phu"
    ],
    [
        "HCM-066",
        "Phường Phú Thạnh",
        "phuong",
        "tan_phu"
    ],
    [
        "HCM-067",
        "Phường Hiệp Bình",
        "phuong",
        "thu_duc"
    ],
    [
        "HCM-068",
        "Phường Thủ Đức",
        "phuong",
        "thu_duc"
    ],
    [
        "HCM-069",
        "Phường Tam Bình",
        "phuong",
        "thu_duc"
    ],
    [
        "HCM-070",
        "Phường Linh Xuân",
        "phuong",
        "thu_duc"
    ],
    [
        "HCM-071",
        "Phường Tăng Nhơn Phú",
        "phuong",
        "thu_duc"
    ],
    [
        "HCM-072",
        "Phường Long Bình",
        "phuong",
        "thu_duc"
    ],
    [
        "HCM-073",
        "Phường Long Phước",
        "phuong",
        "thu_duc"
    ],
    [
        "HCM-074",
        "Phường Long Trường",
        "phuong",
        "thu_duc"
    ],
    [
        "HCM-075",
        "Phường Cát Lái",
        "phuong",
        "thu_duc"
    ],
    [
        "HCM-076",
        "Phường Bình Trưng",
        "phuong",
        "thu_duc"
    ],
    [
        "HCM-077",
        "Phường Phước Long",
        "phuong",
        "thu_duc"
    ],
    [
        "HCM-078",
        "Phường An Khánh",
        "phuong",
        "thu_duc"
    ],
    [
        "HCM-079",
        "Phường Đông Hòa",
        "phuong",
        "binh_duong_cu"
    ],
    [
        "HCM-080",
        "Phường Dĩ An",
        "phuong",
        "binh_duong_cu"
    ],
    [
        "HCM-081",
        "Phường Tân Đông Hiệp",
        "phuong",
        "binh_duong_cu"
    ],
    [
        "HCM-082",
        "Phường An Phú",
        "phuong",
        "binh_duong_cu"
    ],
    [
        "HCM-083",
        "Phường Bình Hòa",
        "phuong",
        "binh_duong_cu"
    ],
    [
        "HCM-084",
        "Phường Lái Thiêu",
        "phuong",
        "binh_duong_cu"
    ],
    [
        "HCM-085",
        "Phường Thuận An",
        "phuong",
        "binh_duong_cu"
    ],
    [
        "HCM-086",
        "Phường Thuận Giao",
        "phuong",
        "binh_duong_cu"
    ],
    [
        "HCM-087",
        "Phường Thủ Dầu Một",
        "phuong",
        "binh_duong_cu"
    ],
    [
        "HCM-088",
        "Phường Phú Lợi",
        "phuong",
        "binh_duong_cu"
    ],
    [
        "HCM-089",
        "Phường Chánh Hiệp",
        "phuong",
        "binh_duong_cu"
    ],
    [
        "HCM-090",
        "Phường Bình Dương",
        "phuong",
        "binh_duong_cu"
    ],
    [
        "HCM-091",
        "Phường Hòa Lợi",
        "phuong",
        "binh_duong_cu"
    ],
    [
        "HCM-092",
        "Phường Phú An",
        "phuong",
        "binh_duong_cu"
    ],
    [
        "HCM-093",
        "Phường Tây Nam",
        "phuong",
        "binh_duong_cu"
    ],
    [
        "HCM-094",
        "Phường Long Nguyên",
        "phuong",
        "binh_duong_cu"
    ],
    [
        "HCM-095",
        "Phường Bến Cát",
        "phuong",
        "binh_duong_cu"
    ],
    [
        "HCM-096",
        "Phường Chánh Phú Hòa",
        "phuong",
        "binh_duong_cu"
    ],
    [
        "HCM-097",
        "Phường Vĩnh Tân",
        "phuong",
        "binh_duong_cu"
    ],
    [
        "HCM-098",
        "Phường Bình Cơ",
        "phuong",
        "binh_duong_cu"
    ],
    [
        "HCM-099",
        "Phường Tân Uyên",
        "phuong",
        "binh_duong_cu"
    ],
    [
        "HCM-100",
        "Phường Tân Hiệp",
        "phuong",
        "binh_duong_cu"
    ],
    [
        "HCM-101",
        "Phường Tân Khánh",
        "phuong",
        "binh_duong_cu"
    ],
    [
        "HCM-102",
        "Phường Vũng Tàu",
        "phuong",
        "brvt_cu"
    ],
    [
        "HCM-103",
        "Phường Tam Thắng",
        "phuong",
        "brvt_cu"
    ],
    [
        "HCM-104",
        "Phường Rạch Dừa",
        "phuong",
        "brvt_cu"
    ],
    [
        "HCM-105",
        "Phường Phước Thắng",
        "phuong",
        "brvt_cu"
    ],
    [
        "HCM-106",
        "Phường Long Hương",
        "phuong",
        "brvt_cu"
    ],
    [
        "HCM-107",
        "Phường Bà Rịa",
        "phuong",
        "brvt_cu"
    ],
    [
        "HCM-108",
        "Phường Tam Long",
        "phuong",
        "brvt_cu"
    ],
    [
        "HCM-109",
        "Phường Tân Hải",
        "phuong",
        "brvt_cu"
    ],
    [
        "HCM-110",
        "Phường Tân Phước",
        "phuong",
        "brvt_cu"
    ],
    [
        "HCM-111",
        "Phường Phú Mỹ",
        "phuong",
        "brvt_cu"
    ],
    [
        "HCM-112",
        "Phường Tân Thành",
        "phuong",
        "brvt_cu"
    ],
    [
        "HCM-113",
        "Xã Vĩnh Lộc",
        "xa",
        "binh_chanh"
    ],
    [
        "HCM-114",
        "Xã Tân Vĩnh Lộc",
        "xa",
        "binh_chanh"
    ],
    [
        "HCM-115",
        "Xã Bình Lợi",
        "xa",
        "binh_chanh"
    ],
    [
        "HCM-116",
        "Xã Tân Nhựt",
        "xa",
        "binh_chanh"
    ],
    [
        "HCM-117",
        "Xã Bình Chánh",
        "xa",
        "binh_chanh"
    ],
    [
        "HCM-118",
        "Xã Hưng Long",
        "xa",
        "binh_chanh"
    ],
    [
        "HCM-119",
        "Xã Bình Hưng",
        "xa",
        "binh_chanh"
    ],
    [
        "HCM-120",
        "Xã Bình Khánh",
        "xa",
        "can_gio"
    ],
    [
        "HCM-121",
        "Xã An Thới Đông",
        "xa",
        "can_gio"
    ],
    [
        "HCM-122",
        "Xã Cần Giờ",
        "xa",
        "can_gio"
    ],
    [
        "HCM-123",
        "Xã Củ Chi",
        "xa",
        "cu_chi"
    ],
    [
        "HCM-124",
        "Xã Tân An Hội",
        "xa",
        "cu_chi"
    ],
    [
        "HCM-125",
        "Xã Thái Mỹ",
        "xa",
        "cu_chi"
    ],
    [
        "HCM-126",
        "Xã An Nhơn Tây",
        "xa",
        "cu_chi"
    ],
    [
        "HCM-127",
        "Xã Nhuận Đức",
        "xa",
        "cu_chi"
    ],
    [
        "HCM-128",
        "Xã Phú Hòa Đông",
        "xa",
        "cu_chi"
    ],
    [
        "HCM-129",
        "Xã Bình Mỹ",
        "xa",
        "cu_chi"
    ],
    [
        "HCM-130",
        "Xã Đông Thạnh",
        "xa",
        "hoc_mon"
    ],
    [
        "HCM-131",
        "Xã Hóc Môn",
        "xa",
        "hoc_mon"
    ],
    [
        "HCM-132",
        "Xã Xuân Thới Sơn",
        "xa",
        "hoc_mon"
    ],
    [
        "HCM-133",
        "Xã Bà Điểm",
        "xa",
        "hoc_mon"
    ],
    [
        "HCM-134",
        "Xã Nhà Bè",
        "xa",
        "nha_be"
    ],
    [
        "HCM-135",
        "Xã Hiệp Phước",
        "xa",
        "nha_be"
    ],
    [
        "HCM-136",
        "Xã Thường Tân",
        "xa",
        "binh_duong_cu"
    ],
    [
        "HCM-137",
        "Xã Bắc Tân Uyên",
        "xa",
        "binh_duong_cu"
    ],
    [
        "HCM-138",
        "Xã Phú Giáo",
        "xa",
        "binh_duong_cu"
    ],
    [
        "HCM-139",
        "Xã Phước Hòa",
        "xa",
        "binh_duong_cu"
    ],
    [
        "HCM-140",
        "Xã Phước Thành",
        "xa",
        "binh_duong_cu"
    ],
    [
        "HCM-141",
        "Xã An Long",
        "xa",
        "binh_duong_cu"
    ],
    [
        "HCM-142",
        "Xã Trừ Văn Thố",
        "xa",
        "binh_duong_cu"
    ],
    [
        "HCM-143",
        "Xã Bàu Bàng",
        "xa",
        "binh_duong_cu"
    ],
    [
        "HCM-144",
        "Xã Long Hòa",
        "xa",
        "binh_duong_cu"
    ],
    [
        "HCM-145",
        "Xã Thanh An",
        "xa",
        "binh_duong_cu"
    ],
    [
        "HCM-146",
        "Xã Dầu Tiếng",
        "xa",
        "binh_duong_cu"
    ],
    [
        "HCM-147",
        "Xã Minh Thạnh",
        "xa",
        "binh_duong_cu"
    ],
    [
        "HCM-148",
        "Xã Châu Pha",
        "xa",
        "brvt_cu"
    ],
    [
        "HCM-149",
        "Xã Long Hải",
        "xa",
        "brvt_cu"
    ],
    [
        "HCM-150",
        "Xã Long Điền",
        "xa",
        "brvt_cu"
    ],
    [
        "HCM-151",
        "Xã Phước Hải",
        "xa",
        "brvt_cu"
    ],
    [
        "HCM-152",
        "Xã Đất Đỏ",
        "xa",
        "brvt_cu"
    ],
    [
        "HCM-153",
        "Xã Nghĩa Thành",
        "xa",
        "brvt_cu"
    ],
    [
        "HCM-154",
        "Xã Ngãi Giao",
        "xa",
        "brvt_cu"
    ],
    [
        "HCM-155",
        "Xã Kim Long",
        "xa",
        "brvt_cu"
    ],
    [
        "HCM-156",
        "Xã Châu Đức",
        "xa",
        "brvt_cu"
    ],
    [
        "HCM-157",
        "Xã Bình Giã",
        "xa",
        "brvt_cu"
    ],
    [
        "HCM-158",
        "Xã Xuân Sơn",
        "xa",
        "brvt_cu"
    ],
    [
        "HCM-159",
        "Xã Hồ Tràm",
        "xa",
        "brvt_cu"
    ],
    [
        "HCM-160",
        "Xã Xuyên Mộc",
        "xa",
        "brvt_cu"
    ],
    [
        "HCM-161",
        "Xã Hòa Hội",
        "xa",
        "brvt_cu"
    ],
    [
        "HCM-162",
        "Xã Bàu Lâm",
        "xa",
        "brvt_cu"
    ],
    [
        "HCM-163",
        "Đặc khu Côn Đảo",
        "dac_khu",
        "brvt_cu"
    ],
    [
        "HCM-164",
        "Phường Thới Hòa",
        "phuong",
        "binh_duong_cu"
    ],
    [
        "HCM-165",
        "Xã Long Sơn",
        "xa",
        "brvt_cu"
    ],
    [
        "HCM-166",
        "Xã Hòa Hiệp",
        "xa",
        "brvt_cu"
    ],
    [
        "HCM-167",
        "Xã Bình Châu",
        "xa",
        "brvt_cu"
    ],
    [
        "HCM-168",
        "Xã Thạnh An",
        "xa",
        "can_gio"
    ]
];

  const PHUONG_XA = Object.freeze(DU_LIEU.map(([id, ten, loai, khuVucCu]) =>
    Object.freeze({ id, ten, loai, maTinh: "HCM", tenTinh: THONG_TIN.tinh, khuVucCu })
  ));

  const chuanHoa = (value) => String(value == null ? "" : value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/Đ/g, "D")
    .toLowerCase().trim();

  function layDanhSachPhuongXa(khuVucCu = "") {
    // Không chọn khu vực cũ => hiển thị ĐẦY ĐỦ 168 đơn vị.
    if (!khuVucCu) return [...PHUONG_XA];
    return PHUONG_XA.filter(item => item.khuVucCu === khuVucCu);
  }

  function timPhuongXa(tuKhoa = "", khuVucCu = "") {
    const q = chuanHoa(tuKhoa);
    return layDanhSachPhuongXa(khuVucCu).filter(item => chuanHoa(item.ten).includes(q));
  }

  function layPhuongXaTheoId(id) {
    return PHUONG_XA.find(item => item.id === id) || null;
  }

  function taoDiaChi(soNhaTenDuong, phuongXaId) {
    const duong = String(soNhaTenDuong || "").trim();
    const phuongXa = layPhuongXaTheoId(phuongXaId);
    if (!duong || !phuongXa) return "";
    // Không thêm quận/huyện cũ vào địa chỉ hành chính chính thức.
    return `${duong}, ${phuongXa.ten}, ${THONG_TIN.tinh}`;
  }

  /**
   * Tự đổ danh sách vào 2 thẻ <select> và liên kết sự kiện change.
   * goiY: chọn quận/huyện cũ là TUỲ CHỌN; phường/xã lấy 168 đơn vị khi trống.
   * @example
   * const ds = FB_DIA_CHI_TPHCM.ganDropdowns({
   *   selectKhuVuc: document.getElementById('khu-vuc-cu'),
   *   selectPhuongXa: document.getElementById('phuong-xa')
   * });
   * // Khi lưu đơn: FB_DIA_CHI_TPHCM.taoDiaChi(inputDuong.value, ds.selectPhuongXa.value)
   */
  function ganDropdowns({ selectKhuVuc, selectPhuongXa }) {
    if (!selectPhuongXa || selectPhuongXa.tagName !== "SELECT") {
      throw new Error("Phải truyền selectPhuongXa là thẻ <select> hợp lệ");
    }
    const taoOption = (value, label) => new Option(label, value);
    const doDanhSach = (select, placeholder, items) => {
      const selected = select.value;
      select.replaceChildren(taoOption("", placeholder), ...items.map(x => taoOption(x.id, x.ten)));
      if (items.some(x => x.id === selected)) select.value = selected;
    };
    if (selectKhuVuc) {
      if (selectKhuVuc.tagName !== "SELECT") {
        throw new Error("selectKhuVuc phải là thẻ <select>");
      }
      doDanhSach(selectKhuVuc, "Tất cả khu vực TP. Hồ Chí Minh", KHU_VUC_CU);
    }
    const capNhatPhuongXa = () => {
      const khuVuc = selectKhuVuc ? selectKhuVuc.value : "";
      doDanhSach(selectPhuongXa, "Chọn phường / xã / đặc khu", layDanhSachPhuongXa(khuVuc));
    };
    if (selectKhuVuc) selectKhuVuc.addEventListener("change", capNhatPhuongXa);
    capNhatPhuongXa();
    return { selectKhuVuc, selectPhuongXa, capNhatPhuongXa };
  }

  const API = Object.freeze({
    thongTin: THONG_TIN,
    khuVucCu: KHU_VUC_CU,
    phuongXa: PHUONG_XA,
    layDanhSachPhuongXa,
    timPhuongXa,
    layPhuongXaTheoId,
    taoDiaChi,
    ganDropdowns
  });
  global.FB_DIA_CHI_TPHCM = API;
})(typeof window !== "undefined" ? window : globalThis);
