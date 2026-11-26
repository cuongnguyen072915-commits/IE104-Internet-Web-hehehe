/* Dữ liệu Blog – Luồng Blog (Lam). Nguồn: Figma "★ TỔNG HỢP LUỒNG" › 09 · BLOG – Góc ẩm thực.
   3 bài đầu đúng theo Figma; 2 bài cuối bổ sung để bộ lọc "Tin tức", "Mẹo" (có trong Figma) không bị trống.
   cat: khóa bộ lọc · tag: nhãn danh mục hiển thị trên thẻ · featured: bài nổi bật ở đầu trang.
   H1 · Mỗi bài có: lead (mở đầu), sections (mục có tiêu đề phụ, có thể kèm ảnh từ assets), quote, tips.
   ⚠ Đây là NỘI DUNG MẪU BIÊN TẬP phục vụ đồ án (editorial: true) — mang tính mô tả trải nghiệm,
   không đưa ra số liệu hay dữ kiện lịch sử chưa được kiểm chứng. */
window.FB_BLOG = (function () {
  const IMG = '../assets/template-20261120T115451Z-1-001 - Copy/template/';
  return [
    { id: 'khong-gian-hoi-tho-italy', cat: 'cau-chuyen', tag: 'Không gian', crumb: 'Không gian / Câu chuyện', featured: true, editorial: true,
      title: 'Không gian mang hơi thở Italy', sub: 'Một góc nước Ý dịu dàng', img: IMG + 'restaurant-wine-bar.jpg', mins: 6, date: '18/11/2026',
      lead: 'Có những nhà hàng bạn nhớ vì một món ăn. Có những nơi bạn nhớ vì cảm giác khi bước qua cánh cửa: ánh đèn vàng, mùi bánh mì nướng thoang thoảng và tiếng cụng ly khe khẽ. Fiabesco Palace muốn trở thành nơi thứ hai — một góc nước Ý dịu dàng giữa lòng Sài Gòn.',
      body: ['Một bữa ăn đáng nhớ không chỉ nằm ở hương vị. Đó còn là ánh đèn ấm áp, cách sắp đặt bàn ăn và những cuộc trò chuyện chậm rãi.',
        'Lấy cảm hứng từ nét thanh lịch của Italy, Fiabesco Palace hướng đến một không gian gần gũi, nơi mỗi lần ghé thăm đều có thể trở thành một kỷ niệm đẹp.'],
      sections: [
        { h: 'Ánh sáng ấm cho những bữa tối chậm rãi', p: [
          'Khi trời chạng vạng, phòng ăn chính chuyển sang tông đèn vàng dịu. Chúng tôi chọn ánh sáng thấp và tập trung trên mặt bàn để món ăn trở thành tâm điểm, còn câu chuyện của bạn thì có đủ riêng tư.',
          'Gỗ ấm, khăn trải bàn màu kem và những chiếc ly pha lê được lau thật trong — tất cả đều nhằm một mục đích: giúp bạn quên đi nhịp vội vã bên ngoài trong vài giờ.'] , img: IMG + 'restaurant-cozy-interior.jpg', cap: 'Phòng ăn chính với ánh đèn vàng dịu buổi tối.' },
        { h: 'Quầy rượu vang — nơi câu chuyện bắt đầu', p: [
          'Nhiều vị khách bắt đầu buổi tối bằng một ly vang ở quầy bar trước khi vào bàn. Đội ngũ phục vụ luôn sẵn lòng gợi ý một ly hợp với món bạn định gọi, dù bạn là người mới làm quen với rượu vang hay đã có lựa chọn quen thuộc.',
          'Không có quy tắc bắt buộc nào ở đây: một ly vang đỏ cho món bò, vang trắng cho hải sản, hay đơn giản là một ly Limonata mát lạnh — miễn là bạn thấy thoải mái.'] },
        { h: 'Sân vườn cho những dịp đặc biệt', p: [
          'Khu sân vườn được bố trí thành nhiều góc nhỏ, phù hợp cho buổi hẹn hai người hay tiệc sinh nhật ấm cúng. Đèn dây và cây xanh tạo cảm giác như một buổi tối mùa hè ở vùng quê nước Ý.',
          'Nếu bạn muốn chuẩn bị một bất ngờ, hãy chọn gói trang trí khi đặt bàn trực tuyến để nhà hàng sắp xếp trước.'], img: IMG + 'restaurant-garden-terrace.jpg', cap: 'Khu sân vườn lên đèn vào buổi tối.' }
      ],
      tips: ['Đặt bàn trước vào tối cuối tuần để chọn được vị trí yêu thích.', 'Ghi chú dịp đặc biệt khi đặt bàn để nhà hàng chuẩn bị chu đáo hơn.', 'Hỏi nhân viên gợi ý đồ uống hợp với món chính.'],
      quote: 'Nơi hương vị kết nối những câu chuyện.' },
    { id: 'tu-can-bep-den-ban-an', cat: 'cau-chuyen', tag: 'Câu chuyện', crumb: 'Câu chuyện / Gian bếp', editorial: true,
      title: 'Từ căn bếp đến bàn ăn', sub: 'Hương vị được gửi trao', img: IMG + 'dish-handmade-pasta.jpg', mins: 7, date: '10/11/2026',
      lead: 'Trước khi đĩa mì đến bàn của bạn, nó đã đi qua một hành trình dài trong căn bếp: từ bột và trứng, qua đôi tay cán bột, đến nồi nước sôi và chảo sốt. Đây là câu chuyện về sự kiên nhẫn ấy.',
      body: ['Mỗi sáng, căn bếp Fiabesco bắt đầu bằng tiếng cán bột đều tay. Mì được làm mới trong ngày, sốt cà chua San Marzano được hầm chậm cho đến khi dậy mùi thơm ngọt.',
        'Từ khâu chọn phô mai Parmigiano đến lúc rưới dầu ô liu cuối cùng, chúng tôi giữ nhịp làm việc thủ công để mỗi đĩa ăn mang đúng tinh thần ẩm thực Ý.'],
      sections: [
        { h: 'Buổi sáng bắt đầu bằng bột và trứng', p: [
          'Mì tươi được nhào từ bột mì và trứng, nghỉ cho bột “thở” rồi mới cán mỏng. Công đoạn này không thể vội: bột nghỉ đủ thì sợi mì mới dai, mềm và bắt sốt tốt.',
          'Mỗi loại mì có hình dáng riêng — sợi dẹt cho sốt kem, sợi tròn cho sốt cà chua, những miếng ravioli nhỏ cho nhân phô mai rau bina. Hình dáng sợi mì quyết định cách sốt bám vào nó.'], img: IMG + 'dish-ravioli.jpg', cap: 'Ravioli nhân ricotta – rau bina được gói thủ công.' },
        { h: 'Nồi sốt được canh lửa nhỏ', p: [
          'Sốt Bolognese của Fiabesco được hầm lửa nhỏ trong nhiều giờ. Thời gian giúp thịt mềm, cà chua bớt chua gắt và các hương vị hòa vào nhau.',
          'Người phụ trách bếp nóng sẽ nếm sốt nhiều lần trong ngày, nêm lại khi cần. Đó là lý do mỗi mẻ sốt luôn được ghi giờ bắt đầu và kết thúc.'] },
        { h: 'Khoảnh khắc cuối cùng trước khi ra bàn', p: [
          'Mì chỉ được luộc khi có đơn, sau đó đảo nhanh với sốt cùng một chút nước luộc mì để sốt sánh mịn. Phô mai bào và dầu ô liu được thêm ngay trước khi món rời bếp.',
          'Với đơn giao hàng, món được đóng hộp giữ nhiệt và tách riêng phần dễ mềm để khi mở hộp, món vẫn giữ được kết cấu tốt nhất có thể.'], img: IMG + 'dish-spaghetti-bolognese.jpg', cap: 'Mì Ý bò bằm với sốt hầm chậm.' }
      ],
      tips: ['Gọi món mì ngay khi đến để thưởng thức lúc còn nóng.', 'Với đơn giao hàng, nên dùng trong khoảng 15 phút sau khi nhận.', 'Muốn ít béo hơn? Ghi chú cho bếp khi chọn món.'],
      quote: 'Món ngon bắt đầu từ sự kiên nhẫn trong gian bếp.' },
    { id: 'khoanh-khac-ben-nguoi-than', cat: 'cau-chuyen', tag: 'Trải nghiệm', crumb: 'Trải nghiệm / Câu chuyện', editorial: true,
      title: 'Khoảnh khắc bên người thân', sub: 'Những cuộc hẹn đáng nhớ', img: IMG + 'restaurant-garden-dinner.jpg', mins: 5, date: '02/11/2026',
      lead: 'Ở nước Ý, bữa tối gia đình thường kéo dài hơn bạn nghĩ: món này nối tiếp món kia, câu chuyện này dẫn sang câu chuyện khác. Chúng tôi mong mỗi bàn ăn ở Fiabesco cũng có được nhịp chậm rãi như thế.',
      body: ['Có những bữa tối không cần dịp đặc biệt: chỉ cần một bàn ấm, vài món quen và những người thân quây quần.',
        'Khu sân vườn của Fiabesco được bố trí để mỗi nhóm khách có khoảng riêng, đủ yên tĩnh cho những câu chuyện dài và đủ ấm áp cho những lần gặp lại.'],
      sections: [
        { h: 'Bữa ăn để chia sẻ', p: [
          'Cách thưởng thức món Ý theo kiểu gia đình là gọi nhiều món và cùng chia. Một đĩa khai vị đặt giữa bàn, vài món mì và risotto cho cả nhóm, rồi kết thúc bằng món tráng miệng ngọt nhẹ.',
          'Các combo gia đình của Fiabesco được thiết kế theo tinh thần ấy: đủ món để mọi người cùng nếm thử, không ai phải chọn một món duy nhất.'], img: IMG + 'event-family-gathering.jpg', cap: 'Một buổi tối sum vầy cùng gia đình.' },
        { h: 'Những dịp đáng nhớ', p: [
          'Sinh nhật, kỷ niệm ngày cưới hay một lời cầu hôn — mỗi dịp cần một cách chuẩn bị khác nhau. Khi đặt bàn, bạn có thể chọn gói trang trí và ghi chú mong muốn để đội ngũ sắp xếp trước khi bạn đến.',
          'Điều chúng tôi trân trọng nhất là được chứng kiến những khoảnh khắc ấy: một chiếc bánh có nến, một tràng vỗ tay nhỏ, một ánh mắt ngạc nhiên.'], img: IMG + 'event-birthday-party.jpg', cap: 'Bàn tiệc sinh nhật được trang trí theo yêu cầu.' },
        { h: 'Cho cả những thành viên nhỏ tuổi', p: [
          'Nhiều món Ý rất hợp với trẻ nhỏ: mì sốt cà chua, pizza Margherita hay một phần gelato mát lạnh. Bạn có thể nhờ nhân viên điều chỉnh độ mặn, bỏ bớt tiêu hoặc chia phần nhỏ hơn.'] }
      ],
      tips: ['Chọn combo gia đình khi đi từ 4 người trở lên.', 'Đặt gói trang trí khi đặt bàn trực tuyến cho các dịp đặc biệt.', 'Báo trước nếu đi cùng trẻ nhỏ để nhà hàng chuẩn bị ghế phù hợp.'],
      quote: 'Bữa ăn ngon nhất là bữa ăn có người thương bên cạnh.' },
    { id: 'ban-tin-am-thuc-thang-11', cat: 'tin-tuc', tag: 'Tin tức', crumb: 'Tin tức / Bản tin', editorial: true,
      title: 'Bản tin ẩm thực tháng 11', sub: 'Món mới và ưu đãi trong tháng', img: IMG + 'dish-tiramisu.jpg', mins: 4, date: '01/11/2026',
      lead: 'Tháng 11 mang đến những món mới trong thực đơn, vài ưu đãi dành cho độc giả bản tin và một số cập nhật nhỏ giúp việc đặt món, đặt bàn thuận tiện hơn.',
      body: ['Tháng này, thực đơn Fiabesco chào đón Green Spaghetti sốt pesto cùng các món risotto theo mùa.',
        'Độc giả của bản tin có thể dùng mã NEWS10 để được giảm 10% cho lần đặt món tiếp theo – xem chi tiết tại trang Ưu đãi.'],
      sections: [
        { h: 'Món mới trên thực đơn', p: [
          'Green Spaghetti sốt pesto mang màu xanh tươi của húng quế, quyện cùng hạt thông và Parmigiano — một lựa chọn nhẹ nhàng cho bữa trưa.',
          'Bên cạnh đó là các món risotto theo mùa như risotto bí đỏ hạt dẻ và risotto nấm thông, phù hợp với những ngày se lạnh cuối năm.'], img: IMG + 'promo-green-spaghetti.jpg', cap: 'Green Spaghetti sốt pesto.' },
        { h: 'Ưu đãi dành cho độc giả', p: [
          'Mã NEWS10 giảm 10% cho lần đặt món tiếp theo. Bạn có thể nhập mã ở bước Giỏ hàng; điều kiện chi tiết được cập nhật tại trang Ưu đãi.',
          'Thành viên Fiabesco tiếp tục được tích điểm cho mỗi đơn hàng giao thành công và đổi các phần quà trong trang Thành viên.'] },
        { h: 'Cập nhật dịch vụ', p: [
          'Trang Theo dõi đơn hàng đã được làm mới để bạn xem rõ đơn đang ở bước nào: đã xác nhận, bếp đang chuẩn bị, đang giao hay đã nhận món.',
          'Thanh tìm kiếm trên Trang chủ giúp bạn tìm nhanh món ăn, ưu đãi hoặc thông tin nhà hàng chỉ với vài ký tự.'] }
      ],
      tips: ['Theo dõi bản tin hằng tháng để không bỏ lỡ món mới.', 'Kiểm tra hạn sử dụng mã ưu đãi trước khi đặt món.'],
      quote: 'Mỗi mùa một hương vị mới từ nước Ý.' },
    { id: 'thuong-thuc-mi-y-dung-dieu', cat: 'meo', tag: 'Mẹo', crumb: 'Mẹo / Thưởng thức', editorial: true,
      title: 'Thưởng thức mì Ý đúng điệu', sub: 'Vài mẹo nhỏ từ bếp trưởng', img: IMG + 'dish-lasagna-baking-dish.jpg', mins: 5, date: '25/10/2026',
      lead: 'Không có luật lệ cứng nhắc nào cho niềm vui ăn uống. Nhưng vài mẹo nhỏ dưới đây có thể giúp đĩa mì của bạn ngon hơn một chút — dù ăn tại nhà hàng hay mở hộp giao tận nơi.',
      body: ['Hãy thưởng thức mì khi còn nóng để sốt bám đều từng sợi. Với mì sợi dài, dùng nĩa xoắn nhẹ thay vì cắt ngắn.',
        'Phô mai bào nên rắc ngay trước khi ăn; còn với món hải sản, người Ý thường không thêm phô mai để giữ vị ngọt tự nhiên.'],
      sections: [
        { h: 'Ăn ngay khi còn nóng', p: [
          'Sốt mì ngon nhất khi vừa được đảo cùng sợi mì. Để lâu, sốt sẽ đặc lại và sợi mì hút bớt độ ẩm. Vì vậy, hãy thưởng thức ngay khi món được mang ra.',
          'Với đơn giao hàng, nếu sốt hơi đặc, bạn có thể hâm nóng nhẹ trên chảo cùng một thìa nước nóng và đảo đều.'] },
        { h: 'Dùng nĩa đúng cách', p: [
          'Với spaghetti hay linguine, hãy dùng nĩa cuộn một lượng nhỏ sợi mì sát thành đĩa. Cách này giúp sợi mì giữ nguyên độ dài và sốt bám đều.',
          'Với các loại mì ống ngắn như penne hay fusilli, chỉ cần xiên nhẹ — hình dáng của chúng vốn được tạo ra để giữ sốt bên trong.'], img: IMG + 'dish-amatriciana.jpg', cap: 'Mì Ý Amatriciana.' },
        { h: 'Phô mai và gia vị', p: [
          'Phô mai bào nên rắc ngay trước khi ăn để giữ hương thơm. Tiêu đen xay thô hợp với các món như Carbonara hay Cacio e pepe.',
          'Với món hải sản như mì nghêu, nhiều đầu bếp Ý thường không thêm phô mai để vị ngọt của hải sản được trọn vẹn — nhưng cuối cùng, khẩu vị của bạn vẫn là quan trọng nhất.'] },
        { h: 'Đồ uống đi kèm', p: [
          'Một ly vang đỏ nhẹ hợp với mì sốt cà chua hay sốt thịt; vang trắng tươi mát hợp với mì hải sản. Nếu không dùng đồ uống có cồn, Limonata hay nước khoáng có ga cũng giúp cân bằng vị béo.'] }
      ],
      tips: ['Đừng cắt ngắn mì sợi dài — hãy cuộn bằng nĩa.', 'Rắc phô mai ngay trước khi ăn.', 'Hâm nóng mì giao tận nơi bằng chảo cùng một chút nước nóng.'],
      quote: 'Đơn giản là bí quyết của ẩm thực Ý.' }
  ];
})();
