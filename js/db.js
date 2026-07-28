// ============================================================
// DB — Sirkumboy Dashboard Storage Abstraction Layer
// Currently backed by localStorage. Designed to be swapped
// to Supabase by changing only this file.
// ============================================================

const db = (() => {
  // ── Internal localStorage helpers ──────────────────────────
  function _read(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function _write(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  function _readSingle(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  // ── Generic CRUD factory ───────────────────────────────────
  // Creates a standard { getAll, getById, getByCabang, create, update, delete }
  // interface for any entity stored under a given localStorage key.
  function _createStore(storageKey) {
    return {
      async getAll() {
        return _read(storageKey);
      },

      async getById(id) {
        const items = _read(storageKey);
        return items.find((item) => item.id === id) || null;
      },

      async getByCabang(cabangId) {
        const items = _read(storageKey);
        if (!cabangId || cabangId === CABANG_ALL_ID) return items;
        return items.filter((item) => item.cabang_id === cabangId);
      },

      async query(filterFn) {
        const items = _read(storageKey);
        return items.filter(filterFn);
      },

      async create(data) {
        const items = _read(storageKey);
        const newItem = {
          id: generateId(),
          ...data,
          created_at: new Date().toISOString(),
        };
        items.push(newItem);
        _write(storageKey, items);
        return newItem;
      },

      async createMany(dataArray) {
        const items = _read(storageKey);
        const newItems = dataArray.map((data) => ({
          id: generateId(),
          ...data,
          created_at: new Date().toISOString(),
        }));
        items.push(...newItems);
        _write(storageKey, items);
        return newItems;
      },

      async update(id, data) {
        const items = _read(storageKey);
        const index = items.findIndex((item) => item.id === id);
        if (index === -1) throw new Error(`Item ${id} not found in ${storageKey}`);
        items[index] = { ...items[index], ...data, updated_at: new Date().toISOString() };
        _write(storageKey, items);
        return items[index];
      },

      async delete(id) {
        const items = _read(storageKey);
        const filtered = items.filter((item) => item.id !== id);
        _write(storageKey, filtered);
      },

      async deleteAll() {
        _write(storageKey, []);
      },

      async count(filterFn) {
        const items = _read(storageKey);
        return filterFn ? items.filter(filterFn).length : items.length;
      },

      async sum(field, filterFn) {
        let items = _read(storageKey);
        if (filterFn) items = items.filter(filterFn);
        return items.reduce((acc, item) => acc + (Number(item[field]) || 0), 0);
      },
    };
  }

  // ── Public API ─────────────────────────────────────────────
  return {
    cabang: _createStore(STORAGE_KEYS.CABANG),
    pasien: _createStore(STORAGE_KEYS.PASIEN),
    tindakan: _createStore(STORAGE_KEYS.TINDAKAN),
    jadwal: _createStore(STORAGE_KEYS.JADWAL),
    rekam_medis: _createStore(STORAGE_KEYS.REKAM_MEDIS),
    inventaris: _createStore(STORAGE_KEYS.INVENTARIS),
    reminder_config: _createStore(STORAGE_KEYS.REMINDER_CONFIG),

    // ── Settings ──────────────────────────────────────────────
    getActiveCabang() {
      return localStorage.getItem(STORAGE_KEYS.ACTIVE_CABANG) || CABANG_ALL_ID;
    },

    setActiveCabang(cabangId) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_CABANG, cabangId);
    },

    isSeeded() {
      return localStorage.getItem(STORAGE_KEYS.SEEDED) === 'true';
    },

    markSeeded() {
      localStorage.setItem(STORAGE_KEYS.SEEDED, 'true');
    },

    // ── Reset (dev tool) ──────────────────────────────────────
    async resetAll() {
      Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    },
  };
})();
