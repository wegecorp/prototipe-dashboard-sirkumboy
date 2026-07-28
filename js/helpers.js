// ============================================================
// HELPERS — Sirkumboy Dashboard
// Pure utility functions with zero side effects.
// ============================================================

/**
 * Generate a UUID v4 string.
 * Uses crypto.randomUUID when available, falls back to manual generation.
 */
function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Format a number as Indonesian Rupiah.
 * @param {number} amount
 * @returns {string} e.g. "Rp 1.500.000"
 */
function formatRupiah(amount) {
  if (amount == null || isNaN(amount)) return 'Rp 0';
  return 'Rp ' + Number(amount).toLocaleString('id-ID');
}

/**
 * Format a number with short suffix (K, M).
 * @param {number} num
 * @returns {string} e.g. "1,5jt" or "500rb"
 */
function formatShortRupiah(num) {
  if (num == null || isNaN(num)) return 'Rp 0';
  if (num >= 1_000_000) {
    const val = num / 1_000_000;
    return 'Rp ' + val.toLocaleString('id-ID', { maximumFractionDigits: 1 }) + 'jt';
  }
  if (num >= 1_000) {
    const val = num / 1_000;
    return 'Rp ' + val.toLocaleString('id-ID', { maximumFractionDigits: 0 }) + 'rb';
  }
  return formatRupiah(num);
}

/**
 * Format a Date or ISO string to locale date string.
 * @param {string|Date} date
 * @param {object} opts — Intl.DateTimeFormat options
 * @returns {string} e.g. "28 Jul 2026"
 */
function formatTanggal(date, opts = {}) {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  const defaults = { day: 'numeric', month: 'short', year: 'numeric' };
  return d.toLocaleDateString('id-ID', { ...defaults, ...opts });
}

/**
 * Format a Date or ISO string to locale time string.
 * @param {string|Date} date
 * @returns {string} e.g. "09:30"
 */
function formatJam(date) {
  if (!date) return '-';
  // If it's already a time string like "09:30"
  if (typeof date === 'string' && /^\d{2}:\d{2}/.test(date)) {
    return date.substring(0, 5);
  }
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Get today's date as ISO string (YYYY-MM-DD).
 * @returns {string}
 */
function todayISO() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Add days to a date.
 * @param {string|Date} date
 * @param {number} days
 * @returns {Date}
 */
function addDays(date, days) {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Calculate difference in days between two dates.
 * @param {string|Date} dateA
 * @param {string|Date} dateB
 * @returns {number}
 */
function diffDays(dateA, dateB) {
  const a = typeof dateA === 'string' ? new Date(dateA) : dateA;
  const b = typeof dateB === 'string' ? new Date(dateB) : dateB;
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

/**
 * Check if a date is today.
 * @param {string|Date} date
 * @returns {boolean}
 */
function isToday(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

/**
 * Get first and last day of a month.
 * @param {number} year
 * @param {number} month — 0-indexed
 * @returns {{ start: Date, end: Date }}
 */
function getMonthRange(year, month) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return { start, end };
}

/**
 * Safely create a DOM element with attributes and children.
 * @param {string} tag
 * @param {object} attrs — { className, id, textContent, innerHTML, dataset, style, on*, ... }
 * @param {Array<HTMLElement|string>} children
 * @returns {HTMLElement}
 */
function el(tag, attrs = {}, children = []) {
  const element = document.createElement(tag);

  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'textContent') {
      element.textContent = value;
    } else if (key === 'innerHTML') {
      element.innerHTML = value;
    } else if (key === 'dataset') {
      for (const [dk, dv] of Object.entries(value)) {
        element.dataset[dk] = dv;
      }
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      const event = key.slice(2).toLowerCase();
      element.addEventListener(event, value);
    } else {
      element.setAttribute(key, value);
    }
  }

  for (const child of children) {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof HTMLElement) {
      element.appendChild(child);
    }
  }

  return element;
}

/**
 * Clear all children of an element.
 * @param {HTMLElement} element
 */
function clearChildren(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

/**
 * Debounce a function.
 * @param {Function} fn
 * @param {number} ms
 * @returns {Function}
 */
function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/**
 * Animate a number counting up from 0 to target.
 * @param {HTMLElement} element — element whose textContent will be updated
 * @param {number} target — final number
 * @param {Function} formatter — optional formatting function
 * @param {number} duration — animation duration in ms
 */
function animateCount(element, target, formatter = (n) => n.toString(), duration = 800) {
  const start = performance.now();
  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    // Ease-out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(target * eased);
    element.textContent = formatter(current);
    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };
  requestAnimationFrame(step);
}

/**
 * Get a random item from an array.
 * @param {Array} arr
 * @returns {*}
 */
function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Get a random integer between min and max (inclusive).
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
