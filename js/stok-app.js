// stok-app.js — Vue Logic untuk Halaman Stok Bahan Ajar
// Tugas Praktik 2 SITTA UT

var stokApp = new Vue({
  el: '#stok-app',
  data: {
    // ── Data Referensi (dari dataBahanAjar.js) ──────────────
    upbjjList: upbjjList,
    kategoriList: kategoriList,

    // ── Data Stok ───────────────────────────────────────────
    stok: JSON.parse(JSON.stringify(stokData)), // deep copy agar data asli tidak berubah

    // ── Filter State ────────────────────────────────────────
    filterUpbjj: '',
    filterKategori: '',
    filterReorder: false,  // hanya tampilkan qty < safety atau qty = 0
    sortField: '',
    sortAsc: true,

    // ── Modal Tambah Bahan Ajar ──────────────────────────────
    showTambahModal: false,
    formBaru: {
      kode: '',
      judul: '',
      kategori: '',
      upbjj: '',
      lokasiRak: '',
      harga: '',
      qty: '',
      safety: '',
      catatanHTML: ''
    },
    formErrors: {},
    successMsg: '',

    // ── Modal Edit ───────────────────────────────────────────
    showEditModal: false,
    formEdit: null,
    editIndex: null,
    editErrors: {},
    editSuccessMsg: '',

    // ── Watcher log (untuk demonstrasi watcher) ──────────────
    watcherLog: []
  },

  // ─────────────────────────────────────────────────────────
  // COMPUTED PROPERTIES
  // ─────────────────────────────────────────────────────────
  computed: {
    // Kategori yang tersedia berdasarkan upbjj yang dipilih (dependent options)
    kategoriTersedia: function() {
      if (!this.filterUpbjj) return [];
      var self = this;
      var cats = this.stok
        .filter(function(s) { return s.upbjj === self.filterUpbjj; })
        .map(function(s) { return s.kategori; });
      return [...new Set(cats)];
    },

    // Filtered + Sorted list (CACHED — tidak recompute kecuali dependency berubah)
    filteredStok: function() {
      var self = this;
      var result = this.stok.filter(function(item) {
        if (self.filterUpbjj && item.upbjj !== self.filterUpbjj) return false;
        if (self.filterKategori && item.kategori !== self.filterKategori) return false;
        if (self.filterReorder && item.qty >= item.safety && item.qty !== 0) return false;
        return true;
      });

      if (this.sortField) {
        var field = this.sortField;
        var asc   = this.sortAsc;
        result = result.slice().sort(function(a, b) {
          var va = a[field];
          var vb = b[field];
          if (typeof va === 'string') va = va.toLowerCase();
          if (typeof vb === 'string') vb = vb.toLowerCase();
          if (va < vb) return asc ? -1 : 1;
          if (va > vb) return asc ?  1 : -1;
          return 0;
        });
      }
      return result;
    },

    // Hitung jumlah item yang perlu reorder
    jumlahReorder: function() {
      return this.stok.filter(function(s) { return s.qty < s.safety; }).length;
    },

    // Total stok keseluruhan
    totalStok: function() {
      return this.stok.reduce(function(sum, s) { return sum + s.qty; }, 0);
    },

    // Cek apakah form tambah baru valid
    isTambahValid: function() {
      return Object.keys(this.formErrors).length === 0 && this.formBaru.kode !== '';
    }
  },

  // ─────────────────────────────────────────────────────────
  // WATCHERS
  // ─────────────────────────────────────────────────────────
  watch: {
    // Watcher 1: Reset filter kategori saat upbjj berubah (dependent filter)
    filterUpbjj: function(newVal, oldVal) {
      this.filterKategori = '';
      this.watcherLog.unshift({
        waktu: new Date().toLocaleTimeString('id-ID'),
        pesan: 'Filter UPBJJ berubah dari "' + (oldVal || 'Semua') + '" → "' + (newVal || 'Semua') + '". Filter kategori direset.'
      });
      if (this.watcherLog.length > 5) this.watcherLog.pop();
    },

    // Watcher 2: Pantau perubahan data stok — simpan ke localStorage sebagai backup
    stok: {
      deep: true,
      handler: function(newVal) {
        try {
          localStorage.setItem('sitta_stok_backup', JSON.stringify(newVal));
        } catch(e) {}
        this.watcherLog.unshift({
          waktu: new Date().toLocaleTimeString('id-ID'),
          pesan: 'Data stok diperbarui. Total ' + newVal.length + ' item tersimpan.'
        });
        if (this.watcherLog.length > 5) this.watcherLog.pop();
      }
    },

    // Watcher 3: Pantau filter reorder — tampilkan notifikasi
    filterReorder: function(val) {
      this.watcherLog.unshift({
        waktu: new Date().toLocaleTimeString('id-ID'),
        pesan: 'Filter Re-Order ' + (val ? 'AKTIF — menampilkan stok kritis.' : 'dinonaktifkan.')
      });
      if (this.watcherLog.length > 5) this.watcherLog.pop();
    }
  },

  // ─────────────────────────────────────────────────────────
  // METHODS
  // ─────────────────────────────────────────────────────────
  methods: {
    // ── Helper Status ───────────────────────────────────────
    getStatus: function(item) {
      if (item.qty === 0)            return 'kosong';
      if (item.qty < item.safety)    return 'menipis';
      return 'aman';
    },
    getStatusLabel: function(item) {
      var s = this.getStatus(item);
      if (s === 'kosong')  return '🔴 Kosong';
      if (s === 'menipis') return '🟠 Menipis';
      return '🟢 Aman';
    },
    getStatusClass: function(item) {
      return 'badge badge-' + this.getStatus(item);
    },
    formatHarga: function(val) {
      return 'Rp ' + Number(val).toLocaleString('id-ID');
    },

    // ── Sort ────────────────────────────────────────────────
    setSort: function(field) {
      if (this.sortField === field) {
        this.sortAsc = !this.sortAsc;
      } else {
        this.sortField = field;
        this.sortAsc = true;
      }
    },
    sortIcon: function(field) {
      if (this.sortField !== field) return '↕';
      return this.sortAsc ? '↑' : '↓';
    },

    // ── Reset Filter ────────────────────────────────────────
    resetFilter: function() {
      this.filterUpbjj   = '';
      this.filterKategori = '';
      this.filterReorder = false;
      this.sortField     = '';
      this.sortAsc       = true;
    },

    // ── Modal Tambah ────────────────────────────────────────
    bukaModalTambah: function() {
      this.formBaru = { kode:'', judul:'', kategori:'', upbjj:'', lokasiRak:'', harga:'', qty:'', safety:'', catatanHTML:'' };
      this.formErrors = {};
      this.successMsg = '';
      this.showTambahModal = true;
    },
    tutupModalTambah: function() {
      this.showTambahModal = false;
    },

    // ── Validasi Form Tambah ────────────────────────────────
    validasiTambah: function() {
      var err = {};
      var f = this.formBaru;
      if (!f.kode.trim())    err.kode    = 'Kode MK wajib diisi';
      else if (this.stok.some(function(s){ return s.kode === f.kode.trim(); }))
                             err.kode    = 'Kode MK sudah ada';
      if (!f.judul.trim())   err.judul   = 'Judul wajib diisi';
      if (!f.kategori)       err.kategori = 'Pilih kategori';
      if (!f.upbjj)          err.upbjj   = 'Pilih UT-Daerah';
      if (!f.lokasiRak.trim()) err.lokasiRak = 'Lokasi rak wajib diisi';
      if (f.harga === '' || isNaN(Number(f.harga)) || Number(f.harga) < 0)
                             err.harga   = 'Harga harus angka ≥ 0';
      if (f.qty === '' || isNaN(Number(f.qty)) || Number(f.qty) < 0)
                             err.qty     = 'Jumlah stok harus angka ≥ 0';
      if (f.safety === '' || isNaN(Number(f.safety)) || Number(f.safety) < 0)
                             err.safety  = 'Safety stock harus angka ≥ 0';
      this.formErrors = err;
      return Object.keys(err).length === 0;
    },
    simpanTambah: function() {
      if (!this.validasiTambah()) return;
      var f = this.formBaru;
      this.stok.push({
        kode:        f.kode.trim().toUpperCase(),
        judul:       f.judul.trim(),
        kategori:    f.kategori,
        upbjj:       f.upbjj,
        lokasiRak:   f.lokasiRak.trim(),
        harga:       Number(f.harga),
        qty:         Number(f.qty),
        safety:      Number(f.safety),
        catatanHTML: f.catatanHTML
      });
      this.successMsg = 'Bahan ajar berhasil ditambahkan!';
      setTimeout(function() { stokApp.showTambahModal = false; }, 1200);
    },

    // ── Modal Edit ──────────────────────────────────────────
    bukaModalEdit: function(item, idx) {
      // Cari index pada data asli (bukan filtered)
      var self = this;
      var realIdx = this.stok.findIndex(function(s) { return s.kode === item.kode; });
      this.editIndex = realIdx;
      this.formEdit  = Object.assign({}, this.stok[realIdx]);
      this.editErrors = {};
      this.editSuccessMsg = '';
      this.showEditModal = true;
    },
    tutupModalEdit: function() {
      this.showEditModal = false;
    },
    validasiEdit: function() {
      var err = {};
      var f = this.formEdit;
      if (!f.judul.trim())  err.judul = 'Judul wajib diisi';
      if (!f.kategori)      err.kategori = 'Pilih kategori';
      if (!f.upbjj)         err.upbjj = 'Pilih UT-Daerah';
      if (!f.lokasiRak.trim()) err.lokasiRak = 'Lokasi rak wajib diisi';
      if (f.harga === '' || isNaN(Number(f.harga)) || Number(f.harga) < 0)
                            err.harga = 'Harga harus angka ≥ 0';
      if (f.qty === '' || isNaN(Number(f.qty)) || Number(f.qty) < 0)
                            err.qty = 'Jumlah stok harus angka ≥ 0';
      if (f.safety === '' || isNaN(Number(f.safety)) || Number(f.safety) < 0)
                            err.safety = 'Safety stock harus angka ≥ 0';
      this.editErrors = err;
      return Object.keys(err).length === 0;
    },
    simpanEdit: function() {
      if (!this.validasiEdit()) return;
      var f = this.formEdit;
      Vue.set(this.stok, this.editIndex, {
        kode:        this.stok[this.editIndex].kode,
        judul:       f.judul.trim(),
        kategori:    f.kategori,
        upbjj:       f.upbjj,
        lokasiRak:   f.lokasiRak.trim(),
        harga:       Number(f.harga),
        qty:         Number(f.qty),
        safety:      Number(f.safety),
        catatanHTML: f.catatanHTML
      });
      this.editSuccessMsg = 'Data berhasil diperbarui!';
      setTimeout(function() { stokApp.showEditModal = false; }, 1100);
    }
  }
});
