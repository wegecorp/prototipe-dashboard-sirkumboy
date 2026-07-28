// ============================================================
// PAGE: Auto-WA Monitoring Hub — Sirkumboy Dashboard
// Active patient monitoring list for AI/Automated WhatsApp Assistant.
// ============================================================

function PageAutoWA(container) {
  const cabangId = db.getActiveCabang();
  let currentTab = 'all';

  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Auto-WA Monitoring Hub</h1>
        <p class="page-subtitle">Otomasi pengawasan pasien & pendampingan pemulihan sunat via WhatsApp Assistant</p>
      </div>
      <div class="flex items-center gap-2">
        <span class="wa-status" style="background: var(--color-surface); padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); border: 1px solid var(--color-border-light);">
          <span class="wa-status-dot connected"></span>
          <span style="font-weight: 600; color: var(--color-success);">Bot Engine Active</span>
        </span>
      </div>
    </div>

    <!-- Active Monitoring Summary Cards -->
    <div class="stats-grid" id="waStatsGrid" style="margin-bottom: var(--space-6);"></div>

    <!-- Monitoring Patient List -->
    <div class="data-table-wrapper">
      <div class="data-table-toolbar">
        <h4 style="font-size: 0.9375rem;">Daftar Pasien Dimonitor Otomasi WA</h4>
        <div class="filters-bar" style="margin-bottom: 0;">
          <button class="filter-chip active" data-wa-filter="all">Semua Aktif</button>
          <button class="filter-chip" data-wa-filter="today">Sunat Hari Ini</button>
          <button class="filter-chip" data-wa-filter="h3">Kontrol H+3</button>
          <button class="filter-chip" data-wa-filter="h7">Kontrol H+7</button>
          <button class="filter-chip" data-wa-filter="h14">Kontrol H+14</button>
        </div>
      </div>
      <div id="waTableContainer"></div>
    </div>
  `;

  document.querySelectorAll('[data-wa-filter]').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('[data-wa-filter]').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      currentTab = chip.dataset.waFilter;
      renderTable();
    });
  });

  renderStats();
  renderTable();

  async function renderStats() {
    const statsGrid = document.getElementById('waStatsGrid');
    if (!statsGrid) return;

    const allPasien = await db.pasien.getByCabang(cabangId);
    const activePasien = allPasien.filter((p) =>
      p.status === STATUS_PASIEN.SELESAI_TINDAKAN || p.status === STATUS_PASIEN.KONTROL
    );

    const allTindakan = await db.tindakan.getAll();
    const tindakanMap = {};
    allTindakan.forEach((t) => {
      if (!tindakanMap[t.pasien_id] || t.tanggal_tindakan > tindakanMap[t.pasien_id].tanggal_tindakan) {
        tindakanMap[t.pasien_id] = t;
      }
    });

    const todayStr = todayISO();
    let countToday = 0;
    let countH3 = 0;
    let countH7 = 0;

    activePasien.forEach((p) => {
      const t = tindakanMap[p.id];
      if (t) {
        const days = diffDays(t.tanggal_tindakan, todayStr);
        if (days === 0) countToday++;
        else if (days >= 1 && days <= 4) countH3++;
        else if (days >= 5) countH7++;
      }
    });

    statsGrid.innerHTML = `
      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-label">Total Dimonitor Bot</span>
          <div class="stat-card-icon blue">${Icons['auto-wa']}</div>
        </div>
        <div class="stat-card-value mono">${activePasien.length} <span style="font-size: 0.875rem; font-weight: 400; color: var(--color-text-tertiary);">anak</span></div>
      </div>

      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-label">Sunat Hari Ini</span>
          <div class="stat-card-icon green">${Icons.check}</div>
        </div>
        <div class="stat-card-value mono">${countToday} <span style="font-size: 0.875rem; font-weight: 400; color: var(--color-text-tertiary);">anak</span></div>
      </div>

      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-label">Kontrol Fase H+3</span>
          <div class="stat-card-icon orange">${Icons.clock}</div>
        </div>
        <div class="stat-card-value mono">${countH3} <span style="font-size: 0.875rem; font-weight: 400; color: var(--color-text-tertiary);">anak</span></div>
      </div>

      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-label">Kontrol Fase H+7+</span>
          <div class="stat-card-icon green">${Icons['rekam-medis']}</div>
        </div>
        <div class="stat-card-value mono">${countH7} <span style="font-size: 0.875rem; font-weight: 400; color: var(--color-text-tertiary);">anak</span></div>
      </div>
    `;
  }

  async function renderTable() {
    const tableContainer = document.getElementById('waTableContainer');
    if (!tableContainer) return;

    let pasienList = await db.pasien.getByCabang(cabangId);
    pasienList = pasienList.filter((p) =>
      p.status === STATUS_PASIEN.SELESAI_TINDAKAN || p.status === STATUS_PASIEN.KONTROL
    );

    const allTindakan = await db.tindakan.getAll();
    const tindakanMap = {};
    allTindakan.forEach((t) => {
      if (!tindakanMap[t.pasien_id] || t.tanggal_tindakan > tindakanMap[t.pasien_id].tanggal_tindakan) {
        tindakanMap[t.pasien_id] = t;
      }
    });

    const todayStr = todayISO();

    // Map monitoring details
    const monitoredList = pasienList.map((p) => {
      const t = tindakanMap[p.id];
      const days = t ? diffDays(t.tanggal_tindakan, todayStr) : 0;
      let phase = 'Sunat Hari Ini';
      if (days > 0 && days <= 4) phase = 'Kontrol H+3';
      else if (days > 4 && days <= 10) phase = 'Kontrol H+7';
      else if (days > 10) phase = 'Kontrol H+14';

      return {
        pasien: p,
        tindakan: t,
        days: days,
        phase: phase,
        autoEnabled: true,
      };
    });

    // Filter tab
    let filtered = monitoredList;
    if (currentTab === 'today') filtered = monitoredList.filter((m) => m.days === 0);
    else if (currentTab === 'h3') filtered = monitoredList.filter((m) => m.days >= 1 && m.days <= 4);
    else if (currentTab === 'h7') filtered = monitoredList.filter((m) => m.days >= 5 && m.days <= 10);
    else if (currentTab === 'h14') filtered = monitoredList.filter((m) => m.days > 10);

    if (filtered.length === 0) {
      tableContainer.innerHTML = `
        <div class="empty-state" style="padding: var(--space-6);">
          <div class="empty-state-icon">${Icons['auto-wa']}</div>
          <p class="empty-state-title">Tidak Ada Pasien di Kategori Ini</p>
          <p class="empty-state-desc">Pasien yang masuk masa pemulihan sunat akan otomatis muncul di sistem otomasi WA ini.</p>
        </div>
      `;
      return;
    }

    const table = el('table', { className: 'data-table' });
    table.innerHTML = `
      <thead>
        <tr>
          <th>Pasien</th>
          <th>Orang Tua & WA</th>
          <th>Data Sunat Terbaru</th>
          <th>Fase Monitoring</th>
          <th>Jadwal WA Berikutnya</th>
          <th>Status Otomasi Bot</th>
          <th>Aksi</th>
        </tr>
      </thead>
    `;

    const tbody = el('tbody');
    filtered.forEach((m) => {
      const p = m.pasien;
      const t = m.tindakan;
      const cabang = CABANG_LIST.find((c) => c.id === p.cabang_id);

      const row = el('tr');
      row.innerHTML = `
        <td>
          <div style="font-weight: 600; font-size: 0.9375rem;">${p.nama_anak}</div>
          <div style="font-size: 0.75rem; color: var(--color-text-tertiary);">${p.umur} thn — ${cabang ? cabang.nama.replace('Sirkumboy ', '') : ''}</div>
        </td>
        <td>
          <div style="font-size: 0.8125rem; font-weight: 500;">${p.nama_ortu}</div>
          <div class="mono" style="font-size: 0.75rem; color: var(--color-primary);">${p.no_wa}</div>
        </td>
        <td>
          <div style="font-size: 0.8125rem;">${t ? formatTanggal(t.tanggal_tindakan) : 'Terbaru'}</div>
          <div style="font-size: 0.75rem; color: var(--color-text-secondary);">${t ? (METODE_SUNAT[t.metode]?.nama || t.metode) : '-'} (${t ? t.dokter : '-'})</div>
        </td>
        <td>
          <span class="badge ${m.days === 0 ? 'badge-success' : 'badge-primary'}">${m.phase} (Hari ke-${m.days})</span>
        </td>
        <td>
          <div style="font-size: 0.75rem; font-weight: 600; color: var(--color-text);">${m.days === 0 ? 'Hari Ini 17:00' : 'Besok 09:00'}</div>
          <div style="font-size: 0.6875rem; color: var(--color-text-tertiary);">Bot Follow-up Otomatis</div>
        </td>
        <td>
          <div class="flex items-center gap-2">
            <input type="checkbox" class="form-toggle btn-toggle-bot" checked />
            <span style="font-size: 0.75rem; font-weight: 500; color: var(--color-success);">Aktif</span>
          </div>
        </td>
        <td>
          <button class="btn btn-sm btn-secondary btn-preview-wa" data-pasien-name="${p.nama_anak}" data-ortu-name="${p.nama_ortu}" data-days="${m.days}" data-cabang="${cabang?.nama.replace('Sirkumboy ', '') || 'Wates'}">
            ${icon('send', '14')} Preview & Kirim
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    tableContainer.innerHTML = '';
    tableContainer.appendChild(table);

    // Preview click events
    tableContainer.querySelectorAll('.btn-preview-wa').forEach((btn) => {
      btn.addEventListener('click', () => {
        const pName = btn.dataset.pasienName;
        const oName = btn.dataset.ortuName;
        const days = btn.dataset.days;
        const cabang = btn.dataset.cabang;
        openPreviewWA(pName, oName, days, cabang);
      });
    });
  }

  function openPreviewWA(namaAnak, namaOrtu, hariKe, cabang) {
    const textMsg = `Assalamu'alaikum, Bunda/Ayah ${namaOrtu}.\n\nIni pengingat asisten kontrol sunat ${namaAnak} di Sirkumboy ${cabang}.\nSudah hari ke-${hariKe} setelah tindakan sunat.\n\nBagaimana kondisi luka pemulihannya hari ini? Apakah celana sunat & paket obat semprotnya aman digunakan?\n\nTerima kasih.\n- Asisten Otomatis Sirkumboy 💙`;

    Modal.open({
      title: `Preview Pesan WA Automation: ${namaAnak}`,
      body: (bodyEl) => {
        bodyEl.innerHTML = `
          <div class="form-group">
            <label class="form-label">Draft Pesan WhatsApp Asisten AI</label>
            <textarea class="form-textarea" id="fWAPreviewText" rows="7" style="font-family: var(--font-mono); font-size: 0.8125rem;">${textMsg}</textarea>
          </div>
        `;
      },
      footer: (footerEl) => {
        footerEl.appendChild(el('button', { className: 'btn btn-secondary', textContent: 'Tutup', onClick: Modal.close }));
        footerEl.appendChild(el('button', {
          className: 'btn btn-primary',
          textContent: 'Simpan & Trigger WA',
          onClick: () => {
            Toast.success(`Pesan WA berhasil dijadwalkan untuk dikirim ke WhatsApp ${namaOrtu}.`);
            Modal.close();
          },
        }));
      },
    });
  }
}
