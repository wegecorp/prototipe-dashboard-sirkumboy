// ============================================================
// PAGE: Inventaris — Sirkumboy Dashboard
// Simplified 2-Item Inventory Tracking: RC Mainan & Paket Obat Semprot
// ============================================================

function PageInventaris(container) {
  const cabangId = db.getActiveCabang();

  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Inventaris Klinik</h1>
        <p class="page-subtitle">Monitoring stok cepat: Hadiah (RC Mainan) & Paket Obat Semprot</p>
      </div>
    </div>
    <div id="inventarisCardsContainer" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: var(--space-6);"></div>
  `;

  renderCards();

  async function renderCards() {
    const cardsContainer = document.getElementById('inventarisCardsContainer');
    if (!cardsContainer) return;

    let items = await db.inventaris.getByCabang(cabangId);

    if (items.length === 0) {
      cardsContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">${Icons.inventaris}</div>
          <p class="empty-state-title">Belum Ada Item</p>
          <p class="empty-state-desc">Data inventaris belum tersedia untuk cabang ini.</p>
        </div>
      `;
      return;
    }

    cardsContainer.innerHTML = '';

    items.forEach((item) => {
      const isLow = item.stok <= item.minimum_stok;
      const cabang = CABANG_LIST.find((c) => c.id === item.cabang_id);
      const isHadiah = item.kategori === 'hadiah';

      const card = el('div', { className: 'card card-interactive' });
      card.style.borderLeft = isLow ? '4px solid var(--color-danger)' : '4px solid var(--color-primary)';

      card.innerHTML = `
        <div class="flex items-center justify-between mb-4">
          <div>
            <span class="badge ${isHadiah ? 'badge-success' : 'badge-primary'}" style="margin-bottom: var(--space-1);">
              ${isHadiah ? 'HADIAH ANTAK' : 'OBAT & PERAWATAN'}
            </span>
            <h3 style="font-size: 1.375rem; font-weight: 700; margin-top: var(--space-1);">${item.nama_item}</h3>
            <p style="font-size: 0.75rem; color: var(--color-text-tertiary);">${cabang ? cabang.nama : ''}</p>
          </div>
          <div class="stat-card-icon ${isLow ? 'red' : (isHadiah ? 'green' : 'blue')}">
            ${Icons[isHadiah ? 'inventaris' : 'rekam-medis']}
          </div>
        </div>

        <div style="background: var(--color-bg); padding: var(--space-4); border-radius: var(--radius-lg); margin-bottom: var(--space-4);" class="flex items-center justify-between">
          <div>
            <div style="font-size: 0.75rem; font-weight: 600; color: var(--color-text-secondary);">STOK TERSIDIA</div>
            <div class="mono" style="font-size: 2.25rem; font-weight: 700; line-height: 1.1; color: ${isLow ? 'var(--color-danger)' : 'var(--color-text)'};">
              ${item.stok} <span style="font-size: 0.875rem; font-weight: 400; color: var(--color-text-tertiary);">unit</span>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 0.75rem; color: var(--color-text-tertiary);">Minimum: ${item.minimum_stok} unit</div>
            <div style="margin-top: 4px;">
              ${isLow
                ? `<span class="badge badge-danger">STOK CRITICAL</span>`
                : `<span class="badge badge-success">AMAN</span>`
              }
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between">
          <span style="font-size: 0.8125rem; color: var(--color-text-secondary);">Quick Adjust:</span>
          <div class="flex gap-2">
            <button class="btn btn-secondary btn-sm btn-adjust-stok" data-id="${item.id}" data-delta="-1" style="font-weight: 700; font-size: 1rem; width: 36px;">-</button>
            <button class="btn btn-secondary btn-sm btn-adjust-stok" data-id="${item.id}" data-delta="1" style="font-weight: 700; font-size: 1rem; width: 36px;">+</button>
            <button class="btn btn-ghost btn-sm btn-edit-min" data-id="${item.id}" title="Edit Detail">
              ${icon('edit', '14')} Edit
            </button>
          </div>
        </div>
      `;

      cardsContainer.appendChild(card);
    });

    // Quick adjust events
    cardsContainer.querySelectorAll('.btn-adjust-stok').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const delta = parseInt(btn.dataset.delta);
        const item = await db.inventaris.getById(id);
        if (item) {
          const newStok = Math.max(0, item.stok + delta);
          await db.inventaris.update(id, { stok: newStok });
          Toast.info(`Stok ${item.nama_item}: ${newStok} unit`);
          renderCards();
        }
      });
    });

    // Edit min stock event
    cardsContainer.querySelectorAll('.btn-edit-min').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const item = await db.inventaris.getById(id);
        if (item) openEditModal(item);
      });
    });
  }

  function openEditModal(item) {
    Modal.open({
      title: `Edit Stok: ${item.nama_item}`,
      body: (bodyEl) => {
        bodyEl.innerHTML = `
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Stok Saat Ini</label>
              <input type="number" class="form-input" id="fStokVal" value="${item.stok}" min="0" />
            </div>
            <div class="form-group">
              <label class="form-label">Minimum Stok Threshold</label>
              <input type="number" class="form-input" id="fMinStokVal" value="${item.minimum_stok}" min="0" />
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
            const stok = parseInt(document.getElementById('fStokVal').value) || 0;
            const minStok = parseInt(document.getElementById('fMinStokVal').value) || 5;

            await db.inventaris.update(item.id, { stok: stok, minimum_stok: minStok });
            Toast.success('Stok berhasil diperbarui.');
            Modal.close();
            renderCards();
          },
        }));
      },
    });
  }

  renderCards();
}
