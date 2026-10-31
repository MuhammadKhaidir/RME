/*
 * Formulir pasien baru / ubah data.
 * No. RM dibuat otomatis. Selama mengetik, sistem mengecek NIK dan kombinasi
 * nama + tanggal lahir supaya satu orang tidak punya dua nomor RM.
 */
(function () {
  const App = (window.App = window.App || {});
  const ui = App.ui;
  const esc = ui.esc;
  App.pages = App.pages || {};

  function field(id, label, control, extra) {
    const e = extra || {};
    return `<div class="${e.cls || ''}">
      ${e.legend ? `<span class="label" id="lbl-${id}">` : `<label class="label" for="${id}">`}${label}${e.required ? ' <span class="text-rose-700" aria-hidden="true">*</span>' : ''}${e.legend ? '</span>' : '</label>'}
      ${control}
      ${e.hint ? `<p class="hint" id="hint-${id}">${e.hint}</p>` : ''}
      <p class="err hidden" id="err-${id}" role="alert"></p>
    </div>`;
  }
  const opts = (arr, sel, blank) => (blank ? `<option value="">${blank}</option>` : '') + arr.map((x) => `<option ${x === sel ? 'selected' : ''}>${esc(x)}</option>`).join('');

  App.pages.patientForm = {
    title: (ctx) => (ctx.params.id ? 'Ubah data pasien' : 'Pasien baru'),
    render(ctx) {
      const editing = !!ctx.params.id;
      const p = editing ? App.store.patient(ctx.params.id) : null;
      if (editing && !p) return App.pages.notFound.render();
      const d = p || { nama: '', nik: '', tempatLahir: '', tglLahir: '', jk: '', golDarah: '', statusKawin: '', pekerjaan: '', alamat: '', noHp: '', penjamin: '', noPenjamin: '', kontak: { nama: '', hubungan: '', noHp: '' }, alergi: [] };
      const today = ui.toDateStr(new Date());

      return `
      <div><a href="${editing ? '#/pasien/' + p.id : '#/pasien'}" class="inline-flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-900">${App.icon('arrow-left', 'size-4')}${editing ? 'Kembali ke ' + esc(p.nama) : 'Daftar pasien'}</a></div>
      <header class="mt-3 max-w-3xl">
        <h1 class="text-2xl font-semibold tracking-tight">${editing ? 'Ubah data pasien' : 'Pendaftaran pasien baru'}</h1>
        <p class="mt-1 text-sm text-ink-600">Isi identitas sesuai KTP atau kartu identitas lain. Kolom bertanda <span class="text-rose-700">*</span> wajib diisi.</p>
      </header>

      <form id="pf" class="mt-6 max-w-3xl space-y-6" novalidate>
        <div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink-200 bg-white px-4 py-3">
          <div><div class="text-xs text-ink-500">No. RM</div><div class="ident text-xl font-medium" id="rm-show">${esc(editing ? p.noRM : App.store.peekRM())}</div></div>
          <p class="max-w-xs text-xs text-ink-500">${editing ? 'No. RM tidak dapat diubah supaya riwayat pasien tetap utuh.' : 'Dibuat otomatis oleh sistem saat data disimpan dan tidak akan dipakai pasien lain.'}</p>
        </div>

        <div id="dup" aria-live="polite" class="space-y-3 empty:hidden"></div>

        <section class="panel" aria-labelledby="s-identitas">
          <div class="panel-head"><h2 id="s-identitas" class="text-sm font-semibold">Identitas</h2></div>
          <div class="grid gap-x-5 gap-y-4 p-4 sm:grid-cols-2">
            ${field('nama', 'Nama lengkap', `<input id="nama" name="nama" class="field" value="${esc(d.nama)}" autocomplete="off" required>`, { required: true, cls: 'sm:col-span-2' })}
            ${field('nik', 'NIK', `<input id="nik" name="nik" class="field ident" inputmode="numeric" maxlength="16" value="${esc(d.nik)}" autocomplete="off" aria-describedby="hint-nik err-nik" required>`, { required: true, hint: '<span id="nik-count">0</span> dari 16 digit' })}
            ${field('jk', 'Jenis kelamin', `<div class="flex h-9 items-center gap-5" role="radiogroup" aria-labelledby="lbl-jk">${[['L', 'Laki-laki'], ['P', 'Perempuan']].map(([v, l]) => `<label class="inline-flex cursor-pointer items-center gap-2 text-sm"><input type="radio" name="jk" value="${v}" class="size-4 accent-brand-600" ${d.jk === v ? 'checked' : ''}>${l}</label>`).join('')}</div>`, { required: true, legend: true })}
            ${field('tempatLahir', 'Tempat lahir', `<input id="tempatLahir" name="tempatLahir" class="field" value="${esc(d.tempatLahir)}" required>`, { required: true })}
            ${field('tglLahir', 'Tanggal lahir', `<input id="tglLahir" name="tglLahir" type="date" max="${today}" class="field" value="${esc(d.tglLahir)}" required>`, { required: true, hint: '<span id="age-show">&nbsp;</span>' })}
            ${field('golDarah', 'Golongan darah', `<select id="golDarah" name="golDarah" class="field">${opts(App.config.golDarah, d.golDarah, 'Tidak diketahui')}</select>`)}
            ${field('statusKawin', 'Status perkawinan', `<select id="statusKawin" name="statusKawin" class="field">${opts(App.config.statusKawin, d.statusKawin, 'Pilih status')}</select>`)}
            ${field('pekerjaan', 'Pekerjaan', `<input id="pekerjaan" name="pekerjaan" class="field" value="${esc(d.pekerjaan)}">`, { cls: 'sm:col-span-2' })}
          </div>
        </section>

        <section class="panel" aria-labelledby="s-kontak">
          <div class="panel-head"><h2 id="s-kontak" class="text-sm font-semibold">Alamat dan kontak</h2></div>
          <div class="grid gap-x-5 gap-y-4 p-4 sm:grid-cols-2">
            ${field('alamat', 'Alamat', `<textarea id="alamat" name="alamat" class="field" rows="2" required>${esc(d.alamat)}</textarea>`, { required: true, cls: 'sm:col-span-2' })}
            ${field('noHp', 'No. HP', `<input id="noHp" name="noHp" type="tel" class="field ident" value="${esc(d.noHp)}" autocomplete="off" required>`, { required: true })}
            <div></div>
            ${field('kontakNama', 'Kontak darurat: nama', `<input id="kontakNama" name="kontakNama" class="field" value="${esc(d.kontak.nama)}">`)}
            ${field('kontakHubungan', 'Hubungan', `<select id="kontakHubungan" name="kontakHubungan" class="field">${opts(App.config.hubunganKontak, d.kontak.hubungan, 'Pilih hubungan')}</select>`)}
            ${field('kontakHp', 'Kontak darurat: No. HP', `<input id="kontakHp" name="kontakHp" type="tel" class="field ident" value="${esc(d.kontak.noHp)}">`)}
          </div>
        </section>

        <section class="panel" aria-labelledby="s-penjamin">
          <div class="panel-head"><h2 id="s-penjamin" class="text-sm font-semibold">Penjamin dan alergi</h2></div>
          <div class="grid gap-x-5 gap-y-4 p-4 sm:grid-cols-2">
            ${field('penjamin', 'Penjamin', `<select id="penjamin" name="penjamin" class="field">${opts(App.config.penjamin, d.penjamin, 'Pilih penjamin')}</select>`, { required: true })}
            ${field('noPenjamin', '<span id="lbl-nopenjamin">No. kartu penjamin</span>', `<input id="noPenjamin" name="noPenjamin" class="field ident" value="${esc(d.noPenjamin)}" autocomplete="off">`)}
            <div class="sm:col-span-2">
              <label class="label" for="alergi-input">Alergi</label>
              <div id="alergi" data-tags></div>
              <p class="hint">Ketik lalu tekan Enter. Kosongkan bila pasien tidak punya alergi yang diketahui. Alergi akan tampil sebagai peringatan di setiap halaman pasien.</p>
            </div>
          </div>
        </section>

        <div class="flex flex-wrap justify-end gap-2 pb-4">
          <a class="btn btn-secondary" href="${editing ? '#/pasien/' + p.id : '#/pasien'}">Batal</a>
          <button class="btn btn-primary" type="submit">${editing ? 'Simpan perubahan' : 'Simpan pasien'}</button>
        </div>
      </form>`;
    },

    mount(root, ctx) {
      const editing = !!ctx.params.id;
      const p = editing ? App.store.patient(ctx.params.id) : null;
      if (editing && !p) return;
      const form = root.querySelector('#pf');
      const dup = root.querySelector('#dup');
      const tags = ui.tagInput(root.querySelector('#alergi'), { values: p ? p.alergi : [], placeholder: 'Contoh: penisilin', label: 'Tambah alergi' });
      const $ = (id) => root.querySelector('#' + id);
      let dupState = { nikMatch: null, similar: [] };

      function setErr(id, msg) {
        const el = $(id);
        const e = $('err-' + id);
        if (!e) return;
        e.textContent = msg || '';
        e.classList.toggle('hidden', !msg);
        if (el) {
          if (msg) el.setAttribute('aria-invalid', 'true');
          else el.removeAttribute('aria-invalid');
        }
      }

      function updateAge() {
        const v = $('tglLahir').value;
        $('age-show').innerHTML = v ? `Usia ${esc(ui.age(v).text)}` : '&nbsp;';
      }

      function checkDup() {
        dupState = App.store.findDuplicates({ nik: $('nik').value.trim(), nama: $('nama').value, tglLahir: $('tglLahir').value, excludeId: editing ? p.id : null });
        let html = '';
        if (dupState.nikMatch) {
          const m = dupState.nikMatch;
          html += ui.alertBox('danger', `<strong>NIK ini sudah terdaftar</strong> atas nama ${esc(m.nama)} (No. RM <span class="ident">${esc(m.noRM)}</span>). Pasien tidak boleh punya dua nomor RM. <a class="font-medium underline" href="#/pasien/${m.id}">Buka riwayat pasien tersebut</a>.`);
        }
        if (dupState.similar.length) {
          html += `<div class="rounded-md border border-amber-300 bg-amber-50 px-3.5 py-3 text-sm text-amber-950">
            <div class="flex items-start gap-3">${App.icon('alert', 'mt-0.5 size-4 shrink-0')}<div><strong>Ada pasien dengan nama mirip dan tanggal lahir yang sama.</strong> Pastikan ini bukan orang yang sama.</div></div>
            <ul class="mt-2 divide-y divide-amber-200 rounded border border-amber-200 bg-white">${dupState.similar.map((m) => `<li class="flex items-center justify-between gap-3 px-3 py-2"><span class="min-w-0"><span class="block truncate font-medium">${esc(m.nama)}</span><span class="ident text-xs text-ink-600">${esc(m.noRM)}, lahir ${ui.fmtDate(m.tglLahir)}, ${esc(ui.maskNik(m.nik))}</span></span><a class="btn btn-secondary btn-sm shrink-0" href="#/pasien/${m.id}" target="_blank" rel="noopener">Periksa</a></li>`).join('')}</ul>
            <label class="mt-3 flex cursor-pointer items-start gap-2"><input type="checkbox" id="not-same" class="mt-0.5 size-4 accent-brand-600"><span>Saya sudah memeriksa, ini bukan pasien yang sama.</span></label>
          </div>`;
        }
        const checked = $('not-same') && $('not-same').checked;
        dup.innerHTML = html;
        if (checked && $('not-same')) $('not-same').checked = true;
      }

      function updatePenjamin() {
        const v = $('penjamin').value;
        const lbl = $('lbl-nopenjamin');
        lbl.textContent = v === 'BPJS Kesehatan' ? 'No. kartu BPJS (13 digit)' : v === 'Asuransi Swasta' ? 'No. polis asuransi' : 'No. kartu penjamin';
        $('noPenjamin').disabled = v === 'Umum / Mandiri';
        if (v === 'Umum / Mandiri') $('noPenjamin').value = '';
      }

      function validate() {
        const err = {};
        const v = (id) => $(id).value.trim();
        if (v('nama').length < 3) err.nama = 'Nama lengkap wajib diisi (minimal 3 huruf).';
        if (!/^\d{16}$/.test(v('nik'))) err.nik = 'NIK harus 16 digit angka.';
        else if (dupState.nikMatch) err.nik = 'NIK ini sudah terdaftar. Buka riwayat pasien yang ada.';
        if (!form.jk.value) err.jk = 'Pilih jenis kelamin.';
        if (!v('tempatLahir')) err.tempatLahir = 'Tempat lahir wajib diisi.';
        if (!v('tglLahir')) err.tglLahir = 'Tanggal lahir wajib diisi.';
        else if (v('tglLahir') > ui.toDateStr(new Date())) err.tglLahir = 'Tanggal lahir tidak boleh setelah hari ini.';
        if (!v('alamat')) err.alamat = 'Alamat wajib diisi.';
        if (!/^[0-9+\-\s]{8,18}$/.test(v('noHp'))) err.noHp = 'Isi No. HP yang valid, misalnya 0812-3456-7890.';
        if (!v('penjamin')) err.penjamin = 'Pilih penjamin.';
        else if (v('penjamin') === 'BPJS Kesehatan' && !/^\d{13}$/.test(v('noPenjamin').replace(/\s/g, ''))) err.noPenjamin = 'No. kartu BPJS harus 13 digit angka.';
        else if (v('penjamin') === 'Asuransi Swasta' && !v('noPenjamin')) err.noPenjamin = 'No. polis asuransi wajib diisi.';
        if (dupState.similar.length && !(($('not-same') || {}).checked)) err.dup = 'Centang konfirmasi bahwa ini bukan pasien yang sama.';
        return err;
      }

      ['nama', 'nik', 'jk', 'tempatLahir', 'tglLahir', 'alamat', 'noHp', 'penjamin', 'noPenjamin', 'dup'].forEach((id) => setErr(id, ''));

      $('nik').addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 16);
        $('nik-count').textContent = e.target.value.length;
      });
      $('nik-count').textContent = $('nik').value.length;
      ['nama', 'nik', 'tglLahir'].forEach((id) => $(id).addEventListener('input', ui.debounce(checkDup, 150)));
      $('tglLahir').addEventListener('input', updateAge);
      $('penjamin').addEventListener('change', updatePenjamin);
      // Setelah sebuah kolom ditandai salah, periksa ulang saat pengguna mengetik atau pindah kolom.
      // checkDup dijalankan langsung (tanpa debounce) supaya status duplikat tidak basi.
      function revalidate(e) {
        if (e.target.name && e.target.hasAttribute('aria-invalid')) {
          checkDup();
          const err = validate();
          setErr(e.target.id, err[e.target.id] || '');
        }
      }
      form.addEventListener('focusout', revalidate);
      form.addEventListener('input', revalidate);

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        checkDup();
        const err = validate();
        ['nama', 'nik', 'jk', 'tempatLahir', 'tglLahir', 'alamat', 'noHp', 'penjamin', 'noPenjamin'].forEach((id) => setErr(id, err[id]));
        const keys = Object.keys(err);
        if (keys.length) {
          if (err.dup) ui.toast(err.dup, 'error');
          const first = ['nama', 'nik', 'jk', 'tempatLahir', 'tglLahir', 'alamat', 'noHp', 'penjamin', 'noPenjamin', 'dup'].find((k) => err[k]);
          const target = first === 'jk' ? form.querySelector('[name=jk]') : first === 'dup' ? dup : $(first);
          if (target) (target.scrollIntoView({ block: 'center' }), target.focus && target.focus());
          return;
        }
        const data = {
          nama: $('nama').value.trim().replace(/\s+/g, ' '),
          nik: $('nik').value.trim(),
          jk: form.jk.value,
          tempatLahir: $('tempatLahir').value.trim(),
          tglLahir: $('tglLahir').value,
          golDarah: $('golDarah').value,
          statusKawin: $('statusKawin').value,
          pekerjaan: $('pekerjaan').value.trim(),
          alamat: $('alamat').value.trim(),
          noHp: $('noHp').value.trim(),
          penjamin: $('penjamin').value,
          noPenjamin: $('noPenjamin').value.trim(),
          kontak: { nama: $('kontakNama').value.trim(), hubungan: $('kontakHubungan').value, noHp: $('kontakHp').value.trim() },
          alergi: tags.get(),
        };
        if (editing) {
          App.store.updatePatient(p.id, data);
          ui.toast('Perubahan disimpan.');
          App.router.go('/pasien/' + p.id);
        } else {
          const created = App.store.addPatient(data);
          ui.toast(`Pasien tersimpan dengan No. RM ${created.noRM}.`);
          App.router.go('/pasien/' + created.id + '?baru=1');
        }
      });

      updateAge();
      updatePenjamin();
      checkDup();
      $('nama').focus();
    },
  };
})();
