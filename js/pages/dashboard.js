// ============================================================
// PAGE: Dashboard — Sirkumboy Dashboard
// Overview: stat cards, charts, alerts.
// ============================================================

function PageDashboard(container) {
  const cabangId = db.getActiveCabang();

  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">Ringkasan performa bisnis Sirkumboy</p>
      </div>
    </div>
    <div class="stats-grid" id="statsGrid">
      <div class="stat-card skeleton skeleton-card"></div>
      <div class="stat-card skeleton skeleton-card"></div>
      <div class="stat-card skeleton skeleton-card"></div>
      <div class="stat-card skeleton skeleton-card"></div>
    </div>
    <div class="charts-grid">
      <div class="chart-card">
        <h4 class="chart-card-title">Tren Pasien (6 Bulan Terakhir)</h4>
        <div class="chart-container"><canvas id="chartTrend"></canvas></div>
      </div>
      <div class="chart-card">
        <h4 class="chart-card-title">Distribusi Metode</h4>
        <div class="chart-container"><canvas id="chartMetode"></canvas></div>
      </div>
    </div>
    <div class="charts-grid" style="margin-top: var(--space-4);">
      <div class="chart-card">
        <h4 class="chart-card-title">Pemasukan per Cabang</h4>
        <div class="chart-container"><canvas id="chartCabang"></canvas></div>
      </div>
      <div class="chart-card">
        <h4 class="chart-card-title">Perlu Perhatian</h4>
        <div id="alertList" class="flex flex-col gap-3"></div>
      </div>
    </div>
  `;

  loadStats(cabangId);
  loadCharts(cabangId);
  loadAlerts(cabangId);
}

async function loadStats(cabangId) {
  const grid = document.getElementById('statsGrid');
  if (!grid) return;

  const today = todayISO();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

  // Pasien hari ini
  const jadwalToday = await db.jadwal.query((j) => {
    const matchCabang = !cabangId || cabangId === CABANG_ALL_ID || j.cabang_id === cabangId;
    return matchCabang && j.tanggal === today && j.status === STATUS_JADWAL.DIJADWALKAN;
  });

  // Pemasukan bulan ini
  const tindakanBulan = await db.tindakan.query((t) => {
    const matchCabang = !cabangId || cabangId === CABANG_ALL_ID || t.cabang_id === cabangId;
    return matchCabang && t.tanggal_tindakan >= monthStart;
  });
  const totalIncome = tindakanBulan.reduce((sum, t) => sum + (t.total_bayar || 0), 0);

  // Stok rendah
  const inventaris = await db.inventaris.query((i) => {
    const matchCabang = !cabangId || cabangId === CABANG_ALL_ID || i.cabang_id === cabangId;
    return matchCabang && i.stok <= i.minimum_stok;
  });

  // Pasien perlu kontrol
  const pasienKontrol = await db.pasien.query((p) => {
    const matchCabang = !cabangId || cabangId === CABANG_ALL_ID || p.cabang_id === cabangId;
    return matchCabang && (p.status === STATUS_PASIEN.SELESAI_TINDAKAN || p.status === STATUS_PASIEN.KONTROL);
  });

  grid.innerHTML = '';

  const stats = [
    {
      label: 'Jadwal Hari Ini',
      value: jadwalToday.length,
      iconColor: 'blue',
      iconName: 'jadwal',
      formatter: (n) => n.toString(),
    },
    {
      label: 'Pemasukan Bulan Ini',
      value: totalIncome,
      iconColor: 'green',
      iconName: 'keuangan',
      formatter: formatRupiah,
    },
    {
      label: 'Stok Rendah',
      value: inventaris.length,
      iconColor: inventaris.length > 0 ? 'orange' : 'green',
      iconName: 'inventaris',
      formatter: (n) => n + ' item',
    },
    {
      label: 'Perlu Kontrol',
      value: pasienKontrol.length,
      iconColor: pasienKontrol.length > 0 ? 'red' : 'green',
      iconName: 'pasien',
      formatter: (n) => n + ' pasien',
    },
  ];

  stats.forEach((stat) => {
    const card = el('div', { className: 'stat-card' }, [
      el('div', { className: 'stat-card-header' }, [
        el('span', { className: 'stat-card-label', textContent: stat.label }),
        el('div', { className: `stat-card-icon ${stat.iconColor}`, innerHTML: Icons[stat.iconName] }),
      ]),
      el('div', { className: 'stat-card-value', id: `stat-${stat.label.replace(/\s/g, '')}` }),
    ]);
    grid.appendChild(card);

    // Count-up animation
    const valueEl = card.querySelector('.stat-card-value');
    animateCount(valueEl, stat.value, stat.formatter);
  });
}

async function loadCharts(cabangId) {
  if (typeof Chart === 'undefined') return;

  const chartDefaults = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        labels: {
          font: { family: "'Inter', sans-serif", size: 12 },
          color: '#6b7280',
        },
      },
    },
  };

  // ── Trend Chart (Line) ──────────────────────────────────
  const trendCtx = document.getElementById('chartTrend');
  if (trendCtx) {
    const allTindakan = await db.tindakan.query((t) => {
      return !cabangId || cabangId === CABANG_ALL_ID || t.cabang_id === cabangId;
    });

    const months = [];
    const counts = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString('id-ID', { month: 'short' });
      const monthStr = d.toISOString().substring(0, 7);
      months.push(label);
      counts.push(
        allTindakan.filter((t) => t.tanggal_tindakan && t.tanggal_tindakan.startsWith(monthStr)).length
      );
    }

    new Chart(trendCtx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Pasien',
            data: counts,
            borderColor: 'hsl(210, 65%, 48%)',
            backgroundColor: 'hsla(210, 65%, 48%, 0.08)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            borderWidth: 2,
          },
        ],
      },
      options: {
        ...chartDefaults,
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, font: { family: "'JetBrains Mono', monospace", size: 11 }, color: '#9ca3af' },
            grid: { color: 'rgba(0,0,0,0.04)' },
          },
          x: {
            ticks: { font: { size: 11 }, color: '#9ca3af' },
            grid: { display: false },
          },
        },
      },
    });
  }

  // ── Metode Chart (Doughnut) ─────────────────────────────
  const metodeCtx = document.getElementById('chartMetode');
  if (metodeCtx) {
    const allTindakan = await db.tindakan.query((t) => {
      return !cabangId || cabangId === CABANG_ALL_ID || t.cabang_id === cabangId;
    });

    const metodeCounts = METODE_LIST.map((m) => allTindakan.filter((t) => t.metode === m.id).length);

    new Chart(metodeCtx, {
      type: 'doughnut',
      data: {
        labels: METODE_LIST.map((m) => `${m.nama} (${formatRupiah(m.harga)})`),
        datasets: [
          {
            data: metodeCounts,
            backgroundColor: ['hsl(210, 65%, 75%)', 'hsl(210, 65%, 48%)', 'hsl(210, 65%, 30%)'],
            borderWidth: 0,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        ...chartDefaults,
        cutout: '65%',
        plugins: {
          ...chartDefaults.plugins,
          legend: { position: 'bottom', labels: { padding: 16, font: { size: 11 }, color: '#6b7280' } },
        },
      },
    });
  }

  // ── Cabang Chart (Bar) ──────────────────────────────────
  const cabangCtx = document.getElementById('chartCabang');
  if (cabangCtx) {
    const incomePerCabang = [];
    for (const c of CABANG_LIST) {
      const tindakan = await db.tindakan.query((t) => t.cabang_id === c.id);
      const total = tindakan.reduce((sum, t) => sum + (t.total_bayar || 0), 0);
      incomePerCabang.push(total);
    }

    new Chart(cabangCtx, {
      type: 'bar',
      data: {
        labels: CABANG_LIST.map((c) => c.nama.replace('Sirkumboy ', '')),
        datasets: [
          {
            label: 'Pemasukan',
            data: incomePerCabang,
            backgroundColor: ['hsl(210, 65%, 48%)', 'hsl(152, 55%, 41%)', 'hsl(38, 92%, 50%)'],
            borderRadius: 8,
            barThickness: 40,
          },
        ],
      },
      options: {
        ...chartDefaults,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (v) => formatShortRupiah(v),
              font: { family: "'JetBrains Mono', monospace", size: 11 },
              color: '#9ca3af',
            },
            grid: { color: 'rgba(0,0,0,0.04)' },
          },
          x: {
            ticks: { font: { size: 12 }, color: '#6b7280' },
            grid: { display: false },
          },
        },
        plugins: { ...chartDefaults.plugins, legend: { display: false } },
      },
    });
  }
}

async function loadAlerts(cabangId) {
  const alertList = document.getElementById('alertList');
  if (!alertList) return;

  // Stok rendah
  const lowStock = await db.inventaris.query((i) => {
    const matchCabang = !cabangId || cabangId === CABANG_ALL_ID || i.cabang_id === cabangId;
    return matchCabang && i.stok <= i.minimum_stok;
  });

  // Pasien perlu kontrol
  const needControl = await db.pasien.query((p) => {
    const matchCabang = !cabangId || cabangId === CABANG_ALL_ID || p.cabang_id === cabangId;
    return matchCabang && (p.status === STATUS_PASIEN.SELESAI_TINDAKAN || p.status === STATUS_PASIEN.KONTROL);
  });

  if (lowStock.length === 0 && needControl.length === 0) {
    alertList.innerHTML = `
      <div class="empty-state" style="padding: var(--space-6);">
        <div class="empty-state-icon">${Icons.check}</div>
        <p class="empty-state-title">Semua Aman</p>
        <p class="empty-state-desc">Tidak ada alert yang membutuhkan perhatian saat ini.</p>
      </div>
    `;
    return;
  }

  alertList.innerHTML = '';

  lowStock.slice(0, 3).forEach((item) => {
    const cabang = CABANG_LIST.find((c) => c.id === item.cabang_id);
    alertList.appendChild(
      el('div', {
        className: 'flex items-center gap-3',
        style: { padding: 'var(--space-3)', background: 'var(--color-warning-light)', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem' },
      }, [
        el('span', { innerHTML: Icons.alertCircle, style: { color: 'var(--color-warning)', display: 'flex' } }),
        el('span', { textContent: `Stok ${item.nama_item} rendah (${item.stok}) — ${cabang ? cabang.nama.replace('Sirkumboy ', '') : ''}` }),
      ])
    );
  });

  needControl.slice(0, 3).forEach((p) => {
    alertList.appendChild(
      el('div', {
        className: 'flex items-center gap-3',
        style: { padding: 'var(--space-3)', background: 'var(--color-primary-light)', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem' },
      }, [
        el('span', { innerHTML: Icons.bell, style: { color: 'var(--color-primary)', display: 'flex' } }),
        el('span', { textContent: `${p.nama_anak} — perlu kontrol (${STATUS_PASIEN_LABELS[p.status]})` }),
      ])
    );
  });
}
