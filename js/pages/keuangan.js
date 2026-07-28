// ============================================================
// PAGE: Keuangan — Sirkumboy Dashboard
// Income tracking with monthly/branch filters.
// ============================================================

function PageKeuangan(container) {
  const cabangId = db.getActiveCabang();
  const now = new Date();
  let selectedMonth = now.getMonth();
  let selectedYear = now.getFullYear();

  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Keuangan</h1>
        <p class="page-subtitle">Pemasukan dari tindakan sunat</p>
      </div>
    </div>
    <div class="filters-bar">
      <div class="form-group" style="flex-direction: row; align-items: center; gap: var(--space-2);">
        <label class="form-label" style="white-space: nowrap;">Bulan:</label>
        <input type="month" class="form-input" id="filterBulan" value="${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}" style="width: auto;" />
      </div>
    </div>
    <div class="stats-grid" id="keuanganStats"></div>
    <div class="data-table-wrapper" style="margin-top: var(--space-4);">
      <div class="data-table-toolbar">
        <h4 style="font-size: 0.9375rem;">Detail Transaksi</h4>
      </div>
      <div id="keuanganTableContainer"></div>
    </div>
  `;

  document.getElementById('filterBulan').addEventListener('change', (e) => {
    const [y, m] = e.target.value.split('-');
    selectedYear = parseInt(y);
    selectedMonth = parseInt(m) - 1;
    renderAll();
  });

  async function renderAll() {
    await renderStats();
    await renderTable();
  }

  async function renderStats() {
    const statsGrid = document.getElementById('keuanganStats');
    if (!statsGrid) return;

    const monthStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;

    const tindakanBulan = await db.tindakan.query((t) => {
      const matchCabang = !cabangId || cabangId === CABANG_ALL_ID || t.cabang_id === cabangId;
      return matchCabang && t.tanggal_tindakan && t.tanggal_tindakan.startsWith(monthStr);
    });

    const totalGross = tindakanBulan.reduce((sum, t) => sum + (t.harga || 0), 0);
    const totalDiskon = tindakanBulan.reduce((sum, t) => sum + (t.diskon || 0), 0);
    const totalNet = tindakanBulan.reduce((sum, t) => sum + (t.total_bayar || 0), 0);
    const jumlahTindakan = tindakanBulan.length;
    const avgPerPasien = jumlahTindakan > 0 ? Math.round(totalNet / jumlahTindakan) : 0;

    statsGrid.innerHTML = '';

    const stats = [
      { label: 'Total Pemasukan', value: totalNet, formatter: formatRupiah, iconColor: 'green', iconName: 'keuangan' },
      { label: 'Jumlah Tindakan', value: jumlahTindakan, formatter: (n) => n.toString(), iconColor: 'blue', iconName: 'pasien' },
      { label: 'Rata-rata / Pasien', value: avgPerPasien, formatter: formatRupiah, iconColor: 'blue', iconName: 'keuangan' },
      { label: 'Total Diskon', value: totalDiskon, formatter: formatRupiah, iconColor: 'orange', iconName: 'keuangan' },
    ];

    stats.forEach((stat) => {
      const card = el('div', { className: 'stat-card' }, [
        el('div', { className: 'stat-card-header' }, [
          el('span', { className: 'stat-card-label', textContent: stat.label }),
          el('div', { className: `stat-card-icon ${stat.iconColor}`, innerHTML: Icons[stat.iconName] }),
        ]),
        el('div', { className: 'stat-card-value' }),
      ]);
      statsGrid.appendChild(card);
      animateCount(card.querySelector('.stat-card-value'), stat.value, stat.formatter);
    });
  }

  async function renderTable() {
    const tableContainer = document.getElementById('keuanganTableContainer');
    if (!tableContainer) return;

    const monthStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;

    let tindakanList = await db.tindakan.query((t) => {
      const matchCabang = !cabangId || cabangId === CABANG_ALL_ID || t.cabang_id === cabangId;
      return matchCabang && t.tanggal_tindakan && t.tanggal_tindakan.startsWith(monthStr);
    });

    tindakanList.sort((a, b) => new Date(b.tanggal_tindakan) - new Date(a.tanggal_tindakan));

    if (tindakanList.length === 0) {
      tableContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">${Icons.keuangan}</div>
          <p class="empty-state-title">Belum Ada Transaksi</p>
          <p class="empty-state-desc">Tidak ada tindakan yang tercatat pada bulan ini.</p>
        </div>
      `;
      return;
    }

    // Lookup pasien
    const allPasien = await db.pasien.getAll();
    const pasienMap = {};
    allPasien.forEach((p) => { pasienMap[p.id] = p; });

    const table = el('table', { className: 'data-table' });
    table.innerHTML = `
      <thead>
        <tr>
          <th>Tanggal</th>
          <th>Pasien</th>
          <th>Metode</th>
          <th>Cabang</th>
          <th style="text-align: right;">Harga</th>
          <th style="text-align: right;">Diskon</th>
          <th style="text-align: right;">Total Bayar</th>
        </tr>
      </thead>
    `;

    const tbody = el('tbody');
    tindakanList.forEach((t) => {
      const pasien = pasienMap[t.pasien_id];
      const cabang = CABANG_LIST.find((c) => c.id === t.cabang_id);

      const row = el('tr');
      row.innerHTML = `
        <td style="font-size: 0.75rem;" class="mono">${formatTanggal(t.tanggal_tindakan)}</td>
        <td style="font-weight: 500;">${pasien?.nama_anak || '-'}</td>
        <td><span class="badge badge-primary">${METODE_SUNAT[t.metode]?.nama || t.metode}</span></td>
        <td style="font-size: 0.8125rem;">${cabang?.nama.replace('Sirkumboy ', '') || '-'}</td>
        <td style="text-align: right;" class="mono">${formatRupiah(t.harga)}</td>
        <td style="text-align: right; color: var(--color-warning);" class="mono">${t.diskon > 0 ? '-' + formatRupiah(t.diskon) : '-'}</td>
        <td style="text-align: right; font-weight: 600;" class="mono">${formatRupiah(t.total_bayar)}</td>
      `;
      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    tableContainer.innerHTML = '';
    tableContainer.appendChild(table);
  }

  renderAll();
}
