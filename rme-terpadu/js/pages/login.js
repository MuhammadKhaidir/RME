/* Halaman masuk dengan akun demo per peran. */
(function () {
  const App = (window.App = window.App || {});
  const ui = App.ui;
  App.pages = App.pages || {};

  const DEMO = [
    { u: 'dokter', p: 'dokter123', role: 'klinisi', note: 'dr. Andi Pratama, Poli Umum' },
    { u: 'daftar', p: 'daftar123', role: 'pendaftaran', note: 'Nia Anggraini' },
    { u: 'rm', p: 'rm123', role: 'rm', note: 'Wulan Anggraeni' },
    { u: 'perawat', p: 'perawat123', role: 'klinisi', note: 'Ns. Siti Aminah' },
    { u: 'admin', p: 'admin123', role: 'admin', note: 'Admin Sistem' },
  ];

  App.pages.login = {
    title: () => 'Masuk',
    render() {
      return `
      <div class="min-h-dvh lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <section class="ruled relative hidden flex-col justify-between bg-brand-800 p-12 text-white lg:flex">
          <div class="flex items-center gap-3">
            ${App.layout.mark('size-9')}
            <div class="leading-tight"><div class="font-semibold">${ui.esc(App.config.appName)}</div><div class="text-sm text-brand-200">${ui.esc(App.config.hospitalName)}</div></div>
          </div>
          <div class="max-w-md">
            <h1 class="text-4xl leading-[1.15] font-semibold tracking-tight text-balance">Satu pencarian, seluruh riwayat medis pasien.</h1>
            <ul class="mt-8 space-y-4 text-[15px] text-brand-100">
              <li class="flex gap-3">${App.icon('folder-open', 'mt-0.5 size-5 shrink-0 text-brand-300')}<span>Rawat jalan dan rawat inap tersimpan di satu basis data, tampil dalam satu garis waktu.</span></li>
              <li class="flex gap-3">${App.icon('badge-check', 'mt-0.5 size-5 shrink-0 text-brand-300')}<span>Nomor RM dibuat otomatis dan data ganda dicegah sejak pendaftaran.</span></li>
              <li class="flex gap-3">${App.icon('shield-check', 'mt-0.5 size-5 shrink-0 text-brand-300')}<span>Setiap peran hanya melihat data yang menjadi tugasnya.</span></li>
            </ul>
          </div>
          <p class="text-sm text-brand-200">Prototipe antarmuka. Semua data pasien di sini fiktif.</p>
        </section>

        <section class="flex items-center justify-center px-5 py-10 sm:px-10">
          <div class="w-full max-w-sm">
            <div class="mb-8 flex items-center gap-3 lg:hidden">${App.layout.mark('size-9')}<div class="font-semibold">${ui.esc(App.config.appName)}</div></div>
            <h2 class="text-2xl font-semibold tracking-tight">Masuk</h2>
            <p class="mt-1 text-sm text-ink-600">Gunakan akun petugas Anda.</p>

            <form id="login-form" class="mt-6 space-y-4" novalidate>
              <div id="login-error" class="hidden" aria-live="assertive"></div>
              <div>
                <label class="label" for="username">Nama pengguna</label>
                <input id="username" name="username" class="field" autocomplete="username" autocapitalize="none" spellcheck="false" required>
              </div>
              <div>
                <label class="label" for="password">Kata sandi</label>
                <div class="relative">
                  <input id="password" name="password" type="password" class="field pr-10" autocomplete="current-password" required>
                  <button type="button" data-toggle-pass class="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-ink-500 hover:text-ink-900" aria-label="Tampilkan kata sandi" aria-pressed="false">${App.icon('eye', 'size-4')}</button>
                </div>
              </div>
              <button class="btn btn-primary h-10 w-full" type="submit">Masuk</button>
            </form>

            <div class="mt-8 border-t border-ink-200 pt-6">
              <h3 class="text-sm font-medium">Akun demo</h3>
              <p class="mt-1 text-sm text-ink-600">Pilih peran untuk mengisi formulir otomatis.</p>
              <ul class="mt-3 divide-y divide-ink-100 rounded-md border border-ink-200">
                ${DEMO.map(
                  (d, i) => `<li><button type="button" data-demo="${i}" class="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-ink-50">
                    <span class="min-w-0"><span class="block text-sm font-medium">${ui.esc(App.auth.ROLES[d.role].label)}${d.u === 'perawat' ? ' (perawat)' : d.role === 'klinisi' ? ' (dokter)' : ''}</span><span class="block truncate text-xs text-ink-500">${ui.esc(d.note)}</span></span>
                    <span class="ident shrink-0 text-xs text-ink-500">${d.u}</span></button></li>`
                ).join('')}
              </ul>
            </div>
          </div>
        </section>
      </div>`;
    },
    mount(root) {
      const form = root.querySelector('#login-form');
      const err = root.querySelector('#login-error');
      const user = form.username;
      const pass = form.password;
      user.focus();

      root.querySelectorAll('[data-demo]').forEach((b) =>
        b.addEventListener('click', () => {
          const d = DEMO[Number(b.dataset.demo)];
          user.value = d.u;
          pass.value = d.p;
          err.className = 'hidden';
          form.querySelector('button[type=submit]').focus();
        })
      );

      root.querySelector('[data-toggle-pass]').addEventListener('click', (e) => {
        const b = e.currentTarget;
        const show = pass.type === 'password';
        pass.type = show ? 'text' : 'password';
        b.innerHTML = App.icon(show ? 'eye-off' : 'eye', 'size-4');
        b.setAttribute('aria-pressed', String(show));
        b.setAttribute('aria-label', show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi');
      });

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!user.value.trim() || !pass.value) {
          err.className = '';
          err.innerHTML = ui.alertBox('danger', 'Isi nama pengguna dan kata sandi.');
          return;
        }
        const res = App.auth.login(user.value, pass.value);
        if (!res.ok) {
          err.className = '';
          err.innerHTML = ui.alertBox('danger', ui.esc(res.error));
          pass.value = '';
          pass.focus();
          return;
        }
        root.dataset.user = '';
        location.hash = '#/dashboard';
        ui.toast(`Selamat datang, ${res.user.nama}.`);
      });
    },
  };
})();
