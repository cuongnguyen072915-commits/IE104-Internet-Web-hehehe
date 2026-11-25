/* Dữ liệu Blog – Luồng Blog (Lam). Nguồn: Figma "★ TỔNG HỢP LUỒNG" › 09 · BLOG – Góc ẩm thực.
   3 bài đầu đúng theo Figma; 2 bài cuối bổ sung để bộ lọc "Tin tức", "Mẹo" (có trong Figma) không bị trống.
   cat: khóa bộ lọc · tag: nhãn danh mục hiển thị trên thẻ · featured: bài nổi bật ở đầu trang. */
window.FB_BLOG = (function () {
  const IMG = '../assets/template-20261120T115451Z-1-001 - Copy/template/';
  return [
    { id: 'khong-gian-hoi-tho-italy', cat: 'cau-chuyen', tag: 'Không gian', crumb: 'Không gian / Câu chuyện', featured: true,
      title: 'Không gian mang hơi thở Italy', sub: 'Một góc nước Ý dịu dàng', img: IMG + 'restaurant-wine-bar.jpg', mins: 3, date: '18/11/2026',
      body: ['Một bữa ăn đáng nhớ không chỉ nằm ở hương vị. Đó còn là ánh đèn ấm áp, cách sắp đặt bàn ăn và những cuộc trò chuyện chậm rãi.',
        'Lấy cảm hứng từ nét thanh lịch của Italy, Fiabesco Palace hướng đến một không gian gần gũi, nơi mỗi lần ghé thăm đều có thể trở thành một kỷ niệm đẹp.'],
      quote: 'Nơi hương vị kết nối những câu chuyện.' },
    { id: 'tu-can-bep-den-ban-an', cat: 'cau-chuyen', tag: 'Câu chuyện', crumb: 'Câu chuyện / Gian bếp',
      title: 'Từ căn bếp đến bàn ăn', sub: 'Hương vị được gửi trao', img: IMG + 'dish-handmade-pasta.jpg', mins: 4, date: '10/11/2026',
      body: ['Mỗi sáng, căn bếp Fiabesco bắt đầu bằng tiếng cán bột đều tay. Mì được làm mới trong ngày, sốt cà chua San Marzano được hầm chậm cho đến khi dậy mùi thơm ngọt.',
        'Từ khâu chọn phô mai Parmigiano đến lúc rưới dầu ô liu cuối cùng, chúng tôi giữ nhịp làm việc thủ công để mỗi đĩa ăn mang đúng tinh thần ẩm thực Ý.'],
      quote: 'Món ngon bắt đầu từ sự kiên nhẫn trong gian bếp.' },
    { id: 'khoanh-khac-ben-nguoi-than', cat: 'cau-chuyen', tag: 'Trải nghiệm', crumb: 'Trải nghiệm / Câu chuyện',
      title: 'Khoảnh khắc bên người thân', sub: 'Những cuộc hẹn đáng nhớ', img: IMG + 'restaurant-garden-dinner.jpg', mins: 3, date: '02/11/2026',
      body: ['Có những bữa tối không cần dịp đặc biệt: chỉ cần một bàn ấm, vài món quen và những người thân quây quần.',
        'Khu sân vườn của Fiabesco được bố trí để mỗi nhóm khách có khoảng riêng, đủ yên tĩnh cho những câu chuyện dài và đủ ấm áp cho những lần gặp lại.'],
      quote: 'Bữa ăn ngon nhất là bữa ăn có người thương bên cạnh.' },
    { id: 'ban-tin-am-thuc-thang-11', cat: 'tin-tuc', tag: 'Tin tức', crumb: 'Tin tức / Bản tin',
      title: 'Bản tin ẩm thực tháng 11', sub: 'Món mới và ưu đãi trong tháng', img: IMG + 'dish-tiramisu.jpg', mins: 2, date: '01/11/2026',
      body: ['Tháng này, thực đơn Fiabesco chào đón Green Spaghetti sốt pesto cùng các món risotto theo mùa.',
        'Độc giả của bản tin có thể dùng mã NEWS10 để được giảm 10% cho lần đặt món tiếp theo – xem chi tiết tại trang Ưu đãi.'],
      quote: 'Mỗi mùa một hương vị mới từ nước Ý.' },
    { id: 'thuong-thuc-mi-y-dung-dieu', cat: 'meo', tag: 'Mẹo', crumb: 'Mẹo / Thưởng thức',
      title: 'Thưởng thức mì Ý đúng điệu', sub: 'Vài mẹo nhỏ từ bếp trưởng', img: IMG + 'dish-lasagna-baking-dish.jpg', mins: 2, date: '25/10/2026',
      body: ['Hãy thưởng thức mì khi còn nóng để sốt bám đều từng sợi. Với mì sợi dài, dùng nĩa xoắn nhẹ thay vì cắt ngắn.',
        'Phô mai bào nên rắc ngay trước khi ăn; còn với món hải sản, người Ý thường không thêm phô mai để giữ vị ngọt tự nhiên.'],
      quote: 'Đơn giản là bí quyết của ẩm thực Ý.' }
  ];
})();
