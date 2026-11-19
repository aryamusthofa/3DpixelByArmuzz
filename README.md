# CHROMA RIFT — Pixel × 3D Foundation

Game hybrid **pixel art 2D + dunia 3D neon** yang berjalan di browser.
Seluruh aset (sprite, glow, partikel, musik, SFX) dibuat **prosedural** — tanpa file gambar/audio eksternal, sehingga aman dari plagiat dan masalah hak cipta pihak ketiga.

## Menjalankan

1. Buka `index.html` langsung di browser modern (Chrome/Edge/Firefox/Safari), **atau**
2. Jalankan server lokal dari folder ini:
   ```
   npx serve .
   ```
   lalu buka alamat yang ditampilkan.

> Three.js dimuat dari CDN (`unpkg`) saat pertama kali dibuka. Untuk mode offline, unduh `three.min.js` dan ubah tag script di `index.html` agar menunjuk ke file lokal.

## Kontrol

| Aksi | Desktop | Seluler |
|---|---|---|
| Gerak kiri/kanan | `A` `D` / `←` `→` | Joystick |
| Lompat (double jump) | `Space` / `W` / `↑` | Tombol JUMP |
| Dash | `Shift` / `X` | Tombol DASH |
| Jeda | `Esc` | Tombol ❚❚ |
| Layar penuh | `F` | Tombol di Pengaturan |

## Fitur fondasi

- Endless runner dengan kecepatan progresif dan 4 sektor warna (palet 3D berganti otomatis).
- Player pixel art (digambar via canvas) hidup di dunia 3D Three.js.
- Core kolektibel, combo multiplier, 3 nyawa, dash dengan cooldown, double jump.
- Bahaya statis dan hazard yang bergerak (drift) di jalur berbeda.
- HUD lengkap: skor, best score, combo, hearts, dash meter, FPS, sektor.
- Fullscreen + pengaturan grafis: Low/Medium/High/Ultra, adaptive resolution, musik, SFX, FPS.
- Penyimpanan best score & pengaturan di `localStorage`.
- Kontrol sentuh (joystick + tombol) dan keyboard.
- Efek: partikel burst, screen shake, damage flash, scanline/vignette, banner sektor.
- Musik dan SFX disintesis dengan WebAudio (tanpa aset eksternal).

## Struktur

```
chroma-rift/
├─ index.html
├─ styles.css
└─ js/
   ├─ util.js    # helper, Settings, State, konstanta
   ├─ audio.js   # WebAudio synth (musik + SFX)
   ├─ input.js   # keyboard + joystick sentuh
   ├─ render.js  # Three.js, kamera, partikel, palet, kualitas
   ├─ world.js   # spawn pola, fisika player, tabrakan
   └─ game.js    # state machine, UI, HUD, loop
```

## Catatan performa

- Preset **Low** menurunkan render scale ke 0.55 dan mematikan bayangan — cocok untuk HP lama.
- **Adaptive** otomatis menurunkan resolusi saat FPS < 38 dan menaikkannya kembali perlahan.
- Geometri & material objek dibagikan (shared) untuk mengurangi alokasi memori.
- Partikel memakai satu `Points` buffer dengan draw range dinamis.

## Roadmap (belum termasuk fondasi ini)

- Musuh dengan pola serangan, boss per sektor, dan mini-objective harian.
- Biome/level baru + mekanik Rift Shift (beralih 2D/3D).
- Leaderboard online, ghost replay, dan race mode.
- Sistem unlock kosmetik (murni kosmetik, tanpa pay-to-win).
- Build native Android/iOS via Capacitor dan dukungan gamepad.
