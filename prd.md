# PRD: Aplikasi Photo Booth Digital = ClickIt

## 1. Latar Belakang
Aplikasi photo booth self-service terinspirasi dari LumaBooth, dioperasikan lewat dua device terpisah: satu untuk sesi foto pembeli, satu untuk pencetakan dan pengelolaan riwayat oleh admin.

## 2. Tujuan
- Menyediakan pengalaman photo booth cepat dan mudah dioperasikan tanpa aplikasi native (berbasis web/PWA)
- Memisahkan alur capture dan cetak ke dua device agar operasional lebih efisien saat acara
- Menyimpan riwayat seluruh sesi foto pembeli secara otomatis

## 3. Target Pengguna

| Peran | Device | Kebutuhan Utama |
|---|---|---|
| Pembeli/Tamu | Device 1 (iPad) | Ambil foto, pilih filter/strip, dapat hasil digital |
| Admin/Panitia | Device 2 (Laptop) | Kelola antrian cetak, cetak fisik, lihat riwayat |

## 4. Ruang Lingkup

**In scope (MVP):**
- Foto & GIF
- Filter
- Overlay/strip
- Glam booth (deteksi wajah + smoothing)
- Dashboard admin (konfigurasi tema/template)
- Cetak fisik
- Bagi hasil via QR code
- Riwayat transaksi

## 5. Requirement Fungsional

**5.1 Capture (Device 1)**
- FR1: Akses kamera via browser dengan preview live
- FR2: Capture 3 foto berurutan per sesi — dipakai untuk kedua kolom strip (kiri & kanan, identik) dan untuk komposisi GIF
- FR3: Pilih filter sebelum/sesudah capture
- FR4: Pilih template overlay/strip
- FR5: Toggle glam booth on/off
- FR6: Saat "Selesai" — compose strip (3 foto + header teks, hashtag, handle sosial media) dan GIF dari 3 foto yang sama, upload ke storage, tampilkan QR download

**5.2 Dashboard Admin**
- FR7: Atur tema, filter aktif, dan template overlay per acara
- FR8: Perubahan konfigurasi tersinkron real-time ke Device 1
- FR8a: Admin bisa menambahkan/mengunggah desain template custom (background, posisi foto, teks) selain memilih dari preset

**5.3 Print & Riwayat (Device 2)**
- FR9: Antrian foto baru muncul real-time tanpa refresh manual
- FR10: Admin cetak foto dari antrian
- FR11: Semua sesi tersimpan permanen dengan status (menunggu/sudah dicetak)
- FR12: Admin bisa cari & cetak ulang dari riwayat

**5.4 Spesifikasi Output Cetak**
- Ukuran satu strip: 5 x 15 cm
- Dicetak 2 strip berdampingan per lembar, kiri & kanan identik (dari 3 foto yang sama)
- Total ukuran lembar: dua strip 5x15cm berdampingan secara ukuran jadi 10x15cm
- Resolusi cetak disarankan 300 DPI untuk hasil tajam

## 6. Arsitektur Sistem
Device 1 (iPad, PWA kiosk mode) ⟷ Cloud Backend (Firestore + Storage) ⟷ Device 2 (Laptop, dashboard web)

Kedua device tidak berkomunikasi langsung — semua data lewat backend cloud dengan realtime listener, sehingga tidak wajib berada di jaringan lokal yang sama.

## 7. Tech Stack
- Frontend: Next.js (App Router) + React
- PWA: Serwist
- Capture: `getUserMedia`, Canvas API, `gif.js`
- AI: MediaPipe (face detection untuk glam booth)
- Backend: Supabase
- Kiosk mode: Chrome/Edge `--kiosk`

## 8. Non-Functional Requirements
- Delay capture-ke-preview < 2 detik
- Sinkronisasi antar device < 1 detik
- Sistem tetap konsisten meski Device 2 sempat offline (auto-sync ulang saat online kembali)
