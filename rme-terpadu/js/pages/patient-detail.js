/*
 * Detail pasien: identitas dan seluruh riwayat kunjungan dalam satu garis waktu
 * (rawat jalan dan rawat inap bercampur, urut dari yang terbaru).
 */
(function () {
  const App = (window.App = window.App || {});
  const ui = App.ui;
  const esc = ui.esc;
  App.pages = App.pages || {};

  function dl(rows) {
    return `<dl class="divide-y divide-ink-100 text-sm">${rows
      .filter(Boolean)
      .map(([k, v, cls]) => `<div class="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 py-2"><dt class="text-ink-500">${k}</dt><dd class="${cls || ''} min-w-0 break-words">${v}</dd></div>`)
      .join('')}</dl>`;
  }

  function summaryPanel(visits, full) {
    const rj = visits.filter((v) => v.jenis === 'RJ').length;
    const ri = visits.filter((v) => v.jenis === 'RI').length;
    const dx = {};
    visits.forEach((v) => v.diagnosis.forEach((d) => {
      const k = d.kode + '|' + d.nama;
      dx[k] = (dx[k] || 0) + 1;
    }));
    const recurring = Object.entries(dx).filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, 6);
    return `<section class="panel" aria-labelledby="h-ringkas">
      <div class="panel-head"><h2 id="h-ringkas" class="text-sm font-semibold">Ringkasan riwayat</h2></div>
      <div class="grid grid-cols-3 divide-x divide-ink-100 border-b border-ink-100 text-center">
        <div class="py-3"><div class="text-xl font-semibold">${visits.length}</div><div class="text-xs text-ink-500">Kunjungan</div></div>
        <div class="py-3"><div class="text-xl font-semibold text-sky-700">${rj}</div><div class="text-xs text-ink-500">Rawat jalan</div></div>
        <div class="py-3"><div class="text-xl font-semibold text-violet-700">${ri}</div><div class="text-xs text-ink-500">Rawat inap</div></div>
      </div>
      <div class="px-4 py-3">
        <h3 class="text-xs font-medium text-ink-500">Diagnosis yang berulang</h3>
        ${
          recurring.length
            ? `<ul class="mt-2 space-y-1.5">${recurring
                .map(([k, n]) => { const [kode, nama] = k.split('|'); return `<li class="flex items-baseline justify-between gap-3 text-sm"><span class="min-w-0"><span class="ident mr-1.5 text-xs text-ink-500">${esc(kode)}</span>${esc(nama)}</span><span class="shrink-0 text-xs text-ink-500">${n}x</span></li>`; })
                .join('')}</ul>`
            : `<p class="mt-1 text-sm text-ink-500">Belum ada diagnosis yang berulang.</p>`
        }
      </div>
    </section>`;
  }

  function entry(v, opts) {
    const d = ui.parse(v.tglMasuk);
    const dx = v.diagnosis.find((x) => x.tipe === 'utama') || v.diagnosis[0];
    const dokter = App.views.userName(v.dokterId);
    const tok = opts.tokens;
    const isRI = v.jenis === 'RI';
    const keluarTxt = isRI && v.tglKeluar ? `Pulang ${ui.fmtDate(v.tglKeluar)}` : '';
    const canExam = App.auth.can('visit.examine') && (v.status === 'Terdaftar' || v.status === 'Diperiksa' || v.status === 'Dirawat');
    return `<li class="relative grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-3 sm:grid-cols-[4.25rem_minmax(0,1fr)] sm:gap-x-4" data-entry="${v.id}">
      <div class="pt-3.5 text-right leading-tight"><div class="text-2xl font-semibold tabular-nums">${d.getDate()}</div><div class="text-xs text-ink-500">${ui.BULAN[d.getMonth()]}</div></div>
      <div class="relative border-l-2 ${isRI ? 'border-violet-300' : 'border-sky-300'} pb-1 pl-4 sm:pl-5">
        <span class="absolute top-[1.15rem] -left-[7px] size-3 rounded-full border-2 border-white ${isRI ? 'bg-violet-500' : 'bg-sky-500'}"></span>
        <details class="visit group rounded-lg border border-ink-200 bg-white open:shadow-sm" ${opts.open ? 'open' : ''}>
          <summary class="flex cursor-pointer items-start gap-3 rounded-lg px-4 py-3 hover:bg-ink-50 focus-visible:outline-offset-[-2px]">
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-x-2.5 gap-y-1">${ui.jenisBadge(v.jenis)}${v.status !== 'Selesai' && v.status !== 'Pulang' ? ui.statusBadge(v.status) : ''}<span class="text-sm text-ink-600">${esc(App.views.layananText(v))}${isRI ? `, ${App.views.lamaRawat(v)}` : ''}</span></div>
              <div class="mt-1.5 font-semibold">${dx ? `<span class="ident mr-1.5 rounded bg-ink-100 px-1.5 py-0.5 text-xs font-normal text-ink-700">${ui.hl(dx.kode, tok)}</span>${ui.hl(dx.nama, tok)}` : `<span class="font-normal text-ink-500">Diagnosis belum ditetapkan</span>`}</div>
              <div class="mt-0.5 truncate text-sm text-ink-600">${ui.hl(v.keluhan, tok)}</div>
            </div>
            <span class="chev mt-1 text-ink-400 transition-transform">${App.icon('chevron-right', 'size-5')}</span>
          </summary>
          <div class="border-t border-ink-100 px-4 py-4">
            ${App.views.visitBody(v, { full: opts.full, tokens: tok })}
            <div class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-3 text-sm text-ink-600">
              <span>${esc(dokter)}${v.jenis === 'RI' ? ' (DPJP)' : ''}, ${ui.fmtTime(v.tglMasuk)}${keluarTxt ? `; ${keluarTxt}` : ''}<span class="ml-2 ident text-xs text-ink-500">${esc(v.nomor)}</span></span>
              <a class="btn btn-secondary btn-sm print:hidden" href="#/kunjungan/${v.id}">${canExam ? 'Isi pemeriksaan' : 'Buka kunjungan'}</a>
            </div>
          </div>
        </details>
      </div>
    </li>`;
  }

  App.pages.patientDetail = {
    title: (ctx) => {
      const p = App.store.patient(ctx.params.id);
      return p ? p.nama : 'Pasien tidak ditemukan';
    },
    render(ctx) {
      const store = App.store;
      const p = store.patient(ctx.params.id);
      if (!p) {
        return `<div class="mx-auto max-w-md py-16 text-center"><h1 class="text-xl font-semibold">Pasien tidak ditemukan</h1><p class="mt-2 text-sm text-ink-600">Data pasien ini tidak ada atau sudah dihapus.</p><a class="btn btn-primary mt-5" href="#/pasien">Ke daftar pasien</a></div>`;
      }
      const visits = store.visitsOf(p.id);
      const full = App.auth.can('history.full');
      const adm = store.activeAdmission(p.id);
      const age = ui.age(p.tglLahir);
      const canVisit = App.auth.can('visit.create');
      const isNew = ctx.query.baru === '1';

      return `
      <div class="print:hidden"><a href="#/pasien" class="inline-flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-900">${App.icon('arrow-left', 'size-4')}Daftar pasien</a></div>

      <div class="hidden print:block"><p class="text-sm">${esc(App.config.hospitalName)}</p><p class="text-lg font-semibold">Ringkasan riwayat medis</p><p class="text-xs">Dicetak ${ui.fmtDateTime(ui.toISO(new Date()))} oleh ${esc(App.auth.user().nama)}</p></div>

      <header class="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div class="flex min-w-0 items-start gap-4 sm:items-center">
          ${ui.avatar(p.nama, 'size-14 text-lg')}
          <div class="min-w-0">
            <h1 class="text-2xl font-semibold tracking-tight">${esc(p.nama)}</h1>
            <div class="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-600">
              <span class="inline-flex items-center gap-1.5">No. RM <strong class="ident text-base font-medium text-ink-900">${esc(p.noRM)}</strong>
                <button class="rounded p-1 text-ink-500 hover:bg-ink-100 hover:text-ink-900 print:hidden" data-copy="${esc(p.noRM)}" aria-label="Salin No. RM">${App.icon('copy', 'size-3.5')}</button></span>
              <span>${esc(App.views.patientHeadline(p))}</span>
              ${p.golDarah ? `<span>Gol. darah ${esc(p.golDarah)}</span>` : ''}
              <span>${esc(p.penjamin)}</span>
            </div>
          </div>
        </div>
        <div class="flex flex-wrap gap-2 print:hidden">
          ${App.auth.can('history.print') ? `<button class="btn btn-secondary" data-print>${App.icon('printer', 'size-4')}Cetak ringkasan</button>` : ''}
          ${App.auth.can('patient.edit') ? `<a class="btn btn-secondary" href="#/pasien/${p.id}/ubah">${App.icon('pencil', 'size-4')}Ubah data</a>` : ''}
          ${canVisit ? `<a class="btn btn-primary" href="#/kunjungan/baru?pasien=${p.id}">${App.icon('plus', 'size-4')}Daftarkan kunjungan</a>` : ''}
        </div>
      </header>

      <div class="mt-4 space-y-2.5">
        ${isNew ? ui.alertBox('ok', `Pasien tersimpan dengan No. RM <strong class="ident">${esc(p.noRM)}</strong>.${canVisit ? ` Lanjutkan dengan <a class="font-medium underline" href="#/kunjungan/baru?pasien=${p.id}">mendaftarkan kunjungan</a>.` : ''}`) : ''}
        ${p.alergi.length ? ui.alertBox('warn', `<strong>Alergi:</strong> ${p.alergi.map(esc).join(', ')}`) : ''}
        ${adm ? ui.alertBox('info', `<strong>Sedang dirawat</strong> di ${esc(App.views.layananText(adm))} sejak ${ui.fmtDate(adm.tglMasuk)} (${App.views.lamaRawat(adm)}). DPJP: ${esc(App.views.userName(adm.dokterId))}. <a class="font-medium underline print:hidden" href="#/kunjungan/${adm.id}">Buka kunjungan</a>`, 'bed') : ''}
      </div>

      <div class="mt-6 grid gap-6 lg:grid-cols-[19.5rem_minmax(0,1fr)]">
        <aside class="space-y-6">
          <section class="panel" aria-labelledby="h-identitas">
            <div class="panel-head"><h2 id="h-identitas" class="text-sm font-semibold">Identitas</h2></div>
            <div class="px-4 py-1">${dl([
              ['NIK', esc(p.nik), 'ident'],
              ['Lahir', `${esc(p.tempatLahir)}, ${ui.fmtDate(p.tglLahir)}<div class="text-xs text-ink-500">${esc(age.text)}</div>`],
              ['Alamat', esc(p.alamat)],
              ['No. HP', esc(p.noHp), 'ident'],
              ['Pekerjaan', esc(p.pekerjaan || '-')],
              ['Status', esc(p.statusKawin || '-')],
              ['Penjamin', `${esc(p.penjamin)}${p.noPenjamin ? `<div class="ident text-xs text-ink-500">${esc(p.noPenjamin)}</div>` : ''}`],
              p.kontak && p.kontak.nama ? ['Kontak darurat', `${esc(p.kontak.nama)}<div class="text-xs text-ink-500">${esc(p.kontak.hubungan || '')}${p.kontak.noHp ? ', ' + esc(p.kontak.noHp) : ''}</div>`] : null,
              ['Terdaftar', ui.fmtDate(p.createdAt)],
            ])}</div>
          </section>
          ${App.auth.can('history.summary') ? summaryPanel(visits, full) : ''}
        </aside>

        <section aria-labelledby="h-riwayat" class="min-w-0">
          <div class="flex flex-wrap items-end justify-between gap-3">
            <h2 id="h-riwayat" class="text-lg font-semibold">Riwayat kunjungan</h2>
            <div class="flex flex-wrap items-center gap-2 print:hidden">
              <div class="relative"><span class="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-ink-400">${App.icon('search', 'size-4')}</span>
              <label class="sr-only" for="tl-q">Cari dalam riwayat pasien ini</label>
              <input id="tl-q" type="search" class="field h-8 w-52 pl-8 text-[13px]" placeholder="Cari di riwayat ini" autocomplete="off"></div>
              <button class="btn btn-quiet btn-sm" data-toggle-all aria-pressed="false">${App.icon('expand', 'size-4')}Buka semua</button>
            </div>
          </div>
          <div class="mt-3 flex flex-wrap gap-1.5 print:hidden" role="group" aria-label="Filter jenis layanan" id="tl-filter">
            ${[['', 'Semua', visits.length], ['RJ', 'Rawat jalan', visits.filter((v) => v.jenis === 'RJ').length], ['RI', 'Rawat inap', visits.filter((v) => v.jenis === 'RI').length]]
              .map(([val, label, n], i) => `<button type="button" data-f="${val}" aria-pressed="${i === 0}" class="rounded-full border px-3 py-1 text-sm aria-pressed:border-brand-600 aria-pressed:bg-brand-600 aria-pressed:text-white border-ink-300 bg-white text-ink-700 hover:border-brand-500">${label} <span class="opacity-70">${n}</span></button>`)
              .join('')}
          </div>
          <ol id="timeline" class="mt-4 space-y-3"></ol>
        </section>
      </div>`;
    },
    mount(root, ctx) {
      const store = App.store;
      const p = store.patient(ctx.params.id);
      if (!p) return;
      const visits = store.visitsOf(p.id);
      const full = App.auth.can('history.full');
      const list = root.querySelector('#timeline');
      const state = { jenis: '', q: '', highlight: ctx.query.k || '' };
      const history = App.auth.can('history.summary');

      store.pushRecent(p.id);
      store.log('Melihat riwayat pasien', `${p.nama} (No. RM ${p.noRM})`, p.id);

      function matches(v, tokens) {
        if (!tokens.length) return true;
        const hay = ui.norm([v.keluhan, v.anamnesis, v.fisik, v.lanjut, v.poli, v.ruang, ...v.diagnosis.map((d) => d.kode + ' ' + d.nama), ...v.tindakan, ...v.terapi].join(' | '));
        return tokens.every((t) => hay.includes(t));
      }

      function draw() {
        if (!history) {
          list.innerHTML = `<li>${ui.alertBox('info', 'Peran Anda tidak memiliki akses ke riwayat kunjungan.')}</li>`;
          return;
        }
        const tokens = ui.norm(state.q).trim().split(/\s+/).filter(Boolean);
        const shown = visits.filter((v) => (!state.jenis || v.jenis === state.jenis) && matches(v, tokens));
        if (!shown.length) {
          list.innerHTML = `<li class="panel">${ui.empty(visits.length ? 'Tidak ada kunjungan yang cocok' : 'Belum ada riwayat kunjungan', visits.length ? 'Ubah kata kunci atau filter jenis layanan.' : 'Riwayat akan muncul setelah pasien mendapat kunjungan pertama.')}</li>`;
          return;
        }
        let year = '';
        list.innerHTML = shown
          .map((v, i) => {
            const y = v.tglMasuk.slice(0, 4);
            let head = '';
            if (y !== year) {
              year = y;
              head = `<li class="${i ? 'pt-3' : ''}" aria-hidden="true"><div class="flex items-center gap-3 text-sm font-semibold text-ink-700"><span>${y}</span><span class="h-px flex-1 bg-ink-200"></span></div></li>`;
            }
            const open = state.highlight ? v.id === state.highlight : i === 0 && !tokens.length;
            return head + entry(v, { full, tokens, open: open || (tokens.length > 0 && shown.length <= 3) });
          })
          .join('');
        if (state.highlight) {
          const el = list.querySelector(`[data-entry="${state.highlight}"]`);
          if (el) {
            el.querySelector('details').classList.add('ring-2', 'ring-brand-500');
            requestAnimationFrame(() => el.scrollIntoView({ block: 'center' }));
          }
          state.highlight = '';
        }
      }

      root.querySelector('#tl-q').addEventListener('input', ui.debounce((e) => { state.q = e.target.value; draw(); }, 120));
      root.querySelector('#tl-filter').addEventListener('click', (e) => {
        const b = e.target.closest('[data-f]');
        if (!b) return;
        state.jenis = b.dataset.f;
        root.querySelectorAll('#tl-filter [data-f]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        draw();
      });
      const toggle = root.querySelector('[data-toggle-all]');
      toggle.addEventListener('click', () => {
        const open = toggle.getAttribute('aria-pressed') !== 'true';
        toggle.setAttribute('aria-pressed', String(open));
        toggle.lastChild.textContent = open ? 'Tutup semua' : 'Buka semua';
        list.querySelectorAll('details').forEach((d) => (d.open = open));
      });
      root.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', () => ui.copy(b.dataset.copy, 'No. RM')));

      const printBtn = root.querySelector('[data-print]');
      if (printBtn) {
        printBtn.addEventListener('click', () => {
          store.log('Mencetak riwayat', `${p.nama} (No. RM ${p.noRM})`, p.id);
          const states = Array.from(list.querySelectorAll('details')).map((d) => d.open);
          list.querySelectorAll('details').forEach((d) => (d.open = true));
          window.print();
          list.querySelectorAll('details').forEach((d, i) => (d.open = states[i]));
        });
      }
      draw();
    },
  };
})();
