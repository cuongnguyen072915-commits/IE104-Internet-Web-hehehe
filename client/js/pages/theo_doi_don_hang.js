/* Theo dõi đơn: dữ liệu đơn vừa đặt, đếm ngược, tài xế di chuyển trên bản đồ */
document.addEventListener('fb:ready', () => {
  const { $, money, vnd } = FB;
  let o; try { o = JSON.parse(sessionStorage.getItem('fb_order')); } catch (e) {}
  const items = o ? o.items : [{ id: 'lasagna', qty: 1, unit: 184000 }, { id: 'burrata', qty: 2, unit: 118000 }, { id: 'risotto-kem', qty: 1, unit: 89000 }];
  $('#lines').innerHTML = items.map(it => { const d = FB_DATA.byId(it.id) || {}; return `<div class="line-item"><img src="${d.img}" alt=""><div class="stack"><strong style="font:600 15px/1.4 var(--f-sans)">${d.name}</strong><span class="t-caption c-gray">× ${it.qty}</span></div><span class="price">${vnd(it.qty * it.unit)}</span></div>`; }).join('');
  if (o) {
    const first = (o.name || 'Minh Anh').split(' ').slice(-2).join(' ');
    $('#thanks').textContent = `Cảm ơn bạn, ${first}!`;
    $('#order-meta').textContent = `Mã đơn #FB2611-0248 · ${o.pay === 'Tiền mặt' ? 'Thanh toán khi nhận hàng' : 'Đã thanh toán qua ' + o.pay} · ${money(o.total)}`;
    // o.addr: "Số nhà và tên đường, Phường/Xã, Tỉnh/Thành phố"; khu vực cũ (nếu có) hiển thị tách riêng.
    const to = $('#to');
    to.textContent = (o.addr || '68 Lê Lợi, Q.1') + (o.apt ? ' · ' + o.apt : '');
    if (o.deliveryArea && o.deliveryArea.name) {
      const area = document.createElement('small');
      area.className = 't-caption c-gray'; area.style.display = 'block';
      area.textContent = 'Khu vực giao hàng: ' + o.deliveryArea.name;
      to.appendChild(area);
    }
    $('#who').textContent = `${first} · ${o.phone}`;
    $('#sub').textContent = money(o.sub); $('#fee').textContent = money(o.fee); $('#disc').textContent = '−' + money(Math.max(0, o.disc)); $('#total').textContent = money(o.total);
  }
  // Đếm ngược thời gian giao (14 phút như thiết kế)
  const etaAt = new Date(Date.now() + 14 * 60000);
  const hm = d => String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  $('#eta').textContent = hm(etaAt); $('#t4').textContent = 'Dự kiến ' + hm(etaAt);
  const tick = () => { const m = Math.max(0, Math.ceil((etaAt - Date.now()) / 60000)); $('#eta-left').textContent = m ? `còn khoảng ${m} phút` : 'tài xế đang tới cửa'; };
  tick(); setInterval(tick, 15000);

  // Tài xế chạy theo tuyến trên bản đồ (toạ độ theo delivery-route-map.svg 776×380)
  const route = [[120, 230], [120, 155], [365, 155], [365, 265], [540, 265]];
  const len = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
  const total = route.slice(1).reduce((s, p, i) => s + len(route[i], p), 0);
  let dist = 255; // đã đi tới vị trí như thiết kế (300,155)
  const rider = $('#rider');
  const place = () => {
    let d = dist, i = 0; while (i < route.length - 2 && d > len(route[i], route[i + 1])) { d -= len(route[i], route[i + 1]); i++; }
    const a = route[i], b = route[i + 1], t = Math.min(1, d / len(a, b));
    rider.style.left = ((a[0] + (b[0] - a[0]) * t) / 776 * 100) + '%'; rider.style.top = ((a[1] + (b[1] - a[1]) * t) / 380 * 100) + '%';
  };
  place(); setInterval(() => { dist = Math.min(total, dist + 6); place(); }, 1000);
});
