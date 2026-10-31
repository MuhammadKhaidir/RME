/*
 * Satu basis data untuk seluruh halaman (disimpan di localStorage).
 * Pasien, kunjungan rawat jalan, dan rawat inap berada di satu tempat, jadi
 * riwayat satu pasien selalu utuh. Semua halaman membaca dan menulis lewat objek ini.
 *
 * Saat dihubungkan ke backend, ganti isi fungsi di sini dengan pemanggilan API.
 */
(function () {
  const App = (window.App = window.App || {});
  const ui = App.ui;
  const store = (App.store = {});
  let db = null;
  let warned = false;

  function persist() {
    if (!ui.storage.set(App.config.storageKey, db) && !warned) {
      warned = true;
      ui.toast('Penyimpanan browser tidak tersedia. Perubahan hilang saat halaman dimuat ulang.', 'error');
    }
  }

  store.init = function () {
    db = ui.storage.get(App.config.storageKey, null);
    if (!db || db.version !== 1) {
      db = App.seed.generate(new Date());
      persist();
    }
  };

  store.reset = function () {
    db = App.seed.generate(new Date());
    persist();
  };

  const nextId = (prefix) => prefix + ++db.counters.seq;

  /* ---------- Format ---------- */
  store.formatRM = function (n) {
    const s = String(n).padStart(6, '0');
    return `${s.slice(0, 2)}-${s.slice(2, 4)}-${s.slice(4, 6)}`;
  };
  store.rmDigits = (rm) => String(rm || '').replace(/\D/g, '');
  store.peekRM = () => store.formatRM(db.counters.rm + 1);

  /* ---------- Baca ---------- */
  store.users = () => db.users;
  store.user = (id) => db.users.find((u) => u.id === id) || null;
  store.patients = () => db.patients;
  store.patient = (id) => db.patients.find((p) => p.id === id) || null;
  store.visits = () => db.visits;
  store.visit = (id) => db.visits.find((v) => v.id === id) || null;
  store.audit = () => db.audit;
  store.dokter = () => db.users.filter((u) => u.role === 'klinisi' && u.profesi === 'Dokter' && u.aktif);

  const byDateDesc = (a, b) => (a.tglMasuk < b.tglMasuk ? 1 : a.tglMasuk > b.tglMasuk ? -1 : 0);
  store.visitsOf = (patientId) => db.visits.filter((v) => v.patientId === patientId).sort(byDateDesc);
  store.visitsByPatient = function () {
    const map = new Map();
    db.visits.slice().sort(byDateDesc).forEach((v) => {
      if (!map.has(v.patientId)) map.set(v.patientId, []);
      map.get(v.patientId).push(v);
    });
    return map;
  };
  store.activeAdmission = (patientId) => db.visits.find((v) => v.patientId === patientId && v.jenis === 'RI' && v.status === 'Dirawat') || null;
  store.sortedVisits = () => db.visits.slice().sort(byDateDesc);

  /* ---------- Duplikasi ---------- */
  function levenshtein(a, b) {
    const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++)
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return dp[a.length][b.length];
  }

  /**
   * Mencari kemungkinan pasien ganda.
   * nikMatch: NIK sama persis (pasti duplikat, tidak boleh disimpan)
   * similar : nama sama atau mirip (selisih ≤ 2 huruf) dengan tanggal lahir yang sama
   */
  store.findDuplicates = function ({ nik, nama, tglLahir, excludeId }) {
    const others = db.patients.filter((p) => p.id !== excludeId);
    const nikMatch = nik && nik.length === 16 ? others.find((p) => p.nik === nik) || null : null;
    let similar = [];
    const n = ui.norm(nama).replace(/\s+/g, ' ').trim();
    if (n.length >= 3 && tglLahir) {
      similar = others.filter((p) => {
        if (nikMatch && p.id === nikMatch.id) return false;
        if (p.tglLahir !== tglLahir) return false;
        const m = ui.norm(p.nama).replace(/\s+/g, ' ').trim();
        return m === n || levenshtein(m, n) <= 2;
      });
    }
    return { nikMatch, similar };
  };

  /* ---------- Tulis ---------- */
  store.addPatient = function (data) {
    // No. RM dibuat otomatis oleh sistem dan dijamin unik.
    let n = db.counters.rm + 1;
    while (db.patients.some((p) => store.rmDigits(p.noRM) === String(n).padStart(6, '0'))) n++;
    db.counters.rm = n;
    const u = App.auth.user();
    const p = Object.assign({}, data, {
      id: nextId('p'),
      noRM: store.formatRM(n),
      createdAt: ui.toISO(new Date()),
      createdBy: u ? u.id : null,
    });
    db.patients.push(p);
    persist();
    store.log('Mendaftarkan pasien', `${p.nama} (No. RM ${p.noRM})`, p.id);
    return p;
  };

  store.updatePatient = function (id, patch) {
    const p = store.patient(id);
    if (!p) return null;
    delete patch.noRM; // No. RM tidak boleh diubah
    Object.assign(p, patch);
    persist();
    store.log('Mengubah data pasien', `${p.nama} (No. RM ${p.noRM})`, p.id);
    return p;
  };

  store.addVisit = function (data) {
    const now = new Date();
    const key = data.jenis + '-' + ui.toDateStr(now).slice(2).replace(/-/g, '');
    const count = db.visits.filter((v) => v.nomor.startsWith(key)).length + 1;
    const u = App.auth.user();
    const v = Object.assign(
      {
        vital: null, anamnesis: '', fisik: '', diagnosis: [], tindakan: [], terapi: [], lanjut: '', tglKeluar: null,
        ruang: '', kelas: '', kamar: '', poli: '', diperbaruiOleh: null,
      },
      data,
      {
        id: nextId('v'),
        nomor: `${key}-${String(count).padStart(3, '0')}`,
        tglMasuk: ui.toISO(now),
        status: data.jenis === 'RI' ? 'Dirawat' : 'Terdaftar',
        dibuatOleh: u ? u.id : null,
      }
    );
    db.visits.push(v);
    persist();
    const p = store.patient(v.patientId);
    store.log('Mendaftarkan kunjungan', `${v.nomor} untuk ${p ? p.nama : '-'}`, v.patientId);
    return v;
  };

  store.updateVisit = function (id, patch, logText) {
    const v = store.visit(id);
    if (!v) return null;
    const u = App.auth.user();
    Object.assign(v, patch, { diperbaruiOleh: u ? u.id : null });
    persist();
    const p = store.patient(v.patientId);
    store.log(logText || 'Menyimpan pemeriksaan', `${v.nomor} untuk ${p ? p.nama : '-'}`, v.patientId);
    return v;
  };

  store.addUser = function (data) {
    const u = Object.assign({ profesi: '', spesialis: '', aktif: true }, data, { id: nextId('u') });
    db.users.push(u);
    persist();
    store.log('Menambah pengguna', `${u.nama} (${u.username})`);
    return u;
  };
  store.updateUser = function (id, patch) {
    const u = store.user(id);
    if (!u) return null;
    Object.assign(u, patch);
    persist();
    store.log('Mengubah pengguna', `${u.nama} (${u.username})`);
    return u;
  };

  /* ---------- Log aktivitas ---------- */
  store.log = function (aksi, detail, patientId) {
    const u = App.auth.user();
    db.audit.unshift({
      id: nextId('a'),
      ts: ui.toISO(new Date()),
      userId: u ? u.id : null,
      nama: u ? u.nama : 'Sistem',
      role: u ? u.role : '-',
      aksi,
      detail: detail || '',
      patientId: patientId || null,
    });
    if (db.audit.length > 600) db.audit.length = 600;
    persist();
  };

  /* ---------- Preferensi per pengguna (terakhir dilihat, pencarian terakhir) ---------- */
  function prefKey(name) {
    const u = App.auth.user();
    return `rme-terpadu.${name}.${u ? u.id : 'anon'}`;
  }
  store.recentPatients = () => ui.storage.get(prefKey('recent'), []).map((id) => store.patient(id)).filter(Boolean);
  store.pushRecent = function (patientId) {
    const list = ui.storage.get(prefKey('recent'), []).filter((id) => id !== patientId);
    list.unshift(patientId);
    ui.storage.set(prefKey('recent'), list.slice(0, 6));
  };
  store.recentSearches = () => ui.storage.get(prefKey('searches'), []);
  store.pushSearch = function (q) {
    q = String(q || '').trim();
    if (q.length < 2) return;
    const list = ui.storage.get(prefKey('searches'), []).filter((x) => x.toLowerCase() !== q.toLowerCase());
    list.unshift(q);
    ui.storage.set(prefKey('searches'), list.slice(0, 6));
  };
  store.clearSearches = () => ui.storage.remove(prefKey('searches'));
})();
