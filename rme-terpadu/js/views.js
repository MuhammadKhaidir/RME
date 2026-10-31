/* Potongan tampilan yang dipakai di beberapa halaman. */
(function () {
  const App = (window.App = window.App || {});
  const ui = App.ui;
  const esc = ui.esc;
  const views = (App.views = {});

  views.userName = (id) => {
    const u = App.store.user(id);
    return u ? u.nama : '-';
  };

  views.patientHeadline = function (p) {
    return `${ui.age(p.tglLahir).text}, ${p.jk === 'L' ? 'laki-laki' : 'perempuan'}`;
  };

  views.layananText = function (v) {
    return v.jenis === 'RI' ? `${v.ruang}${v.kamar ? ' ' + v.kamar : ''}${v.kelas ? ', ' + v.kelas : ''}` : v.poli;
  };

  /** Lama rawat dalam hari (RI) */
  views.lamaRawat = function (v) {
    if (v.jenis !== 'RI') return '';
    const a = ui.parse(v.tglMasuk);
    const b = v.tglKeluar ? ui.parse(v.tglKeluar) : new Date();
    const n = Math.max(1, ui.dayDiff(a, b));
    return `${n} hari`;
  };

  function block(label, inner) {
    return `<div><dt class="text-xs font-medium text-ink-500">${label}</dt><dd class="mt-1 text-sm text-ink-900">${inner}</dd></div>`;
  }

  function list(items, tokens) {
    if (!items || !items.length) return '<span class="text-ink-400">Tidak ada</span>';
    return `<ul class="space-y-0.5">${items.map((t) => `<li class="flex gap-2"><span class="mt-2 size-1 shrink-0 rounded-full bg-ink-400"></span><span>${ui.hl(t, tokens)}</span></li>`).join('')}</ul>`;
  }

  views.diagnosisList = function (dx, tokens) {
    if (!dx || !dx.length) return '<span class="text-ink-400">Belum ditetapkan</span>';
    return `<ul class="space-y-1">${dx
      .map(
        (d) =>
          `<li class="flex flex-wrap items-baseline gap-x-2"><span class="ident rounded bg-ink-100 px-1.5 py-0.5 text-xs text-ink-700">${ui.hl(d.kode || '-', tokens)}</span><span class="${d.tipe === 'utama' ? 'font-semibold' : ''}">${ui.hl(d.nama, tokens)}</span>${d.tipe === 'sekunder' ? '<span class="text-xs text-ink-500">sekunder</span>' : ''}</li>`
      )
      .join('')}</ul>`;
  };

  views.vitalChips = function (vt) {
    if (!vt) return '<span class="text-ink-400">Belum diukur</span>';
    const items = [
      vt.td ? ['Tekanan darah', `${vt.td}`, 'mmHg'] : null,
      vt.nadi ? ['Nadi', vt.nadi, 'x/mnt'] : null,
      vt.suhu ? ['Suhu', String(vt.suhu).replace('.', ','), '°C'] : null,
      vt.rr ? ['Napas', vt.rr, 'x/mnt'] : null,
      vt.spo2 ? ['SpO₂', vt.spo2, '%'] : null,
      vt.bb ? ['Berat', vt.bb, 'kg'] : null,
      vt.tb ? ['Tinggi', vt.tb, 'cm'] : null,
    ].filter(Boolean);
    return `<div class="flex flex-wrap gap-x-5 gap-y-2">${items
      .map(([l, val, unit]) => `<div><div class="text-xs text-ink-500">${l}</div><div class="ident text-sm font-medium">${esc(val)} <span class="font-sans text-xs font-normal text-ink-500">${unit}</span></div></div>`)
      .join('')}</div>`;
  };

  /**
   * Isi rincian satu kunjungan (hanya baca).
   * full=false: pengguna hanya boleh melihat ringkasan (diagnosis utama).
   */
  views.visitBody = function (v, opts) {
    const o = opts || {};
    const tokens = o.tokens || [];
    if (!o.full) {
      return `<dl class="grid gap-4 sm:grid-cols-2">${block('Diagnosis', views.diagnosisList(v.diagnosis.slice(0, 1), tokens))}${block('Keluhan utama', ui.hl(v.keluhan, tokens))}</dl>
        <p class="mt-3 text-xs text-ink-500">Rincian klinis (tanda vital, tindakan, terapi) hanya tampil untuk dokter, perawat, dan petugas rekam medis.</p>`;
    }
    return `<dl class="grid gap-x-8 gap-y-4 sm:grid-cols-2">
      <div class="sm:col-span-2"><dt class="text-xs font-medium text-ink-500">Tanda vital</dt><dd class="mt-1">${views.vitalChips(v.vital)}</dd></div>
      ${block('Keluhan dan anamnesis', v.anamnesis ? ui.hl(v.anamnesis, tokens) : esc(v.keluhan))}
      ${block('Pemeriksaan fisik', v.fisik ? ui.hl(v.fisik, tokens) : '<span class="text-ink-400">Belum diisi</span>')}
      ${block('Diagnosis', views.diagnosisList(v.diagnosis, tokens))}
      ${block('Tindakan', list(v.tindakan, tokens))}
      ${block('Terapi dan resep', list(v.terapi, tokens))}
      ${block('Rencana tindak lanjut', v.lanjut ? ui.hl(v.lanjut, tokens) : '<span class="text-ink-400">Belum diisi</span>')}
    </dl>`;
  };
})();
