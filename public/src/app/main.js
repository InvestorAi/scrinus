/**
 * KERYX Main Bootstrapper
 * Initializes offline database engine, seeds initial church assets, and launches AppRouter.
 */

import { db } from '../database/db.js';
import { AppRouter } from './router.js';
import { toastManager } from '../components/toast.js';
import { SafeBoundary } from '../core/errors.js';

async function bootstrap() {
  console.log('[KERYX] Bootstrapping Church Presentation & Ministry OS...');

  // 1. Initialize main application router IMMEDIATELY so the entire workspace renders
  try {
    AppRouter.init();
    console.log('[KERYX Router] Shell and navigation mounted.');
  } catch (err) {
    console.error('[KERYX Router Error]:', err);
  }

  // 2. Initialize offline-first relational database and seed foundational assets in background
  try {
    await db.init();
    console.log('[KERYX DB] Relational storage ready (Bibles, Songs, Outputs, Services).');
  } catch (err) {
    console.warn('[KERYX DB] Storage initialized with warnings:', err);
  }

  console.log('[KERYX] System operational. Control room online.');
}

const init = () => {
  SafeBoundary.runSafeAsync('System Bootstrap', bootstrap);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

