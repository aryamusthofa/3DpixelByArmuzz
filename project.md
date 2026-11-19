# CHROMA RIFT — Project Notes

**Status:** `v0.1 FOUNDATION` — playable, stabil di browser modern
**Terakhir diperbarui:** 19 November 2026
**Lokasi proyek:** `D:\test\opencode1\chroma-rift\`
**Dokumen ini:** ringkasan struktur, fitur selesai, bug/risiko, dan backlog.
> Catatan sesi: pembuatan `project.md` ini **tidak mengubah file kode apa pun**.

---

## 1. Struktur file terbaru

```
chroma-rift/
├─ index.html            135 baris,   6.051 B   Markup HUD, menu, settings, help, pause, game over, kontrol mobile
├─ styles.css            112 baris,   7.682 B   Tema neon, layout responsif, HUD, panel, joystick, scanline overlay
├─ README.md              54 baris,   2.847 B   Panduan singkat menjalankan & roadmap
├─ project.md             (file ini)             Catatan proyek & status pengembangan
└─ js/
   ├─ util.js             68 baris,   2.619 B   Helper, Store/localStorage, Settings, State, konstanta, palet sektor
   ├─ audio.js            82 baris,   3.300 B   WebAudio: musik loop + SFX prosedural (tanpa aset eksternal)
   ├─ input.js            59 baris,   2.408 B   Keyboard, queue jump/dash, joystick pointer + tombol sentuh
   ├─ render.js          341 baris,  13.530 B   Three.js scene, kamera, lampu, grid, partikel, sprite player, palet, kualitas
   ├─ world.js           218 baris,   7.086 B   Shared geometry/material, pola spawn, fisika player, tabrakan, combo
   └─ game.js            341 baris,  11.494 B   State machine, UI binding, HUD, settings, loop game, adaptive quality
```

Total ± **1.410 baris** kode/markup (tanpa `project.md`).

**Urutan load script (penting):**
`three.min.js` → `util.js` → `audio.js` → `input.js` → `render.js` → `world.js` → `game.js`

Semua modul memakai namespace global `window.CR` (bukan ES modules) agar tetap berjalan saat file dibuka langsung via `file://`.

---

## 2. Fitur yang sudah selesai

### 2.1 Gameplay
- [x] Endless runner 5 lane dengan kecepatan progresif (`BASE_SPEED 9` → `MAX_SPEED 24`).
- [x] Player: gerak lateral, **double jump**, **dash** dengan cooldown 2,2 detik.
- [x] Kolektibel core (+10 × combo), combo hingga `x9`, timer combo 3,5 detik.
- [x] 3 nyawa, invulnerability 1,6 detik setelah kena, blink sprite.
- [x] Pola spawn: garis core, arc core untuk lompat, hazard tunggal, hazard ganda, gerbang 4 hazard + safe lane, pola campuran hazard+core.
- [x] Hazard drift (bergerak sinus) setelah 25 detik.
- [x] Kesulitan naik berbasis waktu; jarak antar-pola menyesuaikan kecepatan.
- [x] Sektor otomatis tiap 450 m: Neon Grid → Solar Flare → Void Garden → Glitch Sea (loop).
- [x] Game over saat HP habis; restart langsung dari layar game over.

### 2.2 Visual / 3D
- [x] Dunia Three.js: grid neon, ground, rail samping, bintang, lane dash animasi.
- [x] Player pixel art 16×16 digambar via canvas, dirender sebagai billboard sprite di dunia 3D.
- [x] Core octahedron + halo additive; hazard box emissive + wireframe edges.
- [x] Partikel burst (collect/hit/jump/dash/game over) memakai satu buffer `Points` dinamis.
- [x] Fake shadow blob di bawah player; point light mengikuti player.
- [x] Palet sektor mengubah fog, background, lampu, grid, rail, ground secara halus (color lerp).
- [x] Screen shake, damage flash, scanline + vignette overlay, banner sektor.

### 2.3 UI / UX
- [x] Menu utama dengan judul, best score, play/settings/help.
- [x] HUD: skor, best, combo pill + bar, hearts, dash meter, FPS, label sektor.
- [x] Pause menu (resume, settings, restart, menu).
- [x] Settings: kualitas Low/Medium/High/Ultra, adaptive FPS, musik, SFX, tampil FPS, fullscreen.
- [x] Layar Cara Main berisi kontrol desktop & sentuh.
- [x] Game over: skor akhir, best, badge NEW RECORD.
- [x] Fullscreen via tombol dan tombol `F`.

### 2.4 Audio (prosedural, bebas aset pihak ketiga)
- [x] Musik loop 8 langkah (bass triangle + lead square) via WebAudio.
- [x] SFX: click, jump, dash, collect (pitch naik mengikuti combo), hit, game over.
- [x] Toggle musik/SFX dari settings, volume gain terpisah.

### 2.5 Performa & kualitas
- [x] Preset kualitas mengatur render scale: 0.55 / 0.80 / 1.00 / 1.50.
- [x] Toggle bayangan (shadow map) dan jumlah bintang/dekor/partikel per preset.
- [x] Adaptive quality: turunkan render scale saat FPS < 38, naikkan perlahan saat FPS > 56, dengan cooldown.
- [x] Geometri & material objek dibagikan (shared) untuk core dan hazard.
- [x] `image-rendering: pixelated` untuk mempertahankan estetika pixel saat render scale rendah.
- [x] Frame delta di-clamp 50 ms agar fisika tetap stabil saat frame drop.

### 2.6 Persistensi & mobile
- [x] Best score disimpan di `localStorage` (`chroma.best`).
- [x] Settings disimpan di `localStorage` (`chroma.settings`).
- [x] Kontrol sentuh: joystick analog X + tombol JUMP/DASH (muncul jika perangkat terdeteksi touch).
- [x] Layout HUD menyesuaikan layar sentuh (meter/hearts dinaikkan agar tidak tertutup kontrol).
- [x] Auto-pause saat tab disembunyikan (`visibilitychange`).

### 2.7 Hasil verifikasi (build saat ini)
- [x] Server lokal `http://localhost:8123` merespons `200 OK`.
- [x] Console browser bersih — **0 error** pada boot, main, pause, settings, game over, retry, dan reload.
- [x] Transisi state terverifikasi: MENU → PLAYING → PAUSED → PLAYING → GAMEOVER → PLAYING.
- [x] Settings terbukti mengubah resolusi: jendela 800 px, preset Low → canvas 440 px (0,55); Medium → 640 px (0,80).
- [x] Best score bertahan setelah reload (nilai uji: 2.798).
- [x] Gameplay berjalan: spawn core/hazard, skor & combo (`x4` terlihat), hearts, dash meter, FPS.
- [x] Tombol pause UI dan handler `Escape` berfungsi (uji event sintetis).
- [ ] Verifikasi tombol fisik `Esc`/`F` dan joystick di perangkat asli — **belum dilakukan**.

> Catatan: warning console hanya deprecation `three.min.js` dari Three.js r152, bukan error aplikasi.

---

## 3. Arsitektur singkat

- **State machine** (`CR.State.mode`): `BOOT` → `MENU` ↔ `PLAYING` ↔ `PAUSED` → `GAMEOVER`.
- **Koordinat:** kamera di `z = 11` menghadap `-z`; player tetap di `z = 0`; objek spawn di `z = -150` lalu bergerak ke `+z`, despawn di `z > 16`.
- **Lane:** `[-6, -3, 0, 3, 6]`; clamp player `x = ±7,2`.
- **Konstanta penting:** `GRAVITY 34`, `JUMP_VEL 11`, `MAX_JUMPS 2`, `DASH_CD 2.2`, `DASH_TIME 0.24`, `SECTOR_LEN 450`.
- **Loop:** `requestAnimationFrame` → update game (jika PLAYING) → partikel → warna → kamera → render. HUD di-throttle 80 ms.
- **Aset:** semua sprite/glow dibuat dari canvas; audio disintesis WebAudio. Tidak ada file gambar/audio eksternal.

---

## 4. Cara menjalankan

```powershell
cd D:\test\opencode1\chroma-rift
node -e "..."   # server statis sederhana (lihat riwayat sesi) atau:
npx serve .
```

- URL aktif di sesi ini: **http://localhost:8123** (server background, akan hidup sampai diminta matikan / sesi berakhir).
- Three.js dimuat dari CDN `unpkg.com/three@0.152.2/build/three.min.js` — butuh internet pada pembukaan pertama.
- Alternatif: buka `index.html` langsung (classic scripts, tanpa module CORS).

---

## 5. Bug / risiko yang diketahui

| # | Tingkat | Masalah | Dampak | Catatan |
|---|---|---|---|---|
| 1 | Sedang | Three.js dari CDN, belum di-vendor | Game gagal total tanpa internet | Layar `fatal` tersedia, tapi belum ada fallback lokal |
| 2 | Sedang | `setInterval` untuk musik | Timing musik bisa drift saat tab throttled | Pertimbangkan lookahead scheduler WebAudio |
| 3 | Sedang | Pause hanya saat `visibilitychange` (tab hidden) | Pindah fokus aplikasi (window blur) tidak auto-pause | Tambah listener `blur` |
| 4 | Sedang | Belum ada object pooling core/hazard | GC churn saat kecepatan tinggi / sesi panjang | Mesh/Group dibuat & dihapus tiap spawn |
| 5 | Sedang | Safe-area (notch) & layout landscape HP belum ditangani | Kontrol bisa tertutup notch/gesture bar | Gunakan `env(safe-area-inset-*)`, uji landscape |
| 6 | Rendah | Sprite player statis (tanpa frame lari/lompat) | Kurang hidup secara visual | Belum ada animasi sprite |
| 7 | Rendah | Deteksi sentuh `ontouchstart` bisa positif di laptop hybrid | Joystick muncul di perangkat ber-mouse | Ganti ke `pointer: coarse` saja bila perlu |
| 8 | Rendah | AudioContext tidak di-suspend eksplisit saat pause | SFX pendek tetap selesai; musik berhenti via gate mode | Tidak berbahaya |
| 9 | Rendah | Fullscreen iOS Safari terbatas | Tombol fullscreen bisa no-op di iPhone | Sediakan fallback/pesan |
| 10 | Rendah | FPS Medium ±45–50 di lingkungan uji otomasi | Bukan representasi perangkat nyata (software rendering) | Perlu benchmark perangkat asli |
| 11 | Rendah | Belum ada reduced-motion / colorblind / remap tombol | Aksesibilitas terbatas | Screen shake & flash belum bisa dimatikan terpisah |
| 12 | Rendah | `README.md` dan `project.md` berpotensi duplikasi | Dokumentasi bisa tidak sinkron | Jadikan `project.md` sumber utama |
| 13 | Rendah | Uji `Esc` via alat otomasi browser tidak memicu handler | Kemungkinan keterbatasan alat, bukan kode | Handler terbukti jalan via event sintetis & tombol UI; perlu cek keyboard fisik |
| 14 | Info | Render scale sengaja tidak mengikuti devicePixelRatio penuh | Ultra 1.5 bisa lebih rendah dari DPR HP 2–3 | Trade-off performa, disengaja |

---

## 6. Daftar tugas tersisa (backlog)

### P0 — Stabilisasi & rilis fondasi
- [ ] Vendor `three.min.js` ke `js/vendor/` dan hapus ketergantungan CDN (hilangkan warning deprecation).
- [ ] Uji perangkat nyata: Android low-end, iPhone, desktop mid/high; catat FPS, suhu, memori.
- [ ] Auto-pause saat window blur; suspend/resume `AudioContext` dengan benar.
- [ ] Dukungan safe-area iOS + layout landscape + uji joystick multi-touch.
- [ ] Object pooling untuk core, hazard, dan burst effect.
- [ ] QA manual: `Esc`, `F`, fullscreen, joystick, tombol pause, rotate layar.
- [ ] Pastikan `README`/`project.md` sinkron setelah perubahan.

### P1 — Konten & kedalaman gameplay
- [ ] Tipe musuh (2D glitch & 3D sentinel) dengan pola serangan berbeda.
- [ ] Boss per sektor + fase serangan dan reward.
- [ ] Mekanik **Rift Shift**: beralih 2D pixel ↔ 3D untuk puzzle/rintangan.
- [ ] Animasi sprite player: idle, run, jump, dash, hit.
- [ ] Tuning balance: jarak gate, kecepatan lateral, window lompat, kurva kesulitan.
- [ ] Tutorial singkat 10 detik pertama + objective harian.
- [ ] Sistem unlock kosmetik (murni kosmetik, tanpa pay-to-win).

### P2 — Platform & kualitas
- [ ] PWA: `manifest.json` + service worker + caching offline.
- [ ] Aksesibilitas: reduced motion, palet colorblind, fokus keyboard, remap kontrol.
- [ ] Gamepad API.
- [ ] Leaderboard online / ghost replay (butuh backend) dan anti-cheat dasar.
- [ ] Build native Android/iOS via Capacitor.
- [ ] Automated test: unit untuk spawn/State, smoke test E2E (Playwright).

---

## 7. Titik lanjut sesi berikutnya

1. Buka folder `D:\test\opencode1\chroma-rift`.
2. Jalankan server (`npx serve .` atau node one-liner) dan buka `http://localhost:8123`.
3. Prioritas berikut yang disarankan: **P0 no.1 (vendor Three.js)** lalu **P0 no.3–5**, baru masuk konten P1.
4. Semua perubahan harus mempertahankan: tanpa error console, 60 FPS target di medium (perangkat nyata), dan tidak menambah aset berhak cipta.
