// ============================================================
// MODAL — Sirkumboy Dashboard
// Reusable modal system with open/close transitions.
// ============================================================

const Modal = (() => {
  function open({ title, body, footer, size = '' }) {
    // Synchronously remove any existing backdrop to prevent ID conflicts
    _removeExistingBackdropsSync();

    const backdrop = el('div', { className: 'modal-backdrop', id: 'modalBackdrop' });
    const modalEl = el('div', { className: `modal ${size}`, onClick: (e) => e.stopPropagation() });

    // Header
    const headerEl = el('div', { className: 'modal-header' }, [
      el('h3', { className: 'modal-title', textContent: title }),
      el('button', {
        className: 'modal-close',
        innerHTML: Icons.close,
        onClick: close,
      }),
    ]);
    modalEl.appendChild(headerEl);

    // Body
    const bodyEl = el('div', { className: 'modal-body', id: 'modalBody' });
    if (typeof body === 'string') {
      bodyEl.innerHTML = body;
    } else if (body instanceof HTMLElement) {
      bodyEl.appendChild(body);
    } else if (typeof body === 'function') {
      body(bodyEl);
    }
    modalEl.appendChild(bodyEl);

    // Footer
    if (footer) {
      const footerEl = el('div', { className: 'modal-footer', id: 'modalFooter' });
      if (typeof footer === 'string') {
        footerEl.innerHTML = footer;
      } else if (footer instanceof HTMLElement) {
        footerEl.appendChild(footer);
      } else if (typeof footer === 'function') {
        footer(footerEl);
      }
      modalEl.appendChild(footerEl);
    }

    backdrop.appendChild(modalEl);

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) close();
    });

    document.body.appendChild(backdrop);

    // Trigger animation
    requestAnimationFrame(() => {
      backdrop.classList.add('open');
    });

    document.addEventListener('keydown', handleEscape);
  }

  function _removeExistingBackdropsSync() {
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach((b) => b.remove());
  }

  function close() {
    const backdrop = document.getElementById('modalBackdrop');
    if (!backdrop) return;

    backdrop.classList.remove('open');
    setTimeout(() => {
      backdrop.remove();
    }, 200);

    document.removeEventListener('keydown', handleEscape);
  }

  function handleEscape(e) {
    if (e.key === 'Escape') close();
  }

  function confirm(message, onConfirm, confirmLabel = 'Hapus') {
    open({
      title: 'Konfirmasi',
      body: el('p', { textContent: message, style: { maxWidth: 'none' } }),
      footer: (footerEl) => {
        footerEl.appendChild(
          el('button', { className: 'btn btn-secondary', textContent: 'Batal', onClick: close })
        );
        footerEl.appendChild(
          el('button', {
            className: 'btn btn-danger',
            textContent: confirmLabel,
            onClick: () => {
              close();
              onConfirm();
            },
          })
        );
      },
    });
  }

  return { open, close, confirm };
})();
