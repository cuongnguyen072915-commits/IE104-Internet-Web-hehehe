/* Dữ liệu nội dung lấy từ thiết kế Figma (Page PC). */
window.FB_DATA = (function () {
  const IMG = '../assets/template-20261120T115451Z-1-001 - Copy/template/';
  const dishes = [
    { id: 'burrata', name: 'Salad Phô Mai Burrata', desc: 'Burrata tươi, cà chua bi, dầu ô liu & húng quế.', price: 118000, tag: 'Best Seller', img: IMG + 'dish-burrata-salad.jpg', cat: 'khai-vi', veg: true },
    { id: 'lasagna', name: 'Mì Lasagna đút lò', desc: 'Nhiều lớp mì, sốt bò bằm và phô mai nướng vàng.', price: 159000, tag: 'Chef’s Pick', img: IMG + 'dish-lasagna-baking-dish.jpg', cat: 'mi-y' },
    { id: 'bolognese', name: 'Mì Ý Bò Bằm Phô Mai', desc: 'Sốt bò bằm hầm chậm 6 giờ cùng Parmigiano.', price: 139000, tag: 'Best Seller', img: IMG + 'dish-spaghetti-bolognese.jpg', cat: 'mi-y' },
    { id: 'risotto-kem', name: 'Cơm Risotto Kem Phô Mai', desc: 'Gạo Arborio, kem tươi và phô mai Grana Padano.', price: 89000, tag: '', homeTag: 'Mới', img: IMG + 'dish-cheese-cream-risotto.jpg', cat: 'risotto', veg: true },
    { id: 'risotto-ga', name: 'Cơm Risotto Gà', desc: 'Ức gà áp chảo, nấm và sốt kem thảo mộc.', price: 109000, tag: 'Chef’s Pick', img: IMG + 'dish-chicken-risotto.jpg', cat: 'risotto' },
    { id: 'carbonara', name: 'Mì Ý sốt kem Carbonara', desc: 'Guanciale, lòng đỏ trứng, Pecorino Romano.', price: 159000, tag: 'Mới', img: IMG + 'dish-crab-cream-spaghetti.jpg', cat: 'mi-y' },
    { id: 'bruschetta', name: 'Bánh mì nướng cà chua Bruschetta', short: 'Bánh mì Bruschetta', desc: 'Bánh mì Ciabatta, cà chua, tỏi, lá húng.', price: 89000, tag: 'Khai vị', img: IMG + 'dish-bruschetta.jpg', cat: 'khai-vi', veg: true },
    { id: 'caprese', name: 'Salad Caprese', desc: 'Cà chua, burrata, húng quế và dầu ô liu.', price: 109000, tag: '', img: IMG + 'dish-caprese-burrata.jpg', cat: 'salad', veg: true },
    { id: 'minestrone', name: 'Súp Minestrone', desc: 'Súp rau củ, đậu trắng và mì ống nhỏ.', price: 99000, tag: '', img: '../assets/template-20261120T115451Z-1-001 - Copy/template/dish-minestrone-soup.jpg', cat: 'sup', veg: true }
  ];
  const combos = [
    { id: 'combo-an-y', name: 'Combo Ăn “Ý”', price: 299000, desc: '2 người · Pizza, mì Ý, nước', img: '../assets/template-20261120T115451Z-1-001 - Copy/template/combo-an-y.jpg' },
    { id: 'combo-gia-dinh', name: 'Combo Gia Đình', price: 499000, desc: '4 người · 2 pizza, 2 mì, salad', img: IMG + 'combo-family.jpg' },
    { id: 'combo-dong-am', name: 'Combo Đông Ấm', price: 249000, desc: '2 người · Súp, risotto, trà', img: '../assets/template-20261120T115451Z-1-001 - Copy/template/combo-dong-am.jpg' }
  ];
  const categories = [
    { id: 'all', name: 'Tất cả', count: 42, img: IMG + 'dish-lasagna-top-view.jpg' },
    { id: 'khai-vi', name: 'Khai vị', count: 8, img: IMG + 'dish-bruschetta.jpg' },
    { id: 'sup', name: 'Súp', count: 5, img: IMG + 'dish-minestrone-soup.jpg' },
    { id: 'mi-y', name: 'Mì Ý', count: 10, img: IMG + 'dish-spaghetti-bolognese.jpg' },
    { id: 'risotto', name: 'Risotto', count: 6, img: IMG + 'risotto-funghi.jpg' },
    { id: 'salad', name: 'Salad', count: 4, img: IMG + 'salad-caesar.jpg' },
    { id: 'nuong', name: 'Món nướng', count: 5, img: IMG + 'dish-baked-pasta.jpg' },
    { id: 'trang-mieng', name: 'Tráng miệng', count: 4, img: IMG + 'dish-tiramisu.jpg' },
    { id: 'do-uong', name: 'Thức uống & Rượu', count: 9, img: IMG + 'drink-red-wine.jpg' }
  ];
  /* Mã ưu đãi (trang Khuyến mãi). Mã hết hạn dùng cho trạng thái E09. */
  const coupons = {
    FREESHIP: { label: 'FREESHIP – Miễn phí giao hàng', type: 'ship' },
    FIABESCO15: { label: 'FIABESCO15 – Giảm 15% combo gia đình', type: 'percent', value: 15 },
    PESTO20: { label: 'PESTO20 – Giảm 20% Green Spaghetti', type: 'percent', value: 20 },
    WEDPIZZA: { label: 'WEDPIZZA – Mua 1 tặng 1 pizza size M', type: 'none' },
    MONLASAGNA: { label: 'MONLASAGNA – Giảm 25.000đ Lasagna', type: 'fixed', value: 25000 },
    NEWS10: { label: 'NEWS10 – Giảm 10% lần đặt tiếp theo', type: 'percent', value: 10 },
    SUMMER10: { expired: true, expiredAt: '31/08/2026' }
  };
  return { dishes, combos, categories, coupons, byId: id => dishes.find(d => d.id === id) };
})();
