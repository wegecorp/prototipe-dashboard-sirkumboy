// ============================================================
// PAGE: Cabang — Sirkumboy Dashboard
// Branch management overview with performance cards.
// ============================================================

function PageCabang(container) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Cabang</h1>
        <p class="page-subtitle">Kelola data dan performa cabang Sirkumboy</p>
      </div>
    </div>
    <div id="cabangCardsContainer" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: var(--space-4);"></div>
  `;

  renderCards();

  async function renderCards() {
    const cardsContainer = document.getElementById('cabangCardsContainer');
    if (!cardsContainer) return;

    cardsContainer.innerHTML = '';

    for (const cabang of CABANG_LIST) {
      const pasienCount = await db.pasien.count((p) => p.cabang_id === cabang.id);
      const tindakanList = await db.tindakan.query((t) => t.cabang_id === cabang.id);
      const totalIncome = tindakanList.reduce((sum, t) => sum + (t.total_bayar || 0), 0);
      const lowStock = await db.inventaris.count((i) => i.cabang_id === cabang.id && i.stok <= i.minimum_stok);

      // Metode distribution
      const metodeA = tindakanList.filter((t) => t.metode === 'A').length;
      const metodeB = tindakanList.filter((t) => t.metode === 'B').length;
      const metodeC = tindakanList.filter((t) => t.metode === 'C').length;
      const totalTindakan = tindakanList.length;

      const card = el('div', { className: 'card' });
      card.innerHTML = `
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 style="font-size: 1.125rem;">${cabang.nama}</h3>
            <p style="font-size: 0.75rem; margin-top: var(--space-1); max-width: none;">${cabang.alamat}</p>
          </div>
          <button class="btn btn-ghost btn-sm btn-edit-cabang" data-id="${cabang.id}" title="Edit">
            ${icon('edit', '16')}
          </button>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: var(--space-3); margin-bottom: var(--space-4);">
          <div style="text-align: center; padding: var(--space-3); background: var(--color-primary-light); border-radius: var(--radius-md);">
            <div class="mono" style="font-size: 1.25rem; font-weight: 700; color: var(--color-primary);">${pasienCount}</div>
            <div style="font-size: 0.6875rem; color: var(--color-text-secondary); margin-top: 2px;">Pasien</div>
          </div>
          <div style="text-align: center; padding: var(--space-3); background: var(--color-success-light); border-radius: var(--radius-md);">
            <div class="mono" style="font-size: 1.25rem; font-weight: 700; color: var(--color-success);">${totalTindakan}</div>
            <div style="font-size: 0.6875rem; color: var(--color-text-secondary); margin-top: 2px;">Tindakan</div>
          </div>
          <div style="text-align: center; padding: var(--space-3); background: ${lowStock > 0 ? 'var(--color-danger-light)' : 'var(--color-success-light)'}; border-radius: var(--radius-md);">
            <div class="mono" style="font-size: 1.25rem; font-weight: 700; color: ${lowStock > 0 ? 'var(--color-danger)' : 'var(--color-success)'};">${lowStock}</div>
            <div style="font-size: 0.6875rem; color: var(--color-text-secondary); margin-top: 2px;">Stok Rendah</div>
          </div>
        </div>

        <div style="padding: var(--space-3); background: var(--color-bg); border-radius: var(--radius-md); margin-bottom: var(--space-3);">
          <div style="font-size: 0.75rem; font-weight: 600; color: var(--color-text-secondary); margin-bottom: var(--space-2);">TOTAL PEMASUKAN</div>
          <div class="mono" style="font-size: 1.5rem; font-weight: 700;">${formatRupiah(totalIncome)}</div>
        </div>

        ${totalTindakan > 0 ? `
          <div style="font-size: 0.75rem; font-weight: 600; color: var(--color-text-secondary); margin-bottom: var(--space-2);">DISTRIBUSI METODE</div>
          <div class="flex gap-2">
            <div style="flex: ${metodeA || 1}; height: 8px; background: hsl(210, 65%, 75%); border-radius: var(--radius-full);" title="Metode A: ${metodeA}"></div>
            <div style="flex: ${metodeB || 1}; height: 8px; background: hsl(210, 65%, 48%); border-radius: var(--radius-full);" title="Metode B: ${metodeB}"></div>
            <div style="flex: ${metodeC || 1}; height: 8px; background: hsl(210, 65%, 30%); border-radius: var(--radius-full);" title="Metode C: ${metodeC}"></div>
          </div>
          <div class="flex justify-between" style="font-size: 0.6875rem; color: var(--color-text-tertiary); margin-top: var(--space-1);">
            <span>A: ${metodeA}</span>
            <span>B: ${metodeB}</span>
            <span>C: ${metodeC}</span>
          </div>
        ` : ''}
      `;

      cardsContainer.appendChild(card);
    }

    // Edit buttons
    cardsContainer.querySelectorAll('.btn-edit-cabang').forEach((btn) => {
      btn.addEventListener('click', () => openEditCabang(btn.dataset.id));
    });
  }

  async function openEditCabang(cabangId) {
    const cabang = await db.cabang.getById(cabangId);
    if (!cabang) return;

    Modal.open({
      title: `Edit ${cabang.nama}`,
      body: (bodyEl) => {
        bodyEl.innerHTML = `
          <div class="form-grid">
            <div class="form-group full-width">
              <label class="form-label">Nama Cabang</label>
              <input type="text" class="form-input" id="fCabangNama" value="${cabang.nama}" />
            </div>
            <div class="form-group full-width">
              <label class="form-label">Alamat</label>
              <textarea class="form-textarea" id="fCabangAlamat" rows="2">${cabang.alamat}</textarea>
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
            const nama = document.getElementById('fCabangNama').value.trim();
            const alamat = document.getElementById('fCabangAlamat').value.trim();
            if (!nama) { Toast.error('Nama cabang wajib diisi.'); return; }
            await db.cabang.update(cabangId, { nama, alamat });
            Toast.success('Data cabang berhasil diperbarui.');
            Modal.close();
            renderCards();
          },
        }));
      },
    });
  }
}
