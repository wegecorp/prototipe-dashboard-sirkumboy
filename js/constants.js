// ============================================================
// CONSTANTS — Sirkumboy Dashboard
// Business domain constants, reusable across all modules.
// ============================================================

const CABANG = {
  WATES: { id: 'cab-wates-001', nama: 'Sirkumboy Wates', alamat: 'Jl. Jambu I, Wonosidi Lor, Wates, Kec. Wates, Kab. Kulon Progo, DIY 55611' },
  SEMARANG: { id: 'cab-semarang-001', nama: 'Sirkumboy Semarang', alamat: 'Jl. Pandanaran No. 42, Mugassari, Kec. Semarang Selatan, Kota Semarang, Jawa Tengah 50249' },
  BANTUL: { id: 'cab-bantul-001', nama: 'Sirkumboy Bantul', alamat: 'Jl. Parangtritis Km 7, Sewon, Kec. Sewon, Kab. Bantul, DIY 55188' },
};

const CABANG_LIST = Object.values(CABANG);
const CABANG_ALL_ID = 'all';

const METODE_SUNAT = {
  A: { id: 'A', nama: 'Metode A', harga: 500000 },
  B: { id: 'B', nama: 'Metode B', harga: 1000000 },
  C: { id: 'C', nama: 'Metode C', harga: 3000000 },
};

const METODE_LIST = Object.values(METODE_SUNAT);

const STATUS_PASIEN = {
  TERDAFTAR: 'terdaftar',
  DIJADWALKAN: 'dijadwalkan',
  SELESAI_TINDAKAN: 'selesai_tindakan',
  KONTROL: 'kontrol',
  SEMBUH: 'sembuh',
};

const STATUS_PASIEN_FLOW = [
  STATUS_PASIEN.TERDAFTAR,
  STATUS_PASIEN.DIJADWALKAN,
  STATUS_PASIEN.SELESAI_TINDAKAN,
  STATUS_PASIEN.KONTROL,
  STATUS_PASIEN.SEMBUH,
];

const STATUS_PASIEN_LABELS = {
  [STATUS_PASIEN.TERDAFTAR]: 'Terdaftar',
  [STATUS_PASIEN.DIJADWALKAN]: 'Dijadwalkan',
  [STATUS_PASIEN.SELESAI_TINDAKAN]: 'Selesai Sunat',
  [STATUS_PASIEN.KONTROL]: 'Masa Kontrol',
  [STATUS_PASIEN.SEMBUH]: 'Sembuh Total',
};

const STATUS_PASIEN_COLORS = {
  [STATUS_PASIEN.TERDAFTAR]: 'var(--color-text-secondary)',
  [STATUS_PASIEN.DIJADWALKAN]: 'var(--color-primary)',
  [STATUS_PASIEN.SELESAI_TINDAKAN]: 'var(--color-success)',
  [STATUS_PASIEN.KONTROL]: 'var(--color-warning)',
  [STATUS_PASIEN.SEMBUH]: 'var(--color-success-dark)',
};

const STATUS_JADWAL = {
  DIJADWALKAN: 'dijadwalkan',
  SELESAI: 'selesai',
  BATAL: 'batal',
};

const STATUS_JADWAL_LABELS = {
  [STATUS_JADWAL.DIJADWALKAN]: 'Dijadwalkan',
  [STATUS_JADWAL.SELESAI]: 'Selesai',
  [STATUS_JADWAL.BATAL]: 'Batal',
};

const STORAGE_KEYS = {
  CABANG: 'sirkumboy_cabang',
  PASIEN: 'sirkumboy_pasien',
  TINDAKAN: 'sirkumboy_tindakan',
  JADWAL: 'sirkumboy_jadwal',
  REKAM_MEDIS: 'sirkumboy_rekam_medis',
  INVENTARIS: 'sirkumboy_inventaris',
  REMINDER_CONFIG: 'sirkumboy_reminder_config',
  SEEDED: 'sirkumboy_seeded_v2', // v2 to force re-seed
  ACTIVE_CABANG: 'sirkumboy_active_cabang',
};

const ROUTES = {
  DASHBOARD: '#/dashboard',
  PASIEN: '#/pasien',
  JADWAL: '#/jadwal',
  KEUANGAN: '#/keuangan',
  INVENTARIS: '#/inventaris',
  CABANG: '#/cabang',
  AUTO_WA: '#/auto-wa',
};

const NAV_ITEMS = [
  { route: ROUTES.DASHBOARD, label: 'Dashboard', icon: 'dashboard' },
  { route: ROUTES.PASIEN, label: 'Pasien & Rekam Medis', icon: 'pasien' },
  { route: ROUTES.JADWAL, label: 'Jadwal Sunat', icon: 'jadwal' },
  { route: ROUTES.KEUANGAN, label: 'Keuangan', icon: 'keuangan' },
  { route: ROUTES.INVENTARIS, label: 'Inventaris', icon: 'inventaris' },
  { route: ROUTES.CABANG, label: 'Cabang', icon: 'cabang' },
  { route: ROUTES.AUTO_WA, label: 'Auto-WA Monitoring', icon: 'auto-wa' },
];

const DEFAULT_REMINDER_TEMPLATE = `Assalamu'alaikum, Bunda/Ayah {nama_ortu}.\n\nIni pengingat untuk kontrol sunat {nama_anak} di Sirkumboy {nama_cabang}.\nSudah hari ke-{hari_ke} setelah tindakan sunat.\n\nBagaimana kondisi pemulihannya hari ini? Mohon infokan ya.\n\nTerima kasih.\n- Tim Asisten Sirkumboy`;
