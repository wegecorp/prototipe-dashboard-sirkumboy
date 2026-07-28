// ============================================================
// PAGE: Jadwal Sunat — Sirkumboy Dashboard
// Split View: 1. Today's Circumcision Schedule | 2. Upcoming Schedule
// ============================================================

function PageJadwal(container) {
  const cabangId = db.getActiveCabang();

  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Jadwal Sunat</h1>
        <p class="page-subtitle">Monitoring jadwal sunat hari ini dan reservasi mendatang (upcoming)</p>
      </div>
      <button class="btn btn-primary" id="btnTambahJadwal">
        ${icon('plus', '16')} Buat Jadwal Baru
      </button>
    </div>

    <!-- Section 1: Hari Ini -->
    <div style="margin-bottom: var(--space-8);">
      <div class="flex items-center justify-between mb-3">
        <h2 style="font-size: 1.25rem; font-weight: 700; display: flex; align-items: center; gap: var(--space-2);">
          ${icon('clock', '20')} Jadwal Sunat Hari Ini (${formatTanggal(todayISO())})
        </h2>
        <span class="badge badge-primary" id="todayCountBadge">0 Pasien</span>
      </div>
      <div class="data-table-wrapper">
        <div id="todayJadwalContainer"></div>
      </div>
    </div>

    <!-- Section 2: Upcoming / Mendatang -->
    <div>
      <div class="flex items-center justify-between mb-3">
        <h2 style="font-size: 1.25rem; font-weight: 700; display: flex; align-items: center; gap: var(--space-2);">
          ${icon('jadwal', '20')} Upcoming — Jadwal Sunat Mendatang
        </h2>
        <span class="badge badge-neutral" id="upcomingCountBadge">0 Reservasi</span>
      </div>
      <div class="data-table-wrapper">
        <div id="upcomingJadwalContainer"></div>
      </div>
    </div>
  `;

  document.getElementById('btnTambahJadwal').addEventListener('click', () => openJadwalForm());

  renderAll();

  async function renderAll() {
    await renderTodaySection();
    await renderUpcomingSection();
  }

  async function renderTodaySection() {
    const containerEl = document.getElementById('todayJadwalContainer');
    const badgeEl = document.getElementById('todayCountBadge');
    if (!containerEl) return;

    const todayStr = todayISO();
    let todayJadwal = await db.jadwal.getByCabang(cabangId);
    todayJadwal = todayJadwal.filter((j) => j.tanggal === todayStr && j.status !== STATUS_JADWAL.BATAL);
    todayJadwal.sort((a, b) => (a.jam || '').localeCompare(b.jam || ''));

    if (badgeEl) badgeEl.textContent = `${todayJadwal.length} Pasien`;

    if (todayJadwal.length === 0) {
      containerEl.innerHTML = `
        <div class="empty-state" style="padding: var(--space-6);">
          <div class="empty-state-icon">${Icons.jadwal}</div>
          <p class="empty-state-title">Tidak Ada Jadwal Hari Ini</p>
          <p class="empty-state-desc">Belum ada pasien yang dijadwalkan sunat untuk hari ini.</p>
        </div>
      `;
      return;
    }

    const allPasien = await db.pasien.getAll();
    const pasienMap = {};
    allPasien.forEach((p) => { pasienMap[p.id] = p; });

    const table = el('table', { className: 'data-table' });
    table.innerHTML = `
      <thead>
        <tr>
          <th>Jam</th>
          <th>Nama Pasien</th>
          <th>Umur</th>
          <th>Orang Tua</th>
          <th>No. WA</th>
          <th>Status</th>
          <th>Aksi</th>
        </tr>
      </thead>
    `;

    const tbody = el('tbody');
    todayJadwal.forEach((j) => {
      const pasien = pasienMap[j.pasien_id];
      const isSelesai = j.status === STATUS_JADWAL.SELESAI;

      const row = el('tr');
      row.innerHTML = `
        <td class="mono" style="font-weight: 700; font-size: 1rem; color: var(--color-primary);">${formatJam(j.jam)}</td>
        <td style="font-weight: 600;">${pasien?.nama_anak || '-'}</td>
        <td class="mono">${pasien?.umur || '-'} thn</td>
        <td>${pasien?.nama_ortu || '-'}</td>
        <td class="mono" style="font-size: 0.75rem;">${pasien?.no_wa || '-'}</td>
        <td><span class="badge ${isSelesai ? 'badge-success' : 'badge-primary'}">${isSelesai ? 'Selesai Sunat' : 'Siap Tindakan'}</span></td>
        <td>
          ${!isSelesai ? `
            <button class="btn btn-sm btn-primary btn-start-tindakan" data-jadwal-id="${j.id}" data-pasien-id="${j.pasien_id}">
              ${icon('check', '14')} Mulai Sunat
            </button>
          ` : `<span style="font-size: 0.75rem; color: var(--color-success); font-weight: 600;">✓ Selesai</span>`}
        </td>
      `;
      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    containerEl.innerHTML = '';
    containerEl.appendChild(table);

    // Start action
    containerEl.querySelectorAll('.btn-start-tindakan').forEach((btn) => {
      btn.addEventListener('click', () => openTindakanForm(btn.dataset.jadwalId, btn.dataset.pasienId));
    });
  }

  async function renderUpcomingSection() {
    const containerEl = document.getElementById('upcomingJadwalContainer');
    const badgeEl = document.getElementById('upcomingCountBadge');
    if (!containerEl) return;

    const todayStr = todayISO();
    let upcomingList = await db.jadwal.getByCabang(cabangId);
    upcomingList = upcomingList.filter((j) => j.tanggal > todayStr && j.status === STATUS_JADWAL.DIJADWALKAN);
    upcomingList.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal) || (a.jam || '').localeCompare(b.jam || ''));

    if (badgeEl) badgeEl.textContent = `${upcomingList.length} Reservasi`;

    if (upcomingList.length === 0) {
      containerEl.innerHTML = `
        <div class="empty-state" style="padding: var(--space-6);">
          <div class="empty-state-icon">${Icons.clock}</div>
          <p class="empty-state-title">Belum Ada Jadwal Mendatang</p>
          <p class="empty-state-desc">Reservasi jadwal sunat mendatang akan muncul di sini.</p>
        </div>
      `;
      return;
    }

    const allPasien = await db.pasien.getAll();
    const pasienMap = {};
    allPasien.forEach((p) => { pasienMap[p.id] = p; });

    const table = el('table', { className: 'data-table' });
    table.innerHTML = `
      <thead>
        <tr>
          <th>Tanggal Sunat</th>
          <th>Jam</th>
          <th>Nama Pasien</th>
          <th>Umur</th>
          <th>Orang Tua</th>
          <th>No. WA</th>
          <th>Catatan</th>
          <th></th>
        </tr>
      </thead>
    `;

    const tbody = el('tbody');
    upcomingList.forEach((j) => {
      const pasien = pasienMap[j.pasien_id];
      const row = el('tr');
      row.innerHTML = `
        <td class="mono" style="font-weight: 600;">${formatTanggal(j.tanggal, { weekday: 'short', day: 'numeric', month: 'short' })}</td>
        <td class="mono">${formatJam(j.jam)}</td>
        <td style="font-weight: 600;">${pasien?.nama_anak || '-'}</td>
        <td class="mono">${pasien?.umur || '-'} thn</td>
        <td>${pasien?.nama_ortu || '-'}</td>
        <td class="mono" style="font-size: 0.75rem;">${pasien?.no_wa || '-'}</td>
        <td style="font-size: 0.8125rem; color: var(--color-text-secondary);">${j.catatan || 'Terdaftar'}</td>
        <td>
          <button class="btn btn-ghost btn-sm btn-batal-jadwal" data-id="${j.id}" title="Batalkan">
            ${icon('close', '14')}
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    containerEl.innerHTML = '';
    containerEl.appendChild(table);

    containerEl.querySelectorAll('.btn-batal-jadwal').forEach((btn) => {
      btn.addEventListener('click', async () => {
        Modal.confirm('Batalkan reservasi jadwal ini?', async () => {
          await db.jadwal.update(btn.dataset.id, { status: STATUS_JADWAL.BATAL });
          Toast.info('Jadwal dibatalkan.');
          renderAll();
        }, 'Batalkan');
      });
    });
  }

  async function openJadwalForm() {
    let pasienList = await db.pasien.getByCabang(cabangId);

    if (pasienList.length === 0) {
      Toast.warning('Tidak ada pasien untuk dijadwalkan.');
      return;
    }

    Modal.open({
      title: 'Buat Jadwal Sunat Baru',
      body: (bodyEl) => {
        bodyEl.innerHTML = `
          <div class="form-grid">
            <div class="form-group full-width">
              <label class="form-label">Pilih Pasien</label>
              <select class="form-select" id="fJadwalPasien">
                ${pasienList.map((p) => `<option value="${p.id}">${p.nama_anak} (${p.nama_ortu})</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Tanggal Sunat</label>
              <input type="date" class="form-input" id="fJadwalTanggal" value="${todayISO()}" />
            </div>
            <div class="form-group">
              <label class="form-label">Jam</label>
              <input type="time" class="form-input" id="fJadwalJam" value="09:00" />
            </div>
            <div class="form-group full-width">
              <label class="form-label">Catatan Opsional</label>
              <textarea class="form-textarea" id="fJadwalCatatan" rows="2" placeholder="Catatan khusus pasien/orang tua..."></textarea>
            </div>
          </div>
        `;
      },
      footer: (footerEl) => {
        footerEl.appendChild(el('button', { className: 'btn btn-secondary', textContent: 'Batal', onClick: Modal.close }));
        footerEl.appendChild(el('button', { className: 'btn btn-primary', textContent: 'Simpan Jadwal', onClick: saveJadwal }));

        async function saveJadwal() {
          const pasienId = document.getElementById('fJadwalPasien').value;
          const tanggal = document.getElementById('fJadwalTanggal').value;
          const jam = document.getElementById('fJadwalJam').value;
          const catatan = document.getElementById('fJadwalCatatan').value.trim();

          const pasien = await db.pasien.getById(pasienId);

          await db.jadwal.create({
            pasien_id: pasienId,
            cabang_id: pasien?.cabang_id || cabangId,
            tanggal,
            jam,
            catatan,
            status: STATUS_JADWAL.DIJADWALKAN,
          });

          await db.pasien.update(pasienId, { status: STATUS_PASIEN.DIJADWALKAN });

          Toast.success('Jadwal sunat berhasil disimpan.');
          Modal.close();
          renderAll();
        }
      },
    });
  }

  async function openTindakanForm(jadwalId, pasienId) {
    const pasien = await db.pasien.getById(pasienId);
    if (!pasien) return;

    const cabang = CABANG_LIST.find((c) => c.id === pasien.cabang_id);
    const dokterList = cabang ? ['Dr. Ega Prima Norista', 'R. Isnanta'] : ['Dokter'];

    Modal.open({
      title: `Catat Prosedur Sunat: ${pasien.nama_anak}`,
      body: (bodyEl) => {
        bodyEl.innerHTML = `
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Metode Sunat</label>
              <select class="form-select" id="fMetode">
                ${METODE_LIST.map((m) => `<option value="${m.id}">${m.nama} — ${formatRupiah(m.harga)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Dokter Operator</label>
              <select class="form-select" id="fDokter">
                ${dokterList.map((d) => `<option value="${d}">${d}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Harga Metode</label>
              <input type="text" class="form-input mono" id="fHarga" readonly />
            </div>
            <div class="form-group">
              <label class="form-label">Diskon (Rp)</label>
              <input type="number" class="form-input" id="fDiskon" value="0" min="0" placeholder="0" />
            </div>
            <div class="form-group">
              <label class="form-label">Total Pembayaran</label>
              <input type="text" class="form-input mono" id="fTotalBayar" readonly style="font-weight: 700; font-size: 1.125rem;" />
            </div>
            <div class="form-group full-width">
              <label class="form-label">Catatan Medis Tindakan</label>
              <textarea class="form-textarea" id="fCatatanTindakan" rows="2" placeholder="Kondisi pasien, respon anestesi, dll..."></textarea>
            </div>
          </div>
        `;

        const updatePrice = () => {
          const elMetode = bodyEl.querySelector('#fMetode');
          const elDiskon = bodyEl.querySelector('#fDiskon');
          const elHarga = bodyEl.querySelector('#fHarga');
          const elTotal = bodyEl.querySelector('#fTotalBayar');
          if (!elMetode || !elHarga || !elTotal) return;
          const metode = METODE_SUNAT[elMetode.value];
          const diskon = parseInt(elDiskon?.value) || 0;
          elHarga.value = formatRupiah(metode.harga);
          elTotal.value = formatRupiah(metode.harga - diskon);
        };

        const elMetode = bodyEl.querySelector('#fMetode');
        const elDiskon = bodyEl.querySelector('#fDiskon');
        if (elMetode) elMetode.addEventListener('change', updatePrice);
        if (elDiskon) elDiskon.addEventListener('input', updatePrice);
        updatePrice();
      },
      footer: (footerEl) => {
        footerEl.appendChild(el('button', { className: 'btn btn-secondary', textContent: 'Batal', onClick: Modal.close }));
        footerEl.appendChild(el('button', { className: 'btn btn-primary', textContent: 'Selesaikan & Catat', onClick: saveTindakan }));

        async function saveTindakan() {
          const metodeId = document.getElementById('fMetode').value;
          const metode = METODE_SUNAT[metodeId];
          const diskon = parseInt(document.getElementById('fDiskon').value) || 0;
          const dokter = document.getElementById('fDokter').value;
          const catatan = document.getElementById('fCatatanTindakan').value.trim();

          const t = await db.tindakan.create({
            pasien_id: pasienId,
            cabang_id: pasien.cabang_id,
            metode: metodeId,
            harga: metode.harga,
            diskon: diskon,
            total_bayar: metode.harga - diskon,
            dokter: dokter,
            catatan: catatan,
            tanggal_tindakan: todayISO(),
          });

          await db.jadwal.update(jadwalId, { status: STATUS_JADWAL.SELESAI });
          await db.pasien.update(pasienId, { status: STATUS_PASIEN.SELESAI_TINDAKAN });

          // Auto entry rekam medis
          await db.rekam_medis.create({
            pasien_id: pasienId,
            tindakan_id: t.id,
            catatan: `[Hari Sunat] Tindakan selesai oleh ${dokter} menggunakan ${metode.nama}. ${catatan}`,
            tanggal: todayISO(),
          });

          Toast.success('Prosedur sunat berhasil dicatat ke rekam medis & keuangan.');
          Modal.close();
          renderAll();
        }
      },
    });
  }
}
