# tugas2-vue-ut
📁 Struktur Proyek tugas2-vue-ut/
```text
tugas2-vue-ut/
├─ index.html          ← Landing page dengan navigasi
├─ stok.html           ← Halaman 1: Stok Bahan Ajar
├─ tracking.html       ← Halaman 2: Tracking DO
├─ css/
│  └─ style.css        ← Tema dark navy, Google Fonts
└─ js/
   ├─ dataBahanAjar.js ← Dummy data (extended dari file asli)
   ├─ stok-app.js      ← Logic Vue untuk stok.html
   └─ tracking-app.js  ← Logic Vue untuk tracking.html
```

✅ Fitur yang Diimplementasikan per Indikator
Indikator,Implementasi
1. Arsitektur Vue,"Pemisahan file: HTML, CSS, JS terpisah rapi; Vue instance per halaman"
2. Data Binding & Directive,"v-model, v-bind, v-html, v-for, mustaches {{ }}, v-text"
3. Conditional,v-if / v-else-if / v-else untuk status stok & DO; v-show untuk filter/modal
4. Computed & Methods,"filteredStok (cached), kategoriTersedia, nextNoDO, selectedPaket, totalHargaTerpilih, statsDO, dll"
5. Watchers (min. 2),"Stok: 3 watcher di stok-app + 3 watcher di tracking-app (perubahan filter, deep watch data, auto-fill tanggal)"
6. Formulir & Validasi,"Form tambah/edit bahan ajar + form tambah DO, semua dengan validasi input + pesan error per field"
7. Kreativitas UI,"Tema dark navy dengan badge warna, timeline perjalanan, accordion DO card, stats bar, watcher log"

Dependent options: filter Kategori hanya muncul setelah memilih UT-Daerah
Auto-generate Nomor DO dengan format DO{TAHUN}-{SEQ}
Preview catatan HTML real-time saat mengisi form
Detail isi paket muncul otomatis setelah memilih paket di form DO
Log Watcher ditampilkan di UI sebagai bukti watcher aktif
