/**
 * KERYX App Store
 * Manages active church, campuses, user session, view routing, and system health.
 */

import { eventBus } from '../core/eventBus.js';

const APP_STATE_KEY = 'keryx.app.state.v2';

const initialChurch = {
  id: 'church_default',
  name: 'Grace City Community Church',
  email: 'media@gracecity.org',
  phone: '+234 800 123 4567',
  country: 'Nigeria',
  city: 'Lagos',
  address: '12 Faith Avenue, Victoria Island',
  website: 'https://gracecity.org',
  pastor: 'Godswill Johnson',
  language: 'English',
  timezone: 'West Africa Time (WAT)',
  currency: 'NGN (₦)',
  bibleTranslation: 'World English Bible (WEB)',
  branding: {
    primaryColor: '#df654e',
    secondaryColor: '#172226',
    accentColor: '#3d8a6b',
    font: 'Manrope',
    watermark: 'GRACE CITY CHURCH'
  },
  campuses: [
    { id: 'campus_main', name: 'Main Campus (Central)', address: 'Victoria Island, Lagos' },
    { id: 'campus_lekki', name: 'Lekki Campus', address: 'Admiralty Way, Lekki' }
  ]
};

const initialUser = {
  id: 'user_admin',
  name: 'Godswill Johnson',
  email: 'pastor@gracecity.org',
  role: 'role_owner',
  title: 'Senior Pastor & System Overseer'
};

const initialHealth = {
  audio: { label: 'Audio In', status: 'Ready', ok: true },
  displays: { label: 'Displays', status: '4 Active', ok: true },
  bible: { label: 'Bible DB', status: 'Indexed (Offline)', ok: true },
  media: { label: 'Media Library', status: 'Ready', ok: true },
  ai: { label: 'AI Speech Engine', status: 'Standby', ok: true },
  streaming: { label: 'Livestream NDI', status: 'Ready', ok: true },
  storage: { label: 'Local Storage', status: 'Optimal', ok: true },
  backup: { label: 'Backup Engine', status: 'Synced', ok: true }
};

class AppStore {
  constructor() {
    this.church = initialChurch;
    this.currentUser = initialUser;
    this.activeView = 'Dashboard';
    this.systemHealth = initialHealth;
    this.offlineMode = true;
    this.listeners = new Set();
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const saved = localStorage.getItem(APP_STATE_KEY) || localStorage.getItem('keryx.app.state.v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.church) this.church = parsed.church;
        if (parsed.currentUser) this.currentUser = parsed.currentUser;
      }
      // Check if URL specifies a view via hash, e.g. #Studio
      const hash = typeof window !== 'undefined' && window.location.hash ? window.location.hash.replace('#', '').trim() : '';
      if (hash) {
        this.activeView = hash;
      } else {
        this.activeView = 'Dashboard';
      }
    } catch (e) {
      console.warn('[KERYX AppStore] Failed to parse saved app state:', e);
      this.activeView = 'Dashboard';
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem(
        APP_STATE_KEY,
        JSON.stringify({
          church: this.church,
          currentUser: this.currentUser,
          activeView: this.activeView
        })
      );
    } catch (e) {
      console.warn('[KERYX AppStore] Failed to save app state:', e);
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.saveToStorage();
    this.listeners.forEach((listener) => listener(this.getState()));
    eventBus.emit('app:changed', this.getState());
  }

  getState() {
    return {
      church: this.church,
      currentUser: this.currentUser,
      activeView: this.activeView,
      systemHealth: this.systemHealth,
      offlineMode: this.offlineMode
    };
  }

  setChurch(churchData) {
    this.church = { ...this.church, ...churchData };
    this.notify();
    eventBus.emit('toast:notify', {
      type: 'success',
      title: 'Church Updated',
      message: `${this.church.name} profile saved.`
    });
  }

  setCurrentUser(user) {
    this.currentUser = user;
    this.notify();
    eventBus.emit('toast:notify', {
      type: 'info',
      title: 'Operator Switched',
      message: `Logged in as ${user.name} (${user.role})`
    });
  }

  setActiveView(view) {
    if (!view) return;
    const clean = view.toLowerCase().replace(/[-_/]/g, '');
    const map = {
      'dashboard': 'Dashboard',
      'studio': 'Studio',
      'service': 'Service',
      'present': 'Present',
      'bible': 'Bible',
      'bibleshow': 'Bible',
      'customscripture': 'CustomScripture',
      'scriptures': 'CustomScripture',
      'songs': 'Songs',
      'media': 'Media',
      'sermons': 'Sermons',
      'ai': 'AI Center',
      'aicenter': 'AI Center',
      'stream': 'Stream',
      'outputs': 'Outputs',
      'remote': 'Remote',
      'analytics': 'Analytics',
      'marketplace': 'Marketplace',
      'church': 'Church',
      'settings': 'Settings'
    };
    const target = map[clean] || view;
    this.activeView = target;
    try {
      if (typeof window !== 'undefined' && window.location) {
        if (target === 'Dashboard') {
          if (window.location.hash) {
            history.replaceState(null, '', window.location.pathname + window.location.search);
          }
        } else {
          const hashVal = '#' + target.toLowerCase().replace(/\s+/g, '-');
          if (window.location.hash !== hashVal) {
            history.replaceState(null, '', hashVal);
          }
        }
      }
    } catch (e) {}
    this.notify();
    eventBus.emit('view:navigate', target);
  }

  setView(view) {
    if (!view) return;
    const views = ['Dashboard', 'Studio', 'Service', 'Present', 'Bible', 'CustomScripture', 'Songs', 'Media', 'Sermons', 'AI Center', 'Stream', 'Outputs', 'Remote', 'Settings'];
    const matched = views.find((v) => v.toLowerCase() === String(view).trim().toLowerCase());
    const normalized = matched || (view.charAt(0).toUpperCase() + view.slice(1));
    this.setActiveView(normalized);
  }

  toggleOfflineMode() {
    this.offlineMode = !this.offlineMode;
    this.notify();
  }

  updateSystemHealth(key, status, ok = true) {
    if (this.systemHealth[key]) {
      this.systemHealth[key].status = status;
      this.systemHealth[key].ok = ok;
      this.notify();
    }
  }
}

export const appStore = new AppStore();

