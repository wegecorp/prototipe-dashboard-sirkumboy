// ============================================================
// PAGE: Pasien & Rekam Medis — Sirkumboy Dashboard
// Integrated Patient Management + Full Circumcision & Medical Records.
// ============================================================

function PagePasien(container) {
  const cabangId = db.getActiveCabang();

  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Manajemen Pasien & Rekam Medis</h1>
        <p class="page-subtitle">Data lengkap pasien, tanggal sunat, status, dan riwayat rekam medis</p>
      </div>
      <button class="btn btn-primary" id="btnTambahPasien">
        ${icon('plus', '16')} Tambah Pasien
      </button>
    </div>
    <div class="data-table-wrapper">
      <div class="data-table-toolbar">
        <div class="data-table-search">
          ${Icons.search}
          <input type="text" placeholder="Cari nama anak atau ortu..." id="searchPasien" />
        </div>
        <div class="filters-bar" style="margin-bottom: 0;">
          <button class="filter-chip active" data-filter="all">Semua Pasien</button>
          ${STATUS_PASIEN_FLOW.map(
            (s) => `<button class="filter-chip" data-filter="${s}">${STATUS_PASIEN_LABELS[s]}</button>`
          ).join('')}
        </div>
      </div>
      <div id="pasienTableContainer"></div>
    </div>
  `;

  let currentFilter = 'all';
  let searchQuery = '';

  document.getElementById('btnTambahPasien').addEventListener('click', () => openPasienForm());
  document.getElementById('searchPasien').addEventListener('input', debounce((e) => {
    searchQuery = e.target.value.toLowerCase();
    renderTable();
  }));

  document.querySelectorAll('.filter-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilter = chip.dataset.filter;
      renderTable();
    });
  });

  async function renderTable() {
    const tableContainer = document.getElementById('pasienTableContainer');
    if (!tableContainer) return;

    let pasienList = await db.pasien.getByCabang(cabangId);
    const allTindakan = await db.tindakan.getAll();
    const tindakanMap = {};
    allTindakan.forEach((t) => { tindakanMap[t.pasien_id] = t; });

    // Filter
    if (currentFilter !== 'all') {
      pasienList = pasienList.filter((p) => p.status === currentFilter);
    }
    if (searchQuery) {
      pasienList = pasienList.filter((p) =>
        p.nama_anak.toLowerCase().includes(searchQuery) ||
        p.nama_ortu.toLowerCase().includes(searchQuery)
      );
    }

    pasienList.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    if (pasienList.length === 0) {
      tableContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">${Icons.pasien}</div>
          <p class="empty-state-title">Belum Ada Pasien</p>
          <p class="empty-state-desc">Tambahkan pasien pertama dengan klik tombol "Tambah Pasien" di atas.</p>
        </div>
      `;
      return;
    }

    const table = el('table', { className: 'data-table' });
    table.innerHTML = `
      <thead>
        <tr>
          <th>Nama Anak</th>
          <th>Umur</th>
          <th>Orang Tua</th>
          <th>Tgl Sunat</th>
          <th>Metode</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
    `;

    const tbody = el('tbody');
    pasienList.forEach((p) => {
      const t = tindakanMap[p.id];
      const statusBadgeClass = {
        [STATUS_PASIEN.TERDAFTAR]: 'badge-neutral',
        [STATUS_PASIEN.DIJADWALKAN]: 'badge-primary',
        [STATUS_PASIEN.SELESAI_TINDAKAN]: 'badge-success',
        [STATUS_PASIEN.KONTROL]: 'badge-warning',
        [STATUS_PASIEN.SEMBUH]: 'badge-success',
      };

      const row = el('tr', { onClick: () => openPasienDetail(p.id) });
      row.innerHTML = `
        <td style="font-weight: 600;">${p.nama_anak}</td>
        <td class="mono">${p.umur} thn</td>
        <td>${p.nama_ortu}</td>
        <td class="mono" style="font-size: 0.75rem;">${t ? formatTanggal(t.tanggal_tindakan) : '<span style="color: var(--color-text-tertiary);">Belum sunat</span>'}</td>
        <td>${t ? `<span class="badge badge-primary">${METODE_SUNAT[t.metode]?.nama || t.metode}</span>` : '-'}</td>
        <td><span class="badge ${statusBadgeClass[p.status] || 'badge-neutral'}">${STATUS_PASIEN_LABELS[p.status]}</span></td>
        <td>
          <div class="flex gap-1">
            <button class="btn btn-ghost btn-sm btn-view-detail" data-id="${p.id}" title="Lihat Rekam Medis & Detail">
              ${icon('rekam-medis', '14')} Rekam Medis
            </button>
            <button class="btn btn-ghost btn-sm btn-delete" data-id="${p.id}" title="Hapus">
              ${icon('trash', '14')}
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    tableContainer.innerHTML = '';
    tableContainer.appendChild(table);

    // Click events
    tableContainer.querySelectorAll('.btn-view-detail').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openPasienDetail(btn.dataset.id);
      });
    });

    tableContainer.querySelectorAll('.btn-delete').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        Modal.confirm('Yakin ingin menghapus data pasien ini beserta rekam medisnya?', async () => {
          await db.pasien.delete(id);
          Toast.success('Data pasien berhasil dihapus.');
          renderTable();
        });
      });
    });
  }

  function openPasienForm(editData = null) {
    const isEdit = !!editData;
    const cabangList = cabangId === CABANG_ALL_ID ? CABANG_LIST : CABANG_LIST.filter((c) => c.id === cabangId);
    const defaultCabang = cabangId === CABANG_ALL_ID ? CABANG_LIST[0].id : cabangId;

    Modal.open({
      title: isEdit ? 'Edit Pasien' : 'Tambah Pasien Baru',
      size: 'modal-lg',
      body: (bodyEl) => {
        bodyEl.innerHTML = `
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Nama Anak</label>
              <input type="text" class="form-input" id="fNamaAnak" value="${editData?.nama_anak || ''}" placeholder="Nama lengkap anak" />
            </div>
            <div class="form-group">
              <label class="form-label">Umur (tahun)</label>
              <input type="number" class="form-input" id="fUmur" value="${editData?.umur || ''}" min="1" max="99" placeholder="Umur" />
            </div>
            <div class="form-group">
              <label class="form-label">Nama Orang Tua</label>
              <input type="text" class="form-input" id="fNamaOrtu" value="${editData?.nama_ortu || ''}" placeholder="Nama ayah/ibu" />
            </div>
            <div class="form-group">
              <label class="form-label">No. WhatsApp</label>
              <input type="text" class="form-input" id="fNoWA" value="${editData?.no_wa || ''}" placeholder="08xxxxxxxxxx" />
            </div>
            <div class="form-group full-width">
              <label class="form-label">Alamat</label>
              <textarea class="form-textarea" id="fAlamat" rows="2" placeholder="Alamat lengkap">${editData?.alamat || ''}</textarea>
            </div>
            ${cabangId === CABANG_ALL_ID ? `
              <div class="form-group">
                <label class="form-label">Cabang</label>
                <select class="form-select" id="fCabang">
                  ${cabangList.map((c) => `<option value="${c.id}" ${c.id === (editData?.cabang_id || defaultCabang) ? 'selected' : ''}>${c.nama.replace('Sirkumboy ', '')}</option>`).join('')}
                </select>
              </div>
            ` : ''}
            <div class="form-group full-width">
              <label class="form-label" style="margin-bottom: var(--space-2);">Kondisi Medis Awal</label>
              <div class="flex gap-6" style="flex-wrap: wrap;">
                <label class="checkbox-row"><input type="checkbox" id="fGemuk" ${editData?.kondisi_gemuk ? 'checked' : ''} /> Gemuk</label>
                <label class="checkbox-row"><input type="checkbox" id="fAlergi" ${editData?.kondisi_alergi ? 'checked' : ''} /> Alergi Obat</label>
                <label class="checkbox-row"><input type="checkbox" id="fHemofilia" ${editData?.kondisi_hemofilia ? 'checked' : ''} /> Hemofilia</label>
                <label class="checkbox-row"><input type="checkbox" id="fKelainan" ${editData?.kondisi_kelainan ? 'checked' : ''} /> Kelainan Tumbuh Kembang</label>
              </div>
            </div>
          </div>
        `;
      },
      footer: (footerEl) => {
        footerEl.appendChild(el('button', { className: 'btn btn-secondary', textContent: 'Batal', onClick: Modal.close }));
        footerEl.appendChild(el('button', { className: 'btn btn-primary', textContent: isEdit ? 'Simpan' : 'Tambah', onClick: savePasien }));

        async function savePasien() {
          const data = {
            nama_anak: document.getElementById('fNamaAnak').value.trim(),
            umur: parseInt(document.getElementById('fUmur').value) || 0,
            nama_ortu: document.getElementById('fNamaOrtu').value.trim(),
            no_wa: document.getElementById('fNoWA').value.trim(),
            alamat: document.getElementById('fAlamat').value.trim(),
            cabang_id: document.getElementById('fCabang')?.value || defaultCabang,
            kondisi_gemuk: document.getElementById('fGemuk').checked,
            kondisi_alergi: document.getElementById('fAlergi').checked,
            kondisi_hemofilia: document.getElementById('fHemofilia').checked,
            kondisi_kelainan: document.getElementById('fKelainan').checked,
            status: editData?.status || STATUS_PASIEN.TERDAFTAR,
          };

          if (!data.nama_anak || !data.nama_ortu) {
            Toast.error('Nama anak dan nama orang tua wajib diisi.');
            return;
          }

          if (isEdit) {
            await db.pasien.update(editData.id, data);
            Toast.success('Data pasien berhasil diperbarui.');
          } else {
            await db.pasien.create(data);
            Toast.success('Pasien baru berhasil ditambahkan.');
          }

          Modal.close();
          renderTable();
        }
      },
    });
  }

  async function openPasienDetail(id) {
    const p = await db.pasien.getById(id);
    if (!p) return;

    const cabang = CABANG_LIST.find((c) => c.id === p.cabang_id);
    const tindakanList = await db.tindakan.query((t) => t.pasien_id === p.id);
    const rekamMedisList = await db.rekam_medis.query((r) => r.pasien_id === p.id);
    rekamMedisList.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

    const statusBadgeClass = {
      [STATUS_PASIEN.TERDAFTAR]: 'badge-neutral',
      [STATUS_PASIEN.DIJADWALKAN]: 'badge-primary',
      [STATUS_PASIEN.SELESAI_TINDAKAN]: 'badge-success',
      [STATUS_PASIEN.KONTROL]: 'badge-warning',
      [STATUS_PASIEN.SEMBUH]: 'badge-success',
    };

    const currentIdx = STATUS_PASIEN_FLOW.indexOf(p.status);
    const nextStatus = currentIdx < STATUS_PASIEN_FLOW.length - 1 ? STATUS_PASIEN_FLOW[currentIdx + 1] : null;

    Modal.open({
      title: `Profil Pasien & Rekam Medis: ${p.nama_anak}`,
      size: 'modal-lg',
      body: (bodyEl) => {
        bodyEl.innerHTML = `
          <div class="flex items-center justify-between mb-4" style="background: var(--color-bg); padding: var(--space-3) var(--space-4); border-radius: var(--radius-md);">
            <div>
              <span class="badge ${statusBadgeClass[p.status]}">${STATUS_PASIEN_LABELS[p.status]}</span>
              <span style="font-size: 0.8125rem; color: var(--color-text-secondary); margin-left: var(--space-2);">${cabang ? cabang.nama : ''}</span>
            </div>
            <div style="font-size: 0.8125rem; font-weight: 500;" class="mono">
              WA: ${p.no_wa}
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-2);" class="mb-4">
            <div class="detail-row"><span class="detail-label">Umur</span><span class="detail-value">${p.umur} tahun</span></div>
            <div class="detail-row"><span class="detail-label">Orang Tua</span><span class="detail-value">${p.nama_ortu}</span></div>
            <div class="detail-row"><span class="detail-label">Alamat</span><span class="detail-value">${p.alamat || '-'}</span></div>
            <div class="detail-row"><span class="detail-label">Kondisi Medis</span><span class="detail-value">${
              [p.kondisi_gemuk && 'Gemuk', p.kondisi_alergi && 'Alergi Obat', p.kondisi_hemofilia && 'Hemofilia', p.kondisi_kelainan && 'Kelainan Tumbuh Kembang'].filter(Boolean).join(', ') || 'Tidak ada'
            }</span></div>
          </div>

          <hr style="border: none; border-top: 1px solid var(--color-border-light); margin: var(--space-4) 0;" />

          <div class="flex items-center justify-between mb-3">
            <h4 style="font-size: 1rem;">Histori Tindakan & Rekam Medis</h4>
            <button class="btn btn-sm btn-primary" id="btnTambahCatatanInModal">
              ${icon('plus', '14')} Tambah Catatan Medis
            </button>
          </div>

          ${tindakanList.length > 0 ? `
            <div style="padding: var(--space-3) var(--space-4); background: var(--color-primary-light); border-radius: var(--radius-md); margin-bottom: var(--space-4); border-left: 3px solid var(--color-primary);">
              <div style="font-size: 0.75rem; font-weight: 700; color: var(--color-primary); margin-bottom: 2px;">TINDAKAN SUNAT</div>
              ${tindakanList.map((t) => `
                <div style="font-size: 0.8125rem;">
                  <strong>Tanggal Sunat:</strong> ${formatTanggal(t.tanggal_tindakan)} | <strong>Metode:</strong> ${METODE_SUNAT[t.metode]?.nama || t.metode} | <strong>Dokter:</strong> ${t.dokter}
                  <br/><strong>Total Bayar:</strong> ${formatRupiah(t.total_bayar)} ${t.diskon > 0 ? `(diskon ${formatRupiah(t.diskon)})` : ''}
                </div>
              `).join('')}
            </div>
          ` : `
            <div style="padding: var(--space-3); background: var(--color-bg); border-radius: var(--radius-md); font-size: 0.8125rem; color: var(--color-text-tertiary); margin-bottom: var(--space-4);">
              Belum ada data tindakan sunat. (Pasien terdaftar / dijadwalkan).
            </div>
          `}

          ${rekamMedisList.length > 0 ? `
            <div class="timeline" style="margin-top: var(--space-2);">
              ${rekamMedisList.map((r) => `
                <div class="timeline-item">
                  <div class="timeline-date">${formatTanggal(r.tanggal)}</div>
                  <div class="timeline-content">${r.catatan}</div>
                </div>
              `).join('')}
            </div>
          ` : `
            <p style="font-size: 0.8125rem; color: var(--color-text-tertiary);">Belum ada catatan pemulihan/kontrol.</p>
          `}
        `;

        const btnTambah = bodyEl.querySelector('#btnTambahCatatanInModal');
        if (btnTambah) {
          btnTambah.addEventListener('click', () => {
            openCatatanForm(p.id, () => openPasienDetail(p.id));
          });
        }
      },
      footer: (footerEl) => {
        footerEl.appendChild(el('button', { className: 'btn btn-secondary', textContent: 'Edit Profil', onClick: () => { Modal.close(); openPasienForm(p); } }));
        if (nextStatus) {
          footerEl.appendChild(el('button', {
            className: 'btn btn-primary',
            textContent: `Advance Status: ${STATUS_PASIEN_LABELS[nextStatus]}`,
            onClick: async () => {
              await db.pasien.update(p.id, { status: nextStatus });
              Toast.success(`Status pasien diubah ke ${STATUS_PASIEN_LABELS[nextStatus]}.`);
              Modal.close();
              renderTable();
            },
          }));
        }
      },
    });
  }

  function openCatatanForm(pasienId, callback) {
    Modal.open({
      title: 'Tambah Catatan Rekam Medis',
      body: (bodyEl) => {
        bodyEl.innerHTML = `
          <div class="form-grid">
            <div class="form-group full-width">
              <label class="form-label">Tanggal Catatan</label>
              <input type="date" class="form-input" id="fRMTanggal" value="${todayISO()}" />
            </div>
            <div class="form-group full-width">
              <label class="form-label">Catatan Medis / Pemulihan</label>
              <textarea class="form-textarea" id="fRMCatatan" rows="4" placeholder="Kondisi luka, perkembangan kontrol, pengobatan..."></textarea>
            </div>
          </div>
        `;
      },
      footer: (footerEl) => {
        footerEl.appendChild(el('button', { className: 'btn btn-secondary', textContent: 'Batal', onClick: () => { Modal.close(); if (callback) callback(); } }));
        footerEl.appendChild(el('button', {
          className: 'btn btn-primary',
          textContent: 'Simpan Catatan',
          onClick: async () => {
            const catatan = document.getElementById('fRMCatatan').value.trim();
            if (!catatan) { Toast.error('Catatan tidak boleh kosong.'); return; }

            await db.rekam_medis.create({
              pasien_id: pasienId,
              tindakan_id: null,
              catatan: catatan,
              tanggal: document.getElementById('fRMTanggal').value,
            });

            Toast.success('Catatan rekam medis berhasil ditambahkan.');
            Modal.close();
            if (callback) callback();
          },
        }));
      },
    });
  }

  renderTable();
}
