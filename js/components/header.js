// ============================================================
// HEADER — Sirkumboy Dashboard
// Header bar with breadcrumb + branch switcher + date.
// ============================================================

const Header = (() => {
  let dropdownOpen = false;

  function render() {
    const header = document.getElementById('header');
    if (!header) return;

    const activeCabangId = db.getActiveCabang();
    const activeCabang = CABANG_LIST.find((c) => c.id === activeCabangId);
    const label = activeCabang ? activeCabang.nama.replace('Sirkumboy ', '') : 'Semua Cabang';

    header.innerHTML = `
      <div class="header-left">
        <button class="header-menu-btn" id="headerMenuBtn" title="Buka Menu Sidebar" aria-label="Buka Menu Sidebar">
          ${icon('menu', '24')}
        </button>
        <span class="header-breadcrumb" id="headerBreadcrumb"></span>
      </div>
      <div class="header-right">
        <span class="header-date hide-mobile">${formatTanggal(new Date(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
        <div class="branch-switcher">
          <button class="branch-switcher-btn" id="branchSwitcherBtn">
            <span class="branch-option-dot"></span>
            <span>${label}</span>
            ${Icons.chevronDown}
          </button>
          <div class="branch-dropdown" id="branchDropdown">
            <button class="branch-option ${activeCabangId === CABANG_ALL_ID ? 'active' : ''}" data-cabang="${CABANG_ALL_ID}">
              Semua Cabang
            </button>
            ${CABANG_LIST.map(
              (c) => `
              <button class="branch-option ${c.id === activeCabangId ? 'active' : ''}" data-cabang="${c.id}">
                <span class="branch-option-dot"></span>
                ${c.nama.replace('Sirkumboy ', '')}
              </button>
            `
            ).join('')}
          </div>
        </div>
      </div>
    `;

    // Attach events
    document.getElementById('branchSwitcherBtn').addEventListener('click', toggleDropdown);
    document.getElementById('headerMenuBtn').addEventListener('click', () => Sidebar.openMobile());

    document.querySelectorAll('.branch-option').forEach((opt) => {
      opt.addEventListener('click', () => {
        const cabangId = opt.dataset.cabang;
        db.setActiveCabang(cabangId);
        dropdownOpen = false;
        render();
        // Re-render current page with new branch context
        if (typeof App !== 'undefined') App.refreshPage();
      });
    });

    // Close dropdown on outside click
    document.addEventListener('click', handleOutsideClick);
  }

  function toggleDropdown(e) {
    e.stopPropagation();
    dropdownOpen = !dropdownOpen;
    const btn = document.getElementById('branchSwitcherBtn');
    const dropdown = document.getElementById('branchDropdown');
    if (btn) btn.classList.toggle('open', dropdownOpen);
    if (dropdown) dropdown.classList.toggle('open', dropdownOpen);
  }

  function handleOutsideClick(e) {
    if (!e.target.closest('.branch-switcher') && dropdownOpen) {
      dropdownOpen = false;
      const btn = document.getElementById('branchSwitcherBtn');
      const dropdown = document.getElementById('branchDropdown');
      if (btn) btn.classList.remove('open');
      if (dropdown) dropdown.classList.remove('open');
    }
  }

  function setBreadcrumb(text) {
    const el = document.getElementById('headerBreadcrumb');
    if (el) el.textContent = text;
  }

  return { render, setBreadcrumb };
})();
