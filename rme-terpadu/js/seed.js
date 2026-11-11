/*
 * Data contoh (fiktif) untuk demo. Dibuat sekali saat aplikasi pertama dibuka,
 * relatif terhadap tanggal hari itu, lalu disimpan di localStorage.
 * Semua nama, NIK, dan nomor telepon di sini hanya data rekaan.
 */
(function () {
  const App = (window.App = window.App || {});

  /* ---------- Pengguna ---------- */
  const USERS = [
    { username: 'admin', password: 'admin123', nama: 'Admin Sistem', role: 'petugas_rme' },
    { username: 'daftar', password: 'daftar123', nama: 'Nia Anggraini', role: 'petugas_rme' },
    { username: 'daftar2', password: 'rme12345', nama: 'Rudi Hartono', role: 'petugas_rme' },
    { username: 'nakes', password: 'nakes123', nama: 'dr. Andi Pratama', role: 'tenaga_medis', spesialis: 'Poli Umum' },
    { username: 'nakes.pd', password: 'rme12345', nama: 'dr. Maya Sari, Sp.PD', role: 'tenaga_medis', spesialis: 'Penyakit Dalam' },
    { username: 'nakes.anak', password: 'rme12345', nama: 'dr. Hendra Wijaya, Sp.A', role: 'tenaga_medis', spesialis: 'Anak' },
    { username: 'nakes.jp', password: 'rme12345', nama: 'dr. Lestari Putri, Sp.JP', role: 'tenaga_medis', spesialis: 'Jantung' },
    { username: 'nakes.paru', password: 'rme12345', nama: 'dr. Bambang Nugroho, Sp.P', role: 'tenaga_medis', spesialis: 'Paru' },
    { username: 'nakes.saraf', password: 'rme12345', nama: 'dr. Rahma Dewi, Sp.N', role: 'tenaga_medis', spesialis: 'Saraf' },
    { username: 'nakes.bedah', password: 'rme12345', nama: 'dr. Gilang Saputra, Sp.B', role: 'tenaga_medis', spesialis: 'Bedah' },
    { username: 'rm', password: 'rm123', nama: 'Wulan Anggraeni', role: 'petugas_rme' },
    { username: 'rm2', password: 'rme12345', nama: 'Fajar Ramadhan', role: 'petugas_rme' },
  ];

  /* ---------- Template klinis ---------- */
  const NORMAL = { sis: [108, 126], dia: [68, 82], nadi: [68, 88], suhu: [36.3, 37.0], rr: [16, 20], spo2: [97, 99] };

  const T = {
    HT: {
      kode: 'I10', nama: 'Hipertensi esensial (primer)', kronis: true, usia: [35, 90], poli: ['Penyakit Dalam', 'Poli Umum'],
      keluhan: ['Kontrol rutin tekanan darah', 'Pusing dan tengkuk terasa berat', 'Sakit kepala berdenyut sejak pagi'],
      vital: { sis: [136, 174], dia: [84, 104], nadi: [72, 92] },
      fisik: 'Keadaan umum baik, kompos mentis. Jantung dan paru dalam batas normal, tidak ada edema tungkai.',
      tindakan: ['Pengukuran tekanan darah', 'Edukasi diet rendah garam'],
      terapi: ['Amlodipin 10 mg 1x1', 'Candesartan 8 mg 1x1', 'Hidroklorotiazid 12,5 mg 1x1'],
      lanjut: 'Kontrol ulang 1 bulan. Pantau tekanan darah di rumah.',
    },
    DM2: {
      kode: 'E11.9', nama: 'Diabetes melitus tipe 2 tanpa komplikasi', kronis: true, usia: [35, 90], poli: ['Penyakit Dalam'],
      keluhan: ['Kontrol gula darah', 'Sering haus dan sering buang air kecil', 'Badan lemas dan tidak bertenaga'],
      fisik: 'Keadaan umum baik. Tidak ada luka pada kaki, sensasi raba kaki normal.',
      tindakan: ['Pemeriksaan gula darah sewaktu', 'Pemeriksaan HbA1c', 'Edukasi diet diabetes'],
      terapi: ['Metformin 500 mg 3x1', 'Glimepirid 2 mg 1x1', 'Akarbose 50 mg 3x1'],
      lanjut: 'Kontrol 1 bulan dengan hasil gula darah puasa dan 2 jam setelah makan.',
    },
    DISLIP: {
      kode: 'E78.5', nama: 'Dislipidemia', kronis: true, usia: [35, 90], poli: ['Penyakit Dalam', 'Poli Umum'],
      keluhan: ['Kontrol hasil laboratorium kolesterol', 'Tengkuk terasa berat'],
      fisik: 'Keadaan umum baik. Tidak ada xantelasma.',
      tindakan: ['Pemeriksaan profil lipid', 'Edukasi diet rendah lemak'],
      terapi: ['Simvastatin 20 mg 1x1 malam', 'Atorvastatin 20 mg 1x1 malam'],
      lanjut: 'Cek profil lipid ulang 3 bulan.',
    },
    GOUT: {
      kode: 'M10.9', nama: 'Artritis gout', kronis: true, usia: [30, 90], poli: ['Penyakit Dalam', 'Poli Umum'],
      keluhan: ['Nyeri dan bengkak pada sendi jempol kaki', 'Nyeri lutut, sulit berjalan'],
      fisik: 'Sendi metatarsofalangeal I tampak bengkak, hangat, dan nyeri tekan.',
      tindakan: ['Pemeriksaan asam urat', 'Edukasi pembatasan makanan tinggi purin'],
      terapi: ['Allopurinol 100 mg 1x1', 'Natrium diklofenak 50 mg 2x1', 'Kolkisin 0,5 mg 2x1'],
      lanjut: 'Kontrol 2 minggu. Cek asam urat ulang.',
    },
    OA: {
      kode: 'M19.9', nama: 'Osteoartritis', kronis: true, usia: [50, 90], poli: ['Poli Umum', 'Penyakit Dalam'],
      keluhan: ['Nyeri lutut saat berjalan dan naik tangga', 'Kaku sendi di pagi hari'],
      fisik: 'Krepitasi pada kedua lutut, rentang gerak terbatas ringan.',
      tindakan: ['Edukasi latihan penguatan otot paha'],
      terapi: ['Meloksikam 15 mg 1x1', 'Glukosamin 500 mg 2x1'],
      lanjut: 'Kontrol bila nyeri tidak membaik dalam 2 minggu.',
    },
    ASMA: {
      kode: 'J45.9', nama: 'Asma', kronis: true, usia: [3, 70], poli: ['Paru', 'Poli Umum'],
      keluhan: ['Sesak napas dan mengi, terutama malam hari', 'Batuk berulang dan napas berbunyi', 'Kontrol rutin asma'],
      vital: { rr: [20, 26], spo2: [94, 98] },
      fisik: 'Mengi (wheezing) ekspirasi di kedua lapang paru, tidak ada retraksi.',
      tindakan: ['Nebulisasi salbutamol', 'Edukasi pencetus asma'],
      terapi: ['Salbutamol inhaler 2 puff bila sesak', 'Budesonid inhaler 2x1 puff'],
      lanjut: 'Kontrol 1 bulan. Hindari debu dan asap rokok.',
    },
    CHF: {
      kode: 'I50.9', nama: 'Gagal jantung', kronis: true, usia: [55, 90], poli: ['Jantung'],
      keluhan: ['Sesak napas saat beraktivitas', 'Kaki bengkak dan cepat lelah', 'Kontrol gagal jantung'],
      vital: { sis: [112, 150], dia: [70, 92], nadi: [78, 102], rr: [20, 24], spo2: [94, 98] },
      fisik: 'Ronki basah halus di basal paru, edema pretibial +/+, JVP meningkat.',
      tindakan: ['EKG 12 sadapan', 'Edukasi pembatasan cairan dan garam'],
      terapi: ['Furosemid 40 mg 1x1 pagi', 'Bisoprolol 2,5 mg 1x1', 'Ramipril 5 mg 1x1', 'Spironolakton 25 mg 1x1'],
      lanjut: 'Kontrol 2 minggu. Timbang berat badan setiap pagi.',
    },
    CKD: {
      kode: 'N18.9', nama: 'Penyakit ginjal kronik', kronis: true, usia: [50, 90], poli: ['Penyakit Dalam'],
      keluhan: ['Lemas dan mual', 'Kaki bengkak', 'Kontrol hasil ureum dan kreatinin'],
      fisik: 'Konjungtiva sedikit pucat, edema tungkai +/+.',
      tindakan: ['Pemeriksaan ureum dan kreatinin', 'Edukasi diet rendah protein'],
      terapi: ['Asam folat 5 mg 1x1', 'Kalsium karbonat 500 mg 3x1', 'Furosemid 40 mg 1x1'],
      lanjut: 'Cek fungsi ginjal ulang 1 bulan.',
    },

    ISPA: {
      kode: 'J06.9', nama: 'Infeksi saluran napas atas akut (ISPA)', usia: [0, 90], poli: ['Poli Umum', 'Anak'],
      keluhan: ['Batuk pilek disertai demam ringan', 'Hidung tersumbat dan tenggorokan gatal', 'Batuk berdahak dan pilek'],
      vital: { suhu: [37.2, 38.2], nadi: [78, 100] },
      fisik: 'Faring hiperemis, tidak ada ronki maupun mengi.',
      tindakan: ['Pemeriksaan fisik', 'Edukasi istirahat dan asupan cairan'],
      terapi: ['Parasetamol 500 mg 3x1', 'Ambroksol 30 mg 3x1', 'Cetirizin 10 mg 1x1', 'Vitamin C 500 mg 1x1'],
      lanjut: 'Kontrol bila demam lebih dari 3 hari.',
    },
    FARING: {
      kode: 'J02.9', nama: 'Faringitis akut', usia: [3, 70], poli: ['Poli Umum', 'Anak'],
      keluhan: ['Nyeri menelan sejak 3 hari', 'Tenggorokan sakit dan demam'],
      vital: { suhu: [37.4, 38.5] },
      fisik: 'Faring hiperemis, tonsil T1-T1 tidak hiperemis.',
      tindakan: ['Pemeriksaan tenggorok'],
      terapi: ['Amoksisilin 500 mg 3x1', 'Parasetamol 500 mg 3x1', 'Obat kumur povidon iodin'],
      lanjut: 'Kontrol bila keluhan menetap setelah 5 hari.',
    },
    BRONKITIS: {
      kode: 'J20.9', nama: 'Bronkitis akut', usia: [5, 80], poli: ['Paru', 'Poli Umum'],
      keluhan: ['Batuk berdahak lebih dari 5 hari', 'Batuk disertai napas berbunyi'],
      vital: { suhu: [36.8, 37.9], rr: [18, 24] },
      fisik: 'Ronki kasar di kedua lapang paru, tidak ada tanda sesak.',
      tindakan: ['Pemeriksaan fisik paru'],
      terapi: ['Ambroksol 30 mg 3x1', 'Azitromisin 500 mg 1x1', 'N-asetilsistein 200 mg 3x1'],
      lanjut: 'Kontrol 1 minggu, foto toraks bila batuk berlanjut.',
    },
    DIARE: {
      kode: 'A09', nama: 'Diare dan gastroenteritis akut', usia: [0, 90], poli: ['Poli Umum', 'Anak'],
      keluhan: ['Buang air besar cair lebih dari 4 kali sehari', 'Diare disertai mual dan nyeri perut'],
      vital: { suhu: [36.8, 38.0], nadi: [82, 104] },
      fisik: 'Turgor kulit cukup, bising usus meningkat, nyeri tekan perut difus ringan.',
      tindakan: ['Pemberian cairan oralit', 'Edukasi kebersihan makanan'],
      terapi: ['Oralit 1 sachet setiap diare', 'Zink 20 mg 1x1 selama 10 hari', 'Probiotik 2x1'],
      lanjut: 'Kembali bila diare berdarah atau muntah terus-menerus.',
    },
    GASTRITIS: {
      kode: 'K29.7', nama: 'Gastritis', usia: [12, 90], poli: ['Poli Umum', 'Penyakit Dalam'],
      keluhan: ['Nyeri ulu hati dan mual', 'Perih di lambung setelah makan', 'Kembung dan sering sendawa'],
      fisik: 'Nyeri tekan epigastrium, tidak ada defans muskular.',
      tindakan: ['Pemeriksaan abdomen', 'Edukasi pola makan teratur'],
      terapi: ['Omeprazol 20 mg 1x1 sebelum makan', 'Antasida sirup 3x1', 'Sukralfat 500 mg 3x1'],
      lanjut: 'Kontrol 2 minggu. Hindari makanan pedas dan asam.',
    },
    ISK: {
      kode: 'N39.0', nama: 'Infeksi saluran kemih', usia: [15, 85], poli: ['Poli Umum', 'Penyakit Dalam'],
      keluhan: ['Nyeri saat buang air kecil', 'Sering buang air kecil dan terasa tidak tuntas'],
      vital: { suhu: [36.8, 38.0] },
      fisik: 'Nyeri tekan suprapubik, nyeri ketok CVA negatif.',
      tindakan: ['Pemeriksaan urinalisis'],
      terapi: ['Siprofloksasin 500 mg 2x1', 'Fenazopiridin 200 mg 3x1'],
      lanjut: 'Perbanyak minum air putih. Kontrol 1 minggu.',
    },
    LBP: {
      kode: 'M54.5', nama: 'Nyeri punggung bawah', usia: [20, 80], poli: ['Poli Umum', 'Saraf'],
      keluhan: ['Nyeri pinggang setelah mengangkat beban', 'Pinggang pegal dan kaku'],
      fisik: 'Nyeri tekan otot paraspinal lumbal, lasegue negatif.',
      tindakan: ['Edukasi postur dan latihan peregangan'],
      terapi: ['Meloksikam 15 mg 1x1', 'Eperison 50 mg 3x1', 'Vitamin B kompleks 1x1'],
      lanjut: 'Kontrol 2 minggu. Fisioterapi bila tidak membaik.',
    },
    MIGRAIN: {
      kode: 'G43.9', nama: 'Migrain', usia: [15, 60], poli: ['Saraf', 'Poli Umum'],
      keluhan: ['Sakit kepala sebelah berdenyut disertai mual', 'Nyeri kepala hebat dan silau terhadap cahaya'],
      fisik: 'Status neurologis dalam batas normal, tidak ada tanda rangsang meningeal.',
      tindakan: ['Pemeriksaan neurologis'],
      terapi: ['Sumatriptan 50 mg bila nyeri', 'Parasetamol 500 mg 3x1', 'Flunarizin 5 mg 1x1 malam'],
      lanjut: 'Catat pemicu serangan. Kontrol 1 bulan.',
    },
    TTH: {
      kode: 'G44.2', nama: 'Sakit kepala tipe tegang', usia: [15, 70], poli: ['Saraf', 'Poli Umum'],
      keluhan: ['Sakit kepala seperti diikat, terutama sore hari', 'Nyeri kepala dan tengkuk tegang'],
      fisik: 'Nyeri tekan otot leher dan bahu, status neurologis normal.',
      tindakan: ['Edukasi manajemen stres'],
      terapi: ['Ibuprofen 400 mg 3x1', 'Eperison 50 mg 3x1'],
      lanjut: 'Kontrol bila keluhan sering berulang.',
    },
    DERMATITIS: {
      kode: 'L30.9', nama: 'Dermatitis', usia: [1, 80], poli: ['Poli Umum', 'Anak'],
      keluhan: ['Ruam merah dan gatal pada lengan', 'Kulit kering, gatal, dan bersisik'],
      fisik: 'Plak eritematosa dengan ekskoriasi di lipatan siku dan lutut.',
      tindakan: ['Pemeriksaan kulit'],
      terapi: ['Hidrokortison krim 1% 2x1', 'Cetirizin 10 mg 1x1', 'Pelembap 2x1'],
      lanjut: 'Hindari pencetus. Kontrol 1 minggu.',
    },
    VERTIGO: {
      kode: 'R42', nama: 'Pusing dan vertigo', usia: [30, 85], poli: ['Saraf', 'Poli Umum'],
      keluhan: ['Pusing berputar saat berubah posisi', 'Kepala terasa melayang disertai mual'],
      fisik: 'Nistagmus negatif, tes Dix-Hallpike positif ringan.',
      tindakan: ['Manuver Epley'],
      terapi: ['Betahistin 12 mg 3x1', 'Dimenhidrinat 50 mg bila mual'],
      lanjut: 'Kontrol 1 minggu.',
    },
    ANEMIA: {
      kode: 'D50.9', nama: 'Anemia defisiensi besi', usia: [5, 80], poli: ['Penyakit Dalam', 'Poli Umum'],
      keluhan: ['Cepat lelah dan pucat', 'Pusing dan mata berkunang-kunang'],
      fisik: 'Konjungtiva pucat, akral hangat.',
      tindakan: ['Pemeriksaan darah lengkap'],
      terapi: ['Sulfas ferosus 200 mg 2x1', 'Asam folat 1 mg 1x1', 'Vitamin C 500 mg 1x1'],
      lanjut: 'Cek Hb ulang 1 bulan.',
    },
    DEMAM: {
      kode: 'R50.9', nama: 'Demam, tidak spesifik', usia: [0, 14], poli: ['Anak'],
      keluhan: ['Demam sejak 2 hari, rewel', 'Demam naik turun disertai nafsu makan menurun'],
      vital: { suhu: [37.8, 39.2], nadi: [100, 130], rr: [22, 30] },
      fisik: 'Aktif, tidak ada kejang. Tonsil dan faring tidak hiperemis.',
      tindakan: ['Pemeriksaan fisik anak', 'Edukasi kompres hangat'],
      terapi: ['Parasetamol sirup 10 mg/kgBB tiap 6 jam bila demam', 'Cairan oral yang cukup'],
      lanjut: 'Kembali bila demam lebih dari 3 hari atau kejang.',
    },
    LUKA: {
      kode: 'T14.1', nama: 'Luka terbuka (vulnus laceratum)', usia: [5, 80], poli: ['Bedah', 'Poli Umum'],
      keluhan: ['Luka robek di tangan akibat benda tajam', 'Luka di tungkai setelah terjatuh dari motor'],
      fisik: 'Luka robek ukuran 3 cm, tepi rata, tidak ada tanda infeksi.',
      tindakan: ['Pembersihan luka', 'Penjahitan luka', 'Injeksi anti tetanus'],
      terapi: ['Amoksisilin 500 mg 3x1', 'Asam mefenamat 500 mg 3x1', 'Povidon iodin salep'],
      lanjut: 'Kontrol luka 3 hari. Buka jahitan hari ke-7.',
    },
    ANGINA: {
      kode: 'I20.9', nama: 'Angina pektoris', usia: [45, 85], poli: ['Jantung'],
      keluhan: ['Nyeri dada kiri menjalar ke lengan saat berjalan', 'Dada terasa tertekan saat beraktivitas'],
      vital: { sis: [124, 160], dia: [76, 98], nadi: [70, 96] },
      fisik: 'Jantung bunyi I-II normal, tidak ada murmur. Paru bersih.',
      tindakan: ['EKG 12 sadapan', 'Pemeriksaan troponin'],
      terapi: ['Aspirin 80 mg 1x1', 'Isosorbid dinitrat 5 mg bila nyeri', 'Bisoprolol 2,5 mg 1x1', 'Atorvastatin 40 mg 1x1'],
      lanjut: 'Kontrol 1 minggu. Rencana uji treadmill.',
    },
    TB: {
      kode: 'A15.0', nama: 'Tuberkulosis paru', usia: [15, 80], poli: ['Paru'],
      keluhan: ['Batuk lebih dari 2 minggu disertai keringat malam', 'Batuk berdarah dan berat badan turun'],
      vital: { suhu: [36.9, 38.0], spo2: [94, 98] },
      fisik: 'Ronki pada apeks paru kanan, tidak ada sesak.',
      tindakan: ['Pemeriksaan BTA sputum', 'Foto toraks'],
      terapi: ['OAT kategori 1 (RHZE) 1x4 tablet', 'Vitamin B6 10 mg 1x1'],
      lanjut: 'Pantau kepatuhan minum obat. Kontrol 2 minggu.',
    },
  };

  /* Kasus rawat inap */
  const RI = {
    TIFOID: {
      kode: 'A01.0', nama: 'Demam tifoid', usia: [5, 70], poli: ['Penyakit Dalam'], poliAnak: 'Anak', los: [4, 7], ruang: ['Anggrek', 'Mawar'],
      keluhan: ['Demam tinggi lebih dari 5 hari disertai nyeri perut', 'Demam naik turun, mual, dan tidak mau makan'],
      vital: { suhu: [38.4, 39.6], nadi: [92, 116], sis: [100, 118], dia: [64, 78] },
      fisik: 'Lidah kotor, nyeri tekan epigastrium, hepatomegali ringan.',
      tindakan: ['Pemasangan infus', 'Pemeriksaan Widal dan darah lengkap'],
      terapi: ['Infus RL 20 tpm', 'Seftriakson 1 g IV 1x1', 'Parasetamol 500 mg 3x1', 'Omeprazol 40 mg IV 1x1'],
      lanjut: 'Pulang dengan antibiotik oral, istirahat, dan kontrol 1 minggu.',
    },
    DBD: {
      kode: 'A91', nama: 'Demam berdarah dengue', usia: [2, 60], poli: ['Penyakit Dalam'], poliAnak: 'Anak', los: [3, 6], ruang: ['Anggrek', 'Mawar'],
      keluhan: ['Demam tinggi mendadak 3 hari, nyeri otot dan sendi', 'Demam disertai bintik merah di kulit'],
      vital: { suhu: [38.2, 39.8], nadi: [96, 124], sis: [96, 116], dia: [60, 76] },
      fisik: 'Petekie di lengan dan tungkai, tes Rumple-Leede positif, akral hangat.',
      tindakan: ['Pemasangan infus', 'Pemantauan trombosit dan hematokrit tiap 12 jam'],
      terapi: ['Infus RL sesuai protokol DBD', 'Parasetamol 500 mg bila demam'],
      lanjut: 'Pulang setelah trombosit meningkat dan bebas demam 24 jam.',
    },
    PNEUMONIA: {
      kode: 'J18.9', nama: 'Pneumonia', usia: [1, 90], poli: ['Paru'], poliAnak: 'Anak', los: [4, 8], ruang: ['Mawar', 'Melati'],
      keluhan: ['Batuk berdahak, demam, dan sesak napas', 'Sesak napas disertai nyeri dada saat batuk'],
      vital: { suhu: [38.0, 39.2], nadi: [96, 120], rr: [24, 32], spo2: [90, 95] },
      fisik: 'Ronki basah kasar di lapang paru kanan bawah, perkusi redup.',
      tindakan: ['Pemasangan infus', 'Foto toraks', 'Terapi oksigen nasal kanul', 'Nebulisasi'],
      terapi: ['Seftriakson 2 g IV 1x1', 'Azitromisin 500 mg 1x1', 'Ambroksol 30 mg 3x1', 'Oksigen 3 lpm'],
      lanjut: 'Pulang dengan antibiotik oral. Foto toraks ulang 2 minggu.',
    },
    DIARE_RI: {
      kode: 'A09', nama: 'Gastroenteritis akut dengan dehidrasi', usia: [0, 85], poli: ['Penyakit Dalam'], poliAnak: 'Anak', los: [2, 4], ruang: ['Anggrek', 'Mawar'],
      keluhan: ['Diare lebih dari 8 kali sehari disertai muntah', 'Lemas, mulut kering, dan tidak bisa minum'],
      vital: { suhu: [37.2, 38.4], nadi: [100, 128], sis: [92, 110], dia: [58, 72] },
      fisik: 'Mata cekung, turgor kulit kembali lambat, mukosa bibir kering.',
      tindakan: ['Pemasangan infus', 'Rehidrasi intravena'],
      terapi: ['Infus RL rehidrasi', 'Zink 20 mg 1x1', 'Ondansetron 4 mg IV bila mual'],
      lanjut: 'Pulang setelah dehidrasi teratasi dan toleran makan.',
    },
    CHF_RI: {
      kode: 'I50.9', nama: 'Gagal jantung dekompensasi', usia: [55, 90], poli: ['Jantung'], los: [4, 8], ruang: ['HCU', 'Melati'], butuh: ['CHF'],
      keluhan: ['Sesak napas hebat, tidak bisa berbaring', 'Sesak bertambah dan kedua kaki bengkak'],
      vital: { sis: [130, 170], dia: [80, 100], nadi: [92, 118], rr: [24, 30], spo2: [88, 94] },
      fisik: 'Ronki basah halus di kedua paru, edema tungkai +2/+2, JVP meningkat.',
      tindakan: ['Pemasangan infus', 'Terapi oksigen', 'EKG 12 sadapan', 'Ekokardiografi'],
      terapi: ['Furosemid 40 mg IV 2x1', 'Oksigen 4 lpm', 'Bisoprolol 2,5 mg 1x1', 'Ramipril 5 mg 1x1'],
      lanjut: 'Pulang dengan obat oral. Kontrol poli jantung 1 minggu.',
    },
    STROKE: {
      kode: 'I63.9', nama: 'Stroke iskemik', usia: [50, 90], poli: ['Saraf'], los: [5, 9], ruang: ['HCU', 'Melati'], butuh: ['HT'],
      keluhan: ['Lemah anggota gerak kanan dan bicara pelo mendadak', 'Mulut mencong dan lengan kiri lemah'],
      vital: { sis: [150, 190], dia: [88, 110], nadi: [72, 96], spo2: [95, 99] },
      fisik: 'Hemiparesis, parese nervus VII sentral, GCS 15.',
      tindakan: ['Pemasangan infus', 'CT scan kepala', 'Fisioterapi dini'],
      terapi: ['Aspirin 160 mg 1x1', 'Klopidogrel 75 mg 1x1', 'Atorvastatin 40 mg 1x1', 'Citicolin 500 mg IV 2x1'],
      lanjut: 'Pulang dengan fisioterapi rutin dan kontrol poli saraf 1 minggu.',
    },
    APENDISITIS: {
      kode: 'K35.8', nama: 'Apendisitis akut', usia: [10, 55], poli: ['Bedah'], los: [2, 4], ruang: ['Mawar', 'Melati'],
      keluhan: ['Nyeri perut kanan bawah disertai demam dan mual', 'Nyeri perut berpindah ke kanan bawah sejak 1 hari'],
      vital: { suhu: [37.8, 38.8], nadi: [88, 108] },
      fisik: 'Nyeri tekan dan lepas di titik McBurney, Rovsing sign positif.',
      tindakan: ['Pemasangan infus', 'USG abdomen', 'Apendektomi'],
      terapi: ['Seftriakson 1 g IV 2x1', 'Metronidazol 500 mg IV 3x1', 'Ketorolak 30 mg IV 3x1'],
      lanjut: 'Pulang hari ke-3 pascaoperasi. Kontrol luka 1 minggu.',
    },
  };

  /* ---------- Data bantu ---------- */
  const NAMA_L = ['Ahmad', 'Budi', 'Candra', 'Dedi', 'Eko', 'Fajar', 'Gunawan', 'Hendra', 'Irfan', 'Joko', 'Lukman', 'Mulyadi', 'Nugroho', 'Oki', 'Prasetyo', 'Rizky', 'Slamet', 'Taufik', 'Usman', 'Wahyu', 'Yusuf', 'Zulkifli', 'Andri', 'Bagus', 'Dimas', 'Farhan', 'Iqbal', 'Rendi'];
  const NAMA_P = ['Aisyah', 'Bunga', 'Citra', 'Dewi', 'Endang', 'Fitri', 'Gita', 'Hana', 'Indah', 'Juwita', 'Kartika', 'Lestari', 'Maya', 'Novi', 'Putri', 'Rahma', 'Sari', 'Tuti', 'Umi', 'Vina', 'Wulan', 'Yanti', 'Zahra', 'Nur', 'Rina', 'Siti', 'Ratna', 'Dian'];
  const NAMA_B = ['Pratama', 'Wijaya', 'Santoso', 'Hidayat', 'Saputra', 'Nasution', 'Siregar', 'Hasibuan', 'Harahap', 'Susanto', 'Kurniawan', 'Rahmawati', 'Permata', 'Syahputra', 'Ramadhan', 'Utami', 'Wulandari', 'Firmansyah', 'Maulana', 'Setiawan', 'Purnama', 'Gunawan', 'Fauzi', 'Anggraini', 'Yulianto', 'Lubis', 'Pohan', 'Marbun'];
  const KOTA = ['Palembang', 'Prabumulih', 'Lahat', 'Baturaja', 'Muara Enim', 'Indralaya', 'Jambi', 'Lampung', 'Pangkalpinang', 'Medan', 'Padang', 'Bengkulu'];
  const JALAN = ['Jl. Merdeka', 'Jl. Sudirman', 'Jl. Ahmad Yani', 'Jl. Kenanga', 'Jl. Mawar', 'Jl. Melati', 'Jl. Pahlawan', 'Jl. Veteran', 'Jl. Diponegoro', 'Jl. Cendana', 'Jl. Flamboyan', 'Jl. Anggrek'];
  const KEL = ['Sukamaju', 'Tanjung Raya', 'Sumber Rejo', 'Karang Anyar', 'Bukit Indah', 'Talang Jaya', 'Mulyo Agung', 'Air Batu'];
  const ALERGI = ['Penisilin', 'Sulfa', 'Seafood', 'Debu', 'Amoksisilin', 'Antalgin', 'Telur', 'Kacang'];
  const KERJA_P = ['Ibu rumah tangga', 'Guru', 'Karyawan swasta', 'Pedagang', 'Perawat', 'Wiraswasta', 'PNS'];
  const KERJA_L = ['Karyawan swasta', 'Wiraswasta', 'Petani', 'Sopir', 'PNS', 'Pedagang', 'Buruh', 'Guru'];

  /* ---------- Generator ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function generate(today) {
    const ui = App.ui;
    const rnd = mulberry32(20260101);
    const pick = (a) => a[Math.floor(rnd() * a.length)];
    const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));
    const num = (a, b, d) => +(a + rnd() * (b - a)).toFixed(d || 0);
    const chance = (p) => rnd() < p;
    const shuffle = (a) => a.map((x) => [rnd(), x]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
    const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, d.getHours(), d.getMinutes());
    const at = (d, h, m) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m);

    let seq = 0;
    const nid = (p) => p + ++seq;

    const users = USERS.map((u) => Object.assign({ id: nid('u'), aktif: true, spesialis: '' }, u));
    const dokterPoli = {};
    users.forEach((u) => {
      if (u.role === 'tenaga_medis' && u.spesialis) dokterPoli[u.spesialis] = u;
    });

    /* Pasien */
    const usedNames = new Set();
    const specs = [];
    const bands = [[1, 14, 8], [15, 39, 14], [40, 59, 20], [60, 82, 16]];
    bands.forEach(([a, b, n]) => {
      for (let i = 0; i < n; i++) specs.push(int(a, b));
    });

    const patients = [];
    specs.forEach((age) => {
      const jk = chance(0.5) ? 'L' : 'P';
      let nama;
      do {
        nama = `${pick(jk === 'L' ? NAMA_L : NAMA_P)} ${pick(NAMA_B)}`;
      } while (usedNames.has(nama));
      usedNames.add(nama);
      const lahir = addDays(today, -(age * 365 + int(5, 360)));
      const dd = lahir.getDate() + (jk === 'P' ? 40 : 0);
      const nik = `1600${String(int(10, 99))}${String(dd).padStart(2, '0')}${String(lahir.getMonth() + 1).padStart(2, '0')}${String(lahir.getFullYear() % 100).padStart(2, '0')}${String(int(1, 9999)).padStart(4, '0')}`;
      const penjamin = chance(0.7) ? 'BPJS Kesehatan' : chance(0.65) ? 'Umum / Mandiri' : 'Asuransi Swasta';
      const bb = age < 15 ? Math.round(8 + age * 2.6) : jk === 'L' ? int(56, 92) : int(46, 78);
      const tb = age < 15 ? Math.round(75 + age * 6.2) : jk === 'L' ? int(160, 178) : int(148, 166);
      patients.push({
        id: nid('p'),
        noRM: '',
        nik,
        nama,
        jk,
        tglLahir: ui.toDateStr(lahir),
        tempatLahir: pick(KOTA),
        alamat: `${pick(JALAN)} No. ${int(1, 120)}, RT ${String(int(1, 12)).padStart(2, '0')}/RW ${String(int(1, 9)).padStart(2, '0')}, Kel. ${pick(KEL)}`,
        noHp: `08${pick(['12', '13', '52', '53', '57', '78', '21'])}-${int(1000, 9999)}-${int(1000, 9999)}`,
        golDarah: chance(0.85) ? pick(['A', 'B', 'AB', 'O', 'O', 'B']) : '',
        alergi: chance(0.2) ? [pick(ALERGI)] : [],
        pekerjaan: age < 6 ? '-' : age < 18 ? 'Pelajar' : jk === 'P' ? pick(KERJA_P) : pick(KERJA_L),
        statusKawin: age < 22 ? 'Belum kawin' : chance(0.8) ? 'Kawin' : pick(['Belum kawin', 'Cerai mati', 'Cerai hidup']),
        penjamin,
        noPenjamin: penjamin === 'BPJS Kesehatan' ? `000${int(1000000000, 9999999999)}` : penjamin === 'Asuransi Swasta' ? `AS-${int(100000, 999999)}` : '',
        kontak: { nama: `${pick(jk === 'L' ? NAMA_P : NAMA_L)} ${pick(NAMA_B)}`, hubungan: age < 18 ? 'Orang tua' : pick(['Suami / Istri', 'Anak', 'Saudara']), noHp: `0812-${int(1000, 9999)}-${int(1000, 9999)}` },
        createdAt: '',
        createdBy: '',
        _age: age,
        _bb: bb,
        _tb: tb,
        _kronis: [],
      });
    });

    /* Penyakit kronis per pasien */
    patients.forEach((p) => {
      const a = p._age;
      const k = [];
      if (a >= 35 && chance(0.5)) k.push('HT');
      if (a >= 35 && chance(0.3)) k.push('DM2');
      if (a >= 40 && chance(0.18)) k.push('DISLIP');
      if (a >= 40 && chance(0.15)) k.push('GOUT');
      if (a >= 55 && chance(0.2)) k.push('OA');
      if (a >= 58 && chance(0.12)) k.push('CHF');
      if (a >= 55 && chance(0.07)) k.push('CKD');
      if (a < 70 && chance(a < 15 ? 0.15 : 0.1)) k.push('ASMA');
      p._kronis = k;
    });

    const visits = [];
    const poliDokter = (poli) => dokterPoli[poli] || dokterPoli['Poli Umum'];
    const rng = (r, d) => num(r[0], r[1], d);

    function vitals(tpl, p, dewasa) {
      const v = Object.assign({}, NORMAL, tpl.vital || {});
      const anak = p._age < 15;
      return {
        td: anak ? '' : `${Math.round(rng(v.sis))}/${Math.round(rng(v.dia))}`,
        nadi: anak ? int(88, 118) : Math.round(rng(v.nadi)),
        suhu: rng(v.suhu, 1),
        rr: anak ? int(20, 28) : Math.round(rng(v.rr)),
        spo2: Math.round(rng(v.spo2)),
        bb: p._bb + int(-1, 1),
        tb: p._tb,
      };
    }

    function dxList(p, tpl) {
      const list = [{ kode: tpl.kode, nama: tpl.nama, tipe: 'utama' }];
      p._kronis.forEach((c) => {
        if (T[c].kode !== tpl.kode && chance(0.55)) list.push({ kode: T[c].kode, nama: T[c].nama, tipe: 'sekunder' });
      });
      return list.slice(0, 3);
    }

    function makeVisit(p, tpl, when, jenis, o) {
      o = o || {};
      const anak = p._age < 15;
      let poli = o.poli;
      if (!poli) {
        if (anak) poli = tpl.los ? tpl.poliAnak || tpl.poli[0] : 'Anak';
        else poli = pick(tpl.poli.filter((x) => x !== 'Anak'));
      }
      const dpjp = poliDokter(poli);
      const full = o.stage === 'full';
      const partial = o.stage === 'partial';
      const keluhan = pick(tpl.keluhan);
      const kronisText = p._kronis.length ? ` Memiliki riwayat ${p._kronis.map((c) => T[c].nama.toLowerCase()).join(' dan ')}.` : '';
      const anam = `${keluhan}.${tpl.kronis ? ' ' + pick(['Rutin minum obat dan tidak ada efek samping.', 'Kadang lupa minum obat.', 'Tidak ada keluhan baru.']) : ' Muncul sejak ' + int(1, 5) + ' hari yang lalu.'}${kronisText}`;
      const v = {
        id: nid('v'),
        nomor: '',
        patientId: p.id,
        jenis,
        tglMasuk: ui.toISO(when),
        tglKeluar: null,
        poli: poli,
        ruang: '',
        kelas: '',
        kamar: '',
        dokterId: dpjp.id,
        penjamin: p.penjamin,
        keluhan,
        vital: null,
        anamnesis: '',
        fisik: '',
        diagnosis: [],
        tindakan: [],
        terapi: [],
        lanjut: '',
        status: jenis === 'RI' ? 'Dirawat' : 'Terdaftar',
        dibuatOleh: users[1].id,
        diperbaruiOleh: null,
      };
      if (jenis === 'RI') {
        const r = pick(tpl.ruang);
        const kelas = App.config.ruangRI.find((x) => x.ruang === r);
        v.ruang = r;
        v.kelas = kelas ? kelas.kelas : '';
        v.kamar = `${r[0]}-${int(1, 3)}0${int(1, 8)}`;
      }
      if (full || partial) {
        v.vital = vitals(tpl, p);
        v.anamnesis = anam;
        v.fisik = tpl.fisik;
        v.diagnosis = dxList(p, tpl);
        v.tindakan = shuffle(tpl.tindakan).slice(0, jenis === 'RI' ? tpl.tindakan.length : int(1, tpl.tindakan.length));
        v.terapi = shuffle(tpl.terapi).slice(0, Math.min(tpl.terapi.length, int(2, 3)));
        v.diperbaruiOleh = dpjp.id;
      }
      if (partial && jenis === 'RJ') {
        v.diagnosis = [];
        v.tindakan = [];
        v.terapi = [];
        v.fisik = '';
        v.status = 'Diperiksa';
      }
      if (full && jenis === 'RJ') {
        v.lanjut = tpl.lanjut;
        v.status = 'Selesai';
      }
      if (full && jenis === 'RI') {
        v.lanjut = tpl.lanjut;
        v.status = 'Pulang';
        v.tglKeluar = ui.toISO(at(addDays(when, o.los || 4), int(10, 14), int(0, 59)));
      }
      if (partial && jenis === 'RI') v.lanjut = '';
      visits.push(v);
      return v;
    }

    const acuteFor = (age) => Object.values(T).filter((t) => !t.kronis && age >= t.usia[0] && age <= t.usia[1]);

    /* Riwayat per pasien */
    patients.forEach((p) => {
      const chronicSpan = p._kronis.length ? int(180, 520) : int(30, 420);
      const start = addDays(today, -chronicSpan);
      const last = addDays(today, -3);

      p._kronis.forEach((c) => {
        let t = addDays(start, int(0, 20));
        while (t <= last) {
          const tpl = T[c];
          const age = p._age;
          const forced = age < 15 && c === 'ASMA' ? 'Anak' : null;
          makeVisit(p, tpl, at(t, int(8, 13), int(0, 59)), 'RJ', { stage: 'full', poli: forced || undefined });
          t = addDays(t, int(52, 105));
        }
      });

      const acuteCount = p._age < 15 ? int(1, 4) : int(0, 3);
      const pool = acuteFor(p._age);
      for (let i = 0; i < acuteCount; i++) {
        const t = addDays(start, int(0, Math.max(1, chronicSpan - 4)));
        if (t > last) continue;
        makeVisit(p, pick(pool), at(t, int(8, 13), int(0, 59)), 'RJ', { stage: 'full' });
      }

      if (chance(0.3)) {
        const cand = Object.values(RI).filter((t) => p._age >= t.usia[0] && p._age <= t.usia[1] && (!t.butuh || t.butuh.some((b) => p._kronis.includes(b))));
        if (cand.length) {
          const t = addDays(start, int(10, Math.max(12, chronicSpan - 10)));
          const tp = pick(cand);
          if (addDays(t, 10) < today) makeVisit(p, tp, at(t, int(7, 20), int(0, 59)), 'RI', { stage: 'full', los: int(tp.los[0], tp.los[1]) });
        }
      }

      if (!visits.some((v) => v.patientId === p.id)) {
        makeVisit(p, pick(pool), at(addDays(today, -int(5, 90)), int(8, 13), int(0, 59)), 'RJ', { stage: 'full' });
      }
    });

    /* Kunjungan hari ini (rawat jalan) */
    const todayPlan = [
      ['Poli Umum', 'Selesai'], ['Poli Umum', 'Diperiksa'], ['Poli Umum', 'Terdaftar'], ['Poli Umum', 'Terdaftar'],
      ['Penyakit Dalam', 'Selesai'], ['Penyakit Dalam', 'Terdaftar'], ['Anak', 'Diperiksa'], ['Anak', 'Terdaftar'],
      ['Jantung', 'Selesai'], ['Paru', 'Terdaftar'], ['Saraf', 'Diperiksa'], ['Bedah', 'Terdaftar'],
    ];
    const usedToday = new Set();
    let minute = 7 * 60 + 40;
    todayPlan.forEach(([poli, stage]) => {
      const kids = poli === 'Anak';
      const cands = shuffle(patients).filter((p) => !usedToday.has(p.id) && (kids ? p._age < 15 : p._age >= 15));
      const p = cands[0];
      usedToday.add(p.id);
      let pool = Object.values(T).filter((t) => t.poli.includes(poli) && p._age >= t.usia[0] && p._age <= t.usia[1]);
      const own = p._kronis.map((c) => T[c]).filter((t) => t.poli.includes(poli));
      if (own.length && chance(0.7)) pool = own;
      if (!pool.length) pool = acuteFor(p._age);
      const tpl = pick(pool);
      const when = at(today, Math.floor(minute / 60), minute % 60);
      minute += int(12, 26);
      const v = makeVisit(p, tpl, when, 'RJ', { stage: stage === 'Terdaftar' ? 'none' : stage === 'Diperiksa' ? 'partial' : 'full', poli });
      v.status = stage;
    });

    /* Pasien rawat inap saat ini */
    const usedAdm = new Set();
    const findFor = (tpl) => shuffle(patients).find((p) => p._age >= tpl.usia[0] && p._age <= tpl.usia[1] && !usedToday.has(p.id) && !usedAdm.has(p.id));
    [['PNEUMONIA', 1], ['TIFOID', 2], ['DBD', 1], ['DBD', 3]].forEach(([key, daysAgo], i) => {
      const tpl = RI[key];
      const p = i === 2 ? shuffle(patients).find((x) => x._age < 14 && x._age >= 2 && !usedToday.has(x.id) && !usedAdm.has(x.id)) : findFor(tpl);
      if (!p) return;
      usedAdm.add(p.id);
      makeVisit(p, tpl, at(addDays(today, -daysAgo), int(8, 20), int(0, 59)), 'RI', { stage: 'partial' });
    });
    const chfPatient = patients.find((p) => p._kronis.includes('CHF') && !usedToday.has(p.id) && !usedAdm.has(p.id));
    if (chfPatient) makeVisit(chfPatient, RI.CHF_RI, at(addDays(today, -2), 9, 30), 'RI', { stage: 'partial' });

    /* Nomor kunjungan, nomor RM, tanggal daftar */
    visits.sort((a, b) => (a.tglMasuk < b.tglMasuk ? -1 : 1));
    const perDay = {};
    visits.forEach((v) => {
      const key = v.jenis + v.tglMasuk.slice(0, 10);
      perDay[key] = (perDay[key] || 0) + 1;
      v.nomor = `${v.jenis}-${v.tglMasuk.slice(2, 10).replace(/-/g, '')}-${String(perDay[key]).padStart(3, '0')}`;
    });
    const first = {};
    visits.forEach((v) => {
      if (!first[v.patientId]) first[v.patientId] = v.tglMasuk;
    });
    const ordered = patients.slice().sort((a, b) => ((first[a.id] || '9') < (first[b.id] || '9') ? -1 : 1));
    let rm = 4120;
    ordered.forEach((p) => {
      rm += int(1, 40);
      p.noRM = App.store.formatRM(rm);
      p.createdAt = (first[p.id] || ui.toISO(today)).slice(0, 10) + 'T07:30';
      p.createdBy = users[1].id;
    });
    patients.forEach((p) => {
      delete p._age;
      delete p._bb;
      delete p._tb;
      delete p._kronis;
    });
    // Terapkan alergi pada keluhan yang relevan tidak diperlukan; data sengaja sederhana.

    return {
      version: 1,
      counters: { seq, rm },
      users,
      patients,
      visits,
      audit: [{ id: 'a0', ts: ui.toISO(today), userId: null, nama: 'Sistem', role: '-', aksi: 'Data contoh dimuat', detail: `${patients.length} pasien dan ${visits.length} kunjungan fiktif dibuat untuk demo`, patientId: null }],
    };
  }

  App.seed = { generate, TEMPLATES: T, RI };
})();
