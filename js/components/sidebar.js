// ============================================================
// SIDEBAR — Sirkumboy Dashboard
// Collapsible sidebar navigation with active state.
// ============================================================

const Sidebar = (() => {
  let collapsed = false;

  function render() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    sidebar.innerHTML = `
      <div class="sidebar-brand">
        <div class="sidebar-brand-left">
          <div class="sidebar-brand-logo">S</div>
          <span class="sidebar-brand-text">Sirkumboy</span>
        </div>
        <button class="sidebar-close-mobile" id="sidebarCloseMobile" title="Tutup Menu" aria-label="Tutup Menu">
          ${icon('close', '20')}
        </button>
      </div>
      <nav class="sidebar-nav">
        ${NAV_ITEMS.map(
          (item) => `
          <a href="${item.route}" class="sidebar-link" data-route="${item.route}">
            <span class="sidebar-link-icon">${icon(item.icon, '20')}</span>
            <span class="sidebar-link-label">${item.label}</span>
          </a>
        `
        ).join('')}
      </nav>
      <div class="sidebar-footer">
        <button class="sidebar-toggle" id="sidebarToggle" title="Toggle sidebar">
          ${icon('chevronLeft', '20')}
        </button>
      </div>
    `;

    document.getElementById('sidebarToggle').addEventListener('click', toggle);
    const closeBtn = document.getElementById('sidebarCloseMobile');
    if (closeBtn) closeBtn.addEventListener('click', closeMobile);
    updateActiveLink();
  }

  function updateActiveLink() {
    const currentRoute = location.hash || ROUTES.DASHBOARD;
    document.querySelectorAll('.sidebar-link').forEach((link) => {
      link.classList.toggle('active', link.dataset.route === currentRoute);
    });
  }

  function toggle() {
    collapsed = !collapsed;
    const layout = document.querySelector('.app-layout');
    if (layout) {
      layout.classList.toggle('sidebar-collapsed', collapsed);
    }
  }

  function openMobile() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.add('mobile-open');
    if (overlay) overlay.classList.add('visible');
  }

  function closeMobile() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (overlay) overlay.classList.remove('visible');
  }

  return { render, updateActiveLink, toggle, openMobile, closeMobile };
})();
