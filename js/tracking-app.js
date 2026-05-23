var trackingApp = new Vue({
  el: '#app',
  data: function () {
    var d = JSON.parse(JSON.stringify(dataBahanAjar));
    return {
      trackingData: d.tracking,
      paketList: d.paket,
      pengirimanList: d.pengirimanList,

      // Pencarian DO
      cariDO: '',
      doDitemukan: null,
      doNotFound: false,

      // Filter tracking list
      filterStatus: '',

      // Form buat DO baru
      showForm: false,
      form: {
        kodeDO: '',
        nim: '',
        nama: '',
        paket: '',
        jenisKirim: 'REG',
        total: ''
      },
      formErrors: {},

      // Notifikasi
      notif: {
        show: false,
        type: 'info',
        message: ''
      }
    };
  },

  computed: {
    // === Computed Property 1: daftarDO ===
    // Mengubah objek tracking menjadi array untuk iterasi
    daftarDO: function () {
      var self = this;
      var list = [];
      var keys = Object.keys(this.trackingData);
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var item = this.trackingData[key];
        list.push({
          kodeDO: key,
          nim: item.nim,
          nama: item.nama,
          status: item.status,
          ekspedisi: item.ekspedisi,
          tanggalKirim: item.tanggalKirim,
          paket: item.paket,
          total: item.total,
          perjalanan: item.perjalanan
        });
      }

      // Filter berdasarkan status
      if (this.filterStatus) {
        list = list.filter(function (item) {
          return item.status === self.filterStatus;
        });
      }

      return list;
    },

    // === Computed Property 2: statusClass ===
    // Mengembalikan class badge berdasarkan status DO
    statusClass: function () {
      var map = {};
      var keys = Object.keys(this.trackingData);
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var status = this.trackingData[key].status;
        if (status === 'Dalam Perjalanan') {
          map[key] = 'badge-info';
        } else if (status === 'Tiba di Tujuan' || status === 'Selesai') {
          map[key] = 'badge-success';
        } else if (status === 'Diproses') {
          map[key] = 'badge-purple';
        } else {
          map[key] = 'badge-warning';
        }
      }
      return map;
    },

    // === Computed Property 3: ringkasanTracking ===
    // Menghitung ringkasan status DO
    ringkasanTracking: function () {
      var total = Object.keys(this.trackingData).length;
      var diproses = 0;
      var dalamPerjalanan = 0;
      var selesai = 0;

      var keys = Object.keys(this.trackingData);
      for (var i = 0; i < keys.length; i++) {
        var status = this.trackingData[keys[i]].status;
        if (status === 'Diproses') diproses++;
        else if (status === 'Dalam Perjalanan') dalamPerjalanan++;
        else if (status === 'Tiba di Tujuan' || status === 'Selesai') selesai++;
      }

      return { total: total, diproses: diproses, dalamPerjalanan: dalamPerjalanan, selesai: selesai };
    }
  },

  methods: {
    // === Method 1: cariDeliveryOrder ===
    // Mencari DO berdasarkan nomor
    cariDeliveryOrder: function () {
      var kode = this.cariDO.trim().toUpperCase();
      if (!kode) {
        this.doDitemukan = null;
        this.doNotFound = false;
        return;
      }

      if (this.trackingData[kode]) {
        this.doDitemukan = {
          kodeDO: kode,
          data: this.trackingData[kode]
        };
        this.doNotFound = false;
        console.log('[Tracking] DO ditemukan: ' + kode);
      } else {
        this.doDitemukan = null;
        this.doNotFound = true;
        console.log('[Tracking] DO tidak ditemukan: ' + kode);
      }
    },

    // === Method 2: formatTanggal ===
    // Memformat tanggal ke format Indonesia
    formatTanggal: function (tgl) {
      if (!tgl) return '-';
      var bulan = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
      var parts = tgl.split('-');
      var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.getDate() + ' ' + bulan[d.getMonth()] + ' ' + d.getFullYear();
    },

    // === Method 3: formatRupiah ===
    // Memformat angka menjadi Rupiah
    formatRupiah: function (angka) {
      if (angka === null || angka === undefined) return 'Rp 0';
      return 'Rp ' + Number(angka).toLocaleString('id-ID');
    },

    // === Method 4: getNamaPaket ===
    // Mendapatkan nama paket dari kode
    getNamaPaket: function (kode) {
      for (var i = 0; i < this.paketList.length; i++) {
        if (this.paketList[i].kode === kode) return this.paketList[i].nama;
      }
      return kode;
    },

    // === Method 5: openFormDO ===
    // Membuka form untuk membuat DO baru
    openFormDO: function () {
      this.form = {
        kodeDO: '',
        nim: '',
        nama: '',
        paket: '',
        jenisKirim: 'REG',
        total: ''
      };
      this.formErrors = {};
      this.showForm = true;
    },

    // === Method 6: validateFormDO ===
    // Validasi form DO baru
    validateFormDO: function () {
      var errors = {};
      if (!this.form.kodeDO.trim()) errors.kodeDO = 'Kode DO wajib diisi';
      if (!this.form.nim.trim()) errors.nim = 'NIM wajib diisi';
      if (this.form.nim.trim() && !/^\d+$/.test(this.form.nim.trim())) errors.nim = 'NIM harus berupa angka';
      if (!this.form.nama.trim()) errors.nama = 'Nama wajib diisi';
      if (!this.form.paket) errors.paket = 'Pilih paket bahan ajar';
      if (!this.form.total || Number(this.form.total) <= 0) errors.total = 'Total harus lebih dari 0';

      // Cek duplikat kode DO
      var kode = this.form.kodeDO.trim().toUpperCase();
      if (this.trackingData[kode]) {
        errors.kodeDO = 'Kode DO sudah ada';
      }

      this.formErrors = errors;
      return Object.keys(errors).length === 0;
    },

    // === Method 7: simpanDO ===
    // Menyimpan DO baru
    simpanDO: function () {
      if (!this.validateFormDO()) return;

      var kode = this.form.kodeDO.trim().toUpperCase();
      var jenisKirim = this.form.jenisKirim;

      var ekspedisi = 'JNE';
      if (jenisKirim === 'EXP') ekspedisi = 'SiCepat';

      var today = new Date();
      var tanggalStr = today.getFullYear() + '-' +
        String(today.getMonth() + 1).padStart(2, '0') + '-' +
        String(today.getDate()).padStart(2, '0');

      var waktuStr = tanggalStr + ' ' +
        String(today.getHours()).padStart(2, '0') + ':' +
        String(today.getMinutes()).padStart(2, '0') + ':' +
        String(today.getSeconds()).padStart(2, '0');

      // Vue.set untuk menambahkan property baru pada objek (reactivity)
      Vue.set(this.trackingData, kode, {
        nim: this.form.nim.trim(),
        nama: this.form.nama.trim(),
        status: 'Diproses',
        ekspedisi: ekspedisi,
        tanggalKirim: tanggalStr,
        paket: this.form.paket,
        total: Number(this.form.total),
        perjalanan: [
          {
            waktu: waktuStr,
            keterangan: 'Pesanan diterima dan sedang diproses'
          }
        ]
      });

      this.showForm = false;
      this.tampilkanNotif('success', 'Delivery Order "' + kode + '" berhasil dibuat.');
    },

    // === Method 8: updateStatusDO ===
    // Mengupdate status DO (simulasi)
    updateStatusDO: function (kodeDO) {
      var data = this.trackingData[kodeDO];
      if (!data) return;

      var today = new Date();
      var waktuStr = today.getFullYear() + '-' +
        String(today.getMonth() + 1).padStart(2, '0') + '-' +
        String(today.getDate()).padStart(2, '0') + ' ' +
        String(today.getHours()).padStart(2, '0') + ':' +
        String(today.getMinutes()).padStart(2, '0') + ':' +
        String(today.getSeconds()).padStart(2, '0');

      var keterangan = '';
      if (data.status === 'Diproses') {
        data.status = 'Dalam Perjalanan';
        keterangan = 'Paket telah dikirim melalui ' + data.ekspedisi;
      } else if (data.status === 'Dalam Perjalanan') {
        data.status = 'Tiba di Tujuan';
        keterangan = 'Paket telah tiba di kantor tujuan';
      } else {
        this.tampilkanNotif('info', 'DO "' + kodeDO + '" sudah selesai.');
        return;
      }

      data.perjalanan.push({
        waktu: waktuStr,
        keterangan: keterangan
      });

      // Trigger reactivity
      Vue.set(this.trackingData, kodeDO, data);
      this.tampilkanNotif('success', 'Status DO "' + kodeDO + '" diperbarui ke: ' + data.status);
    },

    // === Method 9: lihatDetailTracking ===
    // Menampilkan detail tracking dari daftar
    lihatDetailTracking: function (kodeDO) {
      this.cariDO = kodeDO;
      this.cariDeliveryOrder();
    },

    // === Method 10: hapusDO ===
    // Menghapus DO
    hapusDO: function (kodeDO) {
      if (confirm('Yakin ingin menghapus DO "' + kodeDO + '"?')) {
        Vue.delete(this.trackingData, kodeDO);
        if (this.doDitemukan && this.doDitemukan.kodeDO === kodeDO) {
          this.doDitemukan = null;
        }
        this.tampilkanNotif('warning', 'DO "' + kodeDO + '" telah dihapus.');
      }
    },

    // === Method 11: tampilkanNotif ===
    tampilkanNotif: function (type, message) {
      this.notif = { show: true, type: type, message: message };
    },

    // === Method 12: resetPencarian ===
    resetPencarian: function () {
      this.cariDO = '';
      this.doDitemukan = null;
      this.doNotFound = false;
    }
  },

  watch: {
    // === Watcher 1: cariDO ===
    // Memantau input pencarian DO dan otomatis mencari
    cariDO: function (valBaru) {
      if (valBaru.length >= 4) {
        this.cariDeliveryOrder();
      } else if (valBaru.length === 0) {
        this.doDitemukan = null;
        this.doNotFound = false;
      }
    },

    // === Watcher 2: filterStatus ===
    // Memantau perubahan filter status
    filterStatus: function (valBaru) {
      if (valBaru) {
        console.log('[Watcher filterStatus] Filter tracking diubah ke: ' + valBaru);
      }
    }
  }
});
