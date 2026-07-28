// ============================================================
// PAGE: Rekam Medis — Sirkumboy Dashboard
// Simple medical records per patient with timeline view.
// ============================================================

function PageRekamMedis(container) {
  const cabangId = db.getActiveCabang();
  let selectedPasienId = null;

  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Rekam Medis</h1>
        <p class="page-subtitle">Catatan medis dan riwayat pemulihan pasien</p>
      </div>
    </div>
    <div class="flex gap-4" style="flex-wrap: wrap;">
      <div class="form-group" style="min-width: 280px;">
        <label class="form-label">Pilih Pasien</label>
        <select class="form-select" id="selectPasienRM">
          <option value="">— Pilih pasien —</option>
        </select>
      </div>
    </div>
    <div id="rekamMedisContent" style="margin-top: var(--space-6);"></div>
  `;

  loadPasienList();

  document.getElementById('selectPasienRM').addEventListener('change', (e) => {
    selectedPasienId = e.target.value || null;
    renderContent();
  });

  async function loadPasienList() {
    let pasienList = await db.pasien.getByCabang(cabangId);
    // Only show pasien that have had tindakan or beyond
    pasienList = pasienList.filter((p) =>
      [STATUS_PASIEN.SELESAI_TINDAKAN, STATUS_PASIEN.KONTROL, STATUS_PASIEN.SEMBUH].includes(p.status)
    );
    pasienList.sort((a, b) => a.nama_anak.localeCompare(b.nama_anak));

    const select = document.getElementById('selectPasienRM');
    pasienList.forEach((p) => {
      const cabang = CABANG_LIST.find((c) => c.id === p.cabang_id);
      const opt = el('option', {
        value: p.id,
        textContent: `${p.nama_anak} — ${cabang ? cabang.nama.replace('Sirkumboy ', '') : ''} (${STATUS_PASIEN_LABELS[p.status]})`,
      });
      select.appendChild(opt);
    });

    if (pasienList.length === 0) {
      document.getElementById('rekamMedisContent').innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">${Icons['rekam-medis']}</div>
          <p class="empty-state-title">Belum Ada Data</p>
          <p class="empty-state-desc">Rekam medis tersedia setelah pasien menyelesaikan tindakan sunat.</p>
        </div>
      `;
    }
  }

  async function renderContent() {
    const content = document.getElementById('rekamMedisContent');
    if (!content || !selectedPasienId) {
      if (content) content.innerHTML = '';
      return;
    }

    const pasien = await db.pasien.getById(selectedPasienId);
    if (!pasien) return;

    const rekamList = await db.rekam_medis.query((r) => r.pasien_id === selectedPasienId);
    rekamList.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

    const tindakanList = await db.tindakan.query((t) => t.pasien_id === selectedPasienId);

    const cabang = CABANG_LIST.find((c) => c.id === pasien.cabang_id);

    content.innerHTML = `
      <div class="card" style="margin-bottom: var(--space-4);">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3>${pasien.nama_anak}</h3>
            <p style="font-size: 0.8125rem; margin-top: var(--space-1);">
              ${pasien.umur} tahun — ${cabang ? cabang.nama : ''} — ${STATUS_PASIEN_LABELS[pasien.status]}
            </p>
          </div>
          <button class="btn btn-primary btn-sm" id="btnTambahCatatan">
            ${icon('plus', '14')} Tambah Catatan
          </button>
        </div>

        ${tindakanList.length > 0 ? `
          <div style="padding: var(--space-3); background: var(--color-primary-light); border-radius: var(--radius-md); margin-bottom: var(--space-4);">
            <div style="font-size: 0.75rem; font-weight: 600; color: var(--color-primary); margin-bottom: var(--space-1);">TINDAKAN TERAKHIR</div>
            ${tindakanList.map((t) => `
              <div style="font-size: 0.8125rem;">
                ${formatTanggal(t.tanggal_tindakan)} — ${METODE_SUNAT[t.metode]?.nama || t.metode} — ${t.dokter}
                ${t.catatan ? `<br/><span style="color: var(--color-text-secondary);">${t.catatan}</span>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${rekamList.length > 0 ? `
          <h4 style="margin-bottom: var(--space-3);">Catatan Pemulihan</h4>
          <div class="timeline">
            ${rekamList.map((r) => `
              <div class="timeline-item">
                <div class="timeline-date">${formatTanggal(r.tanggal)}</div>
                <div class="timeline-content">${r.catatan}</div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="empty-state" style="padding: var(--space-6);">
            <p class="empty-state-desc">Belum ada catatan medis. Tambahkan catatan pertama.</p>
          </div>
        `}
      </div>
    `;

    document.getElementById('btnTambahCatatan').addEventListener('click', () => openCatatanForm());
  }

  function openCatatanForm() {
    Modal.open({
      title: 'Tambah Catatan Medis',
      body: (bodyEl) => {
        bodyEl.innerHTML = `
          <div class="form-grid">
            <div class="form-group full-width">
              <label class="form-label">Tanggal</label>
              <input type="date" class="form-input" id="fRMTanggal" value="${todayISO()}" />
            </div>
            <div class="form-group full-width">
              <label class="form-label">Catatan</label>
              <textarea class="form-textarea" id="fRMCatatan" rows="4" placeholder="Kondisi luka, perkembangan pemulihan, instruksi..."></textarea>
            </div>
          </div>
        `;
      },
      footer: (footerEl) => {
        footerEl.appendChild(el('button', { className: 'btn btn-secondary', textContent: 'Batal', onClick: Modal.close }));
        footerEl.appendChild(el('button', {
          className: 'btn btn-primary',
          textContent: 'Simpan',
          onClick: async () => {
            const catatan = document.getElementById('fRMCatatan').value.trim();
            if (!catatan) { Toast.error('Catatan tidak boleh kosong.'); return; }

            await db.rekam_medis.create({
              pasien_id: selectedPasienId,
              tindakan_id: null,
              catatan,
              tanggal: document.getElementById('fRMTanggal').value,
            });

            Toast.success('Catatan medis berhasil ditambahkan.');
            Modal.close();
            renderContent();
          },
        }));
      },
    });
  }
}
