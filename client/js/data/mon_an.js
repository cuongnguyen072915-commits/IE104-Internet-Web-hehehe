/* Thực đơn đầy đủ – 96 món (12 món × 8 danh mục). Bổ sung cho FB_DATA trong js/data.js.
   Nguồn: Figma Page PC – “PC – 02f Thực đơn – <Danh mục>” và “PC – 02g Thực đơn – Tất cả (Trang 1–8/8)”.
   File MỚI: nạp ngay sau ../js/data.js, trước ../js/main.js. Không sửa data.js. */
(function () {
  if (!window.FB_DATA) return;
  const IMG = '../assets/template-20261120T115451Z-1-001 - Copy/template/';
  const D = window.FB_DATA;

  /* Ảnh đúng món cho Carbonara (ảnh mì cua chuyển sang món “Mì Ý xốt kem với cua”) */
  const carb = D.byId('carbonara');
  if (carb) carb.img = IMG + 'dish-carbonara.jpg';

  const more = [
    /* Khai vị */
    { id: "carpaccio", name: "Thăn bò tái Carpaccio", desc: "Thăn bò thái mỏng, rau rocket, Parmesan bào và sốt chanh.", price: 159000, tag: "Chef’s Pick", img: IMG + "dish-beef-carpaccio.jpg", cat: "khai-vi" },
    { id: "arancini", name: "Cơm viên chiên Arancini", desc: "Risotto nghệ tây bọc mozzarella, chiên giòn, chấm sốt cà.", price: 99000, tag: "", img: IMG + "dish-arancini.jpg", cat: "khai-vi", veg: true },
    { id: "calamari", name: "Mực chiên giòn Calamari", desc: "Mực ống tẩm bột chiên giòn, chanh vàng và sốt aioli.", price: 129000, tag: "Best Seller", img: IMG + "dish-calamari-fritti.jpg", cat: "khai-vi" },
    { id: "focaccia", name: "Bánh mì Focaccia hương thảo", desc: "Focaccia nướng lò, cà chua bi, muối biển và dầu ô liu.", price: 69000, tag: "", img: IMG + "dish-focaccia.jpg", cat: "khai-vi", veg: true },
    { id: "prosciutto", name: "Đùi heo muối Prosciutto & dưa lưới", desc: "Prosciutto di Parma 18 tháng cuộn dưa lưới và rau rocket.", price: 149000, tag: "", img: IMG + "dish-prosciutto-melone.jpg", cat: "khai-vi" },
    { id: "polpette", name: "Thịt viên sốt cà Polpette", desc: "Bò viên kiểu Ý hầm sốt cà chua, phô mai bào, bánh mì nướng.", price: 119000, tag: "Mới", img: IMG + "dish-polpette.jpg", cat: "khai-vi" },
    { id: "caponata", name: "Cà tím hầm chua ngọt Caponata", desc: "Cà tím, cần tây, nụ bạch hoa và ô liu hầm kiểu Sicilia.", price: 89000, tag: "", img: IMG + "dish-caponata.jpg", cat: "khai-vi", veg: true },
    { id: "frittata", name: "Bánh trứng Frittata rau củ", desc: "Trứng gà ta, rau bina, ớt chuông và phô mai Pecorino.", price: 85000, tag: "", img: IMG + "dish-frittata.jpg", cat: "khai-vi", veg: true },
    { id: "crostini-nam", name: "Bánh mì nướng nấm Crostini", desc: "Bánh mì giòn phủ nấm xào bơ tỏi, cỏ xạ hương và Parmesan.", price: 79000, tag: "Mới", img: IMG + "dish-crostini-nam.jpg", cat: "khai-vi", veg: true },
    { id: "provola", name: "Phô mai nướng Provola", desc: "Phô mai Provola xông khói nướng chảy, mật ong và óc chó.", price: 115000, tag: "", img: IMG + "dish-provola.jpg", cat: "khai-vi", veg: true },
    /* Súp */
    { id: "ribollita", name: "Súp bánh mì cải xoăn", desc: "Súp rau cải xoăn kiểu Tuscany, kem chua và bánh mì giòn.", price: 119000, tag: "", img: IMG + "soup-ribollita.jpg", cat: "sup", veg: true },
    { id: "cacciucco", name: "Súp hải sản kiểu Livorno", desc: "Tôm, mực, cá và nghêu hầm sốt cà chua, bánh mì nướng tỏi.", price: 159000, tag: "Chef’s Pick", img: IMG + "soup-cacciucco.jpg", cat: "sup" },
    { id: "pasta-fagioli", name: "Súp mì ống đậu trắng", desc: "Pasta e fagioli: mì ống nhỏ, đậu borlotti và rau thơm.", price: 109000, tag: "", img: IMG + "soup-pasta-e-fagioli.jpg", cat: "sup", veg: true },
    { id: "pappa-pomodoro", name: "Súp cà chua bánh mì Pappa", desc: "Cà chua chín hầm cùng bánh mì, húng quế và dầu ô liu.", price: 99000, tag: "Mới", img: IMG + "soup-pappa-al-pomodoro.jpg", cat: "sup", veg: true },
    { id: "sup-nam-truffle", name: "Súp nấm kem truffle", desc: "Nấm porcini xay mịn, kem tươi và dầu truffle đen.", price: 129000, tag: "Chef’s Pick", img: IMG + "soup-nam-truffle.jpg", cat: "sup", veg: true },
    { id: "stracciatella", name: "Súp trứng Stracciatella", desc: "Nước dùng gà, trứng đánh tơi, Parmigiano và rau bina.", price: 89000, tag: "", img: IMG + "soup-stracciatella.jpg", cat: "sup" },
    { id: "sup-hanh", name: "Súp hành Ý nướng phô mai", desc: "Hành tây hầm chậm với vang trắng, phủ bánh mì và Fontina.", price: 99000, tag: "", img: IMG + "soup-hanh.jpg", cat: "sup", veg: true },
    { id: "sup-bi-do", name: "Súp bí đỏ hạt dẻ", desc: "Bí đỏ nướng xay nhuyễn, kem, hạt dẻ rang và xô thơm.", price: 95000, tag: "Mới", img: IMG + "soup-bi-do.jpg", cat: "sup", veg: true },
    { id: "sup-dau-lang", name: "Súp đậu lăng Umbria", desc: "Đậu lăng Castelluccio, cà rốt, cần tây và dầu ô liu.", price: 99000, tag: "", img: IMG + "soup-dau-lang.jpg", cat: "sup", veg: true },
    { id: "tortellini-brodo", name: "Súp Tortellini nước dùng gà", desc: "Tortellini nhân thịt trong nước dùng gà hầm 8 giờ.", price: 119000, tag: "", img: IMG + "soup-tortellini-brodo.jpg", cat: "sup" },
    { id: "sup-ca-chua-burrata", name: "Súp cà chua nướng & burrata", desc: "Cà chua nướng than xay mịn, burrata tươi và húng quế.", price: 109000, tag: "", img: IMG + "soup-ca-chua-burrata.jpg", cat: "sup", veg: true },
    /* Mì Ý */
    { id: "mi-cua", name: "Mì Ý xốt kem với cua", desc: "Thịt cua tươi, sốt kem bơ tỏi và ớt Calabria.", price: 209000, tag: "Best Seller", img: IMG + "dish-crab-cream-spaghetti.jpg", cat: "mi-y" },
    { id: "cacio-pepe", name: "Mì Ý sốt phô mai tiêu đen", desc: "Cacio e pepe: Pecorino Romano và tiêu đen xay thô.", price: 139000, tag: "", img: IMG + "dish-cacio-e-pepe.jpg", cat: "mi-y", veg: true },
    { id: "alfredo", name: "Mì Ý sốt kem Alfredo", desc: "Mì Fettuccine, bơ, kem tươi và Parmigiano.", price: 109000, tag: "", img: IMG + "dish-alfredo.jpg", cat: "mi-y", veg: true },
    { id: "vongole", name: "Mì Ý xào nghêu tươi", desc: "Spaghetti alle vongole: nghêu, tỏi, rượu vang trắng.", price: 189000, tag: "Chef’s Pick", img: IMG + "dish-vongole.jpg", cat: "mi-y" },
    { id: "mi-tuoi", name: "Mì tươi cán tay sốt bơ xô thơm", desc: "Mì trứng cán tay mỗi sáng, bơ nâu và lá xô thơm.", price: 149000, tag: "", img: IMG + "dish-handmade-pasta.jpg", cat: "mi-y", veg: true },
    { id: "green-spaghetti", name: "Green Spaghetti sốt Pesto", desc: "Sốt pesto húng quế, hạt thông và Parmigiano.", price: 129000, tag: "Mới", img: IMG + "dish-green-pesto-spaghetti.jpg", cat: "mi-y", veg: true },
    { id: "gnocchi", name: "Gnocchi đút lò Sorrentina", desc: "Gnocchi khoai tây, sốt cà chua, mozzarella nướng chảy.", price: 139000, tag: "", img: IMG + "dish-gnocchi-sorrentina.jpg", cat: "mi-y", veg: true },
    { id: "amatriciana", name: "Mì Ý Amatriciana", desc: "Bucatini, guanciale giòn, cà chua và Pecorino Romano.", price: 149000, tag: "", img: IMG + "dish-amatriciana.jpg", cat: "mi-y" },
    { id: "ravioli", name: "Ravioli nhân ricotta rau bina", desc: "Ravioli tươi, nhân ricotta – rau bina, sốt bơ xô thơm.", price: 159000, tag: "Mới", img: IMG + "dish-ravioli.jpg", cat: "mi-y", veg: true },
    /* Risotto */
    { id: "risotto-nero", name: "Risotto sốt mực đen", desc: "Gạo Carnaroli nấu mực đen, mực ống và tôm áp chảo.", price: 159000, tag: "Chef’s Pick", img: IMG + "risotto-nero.jpg", cat: "risotto" },
    { id: "risotto-zafferano", name: "Risotto nhụy hoa nghệ tây", desc: "Risotto alla Milanese, nghệ tây và sò điệp áp chảo.", price: 129000, tag: "", img: IMG + "risotto-zafferano.jpg", cat: "risotto" },
    { id: "risotto-funghi", name: "Risotto nấm thông", desc: "Nấm porcini, nấm mỡ, hương thảo và Grana Padano.", price: 139000, tag: "", img: IMG + "risotto-funghi.jpg", cat: "risotto", veg: true },
    { id: "risotto-hai-san", name: "Risotto hải sản", desc: "Tôm, vẹm, nghêu và mực nấu cùng nước dùng hải sản.", price: 179000, tag: "Mới", img: IMG + "risotto-frutti-di-mare.jpg", cat: "risotto" },
    { id: "risotto-bi-do", name: "Risotto bí đỏ & hạt dẻ", desc: "Bí đỏ nướng, hạt dẻ rang, xô thơm và Parmigiano.", price: 129000, tag: "", img: IMG + "risotto-bi-do.jpg", cat: "risotto", veg: true },
    { id: "risotto-mang-tay", name: "Risotto măng tây chanh vàng", desc: "Măng tây xanh, vỏ chanh vàng và mascarpone.", price: 135000, tag: "", img: IMG + "risotto-mang-tay.jpg", cat: "risotto", veg: true },
    { id: "risotto-tom-hum", name: "Risotto tôm hùm", desc: "Nửa con tôm hùm, nước dùng vỏ tôm và rượu Cognac.", price: 389000, tag: "Chef’s Pick", img: IMG + "risotto-tom-hum.jpg", cat: "risotto" },
    { id: "risotto-bo-barolo", name: "Risotto bò & vang đỏ Barolo", desc: "Gạo nấu vang Barolo, thăn bò áp chảo thái lát.", price: 189000, tag: "", img: IMG + "risotto-bo-barolo.jpg", cat: "risotto" },
    { id: "risotto-pesto", name: "Risotto pesto & đậu Hà Lan", desc: "Pesto húng quế, đậu Hà Lan non và hạt thông rang.", price: 119000, tag: "", img: IMG + "risotto-pesto.jpg", cat: "risotto", veg: true },
    { id: "risotto-gorgonzola", name: "Risotto Gorgonzola & lê", desc: "Phô mai xanh Gorgonzola, lê áp chảo và óc chó.", price: 139000, tag: "", img: IMG + "risotto-gorgonzola.jpg", cat: "risotto", veg: true },
    /* Salad */
    { id: "salad-rocket", name: "Salad rau rocket & Parmesan", desc: "Rocket, cà chua bi, hạt thông, Parmesan và giấm balsamic.", price: 99000, tag: "", img: IMG + "dish-rocket-parmesan-salad.jpg", cat: "salad", veg: true },
    { id: "panzanella", name: "Salad bánh mì Panzanella", desc: "Bánh mì nướng, cà chua, dưa leo, hành tím và húng quế.", price: 95000, tag: "", img: IMG + "dish-panzanella.jpg", cat: "salad", veg: true },
    { id: "salad-cam", name: "Salad cam Sicilia & thì là", desc: "Cam máu, củ thì là bào mỏng, ô liu đen và bạc hà.", price: 105000, tag: "Mới", img: IMG + "salad-orange-fennel.jpg", cat: "salad", veg: true },
    { id: "salad-caesar", name: "Salad gà nướng Caesar kiểu Ý", desc: "Xà lách romaine, gà nướng, croutons và sốt anchovy.", price: 115000, tag: "Best Seller", img: IMG + "salad-caesar.jpg", cat: "salad" },
    { id: "salad-ca-ngu", name: "Salad cá ngừ & đậu trắng", desc: "Cá ngừ ngâm dầu, đậu cannellini, hành tím và rau mùi tây.", price: 125000, tag: "", img: IMG + "salad-ca-ngu.jpg", cat: "salad" },
    { id: "salad-hai-san", name: "Salad hải sản Insalata di mare", desc: "Tôm, mực, bạch tuộc trộn chanh, cần tây và dầu ô liu.", price: 159000, tag: "Chef’s Pick", img: IMG + "salad-hai-san.jpg", cat: "salad" },
    { id: "salad-le-gorgonzola", name: "Salad lê, Gorgonzola & óc chó", desc: "Rau mầm, lê tươi, phô mai xanh và óc chó rang mật ong.", price: 119000, tag: "", img: IMG + "salad-le-gorgonzola.jpg", cat: "salad", veg: true },
    { id: "salad-rau-nuong", name: "Salad rau củ nướng balsamic", desc: "Bí ngòi, cà tím, ớt chuông nướng và giấm balsamic.", price: 99000, tag: "", img: IMG + "salad-rau-nuong.jpg", cat: "salad", veg: true },
    { id: "salad-pasta", name: "Salad mì ống kiểu Ý", desc: "Mì fusilli, cà chua bi, ô liu, mozzarella và pesto.", price: 95000, tag: "", img: IMG + "salad-pasta.jpg", cat: "salad", veg: true },
    { id: "tagliata", name: "Salad bò nướng Tagliata", desc: "Thăn bò nướng thái lát, rocket, Parmesan và balsamic.", price: 189000, tag: "", img: IMG + "salad-tagliata.jpg", cat: "salad" },
    { id: "salad-dua-hau", name: "Salad dưa hấu & feta bạc hà", desc: "Dưa hấu ướp lạnh, phô mai feta, bạc hà và chanh.", price: 89000, tag: "Mới", img: IMG + "salad-dua-hau.jpg", cat: "salad", veg: true },
    /* Món nướng */
    { id: "pizza-margherita", name: "Pizza Margherita lò củi", desc: "Đế Napoli, cà chua San Marzano, mozzarella và húng quế.", price: 169000, tag: "Best Seller", img: IMG + "dish-pizza-margherita.jpg", cat: "nuong", veg: true },
    { id: "pizza-pepperoni", name: "Pizza Pepperoni", desc: "Xúc xích pepperoni, mozzarella kéo sợi, sốt cà chua.", price: 189000, tag: "", img: IMG + "dish-pizza-pepperoni.jpg", cat: "nuong" },
    { id: "nui-dut-lo", name: "Nui đút lò phô mai", desc: "Nui ống, sốt bò bằm, béchamel và phô mai nướng vàng.", price: 129000, tag: "", img: IMG + "dish-baked-pasta.jpg", cat: "nuong" },
    { id: "suon-cuu", name: "Sườn cừu nướng hương thảo", desc: "Sườn cừu Úc nướng than, khoai tây bi và salsa verde.", price: 329000, tag: "Chef’s Pick", img: IMG + "dish-grilled-lamb-chops.jpg", cat: "nuong" },
    { id: "ca-hoi", name: "Cá hồi nướng sốt chanh bơ", desc: "Cá hồi Na Uy, sốt bơ chanh nụ bạch hoa, măng tây.", price: 259000, tag: "", img: IMG + "dish-grilled-salmon.jpg", cat: "nuong" },
    { id: "pizza-4-pho-mai", name: "Pizza 4 loại phô mai", desc: "Mozzarella, Gorgonzola, Fontina và Parmigiano trên đế mỏng.", price: 199000, tag: "", img: IMG + "dish-pizza-4-pho-mai.jpg", cat: "nuong", veg: true },
    { id: "pizza-diavola", name: "Pizza Diavola cay", desc: "Salami cay Calabria, ớt tươi, mozzarella và sốt cà.", price: 189000, tag: "", img: IMG + "dish-pizza-diavola.jpg", cat: "nuong" },
    { id: "pizza-hai-san", name: "Pizza hải sản", desc: "Tôm, mực, nghêu, tỏi và rau mùi tây trên sốt cà chua.", price: 219000, tag: "Mới", img: IMG + "dish-pizza-hai-san.jpg", cat: "nuong" },
    { id: "bit-tet-florentine", name: "Bít tết bò Florentine", desc: "Thăn bò T-bone 600g nướng than, rocket và chanh.", price: 459000, tag: "Chef’s Pick", img: IMG + "dish-bit-tet-florentine.jpg", cat: "nuong" },
    { id: "ga-nuong", name: "Gà nướng thảo mộc Diavola", desc: "Gà ta nướng nguyên con ép dẹt, ớt, chanh và hương thảo.", price: 219000, tag: "", img: IMG + "dish-ga-nuong.jpg", cat: "nuong" },
    { id: "tom-nuong", name: "Tôm nướng bơ tỏi", desc: "Tôm sú nướng than, bơ tỏi, ớt và rau mùi tây.", price: 249000, tag: "", img: IMG + "dish-tom-nuong.jpg", cat: "nuong" },
    { id: "calzone", name: "Calzone nhân giăm bông", desc: "Bánh pizza gấp nhân giăm bông, ricotta và mozzarella.", price: 179000, tag: "", img: IMG + "dish-calzone.jpg", cat: "nuong" },
    /* Tráng miệng */
    { id: "tiramisu", name: "Tiramisu cổ điển", desc: "Bánh quy Savoiardi, mascarpone, espresso và cacao.", price: 79000, tag: "Best Seller", img: IMG + "dish-tiramisu.jpg", cat: "trang-mieng", veg: true },
    { id: "cannoli", name: "Cannoli Sicilia", desc: "Vỏ bánh giòn nhân ricotta ngọt, hạt dẻ cười và socola.", price: 75000, tag: "", img: IMG + "dessert-cannoli.jpg", cat: "trang-mieng", veg: true },
    { id: "panna-cotta", name: "Panna Cotta dâu rừng", desc: "Kem sữa vani mềm mịn, sốt dâu rừng và mâm xôi.", price: 69000, tag: "Mới", img: IMG + "dessert-panna-cotta.jpg", cat: "trang-mieng", veg: true },
    { id: "gelato", name: "Kem Gelato 3 vị", desc: "Hạt dẻ cười, stracciatella và dâu tây, kèm bánh quế.", price: 65000, tag: "", img: IMG + "dessert-gelato.jpg", cat: "trang-mieng", veg: true },
    { id: "affogato", name: "Affogato", desc: "Kem vani rưới một shot espresso nóng.", price: 69000, tag: "", img: IMG + "dessert-affogato.jpg", cat: "trang-mieng", veg: true },
    { id: "banh-ricotta", name: "Bánh phô mai Ricotta", desc: "Bánh nướng ricotta vỏ chanh, dâu tây tươi.", price: 79000, tag: "", img: IMG + "dessert-banh-ricotta.jpg", cat: "trang-mieng", veg: true },
    { id: "torta-caprese", name: "Bánh socola hạnh nhân Torta Caprese", desc: "Bánh socola đen không bột mì, hạnh nhân và kem tươi.", price: 85000, tag: "Chef’s Pick", img: IMG + "dessert-torta-caprese.jpg", cat: "trang-mieng", veg: true },
    { id: "zeppole", name: "Bánh rán Zeppole kem", desc: "Bánh choux chiên nhân kem trứng, anh đào ngâm.", price: 69000, tag: "", img: IMG + "dessert-zeppole.jpg", cat: "trang-mieng", veg: true },
    { id: "semifreddo", name: "Semifreddo hạt dẻ cười", desc: "Kem đông lạnh mềm vị pistachio, sốt socola.", price: 79000, tag: "Mới", img: IMG + "dessert-semifreddo.jpg", cat: "trang-mieng", veg: true },
    { id: "sfogliatella", name: "Bánh Sfogliatella Napoli", desc: "Bánh vỏ sò nhiều lớp giòn, nhân ricotta cam.", price: 65000, tag: "", img: IMG + "dessert-sfogliatella.jpg", cat: "trang-mieng", veg: true },
    { id: "biscotti", name: "Biscotti hạnh nhân (5 cái)", desc: "Bánh quy nướng hai lần, hạnh nhân, chấm cùng Vin Santo.", price: 49000, tag: "", img: IMG + "dessert-biscotti.jpg", cat: "trang-mieng", veg: true },
    { id: "tartufo", name: "Kem Tartufo socola", desc: "Kem socola nhân anh đào, phủ cacao như nấm truffle.", price: 75000, tag: "", img: IMG + "dessert-tartufo.jpg", cat: "trang-mieng", veg: true },
    /* Thức uống & Rượu */
    { id: "limonata", name: "Limonata Ý", desc: "Nước chanh vàng Amalfi có ga, bạc hà tươi.", price: 45000, tag: "", img: IMG + "drink-limonata.jpg", cat: "do-uong", veg: true },
    { id: "tra-dao", name: "Trà đào Bellini", desc: "Trà đào ủ lạnh, đào tươi và soda (không cồn).", price: 55000, tag: "Best Seller", img: IMG + "drink-peach-tea.jpg", cat: "do-uong", veg: true },
    { id: "espresso", name: "Espresso Ý", desc: "Cà phê rang đậm pha máy, lớp crema vàng, kèm biscotti.", price: 39000, tag: "", img: IMG + "drink-espresso.jpg", cat: "do-uong", veg: true },
    { id: "cappuccino", name: "Cappuccino", desc: "Espresso, sữa đánh bọt mịn và bột cacao.", price: 49000, tag: "", img: IMG + "drink-cappuccino.jpg", cat: "do-uong", veg: true },
    { id: "spritz", name: "Spritz cam đắng", desc: "Cocktail rượu khai vị cam đắng, Prosecco và soda.", price: 119000, tag: "Mới", img: IMG + "drink-spritz.jpg", cat: "do-uong", veg: true },
    { id: "chianti", name: "Vang đỏ Chianti (ly)", desc: "Vang đỏ Tuscany từ nho Sangiovese, hợp món bò & pizza.", price: 145000, tag: "", img: IMG + "drink-red-wine.jpg", cat: "do-uong", veg: true },
    { id: "pinot-grigio", name: "Vang trắng Pinot Grigio (ly)", desc: "Vang trắng Veneto tươi mát, hợp hải sản và risotto.", price: 135000, tag: "", img: IMG + "drink-white-wine.jpg", cat: "do-uong", veg: true },
    { id: "prosecco", name: "Prosecco (ly)", desc: "Vang nổ Veneto, bọt mịn, hương táo xanh.", price: 135000, tag: "", img: IMG + "drink-prosecco.jpg", cat: "do-uong", veg: true },
    { id: "limoncello", name: "Limoncello", desc: "Rượu chanh vàng Amalfi ướp lạnh, dùng sau bữa ăn.", price: 95000, tag: "Chef’s Pick", img: IMG + "drink-limoncello.jpg", cat: "do-uong", veg: true },
    { id: "soda-chanh-day", name: "Soda chanh dây Ý", desc: "Siro chanh dây, soda và kem sữa kiểu Italian soda.", price: 49000, tag: "", img: IMG + "drink-soda-chanh-day.jpg", cat: "do-uong", veg: true },
    { id: "nuoc-khoang", name: "Nước khoáng có ga (chai)", desc: "Nước khoáng thiên nhiên có ga, chai 750ml.", price: 35000, tag: "", img: IMG + "drink-nuoc-khoang.jpg", cat: "do-uong", veg: true },
    { id: "latte-macchiato", name: "Latte Macchiato", desc: "Sữa tươi đánh nóng, một shot espresso tạo tầng.", price: 55000, tag: "", img: IMG + "drink-latte-macchiato.jpg", cat: "do-uong", veg: true }
  ];

  /* Thêm món (bỏ qua id đã có) – giữ nguyên mảng gốc để FB_DATA.byId vẫn hoạt động */
  more.forEach(d => { if (!D.dishes.some(x => x.id === d.id)) D.dishes.push(d); });

  /* Thứ tự theo danh mục giống Figma */
  const ORDER = ["burrata", "bruschetta", "carpaccio", "arancini", "calamari", "focaccia", "prosciutto", "polpette", "caponata", "frittata", "crostini-nam", "provola", "minestrone", "ribollita", "cacciucco", "pasta-fagioli", "pappa-pomodoro", "sup-nam-truffle", "stracciatella", "sup-hanh", "sup-bi-do", "sup-dau-lang", "tortellini-brodo", "sup-ca-chua-burrata", "lasagna", "bolognese", "carbonara", "mi-cua", "cacio-pepe", "alfredo", "vongole", "mi-tuoi", "green-spaghetti", "gnocchi", "amatriciana", "ravioli", "risotto-kem", "risotto-ga", "risotto-nero", "risotto-zafferano", "risotto-funghi", "risotto-hai-san", "risotto-bi-do", "risotto-mang-tay", "risotto-tom-hum", "risotto-bo-barolo", "risotto-pesto", "risotto-gorgonzola", "caprese", "salad-rocket", "panzanella", "salad-cam", "salad-caesar", "salad-ca-ngu", "salad-hai-san", "salad-le-gorgonzola", "salad-rau-nuong", "salad-pasta", "tagliata", "salad-dua-hau", "pizza-margherita", "pizza-pepperoni", "nui-dut-lo", "suon-cuu", "ca-hoi", "pizza-4-pho-mai", "pizza-diavola", "pizza-hai-san", "bit-tet-florentine", "ga-nuong", "tom-nuong", "calzone", "tiramisu", "cannoli", "panna-cotta", "gelato", "affogato", "banh-ricotta", "torta-caprese", "zeppole", "semifreddo", "sfogliatella", "biscotti", "tartufo", "limonata", "tra-dao", "espresso", "cappuccino", "spritz", "chianti", "pinot-grigio", "prosecco", "limoncello", "soda-chanh-day", "nuoc-khoang", "latte-macchiato"];
  D.dishes.sort((a, b) => {
    const ia = ORDER.indexOf(a.id), ib = ORDER.indexOf(b.id);
    return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
  });

  /* Số món mỗi danh mục theo dữ liệu thật (Tất cả = 96, mỗi danh mục = 12) */
  D.categories.forEach(c => {
    c.count = c.id === 'all' ? D.dishes.length : D.dishes.filter(d => d.cat === c.id).length;
  });
  D.totalDishes = D.dishes.length;
  D.PAGE_SIZE = 12;
})();
