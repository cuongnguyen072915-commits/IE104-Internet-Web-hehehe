/* Blog – Luồng Blog (Lam). Dùng cho blog.html (danh sách) và blog_chi_tiet.html (chi tiết ?id=). */
document.addEventListener('fb:ready', () => {
  const { $, $$, icon: I } = FB;
  const POSTS = window.FB_BLOG || [];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const url = p => `blog_chi_tiet.html?id=${encodeURIComponent(p.id)}`;
  const two = n => String(n).padStart(2, '0');
  const page = document.body.dataset.page;

  /* ---------- Danh sách bài (iPhone 17 - 1) ---------- */
  if (page === 'blog') {
    const feat = POSTS.find(p => p.featured) || POSTS[0];
    const fa = $('#bl-featured');
    if (feat) {
      fa.href = url(feat);
      fa.setAttribute('aria-label', `Bài viết nổi bật: ${feat.title}`);
      fa.innerHTML = `<img src="${feat.img}" alt="" loading="eager"><span class="bl-featured__cap"><small>Bài viết nổi bật</small><strong>${esc(feat.title)}</strong></span>`;
    } else fa.hidden = true;

    const card = p => `<a class="bl-card reveal" href="${url(p)}"><img src="${p.img}" alt="" loading="lazy">
      <span class="bl-card__body"><small class="bl-card__tag">${esc(p.tag)}</small><strong class="bl-card__title">${esc(p.title)}</strong>
      <span class="bl-card__sub">${esc(p.sub)}</span></span><span class="bl-card__go">${I('arrow-right')}</span></a>`;
    const draw = cat => {
      const list = POSTS.filter(p => cat === 'all' || p.cat === cat);
      $('#bl-count').textContent = `${two(list.length)} bài viết`;
      $('#bl-grid').innerHTML = list.length ? list.map(card).join('')
        : `<p class="bl-empty">Chưa có bài viết trong chủ đề này. <button type="button" data-cat="all">Xem tất cả bài viết</button></p>`;
      FB.initReveal($('#bl-grid'));
    };
    document.addEventListener('click', e => {
      const b = e.target.closest('[data-cat]'); if (!b) return;
      $$('#bl-filter .chip').forEach(c => { const on = c.dataset.cat === b.dataset.cat; c.classList.toggle('is-active', on); c.setAttribute('aria-pressed', on); });
      draw(b.dataset.cat);
    });
    draw('all');
  }

  /* ---------- Chi tiết bài (iPhone 17 - 2) ---------- */
  if (page === 'blog_chi_tiet') {
    const p = POSTS.find(x => x.id === FB.params.get('id'));
    const box = $('#bl-article');
    if (!p) {
      box.innerHTML = `<div class="bl-empty bl-empty--big">${I('search')}<h1 class="t-h3">Không tìm thấy bài viết</h1><p class="t-body c-gray">Bài viết có thể đã được gỡ hoặc đường dẫn chưa đúng.</p><a class="btn btn--navy" href="blog.html">Xem tất cả bài viết</a></div>`;
      return;
    }
    document.title = `${p.title} – Fiabesco Palace`;
    const secs = p.sections || [];
    const slug = (s, i) => 'muc-' + (i + 1);
    box.innerHTML = `<header class="bl-article__head">
        <span class="bl-eyebrow">${esc(p.crumb)}</span>
        <h1 class="t-h1 bl-article__title">${esc(p.title)}</h1>
        <p class="bl-article__sub">${esc(p.sub)}</p>
        <p class="bl-article__meta">Fiabesco Palace <span aria-hidden="true">•</span> ${p.mins} phút đọc <span aria-hidden="true">•</span> ${esc(p.date)}</p>
      </header>
      <figure class="bl-article__cover"><img class="bl-article__img" src="${p.img}" alt="${esc(p.title)}"></figure>
      <div class="bl-article__body">
        ${p.lead ? `<p class="bl-lead">${esc(p.lead)}</p>` : ''}
        ${p.body.map(t => `<p>${esc(t)}</p>`).join('')}
        ${secs.map((s, i) => `<section class="bl-sec" id="${slug(s, i)}"><h2 class="bl-sec__h">${esc(s.h)}</h2>${s.p.map(t => `<p>${esc(t)}</p>`).join('')}
          ${s.img ? `<figure class="bl-fig"><img src="${s.img}" alt="${esc(s.cap || s.h)}" loading="lazy"><figcaption>${esc(s.cap || '')}</figcaption></figure>` : ''}</section>`).join('')}
        <blockquote class="bl-quote"><p>“${esc(p.quote)}”</p></blockquote>
        ${p.tips && p.tips.length ? `<aside class="bl-tips"><h2>Gợi ý thưởng thức</h2><ul>${p.tips.map(t => `<li>${I('check')}<span>${esc(t)}</span></li>`).join('')}</ul></aside>` : ''}
        ${p.editorial ? '<p class="bl-editorial">Nội dung mẫu biên tập phục vụ đồ án — mang tính chia sẻ trải nghiệm, không phải tài liệu chuyên môn.</p>' : ''}
      </div>`;
    // Mục lục (Desktop: thanh bên)
    const toc = $('#bl-toc');
    if (toc && secs.length) {
      toc.innerHTML = `<span class="bl-toc__t">Trong bài viết</span><ol>${secs.map((s, i) => `<li><a href="#${slug(s, i)}">${esc(s.h)}</a></li>`).join('')}</ol>
        <a class="btn btn--navy btn--block bl-toc__cta" href="thuc_don.html">Khám phá thực đơn ${I('arrow-right')}</a>`;
      toc.hidden = false;
      const links = $$('a[href^="#muc-"]', toc);
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) links.forEach(a => a.classList.toggle('is-on', a.getAttribute('href') === '#' + en.target.id)); }), { rootMargin: '-30% 0px -60% 0px' });
        secs.forEach((s, i) => { const el = document.getElementById(slug(s, i)); if (el) io.observe(el); });
      }
    }
    FB.hydrateIcons(document);
    // Bài liên quan: ưu tiên cùng chủ đề, đủ 2 bài
    const rel = [...POSTS.filter(x => x.id !== p.id && x.cat === p.cat), ...POSTS.filter(x => x.id !== p.id && x.cat !== p.cat)].slice(0, 3);
    if (rel.length) {
      $('#bl-related-grid').innerHTML = rel.map(r => `<a class="bl-rel" href="${url(r)}"><img src="${r.img}" alt="" loading="lazy"><strong>${esc(r.title)}</strong></a>`).join('');
      $('#bl-related').hidden = false;
    }
  }
});
