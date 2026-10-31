/*
 * Router berbasis hash (#/pasien/p12?k=v34). Tidak butuh server khusus, jadi
 * aplikasi bisa dibuka lewat Live Server atau langsung dari file.
 *
 * Setiap halaman didaftarkan sebagai App.pages[nama] = { title, render(ctx), mount(root, ctx) }.
 * render() mengembalikan string HTML, mount() memasang event setelah HTML masuk ke DOM.
 */
(function () {
  const App = (window.App = window.App || {});
  const ui = App.ui;

  const ROUTES = [
    { path: '/masuk', page: 'login', public: true },
    { path: '/dashboard', page: 'dashboard', nav: 'dashboard' },
    { path: '/pencarian', page: 'search', perm: 'search', nav: 'search' },
    { path: '/pasien', page: 'patients', perm: 'patient.view', nav: 'patients' },
    { path: '/pasien/baru', page: 'patientForm', perm: 'patient.create', nav: 'patients' },
    { path: '/pasien/:id', page: 'patientDetail', perm: 'patient.view', nav: 'patients' },
    { path: '/pasien/:id/ubah', page: 'patientForm', perm: 'patient.edit', nav: 'patients' },
    { path: '/kunjungan', page: 'visits', perm: 'visit.view', nav: 'visits' },
    { path: '/kunjungan/baru', page: 'visitNew', perm: 'visit.create', nav: 'visits' },
    { path: '/kunjungan/:id', page: 'visitDetail', perm: 'visit.view', nav: 'visits' },
    { path: '/pengguna', page: 'users', perm: 'user.manage', nav: 'users' },
    { path: '/log', page: 'audit', perm: 'audit.view', nav: 'audit' },
  ];

  const router = (App.router = {});
  let teardown = null;

  function compile(path) {
    const keys = [];
    const re = new RegExp('^' + path.replace(/:([a-z]+)/g, (_, k) => (keys.push(k), '([^/]+)')) + '/?$');
    return { re, keys };
  }
  ROUTES.forEach((r) => Object.assign(r, compile(r.path)));

  router.parse = function () {
    const raw = location.hash.replace(/^#/, '') || '/dashboard';
    const [path, qs] = raw.split('?');
    const query = {};
    new URLSearchParams(qs || '').forEach((v, k) => (query[k] = v));
    for (const r of ROUTES) {
      const m = path.match(r.re);
      if (m) {
        const params = {};
        r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
        return { route: r, params, query, path };
      }
    }
    return { route: null, params: {}, query, path };
  };

  router.go = function (path) {
    if (location.hash === '#' + path) router.render();
    else location.hash = path;
  };
  router.href = (path) => '#' + path;

  router.render = function () {
    if (teardown) {
      try {
        teardown();
      } catch (e) {}
      teardown = null;
    }
    const ctx = router.parse();
    const user = App.auth.user();
    const root = document.getElementById('app');

    // Belum login
    if (!user) {
      if (!ctx.route || !ctx.route.public) {
        location.replace('#/masuk');
        return;
      }
      document.title = `Masuk | ${App.config.appName}`;
      root.innerHTML = App.pages.login.render(ctx);
      teardown = App.pages.login.mount(root, ctx) || null;
      window.scrollTo(0, 0);
      return;
    }
    if (ctx.route && ctx.route.public) {
      location.replace('#/dashboard');
      return;
    }

    // Kerangka aplikasi dipasang sekali, lalu hanya isi #view yang diganti
    App.layout.ensure(root);
    const view = document.getElementById('view');
    App.layout.setActive(ctx.route ? ctx.route.nav : null, ctx.route ? ctx.route.page : null);

    let page;
    if (!ctx.route) {
      page = App.pages.notFound;
    } else if (ctx.route.perm && !App.auth.can(ctx.route.perm)) {
      page = App.pages.forbidden;
    } else {
      page = App.pages[ctx.route.page];
    }
    document.title = `${page.title ? page.title(ctx) : ''} | ${App.config.appName}`;
    view.innerHTML = page.render(ctx);
    teardown = page.mount ? page.mount(view, ctx) || null : null;
    window.scrollTo(0, 0);
    const h1 = view.querySelector('h1');
    if (h1) {
      h1.setAttribute('tabindex', '-1');
    }
  };

  router.start = function () {
    window.addEventListener('hashchange', router.render);
    router.render();
  };

  /* Halaman bawaan */
  App.pages = App.pages || {};
  App.pages.notFound = {
    title: () => 'Halaman tidak ditemukan',
    render: () =>
      `<div class="mx-auto max-w-md py-16 text-center"><h1 class="text-xl font-semibold">Halaman tidak ditemukan</h1><p class="mt-2 text-sm text-ink-600">Alamat yang dibuka tidak ada. Kembali ke dashboard untuk melanjutkan.</p><a class="btn btn-primary mt-5" href="#/dashboard">Ke dashboard</a></div>`,
  };
  App.pages.forbidden = {
    title: () => 'Akses ditolak',
    render: () => {
      const u = App.auth.user();
      return `<div class="mx-auto max-w-md py-16 text-center">
        <span class="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-800">${App.icon('lock', 'size-5')}</span>
        <h1 class="mt-4 text-xl font-semibold">Halaman ini tidak tersedia untuk peran Anda</h1>
        <p class="mt-2 text-sm text-ink-600">Anda masuk sebagai ${ui.esc(App.auth.ROLES[u.role].label)}. Hak akses tiap peran diatur oleh administrator.</p>
        <a class="btn btn-primary mt-5" href="#/dashboard">Ke dashboard</a></div>`;
    },
  };
})();
