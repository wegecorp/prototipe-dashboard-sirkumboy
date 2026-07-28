// ============================================================
// SEED — Sirkumboy Dashboard Dummy Data (V2)
// Auto-seeds on first load. Realistic Indonesian names and
// organic data per design-taste-frontend-v1 skill rules.
// ============================================================

const SeedData = (() => {
  const NAMA_ANAK_POOL = [
    'Ahmad Rafif Habibi', 'Muhammad Zafran Akbar', 'Rizky Aditya Pratama',
    'Fadhil Arkan Maulana', 'Naufal Dzaki Ramadhan', 'Alif Bintang Mahardika',
    'Daffa Atharizz Putra', 'Raka Alfarizi Kusuma', 'Azka Fahri Wicaksono',
    'Gibran Rasyid Firmansyah', 'Hafizh Kemal Ananta', 'Yusuf Aqil Dermawan',
    'Farel Oktaviano Hidayat', 'Arjuna Satria Nugroho', 'Bima Sakti Wibowo',
    'Kenzie Putra Mahendra', 'Raihan Athallah Saputra', 'Zidan Maulid Hasan',
    'Fikri Andhika Wijaya', 'Arga Prasetyo Adi', 'Dimas Cahyono Putra',
    'Galang Rizaldi Setiawan', 'Ilham Fauzan Rachman', 'Kafin Julio Wardana',
    'Labib Hafidz Mulyadi', 'Mikail Raditya Santoso', 'Nabil Farhan Utomo',
    'Revano Putra Adinata', 'Sulthan Hakim Prawiranata', 'Thoriq Ramadhan Akbar',
  ];

  const NAMA_ORTU_POOL = [
    'Budi Santoso', 'Hendra Wijaya', 'Agus Setiawan', 'Dwi Prasetyo',
    'Eko Nugroho', 'Joko Widodo', 'Kurniawan Hidayat', 'Bambang Suryadi',
    'Sugeng Raharjo', 'Wahyu Purnomo', 'Dedi Firmansyah', 'Rudi Hartono',
    'Sigit Prabowo', 'Deni Kusuma', 'Andi Mahendra', 'Teguh Wibisono',
    'Yanto Suherman', 'Suparjo Wicaksono', 'Herman Darwanto', 'Faisal Rachman',
    'Irfan Hakim', 'Lukman Habibi', 'Mulyadi Kartono', 'Nurhadi Subekti',
    'Parjo Maulana', 'Qodir Ramadhan', 'Ridwan Kamil', 'Sugianto Pratama',
    'Tri Handoko', 'Usman Fauzi',
  ];

  const ALAMAT_POOL = {
    [CABANG.WATES.id]: [
      'Dusun Beji RT 03/07, Wates, Kulon Progo',
      'Jl. Sugiman No. 14, Pengasih, Kulon Progo',
      'Dusun Karang RT 01/03, Sentolo, Kulon Progo',
      'Jl. Wahidin No. 8, Wates, Kulon Progo',
      'Dusun Tegalrejo RT 02/05, Kokap, Kulon Progo',
    ],
    [CABANG.SEMARANG.id]: [
      'Jl. Majapahit No. 23, Semarang Timur',
      'Perum Graha Candi Golf Blok F-12, Tembalang',
      'Jl. Siliwangi No. 45, Semarang Barat',
      'Jl. Puri Anjasmoro Blok D-7, Semarang Barat',
      'Jl. MT Haryono No. 19, Barusari, Semarang',
    ],
    [CABANG.BANTUL.id]: [
      'Dusun Timbulharjo RT 04/08, Sewon, Bantul',
      'Jl. Imogiri Barat Km 5, Bantul',
      'Perum Bumi Panggung Asri Blok C-3, Bantul',
      'Dusun Saman RT 01/02, Bangunharjo, Bantul',
      'Jl. Parangtritis Km 12, Kretek, Bantul',
    ],
  };

  const DOKTER_POOL = {
    [CABANG.WATES.id]: ['Dr. Ega Prima Norista', 'R. Isnanta'],
    [CABANG.SEMARANG.id]: ['Dr. Anwar Fathoni', 'Dr. Ratna Dewi'],
    [CABANG.BANTUL.id]: ['Dr. Baskoro Adi', 'Dr. Siti Aminah'],
  };

  async function seed() {
    if (db.isSeeded()) return;

    // Reset storage to give a clean v2 state
    await db.resetAll();

    // 1. Seed cabang
    for (const c of CABANG_LIST) {
      await db.cabang.create({ id: c.id, nama: c.nama, alamat: c.alamat });
    }

    // 2. Seed pasien — ~10 per cabang
    const allPasien = [];
    let nameIndex = 0;

    const todayStr = todayISO();

    for (const cabang of CABANG_LIST) {
      const count = 10;
      for (let i = 0; i < count && nameIndex < NAMA_ANAK_POOL.length; i++) {
        // Distribute statuses across patients
        let status;
        if (i < 2) status = STATUS_PASIEN.TERDAFTAR;
        else if (i < 4) status = STATUS_PASIEN.DIJADWALKAN;
        else if (i < 7) status = STATUS_PASIEN.SELESAI_TINDAKAN;
        else if (i < 9) status = STATUS_PASIEN.KONTROL;
        else status = STATUS_PASIEN.SEMBUH;

        const pasien = {
          cabang_id: cabang.id,
          nama_anak: NAMA_ANAK_POOL[nameIndex],
          umur: randomInt(4, 14),
          nama_ortu: NAMA_ORTU_POOL[nameIndex],
          no_wa: `081${randomInt(10000000, 99999999)}`,
          alamat: randomFrom(ALAMAT_POOL[cabang.id]),
          kondisi_gemuk: Math.random() < 0.15,
          kondisi_alergi: Math.random() < 0.1,
          kondisi_hemofilia: Math.random() < 0.03,
          kondisi_kelainan: Math.random() < 0.05,
          status: status,
        };
        const created = await db.pasien.create(pasien);
        allPasien.push({ ...created, _index: i, _cabangId: cabang.id });
        nameIndex++;
      }
    }

    // 3. Seed jadwal (Today & Upcoming)
    for (const p of allPasien) {
      if (p.status === STATUS_PASIEN.DIJADWALKAN || p.status === STATUS_PASIEN.SELESAI_TINDAKAN || p.status === STATUS_PASIEN.KONTROL || p.status === STATUS_PASIEN.SEMBUH) {
        let tgl;
        let statusJadwal = STATUS_JADWAL.SELESAI;

        if (p.status === STATUS_PASIEN.DIJADWALKAN) {
          statusJadwal = STATUS_JADWAL.DIJADWALKAN;
          // Mix of Today and Upcoming dates (tomorrow, in 2 days, next week)
          if (p._index % 2 === 0) {
            tgl = todayStr; // Today
          } else {
            tgl = addDays(todayStr, randomInt(1, 7)).toISOString().split('T')[0]; // Upcoming
          }
        } else {
          tgl = addDays(todayStr, -randomInt(1, 30)).toISOString().split('T')[0]; // Past
        }

        await db.jadwal.create({
          pasien_id: p.id,
          cabang_id: p._cabangId,
          tanggal: tgl,
          jam: `${String(randomInt(8, 15)).padStart(2, '0')}:${randomFrom(['00', '30'])}`,
          catatan: p.status === STATUS_PASIEN.DIJADWALKAN ? 'Pasien konfirmasi hadir' : 'Tindakan selesai',
          status: statusJadwal,
        });
      }
    }

    // 4. Seed tindakan
    for (const p of allPasien) {
      if (p.status === STATUS_PASIEN.SELESAI_TINDAKAN || p.status === STATUS_PASIEN.KONTROL || p.status === STATUS_PASIEN.SEMBUH) {
        const metode = randomFrom(METODE_LIST);
        const hasDiscount = Math.random() < 0.25;
        const diskon = hasDiscount ? randomFrom([50000, 100000, 200000]) : 0;
        const tglTindakan = addDays(todayStr, -randomInt(1, 20)).toISOString().split('T')[0];

        const tindakan = await db.tindakan.create({
          pasien_id: p.id,
          cabang_id: p._cabangId,
          metode: metode.id,
          harga: metode.harga,
          diskon: diskon,
          total_bayar: metode.harga - diskon,
          dokter: randomFrom(DOKTER_POOL[p._cabangId]),
          catatan: 'Prosedur tindakan aman & lancar.',
          tanggal_tindakan: tglTindakan,
        });

        // 5. Seed rekam medis for treated patients
        await db.rekam_medis.create({
          pasien_id: p.id,
          tindakan_id: tindakan.id,
          catatan: `[Hari Sunat] Tindakan selesai menggunakan ${metode.nama}. Kondisi fisik baik. Diberikan paket obat semprot & RC mainan.`,
          tanggal: tglTindakan,
        });

        if (p.status === STATUS_PASIEN.KONTROL || p.status === STATUS_PASIEN.SEMBUH) {
          await db.rekam_medis.create({
            pasien_id: p.id,
            tindakan_id: tindakan.id,
            catatan: '[Kontrol H+3] Luka mulai mengering. Tidak ada tanda pendarahan. Lanjutkan salep & semprot antiseptik.',
            tanggal: addDays(tglTindakan, 3).toISOString().split('T')[0],
          });
        }

        if (p.status === STATUS_PASIEN.SEMBUH) {
          await db.rekam_medis.create({
            pasien_id: p.id,
            tindakan_id: tindakan.id,
            catatan: '[Kontrol H+7] Luka sembuh sempurna. Anak sudah bisa beraktivitas normal.',
            tanggal: addDays(tglTindakan, 7).toISOString().split('T')[0],
          });
        }
      }
    }

    // 6. Seed inventaris STRICTLY 2 ITEMS PER BRANCH (RC Mainan & Paket Obat Semprot)
    for (const cabang of CABANG_LIST) {
      await db.inventaris.create({
        cabang_id: cabang.id,
        nama_item: 'RC Mainan',
        kategori: 'hadiah',
        stok: randomInt(8, 25),
        minimum_stok: 5,
      });

      await db.inventaris.create({
        cabang_id: cabang.id,
        nama_item: 'Paket Obat Semprot',
        kategori: 'obat',
        stok: randomInt(4, 20),
        minimum_stok: 5,
      });
    }

    // 7. Seed reminder config
    for (const cabang of CABANG_LIST) {
      await db.reminder_config.create({
        cabang_id: cabang.id,
        aktif: true,
        interval_hari: JSON.stringify([3, 7, 14]),
        template_pesan: DEFAULT_REMINDER_TEMPLATE,
      });
    }

    db.markSeeded();
    console.log('[Sirkumboy] V2 Seed data loaded successfully.');
  }

  return { seed };
})();
