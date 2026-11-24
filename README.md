# Sweena – Landing Page & Katalog

Situs statis (HTML, CSS, JavaScript) hasil konversi desain Figma "Sweena (Blue Ver)".
Buka `index.html` di browser (butuh internet untuk memuat font Google Fonts).

## Halaman
| File | Isi |
|------|-----|
| `index.html` | Landing page: hero, Featured Collection, How To Order, About Us, Contact |
| `kategori-artificial.html` | Katalog Artificial Flower (Single & Bouquet) |
| `kategori-pipecleaner.html` | Katalog Pipe Cleaner Flower (Single & Bouquet) |
| `checkout.html` | Item pesanan, formulir pemesan, catatan, dan Detail Belanja (struk) |
| `style.css` | Gaya dasar + gaya hasil konversi Figma (satu kelas per layer) |
| `script.js` | Responsif, teks berjalan, navigasi, keranjang, checkout, struk |
| `images/` | Gambar dengan nama sesuai isinya |

## Cara kerja
- **Responsif**: setiap halaman membawa dua desain Figma (desktop 1280px dan mobile 402px). `script.js`
  menskalakan frame mengikuti lebar layar; di bawah 768px desain mobile yang tampil.
- **Keranjang**: tombol `+` di katalog menambah item. Data disimpan di `localStorage` (kunci `sweena-cart`)
  sehingga terbawa ke panel keranjang dan halaman checkout.
- **Checkout**: isi formulir lalu "Cetak Struk Belanja". Struk bisa diunduh sebagai gambar PNG,
  atau dikirim ke admin (teks disalin otomatis, lalu DM Instagram @sweena.flo terbuka).
- **Garis retro** (papan catur pink/biru): di HTML cukup `<div class="retro-line"></div>` kosong.
  `buildRetroLines()` di `script.js` mengisinya dengan kotak 14px sesuai lebar elemen; warnanya dari `color` di CSS.
- **Data keranjang** disimpan di `localStorage` kunci `sweena-cart-v2`. Data lama/rusak otomatis diabaikan
  (tidak membuat script error). Untuk mengosongkan manual: `localStorage.removeItem("sweena-cart-v2")` di Console.
- **Layout dinamis**: item yang bertambah menggeser elemen di bawahnya (`data-follow`) dan memanjangkan
  wadahnya (`data-grow`); lihat bagian "Layout dinamis" di `script.js`.

## Menambah produk di katalog
Setiap kartu produk memakai atribut `data-product` dengan isi bertanda `data-field="name|price|image"`.
Salin satu blok kartu di HTML kategori lalu ganti nama, harga, dan gambarnya.

## Mengganti gambar hero / logo
Logo (`logo-sweena.png`) dan buket hero (`hero-buket-biru-ungu.png`) dipasang dengan ukuran & posisi hasil Figma,
jadi file pengganti harus memakai kanvas yang sama dengan file lama, kalau tidak letaknya bergeser:
- `logo-sweena.png`: kanvas persegi, logo selebar ±79% kanvas, di tengah.
- `hero-buket-biru-ungu.png`: rasio 341:408, buket menempel kiri-bawah dan **disimpan terbalik kiri-kanan**
  (CSS `.hero-image-2` membaliknya lagi saat tampil, sehingga lengan terlihat di sisi kanan layar).
