/**
 * KERYX Database Adapter
 * Offline-first transactional storage layer utilizing IndexedDB with structured localStorage caching.
 */

import { TABLE_NAMES, SCHEMA_VERSION, DEFAULT_ROLES } from './schema.js';
import {
  SEED_BIBLES,
  SEED_VERSES,
  SEED_SONGS,
  SEED_CUSTOM_SCRIPTURES,
  SEED_SERVICE_ITEMS,
  SEED_OUTPUT_SCREENS,
  SEED_PRESENTATION
} from './seedData.js';

const DB_NAME = 'keryx_church_os_db';
const FALLBACK_KEY_PREFIX = 'keryx.store.';

class DatabaseAdapter {
  constructor() {
    this.db = null;
    this.isIndexedDBAvailable = typeof indexedDB !== 'undefined';
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return this;

    if (!this.isIndexedDBAvailable) {
      console.warn('[KERYX DB] IndexedDB unavailable, falling back to LocalStorage repository engine.');
      this._seedLocalStorageIfEmpty();
      this.initialized = true;
      return this;
    }

    try {
      this.db = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('IndexedDB open timed out after 1500ms; falling back to LocalStorage'));
        }, 1500);

        const request = indexedDB.open(DB_NAME, SCHEMA_VERSION);

        request.onblocked = () => {
          clearTimeout(timeout);
          console.warn('[KERYX DB] IndexedDB open blocked by another connection.');
          reject(new Error('IndexedDB blocked by another open tab'));
        };

        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          Object.values(TABLE_NAMES).forEach((tableName) => {
            if (!db.objectStoreNames.contains(tableName)) {
              db.createObjectStore(tableName, { keyPath: 'id' });
            }
          });
        };

        request.onsuccess = () => {
          clearTimeout(timeout);
          resolve(request.result);
        };
        request.onerror = () => {
          clearTimeout(timeout);
          reject(request.error);
        };
      });

      await this._seedIndexedDBIfEmpty();
      this.initialized = true;
      return this;
    } catch (err) {
      console.warn('[KERYX DB] Failed to initialize IndexedDB, falling back to LocalStorage:', err);
      this._seedLocalStorageIfEmpty();
      this.initialized = true;
      return this;
    }
  }

  async _seedIndexedDBIfEmpty() {
    try {
      const verses = await this.getAll(TABLE_NAMES.BIBLE_VERSES);
      if (verses.length === 0) {
        console.log('[KERYX DB] Seeding initial database assets (Bibles, Songs, Outputs, Services)...');
        const tx = this.db.transaction(Object.values(TABLE_NAMES), 'readwrite');
        for (const bible of SEED_BIBLES) tx.objectStore(TABLE_NAMES.BIBLE_TRANSLATIONS).put(bible);
        for (const verse of SEED_VERSES) tx.objectStore(TABLE_NAMES.BIBLE_VERSES).put(verse);
        for (const song of SEED_SONGS) tx.objectStore(TABLE_NAMES.SONGS).put(song);
        for (const scrip of SEED_CUSTOM_SCRIPTURES) tx.objectStore(TABLE_NAMES.CUSTOM_SCRIPTURES).put(scrip);
        for (const item of SEED_SERVICE_ITEMS) tx.objectStore(TABLE_NAMES.SERVICE_ITEMS).put(item);
        for (const out of SEED_OUTPUT_SCREENS) tx.objectStore(TABLE_NAMES.OUTPUT_SCREENS).put(out);
        for (const role of DEFAULT_ROLES) tx.objectStore(TABLE_NAMES.ROLES).put(role);
        tx.objectStore(TABLE_NAMES.PRESENTATIONS).put(SEED_PRESENTATION);

        await new Promise((resolve) => {
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        });
        this._seedLocalStorageIfEmpty();
      }
    } catch (e) {
      console.warn('[KERYX DB] Error during batch seeding:', e);
      this._seedLocalStorageIfEmpty();
    }
  }

  _seedLocalStorageIfEmpty() {
    const key = FALLBACK_KEY_PREFIX + TABLE_NAMES.BIBLE_VERSES;
    if (!localStorage.getItem(key)) {
      localStorage.setItem(FALLBACK_KEY_PREFIX + TABLE_NAMES.BIBLE_TRANSLATIONS, JSON.stringify(SEED_BIBLES));
      localStorage.setItem(FALLBACK_KEY_PREFIX + TABLE_NAMES.BIBLE_VERSES, JSON.stringify(SEED_VERSES));
      localStorage.setItem(FALLBACK_KEY_PREFIX + TABLE_NAMES.SONGS, JSON.stringify(SEED_SONGS));
      localStorage.setItem(FALLBACK_KEY_PREFIX + TABLE_NAMES.CUSTOM_SCRIPTURES, JSON.stringify(SEED_CUSTOM_SCRIPTURES));
      localStorage.setItem(FALLBACK_KEY_PREFIX + TABLE_NAMES.SERVICE_ITEMS, JSON.stringify(SEED_SERVICE_ITEMS));
      localStorage.setItem(FALLBACK_KEY_PREFIX + TABLE_NAMES.OUTPUT_SCREENS, JSON.stringify(SEED_OUTPUT_SCREENS));
      localStorage.setItem(FALLBACK_KEY_PREFIX + TABLE_NAMES.ROLES, JSON.stringify(DEFAULT_ROLES));
      localStorage.setItem(FALLBACK_KEY_PREFIX + TABLE_NAMES.PRESENTATIONS, JSON.stringify([SEED_PRESENTATION]));
    }
  }

  async getAll(tableName) {
    if (!this.db) {
      const raw = localStorage.getItem(FALLBACK_KEY_PREFIX + tableName);
      return raw ? JSON.parse(raw) : [];
    }

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db.transaction(tableName, 'readonly');
        const store = tx.objectStore(tableName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      } catch (e) {
        // Fallback
        const raw = localStorage.getItem(FALLBACK_KEY_PREFIX + tableName);
        resolve(raw ? JSON.parse(raw) : []);
      }
    });
  }

  async getById(tableName, id) {
    if (!this.db) {
      const items = await this.getAll(tableName);
      return items.find((item) => item.id === id) || null;
    }

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db.transaction(tableName, 'readonly');
        const store = tx.objectStore(tableName);
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      } catch (e) {
        resolve(null);
      }
    });
  }

  async set(tableName, item) {
    if (!item.id) {
      item.id = 'keryx_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    // Always update localStorage as immediate synchronous cache
    try {
      const items = await this.getAll(tableName);
      const index = items.findIndex((i) => i.id === item.id);
      if (index >= 0) {
        items[index] = item;
      } else {
        items.push(item);
      }
      localStorage.setItem(FALLBACK_KEY_PREFIX + tableName, JSON.stringify(items));
    } catch (err) {
      console.warn('[KERYX DB Cache Warn]', err);
    }

    if (!this.db) return item;

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db.transaction(tableName, 'readwrite');
        const store = tx.objectStore(tableName);
        const request = store.put(item);
        request.onsuccess = () => resolve(item);
        request.onerror = () => reject(request.error);
      } catch (e) {
        resolve(item);
      }
    });
  }

  async update(tableName, id, patch) {
    const item = await this.getById(tableName, id);
    if (!item) throw new Error(`Item ${id} not found in ${tableName}`);
    const updated = { ...item, ...patch, updatedAt: new Date().toISOString() };
    return this.set(tableName, updated);
  }

  async delete(tableName, id) {
    try {
      const items = await this.getAll(tableName);
      const filtered = items.filter((i) => i.id !== id);
      localStorage.setItem(FALLBACK_KEY_PREFIX + tableName, JSON.stringify(filtered));
    } catch (err) {
      console.warn('[KERYX DB Delete Cache Warn]', err);
    }

    if (!this.db) return true;

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db.transaction(tableName, 'readwrite');
        const store = tx.objectStore(tableName);
        const request = store.delete(id);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      } catch (e) {
        resolve(true);
      }
    });
  }

  async query(tableName, predicate) {
    const all = await this.getAll(tableName);
    return all.filter(predicate);
  }

  async exportBackup() {
    const backup = {
      version: SCHEMA_VERSION,
      timestamp: new Date().toISOString(),
      tables: {}
    };

    for (const tableName of Object.values(TABLE_NAMES)) {
      backup.tables[tableName] = await this.getAll(tableName);
    }

    return JSON.stringify(backup, null, 2);
  }

  async importBackup(jsonString) {
    const parsed = JSON.parse(jsonString);
    if (!parsed.tables) throw new Error('Invalid KERYX backup file format');

    for (const [tableName, rows] of Object.entries(parsed.tables)) {
      if (Object.values(TABLE_NAMES).includes(tableName)) {
        for (const row of rows) {
          await this.set(tableName, row);
        }
      }
    }
    return true;
  }
}

export const db = new DatabaseAdapter();

