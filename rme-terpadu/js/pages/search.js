/*
 * Pencarian riwayat medis: inti dari sistem ini.
 * Satu kotak untuk nama, No. RM (dengan atau tanpa tanda hubung), NIK, nomor HP,
 * serta kata kunci klinis (diagnosis, kode ICD-10, tindakan, obat, keluhan).
 */
(function () {
  const App = (window.App = window.App || {});
  const ui = App.ui;
  const esc = ui.esc;
  App.pages = App.pages || {};

  /* ---------- Mesin pencarian ---------- */
  function parse(q) {
    return ui.norm(q).trim().split(/\s+/).filter(Boolean).map((t) => {
      if (/^[\d-]+$/.test(t) && /\d/.test(t)) return { kind: 'num', raw: t, digits: t.replace(/\D/g, '') };
      return { kind: 'txt', raw: t };
    });
  }

  function matchPatient(p, tokens) {
    const nama = ui.norm(p.nama);
    const words = nama.split(/\s+/);
    const alamat = ui.norm(p.alamat);
    const rm = App.store.rmDigits(p.noRM);
    const hp = String(p.noHp || '').replace(/\D/g, '');
    let score = 0;
    const why = new Set();
    for (const t of tokens) {
      let ok = false;
      if (t.kind === 'num') {
        const d = t.digits;
        if (d.length >= 3) {
          if (rm === d) (score += 10), why.add('No. RM'), (ok = true);
          else if (rm.includes(d)) (score += 6), why.add('No. RM'), (ok = true);
          if (p.nik.includes(d)) (score += 5), why.add('NIK'), (ok = true);
          if (hp.includes(d)) (score += 3), why.add('No. HP'), (ok = true);
        }
        if (!ok && alamat.includes(t.raw)) (score += 1), why.add('Alamat'), (ok = true);
      } else {
        if (words.some((w) => w.startsWith(t.raw))) (score += 4), why.add('Nama'), (ok = true);
        else if (nama.includes(t.raw)) (score += 2), why.add('Nama'), (ok = true);
        else if (alamat.includes(t.raw)) (score += 1), why.add('Alamat'), (ok = true);
      }
      if (!ok) return null;
    }
    return { score, why: Array.from(why) };
  }

  function visitText(v, full) {
    const dx = v.diagnosis.map((d) => `${d.kode} ${d.nama}`);
    return {
      Diagnosis: ui.norm(dx.join(' | ')),
      Keluhan: full ? ui.norm(v.keluhan + ' ' + v.anamnesis) : '',
      Tindakan: full ? ui.norm(v.tindakan.join(' | ')) : '',
      Terapi: full ? ui.norm(v.terapi.join(' | ')) : '',
    };
  }

  function search(q, filters) {
    const tokens = parse(q);
    const store = App.store;
    const full = App.auth.can('history.full');
    const vmap = store.visitsByPatient();
    const out = { tokens, patients: [], visits: [] };
    if (!tokens.length) return out;

    const patientsById = new Map(store.patients().map((p) => [p.id, p]));

    store.patients().forEach((p) => {
      const m = matchPatient(p, tokens);
      if (m) out.patients.push({ p, score: m.score, why: m.why, last: (vmap.get(p.id) || [])[0] || null, count: (vmap.get(p.id) || []).length });
    });
    out.patients.sort((a, b) => b.score - a.score || ((b.last ? b.last.tglMasuk : '') > (a.last ? a.last.tglMasuk : '') ? 1 : -1));

    // Riwayat: semua kata harus cocok (di data klinis atau identitas pasien), minimal satu di data klinis.
    const cutoff = filters.days ? ui.toISO(new Date(Date.now() - filters.days * 86400000)) : '';
    const clinicalTokens = tokens.filter((t) => t.kind === 'txt');
    if (clinicalTokens.length) {
      store.visits().forEach((v) => {
        if (filters.jenis && v.jenis !== filters.jenis) return;
        if (cutoff && v.tglMasuk < cutoff) return;
        const p = patientsById.get(v.patientId);
        const fields = visitText(v, full);
        const all = Object.values(fields).join(' | ');
        const ident = ui.norm(p.nama) + ' ' + store.rmDigits(p.noRM) + ' ' + p.nik;
        let clinicalHit = false;
        const matchedFields = new Set();
        for (const t of tokens) {
          const needle = t.kind === 'num' ? t.digits : t.raw;
          const inClin = t.kind === 'txt' && all.includes(needle);
          if (inClin) {
            clinicalHit = true;
            Object.entries(fields).forEach(([k, txt]) => txt.includes(needle) && matchedFields.add(k));
          } else if (!ident.includes(needle)) return;
        }
        if (clinicalHit) out.visits.push({ v, p, fields: Array.from(matchedFields) });
      });
      out.visits.sort((a, b) => (a.v.tglMasuk < b.v.tglMasuk ? 1 : -1));
    }
    return out;
  }
  App.search = { run: search, parse };

  /* ---------- Tampilan ---------- */
  function patientRow(r, hlTok) {
    const p = r.p;
    const adm = App.store.activeAdmission(p.id);
    const last = r.last;
    return `<li><a data-result href="#/pasien/${p.id}" class="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-4 py-3.5 hover:bg-brand-50/60 focus-visible:bg-brand-50 focus-visible:outline-offset-[-2px]">
      ${ui.avatar(p.nama)}
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span class="font-medium">${ui.hl(p.nama, hlTok)}</span>
          <span class="ident text-sm text-ink-600">${ui.hl(p.noRM, hlTok)}</span>
          ${adm ? `<span class="badge bg-violet-100 text-violet-800">${App.icon('bed', 'size-3.5')}Sedang dirawat</span>` : ''}
        </div>
        <div class="mt-0.5 text-sm text-ink-600">${esc(App.views.patientHeadline(p))}${last ? `; terakhir berobat ${esc(ui.relDay(last.tglMasuk).toLowerCase())}${last.diagnosis[0] ? ', ' + esc(last.diagnosis[0].nama) : ''}` : '; belum ada kunjungan'}</div>
        <div class="mt-1 text-xs text-ink-500">Cocok di ${r.why.map((w) => esc(w.toLowerCase())).join(', ')}${r.why.includes('NIK') ? `, NIK ${esc(ui.maskNik(p.nik))}` : ''}</div>
      </div>
      <span class="text-ink-400">${App.icon('chevron-right', 'size-5')}</span>
    </a></li>`;
  }

  function visitRow(r, hlTok) {
    const { v, p } = r;
    const d = ui.parse(v.tglMasuk);
    const full = App.auth.can('history.full');
    const snippets = [];
    if (full) {
      const has = (s) => hlTok.some((t) => ui.norm(s).includes(t));
      v.tindakan.filter(has).slice(0, 2).forEach((t) => snippets.push(['Tindakan', t]));
      v.terapi.filter(has).slice(0, 2).forEach((t) => snippets.push(['Terapi', t]));
      if (!snippets.length && has(v.keluhan)) snippets.push(['Keluhan', v.keluhan]);
    }
    return `<li><a data-result href="#/pasien/${p.id}?k=${v.id}" class="grid grid-cols-[3.75rem_minmax(0,1fr)] gap-4 px-4 py-3.5 hover:bg-brand-50/60 focus-visible:bg-brand-50 focus-visible:outline-offset-[-2px]">
      <div class="text-center leading-tight"><div class="text-2xl font-semibold">${d.getDate()}</div><div class="text-xs text-ink-500">${ui.BULAN[d.getMonth()]} ${d.getFullYear()}</div></div>
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1">${ui.jenisBadge(v.jenis)}<span class="font-medium">${esc(p.nama)}</span><span class="ident text-sm text-ink-600">${esc(p.noRM)}</span></div>
        <div class="mt-1.5">${App.views.diagnosisList(v.diagnosis.slice(0, 2), hlTok)}</div>
        ${snippets.map(([l, t]) => `<div class="mt-1 text-sm text-ink-700"><span class="text-ink-500">${l}:</span> ${ui.hl(t, hlTok)}</div>`).join('')}
        <div class="mt-1 text-xs text-ink-500">${esc(App.views.layananText(v))}, ${esc(App.views.userName(v.dokterId))}</div>
      </div>
    </a></li>`;
  }

  function idleState() {
    const store = App.store;
    const searches = store.recentSearches();
    const recent = store.recentPatients();
    const ex = store.patients()[3] || store.patients()[0] || { nama: 'Siti Rahmawati', noRM: '04-13-27' };
    const exFirst = String(ex.nama).split(' ')[0].toLowerCase();
    const tips = [
      ['Nama', `${ex.nama.toLowerCase()}, atau cukup “${exFirst}”`],
      ['No. RM', `${ex.noRM} atau ${App.store.rmDigits(ex.noRM)}`],
      ['NIK atau No. HP', 'tiga angka pertama sudah cukup'],
      ['Diagnosis', 'hipertensi, diabetes, atau kode seperti I10'],
      ['Tindakan dan obat', 'EKG, amlodipin, nebulisasi'],
    ];
    return `<div class="grid gap-8 lg:grid-cols-2">
      <div class="space-y-8">
        <section aria-labelledby="h-recent">
          <div class="mb-2 flex items-center justify-between"><h2 id="h-recent" class="text-sm font-semibold">Pasien yang terakhir dibuka</h2></div>
          ${
            recent.length
              ? `<ul class="divide-y divide-ink-100 rounded-lg border border-ink-200 bg-white">${recent
                  .slice(0, 5)
                  .map((p) => `<li><a data-result href="#/pasien/${p.id}" class="flex items-center gap-3 px-4 py-2.5 hover:bg-brand-50/60">${ui.avatar(p.nama, 'size-8 text-xs')}<span class="min-w-0 flex-1"><span class="block truncate text-sm font-medium">${esc(p.nama)}</span><span class="ident text-xs text-ink-500">${esc(p.noRM)}</span></span>${App.icon('chevron-right', 'size-4 text-ink-400')}</a></li>`)
                  .join('')}</ul>`
              : `<p class="rounded-lg border border-dashed border-ink-300 px-4 py-6 text-sm text-ink-500">Belum ada. Pasien yang Anda buka akan muncul di sini supaya mudah dicari lagi.</p>`
          }
        </section>
        <section aria-labelledby="h-searches">
          <div class="mb-2 flex items-center justify-between"><h2 id="h-searches" class="text-sm font-semibold">Pencarian terakhir</h2>${searches.length ? '<button class="text-xs font-medium text-brand-700 hover:underline" data-clear-searches>Hapus</button>' : ''}</div>
          ${
            searches.length
              ? `<div class="flex flex-wrap gap-2">${searches.map((s) => `<button class="rounded-full border border-ink-300 bg-white px-3 py-1 text-sm hover:border-brand-500 hover:bg-brand-50" data-q="${esc(s)}">${esc(s)}</button>`).join('')}</div>`
              : `<p class="text-sm text-ink-500">Belum ada pencarian.</p>`
          }
        </section>
      </div>
      <section aria-labelledby="h-tips">
        <h2 id="h-tips" class="mb-2 text-sm font-semibold">Yang bisa Anda ketik</h2>
        <dl class="divide-y divide-ink-100 rounded-lg border border-ink-200 bg-white text-sm">
          ${tips.map(([k, v]) => `<div class="grid grid-cols-[8.5rem_1fr] gap-3 px-4 py-2.5"><dt class="font-medium">${k}</dt><dd class="text-ink-600">${esc(v)}</dd></div>`).join('')}
        </dl>
        <p class="mt-3 text-sm text-ink-500">Gabungkan beberapa kata untuk mempersempit, misalnya <button class="font-medium text-brand-700 hover:underline" data-q="hipertensi amlodipin">hipertensi amlodipin</button>.</p>
      </section>
    </div>`;
  }

  App.pages.search = {
    title: () => 'Cari riwayat medis',
    render(ctx) {
      const q = ctx.query.q || '';
      const full = App.auth.can('history.full');
      return `
      <header class="max-w-3xl">
        <h1 class="text-2xl font-semibold tracking-tight">Cari riwayat medis</h1>
        <p class="mt-1 text-sm text-ink-600">${full ? 'Temukan pasien lewat nama, No. RM, atau NIK, atau cari riwayat lewat diagnosis, tindakan, dan obat.' : 'Temukan pasien lewat nama, No. RM, atau NIK, atau cari riwayat lewat diagnosis.'}</p>
      </header>

      <form id="search-form" class="mt-5 max-w-3xl" role="search" autocomplete="off">
        <label for="q" class="sr-only">Kata kunci pencarian</label>
        <div class="relative">
          <span class="pointer-events-none absolute inset-y-0 left-4 flex items-center text-ink-400">${App.icon('search', 'size-5')}</span>
          <input id="q" name="q" type="search" value="${esc(q)}" placeholder="Nama, No. RM, NIK, atau diagnosis" class="field h-14 pr-24 pl-12 text-lg" enterkeyhint="search" spellcheck="false">
          <div class="absolute inset-y-0 right-3 flex items-center gap-2">
            <button type="button" data-clear class="${q ? '' : 'hidden'} rounded p-1.5 text-ink-500 hover:bg-ink-100 hover:text-ink-900" aria-label="Hapus kata kunci">${App.icon('x', 'size-4')}</button>
            <kbd class="hidden h-6 items-center rounded border border-ink-300 bg-ink-50 px-2 text-xs text-ink-500 sm:inline-flex">/</kbd>
          </div>
        </div>
        <div class="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2" id="filters">
          <fieldset class="flex items-center gap-1">
            <legend class="sr-only">Jenis layanan</legend>
            <span class="mr-1 text-sm text-ink-600" aria-hidden="true">Layanan</span>
            ${[['', 'Semua'], ['RJ', 'Rawat jalan'], ['RI', 'Rawat inap']]
              .map(([val, label], i) => `<label class="cursor-pointer"><input type="radio" name="jenis" value="${val}" class="peer sr-only" ${i === 0 ? 'checked' : ''}><span class="inline-block rounded-md border border-transparent px-2.5 py-1 text-sm text-ink-700 hover:bg-ink-100 peer-checked:border-brand-200 peer-checked:bg-brand-50 peer-checked:font-medium peer-checked:text-brand-800 peer-focus-visible:outline-2 peer-focus-visible:outline-brand-500">${label}</span></label>`)
              .join('')}
          </fieldset>
          <div class="flex items-center gap-2">
            <label for="days" class="text-sm text-ink-600">Periode riwayat</label>
            <select id="days" name="days" class="field h-8 w-auto py-0 text-sm"><option value="">Semua waktu</option><option value="30">30 hari terakhir</option><option value="180">6 bulan terakhir</option><option value="365">1 tahun terakhir</option></select>
          </div>
        </div>
      </form>

      <p id="status" class="sr-only" role="status" aria-live="polite"></p>
      <div id="results" class="mt-6"></div>`;
    },
    mount(root, ctx) {
      const form = root.querySelector('#search-form');
      const input = root.querySelector('#q');
      const results = root.querySelector('#results');
      const status = root.querySelector('#status');
      const clearBtn = root.querySelector('[data-clear]');
      let visitLimit = 20;
      let lastQuery = '';

      function filters() {
        const f = new FormData(form);
        return { jenis: f.get('jenis') || '', days: Number(f.get('days')) || 0 };
      }

      function draw(resetLimit) {
        const q = input.value;
        lastQuery = q.trim();
        if (resetLimit) visitLimit = 20;
        clearBtn.classList.toggle('hidden', !q);
        // jaga URL tetap sinkron tanpa memicu render ulang halaman
        const hash = '#/pencarian' + (lastQuery ? '?q=' + encodeURIComponent(lastQuery) : '');
        if (location.hash !== hash) history.replaceState(null, '', hash);

        if (!lastQuery) {
          results.innerHTML = idleState();
          status.textContent = '';
          return;
        }
        const f = filters();
        const r = search(q, f);
        const hlTok = r.tokens.map((t) => t.raw);
        const np = r.patients.length;
        const nv = r.visits.length;
        status.textContent = `${np} pasien dan ${nv} riwayat kunjungan cocok dengan ${lastQuery}`;

        if (!np && !nv) {
          results.innerHTML = `<div class="max-w-3xl rounded-lg border border-ink-200 bg-white">${ui.empty(
            `Tidak ada hasil untuk “${esc(lastQuery)}”`,
            'Periksa ejaan, coba satu kata saja (misalnya nama belakang), atau longgarkan filter. Pasien yang belum pernah berobat di sini perlu didaftarkan dulu.',
            App.auth.can('patient.create') ? `<a class="btn btn-primary" href="#/pasien/baru">${App.icon('user-plus', 'size-4')}Daftarkan pasien baru</a>` : ''
          )}</div>`;
          return;
        }

        const patientsShown = r.patients.slice(0, 25);
        const visitsShown = r.visits.slice(0, visitLimit);
        results.innerHTML = `<div class="max-w-4xl space-y-8">
          <p class="text-sm text-ink-600" aria-hidden="true"><strong class="font-semibold text-ink-900">${np}</strong> pasien dan <strong class="font-semibold text-ink-900">${nv}</strong> riwayat kunjungan cocok dengan “${esc(lastQuery)}”.</p>
          ${
            np
              ? `<section aria-labelledby="h-pasien"><h2 id="h-pasien" class="mb-2 text-sm font-semibold">Pasien <span class="font-normal text-ink-500">(${np})</span></h2>
                <ul class="divide-y divide-ink-100 overflow-hidden rounded-lg border border-ink-200 bg-white">${patientsShown.map((x) => patientRow(x, hlTok)).join('')}</ul>
                ${np > 25 ? `<p class="mt-2 text-sm text-ink-500">Menampilkan 25 teratas. Tambahkan kata kunci untuk mempersempit.</p>` : ''}</section>`
              : ''
          }
          ${
            nv
              ? `<section aria-labelledby="h-riwayat"><h2 id="h-riwayat" class="mb-2 text-sm font-semibold">Riwayat kunjungan yang cocok <span class="font-normal text-ink-500">(${nv})</span></h2>
                <ul class="divide-y divide-ink-100 overflow-hidden rounded-lg border border-ink-200 bg-white">${visitsShown.map((x) => visitRow(x, hlTok)).join('')}</ul>
                ${nv > visitLimit ? `<button class="btn btn-secondary mt-3" data-more>Tampilkan ${Math.min(20, nv - visitLimit)} lagi</button>` : ''}</section>`
              : ctx && r.tokens.some((t) => t.kind === 'txt') && np
              ? `<p class="text-sm text-ink-500">Tidak ada riwayat kunjungan yang cocok dengan filter saat ini.</p>`
              : ''
          }
        </div>`;
      }

      const debounced = ui.debounce(() => draw(true), 120);
      input.addEventListener('input', debounced);
      // Hanya filter yang memicu pencarian ulang. Event "change" dari kotak cari (saat blur) tidak boleh
      // merender ulang hasil, kalau tidak klik pertama pada hasil akan hilang.
      form.addEventListener('change', (e) => {
        if (e.target.name === 'jenis' || e.target.name === 'days') draw(true);
      });
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        draw(true);
        const rows = results.querySelectorAll('[data-result]');
        const patientLinks = results.querySelectorAll('#h-pasien ~ ul [data-result]');
        if (patientLinks.length === 1 && lastQuery) {
          App.store.pushSearch(lastQuery);
          patientLinks[0].click();
        } else if (rows.length) rows[0].focus();
      });
      clearBtn.addEventListener('click', () => {
        input.value = '';
        draw(true);
        input.focus();
      });

      results.addEventListener('click', (e) => {
        const chip = e.target.closest('[data-q]');
        if (chip) {
          input.value = chip.dataset.q;
          draw(true);
          input.focus();
          return;
        }
        if (e.target.closest('[data-clear-searches]')) {
          App.store.clearSearches();
          draw(false);
          return;
        }
        if (e.target.closest('[data-more]')) {
          visitLimit += 20;
          draw(false);
          return;
        }
        if (e.target.closest('a[data-result]') && lastQuery) App.store.pushSearch(lastQuery);
      });

      // Navigasi papan ketik: panah atas/bawah berpindah antar hasil, Esc kembali ke kotak cari
      root.addEventListener('keydown', (e) => {
        if (!['ArrowDown', 'ArrowUp', 'Escape'].includes(e.key)) return;
        const items = Array.from(results.querySelectorAll('[data-result]'));
        const i = items.indexOf(document.activeElement);
        if (e.key === 'Escape') {
          if (document.activeElement !== input) input.focus();
          return;
        }
        if (!items.length) return;
        if (document.activeElement === input && e.key === 'ArrowDown') {
          e.preventDefault();
          items[0].focus();
        } else if (i >= 0) {
          e.preventDefault();
          if (e.key === 'ArrowDown') (items[i + 1] || items[i]).focus();
          else if (i === 0) input.focus();
          else items[i - 1].focus();
        }
      });

      draw(true);
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    },
  };
})();
