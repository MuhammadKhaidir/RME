# RME Terpadu (prototipe front-end)

Antarmuka Rekam Medis Elektronik terpadu untuk **mempermudah pencarian riwayat medis pasien**.
Dibuat dengan HTML, JavaScript biasa (tanpa framework), dan Tailwind CSS v4. Tidak ada backend:
data disimpan di `localStorage` browser, jadi aman dicoba dan bisa direset kapan saja.

> Semua nama pasien, NIK, dan nomor telepon di aplikasi ini adalah data rekaan.

## Cara menjalankan

1. Buka folder ini di VS Code.
2. Pasang ekstensi yang direkomendasikan (**Live Server** dan **Tailwind CSS IntelliSense**).
3. Klik kanan `index.html`, pilih **Open with Live Server**.

Bisa juga dengan klik dua kali `index.html` (jalan tanpa server). CSS sudah dibangun di `css/output.css`,
jadi **tidak perlu `npm install` hanya untuk menjalankan**.

## Akun demo

| Peran | Nama pengguna | Kata sandi |
|---|---|---|
| Petugas RME (administrator, pendaftaran, rekam medis) | `admin` | `admin123` |
| Tenaga Medis, dokter (Poli Umum) | `dokter` | `dokter123` |
| Tenaga Medis, perawat | `perawat` | `perawat123` |

Akun `daftar` (`daftar123`) dan `rm` (`rm123`) juga tersedia, keduanya berperan sebagai Petugas RME.

Data contoh (58 pasien, sekitar 400 kunjungan) dibuat otomatis saat pertama dibuka, relatif terhadap tanggal hari itu.
Petugas RME bisa membuat ulang data lewat tombol reset di bagian bawah sidebar.

## Fitur dan kaitannya dengan laporan

| Kebutuhan di laporan | Di aplikasi |
|---|---|
| Pencarian riwayat berdasarkan nama atau No. RM, plus kata kunci | **Cari riwayat**: satu kotak untuk nama, No. RM (dengan/tanpa tanda hubung), NIK, No. HP, diagnosis, kode ICD-10, tindakan, dan obat. Hasil muncul saat mengetik, kata kunci disorot, bisa difilter layanan dan periode, bisa dinavigasi dengan papan ketik (`/` untuk fokus ke kotak cari) |
| Riwayat kunjungan dalam satu garis waktu | **Detail pasien**: rawat jalan dan rawat inap bercampur dalam satu timeline, ada filter dan pencarian di dalam riwayat |
| Rawat jalan dan rawat inap satu basis data | Satu penyimpanan (`js/store.js`) dipakai semua halaman |
| Mencegah duplikasi nomor RM | No. RM dibuat otomatis dan tidak bisa diubah. Formulir pasien baru memblokir NIK yang sudah ada dan memperingatkan nama mirip dengan tanggal lahir sama |
| Hak akses sesuai peran | 2 aktor: Petugas RME (administrator, pendaftaran, rekam medis) dan Tenaga Medis (dokter, perawat). Aturan ada di satu tempat (`js/auth.js`) dan matriksnya tampil di halaman **Pengguna dan hak akses** |
| Pendaftaran pasien, pencatatan kunjungan, pemeriksaan (diagnosis dan tindakan) | Halaman **Pasien baru**, **Kunjungan baru**, dan **Pemeriksaan** (tanda vital, anamnesis, diagnosis ICD-10, tindakan, terapi) |
| Keamanan data pasien | **Log aktivitas** mencatat siapa membuka atau mengubah data pasien |

## Struktur folder

```
index.html            halaman tunggal, memuat semua skrip
src/input.css         masukan Tailwind: warna, font, dan kelas komponen (.btn, .field, .panel, ...)
css/output.css        hasil build Tailwind (jangan diedit manual)
js/config.js          nama RS, daftar poli, ruang rawat
js/seed.js            pembuat data contoh
js/store.js           "basis data" (localStorage) dan aturan duplikasi
js/auth.js            peran dan hak akses
js/router.js          router hash (#/pasien/p12)
js/layout.js          sidebar dan bar atas
js/pages/*.js         satu berkas per halaman
```

## Mengubah tampilan

- Nama aplikasi/RS: `js/config.js`
- Warna dan font: blok `@theme` di `src/input.css`
- Setelah mengubah kelas Tailwind di HTML/JS atau `src/input.css`, bangun ulang CSS:

```bash
npm install
npm run dev      # memantau perubahan dan membangun ulang otomatis
npm run build    # versi minify
```

Font IBM Plex dimuat dari Google Fonts. Tanpa internet, browser memakai font sistem.

## Menghubungkan ke backend nanti

Semua halaman membaca dan menulis data lewat objek `App.store` (`js/store.js`). Untuk memakai API sungguhan,
ganti isi fungsi di berkas itu dengan pemanggilan `fetch` dan biarkan halaman tidak berubah.

## Batasan prototipe

- Login hanyalah simulasi: kata sandi tersimpan apa adanya di `localStorage`. Jangan dipakai untuk data pasien sungguhan.
- Hak akses di sini hanya mengatur tampilan. Pada sistem sungguhan, aturan yang sama harus dijalankan di server.
- Daftar ICD-10 hanya contoh singkat, bukan master lengkap.
