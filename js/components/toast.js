// ============================================================
// TOAST — Sirkumboy Dashboard
// Toast notification system with auto-dismiss.
// ============================================================

const Toast = (() => {
  function _ensureContainer() {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = el('div', { className: 'toast-container', id: 'toastContainer' });
      document.body.appendChild(container);
    }
    return container;
  }

  function show(message, type = 'info', duration = 3000) {
    const container = _ensureContainer();

    const iconMap = {
      success: Icons.check,
      error: Icons.alertCircle,
      info: Icons.alertCircle,
      warning: Icons.alertCircle,
    };

    const toast = el('div', { className: `toast toast-${type}` }, [
      el('span', { innerHTML: iconMap[type] || iconMap.info, style: { display: 'flex', flexShrink: '0' } }),
      el('span', { textContent: message }),
    ]);

    container.appendChild(toast);

    // Auto-dismiss
    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  function success(message) { show(message, 'success'); }
  function error(message) { show(message, 'error'); }
  function info(message) { show(message, 'info'); }
  function warning(message) { show(message, 'warning'); }

  return { show, success, error, info, warning };
})();
