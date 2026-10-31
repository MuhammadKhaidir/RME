/* Peran, hak akses, dan sesi login (simulasi front-end, tanpa server). */
(function () {
  const App = (window.App = window.App || {});

  const ROLES = {
    admin: { label: 'Administrator', desc: 'Mengelola pengguna dan memantau log aktivitas.' },
    pendaftaran: { label: 'Petugas Pendaftaran', desc: 'Mendaftarkan pasien dan kunjungan.' },
    klinisi: { label: 'Dokter / Perawat', desc: 'Melihat riwayat dan mengisi pemeriksaan.' },
    rm: { label: 'Petugas Rekam Medis', desc: 'Menjaga mutu data dan menelusuri riwayat.' },
  };

  /**
   * Satu-satunya sumber aturan hak akses.
   * Menu, penjaga halaman, tombol, dan matriks di halaman Pengguna semuanya membaca dari sini.
   */
  const PERMS = [
    { key: 'search', label: 'Mencari riwayat pasien', roles: ['pendaftaran', 'klinisi', 'rm'] },
    { key: 'patient.view', label: 'Melihat identitas pasien', roles: ['pendaftaran', 'klinisi', 'rm'] },
    { key: 'history.summary', label: 'Melihat ringkasan riwayat (tanggal, layanan, diagnosis utama)', roles: ['pendaftaran', 'klinisi', 'rm'] },
    { key: 'history.full', label: 'Melihat rincian klinis (tanda vital, tindakan, terapi)', roles: ['klinisi', 'rm'] },
    { key: 'patient.create', label: 'Mendaftarkan pasien baru', roles: ['pendaftaran'] },
    { key: 'patient.edit', label: 'Mengubah identitas pasien', roles: ['pendaftaran', 'rm'] },
    { key: 'visit.view', label: 'Melihat daftar kunjungan', roles: ['pendaftaran', 'klinisi', 'rm'] },
    { key: 'visit.create', label: 'Mendaftarkan kunjungan', roles: ['pendaftaran'] },
    { key: 'visit.examine', label: 'Mengisi hasil pemeriksaan', roles: ['klinisi'] },
    { key: 'history.print', label: 'Mencetak ringkasan riwayat', roles: ['klinisi', 'rm'] },
    { key: 'audit.view', label: 'Melihat log aktivitas', roles: ['admin', 'rm'] },
    { key: 'user.manage', label: 'Mengelola pengguna', roles: ['admin'] },
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
    if (!u.aktif) return { ok: false, error: 'Akun ini dinonaktifkan. Hubungi administrator.' };
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
