/* Pengguna dan hak akses (administrator). */
(function () {
  const App = (window.App = window.App || {});
  const ui = App.ui;
  const esc = ui.esc;
  App.pages = App.pages || {};

  function matrix() {
    const roles = Object.keys(App.auth.ROLES);
    return `<section class="panel mt-8 overflow-hidden" aria-labelledby="h-matrix">
      <div class="panel-head"><div><h2 id="h-matrix" class="text-sm font-semibold">Hak akses per peran</h2><p class="mt-0.5 text-xs text-ink-500">Aturan ini dipakai oleh menu, tombol, dan penjaga halaman di seluruh aplikasi.</p></div></div>
      <div class="overflow-x-auto"><table class="tbl">
        <thead><tr><th>Hak akses</th>${roles.map((r) => `<th class="text-center">${esc(App.auth.ROLES[r].label)}</th>`).join('')}</tr></thead>
        <tbody>${App.auth.PERMS.map(
          (p) => `<tr><td>${esc(p.label)}</td>${roles
            .map((r) => `<td class="text-center">${p.roles.includes(r) ? `<span class="inline-flex text-brand-700">${App.icon('check', 'size-4')}<span class="sr-only">Boleh</span></span>` : `<span class="inline-flex text-ink-300">${App.icon('minus', 'size-4')}<span class="sr-only">Tidak boleh</span></span>`}</td>`)
            .join('')}</tr>`
        ).join('')}</tbody></table></div></section>`;
  }

  function formHtml(u) {
    const d = u || { nama: '', username: '', role: 'pendaftaran', profesi: 'Dokter', spesialis: 'Poli Umum', aktif: true };
    return `<form id="uf" class="p-5" novalidate>
      <h2 class="text-base font-semibold">${u ? 'Ubah pengguna' : 'Tambah pengguna'}</h2>
      <div class="mt-4 space-y-4">
        <div><label class="label" for="u-nama">Nama lengkap</label><input id="u-nama" class="field" value="${esc(d.nama)}" autocomplete="off"><p class="err hidden" id="err-u-nama" role="alert"></p></div>
        <div class="grid gap-4 sm:grid-cols-2">
          <div><label class="label" for="u-username">Nama pengguna</label><input id="u-username" class="field ident" value="${esc(d.username)}" autocomplete="off" autocapitalize="none" spellcheck="false"><p class="err hidden" id="err-u-username" role="alert"></p></div>
          <div><label class="label" for="u-pass">Kata sandi</label><input id="u-pass" type="password" class="field" autocomplete="new-password" placeholder="${u ? 'Kosongkan bila tidak diubah' : 'Minimal 6 karakter'}"><p class="err hidden" id="err-u-pass" role="alert"></p></div>
        </div>
        <div><label class="label" for="u-role">Peran</label><select id="u-role" class="field">${Object.entries(App.auth.ROLES).map(([k, r]) => `<option value="${k}" ${k === d.role ? 'selected' : ''}>${esc(r.label)}</option>`).join('')}</select></div>
        <div id="u-klinisi" class="grid gap-4 sm:grid-cols-2">
          <div><label class="label" for="u-profesi">Profesi</label><select id="u-profesi" class="field"><option ${d.profesi === 'Dokter' ? 'selected' : ''}>Dokter</option><option ${d.profesi === 'Perawat' ? 'selected' : ''}>Perawat</option></select></div>
          <div id="u-spes-wrap"><label class="label" for="u-spes">Poli</label><select id="u-spes" class="field">${App.config.poli.map((x) => `<option ${x === d.spesialis ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></div>
        </div>
      </div>
      <div class="mt-6 flex justify-end gap-2"><button type="button" class="btn btn-secondary" data-close>Batal</button><button class="btn btn-primary" type="submit">${u ? 'Simpan perubahan' : 'Tambah pengguna'}</button></div>
    </form>`;
  }

  App.pages.users = {
    title: () => 'Pengguna dan hak akses',
    render() {
      return `
      <header class="flex flex-wrap items-end justify-between gap-4">
        <div><h1 class="text-2xl font-semibold tracking-tight">Pengguna dan hak akses</h1><p class="mt-1 text-sm text-ink-600">Atur siapa yang bisa masuk dan apa yang boleh mereka lakukan.</p></div>
        <button class="btn btn-primary" data-add>${App.icon('user-plus', 'size-4')}Tambah pengguna</button>
      </header>
      <div class="panel mt-5 overflow-hidden"><div class="overflow-x-auto"><table class="tbl" id="ut">
        <thead><tr><th>Pengguna</th><th>Peran</th><th class="hidden md:table-cell">Unit</th><th>Aktif</th><th class="w-24"><span class="sr-only">Aksi</span></th></tr></thead><tbody id="ubody"></tbody></table></div></div>
      ${matrix()}`;
    },
    mount(root) {
      const me = App.auth.user();
      const tbody = root.querySelector('#ubody');

      function draw() {
        tbody.innerHTML = App.store.users().map((u) => `<tr>
          <td><div class="flex items-center gap-3">${ui.avatar(u.nama, 'size-8 text-xs')}<div class="min-w-0"><div class="font-medium">${esc(u.nama)}${u.id === me.id ? ' <span class="text-xs font-normal text-ink-500">(Anda)</span>' : ''}</div><div class="ident text-xs text-ink-500">${esc(u.username)}</div></div></div></td>
          <td>${ui.roleBadge(u.role)}</td>
          <td class="hidden md:table-cell">${u.role === 'klinisi' ? esc(u.profesi + (u.spesialis ? ', ' + u.spesialis : '')) : '<span class="text-ink-400">-</span>'}</td>
          <td><button type="button" role="switch" aria-checked="${u.aktif}" data-toggle="${u.id}" ${u.id === me.id ? 'disabled title="Anda tidak bisa menonaktifkan akun sendiri"' : ''} class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full bg-ink-300 transition-colors aria-checked:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"><span class="sr-only">Akun ${esc(u.nama)} aktif</span><span class="pointer-events-none absolute left-0.5 size-4 rounded-full bg-white shadow transition-transform ${u.aktif ? 'translate-x-4' : ''}"></span></button></td>
          <td class="text-right"><button class="btn btn-quiet btn-sm" data-edit="${u.id}">${App.icon('pencil', 'size-3.5')}Ubah</button></td></tr>`).join('');
      }

      function openForm(u) {
        const dlg = ui.dialog(formHtml(u), { width: '34rem' });
        const $ = (id) => dlg.querySelector('#' + id);
        const form = dlg.querySelector('#uf');
        const self = u && u.id === me.id;
        if (self) $('u-role').disabled = true;
        function sync() {
          const k = $('u-role').value === 'klinisi';
          $('u-klinisi').classList.toggle('hidden', !k);
          $('u-spes-wrap').classList.toggle('hidden', !k || $('u-profesi').value !== 'Dokter');
        }
        $('u-role').addEventListener('change', sync);
        $('u-profesi').addEventListener('change', sync);
        sync();
        $('u-nama').focus();
        const setErr = (id, m) => {
          const e = $('err-' + id);
          e.textContent = m || '';
          e.classList.toggle('hidden', !m);
          m ? $(id).setAttribute('aria-invalid', 'true') : $(id).removeAttribute('aria-invalid');
          return !!m;
        };
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const nama = $('u-nama').value.trim();
          const username = $('u-username').value.trim().toLowerCase();
          const pass = $('u-pass').value;
          let bad = false;
          bad = setErr('u-nama', nama.length < 3 ? 'Nama wajib diisi.' : '') || bad;
          const taken = App.store.users().some((x) => x.username === username && (!u || x.id !== u.id));
          bad = setErr('u-username', !/^[a-z0-9._-]{3,}$/.test(username) ? 'Minimal 3 karakter: huruf kecil, angka, titik, atau garis bawah.' : taken ? 'Nama pengguna ini sudah dipakai.' : '') || bad;
          bad = setErr('u-pass', (!u && pass.length < 6) || (u && pass && pass.length < 6) ? 'Kata sandi minimal 6 karakter.' : '') || bad;
          if (bad) return form.querySelector('[aria-invalid=true]').focus();
          const role = self ? u.role : $('u-role').value;
          const klinisi = role === 'klinisi';
          const profesi = klinisi ? $('u-profesi').value : '';
          const data = { nama, username, role, profesi, spesialis: klinisi && profesi === 'Dokter' ? $('u-spes').value : '' };
          if (pass) data.password = pass;
          if (u) {
            App.store.updateUser(u.id, data);
            App.auth.refresh();
            ui.toast('Perubahan disimpan.');
          } else {
            App.store.addUser(data);
            ui.toast(`Pengguna ${nama} ditambahkan.`);
          }
          dlg.close();
          draw();
        });
      }

      tbody.addEventListener('click', (e) => {
        const t = e.target.closest('[data-toggle]');
        if (t && !t.disabled) {
          const u = App.store.user(t.dataset.toggle);
          App.store.updateUser(u.id, { aktif: !u.aktif });
          ui.toast(`${u.nama} ${u.aktif ? 'diaktifkan' : 'dinonaktifkan'}.`);
          draw();
          return;
        }
        const ed = e.target.closest('[data-edit]');
        if (ed) openForm(App.store.user(ed.dataset.edit));
      });
      root.querySelector('[data-add]').addEventListener('click', () => openForm(null));
      draw();
    },
  };
})();
