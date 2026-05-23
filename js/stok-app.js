var stokApp = new Vue({
  el: '#app',
  data: function () {
    var d = JSON.parse(JSON.stringify(dataBahanAjar));
    return {
      upbjjList: d.upbjjList,
      kategoriList: d.kategoriList,
      daftarStok: d.stok,
      paketList: d.paket,

      // Filter & pencarian
      cariJudul: '',
      filterKategori: '',
      filterUpbjj: '',
      filterStatus: '',

      // Sorting
      sortKey: 'kode',
      sortAsc: true,

      // Form tambah/edit stok
      showForm: false,
      isEditing: false,
      editIndex: -1,
      form: {
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

      // Detail
      showDetail: false,
      detailItem: null,

      // Notifikasi
      notif: {
        show: false,
        type: 'info',
        message: ''
      }
    };
  },

  computed: {
    // === Computed Property 1: stokFiltered ===
    // Memfilter daftar stok berdasarkan pencarian, kategori, UPBJJ, dan status
    stokFiltered: function () {
      var self = this;
      var hasil = this.daftarStok.filter(function (item) {
        var matchJudul = item.judul.toLowerCase().indexOf(self.cariJudul.toLowerCase()) !== -1 ||
                         item.kode.toLowerCase().indexOf(self.cariJudul.toLowerCase()) !== -1;
        var matchKategori = !self.filterKategori || item.kategori === self.filterKategori;
        var matchUpbjj = !self.filterUpbjj || item.upbjj === self.filterUpbjj;
        var matchStatus = true;
        if (self.filterStatus === 'aman') {
          matchStatus = item.qty > item.safety;
        } else if (self.filterStatus === 'menipis') {
          matchStatus = item.qty > 0 && item.qty <= item.safety;
        } else if (self.filterStatus === 'habis') {
          matchStatus = item.qty === 0;
        }
        return matchJudul && matchKategori && matchUpbjj && matchStatus;
      });

      // Sorting
      var key = self.sortKey;
      var asc = self.sortAsc;
      hasil.sort(function (a, b) {
        var valA = a[key];
        var valB = b[key];
        if (typeof valA === 'string') {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
        }
        if (valA < valB) return asc ? -1 : 1;
        if (valA > valB) return asc ? 1 : -1;
        return 0;
      });

      return hasil;
    },

    // === Computed Property 2: ringkasanStok ===
    // Menghitung ringkasan statistik stok
    ringkasanStok: function () {
      var total = this.daftarStok.length;
      var aman = 0;
      var menipis = 0;
      var habis = 0;
      var totalQty = 0;

      this.daftarStok.forEach(function (item) {
        totalQty += item.qty;
        if (item.qty > item.safety) aman++;
        else if (item.qty > 0) menipis++;
        else habis++;
      });

      return {
        total: total,
        aman: aman,
        menipis: menipis,
        habis: habis,
        totalQty: totalQty
      };
    },

    // === Computed Property 3: statusStok ===
    // Menentukan status stok untuk setiap item
    statusStok: function () {
      var map = {};
      this.daftarStok.forEach(function (item) {
        if (item.qty === 0) {
          map[item.kode] = { label: 'Habis', cls: 'danger' };
        } else if (item.qty <= item.safety) {
          map[item.kode] = { label: 'Menipis', cls: 'warning' };
        } else {
          map[item.kode] = { label: 'Tersedia', cls: 'success' };
        }
      });
      return map;
    }
  },

  methods: {
    // === Method 1: formatRupiah ===
    // Memformat angka menjadi format Rupiah
    formatRupiah: function (angka) {
      if (angka === null || angka === undefined) return 'Rp 0';
      return 'Rp ' + Number(angka).toLocaleString('id-ID');
    },

    // === Method 2: sortBy ===
    // Mengatur kolom sorting
    sortBy: function (key) {
      if (this.sortKey === key) {
        this.sortAsc = !this.sortAsc;
      } else {
        this.sortKey = key;
        this.sortAsc = true;
      }
    },

    // === Method 3: sortIcon ===
    // Mengembalikan ikon panah sorting
    sortIcon: function (key) {
      if (this.sortKey !== key) return '';
      return this.sortAsc ? ' ▲' : ' ▼';
    },

    // === Method 4: openAddForm ===
    // Membuka form untuk menambah stok baru
    openAddForm: function () {
      this.isEditing = false;
      this.editIndex = -1;
      this.form = {
        kode: '',
        judul: '',
        kategori: '',
        upbjj: '',
        lokasiRak: '',
        harga: '',
        qty: '',
        safety: '',
        catatanHTML: ''
      };
      this.formErrors = {};
      this.showForm = true;
    },

    // === Method 5: openEditForm ===
    // Membuka form untuk mengedit stok yang sudah ada
    openEditForm: function (index) {
      this.isEditing = true;
      // Cari index asli di daftarStok dari item yang ada di stokFiltered
      var filteredItem = this.stokFiltered[index];
      var realIndex = -1;
      for (var i = 0; i < this.daftarStok.length; i++) {
        if (this.daftarStok[i].kode === filteredItem.kode) {
          realIndex = i;
          break;
        }
      }
      this.editIndex = realIndex;
      this.form = JSON.parse(JSON.stringify(filteredItem));
      this.form.harga = String(this.form.harga);
      this.form.qty = String(this.form.qty);
      this.form.safety = String(this.form.safety);
      this.formErrors = {};
      this.showForm = true;
    },

    // === Method 6: validateForm ===
    // Validasi input form
    validateForm: function () {
      var errors = {};
      if (!this.form.kode.trim()) errors.kode = 'Kode bahan ajar wajib diisi';
      if (!this.form.judul.trim()) errors.judul = 'Judul wajib diisi';
      if (!this.form.kategori) errors.kategori = 'Pilih kategori';
      if (!this.form.upbjj) errors.upbjj = 'Pilih UPBJJ';
      if (!this.form.lokasiRak.trim()) errors.lokasiRak = 'Lokasi rak wajib diisi';
      if (!this.form.harga || Number(this.form.harga) <= 0) errors.harga = 'Harga harus lebih dari 0';
      if (this.form.qty === '' || Number(this.form.qty) < 0) errors.qty = 'Qty tidak boleh negatif';
      if (this.form.safety === '' || Number(this.form.safety) < 0) errors.safety = 'Safety stock tidak boleh negatif';

      // Cek duplikat kode (hanya saat tambah baru)
      if (!this.isEditing) {
        var self = this;
        var dup = this.daftarStok.some(function (item) {
          return item.kode.toLowerCase() === self.form.kode.trim().toLowerCase();
        });
        if (dup) errors.kode = 'Kode bahan ajar sudah ada';
      }

      this.formErrors = errors;
      return Object.keys(errors).length === 0;
    },

    // === Method 7: simpanStok ===
    // Menyimpan data stok (tambah atau update)
    simpanStok: function () {
      if (!this.validateForm()) return;

      var data = {
        kode: this.form.kode.trim(),
        judul: this.form.judul.trim(),
        kategori: this.form.kategori,
        upbjj: this.form.upbjj,
        lokasiRak: this.form.lokasiRak.trim(),
        harga: Number(this.form.harga),
        qty: Number(this.form.qty),
        safety: Number(this.form.safety),
        catatanHTML: this.form.catatanHTML
      };

      if (this.isEditing) {
        // Vue.set untuk reactivity pada array
        Vue.set(this.daftarStok, this.editIndex, data);
        this.tampilkanNotif('success', 'Stok "' + data.judul + '" berhasil diperbarui.');
      } else {
        this.daftarStok.push(data);
        this.tampilkanNotif('success', 'Stok "' + data.judul + '" berhasil ditambahkan.');
      }

      this.showForm = false;
    },

    // === Method 8: hapusStok ===
    // Menghapus item stok
    hapusStok: function (index) {
      var item = this.stokFiltered[index];
      if (confirm('Yakin ingin menghapus "' + item.judul + '"?')) {
        var idx = this.daftarStok.indexOf(item);
        if (idx !== -1) {
          this.daftarStok.splice(idx, 1);
          this.tampilkanNotif('warning', '"' + item.judul + '" telah dihapus.');
        }
      }
    },

    // === Method 9: lihatDetail ===
    // Menampilkan detail item stok
    lihatDetail: function (index) {
      this.detailItem = this.stokFiltered[index];
      this.showDetail = true;
    },

    // === Method 10: tampilkanNotif ===
    // Menampilkan notifikasi
    tampilkanNotif: function (type, message) {
      this.notif = { show: true, type: type, message: message };
    },

    // === Method 11: resetFilter ===
    // Mereset semua filter
    resetFilter: function () {
      this.cariJudul = '';
      this.filterKategori = '';
      this.filterUpbjj = '';
      this.filterStatus = '';
    }
  },

  watch: {
    // === Watcher 1: cariJudul ===
    // Memantau perubahan pencarian dan menampilkan info
    cariJudul: function (valBaru, valLama) {
      if (valBaru.length > 0) {
        console.log('[Watcher cariJudul] Pencarian diubah dari "' + valLama + '" menjadi "' + valBaru + '"');
      }
    },

    // === Watcher 2: filterStatus ===
    // Memantau perubahan filter status dan memberikan notifikasi
    filterStatus: function (valBaru) {
      if (valBaru) {
        var label = '';
        if (valBaru === 'aman') label = 'Stok Tersedia (Aman)';
        else if (valBaru === 'menipis') label = 'Stok Menipis';
        else if (valBaru === 'habis') label = 'Stok Habis';
        console.log('[Watcher filterStatus] Filter status diubah ke: ' + label);
      }
    }
  }
});
