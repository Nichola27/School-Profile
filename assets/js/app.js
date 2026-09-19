/* =========================================================
   app.js — SMA Negeri 1 Nusantara
   BASE_PATH harus didefinisikan di setiap halaman sebelum
   file ini dimuat:
     index.html      -> const BASE_PATH = './';
     pages/*.html     -> const BASE_PATH = '../';
   body juga harus punya data-page, contoh:
     <body data-page="akademik">
   ========================================================= */

(function () {
  const base = typeof BASE_PATH !== 'undefined' ? BASE_PATH : './';

  function rewriteLinks(el) {
    el.querySelectorAll('[data-href]').forEach(function (node) {
      node.setAttribute('href', base + node.getAttribute('data-href'));
    });
    el.querySelectorAll('[data-src]').forEach(function (node) {
      node.setAttribute('src', base + node.getAttribute('data-src'));
    });
  }

  function markActive(el) {
    const page = document.body.getAttribute('data-page') || 'index';
    el.querySelectorAll('a[data-page-link]').forEach(function (a) {
      if (a.getAttribute('data-page-link') === page) {
        a.classList.add('is-active');
        a.setAttribute('aria-current', 'page');
      }
    });
  }

  function loadComponent(target, file) {
    return fetch(base + 'components/' + file)
      .then(function (res) {
        if (!res.ok) throw new Error('Gagal memuat ' + file);
        return res.text();
      })
      .then(function (html) {
        target.innerHTML = html;
        rewriteLinks(target);
        markActive(target);
      })
      .catch(function (err) {
        target.innerHTML = '<p style="padding:1rem 24px;color:#b3402f;">Komponen tidak dapat dimuat. Pastikan halaman dibuka lewat server lokal (mis. Live Server), bukan langsung dari file.</p>';
        console.error(err);
      });
  }

  function initNavToggle() {
    document.addEventListener('click', function (e) {
      const toggle = e.target.closest('.nav-toggle');
      if (!toggle) return;
      const nav = document.querySelector('.main-nav');
      const isOpen = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  function initStatCounters() {
    const stats = document.querySelectorAll('.stat-num[data-count]');
    if (!stats.length) return;
    let done = false;
    const run = function () {
      if (done) return;
      done = true;
      stats.forEach(function (el) {
        const target = parseInt(el.getAttribute('data-count'), 10);
        const suffix = el.getAttribute('data-suffix') || '';
        let current = 0;
        const step = Math.max(1, Math.round(target / 40));
        const timer = setInterval(function () {
          current += step;
          if (current >= target) {
            current = target;
            clearInterval(timer);
          }
          el.textContent = current + suffix;
        }, 25);
      });
    };
    const bar = document.querySelector('.stats-bar');
    if (!bar) return;
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) run();
        });
      }, { threshold: 0.4 });
      io.observe(bar);
    } else {
      run();
    }
  }

  /* ---------- BERITA: search + filter + pagination ---------- */
  function initNews() {
    const grid = document.querySelector('[data-news-grid]');
    if (!grid) return;
    const cards = Array.from(grid.querySelectorAll('.news-card'));
    const searchInput = document.querySelector('[data-news-search]');
    const chips = document.querySelectorAll('[data-news-filter]');
    const empty = document.querySelector('[data-news-empty]');
    const pageSize = 6;
    let activeCategory = 'semua';
    let query = '';
    let page = 1;

    function getFiltered() {
      return cards.filter(function (card) {
        const cat = card.getAttribute('data-category');
        const text = card.textContent.toLowerCase();
        const matchCat = activeCategory === 'semua' || cat === activeCategory;
        const matchQuery = query === '' || text.indexOf(query) !== -1;
        return matchCat && matchQuery;
      });
    }

    function renderPagination(total) {
      const wrap = document.querySelector('[data-news-pagination]');
      if (!wrap) return;
      wrap.innerHTML = '';
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      if (totalPages <= 1) return;
      for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.textContent = String(i);
        if (i === page) btn.classList.add('is-active');
        btn.addEventListener('click', function () {
          page = i;
          render();
        });
        wrap.appendChild(btn);
      }
    }

    function render() {
      const filtered = getFiltered();
      cards.forEach(function (c) { c.style.display = 'none'; });
      const start = (page - 1) * pageSize;
      const visible = filtered.slice(start, start + pageSize);
      visible.forEach(function (c) { c.style.display = ''; });
      if (empty) empty.classList.toggle('is-visible', filtered.length === 0);
      renderPagination(filtered.length);
    }

    if (searchInput) {
      searchInput.addEventListener('input', function (e) {
        query = e.target.value.trim().toLowerCase();
        page = 1;
        render();
      });
    }

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (c) { c.classList.remove('is-active'); });
        chip.classList.add('is-active');
        activeCategory = chip.getAttribute('data-news-filter');
        page = 1;
        render();
      });
    });

    grid.addEventListener('click', function (e) {
      const btn = e.target.closest('.read-more');
      if (!btn) return;
      e.preventDefault();
      btn.closest('.news-card').classList.add('is-open');
    });

    render();
  }

  /* ---------- GALERI: filter + lightbox ---------- */
  function initGallery() {
    const grid = document.querySelector('[data-gallery-grid]');
    if (!grid) return;
    const items = Array.from(grid.querySelectorAll('.gallery-item'));
    const chips = document.querySelectorAll('[data-gallery-filter]');
    const lightbox = document.querySelector('[data-lightbox]');
    const lightboxLabel = document.querySelector('[data-lightbox-label]');

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (c) { c.classList.remove('is-active'); });
        chip.classList.add('is-active');
        const cat = chip.getAttribute('data-gallery-filter');
        items.forEach(function (item) {
          const match = cat === 'semua' || item.getAttribute('data-category') === cat;
          item.style.display = match ? '' : 'none';
        });
      });
    });

    if (lightbox) {
      grid.addEventListener('click', function (e) {
        const item = e.target.closest('.gallery-item');
        if (!item) return;
        const label = item.querySelector('figcaption');
        lightboxLabel.textContent = label ? label.textContent : '';
        lightbox.classList.add('is-open');
      });
      lightbox.addEventListener('click', function (e) {
        if (e.target === lightbox || e.target.closest('[data-lightbox-close]')) {
          lightbox.classList.remove('is-open');
        }
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') lightbox.classList.remove('is-open');
      });
    }
  }

  /* ---------- FAQ ---------- */
  function initFaq() {
    document.querySelectorAll('.faq-question').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const item = btn.closest('.faq-item');
        item.classList.toggle('is-open');
      });
    });
  }

  /* ---------- FORM KONTAK ---------- */
  function initContactForm() {
    const form = document.querySelector('[data-contact-form]');
    if (!form) return;
    const status = form.querySelector('.form-status');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      let valid = true;
      form.querySelectorAll('.form-row').forEach(function (row) {
        const field = row.querySelector('input, textarea');
        if (!field) return;
        const ok = field.checkValidity();
        row.classList.toggle('has-error', !ok);
        if (!ok) valid = false;
      });
      if (!valid) {
        if (status) {
          status.textContent = 'Mohon periksa kembali data yang belum terisi dengan benar.';
          status.style.background = '#fbeceb';
          status.style.color = '#b3402f';
          status.classList.add('is-visible');
        }
        return;
      }
      if (status) {
        status.textContent = 'Pesan Anda berhasil terkirim. Kami akan membalas secepatnya.';
        status.style.background = '#eaf3ea';
        status.style.color = '#2f5233';
        status.classList.add('is-visible');
      }
      form.reset();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    const header = document.querySelector('[data-component="navbar"]');
    const footer = document.querySelector('[data-component="footer"]');
    const tasks = [];
    if (header) tasks.push(loadComponent(header, 'navbar.html'));
    if (footer) tasks.push(loadComponent(footer, 'footer.html'));

    Promise.all(tasks).then(function () {
      initNavToggle();
    });

    initStatCounters();
    initNews();
    initGallery();
    initFaq();
    initContactForm();
  });
})();