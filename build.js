/**
 * KERYX Production Distribution Builder
 * Zero-dependency build script that packages production assets into dist/ for Vercel, Netlify, and Cloud CDN.
 */

const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const distDir = path.join(rootDir, 'dist');

console.log('[KERYX Build] Starting production packaging...');

// 1. Clean or recreate dist/
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// 2. Copy index.html
fs.copyFileSync(path.join(rootDir, 'index.html'), path.join(distDir, 'index.html'));

// 3. Copy src/ tree
fs.cpSync(path.join(rootDir, 'src'), path.join(distDir, 'src'), { recursive: true });

// 4. Copy manifest or icon if present
if (fs.existsSync(path.join(rootDir, 'favicon.ico'))) {
  fs.copyFileSync(path.join(rootDir, 'favicon.ico'), path.join(distDir, 'favicon.ico'));
}

console.log('[KERYX Build] Production build succeeded! Distribution ready in dist/.');
