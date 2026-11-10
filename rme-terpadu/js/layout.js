/* Kerangka aplikasi: sidebar, bar atas, dan drawer untuk layar kecil. */
(function () {
  const App = (window.App = window.App || {});
  const ui = App.ui;
  const layout = (App.layout = {});

  const NAV = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', href: '#/dashboard' },
    { id: 'search', label: 'Cari riwayat', icon: 'search', href: '#/pencarian', perm: 'search' },
    { id: 'patients', label: 'Pasien', icon: 'users', href: '#/pasien', perm: 'patient.view' },
    { id: 'visits', label: 'Kunjungan', icon: 'calendar-clock', href: '#/kunjungan', perm: 'visit.view' },
    { group: 'Administrasi' },
    { id: 'users', label: 'Pengguna dan hak akses', icon: 'user-cog', href: '#/pengguna', perm: 'user.manage' },
    { id: 'audit', label: 'Log aktivitas', icon: 'scroll-text', href: '#/log', perm: 'audit.view' },
  ];

  layout.mark = function (cls) {
    return `<svg class="${cls || 'size-8'}" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="7" fill="#0f6657"/><path d="M8.5 11.5A1.5 1.5 0 0 1 10 10h4.2l2.1 2.6H22a1.5 1.5 0 0 1 1.5 1.5V21a1.5 1.5 0 0 1-1.5 1.5H10A1.5 1.5 0 0 1 8.5 21z" fill="none" stroke="#fff" stroke-width="1.7" stroke-linejoin="round"/><path d="M16 14.8v4.4M13.8 17h4.4" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/></svg>`;
  };

  function navHtml(user) {
    let out = '';
    let pendingGroup = null;
    NAV.forEach((n) => {
      if (n.group) {
        pendingGroup = n.group;
        return;
      }
      if (n.perm && !App.auth.can(n.perm)) return;
      if (pendingGroup) {
        out += `<p class="mt-5 mb-1 px-3 text-xs font-medium text-ink-500">${pendingGroup}</p>`;
        pendingGroup = null;
      }
      out += `<a href="${n.href}" data-nav="${n.id}" class="group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-100 aria-[current=page]:bg-brand-50 aria-[current=page]:text-brand-800 aria-[current=page]:before:absolute aria-[current=page]:before:-left-3 aria-[current=page]:before:top-1.5 aria-[current=page]:before:bottom-1.5 aria-[current=page]:before:w-1 aria-[current=page]:before:rounded-r aria-[current=page]:before:bg-brand-600">${App.icon(n.icon, 'size-[18px] shrink-0')}<span>${n.label}</span></a>`;
    });
    return out;
  }

  layout.ensure = function (root) {
    const user = App.auth.user();
    if (document.getElementById('view') && root.dataset.user === user.id) return;
    root.dataset.user = user.id;
    const role = App.auth.ROLES[user.role];
    root.innerHTML = `
      <a href="#view" class="sr-only z-[100] rounded-md bg-white px-3 py-2 text-sm font-medium focus:not-sr-only focus:fixed focus:top-2 focus:left-2" data-skip>Lewati ke konten</a>
      <div class="min-h-dvh lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)]">
        <aside id="sidebar" class="fixed inset-y-0 left-0 z-40 flex w-[15.5rem] -translate-x-full flex-col border-r border-ink-200 bg-white transition-transform duration-200 lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0 print:hidden" aria-label="Navigasi utama">
          <div class="flex h-14 items-center gap-2.5 border-b border-ink-200 px-5">
            ${layout.mark('size-8')}
            <div class="leading-tight"><div class="text-[15px] font-semibold">${ui.esc(App.config.appName)}</div><div class="text-xs text-ink-500">${ui.esc(App.config.hospitalName)}</div></div>
          </div>
          <nav class="flex-1 overflow-y-auto px-3 py-4" aria-label="Menu">${navHtml(user)}</nav>
          <div class="border-t border-ink-200 p-3">
            <div class="flex items-center gap-2.5 px-1 pb-3">
              ${ui.avatar(user.nama, 'size-9 text-xs')}
              <div class="min-w-0 leading-tight"><div class="truncate text-sm font-medium">${ui.esc(user.nama)}</div><div class="truncate text-xs text-ink-500">${ui.esc(role.label)}</div></div>
            </div>
            <div class="flex gap-2">
              <button class="btn btn-secondary btn-sm flex-1" data-logout>${App.icon('log-out', 'size-4')}Keluar</button>
              ${App.auth.can('user.manage') ? `<button class="btn btn-quiet btn-sm" data-reset title="Buat ulang data contoh">${App.icon('rotate-ccw', 'size-4')}<span class="sr-only">Reset data demo</span></button>` : ''}
            </div>
          </div>
        </aside>
        <div id="scrim" class="fixed inset-0 z-30 hidden bg-ink-900/40 lg:hidden"></div>
        <div class="flex min-w-0 flex-col">
          <header class="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-ink-200 bg-white/95 px-4 backdrop-blur lg:px-8 print:hidden">
            <button class="btn btn-quiet btn-icon -ml-2 lg:hidden" data-menu aria-label="Buka menu" aria-expanded="false" aria-controls="sidebar">${App.icon('menu', 'size-5')}</button>
            ${
              App.auth.can('search')
                ? `<form id="topsearch" class="relative w-full max-w-md" role="search" action="#/pencarian">
                    <label for="topq" class="sr-only">Cari pasien atau diagnosis</label>
                    <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-400">${App.icon('search', 'size-4')}</span>
                    <input id="topq" name="q" type="search" autocomplete="off" placeholder="Cari nama, No. RM, atau diagnosis" class="field h-9 bg-ink-50 pr-9 pl-9">
                    <kbd class="pointer-events-none absolute inset-y-0 right-2.5 my-auto hidden h-5 items-center rounded border border-ink-300 bg-white px-1.5 text-[11px] text-ink-500 sm:inline-flex">/</kbd>
                  </form>`
                : '<div class="flex-1"></div>'
            }
            <div class="ml-auto hidden text-sm text-ink-500 md:block" data-today></div>
          </header>
          <main id="view" class="w-full max-w-[1240px] px-4 py-6 outline-none lg:px-8 lg:py-8"></main>
        </div>
      </div>`;
    root.querySelector('[data-today]').textContent = ui.fmtDateLong(new Date());
    bind(root);
  };

  function bind(root) {
    const sidebar = root.querySelector('#sidebar');
    const scrim = root.querySelector('#scrim');
    const menuBtn = root.querySelector('[data-menu]');
    function setDrawer(open) {
      sidebar.classList.toggle('-translate-x-full', !open);
      scrim.classList.toggle('hidden', !open);
      menuBtn.setAttribute('aria-expanded', String(open));
    }
    menuBtn.addEventListener('click', () => setDrawer(sidebar.classList.contains('-translate-x-full')));
    scrim.addEventListener('click', () => setDrawer(false));
    sidebar.addEventListener('click', (e) => {
      if (e.target.closest('a[data-nav]')) setDrawer(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setDrawer(false);
    });

    root.querySelector('[data-skip]').addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('view').focus();
    });

    root.querySelector('[data-logout]').addEventListener('click', () => {
      App.auth.logout();
      root.dataset.user = '';
      location.hash = '#/masuk';
      ui.toast('Anda sudah keluar.');
    });

    const resetBtn = root.querySelector('[data-reset]');
    if (resetBtn)
      resetBtn.addEventListener('click', async () => {
        const ok = await ui.confirm({
          title: 'Reset data demo?',
          message: 'Semua perubahan (pasien, kunjungan, pengguna, log) akan dihapus dan diganti dengan data contoh baru.',
          confirmText: 'Reset data',
          danger: true,
        });
        if (!ok) return;
        App.store.reset();
        App.auth.refresh();
        ui.toast('Data demo dibuat ulang.');
        App.router.go('/dashboard');
      });

    const top = root.querySelector('#topsearch');
    if (top)
      top.addEventListener('submit', (e) => {
        e.preventDefault();
        const q = top.q.value.trim();
        App.router.go('/pencarian' + (q ? '?q=' + encodeURIComponent(q) : ''));
        top.q.value = '';
      });
  }

  /* Pintasan "/" untuk langsung mencari dari halaman mana pun */
  document.addEventListener('keydown', (e) => {
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return;
    if (!App.auth.can('search')) return;
    const el = document.getElementById('q') || document.getElementById('topq');
    if (el) {
      e.preventDefault();
      el.focus();
      el.select && el.select();
    }
  });

  layout.setActive = function (navId, pageId) {
    document.querySelectorAll('#sidebar a[data-nav]').forEach((a) => {
      if (a.dataset.nav === navId) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    const top = document.getElementById('topsearch');
    if (top) top.classList.toggle('invisible', pageId === 'search');
  };
})();
