/* Peran, hak akses, dan sesi login (simulasi front-end, tanpa server). */
(function () {
  const App = (window.App = window.App || {});

  const ROLES = {
    petugas_rme: { label: 'Petugas RME', desc: 'Administrator, pendaftaran, dan rekam medis: mengelola pengguna, data pasien, kunjungan, dan log aktivitas.' },
    tenaga_medis: { label: 'Tenaga Medis', desc: 'Dokter dan perawat: melakukan pemeriksaan, melihat riwayat medis, dan mencetak ringkasan.' },
  };


  /**
   * Satu-satunya sumber aturan hak akses.
   * Menu, penjaga halaman, tombol, dan matriks di halaman Pengguna semuanya membaca dari sini.
   */
  const PERMS = [
    { key: 'search', label: 'Mencari riwayat pasien', roles: ['petugas_rme', 'tenaga_medis'] },
    { key: 'patient.view', label: 'Melihat identitas pasien', roles: ['petugas_rme', 'tenaga_medis'] },
    { key: 'history.summary', label: 'Melihat ringkasan riwayat (tanggal, layanan, diagnosis utama)', roles: ['petugas_rme', 'tenaga_medis'] },
    { key: 'history.full', label: 'Melihat rincian klinis (tanda vital, tindakan, terapi)', roles: ['petugas_rme', 'tenaga_medis'] },
    { key: 'patient.create', label: 'Mendaftarkan pasien baru', roles: ['petugas_rme'] },
    { key: 'patient.edit', label: 'Mengubah identitas pasien', roles: ['petugas_rme'] },
    { key: 'visit.view', label: 'Melihat daftar kunjungan', roles: ['petugas_rme', 'tenaga_medis'] },
    { key: 'visit.create', label: 'Mendaftarkan kunjungan', roles: ['petugas_rme'] },
    { key: 'visit.examine', label: 'Mengisi hasil pemeriksaan', roles: ['tenaga_medis'] },
    { key: 'history.print', label: 'Mencetak ringkasan riwayat', roles: ['petugas_rme', 'tenaga_medis'] },
    { key: 'audit.view', label: 'Melihat log aktivitas', roles: ['petugas_rme'] },
    { key: 'user.manage', label: 'Mengelola pengguna', roles: ['petugas_rme'] },
  ];


  const auth = (App.auth = { ROLES, PERMS });
  let current = null;

  auth.can = function (perm) {
    if (!current) return false;
    const p = PERMS.find((x) => x.key === perm);
    return !!p && p.roles.includes(current.role);
  };
  auth.roleCan = (role, perm) => {
    const p = PERMS.find((x) => x.key === perm);
    return !!p && p.roles.includes(role);
  };
  auth.user = () => current;

  auth.restore = function () {
    const sess = App.ui.storage.get(App.config.sessionKey, null);
    if (sess && sess.userId) {
      const u = App.store.user(sess.userId);
      if (u && u.aktif) current = u;
    }
    return current;
  };

  auth.login = function (username, password) {
    const u = App.store.users().find((x) => x.username.toLowerCase() === String(username).trim().toLowerCase());
    if (!u || u.password !== password) return { ok: false, error: 'Nama pengguna atau kata sandi salah.' };
    if (!u.aktif) return { ok: false, error: 'Akun ini dinonaktifkan. Hubungi Petugas RME.' };
    current = u;
    App.ui.storage.set(App.config.sessionKey, { userId: u.id });
    App.store.log('Masuk', 'Login ke sistem');
    return { ok: true, user: u };
  };

  auth.logout = function () {
    App.store.log('Keluar', 'Logout dari sistem');
    current = null;
    App.ui.storage.remove(App.config.sessionKey);
  };

  auth.refresh = function () {
    if (current) current = App.store.user(current.id) || null;
  };
})();
