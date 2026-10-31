/* Daftar pasien: menelusuri semua pasien terdaftar. */
(function () {
  const App = (window.App = window.App || {});
  const ui = App.ui;
  const esc = ui.esc;
  App.pages = App.pages || {};

  App.pages.patients = {
    title: () => 'Pasien',
    render() {
      return `
      <header class="flex flex-wrap items-end justify-between gap-4">
        <div><h1 class="text-2xl font-semibold tracking-tight">Pasien</h1>
        <p class="mt-1 text-sm text-ink-600">Semua pasien yang terdaftar. Untuk mencari lewat diagnosis atau tindakan, pakai <a class="font-medium text-brand-700 hover:underline" href="#/pencarian">Cari riwayat</a>.</p></div>
        ${App.auth.can('patient.create') ? `<a class="btn btn-primary" href="#/pasien/baru">${App.icon('user-plus', 'size-4')}Pasien baru</a>` : ''}
      </header>

      <div class="mt-5 flex flex-wrap items-end gap-3">
        <div class="min-w-56 flex-1 sm:max-w-sm"><label class="label" for="f-q">Saring daftar</label>
          <input id="f-q" class="field" type="search" placeholder="Nama atau No. RM" autocomplete="off"></div>
        <div><label class="label" for="f-penjamin">Penjamin</label>
          <select id="f-penjamin" class="field w-auto"><option value="">Semua</option>${App.config.penjamin.map((x) => `<option>${esc(x)}</option>`).join('')}</select></div>
        <div><label class="label" for="f-sort">Urutkan</label>
          <select id="f-sort" class="field w-auto"><option value="last">Kunjungan terakhir</option><option value="nama">Nama A-Z</option><option value="rm">No. RM</option><option value="baru">Terbaru didaftarkan</option></select></div>
      </div>

      <div class="panel mt-4 overflow-hidden"><div class="overflow-x-auto"><table class="tbl" id="tbl">
        <thead><tr><th class="w-32">No. RM</th><th>Pasien</th><th class="hidden md:table-cell">Usia</th><th class="hidden lg:table-cell">Penjamin</th><th class="hidden sm:table-cell">Kunjungan terakhir</th><th class="w-10"><span class="sr-only">Buka</span></th></tr></thead>
        <tbody id="tbody"></tbody></table></div><div id="pager"></div></div>`;
    },
    mount(root) {
      const state = { q: '', penjamin: '', sort: 'last', page: 1 };
      const vmap = App.store.visitsByPatient();
      const tbody = root.querySelector('#tbody');
      const pager = root.querySelector('#pager');

      function rows() {
        const q = ui.norm(state.q).trim();
        const qd = q.replace(/\D/g, '');
        let list = App.store.patients().filter((p) => {
          if (state.penjamin && p.penjamin !== state.penjamin) return false;
          if (!q) return true;
          return ui.norm(p.nama).includes(q) || (qd.length >= 2 && App.store.rmDigits(p.noRM).includes(qd));
        });
        const last = (p) => (vmap.get(p.id) || [])[0];
        list = list.slice();
        if (state.sort === 'nama') list.sort((a, b) => a.nama.localeCompare(b.nama, 'id'));
        else if (state.sort === 'rm') list.sort((a, b) => App.store.rmDigits(a.noRM).localeCompare(App.store.rmDigits(b.noRM)));
        else if (state.sort === 'baru') list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
        else list.sort((a, b) => ((last(b) ? last(b).tglMasuk : '') > (last(a) ? last(a).tglMasuk : '') ? 1 : -1));
        return list;
      }

      function draw() {
        const list = rows();
        const size = App.config.pageSize;
        const pages = Math.max(1, Math.ceil(list.length / size));
        if (state.page > pages) state.page = pages;
        const slice = list.slice((state.page - 1) * size, state.page * size);
        if (!slice.length) {
          tbody.innerHTML = `<tr><td colspan="6">${ui.empty('Tidak ada pasien yang cocok', 'Ubah kata kunci atau filter penjamin.')}</td></tr>`;
        } else {
          tbody.innerHTML = slice
            .map((p) => {
              const l = (vmap.get(p.id) || [])[0];
              const adm = App.store.activeAdmission(p.id);
              return `<tr class="row-link" data-href="#/pasien/${p.id}">
                <td class="ident whitespace-nowrap">${esc(p.noRM)}</td>
                <td><a href="#/pasien/${p.id}" class="font-medium hover:underline">${esc(p.nama)}</a>${adm ? ` <span class="badge ml-1 bg-violet-100 text-violet-800">Dirawat</span>` : ''}<div class="text-xs text-ink-500 md:hidden">${esc(App.views.patientHeadline(p))}</div></td>
                <td class="hidden whitespace-nowrap md:table-cell">${esc(App.views.patientHeadline(p))}</td>
                <td class="hidden lg:table-cell">${esc(p.penjamin)}</td>
                <td class="hidden sm:table-cell">${l ? `<div>${ui.fmtDate(l.tglMasuk)}</div><div class="text-xs text-ink-500">${esc(l.diagnosis[0] ? l.diagnosis[0].nama : l.keluhan)}</div>` : '<span class="text-ink-400">Belum ada</span>'}</td>
                <td class="text-ink-400">${App.icon('chevron-right', 'size-4')}</td></tr>`;
            })
            .join('');
        }
        pager.innerHTML = ui.pager(list.length, state.page, size);
      }

      root.querySelector('#f-q').addEventListener('input', ui.debounce((e) => { state.q = e.target.value; state.page = 1; draw(); }, 120));
      root.querySelector('#f-penjamin').addEventListener('change', (e) => { state.penjamin = e.target.value; state.page = 1; draw(); });
      root.querySelector('#f-sort').addEventListener('change', (e) => { state.sort = e.target.value; state.page = 1; draw(); });
      pager.addEventListener('click', (e) => {
        const b = e.target.closest('[data-page]');
        if (b && !b.disabled) { state.page = Number(b.dataset.page); draw(); root.querySelector('#tbl').scrollIntoView({ block: 'nearest' }); }
      });
      tbody.addEventListener('click', (e) => {
        const tr = e.target.closest('tr[data-href]');
        if (tr && !e.target.closest('a')) location.hash = tr.dataset.href;
      });
      draw();
    },
  };
})();
