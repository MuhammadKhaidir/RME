/* Konfigurasi dasar aplikasi. Ubah nama rumah sakit di sini. */
(function () {
  const App = (window.App = window.App || {});

  App.config = {
    appName: 'RME Terpadu',
    hospitalName: 'Rumah Sakit Contoh',
    storageKey: 'rme-terpadu.db.v1',
    sessionKey: 'rme-terpadu.session.v1',
    pageSize: 12,

    // Daftar poli rawat jalan
    poli: ['Poli Umum', 'Penyakit Dalam', 'Anak', 'Jantung', 'Paru', 'Saraf', 'Bedah'],

    // Ruang rawat inap: nama ruang, kelas
    ruangRI: [
      { ruang: 'Melati', kelas: 'Kelas 1' },
      { ruang: 'Mawar', kelas: 'Kelas 2' },
      { ruang: 'Anggrek', kelas: 'Kelas 3' },
      { ruang: 'HCU', kelas: 'Intensif' },
    ],

    penjamin: ['BPJS Kesehatan', 'Umum / Mandiri', 'Asuransi Swasta'],
    golDarah: ['A', 'B', 'AB', 'O'],
    statusKawin: ['Belum kawin', 'Kawin', 'Cerai hidup', 'Cerai mati'],
    hubunganKontak: ['Suami / Istri', 'Orang tua', 'Anak', 'Saudara', 'Lainnya'],
  };
})();
