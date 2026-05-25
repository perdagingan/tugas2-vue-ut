// tracking-app.js — Vue Logic untuk Halaman Tracking DO
// Tugas Praktik 2 SITTA UT

var trackingApp = new Vue({
  el: '#tracking-app',
  data: {
    // ── Data Referensi ──────────────────────────────────────
    pengirimanList: pengirimanList,
    paketList: paket,

    // ── Data DO (dari dataBahanAjar.js, deep copy) ───────────
    daftarDO: (function() {
      var arr = [];
      Object.keys(trackingData).forEach(function(key) {
        var d = Object.assign({}, trackingData[key]);
        d.noDO = key;
        d.perjalanan = d.perjalanan.slice();
        arr.push(d);
      });
      return arr;
    })(),

    // ── Tracking Search ─────────────────────────────────────
    searchNoDO: '',
    searchResult: null,
    searchError: '',

    // ── Modal Tambah DO ──────────────────────────────────────
    showModalDO: false,
    formDO: {
      nim: '',
      nama: '',
      ekspedisi: '',
      paketKode: '',
      tanggalKirim: ''
    },
    formDOErrors: {},
    doDraftNomor: '',
    successMsgDO: '',

    // ── Expand state untuk card DO ───────────────────────────
    expandedDO: {},

    // ── Watcher log ─────────────────────────────────────────
    watcherLog: []
  },

  // ─────────────────────────────────────────────────────────
  // COMPUTED
  // ─────────────────────────────────────────────────────────
  computed: {
    // Nomor DO berikutnya (auto-generate)
    nextNoDO: function() {
      var tahun = new Date().getFullYear();
      var prefix = 'DO' + tahun + '-';
      var existingNums = this.daftarDO
        .map(function(d) {
          var parts = d.noDO.split('-');
          return parseInt(parts[parts.length - 1]) || 0;
        });
      var max = existingNums.length > 0 ? Math.max.apply(null, existingNums) : 0;
      var seq = String(max + 1).padStart(3, '0');
      return prefix + seq;
    },

    // Detail paket yang dipilih saat form DO dibuka
    selectedPaket: function() {
      var kode = this.formDO.paketKode;
      if (!kode) return null;
      return this.paketList.find(function(p) { return p.kode === kode; }) || null;
    },

    // Isi (judul buku) dari paket yang dipilih
    isiPaketTerpilih: function() {
      if (!this.selectedPaket) return [];
      var isi = this.selectedPaket.isi;
      // Gabungkan dengan data stok untuk dapat judul
      return isi.map(function(kode) {
        var buku = stokData.find(function(s) { return s.kode === kode; });
        return buku ? { kode: kode, judul: buku.judul } : { kode: kode, judul: kode };
      });
    },

    // Total harga dari paket yang dipilih
    totalHargaTerpilih: function() {
      if (!this.selectedPaket) return 0;
      return this.selectedPaket.harga;
    },

    // Statistik DO
    statsDO: function() {
      var dalam   = this.daftarDO.filter(function(d){ return d.status === 'Dalam Perjalanan'; }).length;
      var terkirim = this.daftarDO.filter(function(d){ return d.status === 'Terkirim'; }).length;
      var pending  = this.daftarDO.filter(function(d){ return d.status === 'Pending'; }).length;
      return { total: this.daftarDO.length, dalam: dalam, terkirim: terkirim, pending: pending };
    }
  },

  // ─────────────────────────────────────────────────────────
  // WATCHERS
  // ─────────────────────────────────────────────────────────
  watch: {
    // Watcher 1: Pantau perubahan paket yang dipilih → update preview harga
    'formDO.paketKode': function(newVal, oldVal) {
      this.watcherLog.unshift({
        waktu: new Date().toLocaleTimeString('id-ID'),
        pesan: 'Paket berubah: "' + (oldVal || '-') + '" → "' + (newVal || '-') + '"' +
               (this.selectedPaket ? '. Harga: Rp ' + this.selectedPaket.harga.toLocaleString('id-ID') : '')
      });
      if (this.watcherLog.length > 5) this.watcherLog.pop();
    },

    // Watcher 2: Pantau daftarDO — update nomor draft saat data berubah
    daftarDO: {
      deep: false,
      handler: function(newVal) {
        this.doDraftNomor = this.nextNoDO;
        this.watcherLog.unshift({
          waktu: new Date().toLocaleTimeString('id-ID'),
          pesan: 'Daftar DO diperbarui. Total ' + newVal.length + ' DO. Nomor berikutnya: ' + this.nextNoDO
        });
        if (this.watcherLog.length > 5) this.watcherLog.pop();
        // Simpan ke localStorage
        try { localStorage.setItem('sitta_do_backup', JSON.stringify(newVal)); } catch(e) {}
      }
    },

    // Watcher 3: Auto-fill tanggal kirim ke hari ini saat modal dibuka
    showModalDO: function(val) {
      if (val) {
        var today = new Date();
        var y = today.getFullYear();
        var m = String(today.getMonth() + 1).padStart(2, '0');
        var d = String(today.getDate()).padStart(2, '0');
        this.formDO.tanggalKirim = y + '-' + m + '-' + d;
        this.watcherLog.unshift({
          waktu: new Date().toLocaleTimeString('id-ID'),
          pesan: 'Modal DO dibuka. Tanggal kirim diisi otomatis: ' + this.formDO.tanggalKirim
        });
        if (this.watcherLog.length > 5) this.watcherLog.pop();
      }
    }
  },

  // ─────────────────────────────────────────────────────────
  // METHODS
  // ─────────────────────────────────────────────────────────
  methods: {
    // ── Helper ──────────────────────────────────────────────
    formatHarga: function(val) {
      return 'Rp ' + Number(val).toLocaleString('id-ID');
    },
    formatTanggal: function(str) {
      if (!str) return '-';
      var d = new Date(str);
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    },
    namaEkspedisi: function(kode) {
      var exp = this.pengirimanList.find(function(e) { return e.kode === kode; });
      return exp ? exp.nama : kode;
    },
    namaPaket: function(kode) {
      var p = this.paketList.find(function(p) { return p.kode === kode; });
      return p ? p.nama : kode;
    },
    getStatusClass: function(status) {
      if (status === 'Dalam Perjalanan') return 'status-pill status-dalam-perjalanan';
      if (status === 'Terkirim')         return 'status-pill status-terkirim';
      return 'status-pill status-pending';
    },

    // ── Toggle expand DO card ────────────────────────────────
    toggleExpand: function(noDO) {
      Vue.set(this.expandedDO, noDO, !this.expandedDO[noDO]);
    },
    isExpanded: function(noDO) {
      return !!this.expandedDO[noDO];
    },

    // ── Search DO ───────────────────────────────────────────
    cariDO: function() {
      this.searchError = '';
      this.searchResult = null;
      var q = this.searchNoDO.trim().toUpperCase();
      if (!q) { this.searchError = 'Masukkan nomor DO terlebih dahulu.'; return; }
      var found = this.daftarDO.find(function(d) { return d.noDO.toUpperCase() === q; });
      if (!found) {
        this.searchError = 'Nomor DO "' + q + '" tidak ditemukan.';
      } else {
        this.searchResult = found;
      }
    },
    resetSearch: function() {
      this.searchNoDO   = '';
      this.searchResult = null;
      this.searchError  = '';
    },

    // ── Modal DO ─────────────────────────────────────────────
    bukaModalDO: function() {
      this.formDO = { nim:'', nama:'', ekspedisi:'', paketKode:'', tanggalKirim:'' };
      this.formDOErrors = {};
      this.successMsgDO = '';
      this.showModalDO  = true;
    },
    tutupModalDO: function() {
      this.showModalDO = false;
    },

    // ── Validasi Form DO ─────────────────────────────────────
    validasiDO: function() {
      var err = {};
      var f = this.formDO;
      if (!f.nim.trim())          err.nim        = 'NIM wajib diisi';
      else if (!/^\d{6,12}$/.test(f.nim.trim())) err.nim = 'NIM harus 6-12 angka';
      if (!f.nama.trim())         err.nama       = 'Nama wajib diisi';
      if (!f.ekspedisi)           err.ekspedisi  = 'Pilih jenis ekspedisi';
      if (!f.paketKode)           err.paketKode  = 'Pilih paket bahan ajar';
      if (!f.tanggalKirim)        err.tanggalKirim = 'Tanggal kirim wajib diisi';
      this.formDOErrors = err;
      return Object.keys(err).length === 0;
    },

    // ── Simpan DO Baru ───────────────────────────────────────
    simpanDO: function() {
      if (!this.validasiDO()) return;
      var f = this.formDO;
      var noDO = this.nextNoDO;
      this.daftarDO.push({
        noDO:         noDO,
        nim:          f.nim.trim(),
        nama:         f.nama.trim(),
        status:       'Pending',
        ekspedisi:    f.ekspedisi,
        tanggalKirim: f.tanggalKirim,
        paket:        f.paketKode,
        total:        this.totalHargaTerpilih,
        perjalanan:   [
          {
            waktu: f.tanggalKirim + ' 00:00:00',
            keterangan: 'DO dibuat — menunggu proses pengiriman'
          }
        ]
      });
      this.successMsgDO = 'DO ' + noDO + ' berhasil dibuat!';
      var self = this;
      setTimeout(function() { self.tutupModalDO(); }, 1200);
    }
  }
});
