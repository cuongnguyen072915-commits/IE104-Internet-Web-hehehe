/* Thực đơn đầy đủ (51 món) – bổ sung cho FB_DATA trong js/data.js.
   Nguồn: Figma Page PC (PC – 02f Thực đơn – <Danh mục>) + dữ liệu “★ TỔNG HỢP LUỒNG – Prototype”.
   File MỚI: nạp ngay sau ../js/data.js và trước ../js/main.js. Không sửa data.js. */
(function () {
  if (!window.FB_DATA) return;
  const IMG = '../assets/template-20261120T115451Z-1-001 - Copy/template/';
  const D = window.FB_DATA;

  /* Ảnh đúng món cho Carbonara (ảnh cua chuyển sang món “Mì Ý xốt kem với cua”) */
  const carb = D.byId('carbonara');
  if (carb) carb.img = IMG + 'dish-carbonara.jpg';

  const more = [
    /* Khai vị */
    { id: 'carpaccio', name: 'Thăn bò tái Carpaccio', desc: 'Thăn bò thái mỏng, rau rocket, Parmesan bào và sốt chanh.', price: 159000, tag: 'Chef’s Pick', img: IMG + 'dish-beef-carpaccio.jpg', cat: 'khai-vi' },
    { id: 'arancini', name: 'Cơm viên chiên Arancini', desc: 'Risotto nghệ tây bọc mozzarella, chiên giòn, chấm sốt cà.', price: 99000, tag: '', img: IMG + 'dish-arancini.jpg', cat: 'khai-vi', veg: true },
    { id: 'calamari', name: 'Mực chiên giòn Calamari', desc: 'Mực ống tẩm bột chiên giòn, chanh vàng và sốt aioli.', price: 129000, tag: 'Best Seller', img: IMG + 'dish-calamari-fritti.jpg', cat: 'khai-vi' },
    { id: 'focaccia', name: 'Bánh mì Focaccia hương thảo', desc: 'Focaccia nướng lò, cà chua bi, muối biển và dầu ô liu.', price: 69000, tag: '', img: IMG + 'dish-focaccia.jpg', cat: 'khai-vi', veg: true },
    { id: 'prosciutto', name: 'Đùi heo muối Prosciutto & dưa lưới', desc: 'Prosciutto di Parma 18 tháng cuộn dưa lưới và rau rocket.', price: 149000, tag: '', img: IMG + 'dish-prosciutto-melone.jpg', cat: 'khai-vi' },
    { id: 'polpette', name: 'Thịt viên sốt cà Polpette', desc: 'Bò viên kiểu Ý hầm sốt cà chua, phô mai bào, bánh mì nướng.', price: 119000, tag: 'Mới', img: IMG + 'dish-polpette.jpg', cat: 'khai-vi' },
    /* Súp */
    { id: 'ribollita', name: 'Súp bánh mì cải xoăn', desc: 'Súp rau cải xoăn kiểu Tuscany, kem chua và bánh mì giòn.', price: 119000, tag: '', img: IMG + 'soup-ribollita.jpg', cat: 'sup', veg: true },
    { id: 'cacciucco', name: 'Súp hải sản kiểu Livorno', desc: 'Tôm, mực, cá và nghêu hầm sốt cà chua, bánh mì nướng tỏi.', price: 159000, tag: 'Chef’s Pick', img: IMG + 'soup-cacciucco.jpg', cat: 'sup' },
    { id: 'pasta-fagioli', name: 'Súp mì ống đậu trắng', desc: 'Pasta e fagioli: mì ống nhỏ, đậu borlotti và rau thơm.', price: 109000, tag: '', img: IMG + 'soup-pasta-e-fagioli.jpg', cat: 'sup', veg: true },
    { id: 'pappa-pomodoro', name: 'Súp cà chua bánh mì Pappa', desc: 'Cà chua chín hầm cùng bánh mì, húng quế và dầu ô liu.', price: 99000, tag: 'Mới', img: IMG + 'soup-pappa-al-pomodoro.jpg', cat: 'sup', veg: true },
    /* Mì Ý */
    { id: 'mi-cua', name: 'Mì Ý xốt kem với cua', desc: 'Thịt cua tươi, sốt kem bơ tỏi và ớt Calabria.', price: 209000, tag: 'Best Seller', img: IMG + 'dish-crab-cream-spaghetti.jpg', cat: 'mi-y' },
    { id: 'cacio-pepe', name: 'Mì Ý sốt phô mai tiêu đen', desc: 'Cacio e pepe: Pecorino Romano và tiêu đen xay thô.', price: 139000, tag: '', img: IMG + 'dish-cacio-e-pepe.jpg', cat: 'mi-y', veg: true },
    { id: 'alfredo', name: 'Mì Ý sốt kem Alfredo', desc: 'Mì Fettuccine, bơ, kem tươi và Parmigiano.', price: 109000, tag: '', img: IMG + 'dish-alfredo.jpg', cat: 'mi-y', veg: true },
    { id: 'vongole', name: 'Mì Ý xào nghêu tươi', desc: 'Spaghetti alle vongole: nghêu, tỏi, rượu vang trắng.', price: 189000, tag: 'Chef’s Pick', img: IMG + 'dish-vongole.jpg', cat: 'mi-y' },
    { id: 'mi-tuoi', name: 'Mì tươi cán tay sốt bơ xô thơm', desc: 'Mì trứng cán tay mỗi sáng, bơ nâu và lá xô thơm.', price: 149000, tag: '', img: IMG + 'dish-handmade-pasta.jpg', cat: 'mi-y', veg: true },
    { id: 'green-spaghetti', name: 'Green Spaghetti sốt Pesto', desc: 'Sốt pesto húng quế, hạt thông và Parmigiano.', price: 129000, tag: 'Mới', img: IMG + 'dish-green-pesto-spaghetti.jpg', cat: 'mi-y', veg: true },
    { id: 'gnocchi', name: 'Gnocchi đút lò Sorrentina', desc: 'Gnocchi khoai tây, sốt cà chua, mozzarella nướng chảy.', price: 139000, tag: '', img: IMG + 'dish-gnocchi-sorrentina.jpg', cat: 'mi-y', veg: true },
    /* Risotto */
    { id: 'risotto-nero', name: 'Risotto sốt mực đen', desc: 'Gạo Carnaroli nấu mực đen, mực ống và tôm áp chảo.', price: 159000, tag: 'Chef’s Pick', img: IMG + 'risotto-nero.jpg', cat: 'risotto' },
    { id: 'risotto-zafferano', name: 'Risotto nhụy hoa nghệ tây', desc: 'Risotto alla Milanese, nghệ tây và sò điệp áp chảo.', price: 129000, tag: '', img: IMG + 'risotto-zafferano.jpg', cat: 'risotto' },
    { id: 'risotto-funghi', name: 'Risotto nấm thông', desc: 'Nấm porcini, nấm mỡ, hương thảo và Grana Padano.', price: 139000, tag: '', img: IMG + 'risotto-funghi.jpg', cat: 'risotto', veg: true },
    { id: 'risotto-hai-san', name: 'Risotto hải sản', desc: 'Tôm, vẹm, nghêu và mực nấu cùng nước dùng hải sản.', price: 179000, tag: 'Mới', img: IMG + 'risotto-frutti-di-mare.jpg', cat: 'risotto' },
    /* Salad */
    { id: 'salad-rocket', name: 'Salad rau rocket & Parmesan', desc: 'Rocket, cà chua bi, hạt thông, Parmesan và giấm balsamic.', price: 99000, tag: '', img: IMG + 'dish-rocket-parmesan-salad.jpg', cat: 'salad', veg: true },
    { id: 'panzanella', name: 'Salad bánh mì Panzanella', desc: 'Bánh mì nướng, cà chua, dưa leo, hành tím và húng quế.', price: 95000, tag: '', img: IMG + 'dish-panzanella.jpg', cat: 'salad', veg: true },
    { id: 'salad-cam', name: 'Salad cam Sicilia & thì là', desc: 'Cam máu, củ thì là bào mỏng, ô liu đen và bạc hà.', price: 105000, tag: 'Mới', img: IMG + 'salad-orange-fennel.jpg', cat: 'salad', veg: true },
    /* Món nướng */
    { id: 'pizza-margherita', name: 'Pizza Margherita lò củi', desc: 'Đế Napoli, cà chua San Marzano, mozzarella và húng quế.', price: 169000, tag: 'Best Seller', img: IMG + 'dish-pizza-margherita.jpg', cat: 'nuong', veg: true },
    { id: 'pizza-pepperoni', name: 'Pizza Pepperoni', desc: 'Xúc xích pepperoni, mozzarella kéo sợi, sốt cà chua.', price: 189000, tag: '', img: IMG + 'dish-pizza-pepperoni.jpg', cat: 'nuong' },
    { id: 'nui-dut-lo', name: 'Nui đút lò phô mai', desc: 'Nui ống, sốt bò bằm, béchamel và phô mai nướng vàng.', price: 129000, tag: '', img: IMG + 'dish-baked-pasta.jpg', cat: 'nuong' },
    { id: 'suon-cuu', name: 'Sườn cừu nướng hương thảo', desc: 'Sườn cừu Úc nướng than, khoai tây bi và salsa verde.', price: 329000, tag: 'Chef’s Pick', img: IMG + 'dish-grilled-lamb-chops.jpg', cat: 'nuong' },
    { id: 'ca-hoi', name: 'Cá hồi nướng sốt chanh bơ', desc: 'Cá hồi Na Uy, sốt bơ chanh nụ bạch hoa, măng tây.', price: 259000, tag: '', img: IMG + 'dish-grilled-salmon.jpg', cat: 'nuong' },
    /* Tráng miệng */
    { id: 'tiramisu', name: 'Tiramisu cổ điển', desc: 'Bánh quy Savoiardi, mascarpone, espresso và cacao.', price: 79000, tag: 'Best Seller', img: IMG + 'dish-tiramisu.jpg', cat: 'trang-mieng', veg: true },
    { id: 'cannoli', name: 'Cannoli Sicilia', desc: 'Vỏ bánh giòn nhân ricotta ngọt, hạt dẻ cười và socola.', price: 75000, tag: '', img: IMG + 'dessert-cannoli.jpg', cat: 'trang-mieng', veg: true },
    { id: 'panna-cotta', name: 'Panna Cotta dâu rừng', desc: 'Kem sữa vani mềm mịn, sốt dâu rừng và mâm xôi.', price: 69000, tag: 'Mới', img: IMG + 'dessert-panna-cotta.jpg', cat: 'trang-mieng', veg: true },
    { id: 'gelato', name: 'Kem Gelato 3 vị', desc: 'Hạt dẻ cười, stracciatella và dâu tây, kèm bánh quế.', price: 65000, tag: '', img: IMG + 'dessert-gelato.jpg', cat: 'trang-mieng', veg: true },
    /* Thức uống & Rượu */
    { id: 'limonata', name: 'Limonata Ý', desc: 'Nước chanh vàng Amalfi có ga, bạc hà tươi.', price: 45000, tag: '', img: IMG + 'drink-limonata.jpg', cat: 'do-uong', veg: true },
    { id: 'tra-dao', name: 'Trà đào Bellini', desc: 'Trà đào ủ lạnh, đào tươi và soda (không cồn).', price: 55000, tag: 'Best Seller', img: IMG + 'drink-peach-tea.jpg', cat: 'do-uong', veg: true },
    { id: 'espresso', name: 'Espresso Ý', desc: 'Cà phê rang đậm pha máy, lớp crema vàng, kèm biscotti.', price: 39000, tag: '', img: IMG + 'drink-espresso.jpg', cat: 'do-uong', veg: true },
    { id: 'cappuccino', name: 'Cappuccino', desc: 'Espresso, sữa đánh bọt mịn và bột cacao.', price: 49000, tag: '', img: IMG + 'drink-cappuccino.jpg', cat: 'do-uong', veg: true },
    { id: 'spritz', name: 'Spritz cam đắng', desc: 'Cocktail rượu khai vị cam đắng, Prosecco và soda.', price: 119000, tag: 'Mới', img: IMG + 'drink-spritz.jpg', cat: 'do-uong', veg: true },
    { id: 'chianti', name: 'Vang đỏ Chianti (ly)', desc: 'Vang đỏ Tuscany từ nho Sangiovese, hợp món bò & pizza.', price: 145000, tag: '', img: IMG + 'drink-red-wine.jpg', cat: 'do-uong', veg: true },
    { id: 'pinot-grigio', name: 'Vang trắng Pinot Grigio (ly)', desc: 'Vang trắng Veneto tươi mát, hợp hải sản và risotto.', price: 135000, tag: '', img: IMG + 'drink-white-wine.jpg', cat: 'do-uong', veg: true },
    { id: 'prosecco', name: 'Prosecco (ly)', desc: 'Vang nổ Veneto, bọt mịn, hương táo xanh.', price: 135000, tag: '', img: IMG + 'drink-prosecco.jpg', cat: 'do-uong', veg: true },
    { id: 'limoncello', name: 'Limoncello', desc: 'Rượu chanh vàng Amalfi ướp lạnh, dùng sau bữa ăn.', price: 95000, tag: 'Chef’s Pick', img: IMG + 'drink-limoncello.jpg', cat: 'do-uong', veg: true }
  ];

  /* Thêm món mới (bỏ qua nếu id đã tồn tại), giữ nguyên mảng gốc để FB_DATA.byId vẫn hoạt động */
  more.forEach(d => { if (!D.dishes.some(x => x.id === d.id)) D.dishes.push(d); });

  /* Sắp xếp theo thứ tự danh mục giống Figma */
  const ORDER = ["burrata", "bruschetta", "carpaccio", "arancini", "calamari", "focaccia", "prosciutto", "polpette", "minestrone", "ribollita", "cacciucco", "pasta-fagioli", "pappa-pomodoro", "lasagna", "bolognese", "carbonara", "mi-cua", "cacio-pepe", "alfredo", "vongole", "mi-tuoi", "green-spaghetti", "gnocchi", "risotto-kem", "risotto-ga", "risotto-nero", "risotto-zafferano", "risotto-funghi", "risotto-hai-san", "caprese", "salad-rocket", "panzanella", "salad-cam", "pizza-margherita", "pizza-pepperoni", "nui-dut-lo", "suon-cuu", "ca-hoi", "tiramisu", "cannoli", "panna-cotta", "gelato", "limonata", "tra-dao", "espresso", "cappuccino", "spritz", "chianti", "pinot-grigio", "prosecco", "limoncello"];
  D.dishes.sort((a, b) => {
    const ia = ORDER.indexOf(a.id), ib = ORDER.indexOf(b.id);
    return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
  });

  /* Cập nhật số món mỗi danh mục theo dữ liệu thật */
  D.categories.forEach(c => {
    c.count = c.id === 'all' ? D.dishes.length : D.dishes.filter(d => d.cat === c.id).length;
  });
  D.totalDishes = D.dishes.length;
})();
