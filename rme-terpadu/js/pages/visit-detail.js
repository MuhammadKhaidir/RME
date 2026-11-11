/*
 * Detail kunjungan.
 * Tenaga Medis: mengisi pemeriksaan sambil melihat riwayat sebelumnya di sisi kanan.
 * Peran lain: tampilan baca saja sesuai hak akses.
 */
(function () {
  const App = (window.App = window.App || {});
  const ui = App.ui;
  const esc = ui.esc;
  App.pages = App.pages || {};

  const RANGES = {
    sis: [50, 260, 'Sistol'], dia: [30, 160, 'Diastol'], nadi: [20, 220, 'Nadi'], suhu: [30, 43, 'Suhu'],
    rr: [5, 60, 'Napas'], spo2: [50, 100, 'SpO₂'], bb: [1, 300, 'Berat badan'], tb: [30, 250, 'Tinggi badan'],
  };

  function num(id, label, unit, val, extra) {
    return `<div><label class="label" for="${id}">${label}</label>
      <div class="relative"><input id="${id}" class="field ident pr-12" inputmode="decimal" autocomplete="off" value="${esc(val == null ? '' : val)}" ${extra || ''}>
      <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-ink-500">${unit}</span></div></div>`;
  }

  function historyPanel(p, current) {
    const prev = App.store.visitsOf(p.id).filter((v) => v.id !== current.id).slice(0, 5);
    return `<section class="panel" aria-labelledby="h-prev">
      <div class="panel-head"><h2 id="h-prev" class="text-sm font-semibold">Riwayat sebelumnya</h2><a class="text-xs font-medium text-brand-700 hover:underline" href="#/pasien/${p.id}">Buka semua</a></div>
      ${
        prev.length
          ? `<ul class="divide-y divide-ink-100">${prev
              .map((v) => {
                const dx = v.diagnosis.find((d) => d.tipe === 'utama') || v.diagnosis[0];
                return `<li><a href="#/pasien/${p.id}?k=${v.id}" class="block px-4 py-3 hover:bg-brand-50/60">
                  <div class="flex items-center justify-between gap-2 text-xs text-ink-500"><span>${ui.fmtDate(v.tglMasuk)}</span><span>${v.jenis === 'RI' ? 'Rawat inap' : esc(v.poli)}</span></div>
                  <div class="mt-0.5 text-sm font-medium">${dx ? esc(dx.nama) : '<span class="font-normal text-ink-500">Tanpa diagnosis</span>'}</div>
                  ${v.terapi.length ? `<div class="mt-0.5 truncate text-xs text-ink-600">${esc(v.terapi.slice(0, 2).join(', '))}</div>` : ''}</a></li>`;
              })
              .join('')}</ul>`
          : ui.empty('Belum ada riwayat', 'Ini kunjungan pertama pasien.')
      }
    </section>`;
  }

  App.pages.visitDetail = {
    title: (ctx) => {
      const v = App.store.visit(ctx.params.id);
      return v ? `Kunjungan ${v.nomor}` : 'Kunjungan tidak ditemukan';
    },
    render(ctx) {
      const store = App.store;
      const v = store.visit(ctx.params.id);
      if (!v) return `<div class="mx-auto max-w-md py-16 text-center"><h1 class="text-xl font-semibold">Kunjungan tidak ditemukan</h1><a class="btn btn-primary mt-5" href="#/kunjungan">Ke daftar kunjungan</a></div>`;
      const p = store.patient(v.patientId);
      const full = App.auth.can('history.full');
      const editable = App.auth.can('visit.examine') && ['Terdaftar', 'Diperiksa', 'Dirawat'].includes(v.status);
      const vt = v.vital || {};
      const [sis, dia] = String(vt.td || '/').split('/');

      const header = `
      <div><a href="#/kunjungan" class="inline-flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-900">${App.icon('arrow-left', 'size-4')}Daftar kunjungan</a></div>
      <header class="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 class="text-2xl font-semibold tracking-tight">Kunjungan <span class="ident">${esc(v.nomor)}</span></h1>
          <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-ink-600">${ui.jenisBadge(v.jenis)}${ui.statusBadge(v.status)}<span>${esc(App.views.layananText(v))}</span><span>Masuk ${ui.fmtDateTime(v.tglMasuk)}</span>${v.tglKeluar ? `<span>Pulang ${ui.fmtDateTime(v.tglKeluar)}</span>` : ''}<span>${esc(App.views.userName(v.dokterId))}${v.jenis === 'RI' ? ' (DPJP)' : ''}</span></div>
        </div>
      </header>
      <section class="panel mt-4 flex flex-wrap items-center justify-between gap-3 px-4 py-3" aria-label="Pasien">
        <div class="flex items-center gap-3">${ui.avatar(p.nama)}<div><a class="font-semibold hover:underline" href="#/pasien/${p.id}">${esc(p.nama)}</a><div class="text-sm text-ink-600"><span class="ident">${esc(p.noRM)}</span>, ${esc(App.views.patientHeadline(p))}${p.golDarah ? ', gol. darah ' + esc(p.golDarah) : ''}, ${esc(v.penjamin)}</div></div></div>
        <a class="btn btn-secondary btn-sm" href="#/pasien/${p.id}">Profil dan riwayat</a>
      </section>
      ${p.alergi.length ? `<div class="mt-3">${ui.alertBox('warn', `<strong>Alergi:</strong> ${p.alergi.map(esc).join(', ')}. Periksa sebelum meresepkan obat.`)}</div>` : ''}`;

      if (!editable) {
        return `${header}
        <div class="mt-6 grid gap-6 ${full ? 'lg:grid-cols-[minmax(0,1fr)_20rem]' : ''}">
          <section class="panel" aria-labelledby="h-rekam"><div class="panel-head"><h2 id="h-rekam" class="text-sm font-semibold">Catatan pemeriksaan</h2></div>
            <div class="p-4"><dl class="mb-4"><dt class="text-xs font-medium text-ink-500">Keluhan utama</dt><dd class="mt-1 text-sm">${esc(v.keluhan)}</dd></dl>
            ${full || v.diagnosis.length ? App.views.visitBody(v, { full }) : ''}
            ${v.status === 'Terdaftar' && App.auth.can('visit.examine') === false ? `<p class="mt-4 text-sm text-ink-500">Pemeriksaan belum dimulai. Hasil akan muncul setelah tenaga medis mengisinya.</p>` : ''}
            ${v.diperbaruiOleh ? `<p class="mt-4 border-t border-ink-100 pt-3 text-xs text-ink-500">Terakhir diisi oleh ${esc(App.views.userName(v.diperbaruiOleh))}.</p>` : ''}</div></section>
          ${full ? `<aside>${historyPanel(p, v)}</aside>` : ''}
        </div>`;
      }

      const ri = v.jenis === 'RI';
      return `${header}
      <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <form id="exam" class="space-y-6" novalidate>
          <section class="panel" aria-labelledby="s-vital">
            <div class="panel-head"><h2 id="s-vital" class="text-sm font-semibold">Keluhan dan tanda vital</h2></div>
            <div class="p-4">
              <dl class="mb-4"><dt class="text-xs font-medium text-ink-500">Keluhan utama saat pendaftaran</dt><dd class="mt-1 text-sm">${esc(v.keluhan)}</dd></dl>
              <div class="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
                ${num('sis', 'Sistol', 'mmHg', sis)}${num('dia', 'Diastol', 'mmHg', dia)}${num('nadi', 'Nadi', 'x/mnt', vt.nadi)}${num('suhu', 'Suhu', '°C', vt.suhu)}
                ${num('rr', 'Napas', 'x/mnt', vt.rr)}${num('spo2', 'SpO₂', '%', vt.spo2)}${num('bb', 'Berat', 'kg', vt.bb)}${num('tb', 'Tinggi', 'cm', vt.tb)}
              </div>
              <p class="err hidden mt-2" id="err-vital" role="alert"></p>
            </div>
          </section>

          <section class="panel" aria-labelledby="s-anam">
            <div class="panel-head"><h2 id="s-anam" class="text-sm font-semibold">Anamnesis dan pemeriksaan fisik</h2></div>
            <div class="space-y-4 p-4">
              <div><label class="label" for="anamnesis">Anamnesis <span class="text-rose-700" aria-hidden="true">*</span></label><textarea id="anamnesis" class="field" rows="3">${esc(v.anamnesis)}</textarea><p class="err hidden" id="err-anamnesis" role="alert"></p></div>
              <div><label class="label" for="fisik">Pemeriksaan fisik</label><textarea id="fisik" class="field" rows="3">${esc(v.fisik)}</textarea></div>
            </div>
          </section>

          <section class="panel" aria-labelledby="s-dx">
            <div class="panel-head"><h2 id="s-dx" class="text-sm font-semibold">Diagnosis</h2><span class="text-xs text-ink-500">ICD-10</span></div>
            <div class="p-4">
              <div id="dx-list" class="mb-3 space-y-2"></div>
              <label class="label" for="dx-q">Tambah diagnosis</label>
              <div class="relative">
                <input id="dx-q" class="field" type="search" placeholder="Ketik nama atau kode, misalnya hipertensi atau I10" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="dx-opts" aria-autocomplete="list">
                <ul id="dx-opts" role="listbox" class="absolute z-10 mt-1 hidden max-h-64 w-full overflow-auto rounded-md border border-ink-200 bg-white py-1 shadow-lg"></ul>
              </div>
              <p class="err hidden" id="err-dx" role="alert"></p>
            </div>
          </section>

          <section class="panel" aria-labelledby="s-plan">
            <div class="panel-head"><h2 id="s-plan" class="text-sm font-semibold">Tindakan, terapi, dan tindak lanjut</h2></div>
            <div class="space-y-4 p-4">
              <div><label class="label" for="tindakan-input">Tindakan</label><div id="tindakan"></div><datalist id="dl-tindakan">${App.suggest.tindakan().map((x) => `<option value="${esc(x)}">`).join('')}</datalist><p class="hint">Enter untuk menambah. Saran muncul dari tindakan yang pernah dipakai.</p></div>
              <div><label class="label" for="terapi-input">Terapi dan resep</label><div id="terapi"></div><datalist id="dl-terapi">${App.suggest.terapi().map((x) => `<option value="${esc(x)}">`).join('')}</datalist>${p.alergi.length ? `<p class="hint text-amber-800">Pasien alergi: ${p.alergi.map(esc).join(', ')}.</p>` : ''}</div>
              <div><label class="label" for="lanjut">Rencana tindak lanjut${ri ? ' <span class="text-rose-700" aria-hidden="true">*</span>' : ''}</label><textarea id="lanjut" class="field" rows="2" placeholder="Contoh: kontrol 1 minggu, pantau tekanan darah">${esc(v.lanjut)}</textarea><p class="err hidden" id="err-lanjut" role="alert"></p></div>
            </div>
          </section>

          <div class="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-end gap-2 border-t border-ink-200 bg-white/95 px-4 py-3 backdrop-blur lg:mx-0 lg:rounded-lg lg:border">
            <span class="mr-auto text-xs text-ink-500" id="save-note" role="status"></span>
            <button type="button" class="btn btn-secondary" data-save>Simpan sementara</button>
            <button type="button" class="btn btn-primary" data-finish>${ri ? 'Pulangkan pasien' : 'Selesaikan pemeriksaan'}</button>
          </div>
        </form>
        <aside class="space-y-6 lg:sticky lg:top-20 lg:self-start">${historyPanel(p, v)}</aside>
      </div>`;
    },

    mount(root, ctx) {
      const store = App.store;
      const v = store.visit(ctx.params.id);
      const form = root.querySelector('#exam');
      if (!v || !form) return;
      const $ = (id) => root.querySelector('#' + id);
      const ri = v.jenis === 'RI';

      const tindakan = ui.tagInput($('tindakan'), { values: v.tindakan, placeholder: 'Tambah tindakan', listId: 'dl-tindakan', label: 'Tambah tindakan' });
      const terapi = ui.tagInput($('terapi'), { values: v.terapi, placeholder: 'Tambah obat atau terapi', listId: 'dl-terapi', label: 'Tambah terapi' });

      /* Diagnosis */
      let dx = v.diagnosis.map((d) => Object.assign({}, d));
      const icd = App.icd.list();
      const dxList = $('dx-list');
      const dxq = $('dx-q');
      const dxo = $('dx-opts');
      let opts = [];
      let active = -1;

      function drawDx() {
        dxList.innerHTML = dx.length
          ? dx.map((d, i) => `<div class="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-ink-200 bg-ink-50 px-3 py-2">
              <span class="ident rounded bg-white px-1.5 py-0.5 text-xs text-ink-700 ring-1 ring-ink-200">${esc(d.kode || '-')}</span>
              <span class="min-w-0 flex-1 text-sm ${d.tipe === 'utama' ? 'font-semibold' : ''}">${esc(d.nama)}</span>
              <label class="inline-flex cursor-pointer items-center gap-1.5 text-xs text-ink-700"><input type="radio" name="utama" class="size-3.5 accent-brand-600" data-main="${i}" ${d.tipe === 'utama' ? 'checked' : ''}>Diagnosis utama</label>
              <button type="button" class="rounded p-1 text-ink-500 hover:bg-ink-200 hover:text-ink-900" data-rm="${i}" aria-label="Hapus ${esc(d.nama)}">${App.icon('x', 'size-4')}</button></div>`).join('')
          : `<p class="text-sm text-ink-500">Belum ada diagnosis. Tambahkan minimal satu sebelum menyelesaikan pemeriksaan.</p>`;
      }
      function addDx(d) {
        if (dx.some((x) => x.kode === d.kode && x.nama === d.nama)) return;
        dx.push({ kode: d.kode, nama: d.nama, tipe: dx.some((x) => x.tipe === 'utama') ? 'sekunder' : 'utama' });
        drawDx();
        $('err-dx').classList.add('hidden');
      }
      function closeOpts() {
        dxo.classList.add('hidden');
        dxq.setAttribute('aria-expanded', 'false');
        active = -1;
      }
      function drawOpts() {
        const raw = dxq.value.trim();
        const q = ui.norm(raw);
        if (q.length < 1) return closeOpts();
        opts = icd.filter((d) => ui.norm(d.nama).includes(q) || ui.norm(d.kode).includes(q)).slice(0, 8);
        const free = raw.length >= 3 && !opts.some((o) => ui.norm(o.nama) === q);
        dxo.innerHTML =
          opts.map((o, i) => `<li role="option" id="dxo-${i}" data-i="${i}" aria-selected="${i === active}" class="flex cursor-pointer items-baseline gap-3 px-3 py-2 text-sm aria-selected:bg-brand-50 hover:bg-brand-50"><span class="ident w-14 shrink-0 text-xs text-ink-500">${esc(o.kode)}</span><span>${ui.hl(o.nama, [q])}</span></li>`).join('') +
          (free ? `<li role="option" id="dxo-${opts.length}" data-free class="cursor-pointer border-t border-ink-100 px-3 py-2 text-sm text-ink-700 hover:bg-brand-50 aria-selected:bg-brand-50" aria-selected="${active === opts.length}">Tambahkan “${esc(raw)}” sebagai diagnosis bebas (tanpa kode)</li>` : '') ||
          `<li class="px-3 py-3 text-sm text-ink-600">Tidak ada diagnosis yang cocok.</li>`;
        dxo.classList.remove('hidden');
        dxq.setAttribute('aria-expanded', 'true');
        dxo._free = free ? raw : null;
      }
      function choose(i) {
        if (i < opts.length) addDx(opts[i]);
        else if (dxo._free) addDx({ kode: '', nama: dxo._free });
        dxq.value = '';
        closeOpts();
        dxq.focus();
      }
      dxq.addEventListener('input', ui.debounce(() => { active = -1; drawOpts(); }, 80));
      dxq.addEventListener('keydown', (e) => {
        const n = opts.length + (dxo._free ? 1 : 0);
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          if (!n) return;
          e.preventDefault();
          active = (active + (e.key === 'ArrowDown' ? 1 : -1) + n) % n;
          drawOpts();
          dxq.setAttribute('aria-activedescendant', 'dxo-' + active);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (active >= 0) choose(active);
          else if (n === 1) choose(0);
        } else if (e.key === 'Escape') closeOpts();
      });
      dxo.addEventListener('mousedown', (e) => {
        const li = e.target.closest('li[role=option]');
        if (!li) return;
        e.preventDefault();
        choose(li.hasAttribute('data-free') ? opts.length : Number(li.dataset.i));
      });
      dxq.addEventListener('blur', () => setTimeout(closeOpts, 120));
      dxList.addEventListener('click', (e) => {
        const b = e.target.closest('[data-rm]');
        if (!b) return;
        const wasMain = dx[Number(b.dataset.rm)].tipe === 'utama';
        dx.splice(Number(b.dataset.rm), 1);
        if (wasMain && dx.length) dx[0].tipe = 'utama';
        drawDx();
      });
      dxList.addEventListener('change', (e) => {
        if (e.target.dataset.main == null) return;
        dx.forEach((d, i) => (d.tipe = i === Number(e.target.dataset.main) ? 'utama' : 'sekunder'));
        drawDx();
      });
      drawDx();

      /* Pengumpulan dan validasi */
      const val = (id) => $(id).value.trim().replace(',', '.');
      function setErr(id, msg) {
        const e = $('err-' + id);
        if (!e) return;
        e.textContent = msg || '';
        e.classList.toggle('hidden', !msg);
        const el = $(id);
        if (el) msg ? el.setAttribute('aria-invalid', 'true') : el.removeAttribute('aria-invalid');
      }
      function vitalError() {
        for (const k of Object.keys(RANGES)) {
          const raw = val(k);
          if (!raw) continue;
          const n = Number(raw);
          const [min, max, label] = RANGES[k];
          if (!isFinite(n) || n < min || n > max) {
            $(k).setAttribute('aria-invalid', 'true');
            return { id: k, msg: `${label} harus berupa angka antara ${min} dan ${max}.` };
          }
          $(k).removeAttribute('aria-invalid');
        }
        if (!!val('sis') !== !!val('dia')) return { id: val('sis') ? 'dia' : 'sis', msg: 'Isi sistol dan diastol sekaligus.' };
        if (val('sis') && Number(val('sis')) <= Number(val('dia'))) return { id: 'sis', msg: 'Sistol harus lebih besar dari diastol.' };
        return null;
      }
      function collect() {
        const any = ['sis', 'dia', 'nadi', 'suhu', 'rr', 'spo2', 'bb', 'tb'].some((k) => val(k));
        const n = (k) => (val(k) ? Number(val(k)) : '');
        return {
          vital: any ? { td: val('sis') ? `${val('sis')}/${val('dia')}` : '', nadi: n('nadi'), suhu: n('suhu'), rr: n('rr'), spo2: n('spo2'), bb: n('bb'), tb: n('tb') } : null,
          anamnesis: $('anamnesis').value.trim(),
          fisik: $('fisik').value.trim(),
          diagnosis: dx.map((d) => Object.assign({}, d)),
          tindakan: tindakan.get(),
          terapi: terapi.get(),
          lanjut: $('lanjut').value.trim(),
        };
      }
      function validate(finishing) {
        let first = null;
        const ve = vitalError();
        setErr('vital', ve ? ve.msg : '');
        if (ve) first = first || ve.id;
        if (finishing) {
          if ($('anamnesis').value.trim().length < 3) { setErr('anamnesis', 'Anamnesis wajib diisi sebelum pemeriksaan diselesaikan.'); first = first || 'anamnesis'; } else setErr('anamnesis', '');
          if (!dx.length) { setErr('dx', 'Tambahkan minimal satu diagnosis.'); first = first || 'dx-q'; } else setErr('dx', '');
          if (ri && !$('lanjut').value.trim()) { setErr('lanjut', 'Isi rencana tindak lanjut untuk pasien yang dipulangkan.'); first = first || 'lanjut'; } else setErr('lanjut', '');
        }
        if (first) {
          const el = $(first);
          el.scrollIntoView({ block: 'center' });
          el.focus();
          return false;
        }
        return true;
      }
      const note = $('save-note');

      form.querySelector('[data-save]').addEventListener('click', () => {
        if (!validate(false)) return;
        store.updateVisit(v.id, Object.assign(collect(), { status: ri ? 'Dirawat' : 'Diperiksa' }), 'Menyimpan pemeriksaan');
        note.textContent = `Tersimpan pukul ${ui.fmtTime(ui.toISO(new Date()))}`;
        ui.toast('Pemeriksaan disimpan sementara.');
      });

      form.querySelector('[data-finish]').addEventListener('click', async () => {
        if (!validate(true)) return;
        const p = store.patient(v.patientId);
        const ok = await ui.confirm({
          title: ri ? 'Pulangkan pasien?' : 'Selesaikan pemeriksaan?',
          message: ri
            ? `${esc(p.nama)} akan dipulangkan dan tercatat selesai dirawat. Catatan tidak dapat diubah lagi setelah ini.`
            : `Pemeriksaan ${esc(p.nama)} akan ditandai selesai. Catatan tidak dapat diubah lagi setelah ini.`,
          confirmText: ri ? 'Pulangkan' : 'Selesaikan',
        });
        if (!ok) return;
        const patch = Object.assign(collect(), { status: ri ? 'Pulang' : 'Selesai' });
        if (ri) patch.tglKeluar = ui.toISO(new Date());
        store.updateVisit(v.id, patch, ri ? 'Memulangkan pasien rawat inap' : 'Menyelesaikan pemeriksaan');
        ui.toast(ri ? 'Pasien dipulangkan.' : 'Pemeriksaan selesai.');
        App.router.go('/kunjungan/' + v.id);
      });

      form.addEventListener('submit', (e) => e.preventDefault());
    },
  };
})();
