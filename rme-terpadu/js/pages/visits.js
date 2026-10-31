/* Daftar kunjungan (rawat jalan dan rawat inap) dan pendaftaran kunjungan baru. */
(function () {
  const App = (window.App = window.App || {});
  const ui = App.ui;
  const esc = ui.esc;
  App.pages = App.pages || {};

  /* ---------- Daftar ---------- */
  App.pages.visits = {
    title: () => 'Kunjungan',
    render() {
      const user = App.auth.user();
      const isDokter = user.role === 'klinisi' && user.profesi === 'Dokter';
      return `
      <header class="flex flex-wrap items-end justify-between gap-4">
        <div><h1 class="text-2xl font-semibold tracking-tight">Kunjungan</h1>
        <p class="mt-1 text-sm text-ink-600">Rawat jalan dan rawat inap dalam satu daftar.</p></div>
        ${App.auth.can('visit.create') ? `<a class="btn btn-primary" href="#/kunjungan/baru">${App.icon('plus', 'size-4')}Kunjungan baru</a>` : ''}
      </header>

      <div class="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div class="inline-flex rounded-md border border-ink-300 bg-white p-0.5" role="group" aria-label="Rentang" id="tabs">
          ${[['today', 'Hari ini'], ['ri', 'Rawat inap aktif'], ['all', 'Semua']].map(([v, l], i) => `<button type="button" data-tab="${v}" aria-pressed="${i === 0}" class="rounded px-3 py-1.5 text-sm text-ink-700 hover:bg-ink-100 aria-pressed:bg-brand-600 aria-pressed:text-white">${l}</button>`).join('')}
        </div>
        ${isDokter ? `<label class="inline-flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" id="mine" class="size-4 accent-brand-600" checked>Hanya pasien saya</label>` : ''}
      </div>

      <div class="mt-4 flex flex-wrap items-end gap-3">
        <div class="min-w-56 flex-1 sm:max-w-sm"><label class="label" for="vq">Saring</label><input id="vq" type="search" class="field" placeholder="Nama pasien, No. RM, atau dokter" autocomplete="off"></div>
        <div><label class="label" for="vjenis">Layanan</label><select id="vjenis" class="field w-auto"><option value="">Semua</option><option value="RJ">Rawat jalan</option><option value="RI">Rawat inap</option></select></div>
        <div><label class="label" for="vstatus">Status</label><select id="vstatus" class="field w-auto"><option value="">Semua</option>${['Terdaftar', 'Diperiksa', 'Selesai', 'Dirawat', 'Pulang'].map((s) => `<option>${s}</option>`).join('')}</select></div>
      </div>

      <div class="panel mt-4 overflow-hidden"><div class="overflow-x-auto"><table class="tbl" id="vt">
        <thead><tr><th>Waktu</th><th>Pasien</th><th class="hidden md:table-cell">Layanan</th><th class="hidden lg:table-cell">Dokter</th><th>Status</th><th class="w-10"><span class="sr-only">Buka</span></th></tr></thead>
        <tbody id="vbody"></tbody></table></div><div id="vpager"></div></div>`;
    },
    mount(root) {
      const user = App.auth.user();
      const state = { tab: 'today', q: '', jenis: '', status: '', page: 1, mine: user.role === 'klinisi' && user.profesi === 'Dokter' };
      const tbody = root.querySelector('#vbody');
      const pager = root.querySelector('#vpager');
      const todayStr = ui.toDateStr(new Date());
      const pmap = new Map(App.store.patients().map((p) => [p.id, p]));

      function filtered() {
        const q = ui.norm(state.q).trim();
        const qd = q.replace(/\D/g, '');
        return App.store.sortedVisits().filter((v) => {
          if (state.tab === 'today' && v.tglMasuk.slice(0, 10) !== todayStr) return false;
          if (state.tab === 'ri' && !(v.jenis === 'RI' && v.status === 'Dirawat')) return false;
          if (state.jenis && v.jenis !== state.jenis) return false;
          if (state.status && v.status !== state.status) return false;
          if (state.mine && v.dokterId !== user.id) return false;
          if (q) {
            const p = pmap.get(v.patientId);
            const hay = ui.norm(p.nama + ' ' + App.views.userName(v.dokterId));
            if (!(hay.includes(q) || (qd.length >= 2 && App.store.rmDigits(p.noRM).includes(qd)) || ui.norm(v.nomor).includes(q))) return false;
          }
          return true;
        });
      }

      function draw() {
        const list = filtered();
        const size = App.config.pageSize + 3;
        const pages = Math.max(1, Math.ceil(list.length / size));
        if (state.page > pages) state.page = pages;
        const slice = list.slice((state.page - 1) * size, state.page * size);
        if (!slice.length) {
          tbody.innerHTML = `<tr><td colspan="6">${ui.empty(state.tab === 'today' ? 'Belum ada kunjungan hari ini' : 'Tidak ada kunjungan yang cocok', 'Ubah filter, atau lihat tab “Semua”.', App.auth.can('visit.create') && state.tab === 'today' ? `<a class="btn btn-primary" href="#/kunjungan/baru">Daftarkan kunjungan</a>` : '')}</td></tr>`;
        } else {
          tbody.innerHTML = slice
            .map((v) => {
              const p = pmap.get(v.patientId);
              const sameDay = v.tglMasuk.slice(0, 10) === todayStr;
              return `<tr class="row-link" data-href="#/kunjungan/${v.id}">
                <td class="whitespace-nowrap"><div class="ident">${ui.fmtTime(v.tglMasuk)}</div><div class="text-xs text-ink-500">${sameDay ? 'Hari ini' : ui.fmtDate(v.tglMasuk)}</div></td>
                <td><a href="#/kunjungan/${v.id}" class="font-medium hover:underline">${esc(p.nama)}</a><div class="ident text-xs text-ink-500">${esc(p.noRM)}<span class="ml-2 text-ink-400">${esc(v.nomor)}</span></div></td>
                <td class="hidden md:table-cell">${ui.jenisBadge(v.jenis)}<div class="mt-1 text-xs text-ink-600">${esc(App.views.layananText(v))}</div></td>
                <td class="hidden lg:table-cell">${esc(App.views.userName(v.dokterId))}</td>
                <td>${ui.statusBadge(v.status)}</td>
                <td class="text-ink-400">${App.icon('chevron-right', 'size-4')}</td></tr>`;
            })
            .join('');
        }
        pager.innerHTML = ui.pager(list.length, state.page, size);
      }

      root.querySelector('#tabs').addEventListener('click', (e) => {
        const b = e.target.closest('[data-tab]');
        if (!b) return;
        state.tab = b.dataset.tab;
        state.page = 1;
        root.querySelectorAll('#tabs [data-tab]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        draw();
      });
      const mine = root.querySelector('#mine');
      if (mine) mine.addEventListener('change', () => { state.mine = mine.checked; state.page = 1; draw(); });
      root.querySelector('#vq').addEventListener('input', ui.debounce((e) => { state.q = e.target.value; state.page = 1; draw(); }, 120));
      root.querySelector('#vjenis').addEventListener('change', (e) => { state.jenis = e.target.value; state.page = 1; draw(); });
      root.querySelector('#vstatus').addEventListener('change', (e) => { state.status = e.target.value; state.page = 1; draw(); });
      pager.addEventListener('click', (e) => {
        const b = e.target.closest('[data-page]');
        if (b && !b.disabled) { state.page = Number(b.dataset.page); draw(); }
      });
      tbody.addEventListener('click', (e) => {
        const tr = e.target.closest('tr[data-href]');
        if (tr && !e.target.closest('a')) location.hash = tr.dataset.href;
      });
      draw();
    },
  };

  /* ---------- Kunjungan baru ---------- */
  App.pages.visitNew = {
    title: () => 'Kunjungan baru',
    render(ctx) {
      return `
      <div><a href="#/kunjungan" class="inline-flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-900">${App.icon('arrow-left', 'size-4')}Daftar kunjungan</a></div>
      <header class="mt-3 max-w-3xl"><h1 class="text-2xl font-semibold tracking-tight">Daftarkan kunjungan</h1>
      <p class="mt-1 text-sm text-ink-600">Pilih pasien yang sudah terdaftar, lalu tentukan layanan. Pasien baru perlu <a class="font-medium text-brand-700 hover:underline" href="#/pasien/baru">didaftarkan dulu</a>.</p></header>

      <div class="mt-6 max-w-3xl space-y-6">
        <section class="panel" aria-labelledby="s-pasien">
          <div class="panel-head"><h2 id="s-pasien" class="text-sm font-semibold">1. Pasien</h2></div>
          <div class="p-4">
            <div id="picked" class="hidden"></div>
            <div id="picker">
              <label class="label" for="pq">Cari pasien</label>
              <div class="relative">
                <input id="pq" class="field" type="search" placeholder="Nama atau No. RM" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="plist" aria-autocomplete="list">
                <ul id="plist" role="listbox" class="absolute z-10 mt-1 hidden max-h-72 w-full overflow-auto rounded-md border border-ink-200 bg-white py-1 shadow-lg"></ul>
              </div>
              <p class="hint">Ketik minimal 2 huruf atau 3 angka No. RM.</p>
            </div>
          </div>
        </section>

        <form id="vf" class="panel hidden" aria-labelledby="s-layanan" novalidate>
          <div class="panel-head"><h2 id="s-layanan" class="text-sm font-semibold">2. Layanan</h2></div>
          <div class="grid gap-x-5 gap-y-4 p-4 sm:grid-cols-2">
            <fieldset class="sm:col-span-2"><legend class="label">Jenis layanan</legend>
              <div class="grid gap-3 sm:grid-cols-2">
                ${[['RJ', 'Rawat jalan', 'Berobat di poli, pulang di hari yang sama.', 'stethoscope'], ['RI', 'Rawat inap', 'Dirawat di ruang rawat selama beberapa hari.', 'bed']]
                  .map(([v, l, d, ic], i) => `<label class="cursor-pointer"><input type="radio" name="jenis" value="${v}" class="peer sr-only" ${i === 0 ? 'checked' : ''}>
                    <span class="flex items-start gap-3 rounded-md border border-ink-300 bg-white p-3 hover:border-ink-400 peer-checked:border-brand-600 peer-checked:bg-brand-50 peer-checked:outline-2 peer-checked:outline-brand-600/30 peer-focus-visible:outline-2 peer-focus-visible:outline-brand-500">${App.icon(ic, 'mt-0.5 size-5 text-brand-700')}<span><span class="block text-sm font-medium">${l}</span><span class="block text-xs text-ink-600">${d}</span></span></span></label>`)
                  .join('')}
              </div>
            </fieldset>

            <div data-rj><label class="label" for="poli">Poli <span class="text-rose-700" aria-hidden="true">*</span></label><select id="poli" class="field">${App.config.poli.map((x) => `<option>${esc(x)}</option>`).join('')}</select></div>
            <div data-ri class="hidden"><label class="label" for="ruang">Ruang rawat <span class="text-rose-700" aria-hidden="true">*</span></label><select id="ruang" class="field">${App.config.ruangRI.map((r) => `<option value="${esc(r.ruang)}">${esc(r.ruang)}, ${esc(r.kelas)}</option>`).join('')}</select></div>
            <div data-ri class="hidden"><label class="label" for="kamar">Nomor kamar / tempat tidur</label><input id="kamar" class="field ident" placeholder="Contoh: M-203"></div>

            <div><label class="label" for="dokter"><span data-dokter-label>Dokter pemeriksa</span> <span class="text-rose-700" aria-hidden="true">*</span></label><select id="dokter" class="field"></select></div>
            <div><label class="label" for="penjamin">Penjamin</label><select id="penjamin" class="field">${App.config.penjamin.map((x) => `<option>${esc(x)}</option>`).join('')}</select></div>
            <div class="sm:col-span-2"><label class="label" for="keluhan">Keluhan utama <span class="text-rose-700" aria-hidden="true">*</span></label><textarea id="keluhan" class="field" rows="2" placeholder="Contoh: demam 3 hari disertai batuk"></textarea><p class="err hidden" id="err-keluhan" role="alert"></p></div>
            <div id="vblock" class="sm:col-span-2" aria-live="polite"></div>
          </div>
          <div class="flex justify-end gap-2 border-t border-ink-200 px-4 py-3"><a class="btn btn-secondary" href="#/kunjungan">Batal</a><button class="btn btn-primary" type="submit">Daftarkan kunjungan</button></div>
        </form>
      </div>`;
    },
    mount(root, ctx) {
      const store = App.store;
      const $ = (id) => root.querySelector('#' + id);
      const form = $('vf');
      let patient = null;

      function dokterOptions() {
        const jenis = form.jenis.value;
        const all = store.dokter();
        let list = all;
        if (jenis === 'RJ') list = all.filter((d) => d.spesialis === $('poli').value);
        $('dokter').innerHTML = (list.length ? list : all).map((d) => `<option value="${d.id}">${esc(d.nama)}${d.spesialis ? ', ' + esc(d.spesialis) : ''}</option>`).join('');
      }

      function conflict() {
        if (!patient) return '';
        const adm = store.activeAdmission(patient.id);
        const jenis = form.jenis.value;
        if (adm) return `Pasien ini sedang dirawat inap di ${esc(App.views.layananText(adm))}. Kunjungan baru tidak bisa didaftarkan sebelum pasien dipulangkan.`;
        if (jenis === 'RJ') {
          const today = ui.toDateStr(new Date());
          const dup = store.visits().find((v) => v.patientId === patient.id && v.jenis === 'RJ' && v.tglMasuk.slice(0, 10) === today && v.poli === $('poli').value && v.status !== 'Selesai');
          if (dup) return `Pasien ini sudah terdaftar di ${esc(dup.poli)} hari ini (${esc(dup.nomor)}, status ${esc(dup.status)}).`;
        }
        return '';
      }

      function refreshForm() {
        const ri = form.jenis.value === 'RI';
        root.querySelectorAll('[data-rj]').forEach((e) => e.classList.toggle('hidden', ri));
        root.querySelectorAll('[data-ri]').forEach((e) => e.classList.toggle('hidden', !ri));
        root.querySelector('[data-dokter-label]').textContent = ri ? 'DPJP (dokter penanggung jawab)' : 'Dokter pemeriksa';
        dokterOptions();
        const c = conflict();
        $('vblock').innerHTML = c ? ui.alertBox('danger', c) : '';
        form.querySelector('button[type=submit]').disabled = !!c;
      }

      function pick(p) {
        patient = p;
        const last = store.visitsOf(p.id)[0];
        $('picker').classList.add('hidden');
        const box = $('picked');
        box.classList.remove('hidden');
        box.innerHTML = `<div class="flex flex-wrap items-start justify-between gap-3"><div class="flex items-center gap-3">${ui.avatar(p.nama)}<div><div class="font-medium">${esc(p.nama)}</div><div class="text-sm text-ink-600"><span class="ident">${esc(p.noRM)}</span>, ${esc(App.views.patientHeadline(p))}, ${esc(p.penjamin)}</div>${last ? `<div class="text-xs text-ink-500">Kunjungan terakhir ${esc(ui.relDay(last.tglMasuk).toLowerCase())}${last.diagnosis[0] ? ': ' + esc(last.diagnosis[0].nama) : ''}</div>` : ''}</div></div>
          <button type="button" class="btn btn-quiet btn-sm" data-change>Ganti pasien</button></div>
          ${p.alergi.length ? `<div class="mt-3">${ui.alertBox('warn', `<strong>Alergi:</strong> ${p.alergi.map(esc).join(', ')}`)}</div>` : ''}`;
        box.querySelector('[data-change]').addEventListener('click', () => {
          patient = null;
          box.classList.add('hidden');
          $('picker').classList.remove('hidden');
          form.classList.add('hidden');
          $('pq').value = '';
          $('pq').focus();
        });
        $('penjamin').value = p.penjamin;
        form.classList.remove('hidden');
        refreshForm();
        $('keluhan').focus();
      }

      /* Kotak cari pasien (combobox sederhana) */
      const pq = $('pq');
      const plist = $('plist');
      let results = [];
      let active = -1;
      function closeList() {
        plist.classList.add('hidden');
        pq.setAttribute('aria-expanded', 'false');
        active = -1;
      }
      function drawList() {
        const q = ui.norm(pq.value).trim();
        const qd = q.replace(/\D/g, '');
        if (q.length < 2 && qd.length < 3) return closeList();
        results = store.patients().filter((p) => ui.norm(p.nama).includes(q) || (qd.length >= 3 && store.rmDigits(p.noRM).includes(qd))).slice(0, 8);
        plist.innerHTML = results.length
          ? results.map((p, i) => `<li role="option" id="opt-${i}" data-i="${i}" aria-selected="${i === active}" class="flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm aria-selected:bg-brand-50 hover:bg-brand-50"><span class="min-w-0 truncate font-medium">${ui.hl(p.nama, [q])}</span><span class="ident shrink-0 text-xs text-ink-500">${esc(p.noRM)}</span></li>`).join('')
          : `<li class="px-3 py-3 text-sm text-ink-600">Tidak ada pasien yang cocok. ${App.auth.can('patient.create') ? '<a class="font-medium text-brand-700 hover:underline" href="#/pasien/baru">Daftarkan pasien baru</a>' : ''}</li>`;
        plist.classList.remove('hidden');
        pq.setAttribute('aria-expanded', 'true');
      }
      pq.addEventListener('input', ui.debounce(() => { active = -1; drawList(); }, 100));
      pq.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          if (!results.length) return;
          active = (active + (e.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length;
          drawList();
          pq.setAttribute('aria-activedescendant', 'opt-' + active);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          const pickIdx = active >= 0 ? active : results.length === 1 ? 0 : -1;
          if (pickIdx >= 0) { pick(results[pickIdx]); closeList(); }
        } else if (e.key === 'Escape') closeList();
      });
      plist.addEventListener('mousedown', (e) => {
        const li = e.target.closest('[data-i]');
        if (li) { e.preventDefault(); pick(results[Number(li.dataset.i)]); closeList(); }
      });
      pq.addEventListener('blur', () => setTimeout(closeList, 120));

      form.addEventListener('change', (e) => { if (e.target.name === 'jenis' || e.target.id === 'poli') refreshForm(); });

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const keluhan = $('keluhan').value.trim();
        const err = $('err-keluhan');
        if (keluhan.length < 3) {
          err.textContent = 'Isi keluhan utama pasien.';
          err.classList.remove('hidden');
          $('keluhan').setAttribute('aria-invalid', 'true');
          $('keluhan').focus();
          return;
        }
        if (conflict()) return refreshForm();
        const ri = form.jenis.value === 'RI';
        const ruang = ri ? App.config.ruangRI.find((r) => r.ruang === $('ruang').value) : null;
        const v = store.addVisit({
          patientId: patient.id,
          jenis: form.jenis.value,
          poli: ri ? '' : $('poli').value,
          ruang: ri ? ruang.ruang : '',
          kelas: ri ? ruang.kelas : '',
          kamar: ri ? $('kamar').value.trim() : '',
          dokterId: $('dokter').value,
          penjamin: $('penjamin').value,
          keluhan,
        });
        ui.toast(`Kunjungan ${v.nomor} didaftarkan untuk ${patient.nama}.`);
        App.router.go('/kunjungan');
      });

      if (ctx.query.pasien) {
        const p = store.patient(ctx.query.pasien);
        if (p) pick(p);
      } else pq.focus();
    },
  };
})();
