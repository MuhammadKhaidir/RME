/* Log aktivitas: siapa melihat atau mengubah data apa, dan kapan. */
(function () {
  const App = (window.App = window.App || {});
  const ui = App.ui;
  const esc = ui.esc;
  App.pages = App.pages || {};

  App.pages.audit = {
    title: () => 'Log aktivitas',
    render() {
      const aksi = Array.from(new Set(App.store.audit().map((l) => l.aksi))).sort();
      return `
      <header><h1 class="text-2xl font-semibold tracking-tight">Log aktivitas</h1>
      <p class="mt-1 max-w-2xl text-sm text-ink-600">Setiap akses ke riwayat pasien dan setiap perubahan data tercatat di sini. Log menyimpan 600 catatan terbaru.</p></header>
      <div class="mt-5 flex flex-wrap items-end gap-3">
        <div class="min-w-56 flex-1 sm:max-w-sm"><label class="label" for="lq">Saring</label><input id="lq" type="search" class="field" placeholder="Nama pengguna, pasien, atau rincian" autocomplete="off"></div>
        <div><label class="label" for="la">Jenis aksi</label><select id="la" class="field w-auto"><option value="">Semua</option>${aksi.map((a) => `<option>${esc(a)}</option>`).join('')}</select></div>
      </div>
      <div class="panel mt-4 overflow-hidden"><div class="overflow-x-auto"><table class="tbl"><thead><tr><th>Waktu</th><th>Pengguna</th><th>Aksi</th><th class="hidden md:table-cell">Rincian</th></tr></thead><tbody id="lbody"></tbody></table></div><div id="lpager"></div></div>`;
    },
    mount(root) {
      const state = { q: '', aksi: '', page: 1 };
      const tbody = root.querySelector('#lbody');
      const pager = root.querySelector('#lpager');
      const canOpen = App.auth.can('patient.view');

      function draw() {
        const q = ui.norm(state.q).trim();
        const list = App.store.audit().filter((l) => (!state.aksi || l.aksi === state.aksi) && (!q || ui.norm(`${l.nama} ${l.aksi} ${l.detail}`).includes(q)));
        const size = 15;
        const pages = Math.max(1, Math.ceil(list.length / size));
        if (state.page > pages) state.page = pages;
        const slice = list.slice((state.page - 1) * size, state.page * size);
        tbody.innerHTML = slice.length
          ? slice.map((l) => `<tr>
              <td class="whitespace-nowrap"><div>${ui.fmtDate(l.ts)}</div><div class="ident text-xs text-ink-500">${ui.fmtTime(l.ts)}</div></td>
              <td><div class="font-medium">${esc(l.nama)}</div>${l.role && l.role !== '-' ? `<div class="mt-0.5">${ui.roleBadge(l.role)}</div>` : ''}</td>
              <td>${esc(l.aksi)}<div class="mt-0.5 text-xs text-ink-500 md:hidden">${esc(l.detail)}</div></td>
              <td class="hidden md:table-cell">${l.patientId && canOpen && App.store.patient(l.patientId) ? `<a class="hover:underline" href="#/pasien/${l.patientId}">${esc(l.detail)}</a>` : esc(l.detail)}</td></tr>`).join('')
          : `<tr><td colspan="4">${ui.empty('Tidak ada catatan yang cocok', 'Ubah kata kunci atau jenis aksi.')}</td></tr>`;
        pager.innerHTML = ui.pager(list.length, state.page, size);
      }

      root.querySelector('#lq').addEventListener('input', ui.debounce((e) => { state.q = e.target.value; state.page = 1; draw(); }, 120));
      root.querySelector('#la').addEventListener('change', (e) => { state.aksi = e.target.value; state.page = 1; draw(); });
      pager.addEventListener('click', (e) => {
        const b = e.target.closest('[data-page]');
        if (b && !b.disabled) { state.page = Number(b.dataset.page); draw(); }
      });
      draw();
    },
  };
})();
