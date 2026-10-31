/*
 * Daftar ICD-10 ringkas untuk diagnosis yang sering dipakai (contoh untuk demo).
 * Di sistem sungguhan, daftar ini diambil dari master ICD-10 lengkap.
 */
(function () {
  const App = (window.App = window.App || {});

  const extra = [
    ['J00', 'Nasofaringitis akut (common cold)'],
    ['J30.4', 'Rinitis alergi'],
    ['B34.9', 'Infeksi virus, tidak spesifik'],
    ['K21.9', 'Penyakit refluks gastroesofagus (GERD)'],
    ['E66.9', 'Obesitas'],
    ['R51', 'Sakit kepala'],
    ['M79.1', 'Nyeri otot (mialgia)'],
    ['H10.9', 'Konjungtivitis'],
    ['L50.9', 'Urtikaria'],
    ['A06.0', 'Disentri amuba akut'],
    ['K59.0', 'Konstipasi'],
    ['R11', 'Mual dan muntah'],
    ['I48', 'Fibrilasi atrium'],
    ['I11.9', 'Penyakit jantung hipertensif'],
    ['E10.9', 'Diabetes melitus tipe 1 tanpa komplikasi'],
    ['E11.5', 'Diabetes melitus tipe 2 dengan komplikasi sirkulasi perifer'],
    ['N20.0', 'Batu ginjal'],
    ['G40.9', 'Epilepsi'],
    ['Z00.0', 'Pemeriksaan kesehatan umum'],
    ['Z09', 'Pemeriksaan tindak lanjut setelah pengobatan'],
  ];

  function build() {
    const map = new Map();
    const all = Object.assign({}, App.seed.TEMPLATES, App.seed.RI);
    Object.values(all).forEach((t) => map.set(t.kode, t.nama));
    extra.forEach(([k, n]) => map.has(k) || map.set(k, n));
    return Array.from(map, ([kode, nama]) => ({ kode, nama })).sort((a, b) => a.nama.localeCompare(b.nama, 'id'));
  }

  App.icd = { list: build };

  /** Daftar tindakan dan obat yang pernah dipakai, untuk saran pengisian */
  App.suggest = {
    tindakan() {
      const s = new Set();
      Object.values(Object.assign({}, App.seed.TEMPLATES, App.seed.RI)).forEach((t) => t.tindakan.forEach((x) => s.add(x)));
      return Array.from(s).sort();
    },
    terapi() {
      const s = new Set();
      Object.values(Object.assign({}, App.seed.TEMPLATES, App.seed.RI)).forEach((t) => t.terapi.forEach((x) => s.add(x)));
      return Array.from(s).sort();
    },
  };
})();
