/* Dashboard: isi menyesuaikan peran pengguna. */
(function () {
  const App = (window.App = window.App || {});
  const ui = App.ui;
  const esc = ui.esc;
  App.pages = App.pages || {};

  const HARI_PENDEK = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  function stats() {
    const store = App.store;
    const now = new Date();
    const todayStr = ui.toDateStr(now);
    const visits = store.visits();
    const todayVisits = visits.filter((v) => v.tglMasuk.slice(0, 10) === todayStr);
    const cutoff30 = ui.toISO(new Date(now.getTime() - 30 * 86400000));
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = ui.toDateStr(d);
      const list = visits.filter((v) => v.tglMasuk.slice(0, 10) === key);
      days.push({ d, key, rj: list.filter((v) => v.jenis === 'RJ').length, ri: list.filter((v) => v.jenis === 'RI').length });
    }
    const cutoff90 = ui.toISO(new Date(now.getTime() - 90 * 86400000));
    const dx = {};
    visits.forEach((v) => {
      if (v.tglMasuk < cutoff90) return;
      const u = v.diagnosis.find((x) => x.tipe === 'utama');
      if (u) {
        const k = u.kode + '|' + u.nama;
        dx[k] = (dx[k] || 0) + 1;
      }
    });
    const topDx = Object.entries(dx).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, n]) => ({ kode: k.split('|')[0], nama: k.split('|')[1], n }));
    return {
      patients: store.patients().length,
      todayVisits,
      todayRJ: todayVisits.filter((v) => v.jenis === 'RJ').length,
      todayRI: todayVisits.filter((v) => v.jenis === 'RI').length,
      admitted: visits.filter((v) => v.jenis === 'RI' && v.status === 'Dirawat'),
      newPatients: store.patients().filter((p) => p.createdAt >= cutoff30).length,
      days,
      topDx,
    };
  }

  function kpi(items) {
    return `<dl class="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-ink-200 bg-ink-200 lg:grid-cols-4">${items
      .map(
        (it) => `<div class="bg-white px-5 py-4">
          <dt class="text-sm text-ink-600">${it.label}</dt>
          <dd class="mt-1 text-3xl leading-none font-semibold tracking-tight">${ui.fmtNum(it.value)}</dd>
          ${it.note ? `<dd class="mt-1.5 text-xs text-ink-500">${it.note}</dd>` : ''}
        </div>`
      )
      .join('')}</dl>`;
  }

  function chart(days) {
    const max = Math.max(4, ...days.map((d) => d.rj + d.ri));
    const total = days.reduce((a, d) => a + d.rj + d.ri, 0);
    return `<div class="panel">
      <div class="panel-head"><h2 class="text-sm font-semibold">Kunjungan 7 hari terakhir</h2>
        <div class="flex items-center gap-4 text-xs text-ink-600"><span class="inline-flex items-center gap-1.5"><span class="size-2.5 rounded-sm bg-sky-500"></span>Rawat jalan</span><span class="inline-flex items-center gap-1.5"><span class="size-2.5 rounded-sm bg-violet-500"></span>Rawat inap (masuk)</span></div></div>
      <div class="px-4 pt-5 pb-4">
        <div class="flex h-44 items-end gap-2 sm:gap-4" role="img" aria-label="Grafik batang kunjungan 7 hari terakhir, total ${total} kunjungan">
          ${days
            .map((d) => {
              const tot = d.rj + d.ri;
              const isToday = ui.sameDay(d.d, new Date());
              return `<div class="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                <span class="text-xs font-medium ${tot ? 'text-ink-700' : 'text-ink-400'}">${tot}</span>
                <div class="flex w-full max-w-12 flex-col-reverse overflow-hidden rounded-t" style="height:${Math.max(2, (tot / max) * 100)}%">
                  <div class="w-full bg-sky-500" style="height:${tot ? (d.rj / tot) * 100 : 0}%"></div>
                  <div class="w-full bg-violet-500" style="height:${tot ? (d.ri / tot) * 100 : 0}%"></div>
                </div>
              </div>`;
            })
            .join('')}
        </div>
        <div class="mt-2 flex gap-2 border-t border-ink-200 pt-2 sm:gap-4">${days
          .map((d) => `<div class="flex-1 text-center text-xs ${ui.sameDay(d.d, new Date()) ? 'font-semibold text-ink-900' : 'text-ink-500'}">${ui.sameDay(d.d, new Date()) ? 'Hari ini' : HARI_PENDEK[d.d.getDay()]}<span class="block text-[11px] font-normal text-ink-400">${d.d.getDate()}/${d.d.getMonth() + 1}</span></div>`)
          .join('')}</div>
        <table class="sr-only"><caption>Jumlah kunjungan per hari</caption><thead><tr><th>Tanggal</th><th>Rawat jalan</th><th>Rawat inap</th></tr></thead><tbody>${days.map((d) => `<tr><td>${d.key}</td><td>${d.rj}</td><td>${d.ri}</td></tr>`).join('')}</tbody></table>
      </div>
    </div>`;
  }

  function topDiagnoses(list) {
    if (!list.length) return '';
    const max = list[0].n;
    return `<div class="panel">
      <div class="panel-head"><h2 class="text-sm font-semibold">Diagnosis utama terbanyak</h2><span class="text-xs text-ink-500">90 hari terakhir</span></div>
      <ol class="divide-y divide-ink-100">${list
        .map(
          (d) => `<li class="px-4 py-2.5"><div class="flex items-baseline justify-between gap-3 text-sm"><span class="min-w-0"><span class="ident mr-2 text-xs text-ink-500">${esc(d.kode)}</span>${esc(d.nama)}</span><span class="shrink-0 font-medium">${d.n}</span></div>
          <div class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-100"><div class="h-full rounded-full bg-brand-500" style="width:${(d.n / max) * 100}%"></div></div></li>`
        )
        .join('')}</ol>
    </div>`;
  }

  function visitItem(v) {
    const p = App.store.patient(v.patientId);
    return `<li><a href="#/kunjungan/${v.id}" class="flex items-center gap-3 px-4 py-3 hover:bg-brand-50/60">
      <span class="ident w-11 shrink-0 text-sm text-ink-500">${ui.fmtTime(v.tglMasuk)}</span>
      <span class="min-w-0 flex-1"><span class="block truncate text-sm font-medium">${esc(p ? p.nama : '-')}</span><span class="block truncate text-xs text-ink-500">${esc(v.poli || v.ruang)}, ${esc(v.keluhan)}</span></span>
      ${ui.statusBadge(v.status)}</a></li>`;
  }

  function sidePanels(user, s) {
    const store = App.store;
    let html = '';
    if (user.role === 'tenaga_medis') {
      const antrean = s.todayVisits
        .filter((v) => v.jenis === 'RJ')
        .sort((a, b) => (a.tglMasuk < b.tglMasuk ? -1 : 1));
      const waiting = antrean.filter((v) => v.status !== 'Selesai').length;
      html += `<div class="panel"><div class="panel-head"><h2 class="text-sm font-semibold">Antrean rawat jalan hari ini</h2><span class="text-xs text-ink-500">${waiting} belum selesai</span></div>
        ${antrean.length ? `<ul class="divide-y divide-ink-100">${antrean.map(visitItem).join('')}</ul>` : ui.empty('Belum ada antrean', 'Pasien rawat jalan yang didaftarkan hari ini akan muncul di sini.')}</div>`;
    } else {
      const list = s.todayVisits.slice().sort((a, b) => (a.tglMasuk < b.tglMasuk ? 1 : -1)).slice(0, 8);
      html += `<div class="panel"><div class="panel-head"><h2 class="text-sm font-semibold">Pendaftaran hari ini</h2><a class="text-xs font-medium text-brand-700 hover:underline" href="#/kunjungan">Lihat semua</a></div>
        ${list.length ? `<ul class="divide-y divide-ink-100">${list.map(visitItem).join('')}</ul>` : ui.empty('Belum ada pendaftaran hari ini', '', `<a class="btn btn-primary" href="#/kunjungan/baru">Daftarkan kunjungan</a>`)}</div>`;
      const logs = store.audit().slice(0, 7);
      html += `<div class="panel"><div class="panel-head"><h2 class="text-sm font-semibold">Aktivitas terbaru</h2><a class="text-xs font-medium text-brand-700 hover:underline" href="#/log">Lihat log</a></div>
        <ul class="divide-y divide-ink-100">${logs
          .map((l) => `<li class="px-4 py-2.5 text-sm"><div class="flex justify-between gap-3"><span class="font-medium">${esc(l.aksi)}</span><span class="shrink-0 text-xs text-ink-500">${ui.fmtTime(l.ts)}</span></div><div class="truncate text-xs text-ink-500">${esc(l.nama)}${l.detail ? ', ' + esc(l.detail) : ''}</div></li>`)
          .join('')}</ul></div>`;
    }

    if (App.auth.can('patient.view')) {
      html += `<div class="panel"><div class="panel-head"><h2 class="text-sm font-semibold">Sedang dirawat inap</h2><span class="text-xs text-ink-500">${s.admitted.length} pasien</span></div>
        ${
          s.admitted.length
            ? `<ul class="divide-y divide-ink-100">${s.admitted
                .map((v) => {
                  const p = store.patient(v.patientId);
                  return `<li><a href="#/pasien/${p.id}" class="flex items-center gap-3 px-4 py-3 hover:bg-brand-50/60"><span class="min-w-0 flex-1"><span class="block truncate text-sm font-medium">${esc(p.nama)}</span><span class="block truncate text-xs text-ink-500">${esc(App.views.layananText(v))}, hari ke-${Math.max(1, ui.dayDiff(ui.parse(v.tglMasuk), new Date()) + 1)}</span></span>${App.icon('chevron-right', 'size-4 text-ink-400')}</a></li>`;
                })
                .join('')}</ul>`
            : ui.empty('Tidak ada pasien rawat inap')
        }</div>`;
    }
    return html;
  }

  function usersByRole() {
    const users = App.store.users();
    return `<div class="panel"><div class="panel-head"><h2 class="text-sm font-semibold">Pengguna per peran</h2><a class="text-xs font-medium text-brand-700 hover:underline" href="#/pengguna">Kelola</a></div>
      <ul class="divide-y divide-ink-100">${Object.entries(App.auth.ROLES)
        .map(([k, r]) => `<li class="flex items-center justify-between px-4 py-2.5 text-sm"><span>${esc(r.label)}</span><span class="font-medium">${users.filter((u) => u.role === k && u.aktif).length}</span></li>`)
        .join('')}</ul></div>`;
  }

  App.pages.dashboard = {
    title: () => 'Dashboard',
    render() {
      const user = App.auth.user();
      const s = stats();
      const canSearch = App.auth.can('search');
      const canHistory = App.auth.can('history.summary');
      const sample = App.store.patients()[5];

      const items =
        user.role === 'petugas_rme'
          ? [
              { label: 'Pengguna aktif', value: App.store.users().filter((u) => u.aktif).length },
              { label: 'Pasien terdaftar', value: s.patients },
              { label: 'Kunjungan hari ini', value: s.todayVisits.length, note: `${s.todayRJ} rawat jalan, ${s.todayRI} rawat inap` },
              { label: 'Aktivitas hari ini', value: App.store.audit().filter((l) => l.ts.slice(0, 10) === ui.toDateStr(new Date())).length },
            ]
          : [
              { label: 'Pasien terdaftar', value: s.patients, note: `${s.newPatients} baru dalam 30 hari` },
              { label: 'Kunjungan hari ini', value: s.todayVisits.length, note: `${s.todayRJ} rawat jalan, ${s.todayRI} rawat inap` },
              { label: 'Sedang dirawat inap', value: s.admitted.length },
              { label: 'Menunggu pemeriksaan', value: s.todayVisits.filter((v) => v.jenis === 'RJ' && v.status === 'Terdaftar').length, note: 'rawat jalan, hari ini' },
            ];

      const quick = [];
      if (App.auth.can('patient.create')) quick.push(`<a class="btn btn-secondary" href="#/pasien/baru">${App.icon('user-plus', 'size-4')}Pasien baru</a>`);
      if (App.auth.can('visit.create')) quick.push(`<a class="btn btn-primary" href="#/kunjungan/baru">${App.icon('plus', 'size-4')}Kunjungan baru</a>`);

      return `
      <header class="flex flex-wrap items-end justify-between gap-4">
        <div><h1 class="text-2xl font-semibold tracking-tight">${ui.greeting()}, ${esc(user.nama.split(',')[0])}</h1>
        <p class="mt-1 text-sm text-ink-600">${esc(App.auth.ROLES[user.role].desc)}</p></div>
        ${quick.length ? `<div class="flex gap-2">${quick.join('')}</div>` : ''}
      </header>

      ${
        canSearch
          ? `<form id="dash-search" class="mt-6 rounded-lg border border-brand-200 bg-brand-50 p-4 sm:p-5" role="search">
              <label for="dq" class="text-sm font-semibold text-brand-900">Cari riwayat medis pasien</label>
              <div class="mt-2 flex gap-2">
                <div class="relative flex-1"><span class="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-ink-400">${App.icon('search', 'size-5')}</span>
                <input id="dq" name="q" type="search" autocomplete="off" placeholder="Nama, No. RM, atau diagnosis" class="field h-11 pl-11 text-base"></div>
                <button class="btn btn-primary h-11 px-5">Cari</button>
              </div>
              ${sample ? `<p class="mt-2.5 text-sm text-brand-900/80">Coba: <button type="button" class="font-medium underline-offset-2 hover:underline" data-q="${esc(sample.nama.split(' ')[0])}">${esc(sample.nama.split(' ')[0].toLowerCase())}</button>${canHistory ? ', <button type="button" class="font-medium underline-offset-2 hover:underline" data-q="hipertensi">hipertensi</button>, <button type="button" class="font-medium underline-offset-2 hover:underline" data-q="' + esc(sample.noRM) + '">' + esc(sample.noRM) + '</button>' : ''}</p>` : ''}
            </form>`
          : ''
      }

      <section class="mt-6" aria-label="Ringkasan">${kpi(items)}</section>

      <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_23rem]">
        <div class="space-y-6">${chart(s.days)}${canHistory ? topDiagnoses(s.topDx) : ''}${App.auth.can('user.manage') ? usersByRole() : ''}</div>
        <div class="space-y-6">${sidePanels(user, s)}</div>
      </div>`;
    },
    mount(root) {
      const form = root.querySelector('#dash-search');
      if (!form) return;
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const q = form.q.value.trim();
        App.router.go('/pencarian' + (q ? '?q=' + encodeURIComponent(q) : ''));
      });
      form.querySelectorAll('[data-q]').forEach((b) =>
        b.addEventListener('click', () => App.router.go('/pencarian?q=' + encodeURIComponent(b.dataset.q)))
      );
    },
  };
})();
