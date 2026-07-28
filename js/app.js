// ============================================================
// APP — Sirkumboy Dashboard
// SPA router, global state, initialization.
// ============================================================

const App = (() => {
  const pages = {
    '#/dashboard': { mount: PageDashboard, label: 'Dashboard' },
    '#/pasien': { mount: PagePasien, label: 'Pasien & Rekam Medis' },
    '#/jadwal': { mount: PageJadwal, label: 'Jadwal Sunat' },
    '#/keuangan': { mount: PageKeuangan, label: 'Keuangan' },
    '#/inventaris': { mount: PageInventaris, label: 'Inventaris' },
    '#/cabang': { mount: PageCabang, label: 'Cabang' },
    '#/auto-wa': { mount: PageAutoWA, label: 'Auto-WA Monitoring' },
  };

  let currentPage = null;

  function navigate() {
    const hash = location.hash || '#/dashboard';
    if (!location.hash) {
      location.hash = '#/dashboard';
      return;
    }

    const page = pages[hash];
    if (!page) {
      location.hash = '#/dashboard';
      return;
    }

    currentPage = hash;
    Sidebar.updateActiveLink();
    Header.setBreadcrumb(page.label);
    Sidebar.closeMobile();

    const main = document.getElementById('mainContent');
    if (main) {
      main.innerHTML = '';
      main.className = 'main-content page-enter';
      page.mount(main);
    }
  }

  function refreshPage() {
    const main = document.getElementById('mainContent');
    if (!main || !currentPage) return;
    const page = pages[currentPage];
    if (page) {
      main.innerHTML = '';
      page.mount(main);
    }
  }

  async function init() {
    await SeedData.seed();
    Sidebar.render();
    Header.render();
    window.addEventListener('hashchange', navigate);
    navigate();
  }

  return { init, navigate, refreshPage };
})();

document.addEventListener('DOMContentLoaded', App.init);
